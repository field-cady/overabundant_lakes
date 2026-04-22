import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import re

def scrape_oregon_lakes():
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
    
    all_lakes = set()
    for map_id in map_ids:
        kml_url = f"https://www.google.com/maps/d/kml?mid={map_id}&forcekml=1"
        try:
            r = requests.get(kml_url)
            # Parse KML
            root = ET.fromstring(r.content)
            # The namespace for KML
            ns = {'kml': 'http://www.opengis.net/kml/2.2'}
            
            for placemark in root.findall('.//kml:Placemark', ns):
                name_elem = placemark.find('kml:name', ns)
                if name_elem is not None and name_elem.text:
                    name = name_elem.text.strip()
                    all_lakes.add(name)
        except Exception as e:
            print(f"Error fetching/parsing map {map_id}: {e}")
            
    # Also get the ones explicitly mentioned in text
    # (Hawk Lake, Veda Lake, Lake Legore)
    all_lakes.add("Hawk Lake")
    all_lakes.add("Veda Lake")
    all_lakes.add("Lake Legore")
    
    sorted_lakes = sorted(list(all_lakes))
    for lake in sorted_lakes:
        print(lake)
    
    print(f"\nTotal lakes found: {len(sorted_lakes)}")
    
if __name__ == '__main__':
    scrape_oregon_lakes()