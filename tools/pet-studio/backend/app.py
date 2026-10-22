"""Local FastAPI boundary for versioned pet photo work."""

import io
import logging
import os
import re
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from PIL import Image, ImageOps, UnidentifiedImageError

from .library import library_items
from .models import ProcessRequest, SaveSettings, SelectionRequest, default_settings
from .processing import LocalEngine, process_job
from .store import MissingAsset, RevisionConflict, Store


MAX_UPLOAD = 25 * 1024 * 1024
MAX_PIXELS = 40_000_000
LOCAL_ORIGIN = re.compile(r"^https?://(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$")


def create_app(project_root=None, data_dir=None, engine=None):
    root = Path(project_root or os.environ.get("PET_STUDIO_PROJECT_ROOT") or Path(__file__).resolve().parents[3]).resolve()
    working = Path(data_dir or os.environ.get("PET_STUDIO_DATA_DIR") or root / "data" / "pet-studio").resolve()
    local_engine = engine or LocalEngine()

    @asynccontextmanager
    async def lifespan(application):
        store = Store(working)
        store.seed(library_items(root))
        store.recover_interrupted()
        application.state.store = store
        application.state.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="pet-studio")
        try:
            yield
        finally:
            application.state.executor.shutdown(wait=False, cancel_futures=True)

    application = FastAPI(title="Pet Studio Local", lifespan=lifespan, docs_url=None, redoc_url=None)
    application.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "[::1]", "testserver"])
    application.add_middleware(CORSMiddleware, allow_origin_regex=LOCAL_ORIGIN.pattern,
                               allow_methods=["GET", "POST", "PUT"], allow_headers=["Content-Type"])

    @application.middleware("http")
    async def protect_local_writes(request: Request, call_next):
        origin = request.headers.get("origin")
        if request.method in ("POST", "PUT", "DELETE", "PATCH") and origin and not LOCAL_ORIGIN.fullmatch(origin):
            return JSONResponse(status_code=403, content={"detail": "仅允许本机工作台修改素材"})
        return await call_next(request)

    @application.exception_handler(MissingAsset)
    async def missing_asset(_request, _error):
        return JSONResponse(status_code=404, content={"detail": "找不到这张照片，请刷新素材库"})

    @application.exception_handler(RevisionConflict)
    async def revision_conflict(_request, _error):
        return JSONResponse(status_code=409, content={"detail": "照片参数已有更新，请重新载入后再保存或生成"})

    @application.exception_handler(RequestValidationError)
    async def invalid_request(_request, _error):
        return JSONResponse(status_code=422, content={"detail": "参数格式不正确，请检查裁切范围、尺寸和样式设置"})

    @application.exception_handler(Exception)
    async def unexpected_error(_request, error):
        logging.getLogger(__name__).exception("Pet Studio request failed", exc_info=error)
        return JSONResponse(status_code=500, content={"detail": "本地服务暂时无法完成请求，请稍后重试"})

    def store():
        return application.state.store

    @application.get("/api/health")
    def health():
        return dict(ok=True, engine=local_engine.status())

    @application.get("/api/assets")
    def assets():
        return dict(items=store().assets(), selected_id=store().selected(), engine=local_engine.status())

    @application.get("/api/assets/{asset_id}")
    def asset(asset_id: str):
        return store().asset(asset_id)

    @application.put("/api/assets/{asset_id}/settings")
    def save_settings(asset_id: str, request: SaveSettings):
        return store().save_settings(asset_id, request.expected_revision, request.settings.model_dump())

    @application.post("/api/assets/{asset_id}/process", status_code=202)
    def process(asset_id: str, request: ProcessRequest):
        if not local_engine.status()["ready"]:
            raise HTTPException(status_code=503, detail=local_engine.status()["message"])
        job, created = store().enqueue(asset_id, request.expected_revision)
        if created:
            application.state.executor.submit(process_job, store(), local_engine, job["id"])
        return job

    @application.get("/api/jobs/{job_id}")
    def job(job_id: str):
        item = store().job(job_id)
        if not item:
            raise HTTPException(status_code=404, detail="找不到这次处理任务")
        return item

    @application.post("/api/selection")
    def selection(request: SelectionRequest):
        return {"selected_id": store().select(request.asset_id)}

    @application.post("/api/upload", status_code=201)
    async def upload(file: UploadFile = File(...)):
        try:
            contents = await file.read(MAX_UPLOAD + 1)
        finally:
            await file.close()
        if not contents or len(contents) > MAX_UPLOAD:
            raise HTTPException(status_code=413, detail="请选择不超过 25 MB 的 JPEG、PNG 或 WebP 照片")
        try:
            with Image.open(io.BytesIO(contents)) as opened:
                image_format = opened.format
                if image_format not in ("JPEG", "PNG", "WEBP"):
                    raise HTTPException(status_code=415, detail="仅支持实际可读取的 JPEG、PNG 或 WebP 照片")
                if opened.width * opened.height > MAX_PIXELS:
                    raise HTTPException(status_code=413, detail="照片分辨率不能超过 4000 万像素")
                if getattr(opened, "is_animated", False):
                    raise HTTPException(status_code=415, detail="请上传静态照片，暂不支持动态图像")
                opened.verify()
            with Image.open(io.BytesIO(contents)) as opened:
                oriented = ImageOps.exif_transpose(opened)
                oriented.load()
                width, height = oriented.size
        except HTTPException:
            raise
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
            raise HTTPException(status_code=415, detail="照片无法读取，请重新选择有效的 JPEG、PNG 或 WebP 文件")

        asset_id = "upload_" + uuid.uuid4().hex
        extension = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}[image_format]
        upload_dir = working / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        destination = upload_dir / (asset_id + extension)
        temporary = destination.with_suffix(".part")
        try:
            with temporary.open("xb") as output:
                output.write(contents)
                output.flush()
                os.fsync(output.fileno())
            temporary.replace(destination)
            filename = (file.filename or "上传照片").replace("\\", "/").rsplit("/", 1)[-1]
            item = dict(id=asset_id, name=Path(filename).stem[:80] or "上传照片", original_path=str(destination),
                        width=width, height=height, settings=default_settings())
            return store().add_upload(item)
        except Exception:
            temporary.unlink(missing_ok=True)
            destination.unlink(missing_ok=True)
            raise

    @application.get("/api/media/{asset_id}/original")
    def original(asset_id: str):
        path = store().original_path(asset_id)
        if not path.is_file():
            raise HTTPException(status_code=404, detail="原图文件暂时不可用")
        return FileResponse(path, headers={"Cache-Control": "private, max-age=31536000, immutable"})

    @application.get("/api/media/{asset_id}/thumbnail")
    def thumbnail(asset_id: str):
        path = store().original_path(asset_id)
        if not path.is_file():
            raise HTTPException(status_code=404, detail="原图文件暂时不可用")
        # The cache key never contains a client-supplied filesystem component.
        import hashlib

        cache = working / "thumbnails" / (hashlib.sha256(asset_id.encode()).hexdigest() + ".png")
        if not cache.exists():
            cache.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(path) as opened:
                image = ImageOps.exif_transpose(opened).convert("RGB")
                image.thumbnail((360, 360), Image.Resampling.LANCZOS)
                # Unique temporary names also make parallel first reads safe.
                temporary = cache.with_suffix("." + uuid.uuid4().hex + ".tmp")
                image.save(temporary, format="PNG", optimize=True)
                temporary.replace(cache)
        return FileResponse(cache, media_type="image/png", headers={"Cache-Control": "private, max-age=31536000, immutable"})

    @application.get("/api/results/{job_id}/{filename}")
    def result_image(job_id: str, filename: Literal["image.png", "cutout.png"]):
        path = store().result_path(job_id, "image" if filename == "image.png" else "cutout")
        if not path or not path.is_file():
            raise HTTPException(status_code=404, detail="处理结果尚未生成或文件不可用")
        return FileResponse(path, media_type="image/png", headers={"Cache-Control": "private, max-age=31536000, immutable"})

    @application.get("/api/downloads/{job_id}")
    def download(job_id: str, size: int = 1024):
        if size not in (512, 1024):
            raise HTTPException(status_code=422, detail="下载尺寸仅支持 512 或 1024")
        path = store().result_path(job_id, "image")
        if not path or not path.is_file():
            raise HTTPException(status_code=404, detail="处理完成后即可下载透明 PNG")
        filename = f"pet-studio-{job_id[:8]}-{size}.png"
        if size == 1024:
            return FileResponse(path, media_type="image/png", filename=filename)
        with Image.open(path) as image:
            image = image.resize((size, size), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            image.save(output, format="PNG", optimize=True)
        return Response(output.getvalue(), media_type="image/png", headers={"Content-Disposition": f'attachment; filename="{filename}"'})

    frontend = root / "tools" / "pet-studio" / "frontend" / "dist"

    @application.get("/{path:path}")
    def frontend_file(path: str):
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404, detail="接口不存在")
        candidate = (frontend / path).resolve()
        if candidate.is_relative_to(frontend.resolve()) and candidate.is_file():
            return FileResponse(candidate)
        index = frontend / "index.html"
        if index.is_file():
            return FileResponse(index)
        return JSONResponse(status_code=503, content={"detail": "工作台前端尚未构建，请先运行启动脚本"})

    return application


app = create_app()
