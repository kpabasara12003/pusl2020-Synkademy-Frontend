
function setSession(data, minutes = 60) {
    const expires = new Date(Date.now() + minutes * 60 * 1000).toUTCString();

    document.cookie = `userId=${data.id}; expires=${expires}; path=/`;
    document.cookie = `fullName=${encodeURIComponent(data.fullName)}; expires=${expires}; path=/`;
    document.cookie = `studentNumber=${data.studentNumber}; expires=${expires}; path=/`;
    document.cookie = `role=${data.role}; expires=${expires}; path=/`;

    console.log("Session set:", document.cookie);
}

function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let c of cookies) {
        const [key, val] = c.split("=");
        if (key === name) return decodeURIComponent(val);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function clearSession() {
    deleteCookie("userId");
    deleteCookie("fullName");
    deleteCookie("studentNumber");
    deleteCookie("role");

    console.log("After delete:", document.cookie);
}

window.logout = function () {
    console.log("Logout clicked");

    clearSession();

    // small delay to ensure cookies clear
    setTimeout(() => {
        window.location.href = "login.html";
    }, 100);
};

window.checkAuth = function () {
    const userId = getCookie("userId");

    if (!userId) {
        window.location.href = "login.html";
    }
};
