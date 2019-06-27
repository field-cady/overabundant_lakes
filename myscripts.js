
// Global Variables

var DEFAULT_DATA = {"lakes": [
{"name": "Airplane", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/airplane", "elevation": 5305.0, "county": "Chelan", "lat": 48.002594, "lon": -121.006674},
{"name": "Arrowhead", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/arrowhead", "elevation": 4411.0, "county": "Skagit", "lat": 48.432548, "lon": -121.290053},
{"name": "Bagley - Upper", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bagley-upper", "elevation": 4172.0, "county": "Whatcom", "lat": 48.860064, "lon": -121.684465},
{"name": "Baker (Thetis)", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/baker-thetis", "elevation": 4434.0, "county": "Kittitas", "lat": 47.351427, "lon": -121.301709},
{"name": "Bannock - Middle", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bannock-middle", "elevation": 5929.0, "county": "Chelan", "lat": 48.260666, "lon": -120.972715},
{"name": "Bannock - Upper", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bannock-upper", "elevation": 5934.0, "county": "Chelan", "lat": 48.257043, "lon": -120.968671},
{"name": "Bath Pot 1", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bath-pot-1", "elevation": 5634.0, "county": "Snohomish", "lat": 48.248745, "lon": -121.079558},
{"name": "Battalion", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/battalion", "elevation": 5350.0, "county": "Chelan", "lat": 48.345756, "lon": -120.787952},
{"name": "Bear", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bear", "elevation": 2780.0, "county": "Snohomish", "lat": 48.058358, "lon": -121.742891},
{"name": "Bearpaw Mtn", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bearpaw-mtn", "elevation": 4425.0, "county": "Whatcom", "lat": 48.951348, "lon": -121.841096},
{"name": "Bench", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bench", "elevation": 4185.0, "county": "King", "lat": 47.656379, "lon": -121.501307},
{"name": "Berdeen", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/berdeen", "elevation": 5018.0, "county": "Whatcom", "lat": 48.71593, "lon": -121.464573}
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
  return clickable_name+elevation+county;
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
  /*for (i=0; i<lakes.length; i++) {
    lk = lakes[i];
    L.marker([lk['lat'], lk['lon']])
        .bindPopup(lake2marker_html(lk)).addTo(mymap)
        .openPopup().closePopup();
  };*/
}

var updateMarkers = function() {
  //alert(document.getElementById('crs').value)
  var elevation_filter_value = document.getElementById('elevation_filter').value
  if (elevation_filter_value=='any') {
    elevation_filter = function(el){return true}
  } else if (elevation_filter_value=='<=5000') {
    elevation_filter = function(el){return el<=5000}
  } else if (elevation_filter_value=='>5000') {
    elevation_filter = function(el){return el>5000}
  }
  for (i=0; i<markers.length; i++) {
    m = markers[i];
    lk = m.lake;
    if (elevation_filter(lk.elevation)) {
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
    //alert("It's a local server!");
    renderData(DEFAULT_DATA);
  } else {
    downloadDataAndRender()
}
