
// Global Variables

var DEFAULT_DATA = {"lakes": [
  {"overabundant":true, "starting":true, "name": "Airplane", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/airplane", "elevation": 5305.0, "county": "Chelan", "lat": 48.002594, "lon": -121.006674, "acres": "9.40"},
  {"overabundant":true, "starting":false, "name": "Arrowhead", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/arrowhead", "elevation": 4411.0, "county": "Skagit", "lat": 48.432548, "lon": -121.290053, "acres": "10.50"},
  {"overabundant":false, "starting":true, "name": "Bagley - Upper", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bagley-upper", "elevation": 4172.0, "county": "Whatcom", "lat": 48.860064, "lon": -121.684465, "acres": "3.80"},
  {"overabundant":false, "starting":false, "name": "Baker (Thetis)", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/baker-thetis", "elevation": 4434.0, "county": "Kittitas", "lat": 47.351427, "lon": -121.301709, "acres": "4.70"},
  {"overabundant":true, "starting":true, "name": "Bannock - Middle", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bannock-middle", "elevation": 5929.0, "county": "Chelan", "lat": 48.260666, "lon": -120.972715, "acres": "6.90"}
]}

//var data = null;
var mymap = null;
var markers = [];

// Functions for populating the map

var initializeMap = function() {
  mapboxgl.accessToken = "pk.eyJ1IjoiZmllbGRjYWR5IiwiYSI6ImNqd3Rmb2d3bjBkMDA0OW5yamYxNnRwdGwifQ.kBilx8iMkTn8RUyrO7ZHGA";
  mymap = new mapboxgl.Map({
    container: 'mapid',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-120.661, 47.596],
    zoom: 5,
    maxZoom: 13,
    maxBounds: [[-130, 45], [-110, 50]]
  });
}

var downloadDataAndRender = function(url) {
    var xhr = new XMLHttpRequest();
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
  addLakesToMap(dat["lakes"]);
  updateMarkers();
}

var addLakesToMap = function(lakes) {
  for (i=0; i<lakes.length; i++) {
    lk = lakes[i];
    if (lk['starting'] & lk['overabundant']) {
      color='violet'
    } else if (lk['starting'] & (!lk['overabundant'])) {
      color='red'
    } else if ((!lk['starting']) & lk['overabundant']) {
      color='blue'
    } else {
      color='grey'
    }
    m = new mapboxgl.Marker({color: color})
      .setLngLat([lk['lon'], lk['lat']]);
    var popup = new mapboxgl.Popup().setHTML(lake2marker_html(lk));
    m.setPopup(popup);
    m.addTo(mymap);
    //
    m.lake = lk;
    lk.marker = m;
    markers.push(m);
  };
}


// Helper utility functions

var lake2marker_html = function(lk) {
  clickable_name = '<a target="_blank" href="'+lk['url']+'">'+lk['name']+'</a>'
  elevation = '<p>Elevation: '+String(Math.round(lk['elevation']))+'ft'
  county = '<p>County: '+lk['county']+'</p>'
  size = '<p>Size: '+String(lk['acres'])+' Acres</p>'
  return clickable_name+elevation+county+size;
}

var getFilterFunction = function() {
  console.log('in getFilterFunction')
  // Reads current filter settings and returns a function that says whether
  // a lake passes those filters

  // Type
  var show_overabundant = document.getElementById('overabundant_filter').checked;
  var show_starting = document.getElementById('starting_filter').checked;
  var show_other = document.getElementById('other_filter').checked;
  type_filter = function(lk) {
    if (lk['starting'] & show_starting) return true;
    if (lk['overabundant'] & show_overabundant) return true;
    return show_other;
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

// Top-level functions below this line

var updateMarkers = function() {
  filter_func = getFilterFunction()
  for (i=0; i<markers.length; i++) {
    m = markers[i];
    lk = m.lake;
    if (filter_func(lk)) {
      m.addTo(mymap);
    } else {
      m.remove(mymap);
    }
  };
}

var showTimestamp = function(timestamp) {
  timestamp_div = document.getElementById("last_update_timestamp");
  var content = document.createTextNode(timestamp);
  timestamp_div.appendChild(content);
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

initializeMap()

if (location.origin === "file://") {
    //data = DEFAULT_DATA
    renderData(DEFAULT_DATA);
  } else {
    downloadDataAndRender("data/overabundant_lakes.json");
    downloadDataAndRender("data/starting_lakes.json");
    sleep(500);
    downloadDataAndRender("data/normal_lakes.json");
}
