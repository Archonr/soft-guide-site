document.documentElement.classList.add('js');
(() => {
  const allowed = ['blue', 'midnight', 'glacier', 'amethyst', 'coral', 'sage'];
  let theme = new URLSearchParams(location.search).get('theme');
  if (!allowed.includes(theme)) {
    try { theme = localStorage.getItem('soft-guide-theme'); } catch {}
  }
  if (!allowed.includes(theme)) theme = document.documentElement.dataset.defaultTheme || 'blue';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('soft-guide-theme', theme); } catch {}
})();
