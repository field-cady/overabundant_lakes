import requests
import json

def fetch_high_mountain_lake_ids():
    url = "https://idfg.idaho.gov/ifwis/fishingplanner/api/2.0/list/"
    r = requests.get(url, params={'body': '3', 'limit': 15000})
    data = r.json().get('rows', [])
    ids = [d['id'] for d in data if 'id' in d]
    
    with open('data/idaho_high_mountain_ids.json', 'w') as f:
        json.dump(ids, f)
        
    print(f"Saved {len(ids)} High Mountain Lake IDs.")

if __name__ == '__main__':
    fetch_high_mountain_lake_ids()