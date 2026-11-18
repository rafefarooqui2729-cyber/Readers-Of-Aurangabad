import os
import json
from PIL import Image

with open('public/images/processing-report.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

img_info = report.get('images', [])

print(f"Loaded {len(img_info)} images from processing-report.json")
# Group by orientation
by_orient = {}
for item in img_info:
    o = item.get('orientation', 'unknown')
    by_orient.setdefault(o, []).append(item)

for o, items in by_orient.items():
    print(f"Orientation '{o}': {len(items)} images")

# Let's inspect the landscape and meetup items
print("\n--- Landscape / Wide images ---")
for item in img_info:
    if item.get('orientation') == 'landscape' or item['width'] > item['height']:
        print(f"  {item['clean_name']}: {item['filename']} | {item['width']}x{item['height']} | {item['category']}")
