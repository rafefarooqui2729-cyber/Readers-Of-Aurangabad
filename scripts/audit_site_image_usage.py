import os
import re

pattern = re.compile(r'[\'"`]([^\'"`]*?\.(?:webp|jpg|jpeg|png|avif))[\'"`]', re.IGNORECASE)
found = {}
all_refs = set()

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.css', '.html', '.json')):
            p = os.path.join(root, file)
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                matches = pattern.findall(content)
                if matches:
                    found[p] = list(set(matches))
                    for m in matches:
                        all_refs.add(m)

print(f'Total distinct image references across src/: {len(all_refs)}')
print(f'Files referencing images in src/: {len(found)}')
for f, m in found.items():
    print(f'{f}: {len(m)} references')
    for x in sorted(m)[:3]:
        print(f'   {x}')
    if len(m) > 3:
        print(f'   ... and {len(m) - 3} more')

print('\nUnique image references sample:')
for r in sorted(all_refs)[:20]:
    print(' ', r)
