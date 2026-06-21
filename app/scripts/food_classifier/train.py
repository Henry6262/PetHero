#!/usr/bin/env python3
"""
Train a lightweight food/candy classifier from labeled images.

Expects a directory layout like:
    data_dir/
        class_a/
            img1.png
            img2.jpg
        class_b/
            img3.png
            ...

Saves:
    model.pkl            trained SVM classifier
    label_encoder.pkl    class-name encoder
"""

import argparse
import os
import sys
import time
from pathlib import Path

import cv2
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC
from skimage.feature import hog


def parse_args():
    parser = argparse.ArgumentParser(description="Train a food classifier from labeled images.")
    parser.add_argument("--data-dir", type=str, default="dataset", help="Root folder with class subfolders")
    parser.add_argument("--model-dir", type=str, default=".", help="Where to save model.pkl and label_encoder.pkl")
    parser.add_argument("--size", type=int, default=128, help="Resize images to size x size before feature extraction")
    parser.add_argument("--test-size", type=float, default=0.2, help="Fraction of data held out for validation")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    return parser.parse_args()


def load_image_paths(data_dir):
    """Return list of (path, class_name) tuples found under data_dir."""
    data_dir = Path(data_dir)
    if not data_dir.is_dir():
        print(f"[!] ERROR: data directory not found: {data_dir}")
        sys.exit(1)

    samples = []
    for class_dir in sorted(data_dir.iterdir()):
        if not class_dir.is_dir():
            continue
        for ext in ("*.png", "*.jpg", "*.jpeg"):
            for img_path in class_dir.glob(ext):
                samples.append((str(img_path), class_dir.name))

    if not samples:
        print(f"[!] ERROR: no images found under {data_dir}")
        sys.exit(1)

    return samples


def extract_features(image_path, size):
    """Load image, resize, convert to grayscale, and return HOG feature vector."""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"could not load {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (size, size))
    features = hog(
        resized,
        orientations=9,
        pixels_per_cell=(8, 8),
        cells_per_block=(2, 2),
        visualize=False,
        feature_vector=True,
    )
    return features


def main():
    args = parse_args()

    print(f"[*] Loading samples from: {args.data_dir}")
    samples = load_image_paths(args.data_dir)
    print(f"[+] Found {len(samples)} images across {len(set(c for _, c in samples))} classes")

    X, y = [], []
    skipped = 0
    for path, label in samples:
        try:
            features = extract_features(path, args.size)
            X.append(features)
            y.append(label)
        except Exception as e:
            print(f"[!] Skipping {path}: {e}")
            skipped += 1

    X = np.array(X)
    y = np.array(y)
    print(f"[+] Extracted features: {X.shape}")
    if skipped:
        print(f"[!] Skipped {skipped} images")

    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=args.test_size, random_state=args.seed, stratify=y_encoded
    )

    print("[*] Training SVM classifier...")
    start = time.time()
    clf = SVC(kernel="linear", probability=True, random_state=args.seed)
    clf.fit(X_train, y_train)
    elapsed = time.time() - start

    train_acc = clf.score(X_train, y_train)
    test_acc = clf.score(X_test, y_test)

    print(f"[+] Training done in {elapsed:.2f}s")
    print(f"    - Train accuracy: {train_acc:.2%}")
    print(f"    - Test accuracy:  {test_acc:.2%}")

    model_dir = Path(args.model_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, model_dir / "model.pkl")
    joblib.dump(encoder, model_dir / "label_encoder.pkl")
    print(f"[+] Saved model.pkl and label_encoder.pkl to {model_dir}")


if __name__ == "__main__":
    main()
