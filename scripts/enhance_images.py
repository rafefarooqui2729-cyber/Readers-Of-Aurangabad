"""
Professional Image Enhancement & Preparation for Readers of Aurangabad.
Genuine image processing: exposure correction, color grading, sharpening,
smart cropping, and multi-format output.

This creates properly sized images for each website placement.
"""
from PIL import Image, ImageFilter, ImageEnhance, ImageStat
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG_DIR = os.path.join(BASE, 'img', 'original')
OUT_DIR = os.path.join(BASE, 'public', 'images', 'edited')

# Also mirror to img/edited for reference
IMG_EDIT_DIR = os.path.join(BASE, 'img', 'edited')

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def analyze_image(img):
    """Analyze image for brightness, contrast, and color cast."""
    stat = ImageStat.Stat(img)
    means = stat.mean[:3]
    avg_brightness = sum(means) / 3
    # Detect color cast
    r, g, b = means
    avg = avg_brightness
    r_cast = (r - avg) / max(avg, 1)
    g_cast = (g - avg) / max(avg, 1)
    b_cast = (b - avg) / max(avg, 1)
    return {
        'brightness': avg_brightness,
        'r_mean': r, 'g_mean': g, 'b_mean': b,
        'r_cast': r_cast, 'g_cast': g_cast, 'b_cast': b_cast,
        'stddev': stat.stddev[:3]
    }

def enhance_image(img):
    """Apply professional-grade enhancement."""
    analysis = analyze_image(img)
    result = img.copy()
    
    # 1. Exposure correction: target brightness ~115-130
    brightness = analysis['brightness']
    if brightness < 90:
        factor = min(1.4, 120 / max(brightness, 30))
        result = ImageEnhance.Brightness(result).enhance(factor)
    elif brightness > 170:
        factor = max(0.75, 130 / max(brightness, 50))
        result = ImageEnhance.Brightness(result).enhance(factor)
    
    # 2. Contrast enhancement
    std_avg = sum(analysis['stddev']) / 3
    if std_avg < 45:
        result = ImageEnhance.Contrast(result).enhance(1.15)
    elif std_avg > 80:
        result = ImageEnhance.Contrast(result).enhance(0.95)
    else:
        result = ImageEnhance.Contrast(result).enhance(1.05)
    
    # 3. Color correction: reduce blue/cold cast, warm up slightly
    if analysis['b_cast'] > 0.05:
        # Image has blue cast - warm it up
        result = ImageEnhance.Color(result).enhance(1.05)
    
    # 4. Warm editorial color grading
    # Slight warmth boost (increase saturation gently, shift toward warm)
    result = ImageEnhance.Color(result).enhance(1.08)
    
    # 5. Sharpening (subtle, not over-sharpened)
    result = result.filter(ImageFilter.UnsharpMask(radius=1.5, percent=80, threshold=3))
    
    return result

def smart_crop_top(img, target_w, target_h, focus='top-third'):
    """Smart crop that preserves the top portion (faces, heads)."""
    w, h = img.size
    target_ratio = target_w / target_h
    current_ratio = w / h
    
    if abs(current_ratio - target_ratio) < 0.02:
        return img.resize((target_w, target_h), Image.LANCZOS)
    
    if current_ratio > target_ratio:
        # Image is wider than needed - crop sides, keep center
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        cropped = img.crop((left, 0, left + new_w, h))
    else:
        # Image is taller than needed - crop bottom, keep top (faces)
        new_h = int(w / target_ratio)
        if focus == 'top-third':
            top = 0  # Keep top
        elif focus == 'center':
            top = max(0, (h - new_h) // 2)
        else:
            top = 0
        cropped = img.crop((0, top, w, top + new_h))
    
    return cropped.resize((target_w, target_h), Image.LANCZOS)

def save_webp(img, path, quality=82):
    """Save as high-quality WebP."""
    img.save(path, 'WEBP', quality=quality, method=6)

# ── Map original files to their best use ──
# Based on visual inspection from audit: identify the best group/landscape photos
# WhatsApp originals: mix of portrait (0.57 ratio), landscape (1.33-1.84), square (1.0)

print("="*60)
print("  READERS OF AURANGABAD — IMAGE ENHANCEMENT PIPELINE")
print("="*60)

# Scan originals
originals = sorted([f for f in os.listdir(ORIG_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])
print(f"\n  Found {len(originals)} original images")

# Create output directories
subdirs = ['hero', 'community', 'gatherings', 'gallery', 'journal', 'cards', 'mobile']
for sd in subdirs:
    ensure_dir(os.path.join(OUT_DIR, sd))
    ensure_dir(os.path.join(IMG_EDIT_DIR, sd))

# ── Categorize originals by aspect ratio and content ──
landscapes = []  # ratio > 1.2
squares = []     # ratio ~1.0
portraits = []   # ratio < 0.8

for f in originals:
    fp = os.path.join(ORIG_DIR, f)
    try:
        img = Image.open(fp)
        w, h = img.size
        ratio = w / h
        entry = {'file': f, 'path': fp, 'w': w, 'h': h, 'ratio': ratio}
        if ratio > 1.2:
            landscapes.append(entry)
        elif ratio < 0.8:
            portraits.append(entry)
        else:
            squares.append(entry)
    except:
        pass

print(f"  Landscapes: {len(landscapes)}, Squares: {len(squares)}, Portraits: {len(portraits)}")

# Sort landscapes by resolution (highest first for hero)
landscapes.sort(key=lambda x: x['w'] * x['h'], reverse=True)
squares.sort(key=lambda x: x['w'] * x['h'], reverse=True)
portraits.sort(key=lambda x: x['w'] * x['h'], reverse=True)

processed_count = 0

# ── 1. HERO IMAGES ──
# Use the best landscape for hero (widest, highest-res)
print("\n▶ Processing HERO images...")
if landscapes:
    # Primary hero: widest landscape
    hero_src = landscapes[0]
    img = Image.open(hero_src['path']).convert('RGB')
    img = enhance_image(img)
    
    # Desktop hero: 1920x800
    hero_desktop = smart_crop_top(img, 1920, 800, 'top-third')
    save_webp(hero_desktop, os.path.join(OUT_DIR, 'hero', 'hero-main-desktop.webp'), quality=85)
    save_webp(hero_desktop, os.path.join(IMG_EDIT_DIR, 'hero', 'hero-main-desktop.webp'), quality=85)
    print(f"  ✓ hero-main-desktop.webp (1920x800) from {hero_src['file']}")
    processed_count += 1
    
    # Tablet hero: 1024x600
    hero_tablet = smart_crop_top(img, 1024, 600, 'top-third')
    save_webp(hero_tablet, os.path.join(OUT_DIR, 'hero', 'hero-main-tablet.webp'), quality=82)
    save_webp(hero_tablet, os.path.join(IMG_EDIT_DIR, 'hero', 'hero-main-tablet.webp'), quality=82)
    print(f"  ✓ hero-main-tablet.webp (1024x600)")
    processed_count += 1
    
    # Mobile hero: 640x480
    hero_mobile = smart_crop_top(img, 640, 480, 'top-third')
    save_webp(hero_mobile, os.path.join(OUT_DIR, 'hero', 'hero-main-mobile.webp'), quality=80)
    save_webp(hero_mobile, os.path.join(IMG_EDIT_DIR, 'hero', 'hero-main-mobile.webp'), quality=80)
    print(f"  ✓ hero-main-mobile.webp (640x480)")
    processed_count += 1

# Secondary hero from second landscape or best portrait
if len(landscapes) > 1:
    hero2_src = landscapes[1]
    img = Image.open(hero2_src['path']).convert('RGB')
    img = enhance_image(img)
    hero2 = smart_crop_top(img, 1200, 700, 'top-third')
    save_webp(hero2, os.path.join(OUT_DIR, 'hero', 'hero-secondary.webp'), quality=82)
    save_webp(hero2, os.path.join(IMG_EDIT_DIR, 'hero', 'hero-secondary.webp'), quality=82)
    print(f"  ✓ hero-secondary.webp (1200x700) from {hero2_src['file']}")
    processed_count += 1

# Hero portrait card (for the right column of homepage hero)
if portraits:
    # Use highest-res portrait  
    portrait_src = portraits[0]
    img = Image.open(portrait_src['path']).convert('RGB')
    img = enhance_image(img)
    
    # Portrait card: 500x650
    portrait_card = smart_crop_top(img, 500, 650, 'top-third')
    save_webp(portrait_card, os.path.join(OUT_DIR, 'hero', 'hero-portrait-card.webp'), quality=82)
    save_webp(portrait_card, os.path.join(IMG_EDIT_DIR, 'hero', 'hero-portrait-card.webp'), quality=82)
    print(f"  ✓ hero-portrait-card.webp (500x650) from {portrait_src['file']}")
    processed_count += 1
    
    # Mobile portrait: 400x500
    portrait_mobile = smart_crop_top(img, 400, 500, 'top-third')
    save_webp(portrait_mobile, os.path.join(OUT_DIR, 'hero', 'hero-portrait-mobile.webp'), quality=80)
    save_webp(portrait_mobile, os.path.join(IMG_EDIT_DIR, 'hero', 'hero-portrait-mobile.webp'), quality=80)
    print(f"  ✓ hero-portrait-mobile.webp (400x500)")
    processed_count += 1

# ── 2. GATHERING/MEETUP CARDS ──
print("\n▶ Processing GATHERINGS cards...")
# Use a mix of landscape + square for meetup banners
gathering_sources = (landscapes[1:4] if len(landscapes) > 1 else []) + squares[:3]
for i, src in enumerate(gathering_sources[:6]):
    img = Image.open(src['path']).convert('RGB')
    img = enhance_image(img)
    
    # Meetup card: 800x480 (5:3 ratio, good for cards)
    card = smart_crop_top(img, 800, 480, 'top-third')
    fname = f'meetup-card-{i+1}.webp'
    save_webp(card, os.path.join(OUT_DIR, 'gatherings', fname), quality=80)
    save_webp(card, os.path.join(IMG_EDIT_DIR, 'gatherings', fname), quality=80)
    print(f"  ✓ {fname} (800x480) from {src['file'][:50]}")
    processed_count += 1

# ── 3. COMMUNITY IMAGES ──
print("\n▶ Processing COMMUNITY images...")
# Founder portrait (use a good portrait photo)
if len(portraits) > 1:
    founder_src = portraits[1]  # Second portrait (first used for hero)
    img = Image.open(founder_src['path']).convert('RGB')
    img = enhance_image(img)
    
    # Square avatar: 400x400
    avatar = smart_crop_top(img, 400, 400, 'top-third')
    save_webp(avatar, os.path.join(OUT_DIR, 'community', 'founder-portrait.webp'), quality=82)
    save_webp(avatar, os.path.join(IMG_EDIT_DIR, 'community', 'founder-portrait.webp'), quality=82)
    print(f"  ✓ founder-portrait.webp (400x400)")
    processed_count += 1
    
    # Wider portrait for story page: 600x750
    wider = smart_crop_top(img, 600, 750, 'top-third')
    save_webp(wider, os.path.join(OUT_DIR, 'community', 'founder-wide.webp'), quality=82)
    save_webp(wider, os.path.join(IMG_EDIT_DIR, 'community', 'founder-wide.webp'), quality=82)
    print(f"  ✓ founder-wide.webp (600x750)")
    processed_count += 1

# Reader avatars from different portraits
avatar_idx = 2
for name in ['reader-1', 'reader-2', 'reader-3']:
    if avatar_idx < len(portraits):
        src = portraits[avatar_idx]
        img = Image.open(src['path']).convert('RGB')
        img = enhance_image(img)
        avatar = smart_crop_top(img, 300, 300, 'top-third')
        save_webp(avatar, os.path.join(OUT_DIR, 'community', f'{name}-avatar.webp'), quality=78)
        save_webp(avatar, os.path.join(IMG_EDIT_DIR, 'community', f'{name}-avatar.webp'), quality=78)
        print(f"  ✓ {name}-avatar.webp (300x300)")
        processed_count += 1
        avatar_idx += 1

# Community banner: use a high-res square
if squares:
    img = Image.open(squares[0]['path']).convert('RGB')
    img = enhance_image(img)
    banner = smart_crop_top(img, 1200, 500, 'center')
    save_webp(banner, os.path.join(OUT_DIR, 'community', 'community-banner.webp'), quality=82)
    save_webp(banner, os.path.join(IMG_EDIT_DIR, 'community', 'community-banner.webp'), quality=82)
    print(f"  ✓ community-banner.webp (1200x500)")
    processed_count += 1

# ── 4. GALLERY IMAGES ──
print("\n▶ Processing GALLERY images...")
# Create properly sized gallery items from all sources
all_sources = landscapes + squares + portraits
gallery_sources = all_sources[:18]  # Up to 18 gallery items

for i, src in enumerate(gallery_sources):
    img = Image.open(src['path']).convert('RGB')
    img = enhance_image(img)
    
    # Gallery desktop: 900x675 (4:3)
    gal = smart_crop_top(img, 900, 675, 'top-third')
    fname = f'gallery-{i+1:02d}.webp'
    save_webp(gal, os.path.join(OUT_DIR, 'gallery', fname), quality=80)
    save_webp(gal, os.path.join(IMG_EDIT_DIR, 'gallery', fname), quality=80)
    
    # Gallery thumbnail: 400x300
    thumb = smart_crop_top(img, 400, 300, 'top-third')
    tname = f'gallery-{i+1:02d}-thumb.webp'
    save_webp(thumb, os.path.join(OUT_DIR, 'gallery', tname), quality=75)
    save_webp(thumb, os.path.join(IMG_EDIT_DIR, 'gallery', tname), quality=75)
    
    # Gallery mobile: 600x450
    mob = smart_crop_top(img, 600, 450, 'top-third')
    mname = f'gallery-{i+1:02d}-mobile.webp'
    save_webp(mob, os.path.join(OUT_DIR, 'gallery', mname), quality=78)
    save_webp(mob, os.path.join(IMG_EDIT_DIR, 'gallery', mname), quality=78)
    
    print(f"  ✓ {fname} + thumb + mobile from {src['file'][:45]}")
    processed_count += 3

# ── 5. JOURNAL COVERS ──
print("\n▶ Processing JOURNAL covers...")
# Use squares for journal covers (editorial look)
journal_sources = squares[3:7] if len(squares) > 3 else squares[:4]
for i, src in enumerate(journal_sources):
    img = Image.open(src['path']).convert('RGB')
    img = enhance_image(img)
    
    # Journal cover: 800x600 (4:3 landscape editorial)
    cover = smart_crop_top(img, 800, 600, 'center')
    fname = f'journal-cover-{i+1}.webp'
    save_webp(cover, os.path.join(OUT_DIR, 'journal', fname), quality=80)
    save_webp(cover, os.path.join(IMG_EDIT_DIR, 'journal', fname), quality=80)
    print(f"  ✓ {fname} (800x600)")
    processed_count += 1

# ── 6. CARD IMAGES (for various card uses across site) ──
print("\n▶ Processing CARD images...")
card_sources = squares[1:5] + landscapes[:2]
for i, src in enumerate(card_sources):
    img = Image.open(src['path']).convert('RGB')
    img = enhance_image(img)
    
    # Card: 600x400
    card = smart_crop_top(img, 600, 400, 'top-third')
    fname = f'card-{i+1}.webp'
    save_webp(card, os.path.join(OUT_DIR, 'cards', fname), quality=78)
    save_webp(card, os.path.join(IMG_EDIT_DIR, 'cards', fname), quality=78)
    print(f"  ✓ {fname} (600x400)")
    processed_count += 1

# ── 7. MOBILE-SPECIFIC CROPS ──
print("\n▶ Processing MOBILE images...")
mobile_sources = portraits[:6] + squares[:2]
for i, src in enumerate(mobile_sources[:8]):
    img = Image.open(src['path']).convert('RGB')
    img = enhance_image(img)
    
    # Mobile banner: 640x360
    mob = smart_crop_top(img, 640, 360, 'top-third')
    fname = f'mobile-{i+1}.webp'
    save_webp(mob, os.path.join(OUT_DIR, 'mobile', fname), quality=78)
    save_webp(mob, os.path.join(IMG_EDIT_DIR, 'mobile', fname), quality=78)
    print(f"  ✓ {fname} (640x360)")
    processed_count += 1

print(f"\n{'='*60}")
print(f"  COMPLETE: {processed_count} images processed and saved")
print(f"  Output: {OUT_DIR}")
print(f"  Mirror: {IMG_EDIT_DIR}")
print(f"{'='*60}")
