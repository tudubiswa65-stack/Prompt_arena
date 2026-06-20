(() => {
  'use strict';

  const ROUTES = {
    home:      { path: '/',           slug: 'home',       style: 'styles.css',     scripts: ['script.js'] },
    prompts:   { path: '/prompts',    slug: 'prompts',    style: 'prompt.css',     scripts: [] },
    tools:     { path: '/tools',      slug: 'tools',      style: 'tools.css',      scripts: ['tools.js'] },
    assets:    { path: '/assets',     slug: 'assets',     style: 'assets.css',     scripts: ['script.js'] },
    blog:      { path: '/blog',       slug: 'blog',       style: 'blog.css',       scripts: ['script.js', 'blog.js'] },
    about:     { path: '/about',      slug: 'about',      style: 'about.css',      scripts: ['about.js'] },
    contact:   { path: '/contact',    slug: 'contact',    style: 'contact.css',    scripts: ['contact.js'] },
    faq:       { path: '/faq',        slug: 'faq',        style: 'faq.css',        scripts: ['faq.js'] },
    privacy:   { path: '/privacy',    slug: 'privacy',    style: 'privacy.css',    scripts: ['privacy.js'] },
    terms:     { path: '/terms',      slug: 'terms',      style: 'terms.css',      scripts: ['terms.js'] },
    disclaimer:{ path: '/disclaimer', slug: 'disclaimer', style: 'disclaimer.css', scripts: ['disclaimer.js'] }
  };

  const PATH_ALIASES = {
    '/': ROUTES.home,
    '/home': ROUTES.home,
    '/index': ROUTES.home,
    '/index.html': ROUTES.home,
    '/home.html': ROUTES.home,
    '/prompt': ROUTES.prompts,
    '/prompts': ROUTES.prompts,
    '/prompt.html': ROUTES.prompts,
    '/prompts.html': ROUTES.prompts,
    '/tools': ROUTES.tools,
    '/tools.html': ROUTES.tools,
    '/assets': ROUTES.assets,
    '/assets.html': ROUTES.assets,
    '/blog': ROUTES.blog,
    '/blog.html': ROUTES.blog,
    '/about': ROUTES.about,
    '/about.html': ROUTES.about,
    '/contact': ROUTES.contact,
    '/contact.html': ROUTES.contact,
    '/faq': ROUTES.faq,
    '/faq.html': ROUTES.faq,
    '/privacy': ROUTES.privacy,
    '/privacy.html': ROUTES.privacy,
    '/terms': ROUTES.terms,
    '/terms.html': ROUTES.terms,
    '/disclaimer': ROUTES.disclaimer,
    '/disclaimer.html': ROUTES.disclaimer
  };

  const FILE_TO_ROUTE = {
    'index.html': '/',
    'home.html': '/',
    'prompt.html': '/prompts',
    'prompts.html': '/prompts',
    'tools.html': '/tools',
    'assets.html': '/assets',
    'blog.html': '/blog',
    'about.html': '/about',
    'contact.html': '/contact',
    'faq.html': '/faq',
    'privacy.html': '/privacy',
    'terms.html': '/terms',
    'disclaimer.html': '/disclaimer'
  };

  const TEXT_TO_ROUTE = {
    'home': '/',
    'prompts': '/prompts',
    'tools': '/tools',
    'assets': '/assets',
    'blog': '/blog',
    'about': '/about',
    'about us': '/about',
    'contact': '/contact',
    'faq': '/faq',
    'privacy policy': '/privacy',
    'terms': '/terms',
    'terms of service': '/terms',
    'disclaimer': '/disclaimer'
  };

  const SCRIPT_INIT_MAP = {
    'script.js': 'home',
    'blog.js': 'blog',
    'about.js': 'about',
    'tools.js': 'tools',
    'faq.js': 'faq',
    'privacy.js': 'privacy',
    'terms.js': 'terms',
    'disclaimer.js': 'disclaimer',
    'contact.js': 'contact'
  };

  const loadedScripts = new Set();
  let currentPath = null;

  const container = document.getElementById('spa-content');
  const loader = document.getElementById('spa-loader');
  const descriptionMeta = document.querySelector('meta[name="description"]');

  if (!container || !loader || !descriptionMeta) return;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function normalizePath(pathname) {
    if (!pathname) return '/';
    let out = pathname.trim();
    if (!out.startsWith('/')) out = `/${out}`;
    out = out.replace(/\/+$/, '');
    return out || '/';
  }

  function findRoute(pathname) {
    return PATH_ALIASES[normalizePath(pathname)] || ROUTES.home;
  }

  function inferPathFromLink(anchor) {
    const rawHref = (anchor.getAttribute('href') || '').trim();
    if (!rawHref) return null;

    if (rawHref.startsWith('#')) {
      if (rawHref.length > 1) return null;
      const textPath = TEXT_TO_ROUTE[(anchor.textContent || '').trim().toLowerCase()];
      return textPath || null;
    }

    if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return null;

    if (/^https?:\/\//i.test(rawHref)) {
      try {
        const url = new URL(rawHref, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        return findRoute(url.pathname).path;
      } catch {
        return null;
      }
    }

    const normalizedFile = rawHref.replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
    if (FILE_TO_ROUTE[normalizedFile]) return FILE_TO_ROUTE[normalizedFile];

    const textPath = TEXT_TO_ROUTE[(anchor.textContent || '').trim().toLowerCase()];
    if (textPath) return textPath;

    try {
      const url = new URL(rawHref, window.location.origin);
      return findRoute(url.pathname).path;
    } catch {
      return null;
    }
  }

  function normalizeLinks(scope) {
    scope.querySelectorAll('a[href]').forEach((anchor) => {
      const routePath = inferPathFromLink(anchor);
      if (!routePath) return;
      anchor.setAttribute('href', routePath);
      anchor.dataset.spaLink = 'true';
    });
  }

  function setActiveLinks(path) {
    const normalized = normalizePath(path);
    document.querySelectorAll('a.active, a.nav-active, a.footer-active').forEach((a) => {
      a.classList.remove('active', 'nav-active', 'footer-active');
    });

    document.querySelectorAll('a[data-spa-link="true"]').forEach((anchor) => {
      const target = findRoute(anchor.getAttribute('href') || '/').path;
      if (target !== normalized) return;
      anchor.classList.add('active');
      if (anchor.classList.contains('nav-link')) anchor.classList.add('nav-active');
      if (anchor.closest('.footer')) anchor.classList.add('footer-active');
    });
  }

  function setPageMeta(route) {
    const pageRoot = container.querySelector('.spa-page');
    const title = pageRoot?.dataset.title || 'IdeanaX';
    const description = pageRoot?.dataset.description || 'IdeanaX content page.';
    document.title = title;
    descriptionMeta.setAttribute('content', description);
    container.dataset.page = route.slug;
  }

  function setPageStyle(href) {
    const link = document.getElementById('page-style');
    if (link && link.getAttribute('href') !== href) {
      link.setAttribute('href', href);
    }
  }

  async function ensureScript(src) {
    if (loadedScripts.has(src)) return false;

    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    loadedScripts.add(src);
    return true;
  }

  async function runPageScripts(route) {
    for (const src of route.scripts) {
      const wasNew = await ensureScript(src);
      const initKey = SCRIPT_INIT_MAP[src];
      const init = window.PageInitializers?.[initKey];
      if (!wasNew && typeof init === 'function') {
        init();
      }
    }
  }

  async function render(route, options = {}) {
    const { pushState = true, replaceState = false, scrollTop = true } = options;

    loader.classList.add('is-visible');
    container.classList.add('is-fading-out');
    await wait(120);

    if (route.path !== currentPath) {
      const response = await fetch(`pages/${route.slug}.html`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load route ${route.slug}`);
      const markup = await response.text();
      container.innerHTML = markup;
      normalizeLinks(container);
    }

    setPageStyle(route.style);
    setPageMeta(route);
    setActiveLinks(route.path);

    await runPageScripts(route);

    if (pushState) history.pushState({ path: route.path }, '', route.path);
    else if (replaceState) history.replaceState({ path: route.path }, '', route.path);

    currentPath = route.path;

    if (scrollTop) window.scrollTo({ top: 0, behavior: 'auto' });

    container.classList.remove('is-fading-out');
    container.classList.add('is-fading-in');
    setTimeout(() => container.classList.remove('is-fading-in'), 220);
    loader.classList.remove('is-visible');
  }

  async function navigateTo(path, options = {}) {
    const route = findRoute(path);
    try {
      await render(route, options);
    } catch (error) {
      console.error(error);
      loader.classList.remove('is-visible');
      container.classList.remove('is-fading-out');
    }
  }

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;
    if (anchor.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const routePath = inferPathFromLink(anchor);
    if (!routePath) return;

    event.preventDefault();
    navigateTo(routePath, { pushState: true, scrollTop: true });
  });

  window.addEventListener('popstate', () => {
    navigateTo(window.location.pathname, { pushState: false, replaceState: false, scrollTop: false });
  });

  async function boot() {
    normalizeLinks(container);
    const route = findRoute(window.location.pathname);

    if (route.path === '/') {
      currentPath = route.path;
      setPageStyle(route.style);
      setPageMeta(route);
      setActiveLinks(route.path);
      history.replaceState({ path: route.path }, '', route.path);
      await runPageScripts(route);
      return;
    }

    await navigateTo(route.path, { pushState: false, replaceState: true, scrollTop: false });
  }

  boot();
})();
