#!/usr/bin/env python3
"""
=============================================================================
READERS OF AURANGABAD — Automated Image Enhancement & Optimization Pipeline
=============================================================================

Professional image processing pipeline that:
1. Scans the img/ folder for all source images
2. Applies cinematic editorial color grading (warm, earthy, literary tones)
3. Enhances clarity, sharpness, exposure, and color balance
4. Generates multiple optimized outputs: enhanced, web (WebP), thumbnails, hero, gallery, journal
5. Detects duplicate images via perceptual hashing
6. Categorizes images by visual content
7. Produces a full processing report

Brand color palette reference:
  - Warm ivory #FAF8F5
  - Deep charcoal #1C1B1A
  - Muted olive #455240
  - Clay brown #8D5B4C
  - Warm beige #E8E2D5

DOES NOT: alter faces, remove people, replace backgrounds, invent details.
"""

import os
import sys
import json
import hashlib
import time
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional

from PIL import (
    Image,
    ImageFilter,
    ImageEnhance,
    ImageOps,
    ImageStat,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(r"d:\projects\Readers of Aurangabad\readers-of-aurangabad")
IMG_SOURCE = PROJECT_ROOT / "img"
PUBLIC_IMG = PROJECT_ROOT / "public" / "images"

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"}

# Output directories (inside public/images/)
OUTPUT_DIRS = {
    "enhanced": PUBLIC_IMG / "enhanced",
    "web": PUBLIC_IMG / "web",
    "thumbnails": PUBLIC_IMG / "thumbnails",
    "hero": PUBLIC_IMG / "hero",
    "gallery": PUBLIC_IMG / "gallery",
    "journal": PUBLIC_IMG / "journal",
}

# Quality settings
JPEG_QUALITY = 92
WEBP_QUALITY = 85
THUMBNAIL_SIZE = (400, 400)
GALLERY_MAX_SIZE = (1600, 1200)
HERO_SIZE = (1920, 1080)
JOURNAL_SIZE = (1200, 800)
WEB_MAX_SIZE = (1600, 1200)

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ImageInfo:
    filename: str
    original_path: str
    width: int = 0
    height: int = 0
    file_size: int = 0
    format: str = ""
    orientation: str = ""  # landscape / portrait / square
    category: str = "Other"
    perceptual_hash: str = ""
    is_duplicate: bool = False
    duplicate_of: str = ""
    enhanced: bool = False
    web_generated: bool = False
    thumbnail_generated: bool = False
    hero_candidate: bool = False
    gallery_candidate: bool = True
    journal_candidate: bool = False
    clean_name: str = ""
    error: str = ""


@dataclass
class ProcessingReport:
    total_discovered: int = 0
    total_enhanced: int = 0
    total_web_optimized: int = 0
    total_thumbnails: int = 0
    total_hero: int = 0
    total_gallery: int = 0
    total_journal: int = 0
    total_duplicates: int = 0
    total_failed: int = 0
    total_storage_bytes: int = 0
    images: list = field(default_factory=list)
    errors: list = field(default_factory=list)
    folders_created: list = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean_filename(filename: str, index: int) -> str:
    """Convert WhatsApp-style filenames to clean web-friendly names."""
    stem = Path(filename).stem.lower()
    ext = Path(filename).suffix.lower()

    # Remove WhatsApp prefix
    stem = stem.replace("whatsapp image ", "")
    # Remove date/time portions
    for sep in [" at ", " - "]:
        if sep in stem:
            parts = stem.split(sep)
            stem = parts[0]

    # Clean up
    stem = stem.replace(" ", "-").replace("(", "").replace(")", "").strip("-")

    # Add index for uniqueness
    clean = f"roa-{index:03d}-{stem}"

    # Keep it reasonable length
    if len(clean) > 40:
        clean = clean[:40]

    return clean


def perceptual_hash(img: Image.Image, hash_size: int = 8) -> str:
    """Compute a simple perceptual hash (average hash) for duplicate detection."""
    small = img.resize((hash_size, hash_size), Image.Resampling.LANCZOS).convert("L")
    if hasattr(small, "get_flattened_data"):
        pixels = list(small.get_flattened_data())
    else:
        pixels = list(small.getdata())
    avg = sum(pixels) / len(pixels)
    bits = "".join("1" if p > avg else "0" for p in pixels)
    return hex(int(bits, 2))[2:].zfill(hash_size * hash_size // 4)


def hamming_distance(h1: str, h2: str) -> int:
    """Hamming distance between two hex hash strings."""
    b1 = bin(int(h1, 16))[2:]
    b2 = bin(int(h2, 16))[2:]
    max_len = max(len(b1), len(b2))
    b1 = b1.zfill(max_len)
    b2 = b2.zfill(max_len)
    return sum(c1 != c2 for c1, c2 in zip(b1, b2))


def detect_orientation(width: int, height: int) -> str:
    ratio = width / height
    if ratio > 1.15:
        return "landscape"
    elif ratio < 0.85:
        return "portrait"
    return "square"


def categorize_image(img: Image.Image, info: ImageInfo) -> str:
    """
    Categorize based on aspect ratio and image properties.
    Landscape wide shots -> likely group photos / meetups
    Portrait shots -> likely individual / reading moments
    Indoor / darker images -> likely indoor meetups
    """
    orientation = info.orientation

    # Analyze brightness to detect indoor vs outdoor
    stat = ImageStat.Stat(img.convert("RGB"))
    avg_brightness = sum(stat.mean) / 3

    if orientation == "landscape" and info.width > 1200:
        if avg_brightness > 140:
            return "Meetups"  # Outdoor group photos
        else:
            return "Meetups"  # Indoor group photos
    elif orientation == "portrait":
        if avg_brightness > 130:
            return "Reading Sessions"  # Outdoor reading
        else:
            return "Community Moments"  # Indoor / closer shots
    elif orientation == "square":
        return "Community Moments"

    return "Community Moments"


# ---------------------------------------------------------------------------
# Enhancement pipeline
# ---------------------------------------------------------------------------

def analyze_image(img: Image.Image):
    """Analyze image to determine optimal enhancement parameters."""
    stat = ImageStat.Stat(img.convert("RGB"))
    means = stat.mean  # R, G, B
    stddevs = stat.stddev

    avg_brightness = sum(means) / 3
    avg_contrast = sum(stddevs) / 3

    # Color cast detection
    r_deviation = means[0] - avg_brightness
    g_deviation = means[1] - avg_brightness
    b_deviation = means[2] - avg_brightness

    return {
        "brightness": avg_brightness,
        "contrast": avg_contrast,
        "r_deviation": r_deviation,
        "g_deviation": g_deviation,
        "b_deviation": b_deviation,
        "is_underexposed": avg_brightness < 90,
        "is_overexposed": avg_brightness > 200,
        "is_low_contrast": avg_contrast < 40,
        "has_blue_cast": b_deviation > 10,
        "has_warm_cast": r_deviation > 12,
    }


def apply_editorial_color_grading(img: Image.Image, analysis: dict) -> Image.Image:
    """
    Apply cinematic editorial color grading matching the RoA brand.

    Target look:
    - Warm editorial tones
    - Natural earthy colors
    - Subtle olive and muted green tones
    - Soft warm highlights
    - Balanced shadows
    - Natural contrast
    - Elegant photographic depth

    Rules:
    - Maintain natural skin tones
    - Preserve realistic environmental colors
    - No excessive saturation, artificial HDR, or crushed blacks
    """
    # Work in RGB
    img = img.convert("RGB")

    # --- Step 1: Exposure correction ---
    brightness_enhancer = ImageEnhance.Brightness(img)
    if analysis["is_underexposed"]:
        # Lift brightness gently
        factor = min(1.0 + (130 - analysis["brightness"]) / 300, 1.25)
        img = brightness_enhancer.enhance(factor)
    elif analysis["is_overexposed"]:
        # Pull down slightly
        factor = max(0.85, 1.0 - (analysis["brightness"] - 180) / 400)
        img = brightness_enhancer.enhance(factor)
    else:
        # Very subtle lift for editorial warmth
        img = brightness_enhancer.enhance(1.02)

    # --- Step 2: Contrast adjustment ---
    contrast_enhancer = ImageEnhance.Contrast(img)
    if analysis["is_low_contrast"]:
        img = contrast_enhancer.enhance(1.15)
    else:
        # Subtle editorial contrast boost
        img = contrast_enhancer.enhance(1.06)

    # --- Step 3: White balance / color cast correction ---
    # Correct blue cast by warming
    if analysis["has_blue_cast"]:
        # Apply warm color curve via channel manipulation
        r, g, b = img.split()
        # Slightly boost red, slightly reduce blue
        r = r.point(lambda x: min(255, int(x * 1.04)))
        b = b.point(lambda x: int(x * 0.96))
        img = Image.merge("RGB", (r, g, b))

    # --- Step 4: Cinematic editorial warmth ---
    # Apply the warm, earthy, literary tone
    r, g, b = img.split()

    # Warm highlights (subtle orange shift in highlights)
    r = r.point(lambda x: min(255, int(x * 1.02 + 2)) if x > 180 else x)

    # Earthy muted greens (subtle olive push in midtone greens)
    g = g.point(lambda x: int(x * 0.99) if 80 < x < 180 else x)

    # Slightly warm shadows (not crushed, but warmed)
    b = b.point(lambda x: max(0, int(x * 0.97)) if x < 80 else x)

    img = Image.merge("RGB", (r, g, b))

    # --- Step 5: Saturation ---
    # Slightly desaturate for that editorial matte look (not Instagram-vivid)
    color_enhancer = ImageEnhance.Color(img)
    img = color_enhancer.enhance(0.93)

    # --- Step 6: Final gentle warmth via color overlay ---
    # Very subtle warm tint (like a warm film emulsion)
    r, g, b = img.split()
    # Tiny warm lift across the board
    r = r.point(lambda x: min(255, x + 2))
    g = g.point(lambda x: min(255, x + 1))
    img = Image.merge("RGB", (r, g, b))

    return img


def apply_sharpening(img: Image.Image) -> Image.Image:
    """
    Apply professional sharpening without halo artifacts.
    Uses unsharp mask for fine detail recovery.
    """
    # Unsharp mask: radius=1.5, percent=60, threshold=3
    # This recovers fine textures without creating halos
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=60, threshold=3))
    return img


def apply_noise_reduction(img: Image.Image, analysis: dict) -> Image.Image:
    """
    Light noise reduction for WhatsApp-compressed images.
    Uses a very subtle median filter only on noisy images.
    """
    # Only apply to underexposed / noisy images
    if analysis["is_underexposed"] or analysis["contrast"] < 35:
        # Very gentle smoothing (preserves detail better than aggressive denoise)
        img = img.filter(ImageFilter.SMOOTH)
    return img


def enhance_image(img: Image.Image) -> Image.Image:
    """
    Full professional enhancement pipeline.
    Order: noise reduction → color grading → sharpening
    """
    analysis = analyze_image(img)

    # 1. Gentle noise reduction (before everything else)
    img = apply_noise_reduction(img, analysis)

    # 2. Re-analyze after noise reduction
    analysis = analyze_image(img)

    # 3. Editorial color grading (exposure, contrast, warmth, color)
    img = apply_editorial_color_grading(img, analysis)

    # 4. Sharpening (last step, on the graded image)
    img = apply_sharpening(img)

    return img


# ---------------------------------------------------------------------------
# Output generators
# ---------------------------------------------------------------------------

def auto_orient(img: Image.Image) -> Image.Image:
    """Apply EXIF orientation and strip metadata."""
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass
    return img


def generate_enhanced(img: Image.Image, output_path: Path) -> int:
    """Save the enhanced full-resolution JPEG."""
    img.save(output_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return output_path.stat().st_size


def generate_web(img: Image.Image, output_path: Path) -> int:
    """Generate WebP optimized for web delivery."""
    web_img = img.copy()
    web_img.thumbnail(WEB_MAX_SIZE, Image.Resampling.LANCZOS)
    output_path = output_path.with_suffix(".webp")
    web_img.save(output_path, "WEBP", quality=WEBP_QUALITY, method=6)
    return output_path.stat().st_size


def generate_thumbnail(img: Image.Image, output_path: Path) -> int:
    """Generate small thumbnail for grids and previews."""
    thumb = img.copy()
    thumb.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    output_path = output_path.with_suffix(".webp")
    thumb.save(output_path, "WEBP", quality=78, method=6)
    return output_path.stat().st_size


def generate_hero(img: Image.Image, output_path: Path) -> int:
    """
    Generate hero banner image (1920x1080 landscape crop).
    Uses smart center crop that preserves subject matter.
    """
    w, h = img.size
    target_w, target_h = HERO_SIZE
    target_ratio = target_w / target_h

    current_ratio = w / h

    if current_ratio > target_ratio:
        # Image is wider than target — crop width
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    else:
        # Image is taller — crop height from center-top (preserve people's heads)
        new_h = int(w / target_ratio)
        top = max(0, (h - new_h) // 4)  # Bias towards top
        img = img.crop((0, top, w, top + new_h))

    img = img.resize(HERO_SIZE, Image.Resampling.LANCZOS)
    img.save(output_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return output_path.stat().st_size


def generate_gallery(img: Image.Image, output_path: Path) -> int:
    """Generate gallery-optimized image."""
    gallery_img = img.copy()
    gallery_img.thumbnail(GALLERY_MAX_SIZE, Image.Resampling.LANCZOS)
    output_path = output_path.with_suffix(".webp")
    gallery_img.save(output_path, "WEBP", quality=WEBP_QUALITY, method=6)
    return output_path.stat().st_size


def generate_journal(img: Image.Image, output_path: Path) -> int:
    """
    Generate journal/editorial cover image.
    Crops to 3:2 landscape ratio, applies slightly stronger editorial treatment.
    """
    w, h = img.size
    target_w, target_h = JOURNAL_SIZE
    target_ratio = target_w / target_h

    current_ratio = w / h

    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top = max(0, (h - new_h) // 3)
        img = img.crop((0, top, w, top + new_h))

    img = img.resize(JOURNAL_SIZE, Image.Resampling.LANCZOS)

    # Slightly stronger editorial treatment for journal covers
    contrast = ImageEnhance.Contrast(img)
    img = contrast.enhance(1.04)

    img.save(output_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return output_path.stat().st_size


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def create_output_dirs():
    """Create all output directories."""
    created = []
    for name, path in OUTPUT_DIRS.items():
        path.mkdir(parents=True, exist_ok=True)
        created.append(str(path))
    return created


def scan_images() -> list[ImageInfo]:
    """Scan the img/ folder for all supported images."""
    images = []

    if not IMG_SOURCE.exists():
        print(f"ERROR: Source folder not found: {IMG_SOURCE}")
        sys.exit(1)

    # Exclude output subfolders
    ignored_folders = {"enhanced", "4k", "web", "thumbnails", "hero", "gallery", "journal"}

    for idx, filepath in enumerate(sorted(IMG_SOURCE.rglob("*")), start=1):
        if not filepath.is_file():
            continue
        if filepath.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        # Skip if inside an output subfolder
        if any(part in ignored_folders for part in filepath.relative_to(IMG_SOURCE).parts[:-1]):
            continue

        info = ImageInfo(
            filename=filepath.name,
            original_path=str(filepath),
            file_size=filepath.stat().st_size,
            clean_name=clean_filename(filepath.name, idx),
        )

        try:
            with Image.open(filepath) as img:
                img = auto_orient(img)
                info.width = img.width
                info.height = img.height
                info.format = img.format or filepath.suffix.upper().strip(".")
                info.orientation = detect_orientation(img.width, img.height)
                info.perceptual_hash = perceptual_hash(img)
                info.category = categorize_image(img, info)

                # Determine candidates
                if info.orientation == "landscape" and info.width >= 1200:
                    info.hero_candidate = True
                    info.journal_candidate = True
                elif info.orientation == "landscape":
                    info.journal_candidate = True

        except Exception as e:
            info.error = str(e)

        images.append(info)

    return images


def detect_duplicates(images: list[ImageInfo]) -> list[ImageInfo]:
    """Detect near-duplicate images using perceptual hash."""
    hash_map: dict[str, str] = {}
    threshold = 5  # Hamming distance threshold

    for img_info in images:
        if img_info.error or not img_info.perceptual_hash:
            continue

        is_dup = False
        for existing_hash, existing_name in hash_map.items():
            dist = hamming_distance(img_info.perceptual_hash, existing_hash)
            if dist <= threshold:
                img_info.is_duplicate = True
                img_info.duplicate_of = existing_name
                is_dup = True
                break

        if not is_dup:
            hash_map[img_info.perceptual_hash] = img_info.filename

    return images


def process_all(images: list[ImageInfo]) -> ProcessingReport:
    """Process every image through the enhancement pipeline."""
    report = ProcessingReport()
    report.total_discovered = len(images)
    report.folders_created = create_output_dirs()

    total = len(images)

    for idx, info in enumerate(images, start=1):
        prefix = f"[{idx}/{total}]"

        if info.error:
            print(f"  {prefix} SKIP (error): {info.filename} — {info.error}")
            report.total_failed += 1
            report.errors.append({"file": info.filename, "error": info.error})
            continue

        if info.is_duplicate:
            print(f"  {prefix} SKIP (duplicate of {info.duplicate_of}): {info.filename}")
            report.total_duplicates += 1
            # Still process duplicates for the gallery but mark them
            # Actually, skip duplicates entirely to avoid redundancy
            continue

        print(f"  {prefix} Processing: {info.filename}")
        print(f"           {info.width}x{info.height} | {info.orientation} | {info.category}")

        try:
            with Image.open(info.original_path) as img:
                img = auto_orient(img)
                img = img.convert("RGB")

                # ---- Enhancement ----
                enhanced = enhance_image(img)
                info.enhanced = True

                clean = info.clean_name

                # ---- Enhanced (full-res JPEG) ----
                enhanced_path = OUTPUT_DIRS["enhanced"] / f"{clean}.jpg"
                size = generate_enhanced(enhanced, enhanced_path)
                report.total_enhanced += 1
                report.total_storage_bytes += size

                # ---- Web-optimized WebP ----
                web_path = OUTPUT_DIRS["web"] / f"{clean}.webp"
                size = generate_web(enhanced, web_path)
                info.web_generated = True
                report.total_web_optimized += 1
                report.total_storage_bytes += size

                # ---- Thumbnail ----
                thumb_path = OUTPUT_DIRS["thumbnails"] / f"{clean}.webp"
                size = generate_thumbnail(enhanced, thumb_path)
                info.thumbnail_generated = True
                report.total_thumbnails += 1
                report.total_storage_bytes += size

                # ---- Gallery ----
                gallery_path = OUTPUT_DIRS["gallery"] / f"{clean}.webp"
                size = generate_gallery(enhanced, gallery_path)
                report.total_gallery += 1
                report.total_storage_bytes += size

                # ---- Hero (landscape images only) ----
                if info.hero_candidate:
                    hero_path = OUTPUT_DIRS["hero"] / f"{clean}.jpg"
                    size = generate_hero(enhanced, hero_path)
                    report.total_hero += 1
                    report.total_storage_bytes += size

                # ---- Journal cover (landscape images) ----
                if info.journal_candidate:
                    journal_path = OUTPUT_DIRS["journal"] / f"{clean}.jpg"
                    size = generate_journal(enhanced, journal_path)
                    report.total_journal += 1
                    report.total_storage_bytes += size

                print(f"           ✓ Enhanced | WebP | Thumb" +
                      (f" | Hero" if info.hero_candidate else "") +
                      (f" | Journal" if info.journal_candidate else ""))

        except Exception as e:
            info.error = str(e)
            report.total_failed += 1
            report.errors.append({"file": info.filename, "error": str(e)})
            print(f"           ✗ ERROR: {e}")

    report.images = [asdict(i) for i in images]
    return report


def generate_image_manifest(images: list[ImageInfo]):
    """
    Generate a TypeScript manifest file for website integration.
    Maps processed images to their web-ready paths with metadata.
    """
    manifest_entries = []

    for info in images:
        if info.error or info.is_duplicate:
            continue

        clean = info.clean_name
        entry = {
            "id": clean,
            "originalFilename": info.filename,
            "category": info.category,
            "orientation": info.orientation,
            "width": info.width,
            "height": info.height,
            "enhanced": f"/images/enhanced/{clean}.jpg",
            "web": f"/images/web/{clean}.webp",
            "thumbnail": f"/images/thumbnails/{clean}.webp",
            "gallery": f"/images/gallery/{clean}.webp",
        }
        if info.hero_candidate:
            entry["hero"] = f"/images/hero/{clean}.jpg"
        if info.journal_candidate:
            entry["journal"] = f"/images/journal/{clean}.jpg"

        manifest_entries.append(entry)

    # Write TypeScript manifest
    ts_path = PROJECT_ROOT / "src" / "data" / "imageManifest.ts"
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write("// Auto-generated by process_images.py — DO NOT EDIT MANUALLY\n")
        f.write("// Run: python scripts/process_images.py to regenerate\n\n")
        f.write("export interface ProcessedImage {\n")
        f.write("  id: string;\n")
        f.write("  originalFilename: string;\n")
        f.write("  category: 'Meetups' | 'Reading Sessions' | 'Community Moments' | 'Other';\n")
        f.write("  orientation: 'landscape' | 'portrait' | 'square';\n")
        f.write("  width: number;\n")
        f.write("  height: number;\n")
        f.write("  enhanced: string;\n")
        f.write("  web: string;\n")
        f.write("  thumbnail: string;\n")
        f.write("  gallery: string;\n")
        f.write("  hero?: string;\n")
        f.write("  journal?: string;\n")
        f.write("}\n\n")
        f.write(f"export const PROCESSED_IMAGES: ProcessedImage[] = {json.dumps(manifest_entries, indent=2)};\n\n")
        f.write(f"export const IMAGE_CATEGORIES = {json.dumps(sorted(set(e['category'] for e in manifest_entries)))};\n\n")

        # Group by category
        categories = {}
        for entry in manifest_entries:
            cat = entry["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(entry["id"])

        f.write(f"export const IMAGES_BY_CATEGORY: Record<string, string[]> = {json.dumps(categories, indent=2)};\n\n")

        # Hero and journal images
        hero_ids = [e["id"] for e in manifest_entries if "hero" in e]
        journal_ids = [e["id"] for e in manifest_entries if "journal" in e]
        f.write(f"export const HERO_IMAGE_IDS: string[] = {json.dumps(hero_ids)};\n\n")
        f.write(f"export const JOURNAL_IMAGE_IDS: string[] = {json.dumps(journal_ids)};\n")

    print(f"\n  ✓ TypeScript manifest written: {ts_path}")


def save_report(report: ProcessingReport):
    """Save the processing report as JSON."""
    report_path = PUBLIC_IMG / "processing-report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(asdict(report), f, indent=2, default=str)
    print(f"  ✓ Report saved: {report_path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("  READERS OF AURANGABAD — Image Enhancement Pipeline")
    print("  Making reading a part of everyday life again.")
    print("=" * 70)
    print()

    start_time = time.time()

    # 1. Scan
    print("► STEP 1: Scanning image folder...")
    images = scan_images()
    print(f"  Found {len(images)} images in {IMG_SOURCE}\n")

    if not images:
        print("  No images found. Exiting.")
        return

    # 2. Detect duplicates
    print("► STEP 2: Detecting duplicates...")
    images = detect_duplicates(images)
    dups = sum(1 for i in images if i.is_duplicate)
    print(f"  Found {dups} potential duplicates\n")

    # 3. Process
    print("► STEP 3: Processing images...")
    print(f"  Enhancement: editorial color grading + clarity + sharpening")
    print(f"  Outputs: enhanced, web (WebP), thumbnails, gallery, hero, journal\n")
    report = process_all(images)

    # 4. Generate manifest
    print("\n► STEP 4: Generating TypeScript image manifest...")
    generate_image_manifest(images)

    # 5. Save report
    print("\n► STEP 5: Saving processing report...")
    save_report(report)

    # 6. Summary
    elapsed = time.time() - start_time
    storage_mb = report.total_storage_bytes / (1024 * 1024)

    print("\n" + "=" * 70)
    print("  PROCESSING COMPLETE")
    print("=" * 70)
    print(f"""
  Total images discovered:     {report.total_discovered}
  Duplicates detected:         {report.total_duplicates}
  Successfully enhanced:       {report.total_enhanced}
  Web-optimized (WebP):        {report.total_web_optimized}
  Thumbnails generated:        {report.total_thumbnails}
  Gallery images:              {report.total_gallery}
  Hero banner images:          {report.total_hero}
  Journal cover images:        {report.total_journal}
  Failed:                      {report.total_failed}
  Total storage used:          {storage_mb:.1f} MB
  Processing time:             {elapsed:.1f}s

  Output structure:
    public/images/enhanced/    — Full-res enhanced JPEG
    public/images/web/         — WebP optimized for web
    public/images/thumbnails/  — Small preview WebP
    public/images/gallery/     — Gallery-ready WebP
    public/images/hero/        — 1920×1080 hero banners
    public/images/journal/     — 1200×800 editorial covers
""")

    if report.errors:
        print("  ⚠ Errors:")
        for err in report.errors:
            print(f"    • {err['file']}: {err['error']}")


if __name__ == "__main__":
    main()
