import os
import json
from PIL import Image
import cv2
import numpy as np

def estimate_noise_and_sharpness(img_path):
    try:
        # Read with cv2
        img = cv2.imread(img_path)
        if img is None:
            return 0.0, 0.0
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Laplacian variance for sharpness
        sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
        # Fast noise estimation via difference from median blur
        blurred = cv2.medianBlur(gray, 3)
        noise = np.std(gray.astype(np.float32) - blurred.astype(np.float32))
        return float(sharpness), float(noise)
    except Exception as e:
        return 0.0, 0.0

# Load existing processing-report.json if available
report_data = {}
if os.path.exists('public/images/processing-report.json'):
    with open('public/images/processing-report.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data.get('images', []):
            report_data[item['filename']] = item

img_dir = 'img'
files = sorted([f for f in os.listdir(img_dir) if os.path.isfile(os.path.join(img_dir, f)) and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])

print(f'Total original images in img/: {len(files)}')

results = []
for i, f in enumerate(files):
    full_p = os.path.join(img_dir, f)
    sz = os.path.getsize(full_p)
    with Image.open(full_p) as im:
        w, h = im.size
        fmt = im.format
    sh, nse = estimate_noise_and_sharpness(full_p)
    prev = report_data.get(f, {})
    clean_name = prev.get('clean_name', f'roa-{i+1:03d}')
    category = prev.get('category', 'Community Moments')
    
    results.append({
        'index': i + 1,
        'filename': f,
        'clean_name': clean_name,
        'width': w,
        'height': h,
        'aspect_ratio': f'{w/h:.2f}',
        'size_kb': sz // 1024,
        'format': fmt,
        'sharpness': round(sh, 1),
        'noise': round(nse, 1),
        'category': category
    })

print(f'Parsed {len(results)} images. Sample:')
for r in results[:10]:
    print(f"[{r['index']:02d}] {r['clean_name']} | {r['width']}x{r['height']} ({r['aspect_ratio']}) | {r['size_kb']}KB | Sharpness: {r['sharpness']} | Noise: {r['noise']} | {r['category']}")

with open('scripts/parsed_raw_inventory.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
