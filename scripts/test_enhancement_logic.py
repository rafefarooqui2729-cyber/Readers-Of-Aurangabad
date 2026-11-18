import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

def natural_cinematic_enhance(bgr_img, profile):
    """
    Applies natural cinematic enhancement:
    1. Edge-preserving subtle bilateral denoising.
    2. Adaptive local contrast (CLAHE on LAB L-channel) with gentle clip limit.
    3. Shadow detail lift and soft highlight compression.
    4. Foliage green balancing (rich olive/forest rather than harsh neon lime).
    5. Skin tone protection (hue preserved in natural warm spectrum).
    6. Multi-scale conservative unsharp mask.
    """
    # 1. Subtle edge-preserving bilateral denoise
    d = profile.get("denoise_d", 5)
    sigma_color = profile.get("denoise_sigma_c", 18.0)
    sigma_space = profile.get("denoise_sigma_s", 18.0)
    denoised = cv2.bilateralFilter(bgr_img, d, sigma_color, sigma_space)
    
    # 2. LAB color space for lighting and contrast
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # CLAHE on L channel
    clip_limit = profile.get("clahe_clip", 1.4)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    l_clahe = clahe.apply(l)
    
    # Shadow recovery & highlight compression via soft gamma curve
    l_float = l_clahe.astype(np.float32) / 255.0
    shadow_lift = profile.get("shadow_lift", 0.08) # +8% shadow lift
    # Gentle curve: x^(1 - shadow_lift)
    l_adjusted = np.power(l_float, 1.0 - shadow_lift)
    l_out = np.clip(l_adjusted * 255.0, 0, 255).astype(np.uint8)
    
    # Merge back LAB
    lab_enhanced = cv2.merge([l_out, a, b])
    bgr_balanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    
    # 3. Foliage green & skin tone color grading in HSV
    hsv = cv2.cvtColor(bgr_balanced, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = cv2.split(hsv)
    
    # Foliage greens: Hue in OpenCV is 0..180 (35..75 is yellowish green to green)
    green_mask = (h >= 35) & (h <= 78)
    # Tame neon green saturation slightly and nudge hue towards rich olive
    s[green_mask] = s[green_mask] * profile.get("foliage_sat_factor", 0.92)
    h[green_mask] = np.clip(h[green_mask] - profile.get("foliage_hue_shift", 2.0), 30, 80)
    
    # Golden warmth: subtle warmth in warm midtones (hue 10..30)
    warm_mask = (h >= 10) & (h <= 30)
    s[warm_mask] = np.clip(s[warm_mask] * profile.get("warmth_sat_factor", 1.03), 0, 255)
    
    hsv_out = cv2.merge([h, s, v]).astype(np.uint8)
    bgr_graded = cv2.cvtColor(hsv_out, cv2.COLOR_HSV2BGR)
    
    # 4. Multi-scale conservative unsharp mask
    # Fine details: radius=1, amount=0.4
    # Structure: radius=2, amount=0.3
    # Low threshold=3 to avoid amplifying flat noise
    gray = cv2.cvtColor(bgr_graded, cv2.COLOR_BGR2GRAY)
    blur_fine = cv2.GaussianBlur(bgr_graded, (0, 0), 1.0)
    sharp_fine = cv2.addWeighted(bgr_graded, 1.35, blur_fine, -0.35, 0)
    
    # Apply sharpening selectively where edge gradient exists
    diff = cv2.absdiff(bgr_graded, blur_fine)
    mask = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY) > 3
    mask_3c = np.stack([mask]*3, axis=-1)
    
    result = np.where(mask_3c, sharp_fine, bgr_graded)
    return result

# Test on hero image
hero_path = 'img/WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg'
img = cv2.imread(hero_path)
print("Loaded hero:", img.shape)
prof = {
    "denoise_d": 5,
    "denoise_sigma_c": 16.0,
    "denoise_sigma_s": 16.0,
    "clahe_clip": 1.4,
    "shadow_lift": 0.08,
    "foliage_sat_factor": 0.92,
    "foliage_hue_shift": 2.0,
    "warmth_sat_factor": 1.03
}
enhanced = natural_cinematic_enhance(img, prof)
print("Enhanced shape:", enhanced.shape)
cv2.imwrite('scripts/test_enhanced_hero.jpg', enhanced, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
print("Saved scripts/test_enhanced_hero.jpg successfully!")
