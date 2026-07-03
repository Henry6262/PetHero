"""
SCOUT — Tactical Change Detector
Team: SCOUT | EDTH Munich 2026
Challenge: 01-se3 Track 2 (Live Scene Intelligence)

Detects tactically relevant changes between two images while filtering
noise from lighting, shadows, and environmental factors.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple

import cv2
import numpy as np


@dataclass
class TacticalChange:
    """A detected change with tactical significance."""
    bbox: Tuple[int, int, int, int]      # (x, y, width, height)
    area: int                             # Pixel area of change
    area_ratio: float                     # Area as fraction of image
    significance: str                     # 'HIGH', 'MEDIUM', or 'LOW'
    change_type: str                      # Classification of change
    centroid: Tuple[int, int]             # Center point of change


class TacticalChangeDetector:
    """
    Detects tactically relevant changes between two images.

    Pipeline:
        1. Align images using ORB feature matching
        2. Compute pixel-wise difference
        3. Threshold and clean with morphological operations
        4. Extract connected components (regions of change)
        5. Filter by size and classify significance
        6. Classify change type (added/removed/replaced)
    """

    def __init__(
        self,
        min_change_area: int = 500,
        blur_kernel: Tuple[int, int] = (5, 5),
        morph_kernel_size: int = 5,
        significance_thresholds: Optional[dict] = None,
        orb_features: int = 5000,
        orb_matches: int = 50,
    ):
        self.min_change_area = min_change_area
        self.blur_kernel = blur_kernel
        self.morph_kernel = np.ones((morph_kernel_size, morph_kernel_size), np.uint8)
        self.orb_features = orb_features
        self.orb_matches = orb_matches

        # Significance thresholds (as fraction of image area)
        self.thresholds = significance_thresholds or {
            'HIGH': 0.05,    # > 5% of image
            'MEDIUM': 0.01,  # > 1% of image
            'LOW': 0.005,    # > 0.5% of image
        }

    def detect(
        self,
        before: np.ndarray | str,
        after: np.ndarray | str,
    ) -> List[TacticalChange]:
        """
        Detect changes between two images.

        Args:
            before: First image (numpy array or file path)
            after: Second image (numpy array or file path)

        Returns:
            List of TacticalChange objects, sorted by significance
        """
        # Load images
        before_img = self._load_image(before)
        after_img = self._load_image(after)

        if before_img is None or after_img is None:
            raise ValueError("Could not load one or both images")

        # Ensure same size
        after_img = cv2.resize(after_img, (before_img.shape[1], before_img.shape[0]))

        # Align 'after' to 'before'
        after_aligned = self._align_images(before_img, after_img)

        # Compute difference
        diff_mask = self._compute_difference(before_img, after_aligned)

        # Extract connected components
        changes = self._extract_changes(before_img, after_aligned, diff_mask)

        # Sort by significance (HIGH first)
        significance_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
        changes.sort(key=lambda c: significance_order.get(c.significance, 3))

        return changes

    def visualize(
        self,
        before: np.ndarray | str,
        after: np.ndarray | str,
        changes: Optional[List[TacticalChange]] = None,
        output_path: Optional[str] = None,
    ) -> np.ndarray:
        """
        Create a side-by-side visualization with change overlays.

        Args:
            before: First image
            after: Second image
            changes: Pre-computed changes (optional, will detect if None)
            output_path: If provided, save visualization to this path

        Returns:
            Combined visualization image
        """
        before_img = self._load_image(before)
        after_img = self._load_image(after)

        if changes is None:
            changes = self.detect(before_img, after_img)

        before_vis = before_img.copy()
        after_vis = after_img.copy()

        # Colors for significance levels (BGR)
        colors = {
            'HIGH': (0, 0, 255),      # Red
            'MEDIUM': (0, 140, 255),  # Orange
            'LOW': (0, 255, 0),       # Green
        }

        for change in changes:
            x, y, w, h = change.bbox
            color = colors.get(change.significance, (255, 255, 255))

            # Draw bounding boxes on both images
            cv2.rectangle(before_vis, (x, y), (x + w, y + h), color, 2)
            cv2.rectangle(after_vis, (x, y), (x + w, y + h), color, 2)

            # Label on after image
            label = f"{change.significance}: {change.change_type}"
            cv2.putText(
                after_vis, label, (x, max(y - 5, 15)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1,
            )

        # Combine side-by-side
        combined = np.hstack([before_vis, after_vis])

        # Add header labels
        h, w = combined.shape[:2]
        header = np.zeros((40, w, 3), dtype=np.uint8)
        mid = w // 2
        cv2.putText(header, "BEFORE", (mid // 2 - 40, 28),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(header, "AFTER", (mid + mid // 2 - 30, 28),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        combined = np.vstack([header, combined])

        # Add legend and stats
        legend_h = 60
        legend = np.zeros((legend_h, w, 3), dtype=np.uint8)
        y_offset = 20

        # Significance legend
        x_offset = 20
        for sig, color in colors.items():
            cv2.rectangle(legend, (x_offset, y_offset - 12),
                         (x_offset + 15, y_offset + 3), color, -1)
            cv2.putText(legend, sig, (x_offset + 20, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            x_offset += 80

        # Stats
        high = sum(1 for c in changes if c.significance == 'HIGH')
        med = sum(1 for c in changes if c.significance == 'MEDIUM')
        low = sum(1 for c in changes if c.significance == 'LOW')
        stats_text = f"Changes: {len(changes)} total | HIGH: {high} | MED: {med} | LOW: {low}"
        cv2.putText(legend, stats_text, (x_offset + 20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

        combined = np.vstack([combined, legend])

        if output_path:
            cv2.imwrite(output_path, combined)

        return combined

    # ------------------------------------------------------------------
    #  Internal Methods
    # ------------------------------------------------------------------

    def _load_image(self, img: np.ndarray | str) -> Optional[np.ndarray]:
        """Load image from path or return as-is if already array."""
        if isinstance(img, str):
            return cv2.imread(img)
        return img

    def _align_images(
        self, before: np.ndarray, after: np.ndarray
    ) -> np.ndarray:
        """Align 'after' to 'before' using ORB feature matching."""
        before_gray = cv2.cvtColor(before, cv2.COLOR_BGR2GRAY)
        after_gray = cv2.cvtColor(after, cv2.COLOR_BGR2GRAY)

        # ORB feature detection
        orb = cv2.ORB_create(nfeatures=self.orb_features)
        kp1, des1 = orb.detectAndCompute(before_gray, None)
        kp2, des2 = orb.detectAndCompute(after_gray, None)

        if des1 is None or des2 is None or len(kp1) < 10 or len(kp2) < 10:
            return after  # Cannot align

        # Match features
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)

        if len(matches) < 10:
            return after

        matches = sorted(matches, key=lambda x: x.distance)
        n_matches = min(self.orb_matches, len(matches))

        src_pts = np.float32([kp1[m.queryIdx].pt for m in matches[:n_matches]])
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches[:n_matches]])

        src_pts = src_pts.reshape(-1, 1, 2)
        dst_pts = dst_pts.reshape(-1, 1, 2)

        # Find homography with RANSAC
        H, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)

        if H is not None:
            aligned = cv2.warpPerspective(
                after, H, (before.shape[1], before.shape[0])
            )
            return aligned

        return after

    def _compute_difference(
        self, before: np.ndarray, after: np.ndarray
    ) -> np.ndarray:
        """Compute clean difference mask between two aligned images."""
        # Absolute difference
        diff = cv2.absdiff(before, after)

        # Convert to grayscale
        gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)

        # Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, self.blur_kernel, 0)

        # Otsu adaptive thresholding
        _, thresh = cv2.threshold(
            blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )

        # Morphological operations to clean noise
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, self.morph_kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, self.morph_kernel)

        return cleaned

    def _extract_changes(
        self,
        before: np.ndarray,
        after: np.ndarray,
        diff_mask: np.ndarray,
    ) -> List[TacticalChange]:
        """Extract connected components as TacticalChange objects."""
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            diff_mask, connectivity=8
        )

        changes = []
        total_pixels = before.shape[0] * before.shape[1]

        for i in range(1, num_labels):  # Skip background (label 0)
            area = int(stats[i, cv2.CC_STAT_AREA])

            if area < self.min_change_area:
                continue  # Filter small noise

            x = int(stats[i, cv2.CC_STAT_LEFT])
            y = int(stats[i, cv2.CC_STAT_TOP])
            w = int(stats[i, cv2.CC_STAT_WIDTH])
            h = int(stats[i, cv2.CC_STAT_HEIGHT])
            cx = int(centroids[i][0])
            cy = int(centroids[i][1])

            area_ratio = area / total_pixels
            significance = self._classify_significance(area_ratio)
            change_type = self._classify_change_type(before, after, (x, y, w, h))

            changes.append(TacticalChange(
                bbox=(x, y, w, h),
                area=area,
                area_ratio=area_ratio,
                significance=significance,
                change_type=change_type,
                centroid=(cx, cy),
            ))

        return changes

    def _classify_significance(self, area_ratio: float) -> str:
        """Classify change significance based on area ratio."""
        if area_ratio >= self.thresholds['HIGH']:
            return 'HIGH'
        elif area_ratio >= self.thresholds['MEDIUM']:
            return 'MEDIUM'
        elif area_ratio >= self.thresholds['LOW']:
            return 'LOW'
        else:
            return 'LOW'  # Below threshold but caught by min_change_area

    def _classify_change_type(
        self,
        before: np.ndarray,
        after: np.ndarray,
        bbox: Tuple[int, int, int, int],
    ) -> str:
        """Classify what kind of change occurred in the region."""
        x, y, w, h = bbox

        # Ensure bounds
        h_img, w_img = before.shape[:2]
        x = max(0, x)
        y = max(0, y)
        w = min(w, w_img - x)
        h = min(h, h_img - y)

        if w <= 0 or h <= 0:
            return 'UNKNOWN'

        before_roi = before[y:y+h, x:x+w]
        after_roi = after[y:y+h, x:x+w]

        # Compare mean colors
        before_mean = np.mean(before_roi, axis=(0, 1))
        after_mean = np.mean(after_roi, axis=(0, 1))

        before_brightness = np.mean(before_mean)
        after_brightness = np.mean(after_mean)

        color_shift = np.linalg.norm(before_mean - after_mean)

        # Classification heuristics
        if color_shift > 80:
            return 'OBJECT_REPLACED'
        elif after_brightness > before_brightness * 1.2:
            return 'OBJECT_REMOVED'
        elif before_brightness > after_brightness * 1.2:
            return 'OBJECT_ADDED'
        else:
            return 'MODIFIED'


# ------------------------------------------------------------------
#  CLI / Standalone Usage
# ------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python change_detector.py <before.jpg> <after.jpg> [output.jpg]")
        sys.exit(1)

    before_path = sys.argv[1]
    after_path = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None

    detector = TacticalChangeDetector()

    print(f"Detecting changes between {before_path} and {after_path}...")
    changes = detector.detect(before_path, after_path)

    print(f"\nDetected {len(changes)} changes:")
    for i, change in enumerate(changes, 1):
        print(f"  {i}. {change.significance}: {change.change_type}")
        print(f"     Area: {change.area}px ({change.area_ratio:.3%})")
        print(f"     BBox: {change.bbox}")

    # Visualize
    vis = detector.visualize(before_path, after_path, changes, output_path)
    print(f"\nVisualization shape: {vis.shape}")
    if output_path:
        print(f"Saved to: {output_path}")
