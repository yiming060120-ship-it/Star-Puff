"""
精确裁剪 12 个模型缩略图（最终修正版）。
实测布局: 1280x1800，前 720 像素含 12 个 cell，每行 ~242px。
- Row 1: y=30-245, 模型 30-210
- Row 2: y=261-488, 模型 261-470
- Row 3: y=504-731, 模型 504-715
"""
from PIL import Image
import os

src = r"C:\Users\一鸣\Documents\game\Star-Puff\preview-screenshot.png"
dst_dir = r"C:\Users\一鸣\Documents\game\Star-Puff\public\models\species\thumbnails"

# 清理旧 thumb.png
for f in os.listdir(dst_dir):
    if f.endswith("_thumb.png"):
        os.remove(os.path.join(dst_dir, f))

# 列边界: 16-328, 328-624, 640-952, 952-1264（cell 宽度约 312）
# 但实测列宽可能稍有偏差，用 312 等分
boxes = [
    (1,  16,  30, 328, 222),
    (2,  328, 30, 624, 222),
    (3,  640, 30, 952, 222),
    (4,  952, 30, 1264, 222),
    (5,  16,  261, 328, 470),
    (6,  328, 261, 624, 470),
    (7,  640, 261, 952, 470),
    (8,  952, 261, 1264, 470),
    (9,  16,  504, 328, 700),
    (10, 328, 504, 624, 700),
    (11, 640, 504, 952, 700),
    (12, 952, 504, 1264, 700),
]

bmp = Image.open(src)
out_size = 256

for idx, l, t, r, b in boxes:
    crop = bmp.crop((l, t, r, b))
    crop.thumbnail((out_size, out_size), Image.LANCZOS)
    cw, ch = crop.size
    side = min(cw, ch)
    left = (cw - side) // 2
    top = (ch - side) // 2
    crop = crop.crop((left, top, left + side, top + side))

    out = os.path.join(dst_dir, f"species_{idx:02d}_thumb.png")
    crop.save(out, "PNG")
    print(f"  ✓ 模型 {idx:02d} ({crop.size[0]}x{crop.size[1]})")

print("完成")