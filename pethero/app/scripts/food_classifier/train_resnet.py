#!/usr/bin/env python3
"""
Train a ResNet18 candy classifier from labeled images.

Expects:
    data_dir/
        candy_one/
            img1.png
            ...
        candy_two/
            ...

Saves:
    model_resnet.pth   checkpoint with model weights + class list
"""

import argparse
import os
import sys
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, models, transforms


def parse_args():
    parser = argparse.ArgumentParser(description="Train a ResNet18 candy classifier.")
    parser.add_argument("--data-dir", type=str, default="dataset", help="Root folder with class subfolders")
    parser.add_argument("--model-path", type=str, default="model_resnet.pth", help="Where to save the trained model")
    parser.add_argument("--epochs", type=int, default=25, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--val-split", type=float, default=0.2, help="Fraction held out for validation")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    return parser.parse_args()


def crear_modelo(num_clases):
    """ResNet18 with a dropout + linear head for fine-tuning."""
    modelo = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    for param in modelo.parameters():
        param.requires_grad = False
    # Only train the new head (and the last conv block for better adaptation)
    for param in modelo.layer4.parameters():
        param.requires_grad = True
    modelo.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(512, num_clases),
    )
    return modelo


def main():
    args = parse_args()
    data_dir = Path(args.data_dir)
    if not data_dir.is_dir():
        print(f"[!] ERROR: data directory not found: {data_dir}")
        sys.exit(1)

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    device = torch.device("mps" if torch.backends.mps.is_available() else
                          "cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Device: {device}")

    # Transforms: heavy augmentation for small candy datasets
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(180),
        transforms.ColorJitter(brightness=0.25, contrast=0.2, saturation=0.05, hue=0.02),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    full_dataset = datasets.ImageFolder(root=str(data_dir), transform=train_transform)
    classes = full_dataset.classes
    num_classes = len(classes)
    print(f"[+] Classes: {classes}")
    print(f"[+] Total samples: {len(full_dataset)}")

    if num_classes < 2:
        print("[!] ERROR: need at least 2 classes to train a classifier.")
        sys.exit(1)

    val_size = int(len(full_dataset) * args.val_split)
    train_size = len(full_dataset) - val_size
    train_ds, val_ds = random_split(full_dataset, [train_size, val_size],
                                    generator=torch.Generator().manual_seed(args.seed))
    # Override val transform
    val_ds.dataset.transform = val_transform

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    model = crear_modelo(num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", patience=3, factor=0.5)

    best_val_acc = 0.0
    for epoch in range(1, args.epochs + 1):
        # --- train ---
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
            train_total += labels.size(0)

        train_acc = train_correct / train_total

        # --- validate ---
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        val_acc = val_correct / val_total if val_total > 0 else 0.0
        scheduler.step(val_acc)

        print(f"Epoch {epoch:02d}/{args.epochs}  "
              f"train_loss={train_loss/train_total:.4f}  "
              f"train_acc={train_acc:.2%}  "
              f"val_acc={val_acc:.2%}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            checkpoint = {
                "classes": classes,
                "model_state_dict": model.state_dict(),
                "num_classes": num_classes,
            }
            torch.save(checkpoint, args.model_path)
            print(f"    [+] Saved best model (val_acc={val_acc:.2%})")

    print(f"[+] Training complete. Best val accuracy: {best_val_acc:.2%}")
    print(f"[+] Model saved to: {args.model_path}")


if __name__ == "__main__":
    main()
