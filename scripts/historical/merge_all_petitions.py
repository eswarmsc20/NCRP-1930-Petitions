import json

years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

merged = []
global_id = 1

year_counts = {}

for yr in years:
    with open(f'data/petitions_{yr}.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    year_counts[yr] = len(data)
    for p in data:
        p['id'] = global_id
        p['sl_no'] = global_id
        p['year'] = yr
        global_id += 1
        merged.append(p)

print("Year breakdown:")
for yr, cnt in year_counts.items():
    print(f"  {yr}: {cnt:,} petitions")
print(f"Total merged petitions: {len(merged):,}")

# Save to data/petitions.json and public/data/petitions.json
with open('data/petitions.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)

with open('public/data/petitions.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)

print("Successfully updated data/petitions.json and public/data/petitions.json!")
