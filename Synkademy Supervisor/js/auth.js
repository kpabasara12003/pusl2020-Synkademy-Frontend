document.addEventListener('DOMContentLoaded', () => {
  const user = getSession();
  if (user && window.location.pathname.includes("index.html")) {
    window.location.href = "pages/dashboard.html";
  }
});

async function login(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("errorMsg");
  const btn = document.getElementById("loginBtn");

  msg.style.display = "none";

  if (!email || !password) {
    showMessage("All fields are required");
    return;
  }

  try {
    btn.innerText = "Checking...";
    btn.disabled = true;

    const res = await fetch("http://localhost:5037/api/Auth/supervisor-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      let errMsg = "Login failed";
      try { errMsg = await res.text(); } catch {}
      showMessage(errMsg);
      return;
    }

    const data = await res.json();

    if (!data.role || data.role.toLowerCase() !== "supervisor") {
      showMessage("Access denied. Supervisor role required.");
      return;
    }

    setSession(SESSION_NAME, data, 1); // 1 day

    window.location.href = "pages/dashboard.html";

  } catch (err) {
    console.error(err);
    showMessage("Server error. Please try again.");
  } finally {
    btn.innerText = "Login";
    btn.disabled = false;
  }
}

function showMessage(text) {
  const msg = document.getElementById("errorMsg");
  msg.innerText = text;
  msg.style.display = "block";
}