"""Read source review metadata without changing its decisions or original files."""

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

from .models import default_settings


def read_json(path: Path, fallback):
    if not path.is_file():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def expanded_crop(bbox):
    """Keep a little more ear/fur context than the source proposal."""
    if not bbox or len(bbox) != 4:
        return {"x": 0, "y": 0, "width": 1, "height": 1}
    x, y, width, height = (float(value) for value in bbox)
    left, top = max(0, x - width * 0.1), max(0, y - height * 0.1)
    right, bottom = min(1, x + width * 1.1), min(1, y + height * 1.1)
    if right <= left or bottom <= top:
        return {"x": 0, "y": 0, "width": 1, "height": 1}
    return dict(x=round(left, 6), y=round(top, 6), width=round(right - left, 6), height=round(bottom - top, 6))


def library_items(project_root: Path):
    base = project_root / "data" / "pet-materials"
    manifest = read_json(base / "manifest.json", {})
    attachments = {}
    records = {}
    for record in manifest.get("records", []):
        records[record["source_record_id"]] = record
        for attachment in record.get("attachments", []):
            if attachment.get("download_status") == "downloaded":
                attachments[attachment["attachment_id"]] = attachment

    original_review = read_json(base / "review" / "review-model.json", {})
    regions = {item["region_id"]: item for item in original_review.get("regions", [])}
    assisted = read_json(base / "review" / "assisted-v1" / "assistant-reviewed-model.json", {})
    excluded = set(assisted.get("excluded_region_ids", []))
    excluded.update(item["region_id"] for item in read_json(base / "review" / "simple-review-exclusions.json", {}).get("excluded_regions", []))
    confirmations = {}
    confirmation_path = base / "review" / "user-confirmations.jsonl"
    if confirmation_path.is_file():
        for line in confirmation_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            item = json.loads(line)
            if item.get("status") == "user_confirmed_identity":
                confirmations[item["region_id"]] = item

    rows = assisted.get("records") or original_review.get("regions")
    if not rows:
        rows = [dict(region_id="lib_" + hashlib.sha256(aid.encode()).hexdigest()[:16], attachment_id=aid) for aid in attachments]

    for row in rows:
        asset_id = row["region_id"]
        if asset_id in excluded:
            continue
        attachment = attachments.get(row.get("attachment_id"))
        if not attachment:
            continue
        path = (base / attachment["local_path"]).resolve()
        # Only manifest-referenced original files are ever opened.
        if not path.is_relative_to((base / "originals").resolve()) or not path.is_file():
            continue
        source_record = records.get(row.get("source_record_id"), {})
        region = regions.get(asset_id, {})
        confirmation = confirmations.get(asset_id, {})
        pending = (row.get("requires_user", False) or row.get("decision") == "needs_user"
                   or row.get("review_status") == "待确认" or not assisted.get("records"))
        name = confirmation.get("name") or row.get("name") or source_record.get("pet_name_raw") or "未命名宠物"
        label = region.get("label") or row.get("quality_note") or "原始照片"
        if confirmation:
            label += " · 身份已确认"
        elif pending:
            label += " · 身份待确认"
        with Image.open(path) as source:
            oriented = ImageOps.exif_transpose(source)
            width, height = oriented.size
        yield dict(
            id=asset_id, name=name,
            owner=confirmation.get("owner") or row.get("owner") or ", ".join(owner.get("name", "") for owner in source_record.get("owners", [])),
            label=label, source="library", original_path=str(path), width=width, height=height,
            settings=default_settings(expanded_crop(row.get("bbox_proposal") or region.get("bbox"))),
        )
