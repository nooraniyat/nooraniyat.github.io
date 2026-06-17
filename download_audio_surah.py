"""
Downloads one surah's MP3 files. Pass surah number as argument.
Skips files already present. Exits 0 on success, 1 on error.
"""

import requests, json, os, sys, time

BASE_URL = "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/"
OUTDIR   = "db/audio"
MANIFEST = "db/quran/manifest.json"

os.makedirs(OUTDIR, exist_ok=True)

sid = int(sys.argv[1])

with open(MANIFEST, encoding="utf-8") as f:
    manifest = json.load(f)

ch = next((c for c in manifest if c["id"] == sid), None)
if not ch:
    print(f"Surah {sid} not found in manifest")
    sys.exit(1)

count = ch["verses_count"]
has_bismillah = sid != 1 and sid != 9

files = []
if has_bismillah:
    files.append(0)
for ayah in range(1, count + 1):
    files.append(ayah)

errors = []
downloaded = 0
skipped = 0

for ayah in files:
    fname = f"{sid:03d}{ayah:03d}.mp3"
    path  = os.path.join(OUTDIR, fname)
    if os.path.exists(path):
        skipped += 1
        continue
    url = BASE_URL + fname
    for attempt in range(4):
        try:
            r = requests.get(url, timeout=30, stream=True)
            if r.status_code == 404:
                print(f"  404: {fname}")
                errors.append(fname)
                break
            r.raise_for_status()
            with open(path, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            downloaded += 1
            break
        except Exception as e:
            print(f"  [{fname}] attempt {attempt+1}: {e}")
            time.sleep(2 ** attempt)
    else:
        errors.append(fname)
    time.sleep(0.15)

print(f"Surah {sid:03d}: downloaded={downloaded}, skipped={skipped}, errors={len(errors)}")
if errors:
    print("  errors:", errors)
    sys.exit(1)
sys.exit(0)
