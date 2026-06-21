#!/usr/bin/env python3
"""
Classify a single image with the trained ResNet18 model.
Includes TTA (test-time augmentation) by default.
"""

import argparse
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms
import cv2
import numpy as np
from crop_utils import crop_candy


CROP_SIZE = 224


def parse_args():
    parser = argparse.ArgumentParser(description="Classify a candy image.")
    parser.add_argument("image", type=str, help="Path to image file")
    parser.add_argument("--model-path", type=str, default="model_resnet.pth", help="Trained model checkpoint")
    parser.add_argument("--top-k", type=int, default=3, help="Show top K predictions")
    parser.add_argument("--no-tta", action="store_true", help="Disable test-time augmentation")
    return parser.parse_args()


def crear_modelo(num_clases):
    modelo = models.resnet18(weights=None)
    modelo.fc = nn.Sequential(nn.Dropout(0.4), nn.Linear(512, num_clases))
    return modelo


def classify(image_path, model_path, use_tta=True, top_k=3):
    device = torch.device("mps" if torch.backends.mps.is_available() else
                          "cuda" if torch.cuda.is_available() else "cpu")

    if not Path(model_path).exists():
        print(f"[!] ERROR: model not found: {model_path}")
        sys.exit(1)

    ck = torch.load(model_path, map_location=device)
    classes = ck["classes"]
    model = crear_modelo(len(classes))
    model.load_state_dict(ck["model_state_dict"])
    model.to(device).eval()

    norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    to_t = transforms.ToTensor()
    rsz = transforms.Resize((CROP_SIZE, CROP_SIZE))

    _bgr = cv2.imread(image_path)
    _crop = crop_candy(_bgr) if _bgr is not None else None
    if _crop is not None:
        img = Image.fromarray(cv2.cvtColor(_crop, cv2.COLOR_BGR2RGB))
    else:
        img = Image.open(image_path).convert("RGB")

    if use_tta:
        variants = [
            rsz(img),
            rsz(img).transpose(Image.FLIP_LEFT_RIGHT),
            rsz(img).transpose(Image.FLIP_TOP_BOTTOM),
            transforms.CenterCrop(CROP_SIZE)(transforms.Resize((int(CROP_SIZE * 1.1), int(CROP_SIZE * 1.1)))(img)),
        ]
        probs_sum = torch.zeros(len(classes), device=device)
        with torch.no_grad():
            for v in variants:
                t = norm(to_t(v)).unsqueeze(0).to(device)
                probs_sum += torch.softmax(model(t), dim=1)[0]
        probs = probs_sum / len(variants)
    else:
        t = norm(to_t(rsz(img))).unsqueeze(0).to(device)
        with torch.no_grad():
            probs = torch.softmax(model(t), dim=1)[0]

    conf, idx = probs.max(0)
    pred_class = classes[idx.item()]

    top_indices = np.argsort(probs.cpu().numpy())[::-1][:top_k]
    top = [(classes[i], float(probs[i])) for i in top_indices]
    return pred_class, float(conf), top


def main():
    args = parse_args()
    pred_class, conf, top = classify(args.image, args.model_path, use_tta=not args.no_tta, top_k=args.top_k)

    print(f"[+] Prediction: {pred_class} ({conf:.1%})")
    print("[+] Top predictions:")
    for label, p in top:
        print(f"    - {label}: {p:.1%}")


if __name__ == "__main__":
    main()
