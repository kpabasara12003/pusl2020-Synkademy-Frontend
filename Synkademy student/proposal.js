const API_BASE_URL = "http://localhost:5037";
const PROJECT_API_BASE = `${API_BASE_URL}/api/Projects`;
const STUDENT_API_BASE = `${API_BASE_URL}/api/Students`;
const SUPERVISOR_API_BASE = `${API_BASE_URL}/api/Supervisor`;
let currentProposal = null;

function readCookie(name) {
    const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return match ? decodeURIComponent(match.pop()) : null;
}

function candidateIds() {
    return [
        sessionStorage.getItem("studentId"),
        readCookie("userId"),
        readCookie("studentNumber")
    ].filter(Boolean);
}

function asText(value, fallback = "-") {
    if (value === null || value === undefined) return fallback;
    if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
    const text = String(value).trim();
    return text ? text : fallback;
}

function setPageStatus(message, type = "loading") {
    const el = document.getElementById("pageStatus");
    if (!el) return;
    el.className = `page-status ${type}`;
    el.innerText = message;
}

function setActionButtonsEnabled(enabled) {
    const editBtn = document.getElementById("editProposalBtn");
    const deleteBtn = document.getElementById("deleteProposalBtn");
    if (editBtn) editBtn.disabled = !enabled;
    if (deleteBtn) deleteBtn.disabled = !enabled;
}

function updateActionButtonsVisibility(project) {
    const actionsPanel = document.querySelector(".proposal-actions");
    if (!actionsPanel) return;

    if (!project) {
        actionsPanel.classList.add("hidden");
        setActionButtonsEnabled(false);
        return;
    }

    const canEditOrDelete = !canRevealSupervisor(project);
    actionsPanel.classList.toggle("hidden", !canEditOrDelete);
    setActionButtonsEnabled(canEditOrDelete);
}

function pickProjectData(payload) {
    if (!payload) return null;
    // Handle cases where API returns an array or a single object
    if (Array.isArray(payload)) return payload.length > 0 ? payload[0] : null;
    if (payload.value && Array.isArray(payload.value)) return payload.value[0];
    return payload;
}

function getSupervisorId(project) {
    return (
        project?.supervisorId ??
        project?.supervisorID ??
        project?.assignedSupervisorId ??
        project?.supervisor?.id ??
        project?.supervisor?.Id ??
        null
    );
}

function canRevealSupervisor(project) {
    const status = String(project?.status || "").toLowerCase();
    return status.includes("match") || status.includes("confirmed") || status.includes("reveal");
}

function updateSidebarFooter(project) {
    const titleEl = document.getElementById("sidebarFooterTitle");
    const textEl = document.getElementById("sidebarFooterText");
    if (!titleEl || !textEl) return;

    if (canRevealSupervisor(project)) {
        titleEl.innerText = "Supervisor Revealed";
        textEl.innerText = "Your proposal has been matched. Supervisor details are now visible.";
    } else {
        titleEl.innerText = "Blind Match Mode";
        textEl.innerText = "Supervisor details stay hidden until the proposal is matched.";
    }
}

function setProfileInfo(studentData) {
    const fullName = studentData?.fullName || readCookie("fullName") || "Student";
    const studentNumber = studentData?.studentNumber || readCookie("studentNumber") || "-";
    const researchArea = studentData?.researchArea || "Not Set";

    const nameEl = document.getElementById("profileName");
    const studentNoEl = document.getElementById("profileStudentNo");
    const areaEl = document.getElementById("profileArea");

    if (nameEl) nameEl.innerText = `Hi, ${fullName}`;
    if (studentNoEl) studentNoEl.innerText = `Student Number: ${studentNumber}`;
    if (areaEl) areaEl.innerText = `Research Area: ${researchArea}`;
}

async function fetchStudentProfile() {
    for (const id of candidateIds()) {
        try {
            const response = await fetch(`${STUDENT_API_BASE}/${encodeURIComponent(id)}`);
            if (!response.ok) continue;
            return await response.json();
        } catch (error) { console.warn("Student fetch failed", error); }
    }
    return null;
}

async function fetchProposal() {
    for (const id of candidateIds()) {
        try {
            const response = await fetch(`${PROJECT_API_BASE}/student/${encodeURIComponent(id)}`);
            if (!response.ok) continue;
            const data = await response.json();
            return pickProjectData(data);
        } catch (error) { console.warn("Proposal fetch failed", error); }
    }
    return null;
}

async function fetchSupervisor(supervisorId) {
    if (!supervisorId) return null;
    try {
        const response = await fetch(`${SUPERVISOR_API_BASE}/${encodeURIComponent(supervisorId)}`);
        return response.ok ? await response.json() : null;
    } catch (error) { return null; }
}

function renderChips(containerId, values) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let items = [];
    if (Array.isArray(values)) {
        items = values.map(v => (typeof v === 'object' ? (v.name || v.Name) : v));
    } else if (typeof values === "string") {
        items = values.split(",").map(part => part.trim());
    }

    const filteredItems = items.filter(Boolean);
    if (!filteredItems.length) {
        container.innerHTML = '<div class="empty">None assigned</div>';
        return;
    }

    container.innerHTML = filteredItems.map(item => `<span class="chip">${item}</span>`).join("");
}

function renderSupervisor(project, supervisor) {
    const supervisorPanel = document.getElementById("supervisorPanel");
    if (!supervisorPanel) return;

    if (!canRevealSupervisor(project)) {
        supervisorPanel.classList.add("hidden");
        return;
    }

    const name = supervisor?.fullName || supervisor?.name || project?.supervisorName || "Not Assigned";
    const email = supervisor?.email || project?.supervisorEmail || "-";
    const projectsCount = supervisor?.supervisedProjectsCount ?? project?.supervisedProjectsCount ?? "-";
    const researchAreas = supervisor?.researchAreas || project?.supervisorResearchAreas || [];

    supervisorPanel.classList.remove("hidden");

    document.getElementById("supervisorName") && (document.getElementById("supervisorName").innerText = name);
    document.getElementById("supervisorEmail") && (document.getElementById("supervisorEmail").innerText = email);
    renderChips("supervisorResearchAreas", researchAreas);
    document.getElementById("supervisorProjects") && (document.getElementById("supervisorProjects").innerText = projectsCount);
}

function renderProposal(project) {
    currentProposal = project || null;
    updateActionButtonsVisibility(project);

    const emptyState = document.getElementById("proposalEmptyState");
    if (!project) {
        setPageStatus("No proposal found.", "error");
        if (emptyState) emptyState.style.display = "block";
        document.getElementById("proposalTitle").innerText = "No proposal found";
        document.getElementById("proposalSubtitle").innerText = "Create a project proposal to continue.";
        document.getElementById("proposalId").innerText = "-";
        document.getElementById("proposalShort").innerText = "-";
        document.getElementById("proposalAbstract").innerText = "-";
        document.getElementById("proposalTech").innerText = "-";
        document.getElementById("proposalStatus").innerText = "-";
        document.getElementById("proposalBadge").innerText = "Proposal";
        document.getElementById("proposalCreated").innerText = "-";
        renderChips("proposalResearchAreas", []);
        renderChips("proposalTags", []);
        const supervisorPanel = document.getElementById("supervisorPanel");
        if (supervisorPanel) supervisorPanel.classList.add("hidden");
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    // Mapping data from Project API
    document.getElementById("proposalTitle").innerText = project.title || "Untitled";
    document.getElementById("proposalSubtitle").innerText = project.shortDescription || "";
    document.getElementById("proposalId").innerText = project.id || "-";
    document.getElementById("proposalShort").innerText = project.shortDescription || "-";
    document.getElementById("proposalAbstract").innerText = project.abstract || "-";
    document.getElementById("proposalTech").innerText = asText(project.techStack);
    document.getElementById("proposalStatus").innerText = project.status || "Pending";
    document.getElementById("proposalBadge").innerText = project.status || "Proposal";
    
    if (project.createdAt) {
        document.getElementById("proposalCreated").innerText = new Date(project.createdAt).toLocaleDateString();
    }

    renderChips("proposalResearchAreas", project.researchAreas);
    renderChips("proposalTags", project.tags);
    updateSidebarFooter(project);

    setPageStatus("Proposal details loaded.", "success");

    const supervisorPanel = document.getElementById("supervisorPanel");
    if (supervisorPanel) supervisorPanel.classList.add("hidden");

    if (canRevealSupervisor(project)) {
        const supervisorId = getSupervisorId(project) || 2;
        setPageStatus("Loading supervisor details...", "loading");
        fetchSupervisor(supervisorId).then(svData => {
            renderSupervisor(project, svData);
            setPageStatus("Supervisor details loaded.", "success");
        });
    } else {
        setPageStatus("Supervisor hidden until matched.", "success");
    }
}

async function deleteCurrentProposal() {
    if (!currentProposal?.id) return;
    if (canRevealSupervisor(currentProposal)) {
        setPageStatus("Matched projects cannot be deleted.", "error");
        return;
    }

    const ok = window.confirm("Are you sure you want to delete this project?");
    if (!ok) return;

    setActionButtonsEnabled(false);
    setPageStatus("Deleting project...", "loading");

    try {
        const studentId =
            currentProposal?.studentId ??
            currentProposal?.studentID ??
            sessionStorage.getItem("studentId") ??
            readCookie("userId");

        const deleteUrl = studentId
            ? `${PROJECT_API_BASE}/${encodeURIComponent(currentProposal.id)}?studentId=${encodeURIComponent(studentId)}`
            : `${PROJECT_API_BASE}/${encodeURIComponent(currentProposal.id)}`;

        const response = await fetch(deleteUrl, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        renderProposal(null);
        setPageStatus("Project deleted successfully.", "success");
    } catch (error) {
        setActionButtonsEnabled(true);
        setPageStatus("Failed to delete project.", "error");
    }
}

function editCurrentProposal() {
    if (!currentProposal?.id) return;
    if (canRevealSupervisor(currentProposal)) {
        setPageStatus("Matched projects cannot be edited.", "error");
        return;
    }
    sessionStorage.setItem("editProjectId", String(currentProposal.id));
    window.location.href = `edit_proposal.html?projectId=${encodeURIComponent(currentProposal.id)}`;
}

function setupProposalActions() {
    const editBtn = document.getElementById("editProposalBtn");
    const deleteBtn = document.getElementById("deleteProposalBtn");

    if (editBtn) editBtn.addEventListener("click", editCurrentProposal);
    if (deleteBtn) deleteBtn.addEventListener("click", deleteCurrentProposal);
}

async function initializeProposalPage() {
    if (!candidateIds().length) {
        window.location.href = "login.html";
        return;
    }

    setPageStatus("Loading...", "loading");
    const student = await fetchStudentProfile();
    setProfileInfo(student);

    const proposal = await fetchProposal();
    renderProposal(proposal);
}

document.addEventListener("DOMContentLoaded", initializeProposalPage);
document.addEventListener("DOMContentLoaded", setupProposalActions);
