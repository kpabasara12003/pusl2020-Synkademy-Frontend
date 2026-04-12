const API_BASE_URL = "http://localhost:5037/api/Projects";

// Initialize dashboard with fallback for missing studentId
function readCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? decodeURIComponent(v.pop()) : null;
}

async function initializeDashboard() {
    let studentId = sessionStorage.getItem("studentId");

    // fallback to cookie set by setSession (userId)
    if (!studentId) studentId = readCookie('userId');

    if (!studentId) {
        // not logged in; redirect to login
        console.warn("Student ID not found in sessionStorage or cookies. Redirecting to login.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/student/${studentId}`);
        if (!response.ok) {
            throw new Error("Failed to fetch project data");
        }

        const project = await response.json();

        if (project && project.length > 0) {
            const projectData = project[0];

            // Update Project Submission Status
            document.querySelector(".stat-value").innerText = projectData.status;
            document.querySelector(".stat-meta").innerText = `Submitted on ${new Date(projectData.createdAt).toLocaleDateString()}`;

            // Update Recent Proposal Section
            const proposalRow = `
                <tr>
                    <td>${projectData.title}</td>
                    <td>${projectData.shortDescription}</td>
                    <td>${new Date(projectData.createdAt).toLocaleDateString()}</td>
                    <td><span class="status-pill review">${projectData.status}</span></td>
                </tr>
            `;
            document.querySelector(".table tbody").innerHTML = proposalRow;

            // Disable "New Proposal" button
            document.querySelector(".pill.primary").disabled = true;
        } else {
            // No project found
            document.querySelector(".stat-value").innerText = "No Submission";
            document.querySelector(".stat-meta").innerText = "No proposals submitted yet";
            document.querySelector(".pill.primary").disabled = false;

            // Clear Recent Proposals
            document.querySelector(".table tbody").innerHTML = "<tr><td colspan='4'>No proposals found</td></tr>";
        }
    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}

// Automatically initialize the dashboard
initializeDashboard();
