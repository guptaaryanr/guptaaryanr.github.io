#!/usr/bin/env python3
"""Regenerate the two site visual assets. Only Pillow is needed for the social card."""
from __future__ import annotations
from pathlib import Path
from html import escape
from PIL import Image, ImageDraw, ImageFont
import math

ROOT = Path(__file__).resolve().parents[1]


def svg_scores() -> None:
    out = ROOT / 'assets/img/projects/wavesleuth-v1-iou.svg'
    # Values match docs/V1_RELEASE_NOTES.md at guptaaryanr/wavesleuth-devito v1.0.0.
    rows = [
        ('Mask cell · easy', 1.000),
        ('Circle · staged radius/velocity', 0.895),
        ('Circle · easy', 0.800),
        ('Ellipse · easy', 0.787),
    ]
    parts = ['''<svg xmlns="http://www.w3.org/2000/svg" width="900" height="370" viewBox="0 0 900 370" role="img" aria-labelledby="chart-title chart-desc">
<title id="chart-title">WaveSleuth v1.0.0 reference reconstruction scores</title>
<desc id="chart-desc">Intersection over union: mask-cell-easy 1.000, staged circle 0.895, circle-easy 0.800 and ellipse-easy 0.787.</desc>
<rect width="900" height="370" fill="#fbfaf7"/>
<text x="32" y="42" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#8d4d38" letter-spacing="1">REFERENCE IoU  /  v1.0.0</text>
<text x="32" y="68" font-family="Georgia, serif" font-size="21" fill="#11151b">Different challenges, different reconstruction conditions</text>
<line x1="275" y1="96" x2="275" y2="319" stroke="#d7d3ca"/>
<line x1="565" y1="96" x2="565" y2="319" stroke="#d7d3ca" stroke-dasharray="4 5"/>
<line x1="855" y1="96" x2="855" y2="319" stroke="#d7d3ca"/>
<text x="272" y="337" fill="#60646b" font-family="Arial, sans-serif" font-size="13">0.0</text>
<text x="554" y="337" fill="#60646b" font-family="Arial, sans-serif" font-size="13">0.5</text>
<text x="842" y="337" fill="#60646b" font-family="Arial, sans-serif" font-size="13">1.0</text>''']
    for i, (name, score) in enumerate(rows):
        y = 111 + i * 54
        width = round(580 * score)
        parts += [
            f'<text x="32" y="{y+21}" font-family="Arial, sans-serif" font-size="16" fill="#343a43">{escape(name)}</text>',
            f'<rect x="275" y="{y}" width="580" height="30" rx="3" fill="#e9e4d9"/>',
            f'<rect x="275" y="{y}" width="{width}" height="30" rx="3" fill="#233f67"/>',
            f'<text x="{275+max(48,width)-12}" y="{y+21}" text-anchor="end" fill="#ffffff" font-family="Arial, sans-serif" font-weight="700" font-size="15">{score:.3f}</text>',
        ]
    parts.append('</svg>')
    out.write_text('\n'.join(parts), encoding='utf-8')


def social_card() -> None:
    out = ROOT / 'assets/img/social-card.png'
    im = Image.new('RGB', (1200, 630), '#f3f1ec')
    d = ImageDraw.Draw(im)
    # Retain the site's minimal topographic motif, without a new brand system.
    for i in range(4):
        cx,cy = [(900,190),(1120,450),(770,550),(1050,75)][i]
        for j in range(7):
            rx=100+22*j; ry=50+16*j
            pts=[]
            for k in range(161):
                t=k/160*math.tau
                w=1+0.035*math.sin(5*t+i*.8)
                pts.append((cx+rx*math.cos(t)*w, cy+ry*math.sin(t)*w))
            d.line(pts, fill='#e0dbd0', width=2, joint='curve')
    d.line([(80,95),(1120,95)],fill='#b9b4aa',width=2)
    d.line([(80,528),(1120,528)],fill='#b9b4aa',width=2)
    font_serif='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
    font_mono='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
    font_sans='/usr/share/fonts/truetype/lato/Lato-Medium.ttf'
    def font(path,size): return ImageFont.truetype(path,size)
    d.text((80,126), 'ARYAN GUPTA', font=font(font_mono,23), fill='#8d4d38', stroke_width=0)
    d.text((74,202), 'Applied physics.', font=font(font_serif,65), fill='#11151b')
    d.text((74,298), 'Scientific computing.', font=font(font_serif,65), fill='#11151b')
    d.text((80,433), 'Inverse problems  /  simulation  /  research software', font=font(font_sans,25),fill='#343a43')
    d.text((80,550), 'guptaaryanr.github.io', font=font(font_mono,21), fill='#60646b')
    d.ellipse((1090,545,1137,592), outline='#8d4d38', width=2)
    d.text((1097,555),'AG',font=font(font_mono,14),fill='#233f67')
    im.save(out, format='PNG', optimize=True)

if __name__ == '__main__':
    svg_scores()
    social_card()
    print('Created WaveSleuth reference-score chart and social preview card.')
