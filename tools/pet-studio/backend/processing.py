"""CPU background removal and deterministic photo styles; no external image API."""

import importlib.util
import os
import threading
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


MASTER_SIZE = 1024


class ProcessingError(Exception):
    """Safe, user-facing processing failure."""


class LocalEngine:
    def __init__(self):
        self.model = os.environ.get("PET_STUDIO_MODEL", "u2net")
        self.session = None
        self.lock = threading.Lock()
        self.error = None

    def model_path(self):
        legacy = Path(os.environ.get("U2NET_HOME", str(Path(os.environ.get("XDG_DATA_HOME", "~")) / ".u2net"))).expanduser()
        if os.environ.get("U2NET_HOME"):
            home = legacy
        else:
            default = str(Path(os.environ["XDG_DATA_HOME"]) / "rembg") if os.environ.get("XDG_DATA_HOME") else "~/.rembg"
            home = Path(os.environ.get("REMBG_HOME", default)).expanduser()
        candidates = (home / "models" / self.model / f"{self.model}.onnx", legacy / f"{self.model}.onnx")
        return next((path for path in candidates if path.is_file()), None)

    def status(self):
        if self.error:
            return dict(ready=False, model=self.model, message=self.error)
        if self.model not in ("u2net", "u2netp"):
            return dict(ready=False, model=self.model, message="本地模型配置无效，请选择 u2net 或 u2netp")
        if not importlib.util.find_spec("rembg") or not importlib.util.find_spec("onnxruntime"):
            return dict(ready=False, model=self.model, message="尚未安装本地抠图依赖")
        if not self.model_path():
            return dict(ready=False, model=self.model, message=f"本地 {self.model} 模型尚未准备好")
        return dict(ready=True, model=self.model, message="本地 CPU 抠图已就绪" if self.session else "本地模型已准备好，首次处理会加载模型")

    def remove(self, image):
        with self.lock:
            if not self.status()["ready"]:
                raise ProcessingError(self.status()["message"])
            from rembg import new_session, remove

            if self.session is None:
                try:
                    # The model file was checked above, so rembg never downloads it here.
                    self.session = new_session(self.model, providers=["CPUExecutionProvider"])
                except Exception as error:
                    self.error = "本地抠图模型加载失败，请检查模型文件后重启服务"
                    raise ProcessingError(self.error) from error
            try:
                return remove(image, session=self.session, post_process_mask=True).convert("RGBA")
            except Exception as error:
                raise ProcessingError("本次抠图未能完成，请调整裁切范围或更换照片后重试") from error


def crop_source(path: Path, crop):
    with Image.open(path) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGBA")
    width, height = image.size
    left = min(width - 1, max(0, int(crop["x"] * width)))
    top = min(height - 1, max(0, int(crop["y"] * height)))
    right = min(width, max(left + 1, round((crop["x"] + crop["width"]) * width)))
    bottom = min(height, max(top + 1, round((crop["y"] + crop["height"]) * height)))
    image = image.crop((left, top, right, bottom))
    # Limit inference memory on very large uploads while retaining a detailed master.
    image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
    return image


def clean_cutout(cutout):
    cutout = cutout.convert("RGBA")
    alpha = cutout.getchannel("A").point(lambda value: 0 if value < 4 else 255 if value > 252 else value)
    bounds = alpha.point(lambda value: 255 if value > 12 else 0).getbbox()
    if not bounds or bounds[2] - bounds[0] < 3 or bounds[3] - bounds[1] < 3:
        raise ProcessingError("未能识别到清晰的宠物主体，请扩大裁切范围或换一张照片")
    cutout.putalpha(alpha)
    # Include a small soft-alpha fringe around the confident silhouette.
    bounds = (max(0, bounds[0] - 3), max(0, bounds[1] - 3), min(cutout.width, bounds[2] + 3), min(cutout.height, bounds[3] + 3))
    return cutout.crop(bounds)


def illustration_filter(image):
    """A repeatable light illustration filter, not generative image synthesis."""
    rgb = image.convert("RGB").filter(ImageFilter.SMOOTH_MORE)
    rgb = ImageEnhance.Color(rgb).enhance(0.88)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.04)
    rgb = ImageOps.posterize(rgb, 5)
    rgb.putalpha(image.getchannel("A"))
    return rgb


def compose(cutout, settings):
    border = settings["border"] if settings["style"] in ("sticker", "soft") else 0
    shadow = settings["shadow"]
    reserve = border + (38 if shadow else 3)
    target = min(round(MASTER_SIZE * settings["subject_scale"]), MASTER_SIZE - reserve * 2)
    subject = cutout.copy()
    subject.thumbnail((target, target), Image.Resampling.LANCZOS)
    position = ((MASTER_SIZE - subject.width) // 2, (MASTER_SIZE - subject.height) // 2)
    plain = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE))
    plain.alpha_composite(subject, position)

    styled_subject = illustration_filter(subject) if settings["style"] == "soft" else subject
    styled = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE))
    styled.alpha_composite(styled_subject, position)
    alpha = styled.getchannel("A")
    outline = alpha.filter(ImageFilter.MaxFilter(border * 2 + 1)) if border else alpha
    result = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE))
    if shadow:
        shadow_alpha = outline.filter(ImageFilter.GaussianBlur(12)).point(lambda value: round(value * 0.20))
        shifted_alpha = Image.new("L", (MASTER_SIZE, MASTER_SIZE))
        shifted_alpha.paste(shadow_alpha, (0, 10))
        shadow_layer = Image.new("RGBA", result.size, (33, 31, 30, 0))
        shadow_layer.putalpha(shifted_alpha)
        result.alpha_composite(shadow_layer)
    if border:
        white = Image.new("RGBA", result.size, (255, 255, 255, 0))
        white.putalpha(outline)
        result.alpha_composite(white)
    result.alpha_composite(styled)
    return result, plain


def atomic_png(image, destination: Path):
    temporary = destination.with_suffix(".tmp")
    image.save(temporary, format="PNG", optimize=True)
    temporary.replace(destination)


def process_job(store, engine, job_id):
    job = store.job(job_id)
    if not job or job["status"] != "queued":
        return
    result_dir = store.data_dir / "results" / job_id
    try:
        store.update_job(job_id, "processing", "cropping", "正在裁切并准备照片")
        source = crop_source(store.original_path(job["asset_id"]), job["settings"]["crop"])
        store.update_job(job_id, "processing", "removing", "正在本地识别宠物并移除背景")
        cutout = clean_cutout(engine.remove(source))
        store.update_job(job_id, "processing", "styling", "正在生成透明图像并保存结果")
        image, plain = compose(cutout, job["settings"])
        # Each UUID job owns a new directory; existing results are never overwritten.
        result_dir.mkdir(parents=True, exist_ok=False)
        image_path, cutout_path = result_dir / "image.png", result_dir / "cutout.png"
        atomic_png(image, image_path)
        atomic_png(plain, cutout_path)
        store.update_job(job_id, "completed", "completed", "生成完成，结果与本次参数版本已保存", image_path, cutout_path)
    except ProcessingError as error:
        store.update_job(job_id, "failed", "failed", str(error))
    except Exception:
        import logging

        logging.getLogger(__name__).exception("Pet processing job failed: %s", job_id)
        store.update_job(job_id, "failed", "failed", "照片处理失败，原图已保留，请重试或调整裁切范围")
