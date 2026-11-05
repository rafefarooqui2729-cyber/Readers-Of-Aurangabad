import json
from pathlib import Path

with open(r"d:\projects\Readers of Aurangabad\readers-of-aurangabad\public\images\processing-report.json", encoding="utf-8") as f:
    data = json.load(f)

for img in data["images"]:
    if not img.get("is_duplicate"):
        print(f"{img['clean_name']}: {img['filename']} | {img['width']}x{img['height']} | {img['orientation']} | {img['category']}")
