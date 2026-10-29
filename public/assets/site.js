function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('[data-set-theme]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.setTheme === theme));
  });
  document.querySelectorAll('img[data-brand-mark]').forEach(img => {
    img.src = `assets/layers-${theme}.svg`;
  });
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) favicon.href = `assets/layers-${theme}.svg`;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = {blue:'#172b4a',glacier:'#101722'}[theme];
  // Preserve the choice across pages even when browser storage is unavailable.
  document.querySelectorAll('a[href]').forEach(link => {
    if (link.getAttribute('href').startsWith('#')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('.html')) return;
    url.searchParams.set('theme', theme);
    link.href = url.href;
  });
  try { localStorage.setItem('soft-guide-theme', theme); } catch {}
}
applyTheme(document.documentElement.dataset.theme);
document.querySelectorAll('[data-set-theme]').forEach(button => {
  button.addEventListener('click', () => {
    const theme = button.dataset.setTheme;
    applyTheme(theme);
    // Reloads should retain a new choice even if this page had a theme URL.
    const url = new URL(location.href);
    url.searchParams.set('theme', theme);
    try { history.replaceState(null, '', url); } catch {}
  });
});

const menu = document.querySelector('[data-menu]');
const navigation = document.querySelector('#navigation');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    menu.focus();
  }
});
document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
const form = document.querySelector('[data-inquiry]');
if (form) {
  const ids = ['aws', 'kubernetes', 'security', 'automation'];
  const selected = ids.indexOf(new URLSearchParams(location.search).get('service'));
  if (selected >= 0) form.elements.service.selectedIndex = selected;
}
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = new FormData(form);
  const subject = `Soft Guide inquiry: ${values.get('service')}`;
  const body = `Name: ${values.get('name')}\nReply email: ${values.get('email')}\n\n${values.get('message')}`;
  const link = document.querySelector('[data-email-draft]');
  link.href = `mailto:${form.dataset.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  link.hidden = false;
  document.querySelector('[data-form-status]').textContent = 'Your email draft is ready. Open it below, review it, and send it from your email app. Nothing has been sent by this website.';
});
