import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqDzfu54Zios3ahqp-hHQUDRHsB42SJeU",
  authDomain: "kpcbmap-c9cbc.firebaseapp.com",
  databaseURL: "https://kpcbmap-c9cbc-default-rtdb.firebaseio.com",
  projectId: "kpcbmap-c9cbc",
  storageBucket: "kpcbmap-c9cbc.appspot.com",
  messagingSenderId: "257407785210",
  appId: "1:257407785210:web:5e893944bdde6ad62a1143",
  measurementId: "G-X8DF9W9W13"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

// Leaflet map setup
let map;
let userMarker;
let accuracyCircle;
let isMapLocked = true;
let isLiveTracking = false;
let watchId = null;
let userId = null; // To be initialized with user input
let activeUsersCount = 0; // Active users count

function initializeMap() {
  map = L.map('map').setView([0, 0], 16);

  // Tile layers
  var lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 25,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 25,
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
  });

  // Custom red circle marker
  var redCircleIcon = L.divIcon({
    className: 'custom-icon',
    html: '<div class="red-circle"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  // Initialize user input for name
  userId = prompt("Please enter your name:").toUpperCase(); // Get user input and convert to uppercase

  // User marker initialization
  userMarker = L.marker([0, 0], { icon: redCircleIcon }).addTo(map);

  // UI elements
  document.body.appendChild(createButton('lock-button', '<i class="fas fa-lock"></i>', toggleLockMap));
  document.body.appendChild(createButton('live-tracking-button', '<i class="fas fa-play"></i> Start Live Tracking', toggleLiveTracking));
  document.body.appendChild(createButton('mode-toggle-button', '<i class="fas fa-moon"></i>', toggleMapMode));

  var coordinatesDisplay = createDisplay('coordinates', 'Lat: 0, Lng: 0');
  var speedDisplay = createDisplay('speed', 'Speed: 0 km/h');
  var activeUsersDisplay = createDisplay('active-users', 'Active Users: 0');

  document.body.appendChild(coordinatesDisplay);
  document.body.appendChild(speedDisplay);
  document.body.appendChild(activeUsersDisplay);

  // Initialize map and fetch initial user locations
  fetchAllUserLocations();
  fetchGeoJsonData();
}

function createButton(className, innerHTML, onClick) {
  var button = document.createElement('button');
  button.className = className;
  button.innerHTML = innerHTML;
  button.onclick = onClick;
  return button;
}

function createDisplay(className, initialText) {
  var display = document.createElement('div');
  display.className = className;
  display.innerHTML = initialText;
  return display;
}

function toggleLockMap() {
  isMapLocked = !isMapLocked;
  document.querySelector('.lock-button').innerHTML = isMapLocked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-unlock"></i>';
}

function toggleLiveTracking() {
  if (!isLiveTracking) {
    watchId = navigator.geolocation.watchPosition(updateUserPosition, onLocationError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
      allowInBackground: true // Allow background geolocation (custom parameter)
    });
    isLiveTracking = true;
    document.querySelector('.live-tracking-button').innerHTML = '<i class="fas fa-stop"></i> Stop Live Tracking';
    document.querySelector('.live-tracking-button').classList.add('active');
  } else {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    isLiveTracking = false;
    document.querySelector('.live-tracking-button').innerHTML = '<i class="fas fa-play"></i> Start Live Tracking';
    document.querySelector('.live-tracking-button').classList.remove('active');
  }
}

function updateUserPosition(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var accuracy = position.coords.accuracy;
  var speedValue = position.coords.speed;

  // Save user's location to Firebase under uppercase user ID
  set(ref(database, 'locations/' + userId), {
    latitude: lat,
    longitude: lng,
    accuracy: accuracy,
    speed: speedValue
  });

  if (isMapLocked) {
    map.setView([lat, lng], 18); // Set zoom level to 18 when locked
  }

  userMarker.setLatLng([lat, lng]);

  // Update coordinates display
  document.querySelector('.coordinates').innerHTML = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

  // Update speed display
  document.querySelector('.speed').innerHTML = `Speed: ${speedValue ? (speedValue * 3.6).toFixed(2) : 0} km/h`;

  // Optional: show the accuracy circle
  if (!accuracyCircle) {
    accuracyCircle = L.circle([lat, lng], { radius: accuracy }).addTo(map);
  } else {
    accuracyCircle.setLatLng([lat, lng]).setRadius(accuracy);
  }
}

function fetchAndAddGeoJSONLayer(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      L.geoJSON(data).addTo(map);
    })
    .catch(error => {
      console.error('Error loading GeoJSON file:', error);
    });
}

function fetchGeoJsonData() {
  const geoJsonRef = storageRef(storage, 'map.geojson');
  getDownloadURL(geoJsonRef)
    .then((url) => {
      fetchAndAddGeoJSONLayer(url);
    })
    .catch((error) => {
      console.error('Error getting GeoJSON download URL:', error);
    });
}

function fetchAllUserLocations() {
  const locationsRef = ref(database, 'locations/');
  onValue(locationsRef, (snapshot) => {
    activeUsersCount = 0; // Reset active users count
    snapshot.forEach((childSnapshot) => {
      var childData = childSnapshot.val();
      var lat = childData.latitude;
      var lng = childData.longitude;

      // Add markers for other users to the map
      if (childSnapshot.key !== userId) { // Avoid displaying current user's marker
        L.marker([lat, lng], { icon: redCircleIcon }).addTo(map);
      }

      // Increment active users count
      activeUsersCount++;
    });

    // Update active users display
    document.querySelector('.active-users').innerHTML = `Active Users: ${activeUsersCount}`;
  }, (error) => {
    console.error('Error fetching locations:', error);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
});
