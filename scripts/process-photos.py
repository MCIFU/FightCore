"""
Step 3 of the photo pipeline: head-and-shoulders crop with transparent
background for every licensed photo fetched by scripts/fetch-photos.mts.

  pip install opencv-python-headless mediapipe==0.10.14
  python3 scripts/process-photos.py

· Face: MediaPipe face detection (full range). No confident face → photo dropped.
· Crop: square around the face (face centred at 40 % height, side = 2.9× face height).
· Background: MediaPipe selfie segmentation; only the region connected to the
  detected face is kept, so other people in the frame disappear.
· Output: public/photos/<slug>.webp (400×400, alpha) + data/snapshot/photo-processed.json

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
SIZE = 400
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
only = set(sys.argv[1:])
for fid, m in meta.items():
    slug = slug_by_id.get(fid)
    if not slug or (only and slug not in only):
        continue
    if file_count[m["file"]] > 1:
        dropped[slug] = "file shared by namesakes"
        continue
    if slug in EXCLUDE:
        dropped[slug] = "excluded after review"
        if os.path.exists(f"{OUT}/{slug}.webp"):
            os.remove(f"{OUT}/{slug}.webp")
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
        if os.path.exists(f"{OUT}/{slug}.webp"):
            os.remove(f"{OUT}/{slug}.webp")
        continue
    bb = det.location_data.relative_bounding_box
    fx, fy, fw, fh = bb.xmin * w, bb.ymin * h, bb.width * w, bb.height * h
    if fh < 48:
        dropped[slug] = f"face too small ({fh:.0f}px)"
        continue
    side = int(fh * 2.9)
    cx, cy = fx + fw / 2, fy + fh / 2
    x0, y0 = int(cx - side / 2), int(cy - side * 0.40)
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
    fc = (int(SIZE / 2), int(SIZE * 0.40))
    lab = labels[fc[1], fc[0]]
    if lab == 0:
        dropped[slug] = "segmentation missed the face"
        continue
    keep = cv2.dilate((labels == lab).astype(np.uint8), np.ones((9, 9), np.uint8))
    # Head-and-shoulders window: fade out anything wider than ~3 face widths,
    # which removes people standing next to the subject.
    fw_px = fw / side * SIZE
    xs = np.abs(np.arange(SIZE) - SIZE / 2)
    window = np.clip((1.75 * fw_px - xs) / (0.25 * fw_px), 0, 1)[None, :]
    alpha = np.clip((seg - 0.25) / 0.5, 0, 1) * keep * (vmask / 255.0) * window
    coverage = float(alpha.mean())
    if coverage < 0.12:
        dropped[slug] = f"subject too small ({coverage:.2f})"
        continue
    out = np.dstack([crop, (alpha * 255).astype(np.uint8)])
    cv2.imwrite(f"{OUT}/{slug}.webp", out, [cv2.IMWRITE_WEBP_QUALITY, 82])
    done[fid] = {"slug": slug, "score": round(float(det.score[0]), 3), "coverage": round(coverage, 3)}

json.dump(done, open("data/snapshot/photo-processed.json", "w"), indent=1)
print(f"processed {len(done)} · dropped {len(dropped)}")
for k, v in list(dropped.items())[:40]:
    print("  ✗", k, v)

# Full runs also remove crops that no longer qualify.
if not only:
    keep_files = {f"{d['slug']}.webp" for d in done.values()}
    for f in os.listdir(OUT):
        if f.endswith(".webp") and f not in keep_files:
            os.remove(f"{OUT}/{f}")
