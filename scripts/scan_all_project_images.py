import os
from PIL import Image

exts = ('.jpg', '.jpeg', '.png', '.webp', '.avif')
dirs_to_ignore = {'.git', 'node_modules', 'dist', '.gemini'}

all_images = []
for root, dirs, files in os.walk('.'):
    # Skip ignored dirs
    dirs[:] = [d for d in dirs if d not in dirs_to_ignore]
    for f in files:
        if f.lower().endswith(exts):
            full_p = os.path.normpath(os.path.join(root, f))
            try:
                sz = os.path.getsize(full_p)
                with Image.open(full_p) as im:
                    w, h = im.size
                    fmt = im.format
                all_images.append({
                    'path': full_p,
                    'filename': f,
                    'size': sz,
                    'width': w,
                    'height': h,
                    'format': fmt
                })
            except Exception as e:
                all_images.append({
                    'path': full_p,
                    'filename': f,
                    'size': sz,
                    'error': str(e)
                })

print(f'Total images discovered across project: {len(all_images)}')

# Group by directory prefix
from collections import defaultdict
by_dir = defaultdict(list)
for item in all_images:
    d = os.path.dirname(item['path'])
    by_dir[d].append(item)

print('\nBreakdown by directory:')
for d in sorted(by_dir.keys()):
    print(f'  {d}: {len(by_dir[d])} images')
