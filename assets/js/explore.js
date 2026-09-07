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
        function tick() {
            const delta = ((target - angle + 540) % 360) - 180;
            velocity += delta * .025; velocity *= .84; angle += velocity;
            needle.style.transform = `rotate(${angle}deg)`;
            requestAnimationFrame(tick);
        }
        tick();
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

    // WaveSleuth toy.
    const waveCanvas = document.getElementById('wave-toy');
    const waveFire = document.getElementById('wave-fire');
    const waveShuffle = document.getElementById('wave-shuffle');
    if (waveCanvas && waveFire && waveShuffle) {
        const ctx = waveCanvas.getContext('2d');
        const source = { x: .15, y: .52 };
        const receivers = [.18, .31, .44, .57, .70, .83].map(y => ({ x: .88, y }));
        let anomaly = { x: .61, y: .47, r: .09 };
        let pulseStart = -1, raf = 0;
        const palette = { warm:'#8d4d38', accent:'#31506e', paper:'#f8f5ee' };
        function drawWave(now = 0) {
            const w = waveCanvas.width, h = waveCanvas.height;
            ctx.clearRect(0, 0, w, h); ctx.fillStyle = palette.paper; ctx.fillRect(0, 0, w, h);
            const bands = [{y:.18,c:'#ebe7dd'},{y:.37,c:'#dedbd2'},{y:.58,c:'#d0d2cd'},{y:.78,c:'#bcc4c5'}];
            bands.forEach((b, idx) => { ctx.beginPath();ctx.moveTo(0,b.y*h);for(let x=0;x<=w;x+=12){const y=(b.y+.025*Math.sin(x/85+idx*1.2))*h;ctx.lineTo(x,y);}ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle=b.c;ctx.fill(); });
            ctx.fillStyle='rgba(141,77,56,.62)';ctx.beginPath();ctx.ellipse(anomaly.x*w,anomaly.y*h,anomaly.r*w,anomaly.r*h*.72,.3,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=palette.warm;ctx.beginPath();ctx.arc(source.x*w,source.y*h,7,0,Math.PI*2);ctx.fill();
            receivers.forEach(r => { ctx.fillStyle=palette.accent;ctx.beginPath();ctx.moveTo(r.x*w,r.y*h-6);ctx.lineTo(r.x*w-6,r.y*h+5);ctx.lineTo(r.x*w+6,r.y*h+5);ctx.closePath();ctx.fill(); });
            if (pulseStart > 0) {
                const t=(now-pulseStart)/1000,maxR=w*.92,rr=t*205;
                for(let j=0;j<3;j++){const r=rr-j*34;if(r>0&&r<maxR){ctx.strokeStyle=`rgba(141,77,56,${Math.max(0,.48-r/maxR*.42)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(source.x*w,source.y*h,r,0,Math.PI*2);ctx.stroke();}}
                if(t>1.7){ctx.strokeStyle='rgba(49,80,110,.78)';ctx.setLineDash([7,6]);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(anomaly.x*w+7,anomaly.y*h-3,anomaly.r*w*1.08,anomaly.r*h*.8,.28,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
                if(t<2.4) raf=requestAnimationFrame(drawWave); else pulseStart=-1;
            }
        }
        waveFire.addEventListener('click',()=>{cancelAnimationFrame(raf);pulseStart=performance.now();drawWave(pulseStart);});
        waveShuffle.addEventListener('click',()=>{anomaly={x:.38+Math.random()*.32,y:.30+Math.random()*.37,r:.065+Math.random()*.045};drawWave();});
        drawWave();
    }

    // Trajectory toy.
    const trajSlider=document.getElementById('trajectory-param');
    const trajPath=document.getElementById('trajectory-path');
    const trajScore=document.getElementById('trajectory-score');
    const trajStatus=document.getElementById('trajectory-status');
    const trajOut=document.getElementById('trajectory-param-output');
    const boundary=document.getElementById('trajectory-boundary');
    if(trajSlider&&trajPath){
        function updateTrajectory(){
            const v=Number(trajSlider.value)/100,pts=[],amp=22+v*62,freq=4.2+v*7.5,drift=v>.52?(v-.52)*80:0;
            for(let i=0;i<=180;i++){const x=42+i/180*635,phase=i/180*Math.PI*2*freq,y=170+Math.sin(phase)*amp*(.42+.58*i/180)-drift*(i/180);pts.push(`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`);}
            trajPath.setAttribute('d',pts.join(' '));
            const score=1/(1+Math.exp(-(v-.54)*13));trajScore.textContent=score.toFixed(2);trajOut.textContent=(.18+v*.48).toFixed(2);
            trajStatus.textContent=score<.42?'nothing interesting yet':score<.68?'something is moving':'structural change picked up';boundary.style.opacity=score>.54?'1':'.18';
        }
        trajSlider.addEventListener('input',updateTrajectory);updateTrajectory();
    }

    // ThermoBench toy.
    const thermoSlider=document.getElementById('thermo-distortion');
    const thermoOut=document.getElementById('thermo-distortion-output');
    const thermoSurrogate=document.getElementById('thermo-surrogate');
    if(thermoSlider&&thermoSurrogate){
        const checks=[['c1',45],['c2',78],['c3',32],['c4',61]];
        function updateThermo(){
            const v=Number(thermoSlider.value);thermoOut.textContent=v+'%';const pts=[];
            for(let i=0;i<=120;i++){const x=35+i/120*650,base=150-(i/120)*116+18*Math.sin(i/120*Math.PI*1.5),distortion=(v/100)*(22*Math.sin(i/9)+Math.max(0,i-68)*.5),y=base+distortion;pts.push(`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`);}
            thermoSurrogate.setAttribute('d',pts.join(' '));
            checks.forEach(([id,th])=>{const el=document.querySelector(`[data-check="${id}"]`),failed=v>=th;el.classList.toggle('failed',failed);el.querySelector('i').textContent=failed?'fail':'pass';});
        }
        thermoSlider.addEventListener('input',updateThermo);updateThermo();
    }

    // Costgate toy.
    const costSlider=document.getElementById('cost-increase');
    const costOut=document.getElementById('cost-increase-output');
    const candidateCost=document.getElementById('candidate-cost');
    const build=document.getElementById('build-verdict');
    if(costSlider&&build){
        function updateCost(){const pct=Number(costSlider.value);costOut.textContent=pct+'%';candidateCost.textContent='$'+(1+pct/100).toFixed(2);const verdict=pct<8?'PASS':pct<=10?'WARN':'FAIL';build.className='build-verdict '+verdict.toLowerCase();build.querySelector('strong').textContent=verdict;}
        costSlider.addEventListener('input',updateCost);updateCost();
    }

    // Tiny optional Lights Out detour.
    const openPuzzle=document.getElementById('open-puzzle');
    const puzzle=document.getElementById('lights-puzzle');
    const grid=puzzle?.querySelector('.puzzle-grid');
    const reset=document.getElementById('reset-puzzle');
    const status=document.getElementById('puzzle-status');
    if(openPuzzle&&puzzle&&grid){
        let cells=[];
        function render(){grid.innerHTML='';cells.forEach((on,i)=>{const b=document.createElement('button');b.type='button';b.className='puzzle-light'+(on?' on':'');b.setAttribute('aria-label',`Light ${i+1} ${on?'on':'off'}`);b.addEventListener('click',()=>toggle(i));grid.appendChild(b);});status.textContent=cells.some(Boolean)?'Turn them all off.':'There it is.';}
        function toggle(i){const x=i%3,y=Math.floor(i/3);[[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy;if(nx>=0&&nx<3&&ny>=0&&ny<3){const n=ny*3+nx;cells[n]=!cells[n];}});render();}
        function resetPuzzle(){cells=[true,false,true,false,true,false,true,true,false];render();}
        openPuzzle.addEventListener('click',()=>{puzzle.hidden=!puzzle.hidden;openPuzzle.textContent=puzzle.hidden?'See what this does':'Put it away';if(!puzzle.hidden&&cells.length===0)resetPuzzle();});
        reset.addEventListener('click',resetPuzzle);
    }


    // Explore links open a short field note first. The detailed Read page is a deliberate second step.
    const exploreNoteDialog = document.getElementById('explore-note-dialog');
    const exploreNoteTitle = document.getElementById('explore-note-title');
    const exploreNoteEyebrow = document.getElementById('explore-note-eyebrow');
    const exploreNoteBody = document.getElementById('explore-note-body');
    const exploreNoteLearn = document.getElementById('explore-note-learn');
    const exploreNoteStay = document.getElementById('explore-note-stay');
    const exploreNotes = {
        circuits: {
            eyebrow: 'Ann Arbor / one branch',
            title: 'Circuits',
            body: [
                'Circuits were part coursework, part teaching, and part of learning to trust the bench as much as the equation. I later taught EECS 314, running discussions and labs on everything from RLC transients to op amps.',
                'It was one of the earlier places where the abstract model and the physical thing on the table had to agree.'
            ],
            href: 'work.html?mode=read#research-teaching'
        },
        quadcopters: {
            eyebrow: 'Ann Arbor / BIRDS Lab',
            title: 'Quadcopters',
            body: [
                'At BIRDS Lab I worked on an adaptable quadcopter platform. That meant telemetry links, embedded electronics, power boards, flight control, and debugging whichever layer was currently upsetting the others.',
                'It was messy systems work, which is probably why I liked it.'
            ],
            href: 'work.html?mode=read#research-teaching'
        },
        nanosatellites: {
            eyebrow: 'Ann Arbor / MiTEE',
            title: 'Nanosatellites',
            body: [
                'MiTEE was my first proper research project. The team was studying electrodynamic tether propulsion for tiny satellites, and I worked around the plasma and structures interface, thermodynamic analysis, and electronics prototyping.',
                'I mostly remember discovering how quickly a clean idea becomes an interface problem once several disciplines touch it.'
            ],
            href: 'work.html?mode=read#research-teaching'
        },
        architecture: {
            eyebrow: 'Ann Arbor / computer architecture',
            title: 'An out of order processor',
            body: [
                'A MIPS R10K style superscalar core in SystemVerilog, with caches, a load store queue, branch recovery, precise exceptions, some baseline SMT, and a visual debugger because bringing it up without one was miserable.',
                'This is the sort of project I mean when I say I tend to learn by building the whole thing.'
            ],
            href: 'research.html?mode=read#engineering-projects'
        },
        embedded: {
            eyebrow: 'Ann Arbor / embedded systems',
            title: 'Small machines, lots of plumbing',
            body: [
                'The older embedded work includes an STM32 longboard remote and a two robot follower system built around Nucleo boards, vision, ultrasonic sensing, and PID control.',
                'None of it is what I work on now. I still like that it existed in the world and had to behave.'
            ],
            href: 'research.html?mode=read#engineering-projects'
        },
        startups: {
            eyebrow: 'Ann Arbor / another branch',
            title: 'Startups before I knew much about startups',
            body: [
                'I co built HelixCases, a technical recruiting competition platform that reached students across twenty universities. I also spent time around StartUM, including mentoring an early stage team through the point where the original market stopped making sense.',
                'Useful mostly because it made “someone should build this” feel very different from actually finding someone who cares.'
            ],
            href: 'work.html?mode=read#entrepreneurship-service'
        },
        'older-builds': {
            eyebrow: 'Ann Arbor / archive',
            title: 'The older builds',
            body: [
                'Longboard remote. Follower robots. Processor architecture. Satellite work. They are not the center of the portfolio anymore, but I do not want to erase the earlier layers just because the current work is different.',
                'The Read side keeps the full record.'
            ],
            href: 'research.html?mode=read#engineering-projects'
        },
        houston: {
            eyebrow: 'Houston / 2023 to 2026',
            title: 'Three roles that kept bleeding together',
            body: [
                'Most of my Technip time was applied physics R&D for carbon capture, especially molecular simulation, analysis, HPC, and carrying atomistic results into larger scale models. Later I moved into instrumentation and controls while helping build an internal AI initiative across the Americas.',
                'On paper those are separate jobs. In practice the interesting part was usually at the boundary between them.'
            ],
            href: 'work.html?mode=read#industry'
        },
        thermobench: {
            eyebrow: 'Featured work / scientific ML',
            title: 'ThermoBench',
            body: [
                'This came out of a model that looked decent by ordinary prediction error and then fell apart when a VLE solver asked for the shape and derivatives of the learned thermodynamic surface.',
                'ThermoBench is a small set of physical consistency checks meant to catch that kind of failure before the surrogate gets trusted downstream.'
            ],
            href: 'research.html?mode=read#tb-title'
        },
        trajectory: {
            eyebrow: 'Featured work / nonlinear dynamics',
            title: 'Trajectory only regime detection',
            body: [
                'The detector only gets trajectories across an ordered parameter sweep. It does not get the governing equations, regime labels, or the model specific transition definition.',
                'The question is whether structural change leaves enough evidence in the trajectories themselves to recover a meaningful boundary.'
            ],
            href: 'research.html?mode=read#traj-title'
        },
        wavesleuth: {
            eyebrow: 'Featured work / inverse problems',
            title: 'WaveSleuth',
            body: [
                'I wanted to learn Devito properly, so I built a small inverse problem around it. Hide a structure in a two dimensional acoustic medium, collect sparse observations, and try to reconstruct what you cannot see.',
                'The released playground includes several acquisition geometries, inversion baselines, blind challenges, active sensing, uncertainty summaries, and scoring.'
            ],
            href: 'research.html?mode=read#wavesleuth-title'
        },
        costgate: {
            eyebrow: 'Featured work / evaluation tooling',
            title: 'Costgate',
            body: [
                'An LLM system can get materially more expensive while every ordinary functional test still passes. Costgate treats cost as another thing CI is allowed to call a regression.',
                'The real tool compares baseline and candidate runs under explicit policies for cost, valid success, tokens, latency, repeat variability, and significance.'
            ],
            href: 'research.html?mode=read#costgate-title'
        },
        archive: {
            eyebrow: 'Off trail / older layers',
            title: 'The archive',
            body: [
                'The site keeps the older projects because I want a record of the trail, not a portfolio that quietly rewrites the past every time my interests change.',
                'The Read side has the engineering projects and the rest of the longer record.'
            ],
            href: 'research.html?mode=read#engineering-projects'
        }
    };

    function closeExploreNote() {
        if (exploreNoteDialog?.open) exploreNoteDialog.close();
    }

    if (exploreNoteDialog && exploreNoteTitle && exploreNoteBody && exploreNoteLearn) {
        document.querySelectorAll('.explore-layer a[data-explore-key]').forEach(link => {
            link.addEventListener('click', event => {
                if (document.body.dataset.siteMode !== 'explore') return;
                const note = exploreNotes[link.dataset.exploreKey];
                if (!note) return;
                event.preventDefault();
                exploreNoteEyebrow.textContent = note.eyebrow || 'Field note';
                exploreNoteTitle.textContent = note.title;
                exploreNoteBody.replaceChildren(...note.body.map(text => {
                    const p = document.createElement('p');
                    p.textContent = text;
                    return p;
                }));
                exploreNoteLearn.href = note.href || link.href;
                exploreNoteDialog.showModal();
            });
        });
        exploreNoteStay?.addEventListener('click', closeExploreNote);
        exploreNoteDialog.addEventListener('click', event => {
            if (event.target === exploreNoteDialog) closeExploreNote();
        });
        window.addEventListener('site-mode-change', closeExploreNote);
    }

})();
