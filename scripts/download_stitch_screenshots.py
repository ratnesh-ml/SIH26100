import json
import os
import subprocess

manifest_path = r"c:\Users\ritik\Downloads\SIH26100\stitch_screens\manifest.json"
screenshots_dir = r"c:\Users\ritik\Downloads\SIH26100\docs\demo\screenshots"

os.makedirs(screenshots_dir, exist_ok=True)

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

screens_by_num = {}
for s in manifest:
    title = s.get('title', '')
    url = s.get('screenshot_url', '')
    if 'Screen 01' in title:
        screens_by_num['01'] = url
    elif 'Screen 02' in title:
        screens_by_num['02'] = url
    elif 'Screen 03' in title:
        screens_by_num['03'] = url
    elif 'Screen 04' in title:
        screens_by_num['04'] = url
    elif 'Screen 05' in title:
        screens_by_num['05'] = url
    elif 'Screen 06' in title:
        screens_by_num['06'] = url
    elif 'Screen 07' in title:
        screens_by_num['07'] = url
    elif 'Screen 08' in title:
        screens_by_num['08'] = url
    elif 'Screen 09' in title:
        screens_by_num['09'] = url

target_mapping = {
    '01-dashboard.png': screens_by_num.get('01'),
    '02-tender.png': screens_by_num.get('02'),
    '03-upload.png': screens_by_num.get('04'),
    '04-processing.png': screens_by_num.get('05'),
    '05-compliance-matrix.png': screens_by_num.get('03'),
    '06-bidder-cockpit.png': screens_by_num.get('06'),
    '07-evidence.png': screens_by_num.get('06'),
    '08-risk.png': screens_by_num.get('09'),
    '09-graph.png': screens_by_num.get('07'),
    '10-audit.png': screens_by_num.get('08'),
    '11-report.png': screens_by_num.get('08'),
    '12-demo-walkthrough.png': screens_by_num.get('01'),
    # Also support alternate README naming
    '02-bidder-cockpit.png': screens_by_num.get('06'),
    '03-evidence-inspector.png': screens_by_num.get('06'),
    '04-risk-explanation.png': screens_by_num.get('09'),
    '05-audit-ledger.png': screens_by_num.get('08'),
}

for fname, url in target_mapping.items():
    if not url:
        print(f"Skipping {fname} - no URL", flush=True)
        continue
    dest = os.path.join(screenshots_dir, fname)
    full_res_url = url + '=s0' if not url.endswith('=s0') else url
    res = subprocess.run(['curl.exe', '-s', '-L', '-o', dest, full_res_url])
    if res.returncode == 0 and os.path.exists(dest) and os.path.getsize(dest) > 1000:
        print(f"  Downloaded {fname} successfully ({os.path.getsize(dest)} bytes)", flush=True)
    else:
        print(f"  Error downloading {fname}", flush=True)

# Also remove test.png if it exists
test_file = os.path.join(screenshots_dir, 'test.png')
if os.path.exists(test_file):
    os.remove(test_file)

print("All screenshots downloaded and ready!", flush=True)
