"""API guarantees that matter when several photos or browser tabs are open.

Only inference is replaced. HTTP validation, SQLite transactions, image
composition, filesystem isolation, and process reinitialization remain real.
"""

import hashlib
import io
import json
import struct
import sys
import time
import zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.app import create_app
from backend.processing import ProcessingError


class ControlledEngine:
    def __init__(self, *, ready=True, fail=False):
        self.ready = ready
        self.fail = fail

    def status(self):
        return {"ready": self.ready, "model": "test", "message": "测试本地引擎"}

    def remove(self, image):
        if self.fail:
            raise ProcessingError("测试推理失败，可重新生成")
        result = image.convert("RGBA")
        alpha = Image.new("L", image.size)
        ImageDraw.Draw(alpha).ellipse((2, 2, image.width - 3, image.height - 3), fill=255)
        result.putalpha(alpha)
        return result


def png_bytes():
    output = io.BytesIO()
    Image.new("RGB", (80, 100), "#a76d45").save(output, "PNG")
    return output.getvalue()


@pytest.fixture
def source_project(tmp_path):
    root = tmp_path / "project"
    base = root / "data" / "pet-materials"
    (base / "originals").mkdir(parents=True)
    review = base / "review"
    (review / "assisted-v1").mkdir(parents=True)
    (base / "originals" / "shared.png").write_bytes(png_bytes())
    records = []
    for record_id, attachment_id, owner in (("record-a", "photo-a", "Alice"), ("record-b", "photo-b", "Bob")):
        records.append({"source_record_id": record_id, "pet_name_raw": "Lucky", "owners": [{"name": owner}],
                        "attachments": [{"attachment_id": attachment_id, "local_path": "originals/shared.png", "download_status": "downloaded"}]})
    (base / "manifest.json").write_text(json.dumps({"records": records}))
    rows = [
        {"region_id": "left", "attachment_id": "photo-a", "source_record_id": "record-a", "name": "Lucky", "bbox_proposal": [0, 0, .5, 1]},
        {"region_id": "right", "attachment_id": "photo-a", "source_record_id": "record-a", "name": "Lucky", "bbox_proposal": [.5, 0, .5, 1]},
        {"region_id": "other-owner", "attachment_id": "photo-b", "source_record_id": "record-b", "name": "Lucky"},
    ]
    (review / "assisted-v1" / "assistant-reviewed-model.json").write_text(json.dumps({"records": rows}))
    (review / "review-model.json").write_text(json.dumps({"regions": []}))
    (review / "user-confirmations.jsonl").write_text(json.dumps({"region_id": "right", "name": "JoJo", "owner": "Alice", "status": "user_confirmed_identity"}) + "\n")
    # Sentinel workbooks must survive startup and all edits byte for byte.
    (review / "moego-pet-review.xlsx").write_bytes(b"existing user workbook\x00do not rewrite")
    return root


def source_hashes(project):
    base = project / "data" / "pet-materials"
    return {str(path.relative_to(base)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in base.rglob("*") if path.is_file()}


def wait_for_job(client, job_id):
    deadline = time.monotonic() + 12
    while time.monotonic() < deadline:
        response = client.get(f"/api/jobs/{job_id}")
        assert response.status_code == 200
        job = response.json()
        if job["status"] in ("completed", "failed"):
            return job
        time.sleep(.02)
    pytest.fail("Local worker did not finish within 12 seconds")


def test_shared_photo_regions_and_same_names_remain_independent_across_restart(source_project, tmp_path):
    before = source_hashes(source_project)
    data = tmp_path / "studio"
    with TestClient(create_app(source_project, data, ControlledEngine())) as client:
        items = {asset["id"]: asset for asset in client.get("/api/assets").json()["items"]}
        assert set(items) == {"left", "right", "other-owner"}
        assert items["left"]["name"] == items["other-owner"]["name"] == "Lucky"
        assert items["left"]["owner"] != items["other-owner"]["owner"]
        assert items["right"]["name"] == "JoJo"
        assert items["left"]["settings"]["crop"] != items["right"]["settings"]["crop"]
        changed = {**items["left"]["settings"], "style": "natural", "shadow": False}
        response = client.put("/api/assets/left/settings", json={"expected_revision": 1, "settings": changed})
        assert response.status_code == 200
        assert client.get("/api/assets/right").json()["settings"] == items["right"]["settings"]
        assert client.get("/api/assets/other-owner").json()["revision"] == 1
        assert client.post("/api/selection", json={"asset_id": "right"}).status_code == 200
    with TestClient(create_app(source_project, data, ControlledEngine())) as client:
        assert client.get("/api/assets").json()["selected_id"] == "right"
        assert client.get("/api/assets/left").json()["settings"] == changed
        assert client.get("/api/assets/left").json()["revision"] == 2
        assert client.get("/api/assets/right").json()["revision"] == 1
    assert source_hashes(source_project) == before


def test_concurrent_browser_tabs_cannot_silently_overwrite_settings(source_project, tmp_path):
    with TestClient(create_app(source_project, tmp_path / "studio", ControlledEngine())) as client:
        initial = client.get("/api/assets/left").json()
        variants = [{**initial["settings"], "subject_scale": scale} for scale in (.56, .61, .67, .72, .86)]

        def save(settings):
            return client.put("/api/assets/left/settings", json={"expected_revision": 1, "settings": settings})

        with ThreadPoolExecutor(max_workers=len(variants)) as executor:
            responses = list(executor.map(save, variants))
        assert sorted(response.status_code for response in responses) == [200, 409, 409, 409, 409]
        winner = next(response.json() for response in responses if response.status_code == 200)
        current = client.get("/api/assets/left").json()
        assert current["revision"] == 2
        assert current["settings"] == winner["settings"]


def test_unavailable_model_does_not_create_a_misleading_pending_job(source_project, tmp_path):
    with TestClient(create_app(source_project, tmp_path / "studio", ControlledEngine(ready=False))) as client:
        assert client.get("/api/health").json()["engine"]["ready"] is False
        response = client.post("/api/assets/left/process", json={"expected_revision": 1})
        assert response.status_code == 503
        asset = client.get("/api/assets/left").json()
        assert asset["status"] == "ready"
        assert asset["latest_result"] is None
        assert asset["revision"] == 1


def test_failed_processing_can_retry_and_later_generation_never_overwrites_download(source_project, tmp_path):
    before = source_hashes(source_project)
    engine = ControlledEngine(fail=True)
    with TestClient(create_app(source_project, tmp_path / "studio", engine)) as client:
        first = client.post("/api/assets/left/process", json={"expected_revision": 1}).json()
        failed = wait_for_job(client, first["id"])
        assert failed["status"] == "failed"
        assert failed["result"] is None
        assert client.get(f"/api/downloads/{first['id']}").status_code == 404
        engine.fail = False
        second = client.post("/api/assets/left/process", json={"expected_revision": 1}).json()
        assert second["id"] != first["id"]
        completed = wait_for_job(client, second["id"])
        assert completed["status"] == "completed"
        original_download = client.get(completed["result"]["download_url"]).content
        saved = client.get("/api/assets/left").json()
        settings = {**saved["settings"], "style": "natural", "shadow": False, "border": 0, "subject_scale": .6}
        assert client.put("/api/assets/left/settings", json={"expected_revision": 1, "settings": settings}).status_code == 200
        third = client.post("/api/assets/left/process", json={"expected_revision": 2}).json()
        latest = wait_for_job(client, third["id"])
        assert latest["status"] == "completed"
        assert client.get(latest["result"]["download_url"]).content != original_download
        assert client.get(completed["result"]["download_url"]).content == original_download
        assert client.get(f"/api/jobs/{second['id']}").json()["settings_revision"] == 1
        assert client.get("/api/assets/left").json()["latest_result"]["settings_revision"] == 2
    assert source_hashes(source_project) == before


def test_manifest_cannot_expose_files_outside_originals(source_project, tmp_path):
    base = source_project / "data" / "pet-materials"
    secret = tmp_path / "private.png"
    secret.write_bytes(png_bytes())
    (base / "originals" / "escape.png").symlink_to(secret)
    manifest_path = base / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    record = manifest["records"][0]
    record["attachments"].extend([
        {"attachment_id": "traversal", "download_status": "downloaded", "local_path": str(secret)},
        {"attachment_id": "symlink", "download_status": "downloaded", "local_path": "originals/escape.png"},
    ])
    manifest_path.write_text(json.dumps(manifest))
    rows_path = base / "review" / "assisted-v1" / "assistant-reviewed-model.json"
    rows = json.loads(rows_path.read_text())
    rows["records"].extend([{"region_id": name, "attachment_id": name} for name in ("traversal", "symlink")])
    rows_path.write_text(json.dumps(rows))
    with TestClient(create_app(source_project, tmp_path / "studio", ControlledEngine())) as client:
        assert len(client.get("/api/assets").json()["items"]) == 3
        for name in ("traversal", "symlink"):
            assert client.get(f"/api/media/{name}/original").status_code == 404
        for path in ("/api/media/%2E%2E%2Fprivate.png/original", "/api/results/unknown/%2E%2E%2Fprivate.png"):
            assert client.get(path).status_code in (404, 422)


def test_upload_checks_actual_format_animation_dimensions_and_safe_filename(source_project, tmp_path):
    data = tmp_path / "studio"
    bmp = io.BytesIO()
    Image.new("RGB", (8, 8)).save(bmp, "BMP")
    animation = io.BytesIO()
    Image.new("RGB", (8, 8), "red").save(animation, "PNG", save_all=True,
        append_images=[Image.new("RGB", (8, 8), "blue")], duration=100, loop=0)
    # A valid PNG header advertising an oversized image is rejected before decoding.
    oversized_header = bytearray(png_bytes())
    oversized_header[16:24] = struct.pack(">II", 10000, 5000)
    oversized_header[29:33] = struct.pack(">I", zlib.crc32(oversized_header[12:29]) & 0xFFFFFFFF)
    with TestClient(create_app(source_project, data, ControlledEngine())) as client:
        for contents, expected_status in ((bmp.getvalue(), 415), (animation.getvalue(), 415), (bytes(oversized_header), 413)):
            response = client.post("/api/upload", files={"file": ("looks-like-photo.png", contents, "image/png")})
            assert response.status_code == expected_status, response.text
        uploaded = client.post("/api/upload", files={"file": ("../../escaped.png", png_bytes(), "image/png")})
        assert uploaded.status_code == 201
        asset = uploaded.json()
        assert asset["name"] == "escaped"
        assert client.get(asset["original_url"]).content == png_bytes()
        assert len(list((data / "uploads").iterdir())) == 1
        assert not (tmp_path / "escaped.png").exists()
