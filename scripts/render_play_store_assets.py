from __future__ import annotations

import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "android" / "play-store" / "assets"
SOURCE = ASSETS / "source"
MARKETING = ASSETS / "marketing"
CONFIG = MARKETING / "campaign.en.json"
AI_POLISH = SOURCE / "ai-polish" / "en"
CANVAS = (1080, 1920)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/seguisb.ttf") if bold else Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf") if bold else Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf") if bold else Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def wrap_text(draw: ImageDraw.ImageDraw, text: str, selected_font: ImageFont.FreeTypeFont, max_width: int) -> str:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), candidate, font=selected_font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return "\n".join(lines)


def add_vignette(canvas: Image.Image, strength: int = 75) -> Image.Image:
    overlay = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for index in range(12):
        inset = index * 18
        alpha = round(strength * (1 - index / 12) ** 2)
        draw.rounded_rectangle(
            (inset, inset, CANVAS[0] - inset, CANVAS[1] - inset),
            radius=90,
            outline=(0, 4, 24, alpha),
            width=26,
        )
    return Image.alpha_composite(canvas.convert("RGBA"), overlay.filter(ImageFilter.GaussianBlur(22)))


def draw_pill(
    canvas: Image.Image,
    position: tuple[int, int],
    text: str,
    fill: tuple[int, int, int, int] = (5, 20, 58, 220),
    text_fill: tuple[int, int, int, int] = (255, 255, 255, 255),
    size: int = 25,
    outline: tuple[int, int, int, int] = (255, 255, 255, 48),
) -> tuple[int, int]:
    draw = ImageDraw.Draw(canvas)
    selected_font = font(size, bold=True)
    box = draw.textbbox((0, 0), text, font=selected_font)
    width = box[2] - box[0] + 42
    height = box[3] - box[1] + 28
    x, y = position
    draw.rounded_rectangle((x, y, x + width, y + height), radius=height // 2, fill=fill, outline=outline, width=2)
    draw.text((x + 21, y + 11), text, font=selected_font, fill=text_fill)
    return width, height


def draw_copy(
    canvas: Image.Image,
    headline: str,
    subhead: str,
    position: tuple[int, int],
    max_width: int,
    align: str = "left",
    headline_size: int = 78,
    subhead_size: int = 30,
    panel: bool = False,
) -> None:
    layer = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    headline_font = font(headline_size, bold=True)
    subhead_font = font(subhead_size)
    headline_box = draw.multiline_textbbox((0, 0), headline, font=headline_font, spacing=-5, align=align)
    title_width = headline_box[2] - headline_box[0]
    title_height = headline_box[3] - headline_box[1]
    wrapped = wrap_text(draw, subhead, subhead_font, max_width)
    sub_box = draw.multiline_textbbox((0, 0), wrapped, font=subhead_font, spacing=7, align=align)
    sub_width = sub_box[2] - sub_box[0]
    sub_height = sub_box[3] - sub_box[1]
    x, y = position
    if align == "right":
        title_x = x - title_width
        sub_x = x - sub_width
        panel_left = min(title_x, sub_x) - 28
        panel_right = x + 28
    else:
        title_x = x
        sub_x = x
        panel_left = x - 28
        panel_right = x + max(title_width, sub_width) + 28
    draw.multiline_text((title_x + 5, y + 7), headline, font=headline_font, fill=(0, 4, 25, 180), spacing=-5, align=align)
    draw.multiline_text((title_x, y), headline, font=headline_font, fill=(255, 255, 255, 255), spacing=-5, align=align)
    sub_y = y + title_height + 24
    draw.multiline_text((sub_x, sub_y), wrapped, font=subhead_font, fill=(220, 233, 255, 255), spacing=7, align=align)
    canvas.alpha_composite(layer)


def make_screen_card(screen: Image.Image, width: int, height: int) -> Image.Image:
    border = 18
    card = Image.new("RGBA", (width + border * 2, height + border * 2), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle(
        (0, 0, card.width - 1, card.height - 1),
        radius=58,
        fill=(252, 253, 255, 255),
        outline=(255, 255, 255, 230),
        width=3,
    )
    fitted = ImageOps.fit(screen.convert("RGB"), (width, height), method=Image.Resampling.LANCZOS)
    card.paste(fitted, (border, border), rounded_mask((width, height), 43))
    return card


def place_screen_card(
    canvas: Image.Image,
    screen: Image.Image,
    position: tuple[int, int],
    width: int,
    angle: float,
) -> None:
    height = round(width * 16 / 9)
    card = make_screen_card(screen, width, height)
    rotated = card.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    shadow = Image.new("RGBA", rotated.size, (0, 0, 0, 0))
    shadow.putalpha(rotated.getchannel("A").filter(ImageFilter.GaussianBlur(24)))
    black = Image.new("RGBA", rotated.size, (0, 0, 0, 165))
    black.putalpha(shadow.getchannel("A"))
    x, y = position
    canvas.alpha_composite(black, (x + 14, y + 24))
    canvas.alpha_composite(rotated, (x, y))


def render_campaign_slide(item: dict[str, str]) -> Path:
    background = cover(Image.open(SOURCE / "backgrounds" / item["background"]), CANVAS)
    screen = Image.open(SOURCE / "screens" / item["screen"])
    canvas = add_vignette(background.convert("RGBA"))
    layout = item["layout"]

    if layout == "hero-right":
        place_screen_card(canvas, screen, (205, 315), 820, -2.5)
        draw_copy(canvas, item["headline"], item["subhead"], (58, 60), 790, headline_size=74)

    elif layout == "modes-split":
        place_screen_card(canvas, screen, (392, 80), 690, 4.0)
        draw_copy(canvas, item["headline"], item["subhead"], (58, 340), 315, headline_size=92, subhead_size=29)

    elif layout == "variants-bottom":
        place_screen_card(canvas, screen, (20, 38), 735, -3.0)
        draw_copy(canvas, item["headline"], item["subhead"], (1018, 1450), 600, align="right", headline_size=76)

    elif layout == "online-diagonal":
        place_screen_card(canvas, screen, (22, 175), 735, 3.0)
        draw_copy(canvas, item["headline"], item["subhead"], (1018, 1460), 620, align="right", headline_size=72)

    elif layout == "custom-bottom":
        place_screen_card(canvas, screen, (340, 52), 710, 4.0)
        swatches = ((241, 64, 67), (255, 190, 31), (21, 181, 211), (117, 76, 228))
        draw = ImageDraw.Draw(canvas)
        for index, color in enumerate(swatches):
            x = 62 + index * 76
            draw.ellipse((x, 250, x + 58, 308), fill=(*color, 255), outline=(255, 255, 255, 230), width=4)
        draw_copy(canvas, item["headline"], item["subhead"], (58, 1395), 590, headline_size=88)

    elif layout == "languages-stack":
        place_screen_card(canvas, screen, (345, 332), 675, -2.5)
        draw_copy(canvas, item["headline"], item["subhead"], (58, 78), 760, headline_size=78)

    else:
        raise ValueError(f"Unknown layout: {layout}")

    output = MARKETING / item["output"]
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, format="PNG", optimize=True)
    return output


def warp_tabletop_screen(background: Image.Image, screen: Image.Image) -> Image.Image:
    background_array = cv2.cvtColor(np.array(background.convert("RGB")), cv2.COLOR_RGB2BGR)
    screen_array = cv2.cvtColor(np.array(screen.convert("RGB")), cv2.COLOR_RGB2BGR)
    height, width = screen_array.shape[:2]
    source_points = np.float32([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]])
    destination_points = np.float32([[550, 628], [785, 699], [500, 1165], [235, 1078]])
    transform = cv2.getPerspectiveTransform(source_points, destination_points)
    warped = cv2.warpPerspective(screen_array, transform, (background_array.shape[1], background_array.shape[0]))
    source_mask = np.full((height, width), 255, dtype=np.uint8)
    mask = cv2.warpPerspective(source_mask, transform, (background_array.shape[1], background_array.shape[0]))
    mask = cv2.GaussianBlur(mask, (3, 3), 0)
    alpha = (mask.astype(np.float32) / 255.0)[:, :, None]
    composited = (warped.astype(np.float32) * alpha + background_array.astype(np.float32) * (1 - alpha)).astype(np.uint8)
    cv2.ellipse(composited, (666, 676), (35, 10), 16, 0, 360, (6, 7, 10), -1, cv2.LINE_AA)
    return Image.fromarray(cv2.cvtColor(composited, cv2.COLOR_BGR2RGB))


def render_tabletop(item: dict[str, str]) -> Path:
    background = Image.open(SOURCE / "backgrounds" / item["background"]).convert("RGB")
    screen = Image.open(SOURCE / "screens" / item["screen"]).convert("RGB")
    scene = cover(warp_tabletop_screen(background, screen), CANVAS).convert("RGBA")
    scene = add_vignette(scene, 55)

    overlay = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.text((58, 76), "TABLETOP MODE", font=font(30, bold=True), fill=(255, 198, 42, 255), stroke_width=2, stroke_fill=(0, 8, 32, 210))
    scene.alpha_composite(overlay)

    draw_copy(scene, item["headline"], "", (58, 210), 600, headline_size=82)
    draw_copy(scene, "", item["subhead"], (1020, 1640), 500, align="right", headline_size=1, subhead_size=34)

    output = MARKETING / item["output"]
    output.parent.mkdir(parents=True, exist_ok=True)
    scene.convert("RGB").save(output, format="PNG", optimize=True)
    return output


def contact_sheet(paths: list[Path]) -> Path:
    thumb_w, thumb_h, gap, cols = 270, 480, 24, 4
    rows = math.ceil(len(paths) / cols)
    sheet = Image.new("RGB", (cols * thumb_w + (cols + 1) * gap, rows * thumb_h + (rows + 1) * gap), "#071333")
    for index, path in enumerate(paths):
        image = cover(Image.open(path), (thumb_w, thumb_h))
        x = gap + (index % cols) * (thumb_w + gap)
        y = gap + (index // cols) * (thumb_h + gap)
        sheet.paste(image, (x, y))
    output = MARKETING / "preview-contact-sheet.png"
    sheet.save(output, format="PNG", optimize=True)
    return output


def validate(paths: list[Path]) -> None:
    for path in paths:
        with Image.open(path) as image:
            if image.size != CANVAS:
                raise ValueError(f"{path} is {image.size}, expected {CANVAS}")
            if image.mode != "RGB":
                raise ValueError(f"{path} is {image.mode}, expected opaque RGB")
            if path.stat().st_size > 8 * 1024 * 1024:
                raise ValueError(f"{path} exceeds 8 MB")


def apply_ai_polish(paths: list[Path]) -> None:
    for output in paths:
        polished = AI_POLISH / output.name
        if polished.exists():
            cover(Image.open(polished), CANVAS).save(output, format="PNG", optimize=True)


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    outputs = [render_campaign_slide(item) for item in config["slides"]]
    outputs.append(render_tabletop(config["extra"]))
    apply_ai_polish(outputs)
    validate(outputs)
    sheet = contact_sheet(outputs)
    print("Rendered Play Store campaign:")
    for output in outputs:
        print(f"- {output.relative_to(ROOT)}")
    print(f"- {sheet.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
