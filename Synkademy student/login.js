async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    msg.innerText = "";

    if (!email || !password) {
        msg.innerText = "All fields are required";
        return;
    }

    if (!validateEmail(email)) {
        msg.innerText = "Invalid email format";
        return;
    }

    try {
        const response = await fetch("http://localhost:5037/api/Auth/student-login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            const error = await response.text();
            msg.innerText = error;
            return;
        }

        const data = await response.json();

        if (data.role !== "Student") {
            msg.innerText = "Access denied: Students only";
            return;
        }

        setSession(data, 60);

        // Store studentId in session storage (try multiple property names returned by API)
        const sid = data.studentId || data.id || data.userId || data.studentNumber;
        if (sid) sessionStorage.setItem("studentId", sid);

        window.location.href = "dashboard.html";

    } catch (err) {
        msg.innerText = "Server error. Try again.";
        console.error(err);
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}