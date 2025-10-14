#!/usr/bin/env python3
import sys
import json
from PIL import Image, ImageDraw, ImageFont
import io
import base64
import random

# Reads JSON from stdin: {"prompt":"...","width":W,"height":H}
# Writes JSON to stdout: {"dataUri":"data:image/png;base64,..."}

def make_image(prompt, width, height):
    img = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # Background gradient
    for i in range(height):
        t = i / max(1, height - 1)
        r = int(240 * (1 - t) + 200 * t)
        g = int(240 * (1 - t) + 220 * t)
        b = int(255 * (1 - t) + 240 * t)
        draw.line([(0, i), (width, i)], fill=(r, g, b))

    # Random shapes influenced by prompt
    seed = abs(hash(prompt)) % (2**32)
    random.seed(seed)
    palette = [(255, 122, 89), (167, 139, 250), (99, 102, 241), (34, 211, 238), (253, 224, 71)]

    for _ in range(6):
        w = random.randint(int(width * 0.08), int(width * 0.4))
        h = random.randint(int(height * 0.06), int(height * 0.3))
        x = random.randint(0, max(0, width - w))
        y = random.randint(0, max(0, height - h))
        color = random.choice(palette)
        draw.ellipse([x, y, x + w, y + h], fill=color + (180,), outline=None)

    # Center emoji-like subject based on keywords
    subject = "🎨"
    keywords = ['cat', 'kucing', 'rocket', 'tree', 'flower', 'dog']
    emoji_map = {'cat':'😺','kucing':'😺','rocket':'🚀','tree':'🌳','flower':'🌸','dog':'🐶'}
    lower = prompt.lower()
    for k in keywords:
        if k in lower:
            subject = emoji_map.get(k, subject)
            break

    # Draw subject
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", int(min(width, height) * 0.28))
    except Exception:
        font = ImageFont.load_default()
    tw, th = draw.textsize(subject, font=font)
    draw.text(((width - tw) / 2, (height - th) / 2), subject, font=font, fill=(255,255,255,255))

    # Draw prompt text at bottom
    try:
        small = ImageFont.truetype("DejaVuSans.ttf", max(12, int(min(width, height) * 0.04)))
    except Exception:
        small = ImageFont.load_default()
    text = (prompt[:120] + '...') if len(prompt) > 120 else prompt
    tw, th = draw.textsize(text, font=small)
    draw.rectangle([ (width - tw)/2 - 8, height - th - 18, (width + tw)/2 + 8, height - 8 ], fill=(0,0,0,80))
    draw.text(((width - tw) / 2, height - th - 14), text, font=small, fill=(255,255,255,220))

    return img


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw or '{}')
        prompt = payload.get('prompt', '')
        width = int(payload.get('width', 1024))
        height = int(payload.get('height', 768))

        width = max(100, min(2048, width))
        height = max(100, min(2048, height))

        img = make_image(prompt, width, height)
        buf = io.BytesIO()
        img.convert('RGB').save(buf, format='PNG')
        b64 = base64.b64encode(buf.getvalue()).decode('ascii')
        data_uri = f"data:image/png;base64,{b64}"
        out = {"dataUri": data_uri}
        sys.stdout.write(json.dumps(out))
    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e)}))

if __name__ == '__main__':
    main()
