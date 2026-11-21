"""Draw classic-format (585x559) shirt templates for the iced-tea scene cast.

Each design is drawn at 4x and downsampled for clean edges. Transparent areas
show the character's skin, like real templates.
Run: python3 tools/make_shirts.py
"""

import os

from PIL import Image, ImageDraw, ImageFilter

S = 4  # supersampling
W, H = 585, 559
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'shirts')

# Template regions (x, y, w, h)
TORSO = {
    'front': (231, 74, 128, 128),
    'back': (427, 74, 128, 128),
    'left': (361, 74, 64, 128),
    'right': (165, 74, 64, 128),
    'top': (231, 8, 128, 64),
    'bottom': (231, 204, 128, 64),
}
R_ARM = {'out': (19, 355, 64, 128), 'front': (85, 355, 64, 128), 'in': (151, 355, 64, 128), 'back': (217, 355, 64, 128), 'top': (217, 289, 64, 64), 'bottom': (217, 485, 64, 64)}
L_ARM = {'in': (308, 355, 64, 128), 'front': (374, 355, 64, 128), 'out': (440, 355, 64, 128), 'back': (506, 355, 64, 128), 'top': (308, 289, 64, 64), 'bottom': (308, 485, 64, 64)}


def rgb(h, a=255):
    h = h.lstrip('#')
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (a,)


def shade(h, amt):
    r, g, b, a = rgb(h)
    f = lambda v: max(0, min(255, int(v + amt * 255)))
    return (f(r), f(g), f(b), a)


class T:
    def __init__(self):
        self.im = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def box(self, region, x0=0.0, y0=0.0, x1=1.0, y1=1.0):
        x, y, w, h = region
        return [(x + x0 * w) * S, (y + y0 * h) * S, (x + x1 * w) * S - 1, (y + y1 * h) * S - 1]

    def fill(self, region, color, y0=0.0, y1=1.0, x0=0.0, x1=1.0):
        self.d.rectangle(self.box(region, x0, y0, x1, y1), fill=rgb(color) if isinstance(color, str) else color)

    def vgrad(self, region, top, bottom, y0=0.0, y1=1.0):
        x, y, w, h = region
        ya, yb = int((y + y0 * h) * S), int((y + y1 * h) * S)
        ct, cb = rgb(top), rgb(bottom)
        for yy in range(ya, yb):
            t = (yy - ya) / max(1, yb - ya - 1)
            c = tuple(int(ct[i] + (cb[i] - ct[i]) * t) for i in range(4))
            self.d.line([(x * S, yy), ((x + w) * S - 1, yy)], fill=c)

    def line(self, region, pts, color, width=1.0):
        x, y, w, h = region
        self.d.line([((x + px * w) * S, (y + py * h) * S) for px, py in pts], fill=rgb(color) if isinstance(color, str) else color, width=max(1, int(width * S)), joint='curve')

    def poly(self, region, pts, color):
        x, y, w, h = region
        self.d.polygon([((x + px * w) * S, (y + py * h) * S) for px, py in pts], fill=rgb(color) if isinstance(color, str) else color)

    def dot(self, region, cx, cy, r, color, outline=None):
        x, y, w, h = region
        X, Y, R = (x + cx * w) * S, (y + cy * h) * S, r * S
        self.d.ellipse([X - R, Y - R, X + R, Y + R], fill=rgb(color), outline=rgb(outline) if outline else None, width=S)

    def folds(self, region, color, n=3, y0=0.15, y1=0.95, seed=0):
        """Soft diagonal fabric folds."""
        import random

        r = random.Random(seed)
        c = rgb(color) if isinstance(color, str) else color
        soft = c[:3] + (70,)
        hi = (255, 255, 255, 28)
        for _ in range(n):
            x0 = r.uniform(0.15, 0.85)
            ya = r.uniform(y0, (y0 + y1) / 2)
            x1 = x0 + r.uniform(-0.12, 0.12)
            yb = ya + r.uniform(0.15, 0.3)
            # A soft shadow crease with a faint highlight beside it
            layer = Image.new('RGBA', self.im.size, (0, 0, 0, 0))
            ld = ImageDraw.Draw(layer)
            x, y, w, h = region
            P = lambda px, py: ((x + px * w) * S, (y + py * h) * S)
            ld.line([P(x0, ya), P(x1, yb)], fill=soft, width=int(2.4 * S))
            ld.line([P(x0 + 0.04, ya), P(x1 + 0.04, yb)], fill=hi, width=int(1.4 * S))
            layer = layer.filter(ImageFilter.GaussianBlur(S * 0.9))
            # Keep the crease inside its own region
            mask = Image.new('L', self.im.size, 0)
            ImageDraw.Draw(mask).rectangle(self.box(region), fill=255)
            clipped = Image.new('RGBA', self.im.size, (0, 0, 0, 0))
            clipped.paste(layer, (0, 0), mask)
            self.im.alpha_composite(clipped)
            self.d = ImageDraw.Draw(self.im)

    def save(self, name):
        im = self.im.resize((W, H), Image.LANCZOS)
        os.makedirs(OUT, exist_ok=True)
        im.save(os.path.join(OUT, name + '.png'))


def all_torso(t, fn):
    for k, r in TORSO.items():
        fn(k, r)


def arms(t, fn):
    for side, A in (('R', R_ARM), ('L', L_ARM)):
        for k, r in A.items():
            fn(side, k, r)


# ---------------- Barkeeper: white short-sleeve dress shirt, bowtie, suspenders ----------------
def barkeep():
    t = T()
    white, wshade, line = '#f1f0ea', '#cfcdc4', '#9c9a90'

    def torso(k, r):
        t.vgrad(r, white, '#dedcd3')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, wshade, 4, seed=hash(k) % 97)
        if k == 'front':
            # Button placket and buttons
            t.fill(r, '#e6e4dc', x0=0.46, x1=0.54)
            t.line(r, [(0.46, 0.12), (0.46, 1)], line, 0.6)
            t.line(r, [(0.54, 0.12), (0.54, 1)], line, 0.6)
            for yy in (0.3, 0.48, 0.66, 0.84):
                t.dot(r, 0.5, yy, 1.6, '#fbfbf8', outline='#8f8d84')
            # Collar points
            t.poly(r, [(0.30, 0), (0.5, 0.14), (0.42, 0.2), (0.27, 0.06)], '#ffffff')
            t.poly(r, [(0.70, 0), (0.5, 0.14), (0.58, 0.2), (0.73, 0.06)], '#ffffff')
            t.line(r, [(0.27, 0.06), (0.42, 0.2), (0.5, 0.14), (0.58, 0.2), (0.73, 0.06)], line, 0.7)
            # Bowtie
            t.poly(r, [(0.5, 0.15), (0.36, 0.09), (0.36, 0.23)], '#1c1c1f')
            t.poly(r, [(0.5, 0.15), (0.64, 0.09), (0.64, 0.23)], '#1c1c1f')
            t.dot(r, 0.5, 0.155, 2.6, '#2a2a2e')
            # Breast pocket
            t.line(r, [(0.6, 0.36), (0.8, 0.36), (0.8, 0.55), (0.6, 0.55), (0.6, 0.36)], line, 0.7)
            # Suspenders
            for x in (0.22, 0.78):
                t.fill(r, '#5b4632', x0=x - 0.05, x1=x + 0.05, y0=0)
                t.dot(r, x, 0.06, 2.2, '#c9a54c')
        if k == 'back':
            t.line(r, [(0.5, 0), (0.5, 1)], wshade, 0.7)
            # Suspenders cross in an X, like the reference back view
            t.line(r, [(0.18, 0), (0.62, 1)], '#5b4632', 4.2)
            t.line(r, [(0.82, 0), (0.38, 1)], '#5b4632', 4.2)
            t.line(r, [(0, 0.08), (1, 0.08)], line, 0.8)
        if k in ('left', 'right'):
            t.line(r, [(0.5, 0), (0.5, 1)], wshade, 0.7)
        if k == 'top':
            t.fill(r, '#5b4632', x0=0.17, x1=0.27)
            t.fill(r, '#5b4632', x0=0.73, x1=0.83)

    all_torso(t, torso)

    def arm(side, k, r):
        if k == 'bottom':
            return
        if k == 'top':
            t.vgrad(r, white, '#e6e4dc')
            return
        # Short sleeve with a folded hem, then skin
        t.vgrad(r, white, '#dcdad1', 0, 0.42)
        t.fill(r, '#e9e7df', y0=0.36, y1=0.44)
        t.line(r, [(0, 0.36), (1, 0.36)], line, 0.6)
        t.line(r, [(0, 0.44), (1, 0.44)], line, 0.8)
        t.folds(r, wshade, 2, 0.05, 0.3, seed=len(k) + (side == 'L'))
        # Watch on the left wrist
        if side == 'L' and k in ('front', 'out', 'back', 'in'):
            t.fill(r, '#2b2724', y0=0.84, y1=0.9)
            if k == 'out':
                t.fill(r, '#b9b9b9', x0=0.35, x1=0.65, y0=0.83, y1=0.91)

    arms(t, arm)
    t.save('ts_barkeep')


# ---------------- Old traveller: khaki safari jacket over a dark shirt ----------------
def joseph():
    t = T()
    khaki, kdark, kline = '#b9a77a', '#94845c', '#6f6244'
    shirt = '#2f3442'

    def torso(k, r):
        t.vgrad(r, '#c5b386', '#a8976b')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, kdark, 4, seed=len(k) * 7)
        if k == 'front':
            # Open jacket showing the dark shirt
            t.poly(r, [(0.36, 0), (0.64, 0), (0.6, 1), (0.4, 1)], shirt)
            t.line(r, [(0.36, 0), (0.4, 1)], kline, 1)
            t.line(r, [(0.64, 0), (0.6, 1)], kline, 1)
            # Lapels
            t.poly(r, [(0.36, 0), (0.24, 0.0), (0.3, 0.3), (0.39, 0.36)], '#cdbb8e')
            t.poly(r, [(0.64, 0), (0.76, 0.0), (0.7, 0.3), (0.61, 0.36)], '#cdbb8e')
            t.line(r, [(0.24, 0.0), (0.3, 0.3), (0.39, 0.36)], kline, 0.8)
            t.line(r, [(0.76, 0.0), (0.7, 0.3), (0.61, 0.36)], kline, 0.8)
            # Chest pockets with flaps and buttons
            for x in (0.12, 0.66):
                t.fill(r, '#bfad80', x0=x, x1=x + 0.22, y0=0.36, y1=0.58)
                t.line(r, [(x, 0.36), (x + 0.22, 0.36), (x + 0.22, 0.58), (x, 0.58), (x, 0.36)], kline, 0.8)
                t.poly(r, [(x - 0.01, 0.34), (x + 0.23, 0.34), (x + 0.2, 0.42), (x + 0.02, 0.42)], kdark)
                t.dot(r, x + 0.11, 0.41, 1.5, '#5a4e35')
            # Belt line and lower pockets
            t.fill(r, kdark, y0=0.76, y1=0.8, x1=0.38)
            t.fill(r, kdark, y0=0.76, y1=0.8, x0=0.62)
            for x in (0.06, 0.68):
                t.line(r, [(x, 0.84), (x + 0.24, 0.84)], kline, 1)
            # Scarf knot at the collar
            t.poly(r, [(0.42, 0.0), (0.58, 0.0), (0.53, 0.12), (0.47, 0.12)], '#6d2e2a')
        if k == 'back':
            t.line(r, [(0.5, 0), (0.5, 1)], kdark, 0.9)
            t.fill(r, kdark, y0=0.74, y1=0.79, x0=0.2, x1=0.8)
            t.line(r, [(0.1, 0.12), (0.9, 0.12)], kline, 0.7)
        if k in ('left', 'right'):
            t.line(r, [(0.5, 0), (0.5, 1)], kdark, 0.8)
            t.fill(r, kdark, y0=0.76, y1=0.8)

    all_torso(t, torso)

    def arm(side, k, r):
        t.vgrad(r, '#c2b083', '#a29164')
        if k in ('top', 'bottom'):
            return
        t.folds(r, kdark, 3, 0.1, 0.8, seed=len(k) * 3 + (side == 'L'))
        # Elbow crease and rolled cuff
        t.line(r, [(0.1, 0.5), (0.9, 0.53)], kdark, 0.9)
        t.fill(r, '#cdbb8e', y0=0.82, y1=0.94)
        t.line(r, [(0, 0.82), (1, 0.82)], kline, 0.8)
        t.line(r, [(0, 0.94), (1, 0.94)], kline, 0.8)
        # Epaulette on the shoulder
        if k == 'out':
            t.fill(r, kdark, y0=0.0, y1=0.08, x0=0.2, x1=0.8)
        # Fingerless glove at the end of the left sleeve
        if side == 'L':
            t.fill(r, '#5b4a3a', y0=0.94, y1=1)

    arms(t, arm)
    t.save('ts_joseph')


# ---------------- Tall one: long black school coat, gold buttons, chain ----------------
def jotaro():
    t = T()
    black, bshade, edge = '#1b1d24', '#30333d', '#3d414d'
    gold = '#d8b24a'
    shirt = '#5d6a5a'

    def torso(k, r):
        t.vgrad(r, '#22252d', '#15171c')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, bshade, 4, seed=len(k) * 11)
        if k == 'front':
            # Coat open over a muted green shirt
            t.poly(r, [(0.38, 0.18), (0.62, 0.18), (0.6, 1), (0.4, 1)], shirt)
            t.line(r, [(0.38, 0.18), (0.4, 1)], edge, 1)
            t.line(r, [(0.62, 0.18), (0.6, 1)], edge, 1)
            # Tall stiff collar
            t.fill(r, '#2a2d36', y0=0, y1=0.18, x0=0.22, x1=0.78)
            t.line(r, [(0.22, 0.18), (0.78, 0.18)], edge, 1)
            # Gold buttons up both edges
            for yy in (0.3, 0.48, 0.66, 0.84):
                t.dot(r, 0.33, yy, 2.6, gold, outline='#8a6a1e')
                t.dot(r, 0.67, yy, 2.6, gold, outline='#8a6a1e')
            # Gold chain from the collar across the chest
            pts = [(0.24, 0.1)]
            for i in range(1, 13):
                u = i / 12
                pts.append((0.24 + u * 0.08, 0.1 + 0.42 * (1 - (1 - u) ** 2)))
            t.line(r, pts, gold, 1.6)
            t.dot(r, 0.24, 0.1, 2.4, gold, outline='#8a6a1e')
            # Belt
            t.fill(r, '#121317', y0=0.86, y1=0.93, x0=0.38, x1=0.62)
            t.fill(r, '#9aa0a8', y0=0.865, y1=0.925, x0=0.46, x1=0.54)
        if k == 'back':
            t.line(r, [(0.5, 0.15), (0.5, 1)], bshade, 1)
            t.fill(r, '#2a2d36', y0=0, y1=0.14)
        if k in ('left', 'right'):
            t.line(r, [(0.5, 0), (0.5, 1)], bshade, 0.8)
            t.fill(r, '#2a2d36', y0=0, y1=0.14)
        if k == 'top':
            t.fill(r, '#2a2d36', x0=0.2, x1=0.8, y0=0.2, y1=0.8)

    all_torso(t, torso)

    def arm(side, k, r):
        t.vgrad(r, '#23262e', '#16181d')
        if k in ('top', 'bottom'):
            return
        t.folds(r, bshade, 3, 0.1, 0.75, seed=len(k) * 5 + (side == 'L'))
        # Cuff with two small gold buttons
        t.fill(r, '#2a2d36', y0=0.86, y1=1)
        t.line(r, [(0, 0.86), (1, 0.86)], edge, 0.9)
        if k == 'out':
            t.dot(r, 0.38, 0.93, 1.8, gold)
            t.dot(r, 0.62, 0.93, 1.8, gold)

    arms(t, arm)
    t.save('ts_jotaro')


# ---------------- Fortune teller: red robe, beige scarf, gold medallion ----------------
def avdol():
    t = T()
    red, rdark, rline = '#b8452e', '#8e3121', '#6e2417'
    scarf, sdark = '#e6cf9c', '#c2a670'
    gold, gdark = '#e2b84a', '#9a7520'

    def torso(k, r):
        t.vgrad(r, '#c24d33', '#9c3a25')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, rdark, 5, seed=len(k) * 13)
        if k == 'front':
            # Scarf wrapped at the neck, ends hanging down
            t.poly(r, [(0.12, 0), (0.88, 0), (0.8, 0.22), (0.2, 0.22)], scarf)
            t.line(r, [(0.2, 0.22), (0.8, 0.22)], sdark, 1)
            t.line(r, [(0.3, 0.06), (0.7, 0.06)], sdark, 0.7)
            t.poly(r, [(0.2, 0.2), (0.34, 0.2), (0.32, 0.72), (0.18, 0.7)], scarf)
            t.line(r, [(0.26, 0.24), (0.25, 0.68)], sdark, 0.7)
            # Fringe on the scarf end
            for xx in (0.19, 0.22, 0.25, 0.28, 0.31):
                t.line(r, [(xx, 0.7), (xx, 0.76)], sdark, 0.6)
            # Big gold necklace and medallion
            pts = [(0.36 + 0.28 * u, 0.2 + 0.18 * (1 - (2 * u - 1) ** 2)) for u in [i / 14 for i in range(15)]]
            t.line(r, pts, gold, 2.2)
            t.dot(r, 0.5, 0.5, 11, gold, outline=gdark)
            t.dot(r, 0.5, 0.5, 6, '#c4932c')
            t.dot(r, 0.5, 0.5, 2.5, '#3c8fb0')
            # Sash
            t.fill(r, '#3a2a20', y0=0.82, y1=0.9)
            t.fill(r, gold, y0=0.82, y1=0.9, x0=0.46, x1=0.54)
        if k == 'back':
            t.poly(r, [(0.1, 0), (0.9, 0), (0.75, 0.28), (0.25, 0.28)], scarf)
            t.line(r, [(0.25, 0.28), (0.75, 0.28)], sdark, 1)
            t.fill(r, '#3a2a20', y0=0.82, y1=0.9)
        if k in ('left', 'right'):
            t.fill(r, scarf, y0=0, y1=0.18)
            t.fill(r, '#3a2a20', y0=0.82, y1=0.9)
        if k == 'top':
            t.fill(r, scarf, x0=0.1, x1=0.9, y0=0.15, y1=0.85)

    all_torso(t, torso)

    def arm(side, k, r):
        t.vgrad(r, '#c04b31', '#983823')
        if k in ('top', 'bottom'):
            return
        t.folds(r, rdark, 3, 0.1, 0.6, seed=len(k) * 17 + (side == 'L'))
        # Wide sleeve ends at the forearm; gold and silver bracelets on bare wrists
        t.fill(r, rdark, y0=0.62, y1=0.68)
        t.d.rectangle(t.box(r, 0, 0.68, 1, 1), fill=(0, 0, 0, 0))
        for y0, c in ((0.76, gold), (0.82, '#c9cdd3'), (0.88, gold)):
            t.fill(r, c, y0=y0, y1=y0 + 0.04)

    arms(t, arm)
    t.save('ts_avdol')


# ---------------- Silver flat-top: black sleeveless top ----------------
def polnareff():
    t = T()
    black, bshade = '#202226', '#3a3d44'

    def torso(k, r):
        t.vgrad(r, '#26282d', '#17181b')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, bshade, 3, seed=len(k) * 19)
        if k == 'front':
            # Scoop neckline showing skin
            t.d.chord(t.box(r, 0.28, -0.2, 0.72, 0.22), 0, 180, fill=(0, 0, 0, 0))
            t.line(r, [(0.28, 0.0), (0.33, 0.1), (0.5, 0.14), (0.67, 0.1), (0.72, 0.0)], bshade, 1)
            # Ribbed hem and a silver-buckled belt
            for xx in [i / 16 for i in range(17)]:
                t.line(r, [(xx, 0.8), (xx, 0.86)], bshade, 0.5)
            t.fill(r, '#5b4632', y0=0.88, y1=0.96)
            t.fill(r, '#c7ccd3', y0=0.875, y1=0.965, x0=0.44, x1=0.56)
            # Little heart-shaped brooch
            t.dot(r, 0.66, 0.34, 2.4, '#d24a5a')
            t.dot(r, 0.7, 0.34, 2.4, '#d24a5a')
            t.poly(r, [(0.64, 0.355), (0.72, 0.355), (0.68, 0.42)], '#d24a5a')
        if k == 'back':
            t.line(r, [(0.5, 0.1), (0.5, 1)], bshade, 0.8)
            t.fill(r, '#5b4632', y0=0.88, y1=0.96)
        if k in ('left', 'right'):
            t.fill(r, '#5b4632', y0=0.88, y1=0.96)

    all_torso(t, torso)

    def arm(side, k, r):
        # Bare arms, with a black wristband
        if k in ('front', 'out', 'back', 'in'):
            t.fill(r, '#1b1c20', y0=0.82, y1=0.94)
            t.line(r, [(0, 0.86), (1, 0.86)], '#3a3d44', 0.6)

    arms(t, arm)
    t.save('ts_polnareff')


# ======================= LeBron short =======================
from PIL import ImageFont

FONT = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'


def text(t, region, msg, cx, cy, size, color, stroke=None, sw=0):
    x, y, w, h = region
    f = ImageFont.truetype(FONT, int(size * S))
    X, Y = (x + cx * w) * S, (y + cy * h) * S
    t.d.text((X, Y), msg, font=f, fill=rgb(color), anchor='mm', stroke_width=int(sw * S), stroke_fill=rgb(stroke) if stroke else None)


def jersey(name, base, trim, num, numc, numo, word=None):
    """Basketball tank top: bare arms, trim at neck/arms, big number front and back."""
    t = T()

    def torso(k, r):
        t.vgrad(r, base, shade(base, -0.08)[:3] and '#%02x%02x%02x' % shade(base, -0.08)[:3])
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, '#000000', 2, 0.3, 0.9, seed=len(k) * 23)
        if k == 'front':
            # V-neck with trim, cut-in arm holes
            t.poly(r, [(0.34, 0), (0.66, 0), (0.5, 0.2)], (0, 0, 0, 0))
            t.line(r, [(0.33, 0), (0.5, 0.21), (0.67, 0)], trim, 2.2)
            t.poly(r, [(0, 0), (0.12, 0), (0.06, 0.3), (0, 0.32)], (0, 0, 0, 0))
            t.poly(r, [(1, 0), (0.88, 0), (0.94, 0.3), (1, 0.32)], (0, 0, 0, 0))
            t.line(r, [(0.12, 0), (0.06, 0.3), (0, 0.32)], trim, 1.6)
            t.line(r, [(0.88, 0), (0.94, 0.3), (1, 0.32)], trim, 1.6)
            if word:
                text(t, r, word, 0.5, 0.33, 13, numc, numo, 1.2)
            text(t, r, num, 0.5, 0.64 if word else 0.55, 52, numc, numo, 3)
            # Waistband
            t.fill(r, trim, y0=0.93, y1=1)
        if k == 'back':
            t.line(r, [(0.3, 0), (0.5, 0.08), (0.7, 0)], trim, 2.2)
            text(t, r, num, 0.5, 0.55, 56, numc, numo, 3)
            t.fill(r, trim, y0=0.93, y1=1)
        if k in ('left', 'right'):
            t.d.rectangle(t.box(r, 0, 0, 1, 0.3), fill=(0, 0, 0, 0))
            t.line(r, [(0, 0.3), (1, 0.3)], trim, 1.6)
            t.line(r, [(0.5, 0.3), (0.5, 1)], trim, 1.6)
            t.fill(r, trim, y0=0.93, y1=1)
        if k == 'top':
            t.d.rectangle(t.box(r, 0, 0, 1, 1), fill=(0, 0, 0, 0))
            t.fill(r, base, x0=0.1, x1=0.3)
            t.fill(r, base, x0=0.7, x1=0.9)

    all_torso(t, torso)
    t.save(name)


def kid():
    t = T()
    tee, dark = '#3c4a66', '#2e3a52'

    def torso(k, r):
        t.vgrad(r, '#43527a', '#34405c')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, dark, 4, seed=len(k) * 29)
        if k == 'front':
            t.d.chord(t.box(r, 0.33, -0.16, 0.67, 0.16), 0, 180, fill=(0, 0, 0, 0))
            t.line(r, [(0.33, 0.0), (0.38, 0.1), (0.5, 0.15), (0.62, 0.1), (0.67, 0.0)], '#56658c', 1.4)
            # Faded basketball print
            t.dot(r, 0.5, 0.5, 15, '#c9763a')
            t.line(r, [(0.5, 0.38), (0.5, 0.62)], '#7a3f1a', 0.9)
            t.line(r, [(0.38, 0.5), (0.62, 0.5)], '#7a3f1a', 0.9)
            t.dot(r, 0.5, 0.5, 15, '#c9763a')
            t.line(r, [(0.5, 0.385), (0.5, 0.615)], '#7a3f1a', 0.9)
            t.line(r, [(0.385, 0.5), (0.615, 0.5)], '#7a3f1a', 0.9)
            # Small stain and a frayed hem
            t.dot(r, 0.7, 0.75, 3, '#3a465f')
            for xx in [i / 10 for i in range(11)]:
                t.line(r, [(xx, 0.95), (xx + 0.03, 1.0)], dark, 0.6)

    all_torso(t, torso)

    def arm(side, k, r):
        if k == 'bottom':
            return
        if k == 'top':
            t.vgrad(r, '#43527a', '#3c4a66')
            return
        t.vgrad(r, '#43527a', '#38456a', 0, 0.5)
        t.line(r, [(0, 0.5), (1, 0.5)], dark, 0.8)

    arms(t, arm)
    t.save('ts_kid')


def mom():
    t = T()
    denim, dd = '#5c7fae', '#46668f'

    def torso(k, r):
        t.vgrad(r, '#6286b5', '#4f72a0')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, dd, 3, seed=len(k) * 31)
        if k == 'front':
            t.poly(r, [(0.36, 0), (0.64, 0), (0.6, 1), (0.4, 1)], '#f2ece0')
            t.line(r, [(0.36, 0), (0.4, 1)], '#e2a64a', 0.8)
            t.line(r, [(0.64, 0), (0.6, 1)], '#e2a64a', 0.8)
            for x in (0.12, 0.66):
                t.line(r, [(x, 0.3), (x + 0.22, 0.3), (x + 0.22, 0.48), (x, 0.48), (x, 0.3)], '#e2a64a', 0.7)
            t.fill(r, dd, y0=0.86, y1=0.94, x1=0.38)
            t.fill(r, dd, y0=0.86, y1=0.94, x0=0.62)
        if k == 'back':
            t.line(r, [(0.1, 0.3), (0.9, 0.3)], '#e2a64a', 0.7)
            t.fill(r, dd, y0=0.86, y1=0.94)

    all_torso(t, torso)

    def arm(side, k, r):
        t.vgrad(r, '#6286b5', '#4f72a0')
        if k in ('front', 'out', 'back', 'in'):
            t.fill(r, dd, y0=0.84, y1=0.94)
            t.line(r, [(0, 0.5), (1, 0.52)], dd, 0.8)

    arms(t, arm)
    t.save('ts_mom')


def coach():
    t = T()
    navy, stripe = '#1f2c4a', '#f0f0f0'

    def torso(k, r):
        t.vgrad(r, '#24345a', '#1a2540')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, '#121a2e', 3, seed=len(k) * 37)
        if k == 'front':
            t.fill(r, '#cfd6e2', x0=0.49, x1=0.51)
            t.fill(r, '#24345a', y0=0, y1=0.12, x0=0.3, x1=0.7)
            t.line(r, [(0.3, 0.12), (0.7, 0.12)], stripe, 1)
            # Whistle on a red lanyard
            t.line(r, [(0.36, 0.05), (0.5, 0.42), (0.64, 0.05)], '#c0392b', 1.2)
            t.fill(r, '#c9ccd2', x0=0.46, x1=0.56, y0=0.42, y1=0.5)
            t.dot(r, 0.5, 0.46, 1.6, '#8a8f96')
            text(t, r, 'COACH', 0.74, 0.3, 9, '#ffffff')
        if k == 'back':
            text(t, r, 'COACH', 0.5, 0.35, 18, '#ffffff')
        if k in ('left', 'right'):
            t.fill(r, stripe, x0=0.42, x1=0.5)
            t.fill(r, stripe, x0=0.54, x1=0.62)

    all_torso(t, torso)

    def arm(side, k, r):
        t.vgrad(r, '#24345a', '#1a2540')
        if k == 'out':
            t.fill(r, stripe, x0=0.36, x1=0.46)
            t.fill(r, stripe, x0=0.54, x1=0.64)
        if k in ('front', 'out', 'back', 'in'):
            t.fill(r, '#121a2e', y0=0.88, y1=1)

    arms(t, arm)
    t.save('ts_coach')


def suit_white():
    t = T()
    white, ws, line = '#f3f1ec', '#d9d6cd', '#b5b1a6'

    def torso(k, r):
        t.vgrad(r, white, '#e4e1d8')
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, ws, 3, seed=len(k) * 41)
        if k == 'front':
            t.poly(r, [(0.36, 0), (0.64, 0), (0.56, 0.5), (0.44, 0.5)], '#efe6cf')
            t.poly(r, [(0.47, 0.06), (0.53, 0.06), (0.55, 0.48), (0.5, 0.54), (0.45, 0.48)], '#f8f6f0')
            t.line(r, [(0.45, 0.06), (0.47, 0.5), (0.5, 0.54), (0.53, 0.5), (0.55, 0.06)], line, 0.6)
            t.poly(r, [(0.36, 0), (0.24, 0), (0.3, 0.32), (0.44, 0.5)], '#ffffff')
            t.poly(r, [(0.64, 0), (0.76, 0), (0.7, 0.32), (0.56, 0.5)], '#ffffff')
            t.line(r, [(0.24, 0), (0.3, 0.32), (0.44, 0.5)], line, 0.8)
            t.line(r, [(0.76, 0), (0.7, 0.32), (0.56, 0.5)], line, 0.8)
            for yy in (0.6, 0.76):
                t.dot(r, 0.5, yy, 1.8, '#ffffff', outline=line)
            t.line(r, [(0.5, 0.5), (0.5, 1)], line, 0.7)
            t.line(r, [(0.14, 0.7), (0.32, 0.7)], line, 0.8)
            t.line(r, [(0.68, 0.7), (0.86, 0.7)], line, 0.8)
            t.line(r, [(0.7, 0.3), (0.84, 0.3)], line, 0.8)
            t.fill(r, '#e9c46a', x0=0.72, x1=0.8, y0=0.26, y1=0.3)
        if k == 'back':
            t.line(r, [(0.5, 0.1), (0.5, 1)], ws, 0.8)

    all_torso(t, torso)

    def arm(side, k, r):
        t.vgrad(r, white, '#e2dfd6')
        if k in ('front', 'out', 'back', 'in'):
            t.folds(r, ws, 2, 0.1, 0.7, seed=len(k) + (side == 'L'))
            t.fill(r, '#fbfaf6', y0=0.9, y1=1)
            t.line(r, [(0, 0.9), (1, 0.9)], line, 0.6)

    arms(t, arm)
    t.save('ts_suitwhite')


def lebron_set():
    kid()
    mom()
    coach()
    suit_white()
    jersey('ts_hs23', '#1f6a3a', '#e8c547', '23', '#ffffff', '#e8c547', 'IRISH')
    jersey('ts_wine23', '#6f263d', '#ffb81c', '23', '#ffffff', '#ffb81c')
    jersey('ts_purple6', '#552583', '#fdb927', '6', '#fdb927', '#ffffff')
    jersey('ts_purple23', '#552583', '#fdb927', '23', '#fdb927', '#ffffff')
    jersey('ts_purple9', '#552583', '#fdb927', '9', '#fdb927', '#ffffff')
    jersey('ts_blue4', '#1d428a', '#ffc72c', '4', '#ffc72c', '#ffffff')
    jersey('ts_blue8', '#1d428a', '#ffc72c', '8', '#ffc72c', '#ffffff')


# ======================= Messi short =======================

def kit(name, cols, num, numc='#ffffff', numo='#1a1a1a', halves=False, stripes=7, sleeve=None, trim='#ffffff', front_num=True, robe=False):
    """Football shirt: vertical stripes (or halves), collar, short sleeves, numbers.
    robe=True draws the black-and-gold robe over the shirt (the trophy lift)."""
    t = T()

    def stripe_fill(r, k):
        x, y, w, h = r
        if halves:
            t.fill(r, cols[0], x1=0.5)
            t.fill(r, cols[1], x0=0.5)
            return
        n = stripes if k in ('front', 'back') else 3
        for i in range(n):
            t.fill(r, cols[i % 2], x0=i / n, x1=(i + 1) / n)

    def torso(k, r):
        stripe_fill(r, k)
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, '#000000', 3, 0.2, 0.9, seed=len(k) * 43)
        if k == 'front':
            # Collar and placket
            t.poly(r, [(0.36, 0), (0.64, 0), (0.56, 0.12), (0.44, 0.12)], trim)
            t.poly(r, [(0.4, 0), (0.6, 0), (0.53, 0.08), (0.47, 0.08)], (0, 0, 0, 0))
            if front_num:
                text(t, r, num, 0.72, 0.3, 16, numc, numo, 1)
            t.fill(r, trim, y0=0.95, y1=1)
        if k == 'back':
            t.fill(r, trim, y0=0, y1=0.06, x0=0.36, x1=0.64)
            text(t, r, num, 0.5, 0.52, 54, numc, numo, 3)
            t.fill(r, trim, y0=0.95, y1=1)
        if robe and k in ('front', 'back', 'left', 'right'):
            sheer = (18, 18, 22, 215)
            if k == 'front':
                t.fill(r, sheer, x1=0.3)
                t.fill(r, sheer, x0=0.7)
                t.fill(r, '#d8b44a', x0=0.28, x1=0.31)
                t.fill(r, '#d8b44a', x0=0.69, x1=0.72)
            else:
                t.fill(r, sheer)
                if k == 'back':
                    t.fill(r, '#d8b44a', y0=0.0, y1=0.05)
        if robe and k == 'top':
            t.fill(r, (18, 18, 22, 215), x1=0.3)
            t.fill(r, (18, 18, 22, 215), x0=0.7)

    all_torso(t, torso)

    def arm(side, k, r):
        if robe:
            t.fill(r, (18, 18, 22, 225))
            if k in ('front', 'out', 'back', 'in'):
                t.fill(r, '#d8b44a', y0=0.9, y1=0.96)
            return
        if k == 'bottom':
            return
        c = sleeve or cols[0]
        if k == 'top':
            t.fill(r, c)
            return
        t.fill(r, c, y0=0, y1=0.46)
        t.fill(r, trim, y0=0.42, y1=0.47)

    arms(t, arm)
    t.save(name)


def check_shirt(name, base, line1, line2, long=True, pocket=True):
    """Flannel / check shirt."""
    t = T()

    def pattern(r):
        t.fill(r, base)
        x, y, w, h = r
        for i in range(0, int(w), 16):
            t.fill(r, line1, x0=i / w, x1=(i + 6) / w)
        for j in range(0, int(h), 16):
            t.fill(r, line1, y0=j / h, y1=(j + 6) / h)
        for i in range(8, int(w), 16):
            t.fill(r, line2, x0=i / w, x1=(i + 1.5) / w)

    def torso(k, r):
        pattern(r)
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, '#000000', 3, seed=len(k) * 47)
        if k == 'front':
            t.poly(r, [(0.32, 0), (0.5, 0.14), (0.68, 0), (0.6, 0.18), (0.5, 0.2), (0.4, 0.18)], line1)
            t.line(r, [(0.5, 0.16), (0.5, 1)], '#1a1a1a', 0.6)
            for yy in (0.32, 0.5, 0.68, 0.86):
                t.dot(r, 0.5, yy, 1.4, '#e8e2d0')
            if pocket:
                t.line(r, [(0.16, 0.3), (0.38, 0.3), (0.38, 0.5), (0.16, 0.5), (0.16, 0.3)], '#1a1a1a', 0.6)

    all_torso(t, torso)

    def arm(side, k, r):
        if k == 'bottom':
            return
        pattern(r)
        if not long and k != 'top':
            t.d.rectangle(t.box(r, 0, 0.5, 1, 1), fill=(0, 0, 0, 0))
        elif k in ('front', 'out', 'back', 'in'):
            t.fill(r, line1, y0=0.86, y1=0.96)

    arms(t, arm)
    t.save(name)


def plain(name, body, dark, details=None, arm_fn=None, long=True):
    t = T()

    def torso(k, r):
        t.vgrad(r, body, '#%02x%02x%02x' % shade(body, -0.06)[:3])
        if k in ('front', 'back', 'left', 'right'):
            t.folds(r, dark, 3, seed=len(k) * 53 + len(name))
        if details:
            details(t, k, r)

    all_torso(t, torso)

    def arm(side, k, r):
        if k == 'bottom':
            return
        t.vgrad(r, body, '#%02x%02x%02x' % shade(body, -0.06)[:3])
        if not long and k != 'top':
            t.d.rectangle(t.box(r, 0, 0.48, 1, 1), fill=(0, 0, 0, 0))
            t.line(r, [(0, 0.46), (1, 0.46)], dark, 0.8)
        if arm_fn:
            arm_fn(t, side, k, r)

    arms(t, arm)
    t.save(name)


def messi_set():
    # Leo's childhood club shirt: red and black halves
    kit('ts_leo11', ('#c8102e', '#161616'), '10', halves=True, trim='#ffffff')
    for n, c in (('ts_bib_o', '#ff7a1a'), ('ts_bib_y', '#e6d82a'), ('ts_bib_g', '#3ab05a')):
        def bib(t, k, r, c=c):
            if k in ('front', 'back'):
                t.fill(r, c, x0=0.08, x1=0.92, y0=0.06)
                for xx in [i / 12 for i in range(13)]:
                    for yy in [j / 12 for j in range(1, 13)]:
                        t.dot(r, 0.08 + xx * 0.84, yy, 0.35, '#000000')
                t.poly(r, [(0.3, 0), (0.7, 0), (0.5, 0.2)], '#f4f4f0')
                text(t, r, '7' if 'o' in n else ('4' if 'y' in n else '9'), 0.5, 0.55, 40, '#ffffff', '#00000055', 0)
        plain(n, '#f4f4f0', '#cfcfc8', bib, long=False)

    def hoodie(t, k, r):
        if k == 'front':
            t.d.chord(t.box(r, 0.33, -0.16, 0.67, 0.16), 0, 180, fill=(0, 0, 0, 0))
            t.line(r, [(0.42, 0.08), (0.42, 0.42)], '#e6e6e6', 0.8)
            t.line(r, [(0.58, 0.08), (0.58, 0.42)], '#e6e6e6', 0.8)
            t.poly(r, [(0.2, 0.6), (0.8, 0.6), (0.88, 0.88), (0.12, 0.88)], '#5f6b78')
            t.fill(r, '#3d4650', y0=0.92, y1=1)
        if k == 'back':
            t.poly(r, [(0.2, 0), (0.8, 0), (0.7, 0.3), (0.3, 0.3)], '#5f6b78')
            # backpack straps
        if k in ('left', 'right'):
            t.fill(r, '#3d4650', y0=0.92, y1=1)
    plain('ts_leo13', '#6c7a88', '#4f5a66', hoodie, lambda t, s, k, r: t.fill(r, '#3d4650', y0=0.9, y1=1) if k in ('front', 'out', 'back', 'in') else None)

    kit('ts_barca30', ('#1a3a8a', '#a3123a'), '30', numc='#f2c94c', numo='#1a1a1a', stripes=5, sleeve='#1a3a8a', trim='#f2c94c')
    for num in ('10', '7', '11', '23'):
        kit(f'ts_arg{num}', ('#7cc3ee', '#ffffff'), num, numc='#1a2a4a', numo='#ffffff', stripes=5, sleeve='#ffffff', trim='#1a2a4a')
    kit('ts_bisht', ('#7cc3ee', '#ffffff'), '10', numc='#1a2a4a', numo='#ffffff', stripes=5, sleeve='#ffffff', trim='#1a2a4a', robe=True)

    def doctor(t, k, r):
        if k == 'front':
            t.poly(r, [(0.36, 0), (0.64, 0), (0.58, 0.55), (0.42, 0.55)], '#8fb4d8')
            t.poly(r, [(0.47, 0.04), (0.53, 0.04), (0.55, 0.5), (0.5, 0.56), (0.45, 0.5)], '#2c3e66')
            t.poly(r, [(0.36, 0), (0.22, 0), (0.3, 0.36), (0.42, 0.55)], '#ffffff')
            t.poly(r, [(0.64, 0), (0.78, 0), (0.7, 0.36), (0.58, 0.55)], '#ffffff')
            t.line(r, [(0.22, 0), (0.3, 0.36), (0.42, 0.55)], '#c8ccd0', 0.8)
            t.line(r, [(0.78, 0), (0.7, 0.36), (0.58, 0.55)], '#c8ccd0', 0.8)
            # Stethoscope
            t.line(r, [(0.3, 0.02), (0.34, 0.32), (0.42, 0.46)], '#2a2a2e', 1.4)
            t.line(r, [(0.7, 0.02), (0.66, 0.32), (0.58, 0.46)], '#2a2a2e', 1.4)
            t.dot(r, 0.5, 0.52, 3.5, '#b8bcc2', outline='#6a6e74')
            # Pocket with pens
            t.line(r, [(0.68, 0.44), (0.86, 0.44), (0.86, 0.6), (0.68, 0.6), (0.68, 0.44)], '#c8ccd0', 0.7)
            t.fill(r, '#2f6fd0', x0=0.72, x1=0.74, y0=0.38, y1=0.47)
            t.fill(r, '#d03030', x0=0.77, x1=0.79, y0=0.39, y1=0.47)
            t.line(r, [(0.5, 0.56), (0.5, 1)], '#c8ccd0', 0.7)
            text(t, r, 'Dr.', 0.22, 0.48, 10, '#2c3e66')
    plain('ts_doctor', '#f6f7f8', '#d4d8dc', doctor)

    check_shirt('ts_flannel', '#3c5a7a', '#2a3e58', '#a8b8c8')
    check_shirt('ts_flannel_r', '#8a3a2e', '#5a221a', '#d8b8a0', long=False)

    def coverall(t, k, r):
        if k in ('front', 'back', 'left', 'right'):
            t.fill(r, '#c8ccd2', y0=0.62, y1=0.68)
            t.fill(r, '#e8eaee', y0=0.635, y1=0.665)
        if k == 'front':
            t.line(r, [(0.5, 0.05), (0.5, 1)], '#a84a10', 0.8)
            t.line(r, [(0.6, 0.22), (0.84, 0.22), (0.84, 0.4), (0.6, 0.4), (0.6, 0.22)], '#a84a10', 0.8)
            t.poly(r, [(0.36, 0), (0.5, 0.12), (0.64, 0)], '#a84a10')
    plain('ts_coverall', '#e8681c', '#b04a10', coverall, lambda t, s, k, r: t.fill(r, '#c8ccd2', y0=0.6, y1=0.66) if k in ('front', 'out', 'back', 'in') else None)

    def cardigan(t, k, r):
        if k == 'front':
            t.poly(r, [(0.36, 0), (0.64, 0), (0.58, 1), (0.42, 1)], '#f1e8d8')
            for yy in (0.3, 0.48, 0.66, 0.84):
                t.dot(r, 0.39, yy, 1.6, '#e8d8b8')
            t.fill(r, '#7a4a62', y0=0.9, y1=1, x1=0.4)
            t.fill(r, '#7a4a62', y0=0.9, y1=1, x0=0.6)
    plain('ts_cardigan', '#94607a', '#6e4458', cardigan, lambda t, s, k, r: t.fill(r, '#7a4a62', y0=0.88, y1=1) if k in ('front', 'out', 'back', 'in') else None)

    def track(c1, c2, label):
        def d(t, k, r):
            if k == 'front':
                t.fill(r, '#d8dce2', x0=0.49, x1=0.51)
                t.fill(r, c2, y0=0, y1=0.1, x0=0.3, x1=0.7)
                if label:
                    t.line(r, [(0.36, 0.05), (0.5, 0.42), (0.64, 0.05)], '#e8e8e8', 1.0)
                    t.fill(r, '#c9ccd2', x0=0.46, x1=0.56, y0=0.42, y1=0.5)
            if k in ('left', 'right'):
                t.fill(r, c2, x0=0.4, x1=0.6)
        return d
    plain('ts_track_red', '#b81e2a', '#801420', track('#b81e2a', '#ffffff', False), lambda t, s, k, r: t.fill(r, '#ffffff', x0=0.4, x1=0.6) if k == 'out' else None)
    plain('ts_track_navy', '#1c2a50', '#121c38', track('#1c2a50', '#c8102e', True), lambda t, s, k, r: t.fill(r, '#c8102e', x0=0.4, x1=0.6) if k == 'out' else None)

    def sweater(t, k, r):
        if k == 'front':
            t.poly(r, [(0.34, 0), (0.66, 0), (0.5, 0.3)], '#bcd2ea')
            t.poly(r, [(0.4, 0), (0.5, 0.1), (0.6, 0), (0.56, 0.06), (0.5, 0.14), (0.44, 0.06)], '#e8f0f8')
            for xx in [i / 10 for i in range(11)]:
                t.line(r, [(xx, 0.9), (xx, 1)], '#5a5e66', 0.5)
    plain('ts_sweater', '#7a7e88', '#5a5e66', sweater)


if __name__ == '__main__' and 'messi' in __import__('sys').argv:
    messi_set()
    raise SystemExit


if __name__ == '__main__':
    import sys as _s
    if 'lebron' in _s.argv:
        lebron_set()
    else:
        for fn in (barkeep, joseph, jotaro, avdol, polnareff):
            fn()
    print('wrote', sorted(f for f in os.listdir(OUT) if f.startswith('ts_')))
