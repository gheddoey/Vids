"""Crush a real magazine cover / post image to a 64-px texture (six rules: 64 px, nearest, few colours).

Usage: python3 tools/pixel_cover.py <image> <out.png> [height=64] [colours=40]
Box-downsamples to height 64 (width by aspect), then reduces to a small palette.
The original image is NOT kept in the repo (copyright); only the 64-px version is.
"""

import sys

from PIL import Image


def main(src, dst, h=64, n=40):
    im = Image.open(src).convert('RGB')
    w = max(1, round(im.width * h / im.height))
    small = im.resize((w, h), Image.BOX)
    small = small.quantize(colors=n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    small.save(dst)
    print(dst, small.size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], *(int(x) for x in sys.argv[3:5]))
