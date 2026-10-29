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

// Work page: filter case studies by topic. Without JavaScript every study stays visible.
const filter = document.querySelector('[data-filter]');
if (filter) {
  const cards = [...document.querySelectorAll('[data-topics]')];
  const empty = document.querySelector('[data-filter-empty]');
  const select = (topic) => {
    filter.querySelectorAll('[data-topic]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === topic)));
    let shown = 0;
    cards.forEach(card => {
      const match = !topic || card.dataset.topics.split(' ').includes(topic);
      card.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown > 0;
  };
  filter.hidden = false;
  filter.addEventListener('click', (event) => {
    const button = event.target.closest('[data-topic]');
    if (!button) return;
    select(button.dataset.topic);
    const url = new URL(location.href);
    if (button.dataset.topic) url.searchParams.set('topic', button.dataset.topic); else url.searchParams.delete('topic');
    try { history.replaceState(null, '', url); } catch {}
  });
  const initial = new URLSearchParams(location.search).get('topic');
  if (initial && filter.querySelector(`[data-topic="${CSS.escape(initial)}"]`)) select(initial);
}

// Work page: read a case study in place. A plain click opens the reader; a modified click,
// a middle click or no JavaScript follows the link to the full page as usual.
const reader = document.querySelector('[data-reader]');
if (reader && typeof reader.showModal === 'function') {
  const body = reader.querySelector('[data-reader-body]');
  const full = reader.querySelector('[data-reader-full]');
  const steps = reader.querySelectorAll('[data-reader-step]');
  let current = null;
  let returnFocus = null;
  const visible = () => [...document.querySelectorAll('.case-grid [data-case]')].filter(card => !card.hidden).map(card => card.dataset.case);
  const show = (slug, history_ = 'push') => {
    const template = document.querySelector(`[data-case-template="${CSS.escape(slug)}"]`);
    if (!template) return;
    current = slug;
    body.replaceChildren(template.content.cloneNode(true));
    const page = new URL(`work-${slug}.html`, location.href);
    page.searchParams.set('theme', document.documentElement.dataset.theme);
    full.href = page.href;
    const order = visible();
    const index = order.indexOf(slug);
    steps.forEach(button => {
      const target = order[index + Number(button.dataset.readerStep)];
      button.disabled = index < 0 || !target;
    });
    if (!reader.open) reader.showModal();
    body.focus({preventScroll: true});
    reader.scrollTop = 0;
    const url = new URL(location.href);
    url.hash = slug;
    try {
      if (history_ === 'push') history.pushState({reader: slug}, '', url);
      else if (history_ === 'replace') history.replaceState({reader: slug}, '', url);
    } catch {}
  };
  const close = (fromHistory = false) => {
    if (!reader.open) return;
    reader.close();
    current = null;
    returnFocus?.focus();
    if (!fromHistory) {
      if (history.state?.reader) history.back();
      else try { history.replaceState(null, '', location.pathname + location.search); } catch {}
    }
  };
  document.querySelector('.case-grid')?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-case]');
    if (!card || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    returnFocus = card;
    show(card.dataset.case);
  });
  steps.forEach(button => button.addEventListener('click', () => {
    const order = visible();
    const target = order[order.indexOf(current) + Number(button.dataset.readerStep)];
    if (target) show(target, 'replace');
  }));
  reader.querySelector('[data-reader-close]').addEventListener('click', () => close());
  reader.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  reader.addEventListener('click', (event) => { if (event.target === reader) close(); });
  reader.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft') reader.querySelector('[data-reader-step="-1"]').click();
    if (event.key === 'ArrowRight') reader.querySelector('[data-reader-step="1"]').click();
  });
  window.addEventListener('popstate', () => {
    const slug = location.hash.slice(1);
    if (slug && document.querySelector(`[data-case-template="${CSS.escape(slug)}"]`)) show(slug, 'none');
    else close(true);
  });
  const initial = location.hash.slice(1);
  if (initial && document.querySelector(`[data-case-template="${CSS.escape(initial)}"]`)) {
    returnFocus = document.querySelector(`[data-case="${CSS.escape(initial)}"]`);
    show(initial, 'replace');
  }
}
