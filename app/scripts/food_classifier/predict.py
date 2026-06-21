#!/usr/bin/env python3
"""
Classify a single image using the trained model.
"""

import argparse
import sys
from pathlib import Path

import cv2
import joblib
import numpy as np
from skimage.feature import hog


def parse_args():
    parser = argparse.ArgumentParser(description="Classify a food image.")
    parser.add_argument("image", type=str, help="Path to image file")
    parser.add_argument("--model-dir", type=str, default=".", help="Folder containing model.pkl and label_encoder.pkl")
    parser.add_argument("--size", type=int, default=128, help="Image size used during training")
    parser.add_argument("--top-k", type=int, default=3, help="Show top K predictions")
    return parser.parse_args()


def extract_features(image_path, size):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"could not load {image_path}")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (size, size))
    return hog(
        resized,
        orientations=9,
        pixels_per_cell=(8, 8),
        cells_per_block=(2, 2),
        visualize=False,
        feature_vector=True,
    )


def main():
    args = parse_args()
    model_dir = Path(args.model_dir)

    model_path = model_dir / "model.pkl"
    encoder_path = model_dir / "label_encoder.pkl"
    if not model_path.exists() or not encoder_path.exists():
        print(f"[!] ERROR: model files not found in {model_dir}")
        print("    Run train.py first.")
        sys.exit(1)

    clf = joblib.load(model_path)
    encoder = joblib.load(encoder_path)

    features = extract_features(args.image, args.size).reshape(1, -1)
    probs = clf.predict_proba(features)[0]
    pred_idx = int(np.argmax(probs))

    top_indices = np.argsort(probs)[::-1][: args.top_k]
    print(f"[+] Prediction for {args.image}: {encoder.inverse_transform([pred_idx])[0]} ({probs[pred_idx]:.1%})")
    print("[+] Top predictions:")
    for idx in top_indices:
        label = encoder.inverse_transform([idx])[0]
        print(f"    - {label}: {probs[idx]:.1%}")


if __name__ == "__main__":
    main()
