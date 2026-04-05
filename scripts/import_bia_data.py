#!/usr/bin/env python3
"""
Import BIA ICWA Agents CSV into Supabase.
Usage: python3 scripts/import_bia_data.py

Downloads fresh CSV from BIA open data, upserts all records into icwa_agents table.
Run quarterly to refresh data.
"""

import csv
import json
import urllib.request
import os
import sys

# Config
BIA_CSV_URL = "https://opendata.arcgis.com/datasets/f5c986d0894447d587eea026d51c11de_0.csv"
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://vriblsadupgnzwrtmlud.supabase.co")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SERVICE_ROLE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
    sys.exit(1)

def download_csv():
    print("Downloading BIA ICWA agents CSV...")
    req = urllib.request.Request(BIA_CSV_URL, headers={"User-Agent": "icwaexpert.com/1.0"})
    with urllib.request.urlopen(req) as response:
        content = response.read().decode("utf-8-sig")
    print(f"Downloaded {len(content)} bytes")
    return content

def parse_csv(content):
    rows = []
    reader = csv.DictReader(content.splitlines())
    for row in reader:
        rows.append({
            "name": row.get("Name", "").strip(),
            "primary_region": row.get("Primary_Region", "").strip() or None,
            "icwa_designated_agent": row.get("ICWA_Designated_Agent", "").strip() or None,
            "icwa_contact_title": row.get("ICWA_Contact_Title", "").strip() or None,
            "icwa_phone_1": row.get("ICWA_Phone_1", "").strip() or None,
            "icwa_phone_2": row.get("ICWA_Phone_2", "").strip() or None,
            "icwa_fax": row.get("ICWA_Fax", "").strip() or None,
            "icwa_email_1": row.get("ICWA_Email_1", "").strip() or None,
            "icwa_email_2": row.get("ICWA_Email_2", "").strip() or None,
            "icwa_street_1": row.get("ICWA_Street_1", "").strip() or None,
            "icwa_street_2": row.get("ICWA_Street_2", "").strip() or None,
            "icwa_city": row.get("ICWA_City", "").strip() or None,
            "icwa_state": row.get("ICWA_State", "").strip() or None,
            "icwa_zip_code": row.get("ICWA_Zip_Code", "").strip() or None,
            "state_full": row.get("State_Full", "").strip() or None,
            "tribe_affiliations": row.get("Tribe_Affiliations", "").strip() or None,
            "bia_objectid": int(row["OBJECTID"]) if row.get("OBJECTID") else None,
        })
    print(f"Parsed {len(rows)} records")
    return rows

def upsert_batch(rows, batch_size=100):
    headers = {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Prefer": "resolution=merge-duplicates",
    }
    url = f"{SUPABASE_URL}/rest/v1/icwa_agents?on_conflict=bia_objectid"

    total = len(rows)
    inserted = 0
    for i in range(0, total, batch_size):
        batch = rows[i:i + batch_size]
        data = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                resp.read()
            inserted += len(batch)
            print(f"  Upserted {inserted}/{total}...")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  ERROR on batch {i}: {e.code} {body}")
            sys.exit(1)

    print(f"Done. {inserted} records upserted.")

if __name__ == "__main__":
    content = download_csv()
    rows = parse_csv(content)
    upsert_batch(rows)
