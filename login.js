// login.js
const ADMIN_PASSWORD = "admin1234";

document.getElementById('login-form').addEventListener('submit', function (event) {
  event.preventDefault();
  const passwordInput = document.getElementById('password').value;

  if (passwordInput === ADMIN_PASSWORD) {
    window.location.href = "admin.html";
  } else {
    alert('Incorrect password. Please try again.');
  }
});
