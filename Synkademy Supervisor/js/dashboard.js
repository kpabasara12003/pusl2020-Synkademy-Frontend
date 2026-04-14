const BASE_URL = "http://localhost:5037/api";
let currentSupervisorId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  currentSupervisorId = user.id || user.supervisorId;
  const userNameEl = document.getElementById("userName");
  if (userNameEl) userNameEl.textContent = user.fullName || "Supervisor";

  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const areasRes = await fetch(`${BASE_URL}/Supervisor/${currentSupervisorId}/research-areas`);
    if (!areasRes.ok) throw new Error("Failed to load your research areas");
    const supervisorAreas = await areasRes.json();

    if (supervisorAreas.length === 0) {
        document.getElementById("researchAreaChart").innerHTML = `
            <div style="text-align:center; padding: 40px; color: var(--sv-gray-600); font-style: italic;">
                You haven't selected any research areas yet.<br>
                Please update your Expertise to see analytics.
            </div>`;
        return;
    }

    const areaCounts = {};
    supervisorAreas.forEach(area => {
        areaCounts[area.name] = 0; 
    });

    const projRes = await fetch(`${BASE_URL}/BlindReview/${currentSupervisorId}/projects`);
    if (!projRes.ok) throw new Error("Failed to load project data");
    const projects = await projRes.json();
    
    document.getElementById("stat-relevant").textContent = projects.length;

    projects.forEach(project => {
        project.researchAreas.forEach(area => {
            if (areaCounts.hasOwnProperty(area)) {
                areaCounts[area] += 1;
            }
        });
    });

    const chartCategories = Object.keys(areaCounts);
    const chartData = Object.values(areaCounts);

    renderChart(chartCategories, chartData);

    try {
        const intRes = await fetch(`${BASE_URL}/BlindReview/${currentSupervisorId}/interests`);
        if (intRes.ok) {
            const interests = await intRes.json();
            document.getElementById("stat-interested").textContent = interests.length;
        }
    } catch(err) {
        console.error("Could not load interests for stats", err);
    }

    try {
        const assignRes = await fetch(`${BASE_URL}/BlindReview/${currentSupervisorId}/assigned`);
        if (assignRes.ok) {
            const assigned = await assignRes.json();
            document.getElementById("stat-assigned").textContent = assigned.length;
        }
    } catch(err) {
        console.error("Could not load assigned for stats", err);
    }

  } catch (err) {
    console.error("Dashboard error:", err);
    document.getElementById("researchAreaChart").innerHTML = `
      <p style="color: red; text-align: center;">Unable to load chart data. Ensure the backend is running.</p>
    `;
  }
}

function renderChart(categories, data) {
    const maxDataValue = Math.max(...data, 1); 

    const options = {
        series: [{
            name: 'Available Projects',
            data: data
        }],
        chart: {
            type: 'bar',
            height: 350,
            fontFamily: 'Inter, sans-serif',
            toolbar: {
                show: false 
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true, 
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: categories,
            labels: {
                formatter: function (val) {
                    return Math.floor(val);
                }
            },
            tickAmount: maxDataValue < 5 ? maxDataValue : 5 
        },
        colors: ['#4CB963'], // --sys-green-light
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4,
        }
    };

    const chartContainer = document.querySelector("#researchAreaChart");
    chartContainer.innerHTML = "";
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}