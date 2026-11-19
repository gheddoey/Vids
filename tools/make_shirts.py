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


if __name__ == '__main__':
    for fn in (barkeep, joseph, jotaro, avdol, polnareff):
        fn()
    print('wrote', sorted(f for f in os.listdir(OUT) if f.startswith('ts_')))
