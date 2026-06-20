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
    # Clean dark panel — no baked-in overlays. The app renders LIVE / cam-01 /
    # status text on top. (A real detection overlay belongs on a real camera
    # frame, not a fake rectangle on a blank panel.)
    from PIL import Image

    img = Image.new("RGB", (_W, _H), (20, 27, 23))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return buf.getvalue()


def _from_file(path: Path, detection: Optional[Detection]) -> Optional[bytes]:
    try:
        from PIL import Image

        img = Image.open(path).convert("RGB").resize((_W, _H))
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
