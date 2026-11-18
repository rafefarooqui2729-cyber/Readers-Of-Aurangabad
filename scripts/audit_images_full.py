import os
import glob
import re
from PIL import Image

# 1. Map all image references in src/
src_files = glob.glob('src/**/*', recursive=True)
used_images = set()
for f in src_files:
    if os.path.isfile(f) and f.endswith(('.tsx', '.ts', '.css')):
        with open(f, 'r', encoding='utf-8') as fp:
            content = fp.read()
            matches = re.findall(r'[\'"](/images/[^\'"]+\.(?:webp|jpg|jpeg|png))[\'"]', content)
            for m in matches:
                used_images.add(m)

print(f"Total distinct image paths referenced in src: {len(used_images)}")
for img in sorted(used_images):
    print(" ", img)

# 2. Inspect all images in img/
img_dir = 'img'
raw_files = [f for f in os.listdir(img_dir) if f.lower().endswith(('.jpeg', '.jpg', '.png'))]
print(f"\nTotal raw images in img/: {len(raw_files)}")

categories = {
    'group_landscape': [],
    'reading_portrait': [],
    'individual_portrait': [],
    'books_objects': []
}

for f in raw_files:
    path = os.path.join(img_dir, f)
    with Image.open(path) as im:
        w, h = im.size
        ratio = round(w / h, 2)
        print(f"{f}: {w}x{h} (ratio: {ratio})")
