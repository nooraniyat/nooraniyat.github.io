"""
Downloads all Quran data from api.quran.com and saves to db/quran/.

Output:
  db/quran/manifest.json       — list of all 114 surahs
  db/quran/001.json … 114.json — verses per surah (Arabic + Fooladvand Persian)
"""

import requests, json, os, re, time, sys

BASE   = "https://api.quran.com/api/v4"
TRANS  = 29          # Fooladvand Persian translation
OUTDIR = "db/quran"

os.makedirs(OUTDIR, exist_ok=True)

def get(url, label):
    for attempt in range(4):
        try:
            r = requests.get(url, timeout=20)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"  [{label}] attempt {attempt+1} failed: {e}")
            time.sleep(2 ** attempt)
    print(f"  ERROR: giving up on {label}")
    return None

# ── 1. Chapter manifest ────────────────────────────────────────────────────────
print("Downloading chapter list …")
data = get(f"{BASE}/chapters?language=fa", "chapters")
if not data:
    sys.exit(1)

manifest = []
for ch in data["chapters"]:
    manifest.append({
        "id":              ch["id"],
        "name_arabic":     ch["name_arabic"],
        "name_fa":         ch["translated_name"]["name"],
        "verses_count":    ch["verses_count"],
        "revelation_place": ch["revelation_place"],
    })

with open(f"{OUTDIR}/manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print(f"  Saved manifest ({len(manifest)} surahs)")

# ── 2. Verses per surah ───────────────────────────────────────────────────────
for ch in manifest:
    sid      = ch["id"]
    fname    = f"{OUTDIR}/{sid:03d}.json"
    label    = f"{sid:03d} {ch['name_arabic']}"

    if os.path.exists(fname):
        print(f"  skip {label} (already exists)")
        continue

    print(f"  Downloading {label} ({ch['verses_count']} verses) …", end=" ", flush=True)

    url  = (f"{BASE}/verses/by_chapter/{sid}"
            f"?translations={TRANS}&fields=text_uthmani&per_page=300&page=1")
    data = get(url, label)
    if not data:
        continue

    verses = []
    for v in data.get("verses", []):
        fa = (v["translations"][0]["text"] if v.get("translations") else "")
        fa = re.sub(r"<[^>]+>", "", fa).strip()
        verses.append({
            "ayah": v["verse_number"],
            "ar":   v["text_uthmani"],
            "fa":   fa,
        })

    with open(fname, "w", encoding="utf-8") as f:
        json.dump(verses, f, ensure_ascii=False, indent=2)

    print(f"saved {len(verses)} verses")
    time.sleep(0.4)

print("\nDone — all Quran data saved to db/quran/")
