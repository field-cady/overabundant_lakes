import requests, json
from bs4 import BeautifulSoup
from datetime import datetime

def parse_table_from_page(txt):
    # Return list of table entries on the page
    soup = BeautifulSoup(txt)
    tabulka = soup.find("table", {"class" : "tablesaw-stack"})
    rows = []
    fields = ['name', 'acres', 'elevation', 'county', 'location']
    for row in tabulka.findAll('tr'):
        col = row.findAll('td')
        parts = [c for c in col]
        r = dict(zip(fields, parts))
        rows.append(r)
    return rows

def html_to_record(r):
    # Turn HTML object for table row into a dict
    name = next(r['name'].children).string
    url = 'https://wdfw.wa.gov' + r['name'].findNext('a').get('href')
    elevation = next(r['elevation'].children).string.split()[0]
    county = next(r['county'].children).string.strip()
    acres = next(r['acres'].children).string.strip().split()[0]
    latlon = [x.string for x in r['location'].findAll('span')]
    return dict(name=name, url=url, elevation=float(elevation), county=county, lat=float(latlon[0]), lon=float(latlon[1]), acres=acres)

starting_url_base = 'https://wdfw.wa.gov/fishing/locations/high-lakes/getting-started?name=&county=All&order=title&sort=asc&page='

overabundant_url_base = 'https://wdfw.wa.gov/fishing/locations/high-lakes/overabundant?name=&county=All&order=title&sort=asc&page='

all_url_base = 'https://wdfw.wa.gov/fishing/locations/high-lakes?name=&county=All&order=title&sort=asc&page='

def get_lakes_from_all_pages(url_base):
    # Scrape all pages
    i = 0
    all_records = []
    while True:
        url = url_base + str(i)
        r = requests.get(url)
        txt = r.text
        try: rows = parse_table_from_page(txt)
        except: break
        records = [html_to_record(rw) for rw in rows if rw]
        if len(records)==0: break
        all_records.extend(records)
        i += 1
    return all_records

def get_data():
    all_lakes = get_lakes_from_all_pages(all_url_base)
    all_lakes = [lk for lk in all_lakes if lk['elevation']>2500.0]
    overabundant_lakes = get_lakes_from_all_pages(overabundant_url_base)
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
        normal_lakes=[lk for lk in all_lakes if not lk['overabundant'] and not lk['overabundant']],
        timestamp=timestamp
    )

'''


def lake2marker_html(lk):
  link = '<a target=\"_blank\" href=\"'+lk['url']+'\">WDFW Page</a>'
  elevation = '<p>Elevation: '+str(round(lk['elevation']))+'ft' + '</p>'
  county = '<p>County: '+lk['county']+'</p>'
  size = '<p>Size: '+str(lk['acres'])+' Acres</p>'
  return elevation + county + size + link
  #return '<a href=\"http://www.cnn.com\">foo</a>'

def get_kml(lakes):
  kml = simplekml.Kml()
  kml.parsetext(parse=False)
  for lk in lakes:
    desc = lake2marker_html(lk)
    coords = [(lk['lon'],lk['lat'])]
    pnt = kml.newpoint(name=lk['name'], coords=coords, description=desc)
  return kml

starting_kml = get_kml(starting_lakes)
starting_kml.save("starting_lakes.kml")

overabundant_kml = get_kml(overabundant_lakes)
overabundant_kml.save("overabundant_lakes.kml")

all_kml = get_kml(all_lakes)#[130:131])
all_kml.save("all_lakes.kml")



xs = starting_lakes

kml = simplekml.Kml()
kml.parsetext(parse=False)
pnt = kml.newpoint(name='A Point', description='<a href=\"http://www.cnn.com\">foo</a>')
kml.save("botanicalgarden.kml")





'''

if __name__ == '__main__':
    data = get_data()
    output = json.dumps(dict(lakes=data['lakes'], timestamp=data['timestamp']))#data)
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
