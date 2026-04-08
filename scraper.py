import requests, json, simplekml
from bs4 import BeautifulSoup
from datetime import datetime
import time

def parse_table_from_page(txt):
    soup = BeautifulSoup(txt, features="lxml")
    tabulka = soup.find("table")
    if not tabulka: return []
    rows = []
    fields = ['name', 'area', 'elevation', 'county', 'location']
    tbody = tabulka.find('tbody')
    if not tbody: return []
    for row in tbody.findAll('tr'):
        col = row.findAll('td')
        if len(col) != 5: continue
        r = dict(zip(fields, col))
        rows.append(r)
    return rows

def html_to_record(r):
    try:
      name = r["name"].find("a").string.strip()
      url = "https://wdfw.wa.gov" + r["name"].find("a").get("href")
      elevation = r["elevation"].string.strip().replace(',', '').split()[0]
      county = r["county"].string.strip()
      area = r["area"].string.strip().split()[0] + " Acres"
      latlon = [x.string.strip() for x in r["location"].findAll("span")]
      return dict(name=name, url=url, elevation=float(elevation), county=county, lat=float(latlon[0]), lon=float(latlon[1]), area=area)
    except Exception as e:
      return None

starting_url_base = 'https://wdfw.wa.gov/fishing/locations/high-lakes/getting-started?name=&county=All&species=&order=title&sort=asc&page='
overabundant_url_base = 'https://wdfw.wa.gov/fishing/locations/high-lakes/overabundant?name=&county=All&species=&order=title&sort=asc&page='
all_url_base = 'https://wdfw.wa.gov/fishing/locations/high-lakes?name=&county=All&species=&order=title&sort=asc&page='

def get_lakes_from_all_pages(url_base):
    i = 0
    all_records = []
    while True:
        url = url_base + str(i)
        r = requests.get(url)
        txt = r.text
        rows = parse_table_from_page(txt)
        records = [html_to_record(rw) for rw in rows if rw]
        records = [r for r in records if r]
        if len(records) == 0: break
        all_records.extend(records)
        i += 1
        time.sleep(0.5) # Be nice to the server
    return all_records

def get_data():
    print("Fetching All Lakes...")
    all_lakes = get_lakes_from_all_pages(all_url_base)
    all_lakes = [lk for lk in all_lakes if lk['elevation']>2500.0]
    
    print("Fetching Overabundant Lakes...")
    overabundant_lakes = get_lakes_from_all_pages(overabundant_url_base)
    
    print("Fetching Starting Lakes...")
    starting_lakes = get_lakes_from_all_pages(starting_url_base)
    
    overabundant_urls = set(lk['url'] for lk in overabundant_lakes)
    starting_urls = set(lk['url'] for lk in starting_lakes)
    for lk in all_lakes:
        lk['starting'] = lk['url'] in starting_urls
        lk['overabundant'] = lk['url'] in overabundant_urls
        
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    return dict(
        lakes=all_lakes,
        overabundant_lakes=[lk for lk in all_lakes if lk['overabundant']],
        starting_lakes=[lk for lk in all_lakes if lk['starting']],
        normal_lakes=[lk for lk in all_lakes if not lk['starting'] and not lk['overabundant']],
        timestamp=timestamp
    )

def lake2marker_html(lk):
  link = '<a target=\"_blank\" href=\"'+lk['url']+'\">WDFW Page</a>'
  elevation = '<p>Elevation: '+str(round(lk['elevation']))+'ft' + '</p>'
  county = '<p>County: '+lk['county']+'</p>'
  size = '<p>Size: '+str(lk['area'])+'</p>'
  return elevation + county + size + link

def get_kml(lakes):
  kml = simplekml.Kml()
  kml.parsetext(parse=False)
  for lk in lakes:
    desc = lake2marker_html(lk)
    coords = [(lk['lon'],lk['lat'])]
    pnt = kml.newpoint(name=lk['name'].replace('&', ' and '), coords=coords, description=desc)
  return kml

if __name__ == '__main__':
    data = get_data()
    print(f"Done scraping. Total high lakes: {len(data['lakes'])}")
    
    output = json.dumps(dict(lakes=data['lakes'], timestamp=data['timestamp']))
    open('data.json', 'w').write(output)
    
    open('data/starting_lakes.json', 'w').write(json.dumps(
        dict(lakes=data['starting_lakes'], timestamp=data['timestamp'])
    ))
    open('data/overabundant_lakes.json', 'w').write(json.dumps(
        dict(lakes=data['overabundant_lakes'], timestamp=data['timestamp'])
    ))
    open('data/normal_lakes.json', 'w').write(json.dumps(
        dict(lakes=data['normal_lakes'], timestamp=data['timestamp'])
    ))
    
    # Store KML
    starting_kml = get_kml(data['starting_lakes'])
    starting_kml.save("data/starting_lakes.kml")
    overabundant_kml = get_kml(data['overabundant_lakes'])
    overabundant_kml.save("data/overabundant_lakes.kml")
    all_kml = get_kml(data['lakes'])
    all_kml.save("data/all_lakes.kml")
    
    print("Data saved successfully.")
