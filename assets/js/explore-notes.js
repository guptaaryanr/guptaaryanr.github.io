// /assets/js/explore-notes.js
(function () {
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
                'ThermoBench checks physical consistency in pure-fluid EOS surrogates. The motivating VLE study involved a mixture, so the current benchmark does not claim to solve that original problem.'
            ],
            href: 'research.html?mode=read#tb-title'
        },
        trajectory: {
            eyebrow: 'Featured work / nonlinear dynamics',
            title: 'Trajectory only regime detection',
            body: [
                'The paper tests full-state trajectories from two deterministic benchmark families across ordered parameter sweeps. The detector sees no governing equations, regime labels, or model-specific transition definitions.',
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
