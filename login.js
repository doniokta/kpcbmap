// Admin password
const ADMIN_PASSWORD = "admin1234";

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function (event) {
  event.preventDefault();
  const passwordInput = document.getElementById('password').value;

  if (passwordInput === ADMIN_PASSWORD) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-content').style.display = 'flex';
    
    // Dynamically load admin.js
    const script = document.createElement('script');
    script.src = 'admin.js';
    script.type = 'module';
    document.body.appendChild(script);
  } else {
    alert('Incorrect password. Please try again.');
  }
});
