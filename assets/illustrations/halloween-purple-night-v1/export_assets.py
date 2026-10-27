"""Reproducible, source-pixel-preserving crops authorized for Halloween 2026.

Run with the bundled Python runtime (Pillow + NumPy). No source art is redrawn.
All geometry is in source-image pixels; masks change alpha only.
"""
from pathlib import Path
from collections import deque
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
PACKAGE = Path(__file__).resolve().parent
OUTPUT = ROOT / "web/src/ui/art/halloween"
OUTPUT.mkdir(parents=True, exist_ok=True)
SOURCES = {
    "board": "design/concepts/halloween-purple-night-v2.png",
    "home": "design/concepts/halloween-home-purple-night-v2.png",
    "report": "design/concepts/halloween-report-purple-night-v2.png",
    "leaderboard": "design/concepts/halloween-leaderboard-purple-night-v3.png",
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def retain_polygons(image, polygons, subtract=()):
    mask = Image.new("L", image.size)
    draw = ImageDraw.Draw(mask)
    for polygon in polygons:
        draw.polygon(polygon, fill=255)
    for polygon in subtract:
        draw.polygon(polygon, fill=0)
    out = image.copy()
    out.putalpha(mask)
    return out


def feather_within(image, radius=10):
    """Ten inward alpha bands; never adds source/UI pixels outside the mask."""
    eroded = image.getchannel("A")
    soft = Image.new("L", image.size)
    for step in range(1, radius + 1):
        eroded = eroded.filter(ImageFilter.MinFilter(3))
        band = eroded.point(lambda value, factor=step / radius: round(value * factor))
        soft = ImageChops.lighter(soft, band)
    image.putalpha(soft)
    return image


manifest = {
    "authorization": "2026-10-27 user: 可以，按这个图片来切图适配",
    "scope": "Only isolated Halloween illustration/decoration. No UI text, controls, complete tickets or page screenshots.",
    "sources": {},
    "assets": {},
}

for name, relative in SOURCES.items():
    source = ROOT / relative
    snapshot = PACKAGE / "sources" / f"{name}.png"
    snapshot.parent.mkdir(exist_ok=True)
    if not snapshot.exists():
        shutil.copyfile(source, snapshot)
    if digest(snapshot) != digest(source):
        raise ValueError(f"Source snapshot mismatch: {relative}")
    manifest["sources"][name] = {"path": relative, "snapshot": str(snapshot.relative_to(PACKAGE)), "sha256": digest(source)}

board = Image.open(PACKAGE / "sources/board.png").convert("RGBA")
home = Image.open(PACKAGE / "sources/home.png").convert("RGBA")


def save(name, result, original, crop, geometry, note):
    # Some image viewers ignore WebP alpha when displaying RGB. Clear fully
    # transparent pixels as well, so hidden UI RGB is not retained in the asset.
    clean = np.array(result)
    clean[clean[:, :, 3] == 0] = 0
    result = Image.fromarray(clean, "RGBA")
    path = OUTPUT / name
    if path.suffix == ".webp":
        result.save(path, lossless=True, method=6, exact=True)
    else:
        result.save(path, optimize=True)
    decoded = np.array(Image.open(path).convert("RGBA"))
    expected = np.array(original.crop(crop))
    opaque = decoded[:, :, 3] == 255
    matched = bool(np.array_equal(decoded[opaque, :3], expected[opaque, :3]))
    if not matched:
        raise ValueError(f"Opaque RGB changed for {name}")
    manifest["assets"][name] = {
        "path": str(path.relative_to(ROOT)), "width": result.width, "height": result.height,
        "bytes": path.stat().st_size, "sha256": digest(path), "crop": crop,
        "geometry": geometry, "opaque_rgb_byte_exact": matched,
        "opaque_pixels": int(opaque.sum()), "note": note,
    }


# The full-height transparent strips retain the approved original placement.
# No logo, title, date pill, time label or control pixels are included.
left_polygons = [
    [(0, 0), (84, 0), (71, 20), (43, 22), (35, 50), (35, 102), (16, 156), (0, 181)],
    [(0, 90), (34, 95), (41, 105), (70, 105), (79, 121), (75, 158), (35, 167), (0, 223)],
    [(0, 216), (180, 216), (180, 335), (0, 353)],
]
left_exclude = [[(39, 173), (96, 173), (96, 232), (39, 232)]]
left = retain_polygons(board, left_polygons, left_exclude).crop((0, 0, 180, 365))
left = feather_within(left)
save("header-left.webp", left, board, (0, 0, 180, 365), {"keep_polygons_source": left_polygons, "remove_polygons_source": left_exclude, "feather_alpha": "10 one-pixel inward erosion bands, alpha 25.5 through 255; never expands outside selected polygons"},
     "Transparent left-edge tree/lantern/pumpkin/fence illustration. At 390px page width, show about 82px wide and 167px high, anchored top-left.")

right_polygons = [
    [(826, 85), (853, 79), (853, 214), (823, 207), (823, 160)],
    [(782, 192), (815, 180), (853, 181), (853, 365), (668, 365), (668, 282), (702, 278), (710, 250), (745, 224)],
]
right = retain_polygons(board, right_polygons).crop((650, 0, 853, 365))
right = feather_within(right)
save("header-right.webp", right, board, (650, 0, 853, 365), {"keep_polygons_source": right_polygons, "feather_alpha": "10 one-pixel inward erosion bands, alpha 25.5 through 255; never expands outside selected polygons"},
     "Transparent right-edge castle/pumpkin illustration. At 390px page width, show about 93px wide and 167px high, anchored top-right. Transparent source space retains placement.")

# Pure pumpkin emblem from the ticket, no ticket text/paper/background.
emblem_crop = (45, 506, 136, 591)
emblem = board.crop(emblem_crop)
pixels = np.array(emblem)
chroma = pixels[:, :, :3].max(axis=2).astype(float) - pixels[:, :, :3].min(axis=2)
alpha = np.clip((chroma - 30) / 12, 0, 1) * 255
pixels[:, :, 3] = np.rint(alpha).astype(np.uint8)
emblem = Image.fromarray(pixels, "RGBA")
save("pumpkin-emblem.png", emblem, board, emblem_crop,
     {"alpha": "clamp((RGB max-min - 30)/12, 0, 1); RGB remains unchanged"},
     "Original small pumpkin on the rush ticket. Native 91x85; no upscale. Use through the shared Icon catalog if treated as UI icon.")

# Empty frame is a union of only its actual illustrated pieces. The window
# interior is transparent, so the original dog, speech text and name cannot leak.
frame_polygons = [
    # Purple-orange awning including each scallop and its charcoal outline.
    [(76, 449), (139, 397), (174, 382), (206, 376), (650, 376), (686, 389), (772, 449),
     (777, 473), (773, 495), (758, 508), (742, 511), (731, 505), (724, 496), (710, 506),
     (688, 511), (666, 506), (650, 495), (637, 506), (615, 511), (592, 506), (578, 496),
     (561, 506), (541, 511), (518, 506), (504, 496), (490, 507), (468, 512), (447, 507),
     (430, 496), (414, 507), (392, 511), (369, 506), (355, 495), (340, 507), (317, 511),
     (295, 506), (282, 495), (268, 507), (245, 511), (223, 506), (207, 495), (192, 507),
     (171, 511), (149, 506), (135, 495), (120, 508), (99, 512), (83, 504), (75, 492)],
    # Left and right structural posts, separated from the editable window.
    [(108, 507), (151, 508), (151, 832), (108, 832)],
    [(706, 507), (756, 507), (756, 833), (706, 833)],
    # Hanging lantern; ornamental plant/pot and foreground pumpkin.
    [(88, 511), (102, 510), (105, 536), (123, 550), (122, 582), (112, 610), (92, 616), (66, 610), (55, 582), (56, 554), (81, 538)],
    [(68, 650), (94, 640), (111, 654), (124, 674), (147, 675), (160, 687), (168, 706),
     (186, 707), (198, 718), (202, 737), (187, 752), (173, 760), (172, 775), (157, 788),
     (168, 800), (162, 827), (149, 833), (69, 833), (58, 822), (55, 790), (37, 775),
     (29, 752), (34, 734), (42, 721), (41, 698), (48, 675)],
    [(205, 723), (220, 718), (223, 738), (239, 742), (258, 755), (275, 781), (283, 807),
     (278, 825), (265, 833), (181, 833), (173, 820), (173, 787), (182, 759), (200, 743)],
    # Original scissors sign, independent of the speech bubble.
    [(720, 550), (797, 550), (810, 559), (810, 650), (800, 660), (721, 660), (712, 650), (712, 560)],
    # Counter with the original single paw mark. No name plaque.
    [(65, 832), (782, 832), (793, 841), (795, 853), (784, 863), (783, 915), (772, 925),
     (74, 925), (61, 916), (61, 864), (52, 858), (52, 843)],
]
frame_holes = [
    # Speech bubble covers part of the post in the reference; pixels hidden
    # there are unavailable and remain transparent (never reconstructed).
    [(474, 507), (727, 507), (734, 579), (722, 618), (575, 646), (541, 654), (528, 650), (522, 632), (474, 619)],
    # Name plaque overlaps right post/counter; live plaque covers this notch.
    [(608, 768), (783, 768), (783, 852), (608, 852)],
]
frame_crop = (24, 374, 824, 944)
frame = retain_polygons(home, frame_polygons, frame_holes).crop(frame_crop)
save("storefront.webp", frame, home, frame_crop,
     {"keep_polygons_source": frame_polygons, "remove_polygons_source": frame_holes,
      "window_local_rect": [127, 137, 556, 321],
      "speech_overlay_local_rect": [450, 133, 262, 151],
      "name_overlay_local_rect": [584, 394, 175, 84]},
     "Native 800x570 empty illustrated frame. Transparent interior needs a warm CSS window backing; actual pet, speech and plaque remain live components. Portions hidden under original speech/plaque cannot be recovered, so live overlays must cover the declared transparent notches.")

# Preserve original letterforms, alpha and orange pixels. Only the neutral
# dark ink is deterministically mapped to the selected warm cream variant.
wordmarks = ["title-zh", "title-en", "smart-scheduling", "grooming-report-card", "hall-title-zh", "hall-title-en"]
for name in wordmarks:
    source = ROOT / f"web/src/ui/art/{name}.webp"
    image = Image.open(source).convert("RGBA")
    original = np.array(image)
    pixels = original.copy()
    colors = pixels[:, :, :3].astype(np.int16)
    neutral_dark = (colors.max(axis=2) < 125) & (colors.max(axis=2) - colors.min(axis=2) <= 42) & (pixels[:, :, 3] > 0)
    pixels[neutral_dark, :3] = [255, 244, 223]
    output = OUTPUT / f"{name}.webp"
    Image.fromarray(pixels, "RGBA").save(output, lossless=True, method=6, exact=True)
    decoded = np.array(Image.open(output).convert("RGBA"))
    unchanged_outside = bool(np.array_equal(decoded[~neutral_dark], original[~neutral_dark]))
    alpha_exact = bool(np.array_equal(decoded[:, :, 3], original[:, :, 3]))
    if not unchanged_outside or not alpha_exact:
        raise ValueError(f"Unintended wordmark change: {name}")
    manifest["assets"][f"{name}.webp"] = {
        "path": str(output.relative_to(ROOT)), "source": str(source.relative_to(ROOT)),
        "source_sha256": digest(source), "width": image.width, "height": image.height,
        "bytes": output.stat().st_size, "sha256": digest(output), "changed_pixels": int(neutral_dark.sum()),
        "selector": "max RGB <125 and max-min<=42 and alpha>0", "replacement_rgb": [255, 244, 223],
        "alpha_byte_exact": alpha_exact, "all_other_pixels_byte_exact": unchanged_outside,
        "note": "Existing title art recolor only; no lettering, shape, orange detail or resolution changed.",
    }

# The selected mobile report uses one line. Split the two-line native artwork
# without resampling: strong-alpha connected components identify each word line,
# then their labels propagate into the original low-alpha antialias fringes.
inline_source = OUTPUT / "grooming-report-card.webp"
inline_pixels = np.array(Image.open(inline_source).convert("RGBA"))
height, width = inline_pixels.shape[:2]
labels = np.zeros((height, width), dtype=np.uint8)
strong = inline_pixels[:, :, 3] > 20
for yy, xx in zip(*np.nonzero(strong)):
    if labels[yy, xx]:
        continue
    queue = deque([(int(yy), int(xx))])
    labels[yy, xx] = 255
    points = []
    while queue:
        y, x = queue.popleft()
        points.append((y, x))
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and strong[ny, nx] and labels[ny, nx] == 0:
                labels[ny, nx] = 255
                queue.append((ny, nx))
    points = np.array(points)
    colors = np.median(inline_pixels[points[:, 0], points[:, 1], :3], axis=0)
    if points[:, 1].max() < 100:
        kind = 1  # original left orange emphasis marks
    elif points[:, 1].min() >= 995 and points[:, 0].max() < 210:
        kind = 4  # original right orange emphasis marks
    elif colors[0] - colors[1] < 25 and points[:, 0].mean() < 190:
        kind = 2  # Grooming, warm-cream original letter shapes
    else:
        kind = 3  # Report Card, original orange letter shapes
    labels[points[:, 0], points[:, 1]] = kind
queue = deque((int(y), int(x)) for y, x in zip(*np.nonzero(labels)))
while queue:
    y, x = queue.popleft()
    for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
        if 0 <= ny < height and 0 <= nx < width and inline_pixels[ny, nx, 3] > 0 and labels[ny, nx] == 0:
            labels[ny, nx] = labels[y, x]
            queue.append((ny, nx))
for y, x in zip(*np.nonzero((inline_pixels[:, :, 3] > 0) & (labels == 0))):
    # Isolated low-alpha source flecks retain their original pixels as well.
    r, g, _ = inline_pixels[y, x, :3]
    labels[y, x] = 1 if x < 100 else 4 if x >= 995 and y < 210 else 2 if y < 190 and int(r) - int(g) < 25 else 3
parts = []
for kind in (1, 2, 3, 4):
    data = np.zeros_like(inline_pixels)
    chosen = labels == kind
    data[chosen] = inline_pixels[chosen]
    part = Image.fromarray(data, "RGBA")
    box = part.getbbox()
    parts.append((kind, part.crop(box), box))
gap = [16, 28, 16]
inline_height = max(part.height for _, part, _ in parts) + 8
inline_width = sum(part.width for _, part, _ in parts) + sum(gap) + 8
inline = Image.new("RGBA", (inline_width, inline_height))
placements = []
cursor = 4
for index, (kind, part, box) in enumerate(parts):
    top = (inline_height - part.height) // 2
    inline.paste(part, (cursor, top))
    restored = np.array(inline.crop((cursor, top, cursor + part.width, top + part.height)))
    if not np.array_equal(restored, np.array(part)):
        raise ValueError("Inline title changed source pixels")
    placements.append({"part": {1: "left emphasis", 2: "Grooming", 3: "Report Card", 4: "right emphasis"}[kind], "source_crop": box, "output_xy": [cursor, top], "native_size": list(part.size), "rgba_byte_exact": True})
    cursor += part.width + (gap[index] if index < len(gap) else 0)
inline_path = OUTPUT / "grooming-report-card-inline.webp"
inline.save(inline_path, lossless=True, method=6, exact=True)
decoded_inline = np.array(Image.open(inline_path).convert("RGBA"))
if not np.array_equal(decoded_inline, np.array(inline)):
    raise ValueError("Lossless inline output changed composed RGBA")
if int(np.count_nonzero(decoded_inline[:, :, 3])) != int(np.count_nonzero(inline_pixels[:, :, 3])):
    raise ValueError("Inline title lost or duplicated foreground pixels")
manifest["assets"][inline_path.name] = {
    "path": str(inline_path.relative_to(ROOT)), "source": str(inline_source.relative_to(ROOT)),
    "source_sha256": digest(inline_source), "width": inline_width, "height": inline_height,
    "bytes": inline_path.stat().st_size, "sha256": digest(inline_path), "parts": placements,
    "layout": "Native-size parts centered vertically on one equal-height transparent canvas; original emphasis marks retained",
    "resampling": False, "foreground_rgba_byte_exact": True,
    "foreground_pixel_count": int(np.count_nonzero(decoded_inline[:, :, 3])),
    "note": "Single-line derivative of the two-line source. Every nontransparent original pixel is retained exactly once; original two-line file remains unchanged.",
}

(PACKAGE / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({name: {key: value for key, value in data.items() if key in ("width", "height", "bytes", "opaque_rgb_byte_exact", "alpha_byte_exact")} for name, data in manifest["assets"].items()}, indent=2))
