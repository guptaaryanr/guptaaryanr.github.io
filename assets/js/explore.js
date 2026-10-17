// /assets/js/explore.js
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Topographic field. The cursor behaves like a very weak local force.
    const terrain = document.getElementById('terrain-canvas');
    const hero = document.getElementById('field-study');
    let pointer = { x: 0.68, y: 0.42, active: false };
    if (terrain && hero) {
        const ctx = terrain.getContext('2d');
        let w = 0, h = 0, dpr = 1;
        const contours = [
            { cx: .18, cy: .30, rx: .24, ry: .18, phase: .7 },
            { cx: .82, cy: .22, rx: .28, ry: .19, phase: 1.8 },
            { cx: .68, cy: .73, rx: .36, ry: .26, phase: 2.7 },
            { cx: .14, cy: .78, rx: .23, ry: .20, phase: 4.1 }
        ];
        function resizeTerrain() {
            const rect = hero.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = rect.width; h = rect.height;
            terrain.width = Math.max(1, Math.floor(w * dpr));
            terrain.height = Math.max(1, Math.floor(h * dpr));
            terrain.style.width = w + 'px'; terrain.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawTerrain();
        }
        function drawLoop(c, level) {
            const steps = 110, scale = 1 + level * .12;
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const a = i / steps * Math.PI * 2;
                const wobble = 1 + .045 * Math.sin(a * 3 + c.phase) + .025 * Math.sin(a * 7 - c.phase * 1.7);
                let x = (c.cx + Math.cos(a) * c.rx * scale * wobble) * w;
                let y = (c.cy + Math.sin(a) * c.ry * scale * wobble) * h;
                if (pointer.active && !reduceMotion) {
                    const px = pointer.x * w, py = pointer.y * h;
                    const dx = x - px, dy = y - py, dist = Math.max(30, Math.hypot(dx, dy));
                    const push = Math.max(0, 82 - dist) * .055;
                    x += dx / dist * push; y += dy / dist * push;
                }
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        function drawTerrain() {
            ctx.clearRect(0, 0, w, h);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(38,48,56,.105)';
            contours.forEach(c => { for (let i = 0; i < 8; i++) drawLoop(c, i); });
        }
        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            pointer = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, active: true };
            drawTerrain();
        });
        hero.addEventListener('pointerleave', () => { pointer.active = false; drawTerrain(); });
        window.addEventListener('resize', resizeTerrain);
        window.addEventListener('site-mode-change', event => { if (event.detail?.mode === 'explore') requestAnimationFrame(resizeTerrain); });
        resizeTerrain();
    }

    // Damped compass needle that points toward the pointer.
    const needle = document.getElementById('compass-needle');
    const compass = document.querySelector('.field-compass');
    if (needle && compass && !reduceMotion) {
        let target = 0, angle = 0, velocity = 0;
        window.addEventListener('pointermove', e => {
            const r = compass.getBoundingClientRect();
            target = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 90;
        });
        let running = false;
        const active = () => !document.hidden && document.body.dataset.siteMode === 'explore';
        function tick() {
            if (!active()) { running = false; return; }
            const delta = ((target - angle + 540) % 360) - 180;
            velocity += delta * .025; velocity *= .84; angle += velocity;
            needle.style.transform = `rotate(${angle}deg)`;
            requestAnimationFrame(tick);
        }
        function resume() {
            if (active() && !running) { running = true; requestAnimationFrame(tick); }
        }
        document.addEventListener('visibilitychange', resume);
        window.addEventListener('site-mode-change', resume);
        resume();
    }

    // A little paper movement, not a 3D scene.
    document.querySelectorAll('[data-tilt]').forEach(card => {
        if (reduceMotion) return;
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            card.style.transform = `rotateX(${(-y * 2.4).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg) rotate(-1.2deg)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform = 'rotate(-1.2deg)'; });
    });

    // Draw the route as the reader moves through it and update the current waypoint.
    const trailWorld = document.querySelector('.trail-world');
    const trailProgress = document.getElementById('trail-route-progress');
    const trailCurrent = document.getElementById('trail-current');
    const trailStages = [...document.querySelectorAll('[data-trail-stage]')];
    if (trailWorld && trailProgress) {
        let routeLength = 0, ticking = false;
        function prepareRoute() {
            routeLength = trailProgress.getTotalLength();
            trailProgress.style.strokeDasharray = String(routeLength);
            trailProgress.style.strokeDashoffset = String(routeLength);
            updateRoute();
        }
        function updateRoute() {
            ticking = false;
            const rect = trailWorld.getBoundingClientRect();
            const viewport = window.innerHeight;
            const travelled = Math.min(Math.max(viewport * .48 - rect.top, 0), rect.height);
            const progress = rect.height > 0 ? travelled / rect.height : 0;
            trailProgress.style.strokeDashoffset = String(routeLength * (1 - progress));
        }
        function requestRouteUpdate() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(updateRoute);
        }
        window.addEventListener('scroll', requestRouteUpdate, { passive: true });
        window.addEventListener('resize', () => { prepareRoute(); });
        window.addEventListener('site-mode-change', event => { if (event.detail?.mode === 'explore') requestAnimationFrame(prepareRoute); });
        requestAnimationFrame(prepareRoute);
    }

    if (trailStages.length) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                entry.target.classList.toggle('is-active', entry.isIntersecting);
            });
            const visible = trailStages
                .map(stage => ({ stage, rect: stage.getBoundingClientRect() }))
                .filter(item => item.rect.bottom > window.innerHeight * .28 && item.rect.top < window.innerHeight * .68)
                .sort((a, b) => Math.abs(a.rect.top - window.innerHeight * .42) - Math.abs(b.rect.top - window.innerHeight * .42))[0];
            if (visible && trailCurrent) trailCurrent.textContent = visible.stage.dataset.trailLabel || '';
        }, { threshold: [0, .15, .35, .6] });
        trailStages.forEach(stage => observer.observe(stage));
    }


})();
