const BASE_URL = "http://localhost:5037/api";
let currentSupervisorId = null;
let debounceTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  currentSupervisorId = user.id || user.supervisorId;
  const userNameEl = document.getElementById("userName");
  if (userNameEl) userNameEl.textContent = user.fullName || "Supervisor";

  document.getElementById("searchInput").addEventListener("input", (e) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
          fetchAssigned(e.target.value);
      }, 300);
  });

  await fetchAssigned();
});

async function fetchAssigned(searchQuery = "") {
  try {
    let url = `${BASE_URL}/BlindReview/${currentSupervisorId}/assigned`;
    if (searchQuery.trim() !== "") {
        url += `?search=${encodeURIComponent(searchQuery)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load assigned projects");
    
    const projects = await res.json();
    renderBanners(projects);
  } catch (err) {
    console.error(err);
    document.getElementById("banners-container").innerHTML = `
      <div style="text-align:center; padding: 40px; color: red;">Error loading data.</div>
    `;
  }
}

function renderBanners(projects) {
  const container = document.getElementById("banners-container");
  container.innerHTML = "";

  if (projects.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--sys-navy); font-style: italic;">No assigned projects found.</div>`;
    return;
  }

  projects.forEach(p => {
    const banner = document.createElement("div");
    banner.className = "assigned-banner";
    banner.onclick = () => showDetailView(p.id);

    const chips = p.researchAreas.map(area => `<span class="area-chip">${area}</span>`).join("");
    
    banner.innerHTML = `
      <div>
        <div class="banner-title">${p.title}</div>
        <div class="student-badge">👤 ${p.student?.fullName || "Unknown Student"} (${p.student?.studentNumber || "N/A"})</div>
        <div>${chips}</div>
      </div>
      <div style="color: var(--sys-green-light); font-size: 1.5rem; font-weight: bold;">→</div>
    `;
    container.appendChild(banner);
  });
}

async function showDetailView(id) {
  document.getElementById("list-view").style.display = "none";
  document.getElementById("detail-view").style.display = "block";
  
  document.getElementById("detail-title").textContent = "Loading details...";
  document.getElementById("student-name").textContent = "Loading...";

  try {
    const res = await fetch(`${BASE_URL}/BlindReview/assigned/${id}/details`);
    if (!res.ok) throw new Error("Failed to load details");
    
    const project = await res.json();

    document.getElementById("detail-title").textContent = project.title;
    document.getElementById("detail-abstract").textContent = project.abstract || project.shortDescription || "None provided.";
    document.getElementById("detail-tech").textContent = project.techStack || "None specified.";
    
    if (project.researchAreas) {
        document.getElementById("detail-areas").innerHTML = project.researchAreas
          .map(area => `<span class="area-chip">${area}</span>`).join("");
    }

    if (project.student) {
        document.getElementById("student-name").textContent = project.student.fullName;
        document.getElementById("student-number").textContent = "ID: " + project.student.studentNumber;
        document.getElementById("student-email").textContent = project.student.email || "No email provided";
        
        document.getElementById("student-initial").textContent = project.student.fullName.charAt(0).toUpperCase();
    }

  } catch (err) {
    console.error(err);
    document.getElementById("detail-title").textContent = "Error Loading Project";
  }
}

function showListView() {
  document.getElementById("detail-view").style.display = "none";
  document.getElementById("list-view").style.display = "block";
}