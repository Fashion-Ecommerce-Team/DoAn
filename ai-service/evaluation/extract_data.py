import argparse
import os
import sys
import zipfile

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_TARGET_DIR = os.path.join(SCRIPT_DIR, "data")


def extract_dataset(zip_path: str, target_dir: str = DEFAULT_TARGET_DIR):
    if not os.path.exists(zip_path):
        raise FileNotFoundError(f"Không tìm thấy file zip: {zip_path}")

    os.makedirs(target_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(target_dir)

    print(f"Đã giải nén dữ liệu vào: {target_dir}")
    for fname in os.listdir(target_dir):
        full_path = os.path.join(target_dir, fname)
        if os.path.isfile(full_path):
            size_mb = os.path.getsize(full_path) / (1024 * 1024)
            print(f" - {fname}: {size_mb:.2f} MB")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Giải nén dataset đánh giá Fashion-CLIP")
    parser.add_argument("--zip", dest="zip_path", default="data.zip", help="Đường dẫn tới file zip dữ liệu")
    parser.add_argument("--out", dest="target_dir", default=DEFAULT_TARGET_DIR, help="Thư mục giải nén")
    args = parser.parse_args()
    extract_dataset(args.zip_path, args.target_dir)
