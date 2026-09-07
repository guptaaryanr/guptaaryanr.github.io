// /assets/js/site.js
(function () {
    document.querySelectorAll('#year').forEach(el => { el.textContent = new Date().getFullYear(); });

    const btn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');
    const closeNav = () => {
        if (!btn) return;
        btn.setAttribute('aria-expanded', 'false');
        document.body.removeAttribute('data-nav-open');
    };

    if (btn && nav) {
        btn.addEventListener('click', () => {
            const open = btn.getAttribute('aria-expanded') !== 'true';
            btn.setAttribute('aria-expanded', String(open));
            if (open) document.body.setAttribute('data-nav-open', 'true');
            else document.body.removeAttribute('data-nav-open');
        });
        nav.addEventListener('click', (event) => {
            if (event.target instanceof HTMLAnchorElement) closeNav();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeNav();
        });
    }

    if (document.body.dataset.page !== 'home') return;

    const explore = document.querySelectorAll('.explore-layer');
    const read = document.querySelectorAll('.read-layer');
    const exploreNav = document.querySelector('.explore-nav');
    const readNav = document.querySelector('.read-nav');
    const exploreSkip = document.querySelector('.explore-skip');
    const readSkip = document.querySelector('.read-skip');
    const choices = document.querySelectorAll('[data-mode-choice]');

    const params = new URLSearchParams(window.location.search);
    const explicit = params.get('mode');
    let stored = null;
    try { stored = localStorage.getItem('aryan-site-mode'); } catch (_) {}
    let mode = explicit === 'read' || explicit === 'explore' ? explicit : (stored || 'explore');

    function setMode(next, { persist = true } = {}) {
        mode = next === 'read' ? 'read' : 'explore';
        document.body.dataset.siteMode = mode;
        explore.forEach(el => { el.hidden = mode !== 'explore'; });
        read.forEach(el => { el.hidden = mode !== 'read'; });
        if (exploreNav) exploreNav.hidden = mode !== 'explore';
        if (readNav) readNav.hidden = mode !== 'read';
        if (exploreSkip) exploreSkip.hidden = mode !== 'explore';
        if (readSkip) readSkip.hidden = mode !== 'read';
        choices.forEach(choice => {
            const active = choice.dataset.modeChoice === mode;
            if (choice.tagName === 'BUTTON') choice.setAttribute('aria-pressed', String(active));
        });
        closeNav();
        if (persist) {
            try { localStorage.setItem('aryan-site-mode', mode); } catch (_) {}
        }
        const url = new URL(window.location.href);
        url.searchParams.set('mode', mode);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
        window.dispatchEvent(new CustomEvent('site-mode-change', { detail: { mode } }));
    }

    choices.forEach(choice => {
        if (choice.tagName !== 'BUTTON') return;
        choice.addEventListener('click', () => {
            const next = choice.dataset.modeChoice;
            setMode(next);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    setMode(mode, { persist: Boolean(explicit) || Boolean(stored) });
})();
