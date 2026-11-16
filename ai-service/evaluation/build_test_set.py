import os
import sys
import json
import pandas as pd
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.dirname(os.path.abspath(__file__)) + "/data"
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
    print(f"=== BẮT ĐẦU TẠO TẬP DỮ LIỆU TEST TỪ DATA.ZIP (MẪU {SAMPLE_SIZE} SẢN PHẨM) ===")
    os.makedirs(IMAGES_DIR, exist_ok=True)

    print("1. Đang nạp styles.csv và images.csv...")
    df_styles = pd.read_csv(STYLES_CSV, on_bad_lines='skip')
    df_images = pd.read_csv(IMAGES_CSV, on_bad_lines='skip')

    df_images['id'] = df_images['filename'].str.replace('.jpg', '', regex=False).astype(int, errors='ignore')

    df = pd.merge(df_styles, df_images, on='id', how='inner')
    df = df.dropna(subset=['productDisplayName', 'link', 'masterCategory', 'articleType'])

    valid_categories = ['Apparel', 'Footwear', 'Accessories']
    df = df[df['masterCategory'].isin(valid_categories)]

    print(f"Tổng số sản phẩm thời trang hợp lệ: {len(df)}")


    samples_per_cat = {
        'Apparel': int(SAMPLE_SIZE * 0.55),
        'Footwear': int(SAMPLE_SIZE * 0.25),
        'Accessories': SAMPLE_SIZE - int(SAMPLE_SIZE * 0.55) - int(SAMPLE_SIZE * 0.25)
    }

    sampled_dfs = []
    for cat, count in samples_per_cat.items():
        sub = df[df['masterCategory'] == cat]
        if len(sub) > count:
            sampled_dfs.append(sub.sample(n=count, random_state=42))
        else:
            sampled_dfs.append(sub)

    sample_df = pd.concat(sampled_dfs).reset_index(drop=True)
    print(f"2. Đã chọn {len(sample_df)} sản phẩm mẫu trải đều các phân loại:")
    print(sample_df['masterCategory'].value_counts().to_string())

    print(f"\n3. Đang tải {len(sample_df)} ảnh về thư mục cục bộ {IMAGES_DIR}...")
    items = sample_df.to_dict(orient="records")
    valid_items = []

    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(download_image, item): item for item in items}
        downloaded = 0
        for future in as_completed(futures):
            item = futures[future]
            prod_id, local_path, success = future.result()
            if success:
                item["local_image_path"] = f"data/test_images/{item['filename']}"
                item["search_query_title"] = item["productDisplayName"]
                item["search_query_attribute"] = f"{item.get('baseColour', '')} {item.get('gender', '')} {item.get('articleType', '')}".strip()
                valid_items.append(item)
                downloaded += 1
                if downloaded % 50 == 0 or downloaded == len(items):
                    print(f"   -> Đã tải thành công: {downloaded}/{len(items)} ảnh...")

    print(f"\nTổng số mẫu hợp lệ có đầy đủ ảnh và thông tin: {len(valid_items)}")

    with open(TEST_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(valid_items, f, ensure_ascii=False, indent=2)

    print(f"4. Đã lưu tập test hoàn chỉnh vào: {TEST_JSON_PATH}")
    print("=== TẠO BỘ TEST HOÀN TẤT THÀNH CÔNG! ===")

if __name__ == "__main__":
    build_test_set()

