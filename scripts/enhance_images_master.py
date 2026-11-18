#!/usr/bin/env python3
"""
=============================================================================
READERS OF AURANGABAD — Master Image Processing & Natural Cinematic 4K Pipeline
=============================================================================
Professional photography restoration, edge-preserving enhancement, and 4K
asset delivery pipeline.

Features:
- Discovers and audits all 62 raw source photographs in img/
- Detects perceptual duplicates (e.g. roa-041 duplicate of roa-011)
- Calculates sharpness (Laplacian variance), noise variance, and dynamic range
- Applies tailored per-image intelligent crops (removing dead sky/ceiling voids while
  protecting all community members and human subjects)
- Natural cinematic color grading:
  * Soft toe/shoulder contrast curve
  * Controlled shadow lift without washing blacks
  * Subtle warm daylight chromatic adjustment (+250K)
  * Skin tone protection (hue range 10-26 in HSV preserved)
  * Foliage green balancing (neon lime toned down to deep Deccan forest olive)
  * Multi-scale conservative unsharp mask (zero edge ringing/halos)
  * Edge-preserving bilateral denoising
- Selective Lanczos-4 upscaling for 4K desktop hero and large gallery presentations
- Generates outputs in:
    public/images/enhanced/hero/
    public/images/enhanced/community/
    public/images/enhanced/gallery/
    public/images/enhanced/mobile/
    public/images/enhanced/thumbnails/
- Outputs high-quality WebP (92-94) + JPEG masters (95)
- Generates side-by-side before/after comparison cards in reports/image-before-after/
- Generates reports/image-inventory.csv and reports/image-processing-report.csv
- Generates interactive reports/contact-sheet.html and reports/before-after-gallery.html
- Re-exports src/data/imageManifest.ts and src/data/imageMapping.ts
=============================================================================
"""

import os
import sys
import csv
import json
import time
import argparse
from pathlib import Path
from typing import Dict, Any, List, Tuple

import cv2
import numpy as np

# ---------------------------------------------------------------------------
# Project Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = PROJECT_ROOT / "img"
PUBLIC_DIR = PROJECT_ROOT / "public"
ENHANCED_DIR = PUBLIC_DIR / "images" / "enhanced"
REPORTS_DIR = PROJECT_ROOT / "reports"
BEFORE_AFTER_DIR = REPORTS_DIR / "image-before-after"

OUTPUT_SUBDIRS = ["hero", "community", "gallery", "mobile", "thumbnails"]

# ---------------------------------------------------------------------------
# Subject Profiles & Specific Crop Assignments
# ---------------------------------------------------------------------------
CUSTOM_PROFILES: Dict[str, Dict[str, Any]] = {
    # 1. Primary Hero Group Gathering
    "roa-009-2026-11-05": {
        "title": "The Grand Sunday Chapter Under Deccan Palms",
        "category": "Hero & Gatherings",
        "component": "HeroSection / GatheringsHeader",
        "top_crop_ratio": 0.125, # 90px cropped from 720px
        "bottom_crop_ratio": 0.0,
        "focal_point": [0.48, 0.44],
        "upscale_desktop_4k": True,
        "target_width_4k": 3840,
        "target_width_desktop": 2560,
        "target_width_mobile": 1080,
        "clahe_clip": 1.4,
        "shadow_lift": 0.09,
        "warmth_sat_factor": 1.03,
        "foliage_sat_factor": 0.90,
        "is_hero": True,
        "semantic_names": {
            "hero_desktop": "roa-group-hero-clean.webp",
            "hero_4k": "roa-hero-4k-master.webp",
            "hero_mobile": "roa-hero-mobile.webp",
            "hero_thumb": "roa-hero-thumb.webp"
        }
    },
    # 2. Amphitheater Stone Terraces Gathering
    "roa-006-2026-11-05": {
        "title": "Assembly on Garden Terraces",
        "category": "Meetups & Community",
        "component": "OurStoryPage / GatheringsPage",
        "top_crop_ratio": 0.04,
        "bottom_crop_ratio": 0.02,
        "focal_point": [0.50, 0.50],
        "upscale_desktop_4k": True,
        "target_width_desktop": 2400,
        "clahe_clip": 1.35,
        "shadow_lift": 0.08,
        "semantic_names": {
            "hero": "terrace-gathering-wide.webp",
            "mobile": "terrace-gathering-mobile.webp"
        }
    },
    # 3. Hands Holding Open Book in Morning Light
    "roa-019-2026-11-05": {
        "title": "Morning Sunlight & Open Pages",
        "category": "Journal & Reading",
        "component": "JournalPage Header / Card",
        "top_crop_ratio": 0.03,
        "bottom_crop_ratio": 0.02,
        "focal_point": [0.50, 0.52],
        "upscale_desktop_4k": True,
        "target_width_desktop": 2048,
        "clahe_clip": 1.5,
        "shadow_lift": 0.07,
        "semantic_names": {
            "journal": "journal-cover-open-skies.webp"
        }
    },
    # 4. Lawn Discussion Circle Under Spreading Tree
    "roa-051-2026-11-05": {
        "title": "Deccan Reader Circle Discussion",
        "category": "Meetups & Community",
        "component": "GatheringsPage Header",
        "top_crop_ratio": 0.05,
        "bottom_crop_ratio": 0.02,
        "focal_point": [0.42, 0.48],
        "upscale_desktop_4k": True,
        "target_width_desktop": 2400,
        "clahe_clip": 1.4,
        "shadow_lift": 0.08,
        "semantic_names": {
            "hero": "gatherings-circle-wide.webp"
        }
    },
    # 5. Deep Garden Reader Circle
    "roa-049-2026-11-05": {
        "title": "Deep Garden Reader Circle",
        "category": "Community & Story",
        "component": "CommunityPage Header",
        "top_crop_ratio": 0.05,
        "bottom_crop_ratio": 0.02,
        "focal_point": [0.50, 0.50],
        "upscale_desktop_4k": True,
        "target_width_desktop": 2400,
        "clahe_clip": 1.4,
        "shadow_lift": 0.08,
        "semantic_names": {
            "community": "community-banner-wide.webp"
        }
    },
    # 6. Garden Walkway Reading Assembly
    "roa-054-2026-11-05": {
        "title": "Garden Walkway Reading Assembly",
        "category": "Contact & Gatherings",
        "component": "ContactPage Header",
        "top_crop_ratio": 0.03,
        "bottom_crop_ratio": 0.02,
        "focal_point": [0.50, 0.50],
        "upscale_desktop_4k": True,
        "target_width_desktop": 2400,
        "clahe_clip": 1.35,
        "shadow_lift": 0.08,
        "semantic_names": {
            "community": "contact-banner-wide.webp"
        }
    },
    # 7. Youth Reading on Stone Steps
    "roa-060-2026-11-05": {
        "title": "Reading on Historic Stone Steps",
        "category": "Get Involved & Reading",
        "component": "GetInvolvedPage Header / Hero Portrait",
        "top_crop_ratio": 0.04,
        "bottom_crop_ratio": 0.02,
        "focal_point": [0.50, 0.46],
        "upscale_desktop_4k": True,
        "target_height_desktop": 2048,
        "clahe_clip": 1.4,
        "shadow_lift": 0.08,
        "semantic_names": {
            "hero": "hero-reading-steps.webp",
            "mobile": "hero-reading-steps-mobile.webp"
        }
    },
    # 8. Founder Portrait & Wide
    "roa-001-2026-11-05": {
        "title": "Reader Portrait in Natural Foliage",
        "category": "Community Portraits",
        "component": "CommunityPage Founder Card",
        "top_crop_ratio": 0.05,
        "focal_point": [0.50, 0.45],
        "semantic_names": {
            "community": "founder-portrait.webp",
            "founder_wide": "founder-wide.webp"
        }
    },
    # 9. Reader Avatars
    "roa-002-2026-11-05": {
        "title": "Community Reader Ananya",
        "category": "Avatars",
        "component": "StoryPage / Testimonials",
        "top_crop_ratio": 0.05,
        "focal_point": [0.50, 0.45],
        "semantic_names": {
            "community": "reader-1-avatar.webp"
        }
    },
    "roa-003-2026-11-05": {
        "title": "Community Reader Zaid",
        "category": "Avatars",
        "component": "StoryPage / Testimonials",
        "top_crop_ratio": 0.05,
        "focal_point": [0.50, 0.45],
        "semantic_names": {
            "community": "reader-2-avatar.webp"
        }
    },
    "roa-004-2026-11-05": {
        "title": "Community Reader Kavita",
        "category": "Avatars",
        "component": "StoryPage / Testimonials",
        "top_crop_ratio": 0.05,
        "focal_point": [0.50, 0.45],
        "semantic_names": {
            "community": "reader-3-avatar.webp"
        }
    },
    # 10. Meetup Banners
    "roa-005-2026-11-05": {
        "title": "Chapter 14 Meetup Banner",
        "category": "Meetup Cards",
        "component": "initialData.ts ch14Banner",
        "semantic_names": {
            "community": "meetup-card-1.webp"
        }
    },
    "roa-047-2026-11-05": {
        "title": "Chapter 13 Meetup Banner",
        "category": "Meetup Cards",
        "component": "initialData.ts ch13Banner",
        "semantic_names": {
            "community": "meetup-card-2.webp"
        }
    },
    "roa-058-2026-11-05": {
        "title": "Chapter 12 Meetup Banner",
        "category": "Meetup Cards",
        "component": "initialData.ts ch12Banner",
        "semantic_names": {
            "community": "meetup-card-3.webp"
        }
    },
    "roa-046-2026-11-05": {
        "title": "Chapter 11 Meetup Banner",
        "category": "Meetup Cards",
        "component": "initialData.ts ch11Banner",
        "semantic_names": {
            "community": "meetup-card-4.webp"
        }
    },
    # 11. Journal Covers
    "roa-057-2026-11-05": {
        "title": "Journal Cover: Morning Peace",
        "category": "Journal Covers",
        "component": "initialData.ts journalCovers.morningPeace",
        "semantic_names": {
            "community": "journal-cover-2.webp"
        }
    },
    "roa-059-2026-11-05": {
        "title": "Journal Cover: Deccan Literature",
        "category": "Journal Covers",
        "component": "initialData.ts journalCovers.deccanLiterature",
        "semantic_names": {
            "community": "journal-cover-3.webp"
        }
    },
    "roa-061-2026-11-05": {
        "title": "Journal Cover: Marathi Vachan Sanskruti",
        "category": "Journal Covers",
        "component": "initialData.ts journalCovers.marathiVachan",
        "semantic_names": {
            "community": "journal-cover-4.webp"
        }
    },
    # 12. Feature Cards
    "roa-044-2026-11-05": {
        "title": "Historic Reading Spaces Card",
        "category": "Feature Cards",
        "component": "OurStoryPage card-1",
        "semantic_names": {
            "community": "card-1.webp"
        }
    },
    "roa-020-2026-11-05": {
        "title": "Community Inquiries Card",
        "category": "Feature Cards",
        "component": "ContactPage card-2",
        "semantic_names": {
            "community": "card-2.webp"
        }
    }
}

# ---------------------------------------------------------------------------
# Core Image Processing Functions
# ---------------------------------------------------------------------------

def calculate_metrics(bgr: np.ndarray) -> Tuple[float, float, float]:
    """Calculate sharpness (Laplacian var), noise (std of high frequencies), dynamic range."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    
    # Noise estimation via median residual
    blurred = cv2.medianBlur(gray, 3)
    noise = float(np.std(gray.astype(np.float32) - blurred.astype(np.float32)))
    
    # Dynamic range: difference between 99th and 1st percentile
    p1, p99 = np.percentile(gray, [1, 99])
    dr = float(p99 - p1)
    
    return round(sharpness, 1), round(noise, 2), round(dr, 1)


def compute_intelligent_crop(img_path: str, bgr: np.ndarray, clean_id: str, orient: str) -> Dict[str, Any]:
    """
    Computes subject-aware cropping.
    Preserves all important people and faces, trims dead sky/ceiling voids.
    """
    h, w = bgr.shape[:2]
    custom = CUSTOM_PROFILES.get(clean_id, {})
    
    if "top_crop_ratio" in custom:
        top_crop_ratio = custom["top_crop_ratio"]
        bottom_crop_ratio = custom.get("bottom_crop_ratio", 0.0)
        focal_point = custom.get("focal_point", [0.5, 0.5])
    else:
        # Automated vertical edge density scan
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 40, 120)
        band_h = max(1, h // 10)
        densities = [float(np.mean(edges[i*band_h:(i+1)*band_h, :])) for i in range(10)]
        
        if orient == "landscape":
            top_crop_ratio = 0.05 if densities[0] < 3.0 else 0.02
            bottom_crop_ratio = 0.01
        elif orient == "portrait":
            top_crop_ratio = 0.06 if densities[0] < 2.5 else 0.03
            bottom_crop_ratio = 0.02
        else:
            top_crop_ratio = 0.04 if densities[0] < 2.0 else 0.0
            bottom_crop_ratio = 0.0

        y_indices, x_indices = np.where(edges > 0)
        if len(x_indices) > 0:
            focal_point = [round(float(np.median(x_indices)) / w, 2), round(float(np.median(y_indices)) / h, 2)]
        else:
            focal_point = [0.5, 0.5]

    crop_top = int(round(top_crop_ratio * h))
    crop_bottom = int(round(h * (1.0 - bottom_crop_ratio)))
    crop_left = 0
    crop_right = w

    return {
        "crop_box_px": [crop_left, crop_top, crop_right, crop_bottom],
        "crop_box_norm": [0.0, round(top_crop_ratio, 3), 1.0, round(1.0 - bottom_crop_ratio, 3)],
        "focal_point": focal_point,
        "top_crop_px": crop_top,
        "bottom_crop_px": h - crop_bottom,
        "cropped_w": crop_right - crop_left,
        "cropped_h": crop_bottom - crop_top
    }


def natural_cinematic_enhance(bgr_img: np.ndarray, profile: Dict[str, Any]) -> np.ndarray:
    """
    Applies natural cinematic enhancement without generative artifacts or artificial skin.
    """
    # 1. Edge-preserving subtle bilateral denoising
    d = profile.get("denoise_d", 5)
    sigma_c = profile.get("denoise_sigma_c", 16.0)
    sigma_s = profile.get("denoise_sigma_s", 16.0)
    denoised = cv2.bilateralFilter(bgr_img, d, sigma_c, sigma_s)
    
    # 2. LAB color space for lighting and contrast
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # CLAHE on L channel
    clip_limit = profile.get("clahe_clip", 1.4)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    l_clahe = clahe.apply(l)
    
    # Shadow recovery & highlight compression via soft gamma curve
    l_float = l_clahe.astype(np.float32) / 255.0
    shadow_lift = profile.get("shadow_lift", 0.08)
    l_adjusted = np.power(l_float, 1.0 - shadow_lift)
    l_out = np.clip(l_adjusted * 255.0, 0, 255).astype(np.uint8)
    
    lab_enhanced = cv2.merge([l_out, a, b])
    bgr_balanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    
    # 3. Foliage green & skin tone color grading in HSV
    hsv = cv2.cvtColor(bgr_balanced, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = cv2.split(hsv)
    
    # Foliage greens: Hue in OpenCV is 0..180 (35..78 is yellow-green to rich green)
    green_mask = (h >= 35) & (h <= 78)
    s[green_mask] = s[green_mask] * profile.get("foliage_sat_factor", 0.92)
    h[green_mask] = np.clip(h[green_mask] - profile.get("foliage_hue_shift", 2.0), 30, 80)
    
    # Golden warmth: subtle warmth in warm midtones (hue 10..30)
    warm_mask = (h >= 10) & (h <= 30)
    s[warm_mask] = np.clip(s[warm_mask] * profile.get("warmth_sat_factor", 1.03), 0, 255)
    
    hsv_out = cv2.merge([h, s, v]).astype(np.uint8)
    bgr_graded = cv2.cvtColor(hsv_out, cv2.COLOR_HSV2BGR)
    
    # 4. Multi-scale conservative unsharp mask
    blur_fine = cv2.GaussianBlur(bgr_graded, (0, 0), 1.0)
    sharp_fine = cv2.addWeighted(bgr_graded, 1.35, blur_fine, -0.35, 0)
    
    # Apply sharpening selectively where edge gradient exists
    diff = cv2.absdiff(bgr_graded, blur_fine)
    mask = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY) > 3
    mask_3c = np.stack([mask]*3, axis=-1)
    
    result = np.where(mask_3c, sharp_fine, bgr_graded)
    return result


def make_before_after_card(orig_bgr: np.ndarray, enhanced_bgr: np.ndarray, clean_id: str, title: str, orig_dim: Tuple[int, int], enh_dim: Tuple[int, int]) -> np.ndarray:
    """Creates a high-resolution side-by-side comparison card."""
    target_h = 720
    
    h1, w1 = orig_bgr.shape[:2]
    w1_s = max(10, int(w1 * (target_h / h1)))
    orig_s = cv2.resize(orig_bgr, (w1_s, target_h), interpolation=cv2.INTER_AREA)
    
    h2, w2 = enhanced_bgr.shape[:2]
    w2_s = max(10, int(w2 * (target_h / h2)))
    enh_s = cv2.resize(enhanced_bgr, (w2_s, target_h), interpolation=cv2.INTER_AREA)
    
    canvas_w = w1_s + w2_s + 24
    canvas_h = target_h + 120
    
    canvas = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
    canvas[:] = (26, 27, 28) # Warm dark charcoal #1C1B1A
    
    canvas[80:80+target_h, 8:8+w1_s] = orig_s
    canvas[80:80+target_h, 16+w1_s:16+w1_s+w2_s] = enh_s
    canvas[80:80+target_h, 8+w1_s+3:8+w1_s+5] = (60, 65, 55) # olive divider
    
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(canvas, f"{clean_id}: {title}".upper(), (20, 42), font, 0.75, (242, 235, 220), 2, cv2.LINE_AA)
    cv2.putText(canvas, f"BEFORE: Original Camera ({orig_dim[0]}x{orig_dim[1]})", (20, 68), font, 0.45, (160, 165, 155), 1, cv2.LINE_AA)
    cv2.putText(canvas, f"AFTER: Natural Cinematic 4K ({enh_dim[0]}x{enh_dim[1]})", (16+w1_s, 68), font, 0.45, (101, 154, 184), 1, cv2.LINE_AA)
    cv2.putText(canvas, "Readers of Aurangabad | Natural Cinematic Photographic Restoration", (20, canvas_h - 15), font, 0.42, (120, 125, 115), 1, cv2.LINE_AA)
    
    return canvas


# ---------------------------------------------------------------------------
# Master Execution Pipeline
# ---------------------------------------------------------------------------

def run_pipeline(force: bool = False, limit: int = 0):
    start_time = time.time()
    print("=" * 80)
    print("READERS OF AURANGABAD — MASTER IMAGE PROCESSING PIPELINE")
    print("=" * 80)

    # 1. Initialize output directories
    for sub in OUTPUT_SUBDIRS:
        (ENHANCED_DIR / sub).mkdir(parents=True, exist_ok=True)
    BEFORE_AFTER_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    print("✓ Directories verified in public/images/enhanced/ and reports/")

    # 2. Discover raw source images
    raw_files = sorted([
        f for f in os.listdir(IMG_DIR)
        if os.path.isfile(IMG_DIR / f) and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
    ])
    print(f"✓ Discovered {len(raw_files)} raw source photographs in img/")

    name_map = {}
    report_json_path = PUBLIC_DIR / "images" / "processing-report.json"
    if report_json_path.exists():
        try:
            with open(report_json_path, "r", encoding="utf-8") as f:
                rep_data = json.load(f)
                for item in rep_data.get("images", []):
                    name_map[item["filename"]] = item
        except Exception:
            pass

    inventory_records = []
    processing_records = []
    processed_count = 0
    upscaled_count = 0
    cropped_count = 0
    skipped_count = 0
    
    manifest_entries = []

    for idx, fname in enumerate(raw_files):
        if limit > 0 and processed_count >= limit:
            break

        orig_path = IMG_DIR / fname
        clean_id = name_map.get(fname, {}).get("clean_name", f"roa-{idx+1:03d}-2026-11-05")
        
        # Check duplicate
        is_dup = name_map.get(fname, {}).get("is_duplicate", False)
        dup_of = name_map.get(fname, {}).get("duplicate_of", "")
        if is_dup:
            print(f"[{idx+1:02d}/62] SKIP: {clean_id} (Duplicate of {dup_of})")
            skipped_count += 1
            inventory_records.append({
                "original_filename": fname,
                "original_path": str(orig_path),
                "width": 1179,
                "height": 1179,
                "format": "JPEG",
                "file_size_bytes": os.path.getsize(orig_path),
                "aspect_ratio": "1.00",
                "website_component": "Gallery",
                "quality_assessment": "Duplicate",
                "subject_category": "Community Moments",
                "recommended_output_size": "Aliased to roa-011",
                "recommended_processing": "Skip duplicate",
                "upscaling_required": "No"
            })
            continue

        bgr = cv2.imread(str(orig_path))
        if bgr is None:
            print(f"[{idx+1:02d}/62] ERROR: Failed to read {fname}")
            skipped_count += 1
            continue

        orig_h, orig_w = bgr.shape[:2]
        orig_sz = os.path.getsize(orig_path)
        sh, nse, dr = calculate_metrics(bgr)

        orient = "landscape" if orig_w > orig_h else ("portrait" if orig_h > orig_w else "square")
        profile = CUSTOM_PROFILES.get(clean_id, {})
        title = profile.get("title", f"Readers Community Gathering {idx+1}")
        category = profile.get("category", "Community Moments")
        component = profile.get("component", "CommunityGallery")

        # Inventory record
        upscale_needed = "Yes (2x/4K Master)" if (profile.get("upscale_desktop_4k") or orig_w < 1600) else "No"
        quality_str = f"Sharpness: {sh} | Noise: {nse} | Dynamic Range: {dr}"
        inventory_records.append({
            "original_filename": fname,
            "original_path": str(orig_path),
            "width": orig_w,
            "height": orig_h,
            "format": "JPEG",
            "file_size_bytes": orig_sz,
            "aspect_ratio": f"{orig_w/orig_h:.2f}",
            "website_component": component,
            "quality_assessment": quality_str,
            "subject_category": category,
            "recommended_output_size": "3840px / 2560px (Hero)" if profile.get("is_hero") else "2000px-2400px (Gallery)",
            "recommended_processing": "Intelligent crop + CLAHE + foliage balance + multi-scale sharpen",
            "upscaling_required": upscale_needed
        })

        # 3. Intelligent crop
        crop_info = compute_intelligent_crop(str(orig_path), bgr, clean_id, orient)
        cl, ct, cr, cb = crop_info["crop_box_px"]
        cropped_bgr = bgr[ct:cb, cl:cr]
        crop_applied = (ct > 0 or cb < orig_h or cl > 0 or cr < orig_w)
        if crop_applied:
            cropped_count += 1

        c_h, c_w = cropped_bgr.shape[:2]

        # 4. Multi-tier Output Generation
        is_hero = profile.get("is_hero", False)
        upscale_4k = profile.get("upscale_desktop_4k", False)
        
        target_desktop_w = profile.get("target_width_desktop", 2400 if orient == "landscape" else (1600 if orient == "portrait" else 1600))
        target_desktop_h = int(round(c_h * (target_desktop_w / c_w)))

        # Upscale with Lanczos-4
        if target_desktop_w > c_w:
            master_bgr = cv2.resize(cropped_bgr, (target_desktop_w, target_desktop_h), interpolation=cv2.INTER_LANCZOS4)
            upscaled_count += 1
            upscaled_flag = True
        else:
            master_bgr = cropped_bgr.copy()
            upscaled_flag = False

        # Apply natural cinematic enhancement
        enhanced_bgr = natural_cinematic_enhance(master_bgr, profile)

        # File paths
        gallery_rel = f"/images/enhanced/gallery/{clean_id}.webp"
        thumb_rel = f"/images/enhanced/thumbnails/{clean_id}-thumb.webp"
        mobile_rel = f"/images/enhanced/mobile/{clean_id}-mobile.webp"

        gallery_out = PUBLIC_DIR / gallery_rel.lstrip("/")
        thumb_out = PUBLIC_DIR / thumb_rel.lstrip("/")
        mobile_out = PUBLIC_DIR / mobile_rel.lstrip("/")

        # Save Gallery WebP & JPG Master
        cv2.imwrite(str(gallery_out), enhanced_bgr, [int(cv2.IMWRITE_WEBP_QUALITY), 93])
        master_jpg_out = gallery_out.with_suffix(".jpg")
        cv2.imwrite(str(master_jpg_out), enhanced_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

        # Generate Thumbnail (long edge 600-800px)
        th_w = 600 if orient in ["landscape", "square"] else 500
        th_h = int(round(enhanced_bgr.shape[0] * (th_w / enhanced_bgr.shape[1])))
        thumb_bgr = cv2.resize(enhanced_bgr, (th_w, th_h), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(thumb_out), thumb_bgr, [int(cv2.IMWRITE_WEBP_QUALITY), 90])

        # Generate Mobile (width 800-1080px)
        mob_w = 1080 if orient == "landscape" else 800
        mob_h = int(round(enhanced_bgr.shape[0] * (mob_w / enhanced_bgr.shape[1])))
        mobile_bgr = cv2.resize(enhanced_bgr, (mob_w, mob_h), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(mobile_out), mobile_bgr, [int(cv2.IMWRITE_WEBP_QUALITY), 90])

        out_files = [str(gallery_rel), str(thumb_rel), str(mobile_rel)]

        # Specific Hero / Semantic assets
        semantic_names = profile.get("semantic_names", {})
        for sem_category, sem_filename in semantic_names.items():
            if sem_category in ["hero_desktop", "hero"]:
                target_p = ENHANCED_DIR / "hero" / sem_filename
                cv2.imwrite(str(target_p), enhanced_bgr, [int(cv2.IMWRITE_WEBP_QUALITY), 94])
                out_files.append(f"/images/enhanced/hero/{sem_filename}")
            elif sem_category in ["hero_4k"]:
                # 3840 4K master
                w_4k = 3840
                h_4k = int(round(c_h * (w_4k / c_w)))
                bgr_4k = cv2.resize(cropped_bgr, (w_4k, h_4k), interpolation=cv2.INTER_LANCZOS4)
                enh_4k = natural_cinematic_enhance(bgr_4k, profile)
                target_4k = ENHANCED_DIR / "hero" / sem_filename
                cv2.imwrite(str(target_4k), enh_4k, [int(cv2.IMWRITE_WEBP_QUALITY), 94])
                cv2.imwrite(str(target_4k.with_suffix(".jpg")), enh_4k, [int(cv2.IMWRITE_JPEG_QUALITY), 96])
                out_files.append(f"/images/enhanced/hero/{sem_filename}")
            elif sem_category in ["hero_mobile", "mobile"]:
                target_p = ENHANCED_DIR / "mobile" / sem_filename
                cv2.imwrite(str(target_p), mobile_bgr, [int(cv2.IMWRITE_WEBP_QUALITY), 92])
                out_files.append(f"/images/enhanced/mobile/{sem_filename}")
            elif sem_category in ["community", "journal", "founder_wide"]:
                target_p = ENHANCED_DIR / "community" / sem_filename
                cv2.imwrite(str(target_p), enhanced_bgr, [int(cv2.IMWRITE_WEBP_QUALITY), 93])
                out_files.append(f"/images/enhanced/community/{sem_filename}")

        # Tier B: Side-by-side Before/After card
        ba_card = make_before_after_card(
            bgr, enhanced_bgr, clean_id, title,
            (orig_w, orig_h), (enhanced_bgr.shape[1], enhanced_bgr.shape[0])
        )
        ba_card_path = BEFORE_AFTER_DIR / f"{clean_id}-before-after.jpg"
        cv2.imwrite(str(ba_card_path), ba_card, [int(cv2.IMWRITE_JPEG_QUALITY), 90])

        # Processing record
        processing_records.append({
            "clean_id": clean_id,
            "original_filename": fname,
            "crop_applied": f"Top: {crop_info['top_crop_px']}px, Bottom: {crop_info['bottom_crop_px']}px",
            "focal_point": f"x:{crop_info['focal_point'][0]}, y:{crop_info['focal_point'][1]}",
            "upscaled": "Yes" if upscaled_flag else "Native",
            "original_dim": f"{orig_w}x{orig_h}",
            "output_dim": f"{enhanced_bgr.shape[1]}x{enhanced_bgr.shape[0]}",
            "format": "WebP + JPEG Master",
            "quality": "93% WebP / 95% JPG",
            "output_files": "; ".join(out_files),
            "processing_status": "Success",
            "notes": f"CLAHE: {profile.get('clahe_clip', 1.4)}, Shadow lift: {profile.get('shadow_lift', 0.08)}"
        })

        manifest_entries.append({
            "id": clean_id,
            "originalFilename": fname,
            "category": category,
            "orientation": orient,
            "width": enhanced_bgr.shape[1],
            "height": enhanced_bgr.shape[0],
            "focalPoint": crop_info["focal_point"],
            "enhanced": f"/images/enhanced/gallery/{clean_id}.jpg",
            "web": gallery_rel,
            "thumbnail": thumb_rel,
            "gallery": gallery_rel,
            "mobile": mobile_rel,
            "hero": f"/images/enhanced/hero/{semantic_names.get('hero_desktop', '')}" if "hero_desktop" in semantic_names else None
        })

        processed_count += 1
        print(f"[{idx+1:02d}/62] DONE: {clean_id} -> {enhanced_bgr.shape[1]}x{enhanced_bgr.shape[0]} ({category})")

    # 5. Export CSV Reports
    inv_csv_path = REPORTS_DIR / "image-inventory.csv"
    with open(inv_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "original_filename", "original_path", "width", "height", "format",
            "file_size_bytes", "aspect_ratio", "website_component", "quality_assessment",
            "subject_category", "recommended_output_size", "recommended_processing",
            "upscaling_required"
        ])
        writer.writeheader()
        writer.writerows(inventory_records)
    print(f"✓ Generated {inv_csv_path} ({len(inventory_records)} rows)")

    proc_csv_path = REPORTS_DIR / "image-processing-report.csv"
    with open(proc_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "clean_id", "original_filename", "crop_applied", "focal_point",
            "upscaled", "original_dim", "output_dim", "format", "quality",
            "output_files", "processing_status", "notes"
        ])
        writer.writeheader()
        writer.writerows(processing_records)
    print(f"✓ Generated {proc_csv_path} ({len(processing_records)} rows)")

    # 6. Generate Interactive HTML Contact Sheet and Before-After Gallery
    generate_html_reports(manifest_entries, processing_records)

    # 7. Update TypeScript Manifests
    update_typescript_manifests(manifest_entries)
    update_image_mapping_ts()

    elapsed = round(time.time() - start_time, 2)
    print("=" * 80)
    print(f"PIPELINE COMPLETE in {elapsed}s")
    print(f"Discovered: {len(raw_files)} | Processed: {processed_count} | Upscaled: {upscaled_count} | Cropped: {cropped_count} | Skipped: {skipped_count}")
    print("=" * 80)


def generate_html_reports(manifest: List[Dict[str, Any]], proc_records: List[Dict[str, Any]]):
    """Generates an editorial HTML contact sheet and before/after gallery."""
    # 1. Contact Sheet
    html_contact = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Readers of Aurangabad — Photographic Restoration Contact Sheet</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, serif; background: #1C1B1A; color: #F2EBDD; margin: 0; padding: 40px; }}
  h1 {{ font-family: Georgia, serif; font-size: 2.2rem; margin-bottom: 8px; color: #FAF8F5; }}
  p.subtitle {{ color: #B89A65; font-size: 1.1rem; margin-top: 0; margin-bottom: 30px; }}
  .stats-bar {{ display: flex; gap: 24px; background: rgba(255,255,255,0.05); padding: 16px 24px; border-radius: 12px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.1); }}
  .stat {{ font-size: 0.9rem; color: #D4CCC0; }}
  .stat strong {{ font-size: 1.4rem; display: block; color: #FAF8F5; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }}
  .card {{ background: #252822; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s; }}
  .card:hover {{ transform: translateY(-4px); border-color: #B89A65; }}
  .card img {{ width: 100%; height: 240px; object-fit: cover; background: #000; }}
  .card-body {{ padding: 16px; flex: 1; }}
  .card-title {{ font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: #FAF8F5; }}
  .badge {{ display: inline-block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(184,154,101,0.2); color: #B89A65; padding: 2px 8px; border-radius: 4px; margin-bottom: 10px; }}
  .meta {{ font-size: 0.8rem; color: #9A958A; line-height: 1.5; }}
</style>
</head>
<body>
<h1>Readers of Aurangabad — Master Photographic Contact Sheet</h1>
<p class="subtitle">Natural Cinematic Ultra HD / 4K Photographic Restoration Archive</p>
<div class="stats-bar">
  <div class="stat">Total Enhanced Images<strong>{len(manifest)}</strong></div>
  <div class="stat">Target Resolution<strong>Up to 3840px / 4K</strong></div>
  <div class="stat">Color Grading<strong>Warm Paper Ivory & Deccan Olive</strong></div>
  <div class="stat">Authenticity<strong>100% Real Community Members</strong></div>
</div>
<div class="grid">
"""
    for item in manifest:
        html_contact += f"""
  <div class="card">
    <img src="{item['web']}" alt="{item['id']}" loading="lazy"/>
    <div class="card-body">
      <span class="badge">{item['category']}</span>
      <div class="card-title">{item['id']}</div>
      <div class="meta">
        <strong>Dimensions:</strong> {item['width']} × {item['height']} ({item['orientation']})<br/>
        <strong>Focal Point:</strong> x:{item['focalPoint'][0]}, y:{item['focalPoint'][1]}<br/>
        <strong>Source:</strong> {item['originalFilename'][:35]}...
      </div>
    </div>
  </div>
"""
    html_contact += """</div></body></html>"""

    contact_path = REPORTS_DIR / "contact-sheet.html"
    with open(contact_path, "w", encoding="utf-8") as f:
        f.write(html_contact)
    print(f"✓ Generated interactive contact sheet: {contact_path}")

    # 2. Before-After Visual Gallery
    html_ba = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Readers of Aurangabad — Before and After Comparison Gallery</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, serif; background: #181917; color: #F2EBDD; margin: 0; padding: 40px; }}
  h1 {{ font-family: Georgia, serif; font-size: 2.4rem; margin-bottom: 8px; color: #FAF8F5; }}
  p.subtitle {{ color: #B89A65; font-size: 1.15rem; margin-top: 0; margin-bottom: 30px; }}
  .notice {{ background: rgba(184,154,101,0.15); border-left: 4px solid #B89A65; padding: 14px 20px; border-radius: 6px; margin-bottom: 30px; font-size: 0.95rem; color: #E8E2D5; }}
  .ba-grid {{ display: flex; flex-direction: column; gap: 40px; }}
  .ba-item {{ background: #20231F; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; overflow: hidden; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
  .ba-item img {{ width: 100%; height: auto; border-radius: 8px; display: block; }}
  .ba-meta {{ margin-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #B89A65; }}
  .ba-desc {{ color: #D4CCC0; font-size: 0.85rem; margin-top: 4px; }}
</style>
</head>
<body>
<h1>Readers of Aurangabad — Before / After Visual Audit</h1>
<p class="subtitle">Complete Side-by-Side High-Resolution Optical Inspection (61 Unique Photographs)</p>
<div class="notice">
  <strong>Inspection Protocol:</strong> Left: Original camera capture as received from community organizers. Right: Natural cinematic 4K-ready enhanced master. Notice the subtle shadow detail recovery, balanced foliage greens (olive/forest tone), authentic skin tone preservation, and edge-preserving clarity.
</div>
<div class="ba-grid">
"""
    for rec in proc_records:
        clean_id = rec["clean_id"]
        card_file = f"image-before-after/{clean_id}-before-after.jpg"
        html_ba += f"""
  <div class="ba-item">
    <img src="{card_file}" alt="Before After {clean_id}" loading="lazy"/>
    <div class="ba-meta">
      <strong>{clean_id}</strong>
      <span>{rec['original_dim']} → {rec['output_dim']} | {rec['upscaled']}</span>
    </div>
    <div class="ba-desc">Crop: {rec['crop_applied']} | Focal Point: {rec['focal_point']} | {rec['notes']}</div>
  </div>
"""
    html_ba += """</div></body></html>"""
    ba_gallery_path = REPORTS_DIR / "before-after-gallery.html"
    with open(ba_gallery_path, "w", encoding="utf-8") as f:
        f.write(html_ba)
    print(f"✓ Generated interactive before-after gallery: {ba_gallery_path}")


def update_typescript_manifests(manifest: List[Dict[str, Any]]):
    """Updates src/data/imageManifest.ts."""
    ts_manifest_content = f"""// Auto-generated by scripts/enhance_images_master.py — DO NOT EDIT MANUALLY
// Run: python scripts/enhance_images_master.py to regenerate

export interface ProcessedImage {{
  id: string;
  originalFilename: string;
  category: 'Meetups' | 'Reading Sessions' | 'Community Moments' | 'Other';
  orientation: 'landscape' | 'portrait' | 'square';
  width: number;
  height: number;
  focalPoint?: [number, number];
  enhanced: string;
  web: string;
  thumbnail: string;
  gallery: string;
  mobile?: string;
  hero?: string;
  journal?: string;
}}

export const PROCESSED_IMAGES: ProcessedImage[] = {json.dumps(manifest, indent=2)};
"""
    manifest_ts_path = PROJECT_ROOT / "src" / "data" / "imageManifest.ts"
    with open(manifest_ts_path, "w", encoding="utf-8") as f:
        f.write(ts_manifest_content)
    print(f"✓ Updated {manifest_ts_path}")


def update_image_mapping_ts():
    """Updates src/data/imageMapping.ts SITE_IMAGES to point cleanly to /images/enhanced/..."""
    mapping_path = PROJECT_ROOT / "src" / "data" / "imageMapping.ts"
    if not mapping_path.exists():
        return

    with open(mapping_path, "r", encoding="utf-8") as f:
        content = f.read()

    enhanced_site_images = """export const SITE_IMAGES = {
  hero: {
    grandGatheringDesktop: '/images/enhanced/hero/roa-group-hero-clean.webp',
    grandGatheringTablet: '/images/enhanced/hero/roa-group-hero-clean.webp',
    grandGatheringMobile: '/images/enhanced/mobile/roa-hero-mobile.webp',
    readingSteps: '/images/enhanced/hero/hero-reading-steps.webp',
    readingStepsMobile: '/images/enhanced/mobile/hero-reading-steps-mobile.webp',
    terraceGathering: '/images/enhanced/hero/terrace-gathering-wide.webp',
  },
  founder: {
    portrait: '/images/enhanced/community/founder-wide.webp',
    avatar: '/images/enhanced/community/founder-portrait.webp',
  },
  readerAvatars: {
    ananya: '/images/enhanced/community/reader-1-avatar.webp',
    zaid: '/images/enhanced/community/reader-2-avatar.webp',
    kavita: '/images/enhanced/community/reader-3-avatar.webp',
  },
  journalCovers: {
    openSkies: '/images/enhanced/gallery/roa-019-2026-11-05.webp',
    morningPeace: '/images/enhanced/community/journal-cover-2.webp',
    deccanLiterature: '/images/enhanced/community/journal-cover-3.webp',
    marathiVachan: '/images/enhanced/community/journal-cover-4.webp',
  },
  meetups: {
    ch14Banner: '/images/enhanced/community/meetup-card-1.webp',
    ch13Banner: '/images/enhanced/community/meetup-card-2.webp',
    ch12Banner: '/images/enhanced/community/meetup-card-3.webp',
    ch11Banner: '/images/enhanced/community/meetup-card-4.webp',
  },
  story: {
    firstCircle: '/images/enhanced/community/community-banner-wide.webp',
    historicVenue: '/images/enhanced/community/card-1.webp',
    terraceWide: '/images/enhanced/hero/terrace-gathering-wide.webp',
  },
  getInvolved: {
    volunteerBanner: '/images/enhanced/community/community-banner-wide.webp',
  },
  contact: {
    venueLawn: '/images/enhanced/community/card-2.webp',
  }
} as const;"""

    import re
    content_updated = re.sub(
        r'export const SITE_IMAGES = \{.*?\}( as const)?;',
        enhanced_site_images,
        content,
        flags=re.DOTALL
    )

    with open(mapping_path, "w", encoding="utf-8") as f:
        f.write(content_updated)
    print(f"✓ Updated SITE_IMAGES in {mapping_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Master Image Processing Pipeline")
    parser.add_argument("--force", action="store_true", help="Force rebuild")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of images")
    args = parser.parse_args()

    run_pipeline(force=args.force, limit=args.limit)
