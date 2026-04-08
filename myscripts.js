
// Global Variables

var DEFAULT_DATA = {"lakes": [
  {"overabundant":true, "starting":true, "name": "Airplane", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/airplane", "elevation": 5305.0, "county": "Chelan", "lat": 48.002594, "lon": -121.006674, "area": "9.40 Acres"},
  {"overabundant":true, "starting":false, "name": "Arrowhead", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/arrowhead", "elevation": 4411.0, "county": "Skagit", "lat": 48.432548, "lon": -121.290053, "area": "10.50 Acres"},
  {"overabundant":false, "starting":true, "name": "Bagley - Upper", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bagley-upper", "elevation": 4172.0, "county": "Whatcom", "lat": 48.860064, "lon": -121.684465, "area": "3.80 Acres"},
  {"overabundant":false, "starting":false, "name": "Baker (Thetis)", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/baker-thetis", "elevation": 4434.0, "county": "Kittitas", "lat": 47.351427, "lon": -121.301709, "area": "4.70 Acres"},
  {"overabundant":true, "starting":true, "name": "Bannock - Middle", "url": "https://wdfw.wa.gov/fishing/locations/high-lakes/bannock-middle", "elevation": 5929.0, "county": "Chelan", "lat": 48.260666, "lon": -120.972715, "area": "6.90 Acres"}
]}

var mymap = null;
var markers = [];

// Colored icons for Leaflet
var redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

var blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

var greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

var violetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

// Functions for populating the map

var initializeMap = function() {
  mymap = L.map('mapid').setView([47.596, -120.661], 7);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(mymap);
}

var downloadDataAndRender = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      if (xhr.status === 200) {
        data = xhr.response;
        renderData(data);
      }
    };
    xhr.send();
};

var renderData = function(dat) {
  if (dat["timestamp"]) {
    showTimestamp(dat["timestamp"]);
  }
  addLakesToMap(dat["lakes"]);
  populateSpeciesFilter(dat["lakes"]);
  updateMarkers();
}

var populateSpeciesFilter = function(lakes) {
  var speciesSet = new Set();
  lakes.forEach(function(lk) {
    if (lk.species) {
      lk.species.forEach(function(s) { speciesSet.add(s); });
    }
  });
  
  var select = document.getElementById('species_filter');
  if (!select) return;
  
  // Clear existing options except 'Any'
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  var sortedSpecies = Array.from(speciesSet).sort();
  sortedSpecies.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s;
    opt.innerHTML = s.charAt(0).toUpperCase() + s.slice(1);
    select.appendChild(opt);
  });
}

var addLakesToMap = function(lakes) {
  for (var i=0; i<lakes.length; i++) {
    var lk = lakes[i];
    var icon = greyIcon;
    
    if (lk['starting'] && lk['overabundant']) {
      icon = violetIcon;
    } else if (lk['starting'] && (!lk['overabundant'])) {
      icon = redIcon;
    } else if ((!lk['starting']) && lk['overabundant']) {
      icon = blueIcon;
    }
    
    var m = L.marker([lk['lat'], lk['lon']], {icon: icon});
    m.bindPopup(lake2marker_html(lk));
    
    m.lake = lk;
    lk.marker = m;
    markers.push(m);
  }
}


// Helper utility functions

var lake2marker_html = function(lk) {
  var html = '<div class="popup-custom">';
  html += '<a target="_blank" href="'+lk['url']+'" class="popup-title">'+lk['name']+'</a>';
  
  html += '<div class="popup-row"><span class="popup-label">Elevation</span><span class="popup-value">'+String(Math.round(lk['elevation']))+' ft</span></div>';
  html += '<div class="popup-row"><span class="popup-label">County</span><span class="popup-value">'+lk['county']+'</span></div>';
  html += '<div class="popup-row"><span class="popup-label">Size</span><span class="popup-value">'+String(lk['area'])+'</span></div>';
  
  if (lk['species'] && lk['species'].length > 0) {
    html += '<div class="popup-species">';
    html += '<div class="popup-label" style="margin-bottom: 4px;">Species:</div>';
    for (var i = 0; i < lk['species'].length; i++) {
      html += '<span class="species-tag">' + lk['species'][i] + '</span>';
    }
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

var getFilterFunction = function() {
  // Reads current filter settings and returns a function that says whether
  // a lake passes those filters

  // Name Search
  var search_filter_value = document.getElementById('search_filter') ? document.getElementById('search_filter').value.toLowerCase().trim() : '';
  var text_search_filter = function(lk) {
    if (search_filter_value === '') return true;
    return lk['name'].toLowerCase().includes(search_filter_value);
  }

  // Type
  var show_overabundant = document.getElementById('overabundant_filter').checked;
  var show_starting = document.getElementById('starting_filter').checked;
  var show_other = document.getElementById('other_filter').checked;
  
  var type_filter = function(lk) {
    if (lk['starting'] && show_starting) return true;
    if (lk['overabundant'] && show_overabundant) return true;
    if (!lk['starting'] && !lk['overabundant'] && show_other) return true;
    return false;
  }
  
  // Species
  var species_filter_value = document.getElementById('species_filter') ? document.getElementById('species_filter').value : 'any';
  var species_filter;
  if (species_filter_value === 'any') {
    species_filter = function(lk) { return true; }
  } else {
    species_filter = function(lk) { 
      return lk['species'] && lk['species'].includes(species_filter_value); 
    }
  }

  // Elevation
  var elevation_filter_value = document.getElementById('elevation_filter').value
  var elevation_filter;
  if (elevation_filter_value=='any') {
    elevation_filter = function(el){return true}
  } else if (elevation_filter_value=='<4000') {
    elevation_filter = function(el){return el<4000}
  } else if (elevation_filter_value=='4000-5000') {
    elevation_filter = function(el){return (4000<=el && el<=5000)}
  } else if (elevation_filter_value=='5000-6000') {
    elevation_filter = function(el){return (5000<=el && el<=6000)}
  } else if (elevation_filter_value=='>6000') {
    elevation_filter = function(el){return el>6000}
  }
  
  // Size
  var size_filter_value = document.getElementById('size_filter').value
  var size_filter;
  if (size_filter_value=='any') {
    size_filter = function(el){return true}
  } else if (size_filter_value=='<5') {
    size_filter = function(el){return parseFloat(el)<5}
  } else if (size_filter_value=='5-10') {
    size_filter = function(el){var val = parseFloat(el); return (5<=val && val<=10)}
  } else if (size_filter_value=='>10') {
    size_filter = function(el){return 10<parseFloat(el)}
  }
  
  // County
  var county_filter_value = document.getElementById('county_filter').value
  var county_filter;
  if (county_filter_value=='any') {
    county_filter = function(cty){return true}
  } else {
    county_filter = function(cty){return cty==county_filter_value}
  }
  
  return function(lk) {
    return text_search_filter(lk) && elevation_filter(lk.elevation) && size_filter(lk.area) && county_filter(lk.county) && type_filter(lk) && species_filter(lk)
  }
}

// Top-level functions below this line

var updateMarkers = function() {
  var filter_func = getFilterFunction()
  for (var i=0; i<markers.length; i++) {
    var m = markers[i];
    var lk = m.lake;
    if (filter_func(lk)) {
      if (!mymap.hasLayer(m)) {
        m.addTo(mymap);
      }
    } else {
      if (mymap.hasLayer(m)) {
        mymap.removeLayer(m);
      }
    }
  }
}

var showTimestamp = function(timestamp) {
  var timestamp_div = document.getElementById("last_update_timestamp");
  if (timestamp_div) {
    timestamp_div.innerHTML = "The data was last updated at: " + timestamp;
  }
}

initializeMap()

if (location.origin === "file://") {
    renderData(DEFAULT_DATA);
  } else {
    downloadDataAndRender("data/overabundant_lakes.json");
    downloadDataAndRender("data/starting_lakes.json");
    // Removed the sleep(500) and manual third call to be more robust
    downloadDataAndRender("data/normal_lakes.json");
}
