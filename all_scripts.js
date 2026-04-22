var mymap = null;
var markerCluster = null;
var markers = [];

// Default icon for Leaflet
var defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

// Functions for populating the map

var initializeMap = function() {
  // Center roughly on PNW
  mymap = L.map('mapid').setView([45.5, -118.0], 6);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(mymap);
  
  markerCluster = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 50
  });
  mymap.addLayer(markerCluster);
}

var downloadDataAndRender = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      if (xhr.status === 200) {
        var data = xhr.response;
        renderData(data);
      } else {
        console.error("Failed to load data from " + url);
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

var globalSpeciesCounts = {};

var populateSpeciesFilter = function(lakes) {
  lakes.forEach(function(lk) {
    if (lk.species) {
      lk.species.forEach(function(s) { 
        globalSpeciesCounts[s] = (globalSpeciesCounts[s] || 0) + 1;
      });
    }
  });
  
  var select = document.getElementById('species_filter');
  if (!select) return;
  
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  var sortedSpecies = Object.keys(globalSpeciesCounts).sort(function(a, b) {
    return globalSpeciesCounts[b] - globalSpeciesCounts[a];
  });
  
  sortedSpecies.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s;
    opt.innerHTML = s.charAt(0).toUpperCase() + s.slice(1) + ' (' + globalSpeciesCounts[s] + ')';
    select.appendChild(opt);
  });
}

var addLakesToMap = function(lakes) {
  for (var i=0; i<lakes.length; i++) {
    var lk = lakes[i];
    
    if (lk['lat'] && lk['lon']) {
        var m = L.marker([lk['lat'], lk['lon']], {icon: defaultIcon});
        m.bindPopup(lake2marker_html(lk));
        
        m.lake = lk;
        lk.marker = m;
        markers.push(m);
    }
  }
}

var lake2marker_html = function(lk) {
  var html = '<div class="popup-custom">';
  
  if (lk['url']) {
      html += '<a target="_blank" href="'+lk['url']+'" class="popup-title">'+lk['name']+'</a>';
  } else {
      html += '<div class="popup-title">'+lk['name']+'</div>';
  }
  
  html += '<div class="popup-row"><span class="popup-label">State</span><span class="popup-value">'+lk['state']+'</span></div>';
  
  if (lk['county']) {
      html += '<div class="popup-row"><span class="popup-label">County</span><span class="popup-value">'+lk['county']+'</span></div>';
  }
  if (lk['elevation']) {
      html += '<div class="popup-row"><span class="popup-label">Elevation</span><span class="popup-value">'+String(Math.round(lk['elevation']))+' ft</span></div>';
  }
  if (lk['area']) {
      html += '<div class="popup-row"><span class="popup-label">Size</span><span class="popup-value">'+String(lk['area'])+'</span></div>';
  }
  if (lk['description']) {
      html += '<div style="margin-top: 8px; font-size: 0.85rem; color: #64748b; line-height: 1.4; border-top: 1px solid #e2e8f0; padding-top: 8px;">'+lk['description']+'</div>';
  }
  
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
  // Name Search
  var search_filter_value = document.getElementById('search_filter') ? document.getElementById('search_filter').value.toLowerCase().trim() : '';
  var text_search_filter = function(lk) {
    if (search_filter_value === '') return true;
    return (lk['name'] && lk['name'].toLowerCase().includes(search_filter_value));
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
  
  // Size
  var size_filter_value = document.getElementById('size_filter') ? document.getElementById('size_filter').value : 'any';
  var size_filter;
  if (size_filter_value === 'any') {
    size_filter = function(el){return true;}
  } else if (size_filter_value === '<5') {
    size_filter = function(el){return el && parseFloat(el) < 5;}
  } else if (size_filter_value === '5-10') {
    size_filter = function(el){if (!el) return false; var val = parseFloat(el); return (5 <= val && val <= 10);}
  } else if (size_filter_value === '>10') {
    size_filter = function(el){return el && 10 < parseFloat(el);}
  }
  
  // Elevation
  var elev_filter_value = document.getElementById('elevation_filter') ? document.getElementById('elevation_filter').value : 'any';
  var elev_filter;
  if (elev_filter_value === 'any') {
    elev_filter = function(el){return true;}
  } else if (elev_filter_value === '<3000') {
    elev_filter = function(el){return el && parseFloat(el) < 3000;}
  } else if (elev_filter_value === '3000-5000') {
    elev_filter = function(el){if (!el) return false; var val = parseFloat(el); return (3000 <= val && val <= 5000);}
  } else if (elev_filter_value === '>5000') {
    elev_filter = function(el){return el && 5000 < parseFloat(el);}
  }

  return function(lk) {
    return text_search_filter(lk) && species_filter(lk) && size_filter(lk.area) && elev_filter(lk.elevation);
  }
}

var updateMarkers = function() {
  var filter_func = getFilterFunction();
  var validMarkers = [];
  
  for (var i=0; i<markers.length; i++) {
    var m = markers[i];
    var lk = m.lake;
    if (filter_func(lk)) {
      validMarkers.push(m);
    }
  }
  
  markerCluster.clearLayers();
  markerCluster.addLayers(validMarkers);
}

var showTimestamp = function(timestamp) {
  var timestamp_div = document.getElementById("last_update_timestamp");
  if (timestamp_div) {
    timestamp_div.innerHTML = "The data was last updated at: " + timestamp;
  }
}

initializeMap();
downloadDataAndRender("data/all_states.json");