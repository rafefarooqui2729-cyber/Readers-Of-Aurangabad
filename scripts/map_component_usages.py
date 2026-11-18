import os
import re
import json

# Read image mappings from src/data/imageMapping.ts
with open('src/data/imageMapping.ts', 'r', encoding='utf-8') as f:
    img_mapping_ts = f.read()

# Read initialData.ts
with open('src/data/initialData.ts', 'r', encoding='utf-8') as f:
    initial_data_ts = f.read()

# Read imageManifest.ts
with open('src/data/imageManifest.ts', 'r', encoding='utf-8') as f:
    manifest_ts = f.read()

# Read all components and pages
components_usage = {}
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as src_file:
                content = src_file.read()
                # Find all image paths
                matches = re.findall(r'[\'"`](/images/[^\'"`]+)[\'"`]', content)
                for m in matches:
                    if m not in components_usage:
                        components_usage[m] = []
                    components_usage[m].append(os.path.basename(p))

print(f"Total distinct /images/ paths referenced in code: {len(components_usage)}")
sample_refs = sorted(list(components_usage.keys()))[:25]
for s in sample_refs:
    print(f"  {s} -> {', '.join(set(components_usage[s]))}")

with open('scripts/component_image_usage.json', 'w', encoding='utf-8') as out:
    json.dump({k: list(set(v)) for k, v in components_usage.items()}, out, indent=2)
