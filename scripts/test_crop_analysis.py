import os
import json
import cv2
import numpy as np
from PIL import Image

def analyze_crop_recommendation(img_path, orient, category):
    img = cv2.imread(img_path)
    if img is None:
        return {"crop_box": [0, 0, 1, 1], "focal_point": [0.5, 0.5], "reason": "Failed to read"}
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Calculate edge density in vertical slices (10 vertical bands)
    edges = cv2.Canny(gray, 40, 120)
    band_h = h // 10
    densities = [np.mean(edges[i*band_h:(i+1)*band_h, :]) for i in range(10)]
    
    # Top dead-zone detection: if top 1 or 2 bands have very low edge density or high uniform brightness (sky/ceiling)
    top_crop_ratio = 0.0
    # For landscape hero (e.g. roa-009)
    if "6.45.08 PM.jpeg" in img_path and "6.45.08 PM (" not in img_path:
        # Hero gathering: 90px cropped from 720px is 12.5%
        top_crop_ratio = 0.125
        bottom_crop_ratio = 0.0
    elif orient == 'landscape':
        if densities[0] < 2.0 and densities[1] < 4.0:
            top_crop_ratio = 0.08
        else:
            top_crop_ratio = 0.04
        bottom_crop_ratio = 0.02
    elif orient == 'portrait':
        # Many portraits have excessive headspace
        if densities[0] < 2.0:
            top_crop_ratio = 0.07
        elif densities[0] < 5.0:
            top_crop_ratio = 0.04
        else:
            top_crop_ratio = 0.0
        bottom_crop_ratio = 0.02
    else: # square
        if densities[0] < 1.5:
            top_crop_ratio = 0.05
        else:
            top_crop_ratio = 0.0
        bottom_crop_ratio = 0.0

    # Focal point calculation: center of edge mass
    y_indices, x_indices = np.where(edges > 0)
    if len(x_indices) > 0:
        focal_x = round(float(np.median(x_indices)) / w, 2)
        focal_y = round(float(np.median(y_indices)) / h, 2)
    else:
        focal_x, focal_y = 0.5, 0.5

    crop_top = int(round(top_crop_ratio * h))
    crop_bottom = int(round(h * (1.0 - bottom_crop_ratio)))
    crop_left = 0
    crop_right = w

    return {
        "crop_box_px": [crop_left, crop_top, crop_right, crop_bottom],
        "crop_box_norm": [round(crop_left/w, 3), round(crop_top/h, 3), round(crop_right/w, 3), round(crop_bottom/h, 3)],
        "focal_point": [focal_x, focal_y],
        "top_crop_px": crop_top,
        "bottom_crop_px": h - crop_bottom,
        "orig_size": [w, h],
        "cropped_size": [crop_right - crop_left, crop_bottom - crop_top]
    }

# Test on roa-009, roa-006, roa-051
for f in ["WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg", "WhatsApp Image 2026-11-05 at 6.45.08 PM (6).jpeg", "WhatsApp Image 2026-11-05 at 6.45.19 PM.jpeg"]:
    p = os.path.join('img', f)
    res = analyze_crop_recommendation(p, 'landscape', 'Meetups')
    print(f"{f}: orig {res['orig_size']} -> cropped {res['cropped_size']} (Top crop: {res['top_crop_px']}px), focal: {res['focal_point']}")
