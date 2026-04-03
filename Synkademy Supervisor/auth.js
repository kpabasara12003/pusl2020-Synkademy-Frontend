
const SESSION_NAME = "synkademy_supervisor_session";

(function () {
  const user = getSession(SESSION_NAME);
  if (user && window.location.pathname.includes("index")) {
    window.location.href = "dashboard.html";
  }
})();


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
      showMessage("Access denied");
      return;
    }

    setSession(SESSION_NAME, data, 1/24);

    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    showMessage("Server error");
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

function setSession(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));

  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${d.toUTCString()};path=/`;
}

function getSession(name) {
  const cname = name + "=";
  const ca = document.cookie.split(';');

  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(cname) === 0) {
      return JSON.parse(decodeURIComponent(c.substring(cname.length)));
    }
  }
  return null;
}

function logout() {
  document.cookie = `${SESSION_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;

  window.location.href = "index.html";
}