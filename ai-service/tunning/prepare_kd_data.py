import json
import os
import sys

import pandas as pd

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_SERVICE_DIR = os.path.dirname(SCRIPT_DIR)
EVAL_DATA_DIR = os.path.join(AI_SERVICE_DIR, "evaluation", "data")
TUNING_DATA_DIR = os.path.join(SCRIPT_DIR, "data")

STYLES_CSV = os.path.join(EVAL_DATA_DIR, "styles.csv")
IMAGES_CSV = os.path.join(EVAL_DATA_DIR, "images.csv")
TEST_JSON_PATH = os.path.join(EVAL_DATA_DIR, "test_dataset.json")

TRAIN_JSON_PATH = os.path.join(TUNING_DATA_DIR, "train_dataset.json")
VAL_JSON_PATH = os.path.join(TUNING_DATA_DIR, "val_dataset.json")
SPLIT_SUMMARY_PATH = os.path.join(TUNING_DATA_DIR, "dataset_split_summary.json")

TRAIN_SIZE = 8500
VAL_SIZE = 1000
RATIOS = {"Apparel": 0.55, "Footwear": 0.25, "Accessories": 0.20}


def build_teacher_caption(row: dict) -> str:
    title = str(row.get("productDisplayName", "")).strip()
    gender = str(row.get("gender", "")).strip()
    colour = str(row.get("baseColour", "")).strip()
    article = str(row.get("articleType", "")).strip()
    sub_cat = str(row.get("subCategory", "")).strip()
    master_cat = str(row.get("masterCategory", "")).strip()
    usage = str(row.get("usage", "")).strip()
    season = str(row.get("season", "")).strip()

    attr_part = " ".join(x for x in [gender, colour, article] if x and x != "nan")
    meta_part = ", ".join(x for x in [sub_cat, master_cat, usage, season] if x and x != "nan")
    return f"{title} - {attr_part} ({meta_part})".strip()


def build_student_query(row: dict) -> str:
    title = str(row.get("productDisplayName", "")).strip()
    colour = str(row.get("baseColour", "")).strip()
    article = str(row.get("articleType", "")).strip()
    return f"{title} {colour} {article}".strip()


def prepare_10k_kd_dataset():
    os.makedirs(TUNING_DATA_DIR, exist_ok=True)

    with open(TEST_JSON_PATH, "r", encoding="utf-8") as f:
        test_items = json.load(f)
    test_ids = {int(it["id"]) for it in test_items}

    df_styles = pd.read_csv(STYLES_CSV, on_bad_lines="skip")
    df_images = pd.read_csv(IMAGES_CSV, on_bad_lines="skip")
    df_images["id"] = df_images["filename"].str.replace(".jpg", "", regex=False).astype(int, errors="ignore")

    df = pd.merge(df_styles, df_images, on="id", how="inner")
    df = df.dropna(subset=["productDisplayName", "link", "masterCategory", "articleType", "baseColour"])
    df = df[df["masterCategory"].isin(list(RATIOS.keys()))]
    df = df[~df["id"].isin(test_ids)]

    train_dfs, val_dfs = [], []
    for cat, ratio in RATIOS.items():
        n_train = int(TRAIN_SIZE * ratio)
        n_val = int(VAL_SIZE * ratio)
        cat_df = df[df["masterCategory"] == cat].sample(n=n_train + n_val, random_state=42)
        train_dfs.append(cat_df.iloc[:n_train])
        val_dfs.append(cat_df.iloc[n_train : n_train + n_val])

    train_df = pd.concat(train_dfs).sample(frac=1.0, random_state=101).reset_index(drop=True)
    val_df = pd.concat(val_dfs).sample(frac=1.0, random_state=202).reset_index(drop=True)

    train_ids = set(train_df["id"].astype(int))
    val_ids = set(val_df["id"].astype(int))
    assert len(train_ids & val_ids) == 0
    assert len(train_ids & test_ids) == 0
    assert len(val_ids & test_ids) == 0

    for split_df in (train_df, val_df):
        split_df["teacher_caption"] = split_df.apply(lambda r: build_teacher_caption(r.to_dict()), axis=1)
        split_df["student_query"] = split_df.apply(lambda r: build_student_query(r.to_dict()), axis=1)

    train_records = train_df.to_dict(orient="records")
    val_records = val_df.to_dict(orient="records")

    with open(TRAIN_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(train_records, f, ensure_ascii=False, indent=2)

    with open(VAL_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(val_records, f, ensure_ascii=False, indent=2)

    summary = {
        "total_samples": len(train_records) + len(val_records) + len(test_items),
        "splits": {
            "train": {
                "total": len(train_records),
                "by_category": train_df["masterCategory"].value_counts().to_dict(),
            },
            "validation": {
                "total": len(val_records),
                "by_category": val_df["masterCategory"].value_counts().to_dict(),
            },
            "test": {
                "total": len(test_items),
                "by_category": pd.DataFrame(test_items)["masterCategory"].value_counts().to_dict(),
            },
        },
        "zero_data_leakage_verified": True,
    }

    with open(SPLIT_SUMMARY_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"Đã tạo dữ liệu Train ({len(train_records)}), Val ({len(val_records)}), Test ({len(test_items)})")


if __name__ == "__main__":
    prepare_10k_kd_dataset()
