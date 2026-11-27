import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd
import requests

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
STYLES_CSV = os.path.join(DATA_DIR, "styles.csv")
IMAGES_CSV = os.path.join(DATA_DIR, "images.csv")
IMAGES_DIR = os.path.join(DATA_DIR, "test_images")
TEST_JSON_PATH = os.path.join(DATA_DIR, "test_dataset.json")

SAMPLE_SIZE = 500


def download_image(item):
    filename = item["filename"]
    url = item["link"]
    dest_path = os.path.join(IMAGES_DIR, filename)

    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        return item["id"], dest_path, True

    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200 and len(resp.content) > 1000:
            with open(dest_path, "wb") as f:
                f.write(resp.content)
            return item["id"], dest_path, True
    except Exception:
        pass

    return item["id"], None, False


def build_test_set():
    os.makedirs(IMAGES_DIR, exist_ok=True)

    df_styles = pd.read_csv(STYLES_CSV, on_bad_lines="skip")
    df_images = pd.read_csv(IMAGES_CSV, on_bad_lines="skip")
    df_images["id"] = df_images["filename"].str.replace(".jpg", "", regex=False).astype(int, errors="ignore")

    df = pd.merge(df_styles, df_images, on="id", how="inner")
    df = df.dropna(subset=["productDisplayName", "link", "masterCategory", "articleType"])
    df = df[df["masterCategory"].isin(["Apparel", "Footwear", "Accessories"])]

    samples_per_cat = {
        "Apparel": int(SAMPLE_SIZE * 0.55),
        "Footwear": int(SAMPLE_SIZE * 0.25),
        "Accessories": SAMPLE_SIZE - int(SAMPLE_SIZE * 0.55) - int(SAMPLE_SIZE * 0.25),
    }

    sampled_dfs = []
    for cat, count in samples_per_cat.items():
        sub = df[df["masterCategory"] == cat]
        sampled_dfs.append(sub.sample(n=count, random_state=42) if len(sub) > count else sub)

    sample_df = pd.concat(sampled_dfs).reset_index(drop=True)
    items = sample_df.to_dict(orient="records")
    valid_items = []

    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(download_image, item): item for item in items}
        downloaded = 0
        for future in as_completed(futures):
            item = futures[future]
            _, _, success = future.result()
            if success:
                item["local_image_path"] = f"data/test_images/{item['filename']}"
                item["search_query_title"] = item["productDisplayName"]
                item["search_query_attribute"] = (
                    f"{item.get('baseColour', '')} {item.get('gender', '')} {item.get('articleType', '')}"
                ).strip()
                valid_items.append(item)
                downloaded += 1
                if downloaded % 100 == 0 or downloaded == len(items):
                    print(f"Đã tải ảnh: {downloaded}/{len(items)}")

    with open(TEST_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(valid_items, f, ensure_ascii=False, indent=2)

    print(f"Đã lưu tập test ({len(valid_items)} mẫu): {TEST_JSON_PATH}")


if __name__ == "__main__":
    build_test_set()
