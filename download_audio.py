"""
Downloads all Quran MP3 recitations from everyayah.com (Abdul Basit Murattal 192kbps).
Reads verse counts from db/quran/manifest.json.
Saves files to db/audio/{surah:03d}{ayah:03d}.mp3

Bismillah files use ayah=000 (for surahs 2–8, 10–114).
Surah 1 (Al-Fatiha): verse 1 IS the Bismillah, no separate 000 file.
Surah 9 (At-Tawbah): no Bismillah.
"""

import requests, json, os, time, sys

BASE_URL = "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/"
OUTDIR   = "db/audio"
MANIFEST = "db/quran/manifest.json"

os.makedirs(OUTDIR, exist_ok=True)

with open(MANIFEST, encoding="utf-8") as f:
    manifest = json.load(f)

def download(filename, label):
    path = os.path.join(OUTDIR, filename)
    if os.path.exists(path):
        return "skip"
    url = BASE_URL + filename
    for attempt in range(4):
        try:
            r = requests.get(url, timeout=30, stream=True)
            if r.status_code == 404:
                return "404"
            r.raise_for_status()
            with open(path, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            return "ok"
        except Exception as e:
            print(f"\n  [{label}] attempt {attempt+1} failed: {e}")
            time.sleep(2 ** attempt)
    return "error"

total_files = 0
skipped = 0
errors = []

for ch in manifest:
    sid = ch["id"]
    count = ch["verses_count"]
    has_bismillah = sid != 1 and sid != 9

    files_this_surah = []
    if has_bismillah:
        files_this_surah.append((sid, 0))
    for ayah in range(1, count + 1):
        files_this_surah.append((sid, ayah))

    print(f"Surah {sid:03d} ({count} verses) ...", end=" ", flush=True)
    ok = 0
    for surah, ayah in files_this_surah:
        fname = f"{surah:03d}{ayah:03d}.mp3"
        label = fname
        result = download(fname, label)
        if result == "ok":
            ok += 1
            total_files += 1
        elif result == "skip":
            skipped += 1
        elif result in ("404", "error"):
            errors.append(fname)
        time.sleep(0.15)

    print(f"downloaded {ok}, skipped {skipped}")

print(f"\nDone. Total downloaded: {total_files}, skipped: {skipped}, errors: {len(errors)}")
if errors:
    print("Errors:", errors[:20])
