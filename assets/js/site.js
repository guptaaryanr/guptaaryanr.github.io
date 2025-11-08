// /assets/js/site.js
(function () {
    const y = new Date().getFullYear();
    const yearEls = document.querySelectorAll('#year');
    yearEls.forEach(el => el.textContent = y);

    // Mobile nav toggle
    const btn = document.querySelector('.nav-toggle');
    if (btn) {
        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!expanded));
            document.body.setAttribute('data-nav-open', String(!expanded));
        });
    }

    // Close nav when a link is clicked (small screens)
    const nav = document.getElementById('primary-nav');
    if (nav) {
        nav.addEventListener('click', (e) => {
            const target = e.target;
            if (target instanceof HTMLElement && target.tagName === 'A') {
                document.body.removeAttribute('data-nav-open');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            }
        });
    }
})();
