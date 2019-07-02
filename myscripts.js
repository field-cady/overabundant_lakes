
// Global Variables

var DEFAULT_DATA = {"lakes": [
  {"overabundant":true, "starting":true, "name": "Airplane", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/airplane", "elevation": 5305.0, "county": "Chelan", "lat": 48.002594, "lon": -121.006674, "acres": "9.40"},
  {"overabundant":true, "starting":false, "name": "Arrowhead", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/arrowhead", "elevation": 4411.0, "county": "Skagit", "lat": 48.432548, "lon": -121.290053, "acres": "10.50"},
  {"overabundant":false, "starting":true, "name": "Bagley - Upper", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bagley-upper", "elevation": 4172.0, "county": "Whatcom", "lat": 48.860064, "lon": -121.684465, "acres": "3.80"},
  {"overabundant":false, "starting":false, "name": "Baker (Thetis)", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/baker-thetis", "elevation": 4434.0, "county": "Kittitas", "lat": 47.351427, "lon": -121.301709, "acres": "4.70"},
  {"overabundant":true, "starting":true, "name": "Bannock - Middle", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bannock-middle", "elevation": 5929.0, "county": "Chelan", "lat": 48.260666, "lon": -120.972715, "acres": "6.90"}
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

var iconMap = {
  violet: new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  red: new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  blue: new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  grey: new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
}

var getIconForLake = function(lk) {
  if (lk['starting'] & lk['overabundant']) {
    color='violet'
  } else if (lk['starting'] & (!lk['overabundant'])) {
    color='red'
  } else if ((!lk['starting']) & lk['overabundant']) {
    color='blue'
  } else {
    color='grey'
  }
  var icon = iconMap[color];/*new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-'+color+'.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });*/
  return icon;
}

var populateMarkers = function(lakes) {
  for (i=0; i<lakes.length; i++) {
    lk = lakes[i];
    icon = getIconForLake(lk);
    m = L.marker([lk['lat'], lk['lon']], {icon: icon}).bindPopup(lake2marker_html(lk));
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
  } else if (type_filter_value=='both') {
    type_filter = function(el){return lk['starting'] & lk['overabundant']}
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
    data = DEFAULT_DATA
    renderData(data);
  } else {
    downloadDataAndRender()
}
