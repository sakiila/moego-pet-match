"""Small SQLite store: each settings save and job snapshot is one transaction."""

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path


def now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


class MissingAsset(Exception):
    pass


class RevisionConflict(Exception):
    pass


class Store:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        data_dir.mkdir(parents=True, exist_ok=True)
        self.db = data_dir / "studio.sqlite3"
        with self.connection() as conn:
            conn.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS assets (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL, owner TEXT NOT NULL,
                    label TEXT NOT NULL, source TEXT NOT NULL, original_path TEXT NOT NULL,
                    width INTEGER NOT NULL, height INTEGER NOT NULL,
                    settings_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
                    saved_at TEXT NOT NULL, created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY, asset_id TEXT NOT NULL REFERENCES assets(id),
                    status TEXT NOT NULL, phase TEXT NOT NULL, message TEXT NOT NULL,
                    settings_revision INTEGER NOT NULL, settings_json TEXT NOT NULL,
                    created_at TEXT NOT NULL, started_at TEXT, completed_at TEXT,
                    image_path TEXT, cutout_path TEXT
                );
                CREATE INDEX IF NOT EXISTS jobs_asset_created ON jobs(asset_id, created_at DESC);
                CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            """)

    @contextmanager
    def connection(self):
        conn = sqlite3.connect(self.db, timeout=15)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        try:
            yield conn
            conn.commit()
        except BaseException:
            conn.rollback()
            raise
        finally:
            conn.close()

    def seed(self, items):
        stamp = now()
        with self.connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            for item in items:
                conn.execute("""
                    INSERT INTO assets (id, name, owner, label, source, original_path, width, height, settings_json, saved_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET name=excluded.name, owner=excluded.owner,
                        label=excluded.label, original_path=excluded.original_path,
                        width=excluded.width, height=excluded.height
                """, (item["id"], item["name"], item["owner"], item["label"], item["source"], item["original_path"],
                      item["width"], item["height"], json.dumps(item["settings"]), stamp, stamp))

    def add_upload(self, item):
        with self.connection() as conn:
            stamp = now()
            conn.execute("""
                INSERT INTO assets (id, name, owner, label, source, original_path, width, height, settings_json, saved_at, created_at)
                VALUES (?, ?, ?, ?, 'upload', ?, ?, ?, ?, ?, ?)
            """, (item["id"], item["name"], "本地上传", "本地上传照片", item["original_path"], item["width"], item["height"], json.dumps(item["settings"]), stamp, stamp))
            conn.execute("INSERT OR REPLACE INTO preferences VALUES ('selected_id', ?)", (item["id"],))
        return self.asset(item["id"])

    @staticmethod
    def _result(row):
        if row is None:
            return None
        job_id = row["id"]
        return dict(job_id=job_id, image_url=f"/api/results/{job_id}/image.png",
                    cutout_url=f"/api/results/{job_id}/cutout.png",
                    download_url=f"/api/downloads/{job_id}?size={json.loads(row['settings_json'])['output_size']}",
                    created_at=row["completed_at"], settings_revision=row["settings_revision"],
                    settings=json.loads(row["settings_json"]))

    def _asset(self, conn, row):
        if row is None:
            raise MissingAsset()
        asset = {key: row[key] for key in ("id", "name", "owner", "label", "source", "width", "height", "revision", "saved_at")}
        asset["settings"] = json.loads(row["settings_json"])
        asset["original_url"] = f"/api/media/{row['id']}/original"
        asset["thumbnail_url"] = f"/api/media/{row['id']}/thumbnail"
        latest = conn.execute("SELECT * FROM jobs WHERE asset_id=? ORDER BY created_at DESC, rowid DESC LIMIT 1", (row["id"],)).fetchone()
        completed = conn.execute("SELECT * FROM jobs WHERE asset_id=? AND status='completed' ORDER BY completed_at DESC, rowid DESC LIMIT 1", (row["id"],)).fetchone()
        asset["status"] = latest["status"] if latest else "ready"
        asset["latest_result"] = self._result(completed)
        return asset

    def assets(self):
        with self.connection() as conn:
            return [self._asset(conn, row) for row in conn.execute("SELECT * FROM assets ORDER BY source, created_at, rowid").fetchall()]

    def asset(self, asset_id):
        with self.connection() as conn:
            return self._asset(conn, conn.execute("SELECT * FROM assets WHERE id=?", (asset_id,)).fetchone())

    def original_path(self, asset_id):
        with self.connection() as conn:
            row = conn.execute("SELECT original_path FROM assets WHERE id=?", (asset_id,)).fetchone()
            if row is None:
                raise MissingAsset()
            return Path(row["original_path"])

    def selected(self):
        with self.connection() as conn:
            row = conn.execute("SELECT a.id FROM assets a JOIN preferences p ON p.value=a.id WHERE p.key='selected_id'").fetchone()
            if row:
                return row["id"]
            first = conn.execute("SELECT id FROM assets ORDER BY source, created_at, rowid LIMIT 1").fetchone()
            return first["id"] if first else None

    def select(self, asset_id):
        with self.connection() as conn:
            if conn.execute("SELECT 1 FROM assets WHERE id=?", (asset_id,)).fetchone() is None:
                raise MissingAsset()
            conn.execute("INSERT OR REPLACE INTO preferences VALUES ('selected_id', ?)", (asset_id,))
        return asset_id

    def save_settings(self, asset_id, expected_revision, settings):
        with self.connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            self._check_revision(conn, asset_id, expected_revision)
            conn.execute("UPDATE assets SET settings_json=?, revision=revision+1, saved_at=? WHERE id=?",
                         (json.dumps(settings), now(), asset_id))
        return self.asset(asset_id)

    @staticmethod
    def _check_revision(conn, asset_id, expected_revision):
        row = conn.execute("SELECT * FROM assets WHERE id=?", (asset_id,)).fetchone()
        if row is None:
            raise MissingAsset()
        if row["revision"] != expected_revision:
            raise RevisionConflict()
        return row

    def enqueue(self, asset_id, expected_revision):
        with self.connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            asset = self._check_revision(conn, asset_id, expected_revision)
            existing = conn.execute("SELECT id FROM jobs WHERE asset_id=? AND settings_revision=? AND status IN ('queued','processing')", (asset_id, expected_revision)).fetchone()
            if existing:
                return self.job(existing["id"]), False
            job_id = uuid.uuid4().hex
            conn.execute("""INSERT INTO jobs (id, asset_id, status, phase, message, settings_revision, settings_json, created_at)
                VALUES (?, ?, 'queued', 'queued', '已加入本地处理队列', ?, ?, ?)""",
                         (job_id, asset_id, expected_revision, asset["settings_json"], now()))
        return self.job(job_id), True

    def job(self, job_id):
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
            if row is None:
                return None
            job = {key: row[key] for key in ("id", "asset_id", "status", "phase", "message", "settings_revision", "created_at", "started_at", "completed_at")}
            job["settings"] = json.loads(row["settings_json"])
            job["result"] = self._result(row) if row["status"] == "completed" else None
            return job

    def update_job(self, job_id, status, phase, message, image_path=None, cutout_path=None):
        with self.connection() as conn:
            stamp = now()
            conn.execute("""UPDATE jobs SET status=?, phase=?, message=?,
                started_at=CASE WHEN ?='processing' THEN COALESCE(started_at, ?) ELSE started_at END,
                completed_at=CASE WHEN ? IN ('completed','failed') THEN ? ELSE completed_at END,
                image_path=COALESCE(?, image_path), cutout_path=COALESCE(?, cutout_path) WHERE id=?""",
                         (status, phase, message, status, stamp, status, stamp, str(image_path) if image_path else None, str(cutout_path) if cutout_path else None, job_id))

    def result_path(self, job_id, kind):
        with self.connection() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE id=? AND status='completed'", (job_id,)).fetchone()
            if row is None:
                return None
            return Path(row["image_path"] if kind == "image" else row["cutout_path"])

    def recover_interrupted(self):
        with self.connection() as conn:
            conn.execute("UPDATE jobs SET status='failed', phase='failed', message='上次处理被中断，请重新生成', completed_at=? WHERE status IN ('queued','processing')", (now(),))
