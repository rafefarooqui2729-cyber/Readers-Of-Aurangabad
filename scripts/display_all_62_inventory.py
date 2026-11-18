import json
import os

with open('scripts/parsed_raw_inventory.json', 'r', encoding='utf-8') as f:
    images = json.load(f)

# Also check AI_IMAGE_MAPPINGS from src/data/imageMapping.ts or processing-report.json
with open('public/images/processing-report.json', 'r', encoding='utf-8') as f:
    p_report = json.load(f)

p_map = {item['filename']: item for item in p_report.get('images', [])}

print(f"{'#':<3} | {'Clean ID':<16} | {'Resolution':<12} | {'Category':<18} | {'Sharpness':<10} | {'Noise':<6} | {'Original Filename'}")
print("-" * 110)
for img in images:
    fname = img['filename']
    meta = p_map.get(fname, {})
    clean_id = meta.get('clean_name', img['clean_name'])
    cat = meta.get('category', img['category'])
    print(f"{img['index']:<3} | {clean_id:<16} | {img['width']}x{img['height']:<6} | {cat:<18} | {img['sharpness']:<10} | {img['noise']:<6} | {fname[:40]}")
