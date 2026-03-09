import json

# Persian → Arabic digits
persian_to_arabic = str.maketrans({
    "۰": "٠",
    "۱": "١",
    "۲": "٢",
    "۳": "٣",
    "۴": "٤",
    "۵": "٥",
    "۶": "٦",
    "۷": "٧",
    "۸": "٨",
    "۹": "٩",
})

# Jawshan Kabir refrain
refrain_ar = "سُبْحانَكَ يَا لَاإِلٰهَ إِلّا أَنْتَ، الْغَوْثَ الْغَوْثَ، خَلِّصْنا مِنَ النَّارِ يَا رَبِّ"
refrain_fa = "منزّهی تو ای که معبودی جز تو نیست، فریادرس فریادرس، ما را از آتش برهان ای پروردگار من"

# Load JSON
with open("dua-jawshan-kabeer.json", "r", encoding="utf-8") as f:
    data = json.load(f)

content = data["content"]

new_content = []
slide_id = 1

for item in content:

    # Fix digits in Arabic text
    if item.get("ar"):
        item["ar"] = item["ar"].translate(persian_to_arabic)

    # Copy original slide
    item_copy = item.copy()
    item_copy["id"] = slide_id
    new_content.append(item_copy)

    # Do NOT add refrain after first slide (Bismillah)
    if slide_id != 1:
        slide_id += 1

        refrain_slide = {
            "id": slide_id,
            "m": None,
            "ar": refrain_ar,
            "fa": refrain_fa
        }

        new_content.append(refrain_slide)

    slide_id += 1

# Replace content
data["content"] = new_content

# Save new JSON
with open("dua-jawshan-kabeer-processed.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done! Numbers fixed and refrain added after all bands except the first slide.")