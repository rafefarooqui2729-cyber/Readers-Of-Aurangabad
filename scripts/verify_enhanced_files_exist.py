import os
import re

pattern = re.compile(r'[\'"`](/images/enhanced/[^\'"`]+)[\'"`]')
missing = []
found = []

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx', '.json', '.html', '.css')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as src_f:
                content = src_f.read()
                matches = pattern.findall(content)
                for m in matches:
                    disk_p = os.path.normpath(os.path.join('public', m.lstrip('/')))
                    if not os.path.exists(disk_p):
                        missing.append((m, p, disk_p))
                    else:
                        found.append(m)

print(f"Total verified references to enhanced images: {len(found)}")
print(f"Unique verified enhanced images: {len(set(found))}")
print(f"Missing enhanced images: {len(missing)}")
if missing:
    for m, p, dp in missing[:10]:
        print(f"  MISSING: {m} in {p} (looked at {dp})")
