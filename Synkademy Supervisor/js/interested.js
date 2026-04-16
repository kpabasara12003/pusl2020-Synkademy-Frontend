const BASE_URL = "http://localhost:5037/api";
let currentSupervisorId = null;
let allInterests = []; 
let currentProject = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  currentSupervisorId = user.id || user.supervisorId;
  const userNameEl = document.getElementById("userName");
  if (userNameEl) userNameEl.textContent = user.fullName || "Supervisor";

  document.getElementById("searchInput").addEventListener("input", handleSearch);

  await fetchInterests();
});

async function fetchInterests() {
  try {
    const res = await fetch(`${BASE_URL}/BlindReview/${currentSupervisorId}/interests`);
    if (!res.ok) throw new Error("Failed to load interested projects");
    
    allInterests = await res.json();
    renderBanners(allInterests);
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
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--sys-navy); font-style: italic;">No projects found in your interested list.</div>`;
    return;
  }

  projects.forEach(p => {
    const banner = document.createElement("div");
    banner.className = "interest-banner";
    banner.onclick = () => showDetailView(p.id);

    const chips = p.researchAreas.map(area => `<span class="area-chip">${area}</span>`).join("");
    const snippet = p.shortDescription ? p.shortDescription.substring(0, 100) + "..." : "No description.";

    banner.innerHTML = `
      <div>
        <div class="banner-title">${p.title}</div>
        <div class="banner-desc">${snippet}</div>
        <div>${chips}</div>
      </div>
      <div style="color: var(--sys-purple); font-size: 1.5rem; font-weight: bold;">→</div>
    `;
    container.appendChild(banner);
  });
}

// 3. Live Search Filter
function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  
  const filtered = allInterests.filter(p => {
    const matchTitle = (p.title || "").toLowerCase().includes(term);
    const matchTech = (p.techStack || "").toLowerCase().includes(term);
    const matchArea = p.researchAreas.some(area => area.toLowerCase().includes(term));
    return matchTitle || matchTech || matchArea;
  });

  renderBanners(filtered);
}

// 4. View Toggling
async function showDetailView(id) {
  document.getElementById("list-view").style.display = "none";
  document.getElementById("detail-view").style.display = "block";
  
  document.getElementById("detail-title").textContent = "Loading details...";
  document.getElementById("detail-desc").textContent = "Please wait...";
  document.getElementById("detail-tech").textContent = "";
  document.getElementById("detail-areas").innerHTML = "";

  try {
    const res = await fetch(`${BASE_URL}/BlindReview/project/${id}`);
    if (!res.ok) throw new Error("Failed to load project details");
    
    currentProject = await res.json();

    document.getElementById("detail-title").textContent = currentProject.title;
    document.getElementById("detail-desc").textContent = currentProject.shortDescription || "No short description provided.";
    document.getElementById("detail-abstract").textContent = currentProject.abstract || "No abstract provided.";
    document.getElementById("detail-tech").textContent = currentProject.techStack || "None specified.";

    if (currentProject.createdAt) {
        const dateObj = new Date(currentProject.createdAt);
        document.getElementById("detail-date").textContent = "Submitted: " + dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
        document.getElementById("detail-date").textContent = "";
    }
    
    if (currentProject.researchAreas && currentProject.researchAreas.length > 0) {
        document.getElementById("detail-areas").innerHTML = currentProject.researchAreas
          .map(area => `<span class="area-chip">${area}</span>`).join("");
    } else {
        document.getElementById("detail-areas").innerHTML = "";
    }

    if (currentProject.tags && currentProject.tags.length > 0) {
        document.getElementById("detail-tags").innerHTML = currentProject.tags
          .map(tag => `<span style="background: #f1f5f9; color: var(--sys-navy); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 6px; display: inline-block;">#${tag}</span>`).join("");
    } else {
        document.getElementById("detail-tags").innerHTML = "";
    }

  } catch (err) {
    console.error(err);
    document.getElementById("detail-title").textContent = "Error Loading Project";
    document.getElementById("detail-desc").textContent = "There was an issue retrieving this project's details from the server.";
  }
}

function showListView() {
  currentProject = null;
  document.getElementById("detail-view").style.display = "none";
  document.getElementById("list-view").style.display = "block";
  

  const matchBtn = document.getElementById("matchBtn");
  matchBtn.innerText = "Confirm Match";
  matchBtn.disabled = false;
}


async function confirmMatch() {
  const matchBtn = document.getElementById("matchBtn");
  matchBtn.innerText = "Assigning...";
  matchBtn.disabled = true;

  try {
    const res = await fetch(`${BASE_URL}/BlindReview/${currentSupervisorId}/assign/${currentProject.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error("Failed to assign project");

    alert("Match confirmed successfully! You can now view the student's details in the Assigned Projects tab.");
    
    await fetchInterests(); 
    showListView();

  } catch (err) {
    alert("Error: " + err.message);
    matchBtn.innerText = "Confirm Match";
    matchBtn.disabled = false;
  }
}