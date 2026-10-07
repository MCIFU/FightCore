"""
Step 3 of the photo pipeline: head-and-shoulders crop with transparent
background for every licensed photo fetched by scripts/fetch-photos.mts.

  pip install opencv-python-headless mediapipe==0.10.14
  python3 scripts/process-photos.py

· Face: MediaPipe face detection (full range). No confident face → photo dropped.
· Crop: square around the face (face centred at 40 % height, side = 2.9× face height).
· Background: MediaPipe selfie segmentation; only the region connected to the
  detected face is kept, so other people in the frame disappear.
· Output: public/photos/<slug>.png (320×320 head close-up, alpha) + data/snapshot/photo-processed.json

Cropping and background removal are modifications: the UI says so next to the
credit, and ShareAlike photos stay under their original licence.
"""
import json
import os
import sys

import cv2
import mediapipe as mp
import numpy as np

META = "data/snapshot/photo-meta.json"
QUEUE = "data/snapshot/photo-queue.json"
SRC = "data/.cache/photos"
OUT = "public/photos"
SIZE = 320
# Official studio busts: side = BUST × face height (head and shoulders), output size.
BUST = 2.6
OFF_SIZE = 400
os.makedirs(OUT, exist_ok=True)

meta = json.load(open(META))
slug_by_id = {q["id"]: q["slug"] for q in json.load(open(QUEUE))}
EXTRA = "data/snapshot/photo-queue-extra.json"
if os.path.exists(EXTRA):
    slug_by_id.update({q["id"]: q["slug"] for q in json.load(open(EXTRA))})
face_det = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.6)
# Close-up portraits are often missed by the full-range model: retry with the short-range one.
face_near = mp.solutions.face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.6)
segmenter = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0)

# Photos reviewed by eye and rejected (several people, subject ambiguous).
EXCLUDE = {"brock-larson", "krzysztof-jotko", "kendall-grove", "lorenz-larkin", "kevin-holland", "mounir-lazzez", "frank-shamrock", "jessica-eye", "alexa-grasso", "tracy-cortez", "viviane-araujo", "war-machine", "wanderlei-silva", "nick-thompson", "phil-baroni", "joe-lauzon", "jorge-santiago", "jorge-gurgel"}

# One file assigned to two fighters means namesakes: we can't tell who it shows.
from collections import Counter
file_count = Counter(m["file"] for m in meta.values())

done, dropped = {}, {}
# --official-only: skip the Wikimedia Commons crops (their sources live in a local
# cache that CI doesn't have; a full run without it would delete them).
OFFICIAL_ONLY = "--official-only" in sys.argv
only = set(a for a in sys.argv[1:] if not a.startswith("--"))
for fid, m in ({} if OFFICIAL_ONLY else meta).items():
    slug = slug_by_id.get(fid)
    if not slug or (only and slug not in only):
        continue
    if file_count[m["file"]] > 1:
        dropped[slug] = "file shared by namesakes"
        continue
    if slug in EXCLUDE:
        dropped[slug] = "excluded after review"
        if os.path.exists(f"{OUT}/{slug}.png"):
            os.remove(f"{OUT}/{slug}.png")
        continue
    ext = "jpg" if m["ext"] in ("tif", "tiff") else m["ext"]
    path = f"{SRC}/{slug}.{ext}"
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        dropped[slug] = "unreadable"
        continue
    if img.dtype != np.uint8:  # 16-bit PNG/TIFF
        img = (img / 257).astype(np.uint8)
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    if img.shape[2] == 4:  # flatten source transparency on white
        a = img[:, :, 3:4] / 255.0
        img = (img[:, :, :3] * a + 255 * (1 - a)).astype(np.uint8)
    h, w = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    res = face_det.process(rgb)
    if not res.detections:
        res = face_near.process(rgb)
    if not res.detections:
        dropped[slug] = "no face"
        continue
    # Largest face = the subject (crowd shots have smaller faces behind).
    area = lambda d: d.location_data.relative_bounding_box.width * d.location_data.relative_bounding_box.height
    dets = sorted(res.detections, key=area, reverse=True)
    det = dets[0]
    # Two faces of similar size: we can't tell which one is the fighter, so no photo.
    if len(dets) > 1 and area(dets[1]) > 0.45 * area(det):
        dropped[slug] = "several similar faces"
        if os.path.exists(f"{OUT}/{slug}.png"):
            os.remove(f"{OUT}/{slug}.png")
        continue
    bb = det.location_data.relative_bounding_box
    fx, fy, fw, fh = bb.xmin * w, bb.ymin * h, bb.width * w, bb.height * h
    if fh < 48:
        dropped[slug] = f"face too small ({fh:.0f}px)"
        continue
    # Head close-up: face fills most of the frame, a little room for hair and chin.
    side = int(fh * 1.75)
    cx, cy = fx + fw / 2, fy + fh / 2
    x0, y0 = int(cx - side / 2), int(cy - side * 0.46)
    # Pad so the crop can extend past the frame; padding becomes transparent.
    pad = side
    big = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    valid = np.zeros(big.shape[:2], np.uint8)
    valid[pad:pad + h, pad:pad + w] = 255
    crop = big[y0 + pad:y0 + pad + side, x0 + pad:x0 + pad + side]
    vmask = valid[y0 + pad:y0 + pad + side, x0 + pad:x0 + pad + side]
    if crop.shape[0] != side or crop.shape[1] != side:
        dropped[slug] = "crop out of range"
        continue
    crop = cv2.resize(crop, (SIZE, SIZE), interpolation=cv2.INTER_AREA)
    vmask = cv2.resize(vmask, (SIZE, SIZE), interpolation=cv2.INTER_NEAREST)
    seg = segmenter.process(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)).segmentation_mask
    seg = cv2.GaussianBlur(seg, (5, 5), 0)
    # Keep the blob that contains the face; drop everyone else.
    binary = (seg > 0.5).astype(np.uint8)
    n, labels = cv2.connectedComponents(binary)
    fc = (int(SIZE / 2), int(SIZE * 0.46))
    lab = labels[fc[1], fc[0]]
    if lab == 0:
        dropped[slug] = "segmentation missed the face"
        continue
    keep = cv2.dilate((labels == lab).astype(np.uint8), np.ones((9, 9), np.uint8))
    # Head-and-shoulders window: fade out anything wider than ~3 face widths,
    # which removes people standing next to the subject.
    fw_px = fw / side * SIZE
    xs = np.abs(np.arange(SIZE) - SIZE / 2)
    window = np.clip((0.95 * fw_px - xs) / (0.2 * fw_px), 0, 1)[None, :]
    alpha = np.clip((seg - 0.25) / 0.5, 0, 1) * keep * (vmask / 255.0) * window
    coverage = float(alpha.mean())
    if coverage < 0.2:
        dropped[slug] = f"subject too small ({coverage:.2f})"
        continue
    out = np.dstack([crop, (alpha * 255).astype(np.uint8)])
    cv2.imwrite(f"{OUT}/{slug}.png", out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    done[fid] = {"slug": slug, "score": round(float(det.score[0]), 3), "coverage": round(coverage, 3)}

if not OFFICIAL_ONLY:
    json.dump(done, open("data/snapshot/photo-processed.json", "w"), indent=1)
    print(f"processed {len(done)} · dropped {len(dropped)}")
for k, v in list(dropped.items())[:40]:
    print("  ✗", k, v)

# Palette PNGs keep the transparency at a quarter of the size (needs pngquant).
import shutil, subprocess
if shutil.which("pngquant") and not OFFICIAL_ONLY:
    files = [f"{OUT}/{d['slug']}.png" for d in done.values()]
    for i in range(0, len(files), 50):
        subprocess.run(["pngquant", "--quality=65-90", "--speed", "1", "--force", "--ext", ".png", "--skip-if-larger", *files[i:i + 50]])

# Full runs also remove crops that no longer qualify.
if not only and not OFFICIAL_ONLY:
    keep_files = {f"{d['slug']}.png" for d in done.values()}
    for f in os.listdir(OUT):
        if (f.endswith(".webp") or f.endswith(".png")) and f not in keep_files:
            os.remove(f"{OUT}/{f}")

# ── Official UFC studio portraits (scripts/fetch-espn-photos.mts) ───────────
# Already transparent cut-outs: crop a square bust around the face (head and
# shoulders, like the studio shot) and keep the original alpha.
ESPN = "data/snapshot/espn.json"
if os.path.exists(ESPN):
    OUT_OFF = f"{OUT}/official"
    os.makedirs(OUT_OFF, exist_ok=True)
    official_done = {}
    new_files = []
    REDO = "--redo" in sys.argv
    for fid, o in json.load(open(ESPN)).items():
        slug = o["slug"]
        entry = {"slug": slug, "page": o["page"], "team": o.get("team"), "style": o.get("style")}
        # Already cropped: keep it (the source may not be in this machine's cache, e.g. in CI).
        if not REDO and os.path.exists(f"{OUT_OFF}/{slug}.png"):
            official_done[fid] = entry
            continue
        src = cv2.imread(f"data/.cache/espn/{slug}.png", cv2.IMREAD_UNCHANGED)
        if src is None:
            continue
        if src.dtype != np.uint8:
            src = (src / 257).astype(np.uint8)
        if src.ndim == 2:
            src = cv2.cvtColor(src, cv2.COLOR_GRAY2BGRA)
        if src.shape[2] == 3:
            src = np.dstack([src, np.full(src.shape[:2], 255, np.uint8)])
        h, w = src.shape[:2]
        a = src[:, :, 3:4] / 255.0
        flat = cv2.cvtColor((src[:, :, :3] * a + 255 * (1 - a)).astype(np.uint8), cv2.COLOR_BGR2RGB)
        res = face_near.process(flat) or None
        dets = res.detections if res and res.detections else (face_det.process(flat).detections or [])
        if not dets:
            continue
        bb = max(dets, key=lambda d: d.location_data.relative_bounding_box.height).location_data.relative_bounding_box
        fh = bb.height * h
        side = int(fh * BUST)
        cx, cy = (bb.xmin + bb.width / 2) * w, (bb.ymin + bb.height / 2) * h
        # The studio shot ends straight across the chest: align the crop's bottom
        # with it so there is no empty band, unless that would cut the head.
        rows = np.where(src[:, :, 3].max(axis=1) > 16)[0]
        bottom = int(rows[-1]) + 1 if len(rows) else h
        x0 = int(cx - side / 2)
        y0 = min(bottom - side, int(cy - fh * 0.95))
        pad = side
        big = cv2.copyMakeBorder(src, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
        crop = big[y0 + pad:y0 + pad + side, x0 + pad:x0 + pad + side]
        if crop.shape[0] != side or crop.shape[1] != side:
            continue
        crop = cv2.resize(crop, (OFF_SIZE, OFF_SIZE), interpolation=cv2.INTER_AREA)
        cv2.imwrite(f"{OUT_OFF}/{slug}.png", crop, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        official_done[fid] = entry
        new_files.append(f"{OUT_OFF}/{slug}.png")
    json.dump(official_done, open("data/snapshot/photo-official-processed.json", "w"), indent=1)
    if shutil.which("pngquant"):
        files = new_files
        for i in range(0, len(files), 50):
            subprocess.run(["pngquant", "--quality=70-92", "--speed", "1", "--force", "--ext", ".png", "--skip-if-larger", *files[i:i + 50]])
    print(f"official {len(official_done)} · new {len(new_files)}")
