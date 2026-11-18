import re
import json

with open('src/data/imageMapping.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract TRANSFORMED_COMMUNITY_GALLERY
gal_match = re.search(r'export const TRANSFORMED_COMMUNITY_GALLERY: ProcessedGalleryItem\[\] = (\[.*?\]);', text, re.DOTALL)
if gal_match:
    gal_json = gal_match.group(1)
    # Parse json loosely or with json.loads
    try:
        gallery_items = json.loads(gal_json)
        print(f"Loaded {len(gallery_items)} gallery items from TRANSFORMED_COMMUNITY_GALLERY")
        for item in gallery_items[:5]:
            print(f"  {item['id']}: {item['title']} -> {item['originalSource']} ({item['imageUrl']})")
    except Exception as e:
        print("JSON parse error:", e)

# Extract AI_IMAGE_MAPPINGS
ai_match = re.search(r'export const AI_IMAGE_MAPPINGS: ImageMappingEntry\[\] = (\[.*?\]);', text, re.DOTALL)
if ai_match:
    try:
        ai_items = json.loads(ai_match.group(1))
        print(f"Loaded {len(ai_items)} AI image mappings")
        for item in ai_items[:5]:
            print(f"  {item['id']} ({item['component']}) -> {item['originalFilename']} ({item['processedPath']})")
    except Exception as e:
        print("AI JSON parse error:", e)
