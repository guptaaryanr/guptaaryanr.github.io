// Shared navigation and home-mode handling.
(() => {
    document.querySelectorAll('#year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');
    function closeMenu() {
        if (!toggle) return;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.removeAttribute('data-nav-open');
    }
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const shouldOpen = toggle.getAttribute('aria-expanded') !== 'true';
            toggle.setAttribute('aria-expanded', String(shouldOpen));
            toggle.setAttribute('aria-label', shouldOpen ? 'Close menu' : 'Open menu');
            if (shouldOpen) document.body.setAttribute('data-nav-open', 'true');
            else document.body.removeAttribute('data-nav-open');
        });
        nav.addEventListener('click', event => {
            if (event.target.closest('a')) closeMenu();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeMenu();
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 860) closeMenu();
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
    try { stored = localStorage.getItem('aryan-site-mode'); } catch (_) { /* Storage optional. */ }
    const initialMode = explicit === 'explore' || explicit === 'read'
        ? explicit
        : (stored === 'explore' || stored === 'read' ? stored : 'explore');

    function setMode(next, { persist = true, fromUser = false } = {}) {
        const mode = next === 'read' ? 'read' : 'explore';
        const active = document.activeElement;
        const focusWillDisappear = fromUser && active instanceof Element &&
            Boolean(active.closest(mode === 'read' ? '.explore-layer' : '.read-layer'));

        document.body.dataset.siteMode = mode;
        explore.forEach(el => { el.hidden = mode !== 'explore'; });
        read.forEach(el => { el.hidden = mode !== 'read'; });
        if (exploreNav) exploreNav.hidden = mode !== 'explore';
        if (readNav) readNav.hidden = mode !== 'read';
        if (exploreSkip) exploreSkip.hidden = mode !== 'explore';
        if (readSkip) readSkip.hidden = mode !== 'read';
        choices.forEach(choice => {
            if (choice.tagName === 'BUTTON') {
                choice.setAttribute('aria-pressed', String(choice.dataset.modeChoice === mode));
            }
        });
        closeMenu();
        if (persist) {
            try { localStorage.setItem('aryan-site-mode', mode); } catch (_) { /* Storage optional. */ }
        }
        const url = new URL(window.location.href);
        url.searchParams.set('mode', mode);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
        window.dispatchEvent(new CustomEvent('site-mode-change', { detail: { mode } }));

        if (focusWillDisappear) {
            const main = document.getElementById(mode === 'read' ? 'read-content' : 'explore-content');
            requestAnimationFrame(() => main?.focus({ preventScroll: true }));
        }
    }

    choices.forEach(choice => {
        if (choice.tagName !== 'BUTTON') return;
        choice.addEventListener('click', () => {
            setMode(choice.dataset.modeChoice, { fromUser: true });
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        });
    });

    setMode(initialMode, { persist: Boolean(explicit) || Boolean(stored) });
})();
