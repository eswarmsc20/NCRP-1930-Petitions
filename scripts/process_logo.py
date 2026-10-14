import sys
from PIL import Image, ImageFilter
import numpy as np

img_path = "/Users/cybercommando/.gemini/antigravity/brain/7edec9a7-024d-4be8-a165-7802f4c5fc60/.user_uploaded/media_1791958646202_7d357116.jpg"
out_dir = "/Users/cybercommando/Desktop/NCRP/public/images"

img = Image.open(img_path).convert("RGBA")
width, height = img.size
print(f"Loaded image: {width}x{height}")

# Flood fill from the four corners (0,0), (width-1, 0), (0, height-1), (width-1, height-1)
# to only make external white/near-white pixels transparent, preserving temple white inside
from collections import deque

data = np.array(img)
# shape: (height, width, 4)
visited = np.zeros((height, width), dtype=bool)

# A pixel is considered "outer background" if R > 235 and G > 235 and B > 235
def is_bg(r, g, b):
    return r > 230 and g > 230 and b > 230

queue = deque()
# Start from all boundary pixels that match bg
for x in range(width):
    for y in [0, 1, height-2, height-1]:
        r, g, b, _ = data[y, x]
        if is_bg(r, g, b) and not visited[y, x]:
            visited[y, x] = True
            queue.append((x, y))

for y in range(height):
    for x in [0, 1, width-2, width-1]:
        r, g, b, _ = data[y, x]
        if is_bg(r, g, b) and not visited[y, x]:
            visited[y, x] = True
            queue.append((x, y))

while queue:
    cx, cy = queue.popleft()
    data[cy, cx, 3] = 0  # Set alpha to 0 (transparent)

    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (1,-1), (-1,1), (1,1)]:
        nx, ny = cx + dx, cy + dy
        if 0 <= nx < width and 0 <= ny < height and not visited[ny, nx]:
            nr, ng, nb, _ = data[ny, nx]
            if is_bg(nr, ng, nb):
                visited[ny, nx] = True
                queue.append((nx, ny))

# Soften the edges / antialiasing
result_img = Image.fromarray(data, "RGBA")

import os
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "srikakulam_police_logo.png")
result_img.save(out_path, "PNG")
print(f"Saved transparent logo to: {out_path}")
