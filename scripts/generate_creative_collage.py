import os
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageFont, ImageOps

os.makedirs('public/images/creative', exist_ok=True)

def load_and_resize(path, target_size, fit_mode='cover'):
    im = Image.open(path).convert('RGB')
    tw, th = target_size
    iw, ih = im.size
    
    if fit_mode == 'cover':
        scale = max(tw / iw, th / ih)
        nw, nh = int(iw * scale), int(ih * scale)
        im = im.resize((nw, nh), Image.Resampling.LANCZOS)
        # Center crop
        left = (nw - tw) // 2
        top = (nh - th) // 2
        return im.crop((left, top, left + tw, top + th))
    else:
        return im.resize(target_size, Image.Resampling.LANCZOS)

def apply_editorial_grading(im, tint_color=(119, 124, 96), warmth=0.15):
    # Palette: Warm Paper #F2EBDD (242, 235, 221), Deep Ink #20231F (32, 35, 31)
    arr = np.array(im, dtype=np.float32)
    
    # Gentle S-curve contrast
    arr = arr / 255.0
    arr = 0.5 * (1 - np.cos(np.pi * arr))
    arr = arr * 255.0
    
    # Warm Paper highlight bias & deep ink shadow bias
    lum = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0
    
    # Add subtle olive-terracotta editorial warmth in midtones
    mid_mask = np.sin(np.pi * lum)[:, :, np.newaxis]
    arr[:, :, 0] += mid_mask[:, :, 0] * (tint_color[0] - 128) * warmth
    arr[:, :, 1] += mid_mask[:, :, 0] * (tint_color[1] - 128) * warmth
    arr[:, :, 2] += mid_mask[:, :, 0] * (tint_color[2] - 128) * (warmth * 0.7)
    
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

def add_paper_grain(im, intensity=9):
    arr = np.array(im, dtype=np.float32)
    noise = np.random.normal(0, intensity, arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

# -----------------------------------------------------------------------------
# 1. SIGNATURE GROUP TITLE IMAGE (4K roa-009 with Deep Ink vignette & Warm Paper grading)
# -----------------------------------------------------------------------------
print('Creating signature group title compositions...')
source_group = 'img/4k/roa-009-2026-11-05.jpg'
if not os.path.exists(source_group):
    source_group = 'public/images/web/roa-009-2026-11-05.webp'

# Desktop (2560 x 1440)
im_group_dt = load_and_resize(source_group, (2560, 1440), 'cover')
im_group_dt = apply_editorial_grading(im_group_dt, tint_color=(119, 124, 96), warmth=0.12)
im_group_dt = add_paper_grain(im_group_dt, intensity=7)

# Add cinematic gradient vignette (Deep Ink #20231F = 32, 35, 31)
vig_arr = np.zeros((1440, 2560, 4), dtype=np.uint8)
# Gradient from bottom and top
for y in range(1440):
    # Top shadow
    top_factor = max(0.0, 1.0 - (y / 450.0)) * 0.65
    # Bottom shadow
    bot_factor = max(0.0, (y - 700.0) / 740.0) * 0.88
    # Overall ambient dark tint
    total_alpha = int(min(255, (0.28 + top_factor * 0.45 + bot_factor * 0.65) * 255))
    vig_arr[y, :, 0] = 32
    vig_arr[y, :, 1] = 35
    vig_arr[y, :, 2] = 31
    vig_arr[y, :, 3] = total_alpha

vignette_im = Image.fromarray(vig_arr, mode='RGBA')
im_group_dt_rgba = im_group_dt.convert('RGBA')
im_group_dt_final = Image.alpha_composite(im_group_dt_rgba, vignette_im).convert('RGB')
im_group_dt_final.save('public/images/creative/signature-group-title-desktop.webp', 'WEBP', quality=92)
print('Saved: public/images/creative/signature-group-title-desktop.webp')

# Mobile (1080 x 1600)
im_group_mb = load_and_resize(source_group, (1080, 1600), 'cover')
im_group_mb = apply_editorial_grading(im_group_mb, tint_color=(119, 124, 96), warmth=0.14)
im_group_mb = add_paper_grain(im_group_mb, intensity=7)

vig_mb_arr = np.zeros((1600, 1080, 4), dtype=np.uint8)
for y in range(1600):
    top_factor = max(0.0, 1.0 - (y / 500.0)) * 0.60
    bot_factor = max(0.0, (y - 800.0) / 800.0) * 0.85
    total_alpha = int(min(255, (0.35 + top_factor * 0.4 + bot_factor * 0.6) * 255))
    vig_mb_arr[y, :, 0] = 32
    vig_mb_arr[y, :, 1] = 35
    vig_mb_arr[y, :, 2] = 31
    vig_mb_arr[y, :, 3] = total_alpha

vignette_mb = Image.fromarray(vig_mb_arr, mode='RGBA')
im_group_mb_final = Image.alpha_composite(im_group_mb.convert('RGBA'), vignette_mb).convert('RGB')
im_group_mb_final.save('public/images/creative/signature-group-title-mobile.webp', 'WEBP', quality=92)
print('Saved: public/images/creative/signature-group-title-mobile.webp')

# -----------------------------------------------------------------------------
# 2. SIGNATURE DOUBLE-EXPOSURE PHOTOGRAPHIC COLLAGE (Desktop 1920x1080)
# -----------------------------------------------------------------------------
print('\nCreating signature double-exposure photographic collage...')

# Base Plate A: Grand outdoor meetup gathering (roa-009)
base_gather = load_and_resize('public/images/web/roa-009-2026-11-05.webp', (1920, 1080), 'cover')

# Exposure B: Portrait of young reader immersed in book on stone steps (roa-060)
expo_reader = load_and_resize('public/images/web/roa-060-2026-11-05.webp', (1920, 1080), 'cover')

# Exposure C: Close-up printed paperback pages & physical reading (roa-019 / roa-020)
book_source = 'public/images/web/roa-019-2026-11-05.webp'
if not os.path.exists(book_source):
    book_source = 'public/images/web/roa-020-2026-11-05.webp'
expo_book = load_and_resize(book_source, (1920, 1080), 'cover')

# Double Exposure Blend:
# Left half features the reading focus and book pages; Right half reveals the expansive community gathering
arr_a = np.array(base_gather, dtype=np.float32)
arr_b = np.array(expo_reader, dtype=np.float32)
arr_c = np.array(expo_book, dtype=np.float32)

# Blend mask 1: Soft diagonal linear ramp across X-axis
x_coords = np.linspace(0, 1, 1920)
mask_b = np.tile(np.clip(1.2 - x_coords * 1.5, 0.0, 1.0), (1080, 1))[:, :, np.newaxis]

# Mask 2: Central book pages soft light blend
y_coords = np.linspace(0, 1, 1080)
mask_c_y = np.sin(np.pi * y_coords)
mask_c_x = np.sin(np.pi * x_coords * 0.7)
mask_c = (mask_c_y[:, np.newaxis] * mask_c_x[np.newaxis, :])[:, :, np.newaxis] * 0.38

# Composite: Screen blend between reader and book in foreground, fading into community in background
# Photoshop Screen formula: 255 - ((255 - A) * (255 - B) / 255)
screen_bc = 255.0 - ((255.0 - arr_b) * (255.0 - arr_c) / 255.0)

# Master blend
arr_comp = arr_a * (1.0 - mask_b) + (arr_b * 0.75 + screen_bc * 0.25) * mask_b
arr_comp = np.clip(arr_comp, 0, 255).astype(np.uint8)

im_comp = Image.fromarray(arr_comp)

# Editorial Tone Curve: Tint with Muted Olive (#777C60) and Terracotta (#A65F46)
im_comp = apply_editorial_grading(im_comp, tint_color=(125, 120, 100), warmth=0.18)

# Add subtle film grain for analog print quality
im_comp = add_paper_grain(im_comp, intensity=8)

# Add elegant editorial border overlay and framing
draw = ImageDraw.Draw(im_comp)
# Fine editorial inner line
draw.rectangle([(40, 40), (1880, 1040)], outline=(242, 235, 221), width=1)
draw.rectangle([(46, 46), (1874, 1034)], outline=(32, 35, 31, 120), width=1)

im_comp.save('public/images/creative/double-exposure-collage-desktop.webp', 'WEBP', quality=92)
print('Saved: public/images/creative/double-exposure-collage-desktop.webp')

# -----------------------------------------------------------------------------
# 3. SIGNATURE DOUBLE-EXPOSURE COLLAGE (Mobile 1080x1350 - 4:5 vertical)
# -----------------------------------------------------------------------------
base_gather_mb = load_and_resize('public/images/web/roa-009-2026-11-05.webp', (1080, 1350), 'cover')
expo_reader_mb = load_and_resize('public/images/web/roa-060-2026-11-05.webp', (1080, 1350), 'cover')
expo_book_mb = load_and_resize(book_source, (1080, 1350), 'cover')

arr_a_mb = np.array(base_gather_mb, dtype=np.float32)
arr_b_mb = np.array(expo_reader_mb, dtype=np.float32)
arr_c_mb = np.array(expo_book_mb, dtype=np.float32)

y_mb = np.linspace(0, 1, 1350)
mask_mb_vert = np.tile(np.clip(y_mb * 1.4 - 0.2, 0.0, 1.0)[:, np.newaxis], (1, 1080))[:, :, np.newaxis]

arr_comp_mb = arr_b_mb * (1.0 - mask_mb_vert * 0.75) + arr_a_mb * (mask_mb_vert * 0.75)
screen_c_mb = 255.0 - ((255.0 - arr_comp_mb) * (255.0 - arr_c_mb) / 255.0)
arr_comp_mb = arr_comp_mb * 0.78 + screen_c_mb * 0.22
arr_comp_mb = np.clip(arr_comp_mb, 0, 255).astype(np.uint8)

im_comp_mb = Image.fromarray(arr_comp_mb)
im_comp_mb = apply_editorial_grading(im_comp_mb, tint_color=(125, 120, 100), warmth=0.18)
im_comp_mb = add_paper_grain(im_comp_mb, intensity=8)

draw_mb = ImageDraw.Draw(im_comp_mb)
draw_mb.rectangle([(30, 30), (1050, 1320)], outline=(242, 235, 221), width=1)

im_comp_mb.save('public/images/creative/double-exposure-collage-mobile.webp', 'WEBP', quality=92)
print('Saved: public/images/creative/double-exposure-collage-mobile.webp')

print('\nAll creative compositions generated successfully!')
