// /assets/js/site.js
(function () {
    document.querySelectorAll('#year').forEach(el => { el.textContent = new Date().getFullYear(); });

    const btn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');
    if (!btn || !nav) return;

    const closeNav = () => {
        btn.setAttribute('aria-expanded', 'false');
        document.body.removeAttribute('data-nav-open');
    };

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
})();
