"""Crop a candy from a top-down table shot.
Tags live in the 4 corners, the candy is central — so we drop the corner
margins first (geometric, no fragile tag detection), then segment the most
colorful blob. Falls back to the center region if segmentation finds nothing."""
import cv2
import numpy as np


def _letterbox(crop, out_size):
    ch, cw = crop.shape[:2]
    s = out_size / max(ch, cw)
    rz = cv2.resize(crop, (max(1, int(cw * s)), max(1, int(ch * s))), interpolation=cv2.INTER_AREA)
    edge = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    fill = tuple(int(v) for v in np.median(edge, axis=0))
    canvas = np.full((out_size, out_size, 3), fill, np.uint8)
    oy, ox = (out_size - rz.shape[0]) // 2, (out_size - rz.shape[1]) // 2
    canvas[oy:oy + rz.shape[0], ox:ox + rz.shape[1]] = rz
    return canvas


def crop_candy(bgr, pad=14, out_size=224, margin=0.16):
    h, w = bgr.shape[:2]
    mx, my = int(w * margin), int(h * margin)
    roi = bgr[my:h - my, mx:w - mx]
    rh, rw = roi.shape[:2]
    hsv = cv2.cvtColor(cv2.GaussianBlur(roi, (5, 5), 0), cv2.COLOR_BGR2HSV)
    S, V = hsv[:, :, 1], hsv[:, :, 2]
    mask = ((S > 70) & (V > 40)).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = [c for c in cnts if cv2.contourArea(c) > 80]
    if not cnts:
        return _letterbox(roi, out_size)  # fallback: center region
    c = max(cnts, key=cv2.contourArea)
    x, y, bw, bh = cv2.boundingRect(c)
    x0, y0 = max(0, x - pad), max(0, y - pad)
    x1, y1 = min(rw, x + bw + pad), min(rh, y + bh + pad)
    return _letterbox(roi[y0:y1, x0:x1], out_size)
