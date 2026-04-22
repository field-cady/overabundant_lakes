import json
import re
from datetime import datetime

def normalize_species(species_list):
    normalized = set()
    for s in species_list:
        # Lowercase for easier matching
        s = s.lower().strip()
        
        # Strip off anything after a period or open parenthesis
        s = s.split('.')[0]
        s = s.split('(')[0]
        s = s.strip()
        
        # Remove common prefixes/suffixes
        prefixes_to_remove = ['some ', 'stocked ', 'native ', 'the occasional ', 'surplus hatchery ']
        for p in prefixes_to_remove:
            if s.startswith(p):
                s = s[len(p):].strip()
                
        suffixes_to_remove = [' when available', ' m largemouth bass', ' largemouth bass', ' \xa0odfw']
        for suf in suffixes_to_remove:
            if s.endswith(suf):
                s = s[:-len(suf)].strip()

        if not s:
            continue
            
        # Map common variations to a standard name
        if s in ['rainbow', 'yellow trout', 'rainbow x']: s = 'rainbow trout'
        if s == 'brook': s = 'brook trout'
        if s in ['brown', 'brown trout.']: s = 'brown trout'
        if s in ['bullhead', 'bullhead ameiurus', 'bullhead catfish', 'brown bullhead catfish']: s = 'brown bullhead'
        if s == 'eastern brook': s = 'eastern brook trout'
        if 'steelhead' in s: s = 'steelhead'
        if s in ['coho', 'coho slamon']: s = 'coho salmon'
        if s in ['chinook', 'chinook slamon']: s = 'chinook salmon'
        if 'crappie pomoxis' in s: s = 'crappie'
        if 'cutbow' in s: s = 'cutthroat x rainbow trout'
        if s == 'cutthroat troutm': s = 'cutthroat trout'
        if 'bluegill lepomis' in s: s = 'bluegill'
        if 'pumpkinseed lepomis' in s or s == 'pumpkinseed sunfish': s = 'pumpkinseed'
        if 'burbot' in s: s = 'burbot'
        if 'goldfish' in s: s = 'goldfish'
        if 'kokanee oncorhynchus' in s: s = 'kokanee'
        if 'splake salvelinus' in s: s = 'splake'
        if 'tench tinca' in s: s = 'tench'
        if 'walleye stizostedion' in s: s = 'walleye'
        if 'warmouth lepomis' in s: s = 'warmouth'
        if 'cottus cottus' in s: s = 'sculpin'
        if 'catostomus sp' in s: s = 'sucker'
        if 'dace rhinichthys' in s: s = 'dace'
        if 'minnow cyprinus' in s: s = 'minnow'
        if 'prosopium sp' in s: s = 'whitefish'
        
        if 'bluegill / pumpkinseed / sunfish' in s:
            normalized.update(['Bluegill', 'Pumpkinseed', 'Sunfish'])
            continue
            
        # Ignore junk data
        junk = ['which provides picnic areas', 'except for w', 'are encouraged to release', 'other recreational amenities', 'restrooms on site', 'these lakes are considered', 'salmon and', 'hiking trails', 'to be caught', 'salamander', 'fry oncorhynchus']
        is_junk = False
        for j in junk:
            if j in s or 'http' in s:
                is_junk = True
                break
        
        if is_junk or len(s) < 3:
            continue
            
        normalized.add(s.title())
        
    return sorted(list(normalized))

def clean_description(desc):
    if not desc: return ""
    desc = re.sub(r'<img[^>]*>', '', desc, flags=re.IGNORECASE)
    
    lines = re.split(r'<br\s*/?>', desc, flags=re.IGNORECASE)
    clean_lines = []
    
    skip_prefixes = [
        'longitude', 'latitude', 'longitudedirection', 'latitudedirection',
        'stock interval', 'maximumdepth', 'maximum depth',
        'year stocked', 'elevation', 'acerage', 'size, acres', 'county',
        'species', 'fish species', 'stocking method', 'comments',
        'odfw recreation report', 'trout stocking schedule', 'stocking schedule'
    ]
    
    for line in lines:
        line = re.sub(r'<[^>]+>', '', line).strip()
        if not line: continue
        
        # Check if line matches a coordinate pattern like 43.60N 122.10W
        if re.match(r'^\d+\.\d+[NS]\s+\d+\.\d+[EW]$', line):
            continue
            
        is_skip = False
        for sp in skip_prefixes:
            if line.lower().startswith(sp):
                is_skip = True
                break
        if is_skip:
            continue
            
        clean_lines.append(line)
        
    return " ".join(clean_lines)

def merge_datasets():
    all_lakes = []
    
    # 1. Washington Lakes
    with open('data.json', 'r') as f:
        wa_data = json.load(f)
        for lake in wa_data.get('lakes', []):
            lake['state'] = 'Washington'
            lake['species'] = normalize_species(lake.get('species', []))
            all_lakes.append(lake)
            
    # 2. Oregon Lakes
    with open('data/oregon_lakes.jsonl', 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            lk = json.loads(line)
            lake = {
                'name': lk.get('name', 'Unknown'),
                'state': 'Oregon',
                'lat': lk.get('lat'),
                'lon': lk.get('lon'),
                'area': str(lk.get('area')) + " Acres" if lk.get('area') else "Unknown",
                'elevation': lk.get('elevation'),
                'description': clean_description(lk.get('description', '')),
                'species': normalize_species(lk.get('species', [])),
                'url': 'https://myodfw.com/articles/stocking-oregons-hike-lakes'
            }
            if lake['lat'] and lake['lon']:
                all_lakes.append(lake)
                
    # 3. Idaho Lakes
    with open('data/idaho_high_mountain_ids.json', 'r') as f:
        idaho_hml_ids = set(json.load(f))
        
    with open('data/idaho_lakes.jsonl', 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            lk = json.loads(line)
            
            if lk.get('id') not in idaho_hml_ids:
                continue
                
            area = lk.get('size')
            if area:
                area = str(area) + " Acres"
            else:
                area = "Unknown"
                
            lake = {
                'name': lk.get('name', 'Unknown'),
                'state': 'Idaho',
                'lat': lk.get('lat'),
                'lon': lk.get('lon'),
                'county': lk.get('loc', 'Unknown'),
                'area': area,
                'species': normalize_species(lk.get('species', [])),
                'url': f"https://idfg.idaho.gov/ifwis/fishingplanner/water/{lk.get('id')}"
            }
            if lake['lat'] and lake['lon']:
                all_lakes.append(lake)
                
    output = {
        'lakes': all_lakes,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    with open('data/all_states.json', 'w', encoding='utf-8') as f:
        json.dump(output, f)
        
    print(f"Merged {len(all_lakes)} total lakes.")

if __name__ == '__main__':
    merge_datasets()