#!/usr/bin/env python3
"""
Builds src/data/paintFilters.ts — the per-car filter table used by the paint shop.

Every sprite has its own body colour (blue, red, green, orange, purple…), so a
single hue-rotate per paint would turn different cars into different colours.
This script measures the dominant body colour of each sprite and then solves,
for every (car, paint) pair, the `hue-rotate() saturate() brightness()` combo
that lands that body colour on the paint's target colour.

Run:  python3 scripts/gen_paint_filters.py      (needs ImageMagick `convert`/`identify`)
"""
import colorsys
import json
import math
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARS_DIR = os.path.join(ROOT, "src", "assets", "cars")
OUT = os.path.join(ROOT, "src", "data", "paintFilters.ts")
TMP = "/tmp/paintgen"
SIZE = 760

BASES = {
    "comet": "comet_raw.png",
    "thunder": "thunder_raw.png",
    "phantom": "phantom_raw.png",
    "interceptor": "police_raw.png",
}

# id -> (base id, extra ImageMagick operators) — must stay in sync with gen_car_images.py
VARIANTS = {
    "comet-rs": ("comet", ["-modulate", "100,108,183"]),
    "comet-gt": ("comet", ["-modulate", "102,115,11"]),
    "comet-evo": ("comet", ["-modulate", "100,100,56"]),
    "thunder-rx": ("thunder", ["-modulate", "100,95,153"]),
    "thunder-ss": ("thunder", ["-modulate", "100,100,5"]),
    "thunder-hc": ("thunder", ["-modulate", "95,112,83"]),
    "phantom-r": ("phantom", ["-modulate", "100,100,33"]),
    "phantom-x": ("phantom", ["-modulate", "100,100,167"]),
    "phantom-sv": ("phantom", ["-modulate", "100,108,139"]),
    "interceptor-gold": ("interceptor", ["-colorspace", "Gray", "-colorspace", "sRGB",
                                         "-channel", "RGB", "+level-colors", "#241505,#ffe27a", "+channel"]),
}

# paint id -> target body colour (keep in sync with src/data/paints.ts)
TARGETS = {
    "crimson": "#e02436",
    "sunburst": "#f59b18",
    "acid": "#a6de2a",
    "seafoam": "#21c39a",
    "glacier": "#5fd4f2",
    "ultraviolet": "#9455e8",
    "bubblegum": "#f55fa8",
    "midnight": "#223a78",
    "gold": "#e8b72a",
    "chrome": "#c9d2e0",
}


# --------------------------------------------------------------------------- #
# sprite helpers                                                              #
# --------------------------------------------------------------------------- #
def sh(*args):
    return subprocess.run(list(args), check=True, capture_output=True, text=True).stdout.strip()


def key_out(raw, dst):
    w = int(sh("identify", "-format", "%w", raw))
    h = int(sh("identify", "-format", "%h", raw))
    bg = sh("convert", raw, "-format", "%[pixel:p{4,4}]", "info:")
    cmd = ["convert", raw, "-alpha", "set", "-fuzz", "11%", "-transparent", bg,
           "-channel", "RGBA", "-fuzz", "16%", "-fill", "none"]
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
                 (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        cmd += ["-draw", f"matte {x},{y} floodfill"]
    cmd += ["+channel", "-channel", "A", "-morphology", "Erode", "Diamond:1",
            "-blur", "0x0.6", "+channel", "-trim", "+repage",
            "-resize", f"{SIZE}x{SIZE}", "-strip", f"PNG32:{dst}"]
    subprocess.run(cmd, check=True)


def build_sprites():
    os.makedirs(TMP, exist_ok=True)
    pngs = {}
    for cid, raw in BASES.items():
        dst = os.path.join(TMP, f"{cid}.png")
        key_out(os.path.join(CARS_DIR, raw), dst)
        pngs[cid] = dst
    for cid, (base, ops) in VARIANTS.items():
        dst = os.path.join(TMP, f"{cid}.png")
        subprocess.run(["convert", pngs[base], *ops, f"PNG32:{dst}"], check=True)
        pngs[cid] = dst
    return pngs


def body_colour(path):
    """Dominant saturated colour of a sprite (ignores outlines, tyres, highlights)."""
    raw = subprocess.run(["convert", path, "-depth", "8", "rgba:-"], capture_output=True).stdout
    buckets = {}
    for o in range(0, len(raw), 4):
        r, g, b, a = raw[o], raw[o + 1], raw[o + 2], raw[o + 3]
        if a < 200:
            continue
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s < 0.28 or l < 0.12 or l > 0.93:
            continue
        key = int(h * 24)  # 15° buckets
        acc = buckets.setdefault(key, [0.0, 0.0, 0.0, 0.0])
        acc[0] += s
        acc[1] += (r / 255) * s
        acc[2] += (g / 255) * s
        acc[3] += (b / 255) * s
    best = max(buckets.values(), key=lambda v: v[0])
    w = best[0]
    return tuple(round(c / w * 255) for c in best[1:4])


# --------------------------------------------------------------------------- #
# CSS filter maths (Filter Effects spec)                                      #
# --------------------------------------------------------------------------- #
def mat_mul(m, v):
    return [m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2] for i in range(3)]


def clamp(v):
    return 0.0 if v < 0 else 255.0 if v > 255 else v


def hue_matrix(deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [
        [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
        [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283],
        [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072],
    ]


def sat_matrix(s):
    return [
        [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
    ]


def apply_filter(rgb, deg, sat, bri):
    v = [clamp(c) for c in mat_mul(sat_matrix(sat), mat_mul(hue_matrix(deg), rgb))]
    return [clamp(c * bri) for c in v]


def hex_rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def solve(base, target):
    """Search hue-rotate / saturate / brightness that best map base → target."""
    best = None
    for deg in range(0, 360, 3):
        for sat in [x / 10 for x in range(0, 33, 2)]:
            for bri in [x / 10 for x in range(3, 27, 2)]:
                out = apply_filter(base, deg, sat, bri)
                err = sum((out[i] - target[i]) ** 2 for i in range(3))
                if best is None or err < best[0]:
                    best = (err, deg, sat, bri)
    # refine around the coarse winner
    _, d0, s0, b0 = best
    for deg in [d0 + x for x in range(-2, 3)]:
        for sat in [round(s0 + x * 0.05, 2) for x in range(-4, 5)]:
            for bri in [round(b0 + x * 0.05, 2) for x in range(-4, 5)]:
                if sat < 0 or bri <= 0:
                    continue
                out = apply_filter(base, deg, sat, bri)
                err = sum((out[i] - target[i]) ** 2 for i in range(3))
                if err < best[0]:
                    best = (err, deg % 360, round(sat, 2), round(bri, 2))
    return best


def main():
    pngs = build_sprites()
    bodies = {cid: body_colour(p) for cid, p in pngs.items()}
    for cid, rgb in bodies.items():
        h, l, s = colorsys.rgb_to_hls(*(c / 255 for c in rgb))
        print(f"{cid:18s} body={rgb}  hue={round(h * 360):3d}°  sat={s:.2f}  light={l:.2f}")

    table = {}
    worst = (0, None)
    for cid, base in bodies.items():
        row = {}
        for pid, hexc in TARGETS.items():
            target = hex_rgb(hexc)
            err, deg, sat, bri = solve(base, target)
            row[pid] = [deg, sat, bri]
            dist = math.sqrt(err)
            if dist > worst[0]:
                worst = (dist, f"{cid}/{pid}")
        table[cid] = row

    print(f"\nworst colour error: {worst[0]:.0f} / 441 ({worst[1]})")

    lines = [
        "// AUTO-GENERATED by scripts/gen_paint_filters.py - do not edit by hand.",
        "// Per-car CSS filter that turns the sprite's own body colour into a paint's target colour.",
        "",
        "/** [hue-rotate deg, saturate, brightness] */",
        "export type PaintFilter = [number, number, number];",
        "",
        "/** dominant body colour measured on every sprite (debug / future paints) */",
        "export const BODY_COLORS: Record<string, [number, number, number]> = {",
    ]
    for cid, rgb in bodies.items():
        lines.append(f'  "{cid}": [{rgb[0]}, {rgb[1]}, {rgb[2]}],')
    lines += ["};", "", "export const PAINT_FILTERS: Record<string, Record<string, PaintFilter>> = {"]
    for cid, row in table.items():
        lines.append(f'  "{cid}": {{')
        for pid, (deg, sat, bri) in row.items():
            lines.append(f'    {pid}: [{deg}, {sat}, {bri}],')
        lines.append("  },")
    lines += ["};", ""]
    with open(OUT, "w") as f:
        f.write("\n".join(lines))
    print(f"wrote {OUT}")
    json.dump(table, open("/tmp/paintgen/filters.json", "w"), indent=1)


if __name__ == "__main__":
    main()
