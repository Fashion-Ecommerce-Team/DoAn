import zipfile
import os
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

zip_path = r"C:\Users\msi\.gemini\antigravity\brain\0f2ace13-f22f-44cb-82c1-41b56a759e7b\.user_uploaded\media_1793674789575_085865e0.zip"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
target_dir = os.path.join(SCRIPT_DIR, "data")

os.makedirs(target_dir, exist_ok=True)

print(f"Extracting data.zip to: {target_dir}...")
with zipfile.ZipFile(zip_path, 'r') as z:
    z.extractall(target_dir)

files = os.listdir(target_dir)
print("Extraction complete! Extracted files:")
for f in files:
    full_path = os.path.join(target_dir, f)
    if os.path.isfile(full_path):
        size_mb = os.path.getsize(full_path) / (1024 * 1024)
        print(f" - {f}: {size_mb:.2f} MB")

