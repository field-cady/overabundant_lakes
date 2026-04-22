import xml.etree.ElementTree as ET
import json
import glob
import re
from datetime import datetime

def parse_kml_to_json():
    all_lakes = []
    # The namespace for KML
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    kml_files = glob.glob('data/oregon_kmls/*.kml')
    
    for kml_file in kml_files:
        try:
            tree = ET.parse(kml_file)
            root = tree.getroot()
            
            for placemark in root.findall('.//kml:Placemark', ns):
                lake_data = {}
                
                name_elem = placemark.find('kml:name', ns)
                if name_elem is not None and name_elem.text:
                    lake_data['name'] = name_elem.text.strip()
                    
                # Description might contain more info, but for now we just get what we can
                desc_elem = placemark.find('kml:description', ns)
                if desc_elem is not None and desc_elem.text:
                    desc_text = desc_elem.text.strip()
                    lake_data['description'] = desc_text
                    
                    # Extract species
                    match = re.search(r'Fish species:?\s*([^\<]+)', desc_text, re.IGNORECASE)
                    if match:
                        species_str = match.group(1).strip()
                        species_list = [s.strip().title() for s in re.split(r',| and ', species_str) if s.strip()]
                        if species_list:
                            lake_data['species'] = species_list
                            
                    # Extract acreage
                    area_match_1 = re.search(r'Size, acres:\s*([\d\.]+)', desc_text, re.IGNORECASE)
                    area_match_2 = re.search(r'([\d\,\.]+)-acre', desc_text, re.IGNORECASE)
                    area_match_3 = re.search(r'([\d\,\.]+) acres in size', desc_text, re.IGNORECASE)
                    
                    if area_match_1:
                        lake_data['area'] = area_match_1.group(1).replace(',', '')
                    elif area_match_2:
                        lake_data['area'] = area_match_2.group(1).replace(',', '')
                    elif area_match_3:
                        lake_data['area'] = area_match_3.group(1).replace(',', '')
                        
                    # Extract elevation
                    elev_match_1 = re.search(r'Elevation \(ft\):\s*([\d\,\.]+)', desc_text, re.IGNORECASE)
                    elev_match_2 = re.search(r'elevation of ([\d\,\.]+)\s*(?:ft|feet)', desc_text, re.IGNORECASE)
                    elev_match_3 = re.search(r'elevation is ([\d\,\.]+)\s*(?:ft|feet)', desc_text, re.IGNORECASE)
                    
                    if elev_match_1:
                        lake_data['elevation'] = float(elev_match_1.group(1).replace(',', ''))
                    elif elev_match_2:
                        lake_data['elevation'] = float(elev_match_2.group(1).replace(',', ''))
                    elif elev_match_3:
                        lake_data['elevation'] = float(elev_match_3.group(1).replace(',', ''))
                
                point_elem = placemark.find('.//kml:Point', ns)
                if point_elem is not None:
                    coords_elem = point_elem.find('kml:coordinates', ns)
                    if coords_elem is not None and coords_elem.text:
                        # coordinates are usually "lon,lat,alt"
                        coords = coords_elem.text.strip().split(',')
                        if len(coords) >= 2:
                            lake_data['lon'] = float(coords[0])
                            lake_data['lat'] = float(coords[1])
                            
                if lake_data.get('name'):
                    lake_data['state'] = 'Oregon'
                    all_lakes.append(lake_data)
                    
        except Exception as e:
            print(f"Error parsing {kml_file}: {e}")
            
    # Also add the lakes explicitly mentioned in the text
    explicit_lakes = [
        {"name": "Hawk Lake", "state": "Oregon", "description": "Wallowa Mountains"},
        {"name": "Veda Lake", "state": "Oregon", "description": "Mt. Hood"},
        {"name": "Lake Legore", "state": "Oregon", "description": "Eagle Cap Wilderness - Oregon's highest lake"}
    ]
    
    # Avoid duplicates by name (if explicit ones aren't in KML)
    existing_names = {lake['name'] for lake in all_lakes}
    for el in explicit_lakes:
        if el['name'] not in existing_names:
            all_lakes.append(el)
            
    # Sort alphabetically by name
    all_lakes = sorted(all_lakes, key=lambda x: x['name'])
    
    with open('data/oregon_lakes.jsonl', 'w', encoding='utf-8') as f:
        for lake in all_lakes:
            f.write(json.dumps(lake) + '\n')
        
    print(f"Successfully extracted {len(all_lakes)} lakes to data/oregon_lakes.jsonl")

if __name__ == '__main__':
    parse_kml_to_json()