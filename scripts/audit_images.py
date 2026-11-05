"""Audit all images: originals and processed versions."""
from PIL import Image
import os

results = []

dirs_to_scan = [
    ('img/original', 'original'),
    ('public/images/processed/hero', 'proc/hero'),
    ('public/images/processed/gallery', 'proc/gallery'),
    ('public/images/processed/community', 'proc/community'),
    ('public/images/processed/journal', 'proc/journal'),
    ('public/images/processed/mobile', 'proc/mobile'),
    ('public/images/processed/desktop', 'proc/desktop'),
    ('public/images/processed/thumbnails', 'proc/thumbnails'),
    ('public/brand', 'brand'),
]

for dir_path, label in dirs_to_scan:
    if not os.path.isdir(dir_path):
        print(f"[SKIP] {dir_path} does not exist")
        continue
    for f in sorted(os.listdir(dir_path)):
        fp = os.path.join(dir_path, f)
        if not os.path.isfile(fp):
            continue
        try:
            im = Image.open(fp)
            w, h = im.size
            kb = os.path.getsize(fp) // 1024
            ratio = f"{w/h:.2f}"
            results.append({
                'label': label,
                'file': f,
                'w': w, 'h': h,
                'mode': im.mode,
                'kb': kb,
                'ratio': ratio
            })
        except Exception as e:
            results.append({
                'label': label,
                'file': f,
                'w': 0, 'h': 0,
                'mode': 'ERR',
                'kb': os.path.getsize(fp) // 1024,
                'ratio': 'N/A'
            })

# Print results
current_label = None
for r in results:
    if r['label'] != current_label:
        current_label = r['label']
        print(f"\n{'='*80}")
        print(f"  {current_label.upper()}")
        print(f"{'='*80}")
    print(f"  {r['file']:55s}  {r['w']:5d}x{r['h']:<5d}  {r['mode']:5s}  {r['kb']:>5d}KB  ratio={r['ratio']}")

print(f"\n{'='*80}")
print(f"  TOTAL: {len(results)} images audited")
print(f"{'='*80}")
