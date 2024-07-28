import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

// Firebase configuration
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

// Admin password
const ADMIN_PASSWORD = "@Greedisgood023";

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const passwordInput = document.getElementById('password').value;

  if (passwordInput === ADMIN_PASSWORD) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    initializeAdminContent();
  } else {
    alert('Incorrect password. Please try again.');
  }
});

function initializeAdminContent() {
  // Leaflet map setup for admin
  let map = L.map('map').setView([0, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const userMarkers = {};

  // Custom icon for users
  const userIcon = L.divIcon({
    className: 'custom-icon',
    html: '<div class="red-circle"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  // CSS for custom icon
  const style = document.createElement('style');
  style.textContent = `
    .custom-icon .red-circle {
      width: 12px;
      height: 12px;
      background-color: red;
      border-radius: 50%;
    }
  `;
  document.head.append(style);

  // Fetch all user locations from Firebase and display them
  const locationsRef = ref(database, 'locations/');
  onValue(locationsRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const childData = childSnapshot.val();
      const lat = childData.latitude;
      const lng = childData.longitude;
      const speed = childData.speed;
      const userId = childSnapshot.key;

      // Content for the popup
      const popupContent = `
        <div>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Latitude:</strong> ${lat}</p>
          <p><strong>Longitude:</strong> ${lng}</p>
          <p><strong>Speed:</strong> ${speed} m/s</p>
        </div>
      `;

      // Update or add user marker to map
      if (userMarkers[userId]) {
        userMarkers[userId].setLatLng([lat, lng]).setPopupContent(popupContent);
      } else {
        userMarkers[userId] = L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup(popupContent);
      }
    });
  }, (error) => {
    console.error('Error fetching locations:', error);
  });

  // Function to load GeoJSON data onto the map
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

  // Load GeoJSON data from map.geojson onto the map
  fetchAndAddGeoJSONLayer('map.geojson');
}