
// Global Variables

var DEFAULT_DATA = {"lakes": [
  {"name": "Airplane", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/airplane", "elevation": 5305.0, "county": "Chelan", "lat": 48.002594, "lon": -121.006674, "acres": "9.40"}, {"name": "Arrowhead", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/arrowhead", "elevation": 4411.0, "county": "Skagit", "lat": 48.432548, "lon": -121.290053, "acres": "10.50"}, {"name": "Bagley - Upper", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bagley-upper", "elevation": 4172.0, "county": "Whatcom", "lat": 48.860064, "lon": -121.684465, "acres": "3.80"}, {"name": "Baker (Thetis)", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/baker-thetis", "elevation": 4434.0, "county": "Kittitas", "lat": 47.351427, "lon": -121.301709, "acres": "4.70"}, {"name": "Bannock - Middle", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bannock-middle", "elevation": 5929.0, "county": "Chelan", "lat": 48.260666, "lon": -120.972715, "acres": "6.90"}, {"name": "Bannock - Upper", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bannock-upper", "elevation": 5934.0, "county": "Chelan", "lat": 48.257043, "lon": -120.968671, "acres": "11.80"}, {"name": "Bath Pot 1", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bath-pot-1", "elevation": 5634.0, "county": "Snohomish", "lat": 48.248745, "lon": -121.079558, "acres": "0.90"}, {"name": "Battalion", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/battalion", "elevation": 5350.0, "county": "Chelan", "lat": 48.345756, "lon": -120.787952, "acres": "6.40"}, {"name": "Bear", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bear", "elevation": 2780.0, "county": "Snohomish", "lat": 48.058358, "lon": -121.742891, "acres": "18.90"}, {"name": "Bearpaw Mtn", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bearpaw-mtn", "elevation": 4425.0, "county": "Whatcom", "lat": 48.951348, "lon": -121.841096, "acres": "5.90"}, {"name": "Bench", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bench", "elevation": 4185.0, "county": "King", "lat": 47.656379, "lon": -121.501307, "acres": "2.90"}, {"name": "Berdeen", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/berdeen", "elevation": 5018.0, "county": "Whatcom", "lat": 48.71593, "lon": -121.464573, "acres": "125.60"}, {"name": "Berdeen - Lower", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/berdeen-lower", "elevation": 4473.0, "county": "Whatcom", "lat": 48.706932, "lon": -121.477572, "acres": "7.30"}, {"name": "Berdeen - Upper", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/berdeen-upper", "elevation": 5067.0, "county": "Whatcom", "lat": 48.725722, "lon": -121.470262, "acres": "9.20"}
]}

var data = null;

var mymap = L.map('mapid').setView([47.596, -120.661], 7);L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiZmllbGRjYWR5IiwiYSI6ImNqd3Rmb2d3bjBkMDA0OW5yamYxNnRwdGwifQ.kBilx8iMkTn8RUyrO7ZHGA'
}).addTo(mymap);

var markers = [];

// Functions

var downloadDataAndRender = function() {
    var xhr = new XMLHttpRequest();
    url = "data.json";
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      data=xhr.response;
      renderData(data);
    };
    xhr.send();
};

var renderData = function(dat) {
  showTimestamp(dat["timestamp"]);
  populateMap(dat["lakes"]);
}

var lake2marker_html = function(lk) {
  clickable_name = '<a target="_blank" href="'+lk['url']+'">'+lk['name']+'</a>'
  elevation = '<p>Elevation: '+String(Math.round(lk['elevation']))+'ft'
  county = '<p>County: '+lk['county']+'</p>'
  size = '<p>Size: '+String(lk['acres'])+' Acres</p>'
  return clickable_name+elevation+county+size;
}

var populateMarkers = function(lakes) {
  for (i=0; i<lakes.length; i++) {
    lk = lakes[i];
    m = L.marker([lk['lat'], lk['lon']]).bindPopup(lake2marker_html(lk));
    m.lake = lk;
    markers.push(m)
  };
}

var populateMap = function(lakes) {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mymap);
  populateMarkers(lakes);
  for (i=0; i<lakes.length; i++) {
    m = markers[i];
    m.addTo(mymap).openPopup().closePopup();
  };
}

var getFilterFunction = function() {
  // Type
  var type_filter_value = document.getElementById('type_filter').value
  if (type_filter_value=='any') {
    type_filter = function(lk){return true}
  } else if (type_filter_value=='overabundant') {
    type_filter = function(lk){return lk['overabundant']}
  } else if (type_filter_value=='starting') {
    type_filter = function(el){return lk['starting']}
  }
  // Elevation
  var elevation_filter_value = document.getElementById('elevation_filter').value
  if (elevation_filter_value=='any') {
    elevation_filter = function(el){return true}
  } else if (elevation_filter_value=='<4000') {
    elevation_filter = function(el){return el<4000}
  } else if (elevation_filter_value=='4000-5000') {
    elevation_filter = function(el){return (4000<=el & el<=5000)}
  } else if (elevation_filter_value=='5000-6000') {
    elevation_filter = function(el){return (5000<=el & el<=6000)}
  } else if (elevation_filter_value=='>6000') {
    elevation_filter = function(el){return el>6000}
  }
  // Size
  var size_filter_value = document.getElementById('size_filter').value
  if (size_filter_value=='any') {
    size_filter = function(el){return true}
  } else if (size_filter_value=='<5') {
    size_filter = function(el){return el<5}
  } else if (size_filter_value=='5-10') {
    size_filter = function(el){return (5<=el & el<=10)}
  } else if (size_filter_value=='>10') {
    size_filter = function(el){return 10<el}
  }
  // County
  var county_filter_value = document.getElementById('county_filter').value
  if (county_filter_value=='any') {
    county_filter = function(cty){return true}
  } else {
    county_filter = function(cty){return cty==county_filter_value}
  }
  //
  return function(lk) {
    return elevation_filter(lk.elevation) & size_filter(lk.acres) & county_filter(lk.county) & type_filter(lk)
  }
}

var updateMarkers = function() {
  for (i=0; i<markers.length; i++) {
    m = markers[i];
    lk = m.lake;
    filter_func = getFilterFunction()
    if (filter_func(lk)) {
      m.addTo(mymap);
    } else {
      m.removeFrom(mymap);
    }
  };
}

var showTimestamp = function(timestamp) {
  timestamp_div = document.getElementById("last_update_timestamp");
  var content = document.createTextNode(timestamp);
  timestamp_div.appendChild(content);
}

if (location.origin === "file://") {
    renderData(DEFAULT_DATA);
  } else {
    downloadDataAndRender()
}
