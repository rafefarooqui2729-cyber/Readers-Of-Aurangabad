import os
import sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageFont

IMG_DIR = r"D:\projects\Readers of Aurangabad\readers-of-aurangabad\img"
OUT_DIR = r"D:\projects\Readers of Aurangabad\readers-of-aurangabad\public\images\creative"
os.makedirs(OUT_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# STEP 1: Candidate Inspection & Contact Sheet
# -----------------------------------------------------------------------------
candidates = {
    "roa-009 (Main Group Meetup)": os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg"),
    "roa-006 (Terrace Steps Gathering)": os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.45.08 PM (6).jpeg"),
    "roa-049 (Park Circle Gathering)": os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.45.19 PM (1).jpeg"),
    "roa-054 (Grass Sitting Session)": os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.45.22 PM (1).jpeg"),
    "roa-019 (Open Book Pages Detail)": os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.45.09 PM (3).jpeg"),
    "roa-060 (Engrossed Reader Portrait)": os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.46.45 PM (3).jpeg"),
    "roa-059 (Reader in Conversation)": os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.46.45 PM (2).jpeg"),
    "roa-061 (Community Reader Close-up)": os.path.join(IMG_DIR, "WhatsApp Image 2026-11-05 at 6.46.45 PM (4).jpeg"),
}

# Verify files exist
valid_candidates = {}
for label, p in candidates.items():
    if os.path.exists(p):
        valid_candidates[label] = p
    else:
        print(f"Warning: {p} not found, searching directory...")

print(f"Found {len(valid_candidates)} primary candidates for contact sheet.")

# Build Contact Sheet (2 rows x 4 cols, each 480x320)
sheet_w, sheet_h = 1920, 1080
contact_sheet = Image.new("RGB", (sheet_w, sheet_h), (32, 35, 31))
draw = ImageDraw.Draw(contact_sheet)

col_w = sheet_w // 4
row_h = sheet_h // 2

for idx, (label, path) in enumerate(valid_candidates.items()):
    r = idx // 4
    c = idx % 4
    with Image.open(path) as img:
        img_rgb = img.convert("RGB")
        img_thumb = img_rgb.copy()
        img_thumb.thumbnail((col_w - 24, row_h - 48), Image.Resampling.LANCZOS)
        
        px = c * col_w + (col_w - img_thumb.width) // 2
        py = r * row_h + (row_h - 32 - img_thumb.height) // 2 + 16
        contact_sheet.paste(img_thumb, (px, py))
        
        # Border
        draw.rectangle([px - 2, py - 2, px + img_thumb.width + 1, py + img_thumb.height + 1], outline=(184, 154, 101), width=1)
        # Label
        draw.text((c * col_w + 16, r * row_h + row_h - 28), label, fill=(242, 235, 221))

contact_sheet_path = os.path.join(OUT_DIR, "roa-contact-sheet.webp")
contact_sheet.save(contact_sheet_path, "WEBP", quality=90)
print(f"Saved contact sheet to {contact_sheet_path}")

# -----------------------------------------------------------------------------
# Color Utilities
# -----------------------------------------------------------------------------
def apply_editorial_grading(img: Image.Image) -> Image.Image:
    """Enhances natural tone with warm paper highlights, muted olive midtones, and deep ink shadows."""
    arr = np.array(img, dtype=np.float32)
    # Warm lift: boost red slightly, tone down harsh blues
    arr[..., 0] = np.clip(arr[..., 0] * 1.04 + 4, 0, 255)
    arr[..., 1] = np.clip(arr[..., 1] * 1.02 + 2, 0, 255)
    arr[..., 2] = np.clip(arr[..., 2] * 0.94 - 2, 0, 255)
    
    # S-curve contrast on luminance
    res = Image.fromarray(arr.astype(np.uint8))
    res = ImageEnhance.Contrast(res).enhance(1.15)
    res = ImageEnhance.Color(res).enhance(1.08)
    return res

def add_paper_grain(img: Image.Image, intensity: float = 0.035) -> Image.Image:
    """Adds subtle analog grain texture without degrading facial clarity."""
    w, h = img.size
    np.random.seed(42)
    noise = np.random.normal(0, intensity * 255, (h, w, 1))
    arr = np.array(img, dtype=np.float32) + noise
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

# -----------------------------------------------------------------------------
# STEP 2: Signature Hero Composition (roa-community-hero.webp)
# -----------------------------------------------------------------------------
# Selected primary: roa-009 (Outdoor meetup with ~30 real smiling members)
main_group_path = valid_candidates.get("roa-009 (Main Group Meetup)")

with Image.open(main_group_path) as raw_hero:
    hero_rgb = raw_hero.convert("RGB")
    
    # --- DESKTOP HERO (2560 x 1440) ---
    target_w, target_h = 2560, 1440
    # Center-crop and scale
    orig_w, orig_h = hero_rgb.size
    scale = max(target_w / orig_w, target_h / orig_h)
    new_w, new_h = int(orig_w * scale), int(orig_h * scale)
    scaled_hero = hero_rgb.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Crop keeping vertical center around people's faces
    left = (new_w - target_w) // 2
    top = int((new_h - target_h) * 0.35)  # Slightly favor upper third where faces are
    cropped_hero = scaled_hero.crop((left, top, left + target_w, top + target_h))
    
    # Grade & grain
    graded_hero = apply_editorial_grading(cropped_hero)
    grained_hero = add_paper_grain(graded_hero, intensity=0.03)
    
    # Apply cinematic gradient protection layers
    # Bottom vignette: Deep Ink (#20231F = 32, 35, 31)
    grad_overlay = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad_overlay)
    
    for y in range(target_h):
        # Progress from 0 at top to 0.95 opacity at bottom
        progress = y / target_h
        if progress < 0.35:
            alpha = int(255 * (0.25 * (1 - progress / 0.35))) # Soft top shade for nav legibility
        elif progress > 0.5:
            p = (progress - 0.5) / 0.5
            alpha = int(255 * (0.2 + 0.78 * (p ** 1.8)))
        else:
            alpha = 30
        grad_draw.line([(0, y), (target_w, y)], fill=(32, 35, 31, alpha))
        
    final_hero_desktop = Image.alpha_composite(grained_hero.convert("RGBA"), grad_overlay)
    
    # Save Desktop Hero
    hero_desktop_path = os.path.join(OUT_DIR, "roa-community-hero.webp")
    final_hero_desktop.convert("RGB").save(hero_desktop_path, "WEBP", quality=92, method=6)
    print(f"Created {hero_desktop_path} ({target_w}x{target_h})")
    
    # --- MOBILE HERO (1080 x 1600) ---
    m_w, m_h = 1080, 1600
    m_scale = max(m_w / orig_w, m_h / orig_h)
    m_scaled = hero_rgb.resize((int(orig_w * m_scale), int(orig_h * m_scale)), Image.Resampling.LANCZOS)
    m_left = (m_scaled.width - m_w) // 2
    m_top = (m_scaled.height - m_h) // 2
    m_cropped = m_scaled.crop((m_left, m_top, m_left + m_w, m_top + m_h))
    
    m_graded = apply_editorial_grading(m_cropped)
    m_grained = add_paper_grain(m_graded, intensity=0.035)
    
    m_overlay = Image.new("RGBA", (m_w, m_h), (0, 0, 0, 0))
    m_draw = ImageDraw.Draw(m_overlay)
    for y in range(m_h):
        prog = y / m_h
        if prog < 0.25:
            alpha = int(255 * 0.35 * (1 - prog / 0.25))
        elif prog > 0.45:
            p = (prog - 0.45) / 0.55
            alpha = int(255 * (0.25 + 0.72 * (p ** 1.6)))
        else:
            alpha = 50
        m_draw.line([(0, y), (m_w, y)], fill=(32, 35, 31, alpha))
        
    final_hero_mobile = Image.alpha_composite(m_grained.convert("RGBA"), m_overlay)
    hero_mobile_path = os.path.join(OUT_DIR, "roa-community-hero-mobile.webp")
    final_hero_mobile.convert("RGB").save(hero_mobile_path, "WEBP", quality=92, method=6)
    print(f"Created {hero_mobile_path} ({m_w}x{m_h})")

# -----------------------------------------------------------------------------
# STEP 3: Multi-Layer Double-Exposure Photographic Composite (roa-double-exposure.webp)
# -----------------------------------------------------------------------------
# Layer 1 (Base Anchor): roa-009 (Main Community Group, landscape)
# Layer 2 (Reader Foreground): roa-060 (Engrossed reader with open book)
# Layer 3 (Detail / Texture): roa-019 (Open book pages, Deccan light)
# Layer 4 (Terrace Gathering): roa-006 (Stepped outdoor reading circle)
# Layer 5 (Discussion Candid): roa-054 (Grass sitting conversation)

comp_w, comp_h = 1920, 1080

with Image.open(candidates["roa-009 (Main Group Meetup)"]) as im1, \
     Image.open(candidates["roa-060 (Engrossed Reader Portrait)"]) as im2, \
     Image.open(candidates["roa-019 (Open Book Pages Detail)"]) as im3, \
     Image.open(candidates["roa-006 (Terrace Steps Gathering)"]) as im4, \
     Image.open(candidates["roa-054 (Grass Sitting Session)"]) as im5:

    # 1. Base Canvas - Deep Ink background with warm tone
    canvas = Image.new("RGBA", (comp_w, comp_h), (32, 35, 31, 255))
    
    # 2. Main Group Meetup (Center-right dominance)
    im1_scaled = im1.convert("RGB").resize((1380, 780), Image.Resampling.LANCZOS)
    im1_graded = apply_editorial_grading(im1_scaled)
    # Mask: soft oval fade around edges
    mask1 = Image.new("L", (1380, 780), 0)
    m1_draw = ImageDraw.Draw(mask1)
    m1_draw.ellipse([80, 40, 1300, 740], fill=240)
    mask1 = mask1.filter(ImageFilter.GaussianBlur(radius=50))
    canvas.paste(im1_graded, (540, 140), mask1)
    
    # 3. Terrace Steps Gathering (Upper-left background layer, blended softly)
    im4_scaled = im4.convert("RGB").resize((960, 720), Image.Resampling.LANCZOS)
    im4_graded = apply_editorial_grading(im4_scaled)
    mask4 = Image.new("L", (960, 720), 0)
    m4_draw = ImageDraw.Draw(mask4)
    m4_draw.ellipse([50, 40, 910, 680], fill=160)
    mask4 = mask4.filter(ImageFilter.GaussianBlur(radius=60))
    canvas.paste(im4_graded, (0, 0), mask4)
    
    # 4. Reader with Paperback Portrait (Left foreground anchor)
    im2_scaled = im2.convert("RGB")
    im2_scaled.thumbnail((720, 1000), Image.Resampling.LANCZOS)
    im2_graded = apply_editorial_grading(im2_scaled)
    mask2 = Image.new("L", im2_scaled.size, 0)
    m2_draw = ImageDraw.Draw(mask2)
    # Organic mask favoring subject silhouette
    m2_draw.ellipse([30, 20, im2_scaled.width - 20, im2_scaled.height - 30], fill=235)
    mask2 = mask2.filter(ImageFilter.GaussianBlur(radius=45))
    canvas.paste(im2_graded, (120, comp_h - im2_scaled.height + 40), mask2)
    
    # 5. Book Pages Detail (Lower right blend, light/screen texture)
    im3_scaled = im3.convert("RGB").resize((840, 460), Image.Resampling.LANCZOS)
    im3_graded = apply_editorial_grading(im3_scaled)
    mask3 = Image.new("L", (840, 460), 0)
    m3_draw = ImageDraw.Draw(mask3)
    m3_draw.ellipse([40, 30, 800, 430], fill=190)
    mask3 = mask3.filter(ImageFilter.GaussianBlur(radius=45))
    canvas.paste(im3_graded, (comp_w - 860, comp_h - 480), mask3)
    
    # 6. Overall atmospheric color wash (Terracotta & Antique Gold subtle hues)
    wash = Image.new("RGBA", (comp_w, comp_h), (0, 0, 0, 0))
    w_draw = ImageDraw.Draw(wash)
    # Warm antique gold glow around center-left
    w_draw.ellipse([300, 200, 1100, 900], fill=(184, 154, 101, 28))
    # Terracotta warmth at bottom right
    w_draw.ellipse([comp_w - 900, comp_h - 600, comp_w - 100, comp_h + 100], fill=(166, 95, 70, 32))
    # Deep Ink vignette on all borders
    for x in range(comp_w):
        d_edge = min(x, comp_w - x)
        if d_edge < 120:
            a = int(255 * (1 - d_edge / 120) * 0.75)
            w_draw.line([(x, 0), (x, comp_h)], fill=(32, 35, 31, a))
    for y in range(comp_h):
        d_edge = min(y, comp_h - y)
        if d_edge < 100:
            a = int(255 * (1 - d_edge / 100) * 0.75)
            w_draw.line([(0, y), (comp_w, y)], fill=(32, 35, 31, a))
            
    wash = wash.filter(ImageFilter.GaussianBlur(radius=30))
    canvas = Image.alpha_composite(canvas, wash)
    
    # Add subtle editorial frame / thin hairline border in antique gold
    border_draw = ImageDraw.Draw(canvas)
    border_draw.rectangle([24, 24, comp_w - 25, comp_h - 25], outline=(184, 154, 101, 70), width=1)
    
    # Paper grain finish
    final_comp_desktop = add_paper_grain(canvas.convert("RGB"), intensity=0.032)
    comp_desktop_path = os.path.join(OUT_DIR, "roa-double-exposure.webp")
    final_comp_desktop.save(comp_desktop_path, "WEBP", quality=92, method=6)
    print(f"Created {comp_desktop_path} ({comp_w}x{comp_h})")
    
    # --- MOBILE COMPOSITION (1080 x 1350) ---
    mcomp_w, mcomp_h = 1080, 1350
    m_canvas = Image.new("RGBA", (mcomp_w, mcomp_h), (32, 35, 31, 255))
    
    # Top half: Main Meetup Group
    m_im1 = im1.convert("RGB").resize((1080, 610), Image.Resampling.LANCZOS)
    m_im1_graded = apply_editorial_grading(m_im1)
    m_mask1 = Image.new("L", (1080, 610), 0)
    ImageDraw.Draw(m_mask1).rectangle([0, 0, 1080, 520], fill=255)
    m_mask1 = m_mask1.filter(ImageFilter.GaussianBlur(radius=35))
    m_canvas.paste(m_im1_graded, (0, 0), m_mask1)
    
    # Bottom half: Reader portrait + book blend
    m_im2 = im2.convert("RGB")
    m_im2.thumbnail((620, 800), Image.Resampling.LANCZOS)
    m_im2_graded = apply_editorial_grading(m_im2)
    m_mask2 = Image.new("L", m_im2.size, 0)
    ImageDraw.Draw(m_mask2).ellipse([20, 20, m_im2.width - 20, m_im2.height - 20], fill=240)
    m_mask2 = m_mask2.filter(ImageFilter.GaussianBlur(radius=40))
    m_canvas.paste(m_im2_graded, (40, mcomp_h - m_im2.height + 20), m_mask2)
    
    # Book pages in bottom right
    m_im3 = im3.convert("RGB").resize((600, 340), Image.Resampling.LANCZOS)
    m_im3_graded = apply_editorial_grading(m_im3)
    m_mask3 = Image.new("L", (600, 340), 0)
    ImageDraw.Draw(m_mask3).ellipse([30, 20, 570, 320], fill=180)
    m_mask3 = m_mask3.filter(ImageFilter.GaussianBlur(radius=35))
    m_canvas.paste(m_im3_graded, (mcomp_w - 560, mcomp_h - 360), m_mask3)
    
    # Mobile paper grain
    final_comp_mobile = add_paper_grain(m_canvas.convert("RGB"), intensity=0.035)
    comp_mobile_path = os.path.join(OUT_DIR, "roa-double-exposure-mobile.webp")
    final_comp_mobile.save(comp_mobile_path, "WEBP", quality=92, method=6)
    print(f"Created {comp_mobile_path} ({mcomp_w}x{mcomp_h})")

print("All signature compositions created successfully!")
