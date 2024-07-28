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
    document.getElementById('admin-content').classList.remove('hidden');
    initializeAdminContent();
  } else {
    alert('Incorrect password. Please try again.');
  }
});

document.getElementById('logout-button').addEventListener('click', function() {
  document.getElementById('admin-content').classList.add('hidden');
  document.getElementById('login-container').style.display = 'flex';
  document.getElementById('password').value = '';  // Clear the password input
});

let map;
const userMarkers = {};
let geoJsonLayer; // Variable to hold the geoJsonLayer

function initializeAdminContent() {
  if (!map) {
    // Initialize map only if it hasn't been initialized yet
    map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

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
  }

  // Fetch all user locations from Firebase and display them
  const locationsRef = ref(database, 'locations/');
  onValue(locationsRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const childData = childSnapshot.val();
      const lat = childData.latitude;
      const lng = childData.longitude;
      const accuracy = childData.accuracy;
      const userName = childSnapshot.key;

      // Debugging: Log data to console
      console.log(`User: ${userName}, Lat: ${lat}, Lng: ${lng}, Accuracy: ${accuracy}`);

      // Content for the popup
      const popupContent = `
        <div>
          <p><strong>User Name:</strong> ${userName}</p>
          <p><strong>Latitude:</strong> ${lat}</p>
          <p><strong>Longitude:</strong> ${lng}</p>
          <p><strong>Accuracy:</strong> ${accuracy} meters</p>
        </div>
      `;

      // Update or add user marker to map
      if (userMarkers[userName]) {
        userMarkers[userName].setLatLng([lat, lng]).setPopupContent(popupContent);
      } else {
        const userIcon = L.divIcon({
          className: 'custom-icon',
          html: '<div class="red-circle"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        userMarkers[userName] = L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup(popupContent);
      }
    });
  }, (error) => {
    console.error('Error fetching locations:', error);
  });
}

// Function to load GeoJSON data onto the map and adjust map view
function fetchAndAddGeoJSONLayer(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
      }
      geoJsonLayer = L.geoJSON(data).addTo(map);
      map.fitBounds(geoJsonLayer.getBounds());
    })
    .catch(error => {
      console.error('Error loading GeoJSON file:', error);
    });
}

// Handle sidebar navigation
document.querySelectorAll('#sidebar ul li a').forEach(link => {
  link.addEventListener('click', function(event) {
    event.preventDefault();
    document.querySelectorAll('#content > div').forEach(div => {
      div.classList.add('hidden');
    });
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.classList.remove('hidden');
      if (target.id === 'map-view') {
        setTimeout(() => {
          map.invalidateSize();
          fetchAndAddGeoJSONLayer('map.geojson'); // Load GeoJSON when map-view is clicked
        }, 100);
      }
    }
  });
});