import requests
from bs4 import BeautifulSoup
import re
import os

def download_oregon_kmls():
    url = 'https://myodfw.com/articles/stocking-oregons-hike-lakes'
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find all Google Maps links
    map_links = []
    for a in soup.find_all('a', href=True):
        if 'google.com/maps/d/viewer' in a['href'] or 'google.com/maps/d/u/' in a['href']:
            map_links.append(a['href'])
            
    # Extract map IDs
    map_ids = []
    for link in map_links:
        match = re.search(r'mid=([^&]+)', link)
        if match:
            map_ids.append(match.group(1))
            
    # Remove duplicates
    map_ids = list(set(map_ids))
    
    os.makedirs('data/oregon_kmls', exist_ok=True)
    
    print(f"Found {len(map_ids)} map regions. Downloading KMLs...")
    
    for i, map_id in enumerate(map_ids, 1):
        kml_url = f"https://www.google.com/maps/d/kml?mid={map_id}&forcekml=1"
        try:
            r = requests.get(kml_url)
            filename = f"data/oregon_kmls/region_{i}_{map_id}.kml"
            with open(filename, 'wb') as f:
                f.write(r.content)
            print(f"Saved {filename}")
        except Exception as e:
            print(f"Error downloading map {map_id}: {e}")

if __name__ == '__main__':
    download_oregon_kmls()