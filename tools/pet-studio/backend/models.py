"""Validated, normalized settings shared by API and persisted job snapshots."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Crop(StrictModel):
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    width: float = Field(gt=0, le=1)
    height: float = Field(gt=0, le=1)

    @model_validator(mode="after")
    def fits_image(self):
        if self.x + self.width > 1.000001 or self.y + self.height > 1.000001:
            raise ValueError("裁切框必须完整位于照片内")
        return self


class Settings(StrictModel):
    crop: Crop
    style: Literal["natural", "sticker", "soft"] = "sticker"
    output_size: Literal[512, 1024] = 1024
    border: int = Field(default=12, ge=0, le=24, strict=True)
    shadow: bool = True
    subject_scale: float = Field(default=0.82, ge=0.55, le=0.95)


class SaveSettings(StrictModel):
    expected_revision: int = Field(ge=1, strict=True)
    settings: Settings


class ProcessRequest(StrictModel):
    expected_revision: int = Field(ge=1, strict=True)


class SelectionRequest(StrictModel):
    asset_id: str = Field(min_length=1, max_length=100)


def default_settings(crop=None):
    return Settings(crop=Crop(**(crop or {"x": 0, "y": 0, "width": 1, "height": 1}))).model_dump()
