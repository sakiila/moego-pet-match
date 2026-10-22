import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import Mock, patch

import collect_pet_materials as collector


class CollectPetMaterialsTest(unittest.TestCase):
    def table(self, owner_ids=("u1",)):
        field_map = {
            "f_name": {"name": "Pet Name"},
            "f_owner": {"name": "Pet Owner"},
            "f_pic": {"name": "Pic"},
            "f_intro": {"name": "Intro"},
            "f_gender": {"name": "Gender", "property": {"options": [{"id": "female", "name": "妹妹 / Female"}]}},
        }
        return {
            "meta": {"rev": 7},
            "recordCount": 1,
            "fieldMap": field_map,
            "recordMap": {"r1": {
                "f_name": {"value": [{"text": "米露"}, {"text": " / Milo"}]},
                "f_owner": {"value": {"users": [{"userId": uid, "name": f"主人 {uid}"} for uid in owner_ids]}},
                "f_gender": {"value": ["female"]},
                "f_intro": {"value": [{"text": "Hello **Milo**\n"}, {"text": "原文保留，不翻译。"}]},
                "f_pic": {"value": [
                    {"name": "米露 #1.JPG", "attachmentToken": "attachment-A_1", "id": "unused-id", "size": 5, "mimeType": "image/jpeg", "width": 12, "height": 8},
                    {"name": "other.png", "id": "attachment-B_2", "size": 5, "mimeType": "image/png"},
                ]},
            }},
        }

    def active_status(self):
        return {"resigned": False, "status_evidence": "Feishu user.detail.v2 resigned=false", "checked_at": "2026-10-21T12:00:00+00:00"}

    def build(self, table, statuses, root, browser):
        with redirect_stdout(io.StringIO()):
            return collector.build_manifest(browser, table, collector.field_ids(table), {}, statuses, root)

    def test_closed_accounts_never_call_download(self):
        cases = [
            (("u1",), {"u1": {"resigned": True}}),
            (("u1",), {"u1": {"resigned": False, "display_name": "Alice closed"}}),
            (("u1", "u2"), {"u1": self.active_status(), "u2": {"resigned": True}}),
        ]
        for owner_ids, statuses in cases:
            with self.subTest(statuses=statuses), tempfile.TemporaryDirectory() as temp:
                browser = Mock()
                with patch.object(collector, "download_one", side_effect=AssertionError("closed account must never download")) as download:
                    result = self.build(self.table(owner_ids), statuses, Path(temp), browser)
                download.assert_not_called()
                browser.assert_not_called()
                self.assertEqual(browser.mock_calls, [])
                self.assertEqual(result["records"], [])
                self.assertEqual(len(result["skipped"]), 1)
                self.assertEqual(set(result["skipped"][0]), {"source_record_id", "pet_name_raw", "owner_name", "reason"})

    def test_unknown_or_missing_owners_never_call_download(self):
        cases = [
            (("u1",), {}),
            (("u1",), {"u1": {"resigned": None}}),
            (("u1", "u2"), {"u1": self.active_status()}),
            ((), {}),
        ]
        for owner_ids, statuses in cases:
            with self.subTest(owner_ids=owner_ids, statuses=statuses), tempfile.TemporaryDirectory() as temp:
                browser = Mock()
                with patch.object(collector, "download_one", side_effect=AssertionError("unknown account must never download")) as download:
                    result = self.build(self.table(owner_ids), statuses, Path(temp), browser)
                download.assert_not_called()
                self.assertEqual(browser.mock_calls, [])
                self.assertEqual(result["records"], [])
                self.assertEqual(len(result["pending"]), 1)
                self.assertIs(result["coverage"]["complete"], False)

    def test_active_record_preserves_fields_and_attachment_identity(self):
        def save_attachment(browser, url, target, expected_size, expected_mime):
            target.write_bytes(b"photo")

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "originals").mkdir()
            browser = Mock()
            with patch.object(collector, "download_one", side_effect=save_attachment) as download:
                result = self.build(self.table(), {"u1": self.active_status()}, root, browser)
            self.assertEqual(download.call_count, 2)
            self.assertEqual(browser.mock_calls, [])
            record = result["records"][0]
            self.assertEqual(record["pet_name_raw"], "米露 / Milo")
            self.assertEqual(record["gender_raw"], "妹妹 / Female")
            self.assertEqual(record["intro_raw"], "Hello **Milo**\n原文保留，不翻译。")
            self.assertEqual(record["owners"][0]["name"], "主人 u1")
            self.assertEqual(record["owners"][0]["status"], "active")
            self.assertEqual(record["owners"][0]["status_evidence"], self.active_status()["status_evidence"])
            self.assertEqual(record["source_url"], collector.SOURCE)
            attachments = record["attachments"]
            self.assertEqual([item["original_name"] for item in attachments], ["米露 #1.JPG", "other.png"])
            for item, token in zip(attachments, ("attachment-A_1", "attachment-B_2")):
                self.assertEqual(item["attachment_id"], token)
                self.assertIn(token, Path(item["local_path"]).name)
                self.assertEqual((root / item["local_path"]).read_bytes(), b"photo")
                self.assertEqual(item["sha256"], hashlib.sha256(b"photo").hexdigest())
                self.assertEqual(item["download_status"], "downloaded")
            self.assertEqual(attachments[0]["mime"], "image/jpeg")
            self.assertEqual(attachments[0]["size"], 5)
            self.assertEqual(attachments[0]["width"], 12)
            self.assertEqual(attachments[0]["height"], 8)
            self.assertEqual(result["coverage"]["expected_records"], 1)
            self.assertEqual(result["coverage"]["visited_records"], 1)
            self.assertIs(result["coverage"]["complete"], True)
            self.assertEqual(json.loads((root / "manifest.json").read_text())["records"], result["records"])

    def test_same_size_with_wrong_or_missing_checksum_cannot_be_reused(self):
        for checksum in (None, hashlib.sha256(b"photo").hexdigest()):
            with self.subTest(checksum=checksum), tempfile.TemporaryDirectory() as temp:
                target = Path(temp) / "attachment.jpg"
                target.write_bytes(b"other")  # Same byte count as the expected original.
                if checksum is not None:
                    target.with_suffix(".jpg.sha256").write_text(checksum + "\n")
                browser = Mock()
                with self.assertRaisesRegex(RuntimeError, "checksum"):
                    collector.download_one(browser, "https://example.invalid/attachment", target, 5, "image/jpeg")
                self.assertEqual(browser.mock_calls, [])
                self.assertEqual(target.read_bytes(), b"other")

    def test_matching_checksum_reuses_existing_file_without_browser(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "attachment.jpg"
            target.write_bytes(b"photo")
            target.with_suffix(".jpg.sha256").write_text(hashlib.sha256(b"photo").hexdigest() + "\n")
            browser = Mock()
            collector.download_one(browser, "https://example.invalid/attachment", target, 5, "image/jpeg")
            self.assertEqual(browser.mock_calls, [])

    def test_failed_attachment_keeps_manifest_incomplete(self):
        with tempfile.TemporaryDirectory() as temp:
            with patch.object(collector, "download_one", side_effect=RuntimeError("test download failure")):
                result = self.build(self.table(), {"u1": self.active_status()}, Path(temp), Mock())
        self.assertIs(result["coverage"]["complete"], False)
        self.assertEqual([item["download_status"] for item in result["records"][0]["attachments"]], ["failed", "failed"])


if __name__ == "__main__":
    unittest.main()
