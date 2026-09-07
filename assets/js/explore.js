// /assets/js/explore.js
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Atlas waypoints
    document.querySelectorAll('[data-scroll-target]').forEach(button => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.scrollTarget);
            if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        });
    });

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
            ctx.setTransform(dpr,0,0,dpr,0,0);
            drawTerrain(performance.now());
        }

        function drawLoop(c, level, now) {
            const steps = 110;
            const scale = 1 + level * .12;
            ctx.beginPath();
            for (let i=0;i<=steps;i++) {
                const a = i/steps * Math.PI*2;
                const wobble = 1 + .045*Math.sin(a*3+c.phase) + .025*Math.sin(a*7-c.phase*1.7);
                let x = (c.cx + Math.cos(a)*c.rx*scale*wobble) * w;
                let y = (c.cy + Math.sin(a)*c.ry*scale*wobble) * h;
                if (pointer.active && !reduceMotion) {
                    const px = pointer.x*w, py = pointer.y*h;
                    const dx=x-px, dy=y-py; const dist=Math.max(30,Math.hypot(dx,dy));
                    const push=Math.max(0, 82-dist)*.055;
                    x += dx/dist*push; y += dy/dist*push;
                }
                if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            }
            ctx.stroke();
        }

        function drawTerrain(now) {
            ctx.clearRect(0,0,w,h);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(38,48,56,.105)';
            contours.forEach(c => { for(let i=0;i<8;i++) drawLoop(c,i,now); });
        }
        hero.addEventListener('pointermove', e => {
            const r=hero.getBoundingClientRect(); pointer={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,active:true}; drawTerrain(performance.now());
        });
        hero.addEventListener('pointerleave', () => { pointer.active=false; drawTerrain(performance.now()); });
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
            const r=compass.getBoundingClientRect();
            target = Math.atan2(e.clientY-(r.top+r.height/2), e.clientX-(r.left+r.width/2))*180/Math.PI + 90;
        });
        function tick() {
            let delta = ((target-angle+540)%360)-180;
            velocity += delta*.025;
            velocity *= .84;
            angle += velocity;
            needle.style.transform = `rotate(${angle}deg)`;
            requestAnimationFrame(tick);
        }
        tick();
    }

    // Very restrained photo parallax.
    document.querySelectorAll('[data-tilt]').forEach(card => {
        if (reduceMotion) return;
        card.addEventListener('pointermove', e => {
            const r=card.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5;
            card.style.transform = `rotateX(${(-y*2.4).toFixed(2)}deg) rotateY(${(x*3).toFixed(2)}deg) rotate(-1.2deg)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform='rotate(-1.2deg)'; });
    });

    // WaveSleuth toy
    const waveCanvas = document.getElementById('wave-toy');
    const waveFire = document.getElementById('wave-fire');
    const waveShuffle = document.getElementById('wave-shuffle');
    if (waveCanvas && waveFire && waveShuffle) {
        const ctx=waveCanvas.getContext('2d');
        const source={x:.15,y:.52};
        const receivers=[.18,.31,.44,.57,.70,.83].map(y=>({x:.88,y}));
        let anomaly={x:.61,y:.47,r:.09};
        let pulseStart=-1, raf=0;
        const palette={ink:'#17202a',muted:'#70808a',warm:'#8d4d38',accent:'#31506e',paper:'#f8f5ee',line:'#cfc9bd'};
        function dims(){return {w:waveCanvas.width,h:waveCanvas.height};}
        function drawWave(now=0){
            const {w,h}=dims(); ctx.clearRect(0,0,w,h); ctx.fillStyle=palette.paper; ctx.fillRect(0,0,w,h);
            // simple layered medium
            const bands=[{y:.18,c:'#ebe7dd'},{y:.37,c:'#dedbd2'},{y:.58,c:'#d0d2cd'},{y:.78,c:'#bcc4c5'}];
            bands.forEach((b,idx)=>{ctx.beginPath();ctx.moveTo(0,b.y*h);for(let x=0;x<=w;x+=12){const y=(b.y+.025*Math.sin(x/85+idx*1.2))*h;ctx.lineTo(x,y);}ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle=b.c;ctx.fill();});
            ctx.fillStyle='rgba(141,77,56,.62)';ctx.beginPath();ctx.ellipse(anomaly.x*w,anomaly.y*h,anomaly.r*w,anomaly.r*h*.72,.3,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=palette.warm;ctx.beginPath();ctx.arc(source.x*w,source.y*h,7,0,Math.PI*2);ctx.fill();
            receivers.forEach(r=>{ctx.fillStyle=palette.accent;ctx.beginPath();ctx.moveTo(r.x*w,r.y*h-6);ctx.lineTo(r.x*w-6,r.y*h+5);ctx.lineTo(r.x*w+6,r.y*h+5);ctx.closePath();ctx.fill();});
            if(pulseStart>0){const t=(now-pulseStart)/1000;const maxR=w*.92;const rr=t*205;for(let j=0;j<3;j++){const r=rr-j*34;if(r>0&&r<maxR){ctx.strokeStyle=`rgba(141,77,56,${Math.max(0,.48-r/maxR*.42)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(source.x*w,source.y*h,r,0,Math.PI*2);ctx.stroke();}}
                if(t>1.7){ctx.strokeStyle='rgba(49,80,110,.78)';ctx.setLineDash([7,6]);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(anomaly.x*w+7,anomaly.y*h-3,anomaly.r*w*1.08,anomaly.r*h*.8,.28,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
                if(t<2.4) raf=requestAnimationFrame(drawWave); else pulseStart=-1;
            }
        }
        waveFire.addEventListener('click',()=>{cancelAnimationFrame(raf);pulseStart=performance.now();drawWave(pulseStart);});
        waveShuffle.addEventListener('click',()=>{anomaly={x:.38+Math.random()*.32,y:.30+Math.random()*.37,r:.065+Math.random()*.045};drawWave();});
        drawWave();
    }

    // Trajectory toy
    const trajSlider=document.getElementById('trajectory-param');
    const trajPath=document.getElementById('trajectory-path');
    const trajScore=document.getElementById('trajectory-score');
    const trajStatus=document.getElementById('trajectory-status');
    const trajOut=document.getElementById('trajectory-param-output');
    const boundary=document.getElementById('trajectory-boundary');
    if(trajSlider&&trajPath){
        function updateTrajectory(){
            const v=Number(trajSlider.value)/100; const pts=[]; const amp=22+v*62; const freq=4.2+v*7.5; const drift=v>.52 ? (v-.52)*80 : 0;
            for(let i=0;i<=180;i++){const x=42+i/180*635;const phase=i/180*Math.PI*2*freq;const y=170 + Math.sin(phase)*amp*(.42+.58*i/180) - drift*(i/180);pts.push(`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`);}
            trajPath.setAttribute('d',pts.join(' '));
            const score=1/(1+Math.exp(-(v-.54)*13));trajScore.textContent=score.toFixed(2);trajOut.textContent=(.18+v*.48).toFixed(2);
            trajStatus.textContent=score<.42?'nothing interesting yet':score<.68?'something is moving':'structural change picked up';
            boundary.style.opacity=score>.54?'1':'.18';
        }
        trajSlider.addEventListener('input',updateTrajectory);updateTrajectory();
    }

    // ThermoBench toy
    const thermoSlider=document.getElementById('thermo-distortion');
    const thermoOut=document.getElementById('thermo-distortion-output');
    const thermoSurrogate=document.getElementById('thermo-surrogate');
    if(thermoSlider&&thermoSurrogate){
        const checks=[['c1',45],['c2',78],['c3',32],['c4',61]];
        function updateThermo(){
            const v=Number(thermoSlider.value);thermoOut.textContent=v+'%';const pts=[];
            for(let i=0;i<=120;i++){const x=35+i/120*650;const base=150-(i/120)*116+18*Math.sin(i/120*Math.PI*1.5);const distortion=(v/100)*(22*Math.sin(i/9)+Math.max(0,i-68)*.5);const y=base+distortion;pts.push(`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`);}
            thermoSurrogate.setAttribute('d',pts.join(' '));
            checks.forEach(([id,th])=>{const el=document.querySelector(`[data-check="${id}"]`);const failed=v>=th;el.classList.toggle('failed',failed);el.querySelector('i').textContent=failed?'fail':'pass';});
        }
        thermoSlider.addEventListener('input',updateThermo);updateThermo();
    }

    // Costgate toy
    const costSlider=document.getElementById('cost-increase');
    const costOut=document.getElementById('cost-increase-output');
    const candidateCost=document.getElementById('candidate-cost');
    const build=document.getElementById('build-verdict');
    if(costSlider&&build){
        function updateCost(){const pct=Number(costSlider.value);costOut.textContent=pct+'%';candidateCost.textContent='$'+(1+pct/100).toFixed(2);const verdict=pct<8?'PASS':pct<=10?'WARN':'FAIL';build.className='build-verdict '+verdict.toLowerCase();build.querySelector('strong').textContent=verdict;}
        costSlider.addEventListener('input',updateCost);updateCost();
    }

    // A tiny optional Lights Out style puzzle.
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
        openPuzzle.addEventListener('click',()=>{puzzle.hidden=!puzzle.hidden;openPuzzle.textContent=puzzle.hidden?'Take a small detour':'Close the detour';if(!puzzle.hidden&&cells.length===0)resetPuzzle();});
        reset.addEventListener('click',resetPuzzle);
    }
})();
