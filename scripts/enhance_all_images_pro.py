import os
import sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageStat

BASE_DIR = r"D:\projects\Readers of Aurangabad\readers-of-aurangabad"
IMG_DIR = os.path.join(BASE_DIR, "img")
PUBLIC_HERO_DIR = os.path.join(BASE_DIR, "public", "images", "hero")
PUBLIC_WEB_DIR = os.path.join(BASE_DIR, "public", "images", "web")
PUBLIC_GALLERY_DIR = os.path.join(BASE_DIR, "public", "images", "gallery")
PUBLIC_THUMB_DIR = os.path.join(BASE_DIR, "public", "images", "thumbnails")

for d in [PUBLIC_HERO_DIR, PUBLIC_WEB_DIR, PUBLIC_GALLERY_DIR, PUBLIC_THUMB_DIR]:
    os.makedirs(d, exist_ok=True)

print("Starting Professional Image Enhancement Pipeline...")

def analyze_and_correct(img: Image.Image) -> Image.Image:
    """Corrects exposure, natural contrast, and color balance while preserving natural skin tones."""
    stat = ImageStat.Stat(img)
    mean_b = sum(stat.mean[:3]) / 3.0
    r, g, b = stat.mean[:3]

    res = img.copy()

    # 1. Exposure correction
    if mean_b < 95:
        factor = min(1.3, 118 / max(mean_b, 40))
        res = ImageEnhance.Brightness(res).enhance(factor)
    elif mean_b > 165:
        factor = max(0.82, 135 / max(mean_b, 50))
        res = ImageEnhance.Brightness(res).enhance(factor)

    # 2. Contrast
    std_avg = sum(stat.stddev[:3]) / 3.0
    if std_avg < 45:
        res = ImageEnhance.Contrast(res).enhance(1.12)
    elif std_avg > 80:
        res = ImageEnhance.Contrast(res).enhance(0.96)
    else:
        res = ImageEnhance.Contrast(res).enhance(1.04)

    # 3. Editorial color warmth (subtle lift, keeping skin tones natural)
    arr = np.array(res, dtype=np.float32)
    # Warm tone: slight warm lift in highlights/midtones
    arr[..., 0] = np.clip(arr[..., 0] * 1.025 + 1.5, 0, 255) # Red
    arr[..., 1] = np.clip(arr[..., 1] * 1.01 + 0.5, 0, 255)  # Green
    arr[..., 2] = np.clip(arr[..., 2] * 0.97 - 1.0, 0, 255)  # Blue
    res = Image.fromarray(arr.astype(np.uint8))

    # Gentle color saturation
    res = ImageEnhance.Color(res).enhance(1.05)

    # 4. Subtle Unsharp Mask for crisp tactile detail (books, faces, clothing)
    res = res.filter(ImageFilter.UnsharpMask(radius=1.2, percent=65, threshold=2))

    return res

# -----------------------------------------------------------------------------
# 1. HERO COMPOSITION: roa-009 ("WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg")
# -----------------------------------------------------------------------------
hero_src = os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg")
if os.path.exists(hero_src):
    with Image.open(hero_src) as raw_hero:
        raw_rgb = raw_hero.convert("RGB")
        w, h = raw_rgb.size
        print(f"Hero source original size: {w}x{h}")

        # The community occupies y=310 to y=700.
        # y=0 to y=95 is empty sky above palm tops.
        # Cropping y from 90 to 720 (height = 630):
        # Keeps 220px of lush palm tree fronds above the heads for majestic natural framing!
        # Increases community scale by ~15% and eliminates dead upper sky!
        crop_top = 90
        hero_cropped = raw_rgb.crop((0, crop_top, w, h))
        cw, ch = hero_cropped.size
        print(f"Hero cropped size (excess sky removed): {cw}x{ch}")

        hero_enhanced = analyze_and_correct(hero_cropped)

        # High-res Desktop Hero: 2560 x 1260
        target_desktop_w, target_desktop_h = 2560, int(2560 * (ch / cw))
        hero_desktop = hero_enhanced.resize((target_desktop_w, target_desktop_h), Image.Resampling.LANCZOS)
        desktop_out = os.path.join(PUBLIC_HERO_DIR, "roa-group-hero-clean.webp")
        hero_desktop.save(desktop_out, "WEBP", quality=92, method=6)
        print(f"Saved Desktop Hero: {desktop_out} ({target_desktop_w}x{target_desktop_h})")

        # Also save dedicated high-res file
        hero_desktop_alt = os.path.join(PUBLIC_HERO_DIR, "roa-hero-desktop.webp")
        hero_desktop.save(hero_desktop_alt, "WEBP", quality=92, method=6)

        # Mobile Hero: 1080 x 680 (Wide aspect ratio so ALL 35 members remain visible without side cropping)
        target_mobile_w = 1080
        target_mobile_h = int(1080 * (ch / cw))
        hero_mobile = hero_enhanced.resize((target_mobile_w, target_mobile_h), Image.Resampling.LANCZOS)
        mobile_out = os.path.join(PUBLIC_HERO_DIR, "roa-hero-mobile.webp")
        hero_mobile.save(mobile_out, "WEBP", quality=90, method=6)
        print(f"Saved Mobile Hero: {mobile_out} ({target_mobile_w}x{target_mobile_h})")

# -----------------------------------------------------------------------------
# 2. KEY SECONDARY HEROES AND FEATURED CARDS
# -----------------------------------------------------------------------------
secondary_photos = {
    # roa-006: Terrace Steps Gathering (OurStoryPage hero)
    "roa-006-2026-11-05": {
        "file": "WhatsApp Image 2026-11-05 at 6.45.08 PM (6).jpeg", # 1280x960
        # y=0 to y=120 is empty sky/trees above terrace. Crop top 100px.
        "crop": (0, 80, 1280, 960),
        "target_size": (1920, 1320)
    },
    # roa-051: Bookstore Entrance Group (GatheringsPage hero)
    "roa-051-2026-11-05": {
        "file": "WhatsApp Image 2026-11-05 at 6.45.19 PM (1).jpeg", # 1600x1200
        # Heads start around y=350. Crop top 120px to bring group forward.
        "crop": (0, 100, 1600, 1200),
        "target_size": (1920, 1320)
    },
    # roa-019: Open Book Pages Detail (JournalPage hero)
    "roa-019-2026-11-05": {
        "file": "WhatsApp Image 2026-11-05 at 6.45.09 PM (3).jpeg", # 1179x641
        "crop": None,
        "target_size": (1920, 1044)
    },
    # roa-049: Park Circle Gathering (CommunityPage hero)
    "roa-049-2026-11-05": {
        "file": "WhatsApp Image 2026-11-05 at 6.45.19 PM.jpeg", # 1600x1200
        "crop": (0, 80, 1600, 1200),
        "target_size": (1920, 1344)
    },
    # roa-060: Engrossed Reader Portrait (GetInvolvedPage hero)
    "roa-060-2026-11-05": {
        "file": "WhatsApp Image 2026-11-05 at 6.46.45 PM (3).jpeg", # 922x1600
        # Reader is centered. Crop top 100px of background ceiling.
        "crop": (0, 80, 922, 1600),
        "target_size": (1200, 1978)
    },
    # roa-054: Grass Sitting Session (ContactPage hero)
    "roa-054-2026-11-05": {
        "file": "WhatsApp Image 2026-11-05 at 6.45.22 PM (1).jpeg", # 1280x854
        # Crop top 60px of upper trees
        "crop": (0, 60, 1280, 854),
        "target_size": (1920, 1190)
    }
}

for img_id, meta in secondary_photos.items():
    src_path = os.path.join(IMG_DIR, meta["file"])
    if os.path.exists(src_path):
        with Image.open(src_path) as im:
            im_rgb = im.convert("RGB")
            if meta["crop"]:
                im_rgb = im_rgb.crop(meta["crop"])
            enhanced = analyze_and_correct(im_rgb)
            # High-res web output
            out_web = os.path.join(PUBLIC_WEB_DIR, f"{img_id}.webp")
            resized = enhanced.resize(meta["target_size"], Image.Resampling.LANCZOS)
            resized.save(out_web, "WEBP", quality=90, method=6)
            print(f"Processed secondary hero: {out_web} ({meta['target_size']})")

print("Key hero assets enhanced successfully!")
