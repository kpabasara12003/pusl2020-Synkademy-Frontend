const API_BASE_URL = "http://localhost:5037/api/Projects";
const STUDENT_API_BASE_URL = "http://localhost:5037/api/Students";

function readCookie(name) {
    const v = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return v ? decodeURIComponent(v.pop()) : null;
}

function setProfileInfo(studentData) {
    const fullName =
        studentData?.fullName ||
        studentData?.name ||
        readCookie("fullName") ||
        "Student";
    const studentNumber =
        studentData?.studentNumber ||
        studentData?.studentNo ||
        readCookie("studentNumber") ||
        "-";
    const researchArea =
        studentData?.researchArea ||
        studentData?.specialization ||
        "Not Set";

    const nameEl = document.getElementById("profileName");
    const studentNoEl = document.getElementById("profileStudentNo");
    const areaEl = document.getElementById("profileArea");

    if (nameEl) nameEl.innerText = `Hi, ${fullName}`;
    if (studentNoEl) studentNoEl.innerText = `Student Number: ${studentNumber}`;
    if (areaEl) areaEl.innerText = `Research Area: ${researchArea}`;
}

function looksLikeProject(data) {
    if (!data || typeof data !== "object") return false;
    return Boolean(
        data.title ||
        data.projectTitle ||
        data.projectId ||
        data.createdAt ||
        data.status
    );
}

function looksLikeStudent(data) {
    if (!data || typeof data !== "object") return false;
    return Boolean(
        data.id ||
        data.studentId ||
        data.studentNumber ||
        data.fullName ||
        data.name
    );
}

async function fetchStudentByCandidateIds(candidateIds) {
    for (const id of candidateIds) {
        if (!id) continue;
        try {
            const response = await fetch(`${STUDENT_API_BASE_URL}/${encodeURIComponent(id)}`);
            if (!response.ok) continue;
            const data = await response.json();
            if (looksLikeStudent(data)) return data;
        } catch (error) {
            console.warn("Failed student fetch with id", id, error);
        }
    }
    return null;
}

async function fetchProjectByCandidateIds(candidateIds) {
    for (const studentId of candidateIds) {
        if (!studentId) continue;

        try {
            const response = await fetch(`${API_BASE_URL}/student/${encodeURIComponent(studentId)}`);
            if (!response.ok) continue;

            const data = await response.json();
            if (Array.isArray(data) && data.length > 0 && looksLikeProject(data[0])) return data[0];
            if (looksLikeProject(data)) return data;
        } catch (error) {
            console.warn("Failed fetching with id", studentId, error);
        }
    }

    return null;
}

function getStatusClass(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("match")) return "matched";
    if (normalized.includes("review")) return "review";
    return "pending";
}

function renderProject(project) {
    const statusEl = document.getElementById("submissionStatus");
    const metaEl = document.getElementById("submissionMeta");
    const countEl = document.getElementById("proposalCount");
    const tbody = document.getElementById("proposalTableBody");
    const newProposalBtn = document.getElementById("newProposalBtn");
    if (!statusEl || !metaEl || !countEl || !tbody || !newProposalBtn) return;

    if (project) {
        const created = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "-";
        const status = project.status || "Pending";
        const area = project.researchArea || project.category || project.shortDescription || "Not Set";

        statusEl.innerText = status;
        metaEl.innerText = `Submitted on ${created}`;
        countEl.innerText = "1";
        tbody.innerHTML = `
            <tr>
                <td>${project.title || project.projectTitle || "-"}</td>
                <td>${area}</td>
                <td>${created}</td>
                <td><span class="status-pill ${getStatusClass(status)}">${status}</span></td>
            </tr>
        `;

        // Keep button active so user can open submit page from dashboard.
        newProposalBtn.classList.remove("disabled-link");
        newProposalBtn.removeAttribute("aria-disabled");
        newProposalBtn.removeAttribute("title");
        newProposalBtn.style.pointerEvents = "auto";
        newProposalBtn.style.opacity = "1";
    } else {
        statusEl.innerText = "No Submission";
        metaEl.innerText = "No proposal submitted yet";
        countEl.innerText = "0";

        tbody.innerHTML = "<tr><td colspan='4'>No proposal found</td></tr>";

        newProposalBtn.classList.remove("disabled-link");
        newProposalBtn.removeAttribute("aria-disabled");
        newProposalBtn.removeAttribute("title");
        newProposalBtn.style.pointerEvents = "auto";
        newProposalBtn.style.opacity = "1";
    }
}

async function initializeDashboard() {
    const userId = readCookie("userId");
    const studentNumber = readCookie("studentNumber");
    const sessionStudentId = sessionStorage.getItem("studentId");

    // Try candidate ids for student lookup first.
    const candidateIds = [sessionStudentId, userId, studentNumber].filter(Boolean);

    if (!candidateIds.some(Boolean)) {
        window.location.href = "login.html";
        return;
    }

    const student = await fetchStudentByCandidateIds(candidateIds);
    setProfileInfo(student);

    const projectCandidateIds = [
        student?.id,
        student?.studentId,
        student?.studentNumber,
        ...candidateIds
    ].filter(Boolean);

    const project = await fetchProjectByCandidateIds(projectCandidateIds);
    renderProject(project);
}

initializeDashboard();
