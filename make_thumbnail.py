import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from PIL import Image, ImageDraw, ImageFont

W, H = 240, 240
BG   = (15, 23, 42)    # #0F172A
GREEN = (16, 185, 129) # #10B981
WHITE = (248, 250, 252) # #F8FAFC
GRAY  = (148, 163, 184) # slate-400

img  = Image.new('RGB', (W, H), color=BG)
draw = ImageDraw.Draw(img)

# ── 체크마크 (굵은 SVG-style 선) ──────────────────────
cx, cy = 120, 118
r  = 48   # 원 반지름

# 원 테두리
lw = 5
draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=GREEN, width=lw)

# 체크 획 두 개 (두께 6px 선 여러 번 겹쳐서 굵게)
ck_pts = [
    (cx - 22, cy + 2),
    (cx - 6,  cy + 18),
    (cx + 22, cy - 16),
]
for offset in range(-3, 4):
    shifted = [(x + offset, y) for x, y in ck_pts]
    draw.line(shifted, fill=GREEN, width=2)
for offset in range(-3, 4):
    shifted = [(x, y + offset) for x, y in ck_pts]
    draw.line(shifted, fill=GREEN, width=2)

# ── 폰트 (시스템 폰트 fallback) ─────────────────────
def load_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/Arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()

font_title  = load_font(28, bold=True)
font_sub    = load_font(13, bold=False)

# ── "Decisible" 텍스트 (상단) ───────────────────────
title = "Decisible"
bbox  = draw.textbbox((0, 0), title, font=font_title)
tw    = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 22), title, font=font_title, fill=WHITE)

# ── "GO / NO-GO" 하단 ────────────────────────────────
sub  = "GO  /  NO-GO"
bbox2 = draw.textbbox((0, 0), sub, font=font_sub)
sw    = bbox2[2] - bbox2[0]
draw.text(((W - sw) // 2, H - 36), sub, font=font_sub, fill=GRAY)

# ── 하단 구분선 (얇게) ──────────────────────────────
draw.line([(W//2 - 20, H - 42), (W//2 + 20, H - 42)], fill=GREEN, width=1)

out = r"C:\Users\hdj\clawd\work\projects\decisible-landing\public\thumbnail.png"
img.save(out)
print(f"Saved: {out}")
