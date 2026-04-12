document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth();
  if (!user) return;

  const userNameEl = document.getElementById("userName");
  if (userNameEl) userNameEl.textContent = user.fullName || "Supervisor";

  const stats = {
    interested: 12,
    assigned: 5
  };

  const statInt = document.getElementById('stat-int');
  const statAssign = document.getElementById('stat-assign');

  if (statInt) statInt.textContent = stats.interested;
  if (statAssign) statAssign.textContent = stats.assigned;
});