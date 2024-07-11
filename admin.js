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
const ADMIN_PASSWORD = "admin1234";

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function (event) {
  event.preventDefault();
  const passwordInput = document.getElementById('password').value;

  if (passwordInput === ADMIN_PASSWORD) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-content').style.display = 'flex';
    initializeAdminContent();
  } else {
    alert('Incorrect password. Please try again.');
  }
});

// Handle navigation links
document.getElementById('dashboard-link').addEventListener('click', function () {
  document.getElementById('dashboard-content').style.display = 'block';
  document.getElementById('map-content').style.display = 'none';
});

document.getElementById('map-link').addEventListener('click', function () {
  document.getElementById('dashboard-content').style.display = 'none';
  document.getElementById('map-content').style.display = 'block';
});

function initializeAdminContent() {
  // Initialize the chart
  const ctx = document.getElementById('user-chart').getContext('2d');
  const userChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Number of Users',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Fetch user data from Firebase and update the chart
  const usersRef = ref(database, 'locations/');
  onValue(usersRef, (snapshot) => {
    const userIds = [];
    const userLocations = [];

    snapshot.forEach((childSnapshot) => {
      const userId = childSnapshot.key;
      const childData = childSnapshot.val();
      userIds.push(userId);
      userLocations.push(`${childData.latitude}, ${childData.longitude}`);
    });

    userChart.data.labels = userIds;
    userChart.data.datasets[0].data = userLocations.map(() => 1); // Each user contributes '1' to the count
    userChart.update();

    // Update the user list
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    userIds.forEach((userId, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${userId}: ${userLocations[index]}`;
      userList.appendChild(listItem);
    });
  }, (error) => {
    console.error('Error fetching users:', error);
  });

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
