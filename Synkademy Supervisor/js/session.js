const SESSION_NAME = "synkademy_supervisor_session";

function getSession(name = SESSION_NAME) {
  const cname = name + "=";
  const cookies = document.cookie.split(";");

  for (let c of cookies) {
    c = c.trim();
    if (c.indexOf(cname) === 0) {
      try {
        return JSON.parse(decodeURIComponent(c.substring(cname.length)));
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

function setSession(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${d.toUTCString()};path=/`;
}

function logout() {
  document.cookie = `${SESSION_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  window.location.href = "../index.html";
}

function requireAuth() {
  const user = getSession();
  if (!user) {
    window.location.href = "../index.html";
    return null;
  }
  return user;
}