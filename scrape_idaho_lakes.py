import requests
import json
from bs4 import BeautifulSoup
import concurrent.futures
from datetime import datetime

def parse_species(html):
    soup = BeautifulSoup(html, 'html.parser')
    species = set()
    
    # Headers that might precede a species list
    keywords = ['game fish', 'species observed', 'fish present']
    for h in soup.find_all(['h2', 'h3', 'h4']):
        text = h.text.lower()
        if any(kw in text for kw in keywords):
            ul = h.find_next_sibling('ul')
            if ul:
                for li in ul.find_all('li'):
                    # The text often has scientific names e.g., "Brown Trout (Salmo trutta)"
                    # Let's extract the main common name
                    li_text = li.text.strip()
                    if '(' in li_text:
                        li_text = li_text.split('(')[0].strip()
                    # or "Brown Trout Salmo trutta observed in 2021"
                    if ' observed in ' in li_text:
                        # strip scientific name if possible, simple heuristic:
                        parts = li_text.split(' observed in ')
                        name_part = parts[0]
                        # Assume the first 1-2 words are the common name (e.g., Rainbow Trout)
                        words = name_part.split()
                        if len(words) >= 4:
                            name_part = " ".join(words[:2]) # Rough fallback
                        li_text = name_part
                        
                    species.add(li_text)
    return list(species)

def fetch_details(lake):
    try:
        url = f"https://idfg.idaho.gov/ifwis/fishingplanner/water/{lake['id']}"
        r = requests.get(url, timeout=10)
        species = parse_species(r.text)
        
        # Calculate lat/lon from ID
        # ID is always 13 chars: 7 for lon, 6 for lat
        id_str = str(lake['id'])
        if len(id_str) == 13:
            lon = -(float(id_str[:7]) / 10000.0)
            lat = float(id_str[7:]) / 10000.0
            lake['lon'] = lon
            lake['lat'] = lat
            
        lake['species'] = species
        lake['state'] = 'Idaho'
        return lake
    except Exception as e:
        print(f"Error fetching {lake['name']}: {e}")
        return lake

def scrape_idaho_lakes():
    print("Fetching master list of waters...")
    url = "https://idfg.idaho.gov/ifwis/fishingplanner/api/2.0/list/"
    r = requests.get(url, params={'limit': 15000})
    data = r.json().get('rows', [])
    
    lakes = [d for d in data if d.get('layer') == 0]
    print(f"Found {len(lakes)} lakes. Fetching species details...")
    
    completed_lakes = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_details, lake): lake for lake in lakes}
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            completed_lakes.append(future.result())
            if i % 100 == 0:
                print(f"Processed {i}/{len(lakes)} lakes...")

    # Write to jsonl
    with open('data/idaho_lakes.jsonl', 'w', encoding='utf-8') as f:
        for lake in completed_lakes:
            f.write(json.dumps(lake) + '\n')
            
    print(f"Done. Saved {len(completed_lakes)} lakes to data/idaho_lakes.jsonl")

if __name__ == '__main__':
    scrape_idaho_lakes()