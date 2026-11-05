#!/usr/bin/env python3
"""
=============================================================================
READERS OF AURANGABAD — Advanced AI Visual Image Transformation Pipeline
=============================================================================

Performs:
1. Subject-aware multi-aspect cropping & canvas extension (outpainting simulation)
2. Cinematic editorial color grading (Warm paper ivory, deep charcoal, muted olive)
3. Specialized multi-tier asset generation:
   - img/processed/hero/ (Desktop & Mobile)
   - img/processed/gallery/ (Desktop & Mobile)
   - img/processed/community/ (Portraits, avatars, moments)
   - img/processed/journal/ (Editorial book covers)
   - img/processed/desktop/ (Wide landscape responsive)
   - img/processed/mobile/ (Vertical portrait responsive)
4. Mirrored deployment directly to public/images/processed/
5. Generates TypeScript AI image mapping database (src/data/imageMapping.ts)
"""

import os
import sys
import json
import shutil
from pathlib import Path
from PIL import (
    Image,
    ImageFilter,
    ImageEnhance,
    ImageOps,
    ImageStat,
)

# Base Paths
PROJECT_ROOT = Path(r"d:\projects\Readers of Aurangabad\readers-of-aurangabad")
IMG_ORIGINAL = PROJECT_ROOT / "img" / "original"
IMG_PROCESSED = PROJECT_ROOT / "img" / "processed"
PUBLIC_PROCESSED = PROJECT_ROOT / "public" / "images" / "processed"

# Categories
CATEGORIES = ["hero", "gallery", "community", "journal", "mobile", "desktop"]

# Quality Settings
WEBP_QUALITY = 88
JPEG_QUALITY = 92


def ensure_directories():
    """Create all processed directories in both img/ and public/images/."""
    for cat in CATEGORIES:
        (IMG_PROCESSED / cat).mkdir(parents=True, exist_ok=True)
        (PUBLIC_PROCESSED / cat).mkdir(parents=True, exist_ok=True)
    print("✓ All processed directories initialized in img/processed/ and public/images/processed/")


def auto_orient(img: Image.Image) -> Image.Image:
    try:
        return ImageOps.exif_transpose(img)
    except Exception:
        return img


def apply_cinematic_editorial_grading(img: Image.Image, mood: str = "editorial") -> Image.Image:
    """
    Apply visible, unmistakable editorial color grading:
    - Subtle paper warmth in highlights
    - Deep, rich charcoal blacks (matte film curve)
    - Earthy muted greens for park foliage
    - Enhanced clarity and unsharp detail
    """
    img = img.convert("RGB")

    # 1. Subtle exposure & dynamic range adjustment
    stat = ImageStat.Stat(img)
    avg_brightness = sum(stat.mean) / 3
    brightness_factor = 1.05 if avg_brightness < 120 else (0.97 if avg_brightness > 180 else 1.02)
    img = ImageEnhance.Brightness(img).enhance(brightness_factor)

    # 2. Rich cinematic contrast
    img = ImageEnhance.Contrast(img).enhance(1.12)

    # 3. Editorial Matte Tone Curves (RGB channel manipulation)
    r, g, b = img.split()

    # Warm paper highlights: gently lift Red in highlights (>160)
    r = r.point(lambda x: min(255, int(x * 1.03 + 3)) if x > 150 else x)

    # Muted olive foliage: slightly pull down midtone Green towards warm olive
    g = g.point(lambda x: int(x * 0.98 + 1) if 60 < x < 190 else x)

    # Deep charcoal shadows: slightly warm the deep shadows (prevent cold blue cast)
    b = b.point(lambda x: max(0, int(x * 0.95)) if x < 90 else min(255, int(x * 0.98)))

    img = Image.merge("RGB", (r, g, b))

    # 4. Color Vibrance & Saturation
    # Natural, sophisticated literary saturation (never oversaturated)
    img = ImageEnhance.Color(img).enhance(0.96)

    # 5. Micro-contrast & Crispness (Unsharp Mask)
    # Makes book pages, text, and facial expressions crisp and readable
    img = img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=3))

    return img


def expand_canvas_blurred_backdrop(img: Image.Image, target_width: int, target_height: int) -> Image.Image:
    """
    AI Canvas Extension / Outpainting Alternative:
    When placing a vertical portrait image into a wide landscape banner without cropping off
    people's heads or books:
    1. Generates a wide photographic atmosphere from the image with heavy Gaussian blur and dark grading.
    2. Centers the sharp original subject seamlessly with a soft vignette edge.
    """
    orig_w, orig_h = img.size
    target_ratio = target_width / target_height
    orig_ratio = orig_w / orig_h

    # Create background canvas: scaled and blurred version of the photo
    scale = max(target_width / orig_w, target_height / orig_h)
    bg_w = int(orig_w * scale)
    bg_h = int(orig_h * scale)
    bg = img.resize((bg_w, bg_h), Image.Resampling.LANCZOS)

    # Crop background to exact canvas
    left = (bg_w - target_width) // 2
    top = (bg_h - target_height) // 2
    bg = bg.crop((left, top, left + target_width, top + target_height))

    # Apply heavy blur and subtle darkening to background
    bg = bg.filter(ImageFilter.GaussianBlur(radius=35))
    bg = ImageEnhance.Brightness(bg).enhance(0.55)

    # Calculate size for sharp foreground (preserve entire subject)
    fg_scale = min((target_height * 0.94) / orig_h, (target_width * 0.75) / orig_w)
    fg_w = int(orig_w * fg_scale)
    fg_h = int(orig_h * fg_scale)
    fg = img.resize((fg_w, fg_h), Image.Resampling.LANCZOS)

    # Paste foreground centered with elegant framing
    paste_x = (target_width - fg_w) // 2
    paste_y = (target_height - fg_h) // 2

    canvas = bg.copy()
    canvas.paste(fg, (paste_x, paste_y))

    return canvas


def crop_subject_aware(img: Image.Image, target_width: int, target_height: int, focus: str = "center") -> Image.Image:
    """
    Subject-aware intelligent cropping:
    - focus='top': preserve people's heads and upper bodies (essential for group photos)
    - focus='center': center crop
    - focus='expand': if aspect ratios differ drastically, use canvas extension
    """
    w, h = img.size
    target_ratio = target_width / target_height
    current_ratio = w / h

    # If aspect ratio is drastically different (e.g. portrait 9:16 to banner 16:9), expand
    if current_ratio < 0.8 and target_ratio > 1.3:
        return expand_canvas_blurred_backdrop(img, target_width, target_height)

    if current_ratio > target_ratio:
        # Image is wider than needed — crop width
        new_w = int(h * target_ratio)
        if focus == "left":
            left = 0
        elif focus == "right":
            left = w - new_w
        else:
            left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    else:
        # Image is taller than needed — crop height
        new_h = int(w / target_ratio)
        if focus == "top":
            top = 0
        elif focus == "top-third":
            top = max(0, int((h - new_h) * 0.2))  # bias towards upper third where heads/faces are
        elif focus == "bottom":
            top = h - new_h
        else:
            top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))

    return img.resize((target_width, target_height), Image.Resampling.LANCZOS)


def save_dual(img: Image.Image, relative_path: str, format: str = "WEBP", quality: int = WEBP_QUALITY):
    """Save to both img/processed/ and public/images/processed/."""
    p1 = IMG_PROCESSED / relative_path
    p2 = PUBLIC_PROCESSED / relative_path

    p1.parent.mkdir(parents=True, exist_ok=True)
    p2.parent.mkdir(parents=True, exist_ok=True)

    img.save(p1, format=format, quality=quality, optimize=True)
    img.save(p2, format=format, quality=quality, optimize=True)


# ---------------------------------------------------------------------------
# Key Visual Asset Definitions & Section Mapping
# ---------------------------------------------------------------------------

ASSET_SPECS = [
    # --- HERO SECTION ---
    {
        "id": "hero-primary",
        "source": "WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg",
        "title": "The Grand Sunday Chapter Under Deccan Palms",
        "description": "Over 35 community readers gathered under morning shade holding books in the park",
        "page": "Home",
        "component": "HeroSection",
        "outputs": [
            {"cat": "hero", "name": "hero-grand-gathering-desktop.webp", "w": 1920, "h": 1080, "focus": "top-third"},
            {"cat": "hero", "name": "hero-grand-gathering-mobile.webp", "w": 800, "h": 1000, "focus": "top-third"},
            {"cat": "desktop", "name": "home-hero-wide.webp", "w": 1600, "h": 900, "focus": "top-third"},
        ]
    },
    {
        "id": "hero-reading-steps",
        "source": "WhatsApp Image 2026-11-05 at 6.46.45 PM (3).jpeg",
        "title": "Youth Reading on Sunlit Stone Steps",
        "description": "Young readers absorbed in paperbacks on stepped garden stones",
        "page": "Home",
        "component": "HeroPortraitCard",
        "outputs": [
            {"cat": "hero", "name": "hero-portrait-steps.webp", "w": 900, "h": 1200, "focus": "top-third"},
            {"cat": "mobile", "name": "hero-portrait-steps-mobile.webp", "w": 600, "h": 800, "focus": "top-third"},
        ]
    },
    {
        "id": "hero-terrace-gathering",
        "source": "WhatsApp Image 2026-11-05 at 6.45.08 PM (6).jpeg",
        "title": "Community on Garden Terraces",
        "description": "Readers standing on the amphitheater terrace holding books",
        "page": "Home / Gatherings",
        "component": "MeetupFeaturedCard",
        "outputs": [
            {"cat": "hero", "name": "terrace-gathering-wide.webp", "w": 1600, "h": 900, "focus": "top-third"},
            {"cat": "mobile", "name": "terrace-gathering-mobile.webp", "w": 800, "h": 800, "focus": "top-third"},
        ]
    },

    # --- FOUNDER & STEWARDS ---
    {
        "id": "founder-portrait",
        "source": "WhatsApp Image 2026-11-05 at 6.46.45 PM (4).jpeg",
        "title": "Abdul Rafe Farooqui — Founder",
        "description": "Founder Abdul Rafe Farooqui at the gathering venue holding literature",
        "page": "Our Story / Community",
        "component": "FounderBio",
        "outputs": [
            {"cat": "community", "name": "founder-abdul-rafe.webp", "w": 600, "h": 750, "focus": "top"},
            {"cat": "community", "name": "founder-avatar-square.webp", "w": 400, "h": 400, "focus": "top"},
        ]
    },

    # --- COMMUNITY READER AVATARS ---
    {
        "id": "avatar-female-reader-1",
        "source": "WhatsApp Image 2026-11-05 at 6.45.19 PM.jpeg",
        "title": "Ananya Sharma / Reader Representative",
        "description": "Authentic woman reader from the community gathering",
        "page": "Community",
        "component": "ReaderStories",
        "outputs": [
            {"cat": "community", "name": "reader-avatar-ananya.webp", "w": 300, "h": 300, "focus": "top"},
        ]
    },
    {
        "id": "avatar-male-reader-2",
        "source": "WhatsApp Image 2026-11-05 at 6.45.17 PM.jpeg",
        "title": "Mohammad Zaid / Reader Representative",
        "description": "Authentic reader from the Delhi Gate chapter gathering",
        "page": "Community",
        "component": "ReaderStories",
        "outputs": [
            {"cat": "community", "name": "reader-avatar-zaid.webp", "w": 300, "h": 300, "focus": "top"},
        ]
    },
    {
        "id": "avatar-female-reader-3",
        "source": "WhatsApp Image 2026-11-05 at 6.46.45 PM (1).jpeg",
        "title": "Kavita Joshi / Reader Representative",
        "description": "Active community reader in the morning circle",
        "page": "Community",
        "component": "ReaderStories",
        "outputs": [
            {"cat": "community", "name": "reader-avatar-kavita.webp", "w": 300, "h": 300, "focus": "top"},
        ]
    },

    # --- JOURNAL COVERS ---
    {
        "id": "journal-cover-1",
        "source": "WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg",
        "title": "Why Physical Books & Open Skies Still Matter in MH20",
        "description": "Wide outdoor park reading gathering under trees",
        "page": "Journal",
        "component": "ArticleCard-1",
        "outputs": [
            {"cat": "journal", "name": "journal-open-skies.webp", "w": 1200, "h": 800, "focus": "top-third"},
        ]
    },
    {
        "id": "journal-cover-2",
        "source": "WhatsApp Image 2026-11-05 at 6.45.08 PM (6).jpeg",
        "title": "औरंगाबाद की सुबह और किताबों का सुकून",
        "description": "Morning sunlight on terrace garden with books",
        "page": "Journal",
        "component": "ArticleCard-2",
        "outputs": [
            {"cat": "journal", "name": "journal-morning-peace.webp", "w": 1200, "h": 800, "focus": "top-third"},
        ]
    },
    {
        "id": "journal-cover-3",
        "source": "WhatsApp Image 2026-11-05 at 6.45.22 PM (1).jpeg",
        "title": "دکن کی خاک، مطالعے کا ذوق اور نئی نسل",
        "description": "Young generation gathered on lawn reading books",
        "page": "Journal",
        "component": "ArticleCard-3",
        "outputs": [
            {"cat": "journal", "name": "journal-deccan-literature.webp", "w": 1200, "h": 800, "focus": "top-third"},
        ]
    },
    {
        "id": "journal-cover-4",
        "source": "WhatsApp Image 2026-11-05 at 6.45.19 PM (1).jpeg",
        "title": "वाचनाची गोडी आणि शहराचा बदलता सांधा",
        "description": "Historic city venue assembly with readers",
        "page": "Journal",
        "component": "ArticleCard-4",
        "outputs": [
            {"cat": "journal", "name": "journal-marathi-vachan.webp", "w": 1200, "h": 800, "focus": "top-third"},
        ]
    },

    # --- MEETUPS ---
    {
        "id": "meetup-ch14",
        "source": "WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg",
        "title": "The Sunday Open Chapter 14",
        "description": "Morning reading under the shade",
        "page": "Gatherings",
        "component": "MeetupUpcoming",
        "outputs": [
            {"cat": "hero", "name": "meetup-ch14-banner.webp", "w": 1200, "h": 675, "focus": "top-third"},
        ]
    },
    {
        "id": "meetup-ch13",
        "source": "WhatsApp Image 2026-11-05 at 6.45.08 PM (6).jpeg",
        "title": "Autumn Pages: Chapter 13",
        "description": "Terrace assembly of readers",
        "page": "Gatherings",
        "component": "MeetupPast-13",
        "outputs": [
            {"cat": "hero", "name": "meetup-ch13-banner.webp", "w": 1200, "h": 675, "focus": "top-third"},
        ]
    },
    {
        "id": "meetup-ch12",
        "source": "WhatsApp Image 2026-11-05 at 6.45.09 PM (4).jpeg",
        "title": "Monsoon Book Exchange Chapter 12",
        "description": "Readers presenting and swapping physical paperbacks",
        "page": "Gatherings",
        "component": "MeetupPast-12",
        "outputs": [
            {"cat": "hero", "name": "meetup-ch12-banner.webp", "w": 1200, "h": 675, "focus": "top"},
        ]
    },

    # --- GET INVOLVED & STORY SECTION IMAGES ---
    {
        "id": "story-founding-moment",
        "source": "WhatsApp Image 2026-11-05 at 6.45.24 PM.jpeg",
        "title": "The First Circle in the Park",
        "description": "Readers sitting in a quiet circle on mats reading peacefully",
        "page": "Our Story",
        "component": "FoundingStoryCard",
        "outputs": [
            {"cat": "community", "name": "story-first-circle.webp", "w": 1000, "h": 700, "focus": "center"},
        ]
    },
    {
        "id": "story-delhi-gate",
        "source": "WhatsApp Image 2026-11-05 at 6.45.19 PM (1).jpeg",
        "title": "Gathering at the Heart of Aurangabad",
        "description": "Community assembly near historic Delhi Gate",
        "page": "Our Story",
        "component": "HistoricVenuesCard",
        "outputs": [
            {"cat": "community", "name": "story-historic-venue.webp", "w": 1000, "h": 700, "focus": "top-third"},
        ]
    },
    {
        "id": "get-involved-volunteer",
        "source": "WhatsApp Image 2026-11-05 at 6.45.09 PM (4).jpeg",
        "title": "Joining the Volunteer Movement",
        "description": "Readers collaborating and sharing books",
        "page": "Get Involved",
        "component": "VolunteerBanner",
        "outputs": [
            {"cat": "community", "name": "get-involved-banner.webp", "w": 1200, "h": 600, "focus": "top"},
        ]
    },
    {
        "id": "contact-venue-showcase",
        "source": "WhatsApp Image 2026-11-05 at 6.45.22 PM (1).jpeg",
        "title": "Sunday Mornings in the Park",
        "description": "Open sky reading meetup on the green lawn",
        "page": "Contact",
        "component": "VenueLocationCard",
        "outputs": [
            {"cat": "community", "name": "contact-venue-lawn.webp", "w": 1000, "h": 600, "focus": "top-third"},
        ]
    },
]


# Gallery Items (18 Diverse authentic photographs)
GALLERY_SELECTION = [
    ("WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg", "The Sunday Gathering Under Deccan Palms", "Over 35 community readers gathered under morning shade with books.", "October 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.08 PM (6).jpeg", "Assembly on the Garden Terraces", "Readers assembled on amphitheater stones across Urdu, Marathi, Hindi, and English.", "October 2026"),
    ("WhatsApp Image 2026-11-05 at 6.46.45 PM (3).jpeg", "Sunlight & Paperbacks on Stone Steps", "Young readers engrossed in diverse titles in the tranquil park atmosphere.", "October 2026"),
    ("WhatsApp Image 2026-11-05 at 6.46.45 PM (2).jpeg", "Quiet Sanctuary in the Shade", "Gathered on a printed rug with open books and unhurried time.", "September 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.09 PM (4).jpeg", "Holding the Pages that Shape Us", "Attendees displaying their chosen literature spanning personal growth, fiction, and philosophy.", "September 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.16 PM (1).jpeg", "Literary Reflections from the Circle", "A member sharing insights and perspectives during the open conversation hour.", "August 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.22 PM (1).jpeg", "Sunday Morning Green Lawn Assembly", "A sprawling circle of readers on the grass enjoying peaceful morning hours.", "October 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.19 PM.jpeg", "Women Readers of Aurangabad", "Female students and literature lovers assembled with their current reads.", "August 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.19 PM (1).jpeg", "Dua Foundation Chapter Gathering", "Community gathering outside the historic Delhi Gate venue in Aurangabad.", "August 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.08 PM (4).jpeg", "A Reader Speaks Her Mind", "Thoughtful reflections on why reading communities bridge social boundaries.", "October 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.08 PM (2).jpeg", "Mats, Silence & Morning Coffee", "60 minutes of collective quiet reading where smartphones are put away.", "September 2026"),
    ("WhatsApp Image 2026-11-05 at 6.46.45 PM (4).jpeg", "Stewards of the Literary Movement", "Founder Abdul Rafe Farooqui and core organizers committed to Aurangabad's literary revival.", "October 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.08 PM (5).jpeg", "Sharing Book Recommendations", "Members discussing books they brought to exchange with fellow citizens.", "September 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.24 PM.jpeg", "Lost in the Paragraphs", "Close-up of young readers completely captivated by their books on the green lawn.", "September 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.17 PM.jpeg", "Readers of All Walks", "Students and working professionals standing united for the reading cause.", "August 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.16 PM.jpeg", "Listening with Empathy", "The circle actively listening as a reader recites poetic passages.", "August 2026"),
    ("WhatsApp Image 2026-11-05 at 6.46.45 PM (1).jpeg", "A Sisterhood of Words", "Women participants celebrating reading freedom and literary dialogue.", "October 2026"),
    ("WhatsApp Image 2026-11-05 at 6.45.23 PM.jpeg", "The Joy of a Physical Book", "Nothing replaces the tactile feel and memory of turning paper pages.", "October 2026"),
]


def process_all_assets():
    """Execute the complete image transformation pipeline."""
    ensure_directories()

    image_mapping = []

    print("\n► STEP 1: Transforming Section-Specific High-Impact Assets...")
    for idx, spec in enumerate(ASSET_SPECS, start=1):
        src_file = IMG_ORIGINAL / spec["source"]
        if not src_file.exists():
            print(f"  ⚠ Missing source file: {spec['source']}")
            continue

        print(f"  [{idx}/{len(ASSET_SPECS)}] Processing: {spec['title']} ({spec['source']})")

        with Image.open(src_file) as raw_img:
            img = auto_orient(raw_img)
            graded = apply_cinematic_editorial_grading(img)

            for out in spec["outputs"]:
                cat = out["cat"]
                name = out["name"]
                target_w = out["w"]
                target_h = out["h"]
                focus = out.get("focus", "center")

                rel_path = f"{cat}/{name}"

                # Apply subject-aware crop or canvas extension
                cropped = crop_subject_aware(graded, target_w, target_h, focus=focus)

                # Save to both locations
                save_dual(cropped, rel_path, format="WEBP", quality=WEBP_QUALITY)

                image_mapping.append({
                    "id": f"{spec['id']}-{name.replace('.webp', '')}",
                    "assetId": spec["id"],
                    "originalFilename": spec["source"],
                    "processedPath": f"/images/processed/{rel_path}",
                    "category": cat,
                    "page": spec["page"],
                    "component": spec["component"],
                    "title": spec["title"],
                    "width": target_w,
                    "height": target_h,
                    "aspectRatio": f"{target_w}:{target_h}",
                    "cropFocus": focus,
                    "status": "published"
                })

                print(f"      ✓ Generated: {rel_path} ({target_w}×{target_h})")

    print("\n► STEP 2: Transforming 18 Community Gallery Assets...")
    gallery_manifest = []

    for idx, (filename, title, caption, date) in enumerate(GALLERY_SELECTION, start=1):
        src_file = IMG_ORIGINAL / filename
        if not src_file.exists():
            print(f"  ⚠ Missing gallery source: {filename}")
            continue

        clean_slug = f"gal-{idx:02d}"
        desktop_name = f"{clean_slug}-desktop.webp"
        mobile_name = f"{clean_slug}-mobile.webp"
        thumb_name = f"{clean_slug}-thumb.webp"

        with Image.open(src_file) as raw_img:
            img = auto_orient(raw_img)
            graded = apply_cinematic_editorial_grading(img)

            # Desktop gallery version (800x600 balanced)
            desktop_img = crop_subject_aware(graded, 900, 675, focus="top-third")
            save_dual(desktop_img, f"gallery/{desktop_name}", format="WEBP", quality=WEBP_QUALITY)

            # Mobile vertical version (600x750)
            mobile_img = crop_subject_aware(graded, 600, 750, focus="top")
            save_dual(mobile_img, f"mobile/{mobile_name}", format="WEBP", quality=WEBP_QUALITY)

            # Fast preview thumbnail (400x400)
            thumb_img = crop_subject_aware(graded, 400, 400, focus="top-third")
            save_dual(thumb_img, f"gallery/{thumb_name}", format="WEBP", quality=82)

        gallery_manifest.append({
            "id": f"gal-{idx}",
            "title": title,
            "caption": caption,
            "imageUrl": f"/images/processed/gallery/{desktop_name}",
            "mobileUrl": f"/images/processed/mobile/{mobile_name}",
            "thumbUrl": f"/images/processed/gallery/{thumb_name}",
            "date": date,
            "originalSource": filename
        })

        image_mapping.append({
            "id": f"gallery-{clean_slug}",
            "assetId": clean_slug,
            "originalFilename": filename,
            "processedPath": f"/images/processed/gallery/{desktop_name}",
            "category": "gallery",
            "page": "Community / Gallery",
            "component": "CommunityGalleryGrid",
            "title": title,
            "width": 900,
            "height": 675,
            "aspectRatio": "4:3",
            "cropFocus": "top-third",
            "status": "published"
        })

        print(f"  [{idx}/{len(GALLERY_SELECTION)}] Gallery: {title} -> {desktop_name}")

    print("\n► STEP 3: Generating TypeScript AI Image Mapping System...")
    ts_file = PROJECT_ROOT / "src" / "data" / "imageMapping.ts"
    with open(ts_file, "w", encoding="utf-8") as f:
        f.write("// Auto-generated by scripts/advanced_image_transformation.py — DO NOT EDIT MANUALLY\n\n")
        f.write("export interface ImageMappingEntry {\n")
        f.write("  id: string;\n")
        f.write("  assetId: string;\n")
        f.write("  originalFilename: string;\n")
        f.write("  processedPath: string;\n")
        f.write("  category: string;\n")
        f.write("  page: string;\n")
        f.write("  component: string;\n")
        f.write("  title: string;\n")
        f.write("  width: number;\n")
        f.write("  height: number;\n")
        f.write("  aspectRatio: string;\n")
        f.write("  cropFocus: string;\n")
        f.write("  status: 'published' | 'draft';\n")
        f.write("}\n\n")
        f.write("export interface ProcessedGalleryItem {\n")
        f.write("  id: string;\n")
        f.write("  title: string;\n")
        f.write("  caption: string;\n")
        f.write("  imageUrl: string;\n")
        f.write("  mobileUrl: string;\n")
        f.write("  thumbUrl: string;\n")
        f.write("  date: string;\n")
        f.write("  originalSource: string;\n")
        f.write("}\n\n")
        f.write(f"export const AI_IMAGE_MAPPINGS: ImageMappingEntry[] = {json.dumps(image_mapping, indent=2)};\n\n")
        f.write(f"export const TRANSFORMED_COMMUNITY_GALLERY: ProcessedGalleryItem[] = {json.dumps(gallery_manifest, indent=2)};\n\n")
        f.write("""export const SITE_IMAGES = {
  hero: {
    grandGatheringDesktop: '/images/processed/hero/hero-grand-gathering-desktop.webp',
    grandGatheringMobile: '/images/processed/hero/hero-grand-gathering-mobile.webp',
    readingSteps: '/images/processed/hero/hero-portrait-steps.webp',
    terraceGathering: '/images/processed/hero/terrace-gathering-wide.webp',
  },
  founder: {
    portrait: '/images/processed/community/founder-abdul-rafe.webp',
    avatar: '/images/processed/community/founder-avatar-square.webp',
  },
  readerAvatars: {
    ananya: '/images/processed/community/reader-avatar-ananya.webp',
    zaid: '/images/processed/community/reader-avatar-zaid.webp',
    kavita: '/images/processed/community/reader-avatar-kavita.webp',
  },
  journalCovers: {
    openSkies: '/images/processed/journal/journal-open-skies.webp',
    morningPeace: '/images/processed/journal/journal-morning-peace.webp',
    deccanLiterature: '/images/processed/journal/journal-deccan-literature.webp',
    marathiVachan: '/images/processed/journal/journal-marathi-vachan.webp',
  },
  meetups: {
    ch14Banner: '/images/processed/hero/meetup-ch14-banner.webp',
    ch13Banner: '/images/processed/hero/meetup-ch13-banner.webp',
    ch12Banner: '/images/processed/hero/meetup-ch12-banner.webp',
  },
  story: {
    firstCircle: '/images/processed/community/story-first-circle.webp',
    historicVenue: '/images/processed/community/story-historic-venue.webp',
  },
  getInvolved: {
    volunteerBanner: '/images/processed/community/get-involved-banner.webp',
  },
  contact: {
    venueLawn: '/images/processed/community/contact-venue-lawn.webp',
  }
} as const;\n""")

    print(f"✓ TypeScript Image Mapping written to: {ts_file}")

    # Also save a JSON copy
    json_path = PUBLIC_PROCESSED / "image-mapping.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"mappings": image_mapping, "gallery": gallery_manifest}, f, indent=2)
    print(f"✓ JSON Image Mapping saved to: {json_path}")

    print("\n" + "=" * 70)
    print("  TRANSFORMATION COMPLETE!")
    print(f"  Processed {len(image_mapping)} specific website placements")
    print(f"  Generated {len(gallery_manifest)} community gallery assets (Desktop + Mobile + Thumb)")
    print("=" * 70)


if __name__ == "__main__":
    process_all_assets()
