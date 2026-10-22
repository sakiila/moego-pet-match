import tempfile
import unittest
from pathlib import Path

from render_pet_catalog import render_catalog


class RenderPetCatalogTest(unittest.TestCase):
    def render(self, manifest, root):
        return render_catalog(manifest, input_dir=root, output_dir=root / "docs", assets_root=root)

    def record(self, **changes):
        record = {
            "source_record_id": "r1",
            "pet_name_raw": "米露 / Milo",
            "status": "eligible",
            "owners": [{"name": "Alice", "status": "active", "status_evidence": "飞书人员卡片：正常"}],
            "gender_raw": "Female / 妹妹",
            "intro_raw": "Hello **Milo**\n保留原文，不翻译。",
        }
        record.update(changes)
        return record

    def test_closed_overrides_valid_and_omits_private_body(self):
        record = self.record(
            owners=[{"name": "Former Owner", "status": "closed", "status_evidence": "closed"}],
            intro_raw="SECRET_CLOSED_INTRO",
            gender_raw="SECRET_CLOSED_GENDER",
            attachments=[{"original_name": "SECRET_CLOSED_PHOTO.jpg", "download_status": "downloaded"}],
        )
        with tempfile.TemporaryDirectory() as temp:
            doc = self.render({"records": [record]}, Path(temp))
        self.assertIn("有效记录：0 条", doc)
        self.assertIn("主人账号状态为 closed", doc)
        for private in ("SECRET_CLOSED_INTRO", "SECRET_CLOSED_GENDER", "SECRET_CLOSED_PHOTO"):
            self.assertNotIn(private, doc)

    def test_unknown_or_missing_status_and_missing_evidence_are_not_valid(self):
        records = [
            self.record(source_record_id="r1", owners=[{"name": "A", "status": "unknown", "status_evidence": "人员卡片无状态"}]),
            self.record(source_record_id="r2", owners=[{"name": "A", "status_evidence": "只有名字"}]),
            self.record(source_record_id="r3", owners=[{"name": "A", "status": "active"}]),
            self.record(source_record_id="r4", status=None),
        ]
        with tempfile.TemporaryDirectory() as temp:
            doc = self.render({"records": records}, Path(temp))
        self.assertIn("有效记录：0 条", doc)
        self.assertIn("待核对记录：4 条", doc)
        self.assertNotIn("Hello **Milo**", doc)

    def test_original_text_and_all_attachment_links_are_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "assets").mkdir()
            (root / "assets" / "Milo #1.jpg").write_bytes(b"photo")
            (root / "assets" / "Intro file.pdf").write_bytes(b"pdf")
            record = self.record(attachments=[
                {"original_name": "Milo #1.jpg", "local_path": "assets/Milo #1.jpg", "mime": "image/jpeg", "download_status": "downloaded"},
                {"original_name": "Intro file.pdf", "local_path": "assets/Intro file.pdf", "mime": "application/pdf", "download_status": "downloaded"},
            ])
            doc = self.render({"records": [record]}, root)
        self.assertIn("Hello **Milo**\n保留原文，不翻译。", doc)
        self.assertIn("Female / 妹妹", doc)
        self.assertIn("[Milo #1.jpg](<../assets/Milo%20%231.jpg>)", doc)
        self.assertIn("![Milo #1.jpg](<../assets/Milo%20%231.jpg>)", doc)
        self.assertIn("[Intro file.pdf](<../assets/Intro%20file.pdf>)", doc)
        self.assertIn("飞书人员卡片：正常", doc)
        self.assertIn("本地可用：2 个", doc)

    def test_incomplete_or_missing_file_never_claims_complete(self):
        for coverage in ({}, {"complete": True}, {"complete": True, "expected_records": 2, "visited_records": 1}, {"complete": True, "expected_records": 1, "visited_records": 1}):
            with self.subTest(coverage=coverage), tempfile.TemporaryDirectory() as temp:
                doc = self.render({"coverage": coverage, "records": []}, Path(temp))
                self.assertIn("完整性：**未确认完整**", doc)
        with tempfile.TemporaryDirectory() as temp:
            manifest = {
                "coverage": {"complete": True, "expected_records": 1, "visited_records": 1},
                "records": [self.record(attachments=[{"original_name": "missing.jpg", "local_path": "missing.jpg", "download_status": "downloaded"}])],
            }
            doc = self.render(manifest, Path(temp))
        self.assertIn("完整性：**未确认完整**", doc)
        self.assertIn("本地文件不存在", doc)
        self.assertIn("本地可用：0 个；失败或待确认：1 个", doc)

    def test_skipped_list_overrides_stale_active_record(self):
        with tempfile.TemporaryDirectory() as temp:
            doc = self.render({
                "records": [self.record(intro_raw="STALE_PRIVATE_INTRO")],
                "skipped": [{"source_record_id": "r1", "pet_name_raw": "Milo", "owner_name": "Alice", "reason": "closed"}],
            }, Path(temp))
        self.assertNotIn("STALE_PRIVATE_INTRO", doc)
        self.assertIn("有效记录：0 条", doc)
        self.assertIn("跳过记录：1 条", doc)


if __name__ == "__main__":
    unittest.main()
