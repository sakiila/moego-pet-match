import io
import json
import sys
from pathlib import Path

import pytest
from PIL import Image, ImageDraw


sys.path.insert(0, str(Path(__file__).resolve().parents[2]))


class FakeEngine:
    """Inference replacement only; all persistence and image rendering stay real."""

    def status(self):
        return {"ready": True, "model": "test", "message": "测试引擎"}

    def remove(self, image):
        result = image.convert("RGBA")
        alpha = Image.new("L", image.size)
        ImageDraw.Draw(alpha).ellipse((image.width * .15, image.height * .1, image.width * .85, image.height * .9), fill=255)
        result.putalpha(alpha)
        return result


@pytest.fixture
def image_bytes():
    image = Image.new("RGB", (120, 160), "#c19177")
    ImageDraw.Draw(image).ellipse((30, 35, 100, 125), fill="#a45729")
    buffer = io.BytesIO()
    image.save(buffer, "PNG")
    return buffer.getvalue()


@pytest.fixture
def project(tmp_path, image_bytes):
    root = tmp_path / "project"
    base = root / "data" / "pet-materials"
    originals = base / "originals"
    originals.mkdir(parents=True)
    (originals / "pet.png").write_bytes(image_bytes)
    review = base / "review"
    (review / "assisted-v1").mkdir(parents=True)
    manifest = {"records": [{"source_record_id": "record-1", "pet_name_raw": "JoJo or Lulu", "owners": [{"name": "Mia"}], "attachments": [{"attachment_id": "attachment-1", "local_path": "originals/pet.png", "download_status": "downloaded"}]}]}
    (base / "manifest.json").write_text(json.dumps(manifest))
    rows = [dict(region_id="region-1", attachment_id="attachment-1", source_record_id="record-1", name="待确认", owner="Mia", requires_user=True, decision="needs_user", bbox_proposal=[.2, .1, .6, .7]), dict(region_id="excluded", attachment_id="attachment-1", name="excluded")]
    (review / "assisted-v1" / "assistant-reviewed-model.json").write_text(json.dumps({"records": rows}))
    (review / "review-model.json").write_text(json.dumps({"regions": [{"region_id": "region-1", "label": "照片中的小狗"}]}))
    (review / "simple-review-exclusions.json").write_text(json.dumps({"excluded_regions": [{"region_id": "excluded"}]}))
    (review / "user-confirmations.jsonl").write_text(json.dumps({"region_id": "region-1", "name": "JoJo", "owner": "Mia", "status": "user_confirmed_identity"}) + "\n")
    return root
