const theme = document.documentElement.dataset.theme;
document.querySelectorAll('[data-theme-choice]').forEach(link => {
  const selected = link.dataset.themeChoice === theme;
  link.setAttribute('aria-current', String(selected));
  const url = new URL(location.href);
  url.searchParams.set('theme', link.dataset.themeChoice);
  link.href = url.href;
});
// Keep the selected design across pages even with file:// previews or storage disabled.
document.querySelectorAll('a[href]').forEach(link => {
  if (link.hasAttribute('data-theme-choice')) return;
  const href = link.getAttribute('href');
  if (!/^[\w-]+\.html(?:[?#]|$)/.test(href)) return;
  const url = new URL(link.href);
  url.searchParams.set('theme', theme);
  link.href = url.href;
});
document.querySelectorAll('img[data-brand-mark]').forEach(img => {
  img.src = `assets/mark-${theme}.svg`;
});
const favicon = document.querySelector('link[rel="icon"]');
if (favicon) favicon.href = `assets/mark-${theme}.svg`;
const themeMeta = document.querySelector('meta[name="theme-color"]');
if (themeMeta) themeMeta.content = {blue:'#172b4a',midnight:'#11151b',sage:'#203c32'}[theme];

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
