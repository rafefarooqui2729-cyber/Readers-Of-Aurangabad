import re
import json

# 1. Load processing report to get filename -> clean_id mapping
with open('public/images/processing-report.json', 'r', encoding='utf-8') as f:
    rep = json.load(f)

file_to_clean = {}
for img in rep.get('images', []):
    file_to_clean[img['filename']] = img['clean_name']

# Also map gallery-01 to gallery-18
gallery_to_clean = {
    'gallery-01': 'roa-009-2026-11-05',
    'gallery-02': 'roa-006-2026-11-05',
    'gallery-03': 'roa-060-2026-11-05',
    'gallery-04': 'roa-059-2026-11-05',
    'gallery-05': 'roa-019-2026-11-05',
    'gallery-06': 'roa-051-2026-11-05',
    'gallery-07': 'roa-049-2026-11-05',
    'gallery-08': 'roa-054-2026-11-05',
    'gallery-09': 'roa-057-2026-11-05',
    'gallery-10': 'roa-058-2026-11-05',
    'gallery-11': 'roa-061-2026-11-05',
    'gallery-12': 'roa-062-2026-11-05',
    'gallery-13': 'roa-044-2026-11-05',
    'gallery-14': 'roa-020-2026-11-05',
    'gallery-15': 'roa-047-2026-11-05',
    'gallery-16': 'roa-046-2026-11-05',
    'gallery-17': 'roa-001-2026-11-05',
    'gallery-18': 'roa-002-2026-11-05',
}

# Update TRANSFORMED_COMMUNITY_GALLERY in src/data/imageMapping.ts
with open('src/data/imageMapping.ts', 'r', encoding='utf-8') as f:
    mapping_content = f.read()

def repl_gal_item(match):
    full_str = match.group(0)
    # Check originalSource
    src_m = re.search(r'"originalSource":\s*"([^"]+)"', full_str)
    if src_m:
        src_file = src_m.group(1)
        clean = file_to_clean.get(src_file)
        if clean:
            full_str = re.sub(r'"imageUrl":\s*"[^"]+"', f'"imageUrl": "/images/enhanced/gallery/{clean}.webp"', full_str)
            full_str = re.sub(r'"mobileUrl":\s*"[^"]+"', f'"mobileUrl": "/images/enhanced/mobile/{clean}-mobile.webp"', full_str)
            full_str = re.sub(r'"thumbUrl":\s*"[^"]+"', f'"thumbUrl": "/images/enhanced/thumbnails/{clean}-thumb.webp"', full_str)
    return full_str

# Replace each item in TRANSFORMED_COMMUNITY_GALLERY
pattern = re.compile(r'\{\s*"id":\s*"gal-\d+".*?"originalSource":\s*"[^"]+"\s*\}', re.DOTALL)
mapping_updated = pattern.sub(repl_gal_item, mapping_content)

with open('src/data/imageMapping.ts', 'w', encoding='utf-8') as f:
    f.write(mapping_updated)
print("✓ Updated TRANSFORMED_COMMUNITY_GALLERY in src/data/imageMapping.ts")

# 2. Update initialData.ts
with open('src/data/initialData.ts', 'r', encoding='utf-8') as f:
    init_content = f.read()

# Replace /images/edited/gallery/gallery-XX.webp with enhanced
def repl_init_gal(match):
    gal_num = match.group(1)
    clean = gallery_to_clean.get(f'gallery-{gal_num}', 'roa-009-2026-11-05')
    return f'/images/enhanced/gallery/{clean}.webp'

def repl_init_thumb(match):
    gal_num = match.group(1)
    clean = gallery_to_clean.get(f'gallery-{gal_num}', 'roa-009-2026-11-05')
    return f'/images/enhanced/thumbnails/{clean}-thumb.webp'

init_updated = re.sub(r'/images/edited/gallery/gallery-(\d+)\.webp', repl_init_gal, init_content)
init_updated = re.sub(r'/images/edited/gallery/gallery-(\d+)-thumb\.webp', repl_init_thumb, init_updated)

with open('src/data/initialData.ts', 'w', encoding='utf-8') as f:
    f.write(init_updated)
print("✓ Updated initialData.ts with enhanced image paths")

# 3. Update mediaPlaylist.ts
with open('src/data/mediaPlaylist.ts', 'r', encoding='utf-8') as f:
    pl_content = f.read()

pl_updated = re.sub(r'/images/edited/gallery/gallery-(\d+)-thumb\.webp', repl_init_thumb, pl_content)

with open('src/data/mediaPlaylist.ts', 'w', encoding='utf-8') as f:
    f.write(pl_updated)
print("✓ Updated mediaPlaylist.ts with enhanced thumbnail paths")

# 4. Update instagramService.ts
with open('src/services/instagramService.ts', 'r', encoding='utf-8') as f:
    ig_content = f.read()

ig_updated = re.sub(r'/images/edited/gallery/gallery-(\d+)\.webp', repl_init_gal, ig_content)
ig_updated = re.sub(r'/images/edited/gallery/gallery-(\d+)-thumb\.webp', repl_init_thumb, ig_updated)

with open('src/services/instagramService.ts', 'w', encoding='utf-8') as f:
    f.write(ig_updated)
print("✓ Updated instagramService.ts with enhanced paths")
