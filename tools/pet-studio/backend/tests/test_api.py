import hashlib
import io
import threading
import time

from fastapi.testclient import TestClient
from PIL import Image

from backend.app import create_app
from backend.store import Store
from conftest import FakeEngine


def wait_for_job(client, job_id):
    deadline = time.monotonic() + 12
    while time.monotonic() < deadline:
        job = client.get(f"/api/jobs/{job_id}").json()
        if job["status"] in ("completed", "failed"):
            return job
        time.sleep(.03)
    raise AssertionError("Background job did not complete")


def test_library_overlay_persistence_and_revision_conflict(project, tmp_path):
    data = tmp_path / "studio"
    app = create_app(project, data, FakeEngine())
    with TestClient(app) as client:
        listing = client.get("/api/assets").json()
        assert len(listing["items"]) == 1
        asset = listing["items"][0]
        assert asset["name"] == "JoJo"
        assert "身份已确认" in asset["label"]
        assert "original_path" not in asset
        assert asset["settings"]["crop"]["x"] == .14
        settings = {**asset["settings"], "style": "natural", "subject_scale": .7}
        updated = client.put("/api/assets/region-1/settings", json={"expected_revision": 1, "settings": settings}).json()
        assert updated["revision"] == 2
        assert updated["saved_at"]
        conflict = client.put("/api/assets/region-1/settings", json={"expected_revision": 1, "settings": settings})
        assert conflict.status_code == 409
        assert client.post("/api/assets/region-1/process", json={"expected_revision": 1}).status_code == 409
        assert client.post("/api/selection", json={"asset_id": "region-1"}).status_code == 200
    # Seeding on a fresh process must never reset user parameters or revisions.
    with TestClient(create_app(project, data, FakeEngine())) as restarted:
        saved = restarted.get("/api/assets/region-1").json()
        assert saved["revision"] == 2
        assert saved["settings"] == settings
        assert restarted.get("/api/assets").json()["selected_id"] == "region-1"


def test_job_snapshot_original_immutable_and_png_exports(project, tmp_path):
    entered, resume = threading.Event(), threading.Event()

    class BlockingEngine(FakeEngine):
        def remove(self, image):
            entered.set()
            assert resume.wait(8)
            return super().remove(image)

    source = project / "data/pet-materials/originals/pet.png"
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    with TestClient(create_app(project, tmp_path / "studio", BlockingEngine())) as client:
        asset = client.get("/api/assets/region-1").json()
        queued = client.post("/api/assets/region-1/process", json={"expected_revision": 1})
        assert queued.status_code == 202
        job_id = queued.json()["id"]
        assert entered.wait(3)
        # A second request for the same active snapshot reuses its job.
        assert client.post("/api/assets/region-1/process", json={"expected_revision": 1}).json()["id"] == job_id
        new_settings = {**asset["settings"], "style": "soft"}
        assert client.put("/api/assets/region-1/settings", json={"expected_revision": 1, "settings": new_settings}).status_code == 200
        resume.set()
        finished = wait_for_job(client, job_id)
        assert finished["status"] == "completed", finished
        assert finished["settings_revision"] == 1
        assert finished["result"]["settings"]["style"] == "sticker"
        current = client.get("/api/assets/region-1").json()
        assert current["revision"] == 2
        assert current["latest_result"]["settings_revision"] == 1
        image_response = client.get(finished["result"]["image_url"])
        cutout_response = client.get(finished["result"]["cutout_url"])
        for content in (image_response.content, cutout_response.content):
            with Image.open(io.BytesIO(content)) as image:
                assert image.mode == "RGBA"
                assert image.size == (1024, 1024)
                assert image.getchannel("A").getextrema() == (0, 255)
        download = client.get(f"/api/downloads/{job_id}?size=512")
        assert "attachment" in download.headers["content-disposition"]
        with Image.open(io.BytesIO(download.content)) as image:
            assert image.size == (512, 512)
        assert client.get(f"/api/downloads/{job_id}?size=2048").status_code == 422
    assert hashlib.sha256(source.read_bytes()).hexdigest() == digest


def test_upload_real_format_exif_orientation_and_immutable_bytes(project, tmp_path):
    photo = Image.new("RGB", (30, 50), "#ff9988")
    exif = Image.Exif()
    exif[274] = 6
    buffer = io.BytesIO()
    photo.save(buffer, "JPEG", exif=exif)
    original_bytes = buffer.getvalue()
    with TestClient(create_app(project, tmp_path / "studio", FakeEngine())) as client:
        invalid = client.post("/api/upload", files={"file": ("fake.png", b'{"not":"image"}', "image/png")})
        assert invalid.status_code == 415
        result = client.post("/api/upload", files={"file": ("photo.jpg", original_bytes, "image/jpeg")})
        assert result.status_code == 201
        asset = result.json()
        assert asset["source"] == "upload"
        assert (asset["width"], asset["height"]) == (50, 30)
        assert client.get(asset["original_url"]).content == original_bytes
        thumbnail = client.get(asset["thumbnail_url"])
        with Image.open(io.BytesIO(thumbnail.content)) as image:
            assert image.size == (50, 30)
        assert client.get("/api/assets").json()["selected_id"] == asset["id"]


def test_invalid_settings_and_foreign_origin_are_rejected(project, tmp_path):
    with TestClient(create_app(project, tmp_path / "studio", FakeEngine())) as client:
        asset = client.get("/api/assets/region-1").json()
        bad = {**asset["settings"], "crop": {"x": .8, "y": 0, "width": .5, "height": 1}}
        assert client.put("/api/assets/region-1/settings", json={"expected_revision": 1, "settings": bad}).status_code == 422
        assert client.post("/api/selection", json={"asset_id": "region-1"}, headers={"Origin": "https://unrelated.example"}).status_code == 403
        assert client.get("/api/media/not-a-file/original").status_code == 404


def test_interrupted_jobs_recovered_as_failed(project, tmp_path):
    data = tmp_path / "studio"
    with TestClient(create_app(project, data, FakeEngine())):
        store = Store(data)
        queued, created = store.enqueue("region-1", 1)
        assert created
    with TestClient(create_app(project, data, FakeEngine())) as client:
        job = client.get(f"/api/jobs/{queued['id']}").json()
        assert job["status"] == "failed"
        assert "中断" in job["message"]
