document.addEventListener('DOMContentLoaded', () => {
  const navContainer = document.getElementById('nav-container');
  if (!navContainer) return;

  fetch('../components/sidebar.html')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load sidebar');
      return res.text();
    })
    .then(html => {
      navContainer.innerHTML = html;

      const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
      document.querySelectorAll('.sv-nav-link').forEach(link => {
        if (link.dataset.nav === currentPage) {
          link.classList.add('sv-nav-active');
        }
      });

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
      }
    })
    .catch(err => console.error('Sidebar load error:', err));
});