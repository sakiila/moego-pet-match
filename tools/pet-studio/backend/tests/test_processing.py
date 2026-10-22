from PIL import Image, ImageChops, ImageDraw

from backend.processing import clean_cutout, compose, illustration_filter


def sample_cutout():
    image = Image.new("RGBA", (140, 180))
    drawing = ImageDraw.Draw(image)
    for y in range(15, 165):
        drawing.line((20, y, 120, y), fill=(80 + y // 2, 40 + y, 71, 255))
    return clean_cutout(image)


def test_photo_styles_keep_transparency_and_apply_real_visual_changes():
    subject = sample_cutout()
    common = dict(subject_scale=.72, border=12, shadow=False)
    natural, plain = compose(subject, {**common, "style": "natural"})
    sticker, _ = compose(subject, {**common, "style": "sticker"})
    soft, _ = compose(subject, {**common, "style": "soft"})
    assert ImageChops.difference(natural, plain).getbbox() is None
    assert sticker.getchannel("A").getbbox() != natural.getchannel("A").getbbox()
    assert ImageChops.difference(soft.convert("RGB"), sticker.convert("RGB")).getbbox()
    assert natural.getpixel((0, 0))[3] == sticker.getpixel((0, 0))[3] == soft.getpixel((0, 0))[3] == 0
    assert illustration_filter(subject).getchannel("A").tobytes() == subject.getchannel("A").tobytes()


def test_shadow_and_large_subject_stay_inside_canvas():
    result, _ = compose(sample_cutout(), dict(style="sticker", subject_scale=.95, border=24, shadow=True))
    alpha = result.getchannel("A")
    assert alpha.getbbox()
    assert alpha.crop((0, 0, 1024, 1)).getextrema()[1] == 0
    assert alpha.crop((0, 1023, 1024, 1024)).getextrema()[1] == 0
