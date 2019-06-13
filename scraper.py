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
    latlon = [x.string for x in r['location'].findAll('span')]
    return dict(name=name, url=url, elevation=float(elevation), county=county, lat=float(latlon[0]), lon=float(latlon[1]))

def get_lakes_from_all_pages():
    # Scrape all pages
    url_base = 'https://wdfw.wa.gov/fishing/locations/high-lakes/overabundant?name=&county=All&order=title&sort=asc&page='
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
    lakes = get_lakes_from_all_pages()
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    return dict(lakes=lakes, timestamp=timestamp)

if __name__ == '__main__':
    data = get_data()
    output = json.dumps(data)
    open('data.json', 'w').write(output)
