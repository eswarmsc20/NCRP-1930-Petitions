import json

with open('data/petitions_2019.json', 'r', encoding='utf-8') as f:
    p2019 = json.load(f)

with open('data/petitions_2020.json', 'r', encoding='utf-8') as f:
    p2020 = json.load(f)

with open('data/petitions_2026.json', 'r', encoding='utf-8') as f:
    p2026 = json.load(f)

print(f"2019 count: {len(p2019)}")
print(f"2020 count: {len(p2020)}")
print(f"2026 count: {len(p2026)}")

# Merge in chronological order
merged = []
global_id = 1

for p in p2019:
    p['id'] = global_id
    p['year'] = 2019
    global_id += 1
    merged.append(p)

for p in p2020:
    p['id'] = global_id
    p['year'] = 2020
    global_id += 1
    merged.append(p)

for p in p2026:
    p['id'] = global_id
    p['year'] = 2026
    global_id += 1
    merged.append(p)

print(f"Total merged: {len(merged)}")

with open('data/petitions.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)

with open('public/data/petitions.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)

print("Saved to data/petitions.json and public/data/petitions.json successfully!")
