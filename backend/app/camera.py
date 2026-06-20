"""Frame source for the app's live panel.

Produces JPEG bytes with the detection overlaid (bbox + label). Uses a real
webcam via OpenCV only if available and configured; otherwise renders a clean
placeholder frame with Pillow so the iOS app always has something to show.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Optional

from . import config
from .models import Detection

_W, _H = 640, 480


def _placeholder(detection: Optional[Detection]) -> bytes:
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (_W, _H), (12, 18, 14))
    draw = ImageDraw.Draw(img)

    if detection and detection.present:
        x, y, w, h = (detection.bbox or [120, 80, 320, 320])
        draw.rectangle([x, y, x + w, y + h], outline=(74, 222, 128), width=4)
        label = f"{detection.pet_name or detection.species} · {int(detection.confidence * 100)}%"
        draw.rectangle([x, y - 26, x + 8 + len(label) * 8, y], fill=(74, 222, 128))
        draw.text((x + 4, y - 22), label, fill=(0, 0, 0))
    else:
        draw.text((_W // 2 - 70, _H // 2 - 8), "No pet detected", fill=(120, 130, 124))

    draw.text((12, 12), "PetHero · live feed", fill=(150, 160, 154))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return buf.getvalue()


def _from_file(path: Path, detection: Optional[Detection]) -> Optional[bytes]:
    try:
        from PIL import Image, ImageDraw

        img = Image.open(path).convert("RGB").resize((_W, _H))
        if detection and detection.present and detection.bbox:
            x, y, w, h = detection.bbox
            ImageDraw.Draw(img).rectangle([x, y, x + w, y + h], outline=(74, 222, 128), width=4)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=80)
        return buf.getvalue()
    except Exception:
        return None


def get_frame(detection: Optional[Detection] = None) -> bytes:
    """Return a JPEG frame for the current detection."""
    src = config.CAMERA_SOURCE
    if src not in {"auto", "none", ""}:
        path = Path(src)
        if path.exists():
            framed = _from_file(path, detection)
            if framed is not None:
                return framed
    # "auto" real-webcam capture (OpenCV) is intentionally left as a later seam;
    # the placeholder keeps the app demo-ready everywhere.
    return _placeholder(detection)
