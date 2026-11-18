import cv2
import numpy as np

def make_before_after_comparison(orig_bgr, enhanced_bgr, title="Hero Group Gathering", orig_label="Original Camera (1280x720)", enh_label="Natural Cinematic 4K (2560x1260)"):
    # Target height for preview card = 700px
    target_h = 700
    
    # Resize both to target height maintaining aspect ratio
    h1, w1 = orig_bgr.shape[:2]
    w1_scaled = int(w1 * (target_h / h1))
    orig_scaled = cv2.resize(orig_bgr, (w1_scaled, target_h), interpolation=cv2.INTER_AREA)
    
    h2, w2 = enhanced_bgr.shape[:2]
    w2_scaled = int(w2 * (target_h / h2))
    enh_scaled = cv2.resize(enhanced_bgr, (w2_scaled, target_h), interpolation=cv2.INTER_AREA)
    
    # Combined canvas: header 80px, images, footer 40px
    canvas_w = w1_scaled + w2_scaled + 24 # 24px divider
    canvas_h = target_h + 120
    
    canvas = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
    # Background color: warm dark charcoal #1C1B1A -> BGR: (26, 27, 28)
    canvas[:] = (26, 27, 28)
    
    # Place images
    canvas[80:80+target_h, 8:8+w1_scaled] = orig_scaled
    canvas[80:80+target_h, 16+w1_scaled:16+w1_scaled+w2_scaled] = enh_scaled
    
    # Vertical divider line
    canvas[80:80+target_h, 8+w1_scaled+4:8+w1_scaled+5] = (60, 65, 55)
    
    # Draw header text
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(canvas, title.upper(), (20, 42), font, 0.85, (220, 235, 242), 2, cv2.LINE_AA)
    
    # Sub-labels
    cv2.putText(canvas, f"BEFORE: {orig_label}", (20, 70), font, 0.5, (160, 165, 155), 1, cv2.LINE_AA)
    cv2.putText(canvas, f"AFTER: {enh_label}", (16+w1_scaled, 70), font, 0.5, (101, 154, 184), 1, cv2.LINE_AA)
    
    # Footer
    cv2.putText(canvas, "Readers of Aurangabad | Natural Cinematic Photographic Restoration", (20, canvas_h - 15), font, 0.45, (120, 125, 115), 1, cv2.LINE_AA)
    
    return canvas

# Test
orig = cv2.imread('img/WhatsApp Image 2026-11-05 at 6.45.08 PM.jpeg')
enh = cv2.imread('scripts/test_enhanced_hero.jpg')
card = make_before_after_comparison(orig, enh)
cv2.imwrite('scripts/test_before_after_hero.jpg', card, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
print("Saved scripts/test_before_after_hero.jpg, size:", card.shape)
