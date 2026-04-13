const BASE_URL = "http://localhost:5037/api";

let selectedResearchAreas = [];
let selectedTags = [];

/* =========================
   LOAD DATA
========================= */
window.onload = async () => {
    checkAuth();
    await loadResearchAreas();
    await loadTags();
};

/* =========================
   LOAD RESEARCH AREAS
========================= */
async function loadResearchAreas() {
    const res = await fetch(`${BASE_URL}/ResearchAreas`);
    const data = await res.json();

    const container = document.getElementById("researchAreas");

    data.forEach(item => {
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.innerText = item.name;

        chip.onclick = () => {
            chip.classList.toggle("active");

            if (selectedResearchAreas.includes(item.id)) {
                selectedResearchAreas =
                    selectedResearchAreas.filter(i => i !== item.id);
            } else {
                selectedResearchAreas.push(item.id);
            }
        };

        container.appendChild(chip);
    });
}

/* =========================
   LOAD TAGS
========================= */
async function loadTags() {
    const res = await fetch(`${BASE_URL}/Tags`);
    const data = await res.json();

    const container = document.getElementById("tags");

    data.forEach(item => {
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.innerText = item.name;

        chip.onclick = () => {
            chip.classList.toggle("active");

            if (selectedTags.includes(item.id)) {
                selectedTags = selectedTags.filter(i => i !== item.id);
            } else {
                selectedTags.push(item.id);
            }
        };

        container.appendChild(chip);
    });
}

/* =========================
   SUBMIT PROJECT
========================= */
async function submitProject() {
    const studentId = getCookie("userId");

    const title = document.getElementById("title").value.trim();
    const shortDesc = document.getElementById("shortDesc").value.trim();
    const abstract = document.getElementById("abstract").value.trim();
    const techStack = document.getElementById("techStack").value.trim();

    if (!studentId) {
        showToast("Session expired. Login again.", "error");
        return;
    }

    if (!title || !shortDesc || !abstract) {
        showToast("Fill all required fields", "error");
        return;
    }

    const payload = {
        studentId: parseInt(studentId),
        title: title,
        shortDescription: shortDesc,
        abstract: abstract,
        techStack: techStack,
        proposalFilePath: "",
        researchAreas: selectedResearchAreas,
        tags: selectedTags
    };

    try {
        const res = await fetch(`${BASE_URL}/Projects/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("Project submitted successfully 🚀", "success");
            resetForm();
        } else {
            const text = await res.text();
            showToast(text, "error");
        }

    } catch (err) {
        showToast("Server error", "error");
        console.error(err);
    }
}

/* =========================
   TOAST
========================= */
function showToast(msg, type) {
    const toast = document.getElementById("toast");
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

/* =========================
   RESET
========================= */
function resetForm() {
    document.getElementById("title").value = "";
    document.getElementById("shortDesc").value = "";
    document.getElementById("abstract").value = "";
    document.getElementById("techStack").value = "";

    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));

    selectedResearchAreas = [];
    selectedTags = [];
}