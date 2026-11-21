"""Convert an OTF/TTF font into three.js typeface JSON (for 3D block text).

Run: python3 tools/make_font3d.py /usr/share/fonts/opentype/inter/InterDisplay-Black.otf public/fonts/inter_black.json
"""

import json
import sys

from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont


def main(src, dst):
    font = TTFont(src)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font['head'].unitsPerEm
    glyphs = {}
    for code in list(range(32, 127)) + [0x2013, 0x2019, 0x00B7]:
        name = cmap.get(code)
        if not name:
            continue
        pen = RecordingPen()
        gs[name].draw(pen)
        cmds = []
        xs = []
        for op, pts in pen.value:
            if op == 'moveTo':
                (x, y), = pts
                cmds += ['m', round(x), round(y)]
                xs.append(x)
            elif op == 'lineTo':
                (x, y), = pts
                cmds += ['l', round(x), round(y)]
                xs.append(x)
            elif op == 'curveTo':
                (c1, c2, p) = pts[-3], pts[-2], pts[-1]
                cmds += ['b', round(p[0]), round(p[1]), round(c1[0]), round(c1[1]), round(c2[0]), round(c2[1])]
                xs.append(p[0])
            elif op == 'qCurveTo':
                # Split implied on-curve points.
                ctrl = pts[:-1]
                end = pts[-1]
                for i, c in enumerate(ctrl):
                    nxt = end if i == len(ctrl) - 1 else ((c[0] + ctrl[i + 1][0]) / 2, (c[1] + ctrl[i + 1][1]) / 2)
                    cmds += ['q', round(nxt[0]), round(nxt[1]), round(c[0]), round(c[1])]
                    xs.append(nxt[0])
        glyphs[chr(code)] = {
            'ha': round(gs[name].width),
            'x_min': round(min(xs)) if xs else 0,
            'x_max': round(max(xs)) if xs else 0,
            'o': ' '.join(str(c) for c in cmds),
        }
    hhea = font['hhea']
    out = {
        'glyphs': glyphs,
        'familyName': 'Inter Display Black',
        'ascender': hhea.ascent,
        'descender': hhea.descent,
        'underlinePosition': -100,
        'underlineThickness': 50,
        'boundingBox': {'xMin': 0, 'yMin': hhea.descent, 'xMax': upm, 'yMax': hhea.ascent},
        'resolution': upm,
        'original_font_information': {'format': 0, 'fontFamily': 'Inter Display', 'fontSubfamily': 'Black'},
    }
    json.dump(out, open(dst, 'w'))
    print('glyphs', len(glyphs), 'upm', upm)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
