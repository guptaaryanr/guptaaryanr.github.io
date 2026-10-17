#!/usr/bin/env python3
"""Apply the October 2026 portfolio refresh to the checked-out site.

The updater uses guarded replacements and writes only if every required pattern
matches. This keeps the existing design/source rather than regenerating it.
"""
from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent
PAGES = ['index.html', 'research.html', 'work.html', 'cv.html', '404.html']
TEXT_FILES = [*PAGES, '.gitignore', 'assets/css/site.css', 'assets/js/explore.js', 'assets/js/site.js']
contents: dict[str, str] = {}
counts: dict[str, int] = {}


def change(path: str, old: str, new: str, count: int = 1) -> None:
    s = contents[path]
    n = s.count(old)
    if n != count:
        raise RuntimeError(f'{path}: expected {count} copy/copies of {old[:90]!r}; found {n}. No files changed.')
    contents[path] = s.replace(old, new)
    counts[path] = counts.get(path, 0) + 1


def change_first(path: str, old: str, new: str, expected_occurrences: int = 2) -> None:
    s = contents[path]
    n = s.count(old)
    if n != expected_occurrences:
        raise RuntimeError(f'{path}: expected {expected_occurrences} occurrence(s) of {old[:90]!r}; found {n}. No files changed.')
    contents[path] = s.replace(old, new, 1)
    counts[path] = counts.get(path, 0) + 1


def insert_after(path: str, needle: str, insertion: str) -> None:
    change(path, needle, needle + insertion)


def add_meta(path: str, label: str, blurb: str, canonical: str, kind: str = 'website') -> None:
    base = 'https://guptaaryanr.github.io/'
    def esc(s: str) -> str:
        return html.escape(s, quote=True)
    meta = f'''    <link rel="canonical" href="{base + canonical}" />
    <meta property="og:type" content="{kind}" />
    <meta property="og:site_name" content="Aryan Gupta" />
    <meta property="og:title" content="{esc(label)}" />
    <meta property="og:description" content="{esc(blurb)}" />
    <meta property="og:url" content="{base + canonical}" />
    <meta property="og:image" content="{base}assets/img/social-card.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Aryan Gupta: applied physics, scientific computing and research engineering" />
    <meta name="twitter:card" content="summary_large_image" />
'''
    if path == 'index.html':
        # Existing homepage canonical must not be duplicated.
        change(path, '    <link rel="canonical" href="https://guptaaryanr.github.io/" />\n', '')
    change(path, '</head>', meta + '</head>')


def apply_content() -> None:
    # A no-JavaScript visit shows the complete Read version. With JavaScript, the
    # initial Explore state retains the current design and persisted mode behaviour.
    change('index.html', '<html lang="en">', '<html lang="en" class="no-js">')
    change('index.html', '<script defer src="assets/js/explore.js"></script>',
           '<script defer src="assets/js/explore.js"></script>\n    <script defer src="assets/js/explore-instruments.js"></script>\n    <script defer src="assets/js/explore-notes.js"></script>')
    change('index.html', '<head>\n', "<head>\n    <script>document.documentElement.classList.replace('no-js', 'js');</script>\n")
    change('index.html',
           '<noscript><style>.explore-layer,.explore-nav{display:none!important}.read-layer,.read-nav{display:block!important}</style></noscript>',
           '<noscript><style>.no-js .explore-layer,.no-js .explore-nav{display:none!important}.no-js .read-layer,.no-js .read-nav{display:block!important}.no-js .mode-switch,.no-js .nav-toggle{display:none!important}</style></noscript>')
    change('index.html', '<div class="read-layer" hidden>', '<div class="read-layer">')
    change('index.html', '<a class="skip-link read-skip" href="#read-content" hidden>', '<a class="skip-link read-skip" href="#read-content">')
    change('index.html', '<nav class="site-nav explore-nav" aria-label="Explore navigation"><ul><li><a href="#trail">Trail</a></li><li><a href="#work-trail">Work</a></li><li><a href="#london">London</a></li></ul></nav>',
           '<nav class="site-nav explore-nav" aria-label="Explore navigation"><ul><li><a href="#trail">Trail</a></li><li><a href="#work-trail">Work</a></li><li><a href="#london">London</a></li><li><a href="research.html?mode=read">Research</a></li><li><a href="cv.html?mode=read">CV</a></li></ul></nav>')
    change('index.html',
           '<div class="field-actions"><a href="#trail" class="trail-link">Start walking <span aria-hidden="true">↓</span></a><button type="button" class="plain-mode-link" data-mode-choice="read">Or skip to the detailed version</button></div>',
           '<div class="field-actions"><a href="#trail" class="trail-link">Start walking <span aria-hidden="true">↓</span></a><button type="button" class="plain-mode-link" data-mode-choice="read">Or skip to the detailed version</button></div>\n                    <nav class="field-shortcuts" aria-label="Quick links"><a href="research.html?mode=read">Research &amp; software ↗</a><a href="assets/cv/Aryan-Gupta-CV.pdf" target="_blank" rel="noopener">CV (PDF) ↗</a><a href="mailto:guptaaryanr@gmail.com">Email ↗</a></nav>')
    change('index.html', '<p class="trail-eyebrow">London / next</p>', '<p class="trail-eyebrow">London / now</p>')
    change('index.html', '<h2>Nothing plotted past this point yet.</h2>', '<h2>This bit is still being drawn.</h2>')
    change('index.html',
           '<p>MSc Applied Computational Science &amp; Engineering at Imperial. I know what I am going there to learn. I care a lot about where it goes after that. The rest is still blank, and I would rather leave it blank than pretend otherwise.</p>',
           '<p>I am at Imperial now, studying Applied Computational Science &amp; Engineering. I wanted to spend a year learning the mathematics and numerical methods behind the scientific software I had been building on the job. Where that work goes next is still taking shape.</p>')
    change('index.html', '<span class="profile-label">Next</span>', '<span class="profile-label">Now</span>')
    change('index.html', '<p class="kicker">Applied physicist · research engineer</p>', '<p class="kicker">Applied physicist · research engineer · Imperial MSc ACSE</p>')
    change('index.html', '<div class="hero-actions" aria-label="Primary links"><a class="text-link strong" href="research.html">See the work <span aria-hidden="true">↗</span></a><a class="text-link" href="cv.html">CV</a></div>',
           '<div class="hero-actions" aria-label="Primary links"><a class="text-link strong" href="research.html?mode=read">See the work <span aria-hidden="true">↗</span></a><a class="text-link" href="cv.html?mode=read">CV</a><a class="text-link" href="mailto:guptaaryanr@gmail.com">Email</a></div>')
    change('index.html', 'I’m going to Imperial because scientific computing is the part I’ve mostly taught myself sideways through all of this, and I want a year where it is the main subject instead of the thing I learn because a problem forces me to.',
           'I came to Imperial because scientific computing is what I had mostly taught myself sideways through all of this. I wanted a year where it was the main subject, not the thing I learned because a problem forced me to.')
    change('index.html', 'It grew into a fairly complete little research toy.',
           'It grew into a versioned testbed with blind challenges and reconstruction scoring.')
    change('index.html', '<p>Could you notice that a dynamical system had changed qualitatively if all you got were the trajectories? No equations. No regime labels. I kept the answer key away from the detector and made the question testable.</p>',
           '<p>Could you detect a structural change from trajectories alone? I tested that question on two deterministic systems, without giving the detector their equations or regime labels. The boundary comparisons happen afterward.</p>')
    change('index.html', '<p>I wanted to learn Devito properly, so I made myself build a small inverse problem end to end. Hide something in a 2D medium, fire waves through it, and try to reconstruct what you cannot see.</p>',
           '<p>I built a reproducible inverse-wave playground on Devito, with sparse observations, inversion baselines, blind challenges, and scoring. It began as a way to learn the framework by making something end to end.</p>')

    # Demo labels describe what the JavaScript really does, not the full projects.
    change('index.html', '<div class="instrument-slider"><label for="thermo-distortion">surface distortion',
           '<p class="demo-disclaimer">A sketch, not a thermodynamic test. The four verdicts change at illustrative thresholds.</p><div class="instrument-slider"><label for="thermo-distortion">illustrative surface distortion')
    change('index.html', '<div class="check-row" id="thermo-checks">', '<div class="check-row" id="thermo-checks" role="group" aria-label="Illustrative test verdicts, not computed physical results">')
    change('index.html', '<div class="instrument-slider"><label for="trajectory-param">parameter',
           '<p class="demo-disclaimer">This trace and its score are drawn for illustration. The research detector runs on computed trajectories.</p><div class="instrument-slider"><label for="trajectory-param">illustrative parameter')
    change('index.html', '<span>trajectory only score</span>', '<span>illustrative shape index</span>')
    change('index.html', '<strong id="trajectory-score">0.18</strong><em id="trajectory-status">nothing interesting yet</em>',
           '<strong id="trajectory-score" aria-live="polite">0.18</strong><em id="trajectory-status">low</em>')
    change('index.html', '<canvas id="wave-toy" width="720" height="380" aria-label="Toy acoustic inverse problem with a hidden anomaly, one source, and several receivers"></canvas>',
           '<canvas id="wave-toy" width="720" height="380" role="img" aria-label="Diagram of a wave spreading from a source toward six receivers and an illustrative hidden shape. Not a numerical wave simulation."></canvas>')
    change('index.html', '<span>The project itself uses the Devito forward model.</span>',
           '<span>Schematic only; the real project runs a Devito PDE solver.</span><output id="wave-status" class="sr-only" aria-live="polite"></output>')
    change('index.html', '<p class="instrument-note">This only shows the policy idea. The real tool also tracks valid success, tokens, latency, repeats, and significance.</p>',
           '<p class="instrument-note">Example rule only: warn at 8%, fail above 10%. The actual tool compares task-valid success, token use, latency, repeats, and statistical evidence.</p>')
    change('index.html', '<strong id="candidate-cost">$1.04</strong>', '<strong id="candidate-cost" aria-live="polite">$1.04</strong>')
    change('index.html', '<div class="build-verdict pass" id="build-verdict"><span>build</span><strong>PASS</strong></div>',
           '<div class="build-verdict pass" id="build-verdict"><span>example gate</span><strong aria-live="polite">PASS</strong></div>')
    change('index.html', '<button type="button" id="open-puzzle">See what this does</button>',
           '<button type="button" id="open-puzzle" aria-controls="lights-puzzle" aria-expanded="false">See what this does</button>')
    change('index.html', '<span id="puzzle-status">Turn them all off.</span>', '<span id="puzzle-status" aria-live="polite">Turn them all off.</span>')
    change('index.html', 'src="assets/img/headshot.jpg" alt="Portrait of Aryan Gupta standing beside a mountain lake" width="360" height="432"',
           'src="assets/img/headshot.jpg" alt="Portrait of Aryan Gupta standing beside a mountain lake" width="360" height="450"')
    change('index.html', '<img src="assets/img/personal/mountain-profile.jpg" alt="Aryan Gupta outdoors in the mountains" loading="lazy" />',
           '<img src="assets/img/personal/mountain-profile.jpg" alt="Aryan Gupta outdoors in the mountains" width="900" height="1200" loading="lazy" />')
    change('index.html', '<img src="assets/img/personal/niagara.jpg" alt="Aryan Gupta at Niagara Falls in a red rain poncho" loading="lazy" />',
           '<img src="assets/img/personal/niagara.jpg" alt="Aryan Gupta at Niagara Falls in a red rain poncho" width="900" height="1200" loading="lazy" />')
    change('index.html', '<div class="field-compass" aria-label="A compass that follows the pointer">',
           '<div class="field-compass" aria-hidden="true">')

    # Accessible names on generic containers need an appropriate role.
    change('index.html', '<div class="trailhead-route" aria-label="Route so far">',
           '<div class="trailhead-route" role="group" aria-label="Route so far">')
    change('index.html', '<div class="branch-field" aria-label="Things explored at Michigan">',
           '<div class="branch-field" role="group" aria-label="Things explored at Michigan">')
    change('index.html', '<div class="convergence-field" aria-label="Technical threads that converged in Houston">',
           '<div class="convergence-field" role="group" aria-label="Technical threads that converged in Houston">')
    change('index.html', '<div class="personal-photo-stack" aria-label="Two personal travel photographs">',
           '<div class="personal-photo-stack" role="group" aria-label="Two personal travel photographs">')
    change('index.html', '<div class="lights-puzzle" id="lights-puzzle" hidden aria-label=',
           '<div class="lights-puzzle" id="lights-puzzle" hidden role="group" aria-label=')
    for page in ('research.html', 'work.html', 'cv.html', '404.html'):
        change(page, '<div class="mode-switch mode-links" aria-label="Site mode">',
               '<div class="mode-switch mode-links" role="group" aria-label="Site mode">')
    change('research.html', '<div class="project-visual barrier-visual" aria-label=',
           '<div class="project-visual barrier-visual" role="group" aria-label=')
    change('research.html', '<div class="project-visual costgate-visual" aria-label=',
           '<div class="project-visual costgate-visual" role="group" aria-label=')

    # Research: concrete, reproducible results and narrower scope statements.
    change('research.html',
           'I built this while learning Devito because I usually understand a framework only after I have tried to make something end to end with it. The setup is small on purpose. Hide a structure in a 2D acoustic medium, collect sparse traces, and see what you can recover.',
           'WaveSleuth is a reproducible inverse-wave playground built around Devito: sparse acoustic observations, inversion baselines, blind challenges, and explicit scores. I started it to learn the solver end to end. The v1 release grew into a small, versioned testbed for reconstruction experiments.')
    change('research.html', 'Not a seismic package and not a claim about field scale imaging. It is a small inverse problem sandbox that I can break without waiting three days for a run.',
           'A 2D constant-density acoustic testbed, not field-scale seismic imaging. The inversions are deliberately constrained so experiments can be reproduced and inspected.')
    change('research.html', '<div class="metric-strip" aria-label="WaveSleuth v1.0 canonical challenge scores">',
           '<p class="evidence-eyebrow">Release evidence / reference reconstruction IoU (v1.0.0)</p>\n                            <div class="metric-strip" role="group" aria-label="WaveSleuth v1.0 reference reconstruction intersection over union scores">')
    change('research.html', '<strong>0.895</strong>', '<strong>0.895 IoU</strong>')
    change('research.html', '<strong>0.800</strong>', '<strong>0.800 IoU</strong>')
    change('research.html', '<strong>0.787</strong>', '<strong>0.787 IoU</strong>')
    insert_after('research.html', '</div>\n                            <p class="project-links"><a href="https://github.com/guptaaryanr/wavesleuth-devito"', '') if False else None
    change('research.html',
           '<p class="project-links"><a href="https://github.com/guptaaryanr/wavesleuth-devito"',
           '<figure class="project-result"><img src="assets/img/projects/wavesleuth-v1-iou.svg" alt="Bar chart of WaveSleuth reference reconstruction IoU results: mask-cell-easy 1.000, staged circle 0.895, circle-easy 0.800, ellipse-easy 0.787" width="900" height="370" loading="lazy" /><figcaption>Versioned reference cases from the v1.0.0 release notes, not independent field-data validation. The four tasks have different reconstruction settings.</figcaption></figure>\n                            <p class="project-links"><a href="https://github.com/guptaaryanr/wavesleuth-devito/blob/main/docs/V1_RELEASE_NOTES.md" target="_blank" rel="noopener">Release results ↗</a><a href="https://github.com/guptaaryanr/wavesleuth-devito"')
    change('research.html',
           'On the two systems in the paper, the structural boundary appears earlier. The claim stops there.',
           'On the two deterministic benchmark families in the paper, using multivariate/full-state trajectories, the structural boundary appears earlier than the separately defined qualitative boundary. No general-purpose bifurcation guarantee is claimed.')
    change('research.html', 'src="assets/img/projects/trajectory-flagship.webp" alt=',
           'src="assets/img/projects/trajectory-flagship.webp" width="770" height="980" alt=')
    change('research.html', '<details class="project-evidence"><summary>See the FitzHugh-Nagumo result</summary>',
           '<details class="project-evidence" open><summary>FitzHugh–Nagumo result from the paper</summary>')
    change('research.html',
           'I built ThermoBench after a GNN surrogate for vapor liquid equilibrium fooled me in a fairly instructive way. Ordinary prediction error looked acceptable. Inside the thermodynamic calculation, it fell apart. The useful question was not whether the average error was low. It was whether the learned surface still behaved like thermodynamics.',
           'A GNN surrogate for vapor–liquid equilibrium looked adequate by ordinary prediction error, then failed inside a solver because its learned surface and derivatives were unreliable. I built ThermoBench to test physical consistency before a surrogate reaches that stage. The current benchmark targets pure-fluid equations of state; the motivating GNN problem involved a mixture.')
    change('research.html', '<small>deliberately inconsistent surrogate</small><b>FAIL · PASS · FAIL · FAIL</b>',
           '<small>deliberately inconsistent surrogate</small><b>FAIL · PASS · FAIL · FAIL</b>') if False else None
    change('research.html', '<div class="project-visual thermo-visual" aria-label="Four physical consistency checks used by ThermoBench">',
           '<p class="evidence-eyebrow">Diagnostic example / reference and deliberately inconsistent adapters</p>\n                            <div class="project-visual thermo-visual" role="group" aria-label="Example results of the four ThermoBench physical consistency checks">')
    change_first('research.html',
           '<p class="project-links"><a href="assets/research/thermobench-consist-v1.pdf"',
           '<p class="result-caption">These are the reference and deliberately inconsistent test cases; they are not mixture-VLE validation. The pure-fluid benchmark uses CO₂ and N₂ grids, with exclusions near critical and spinodal regions.</p>\n                            <p class="project-links"><a href="https://github.com/guptaaryanr/ThermoBench-Consist#what-the-checks-mean" target="_blank" rel="noopener">Check definitions ↗</a><a href="assets/research/thermobench-consist-v1.pdf"')
    change('research.html',
           '<details class="project-evidence code-evidence"><summary>See one policy gate</summary>',
           '<details class="project-evidence code-evidence" open><summary>Example versioned policy gate</summary>')
    change('research.html',
           '<p class="project-links"><a href="https://github.com/guptaaryanr/costgate-v1"',
           '<p class="result-caption">For reproducible examples, CostRegBench runs controlled regression scenarios and checks the resulting pass, warn, or fail against the expected outcome. These are fixture-based tests, not measurements of an external production LLM.</p>\n                            <p class="project-links"><a href="https://github.com/guptaaryanr/costgate-v1/tree/main/benchmarks/costregbench" target="_blank" rel="noopener">Controlled benchmark ↗</a><a href="https://github.com/guptaaryanr/costgate-v1"')
    change('research.html', '<p class="archive-type">Systematic review</p><h3>Energy Efficient Robotics Software</h3>',
           '<p class="archive-type">Systematic review · arXiv preprint</p><h3>Energy Efficient Robotics Software</h3>')
    change('research.html', 'Mostly Michigan. Not what I work on now, but still things I built and want to keep on the record.',
           'Earlier engineering work from Michigan: circuits, processors, robotics, and embedded systems.')
    change('research.html', 'A small command line benchmark for logging power, integrating it to Wh, and converting that to estimated gCO₂',
           'A command-line benchmark for logging power, integrating it to Wh, and converting that to estimated gCO₂')

    # Dates and place/status must agree everywhere.
    change('work.html', 'MSc Applied Computational Science &amp; Engineering · Incoming.',
           'MSc Applied Computational Science &amp; Engineering · Current student.')
    change('work.html', 'I have spent the last few years learning scientific computing because individual problems forced me to. This is the year I get to study the subject itself.',
           'At Imperial now, studying the numerical and computational foundations of work I had previously learned mainly through research and engineering problems.')
    change('cv.html', '<strong>Next</strong>MSc Applied Computational Science',
           '<strong>Now</strong>MSc Applied Computational Science')

    # Replace obsolete public project-ideas page with a minimal retired-page notice.
    # Keep the path for old bookmarks without publishing stale plans.
    contents['ongoing.html'] = '''<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Moved · Aryan Gupta</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, follow" />
    <meta name="description" content="Earlier project notes have been retired. Current work is on the research page." />
    <link rel="icon" href="favicon.ico" />
    <link rel="stylesheet" href="assets/css/site.css" />
    <script defer src="assets/js/site.js"></script>
</head>
<body data-page="read">
    <a class="skip-link" href="#content">Skip to content</a>
    <main class="not-found shell" id="content" tabindex="-1">
        <p class="kicker">Earlier notes</p>
        <h1>I've moved this page.</h1>
        <p>The old list of possible projects went out of date. The things I've finished are on the <a class="text-link" href="research.html?mode=read">research page</a>, along with the earlier work.</p>
        <p><a class="text-link" href="index.html?mode=explore">Back to the site</a></p>
    </main>
</body>
</html>
'''

    # All public pages get consistent previews and canonical URLs.
    add_meta('index.html', 'Aryan Gupta · Applied physics, scientific computing & research',
             'Applied physicist and research engineer working across scientific computing, inverse problems, simulation and research software.', '')
    add_meta('research.html', 'Research & software · Aryan Gupta',
             'WaveSleuth, trajectory-only regime detection, ThermoBench, Costgate, publications and earlier engineering projects.', 'research.html')
    add_meta('work.html', 'Experience · Aryan Gupta',
             'Applied physics R&D, carbon capture, scientific computing, engineering systems, research and teaching.', 'work.html')
    add_meta('cv.html', 'CV · Aryan Gupta',
             'Two-page CV covering research, technical projects, education and engineering work.', 'cv.html')
    schema = {
        '@context': 'https://schema.org', '@type': 'Person',
        'name': 'Aryan Gupta', 'url': 'https://guptaaryanr.github.io/',
        'jobTitle': 'Applied physicist and research engineer',
        'description': 'Scientific computing, inverse problems, simulation and research software.',
        'alumniOf': {'@type': 'CollegeOrUniversity', 'name': 'University of Michigan'},
        'affiliation': {'@type': 'CollegeOrUniversity', 'name': 'Imperial College London'},
        'sameAs': [
            'https://github.com/guptaaryanr',
            'https://www.linkedin.com/in/guptaaryanr/',
            'https://scholar.google.com/citations?user=FsIchOAAAAAJ',
            'https://orcid.org/0009-0001-8179-5145',
        ],
    }
    change('index.html', '</head>',
           '    <script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>\n</head>')

    scholarly = {
        '@context': 'https://schema.org', '@graph': [
            {
                '@type': 'ScholarlyArticle', 'name': 'Trajectory-Only Structural Regime Detection in Deterministic Dynamical Systems',
                'author': {'@type': 'Person', 'name': 'Aryan Gupta'},
                'datePublished': '2026', 'isAccessibleForFree': True,
                'url': 'https://doi.org/10.5281/zenodo.20278240',
            },
            {
                '@type': 'ScholarlyArticle', 'name': 'ThermoBench-Consist v1.0',
                'author': {'@type': 'Person', 'name': 'Aryan Gupta'},
                'datePublished': '2025', 'isAccessibleForFree': True,
                'url': 'https://doi.org/10.5281/zenodo.17489426',
            },
            {
                '@type': 'ScholarlyArticle', 'name': 'Assessing the Limits of GNNs for Vapor-Liquid Equilibrium',
                'author': {'@type': 'Person', 'name': 'Aryan Gupta'},
                'datePublished': '2025', 'isAccessibleForFree': True,
                'url': 'https://arxiv.org/abs/2509.10565',
            },
            {
                '@type': 'ScholarlyArticle', 'name': 'Energy Efficient Robotics Software',
                'author': {'@type': 'Person', 'name': 'Aryan Gupta'},
                'datePublished': '2025', 'isAccessibleForFree': True,
                'url': 'https://arxiv.org/abs/2508.12170',
            },
        ]
    }
    change('research.html', '</head>',
           '    <script type="application/ld+json">' + json.dumps(scholarly, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>\n</head>')
    change('404.html', '<head><meta charset="utf-8" />',
           '<head><meta charset="utf-8" /><meta name="robots" content="noindex, follow" />')

    # Accessible, practical contrast and explicitly JS / no-JS home states.
    change('assets/css/site.css', '--muted: #72757b;', '--muted: #60646b;')
    css = '''
/* October 2026 quality pass. Maintain the existing field-journal layout. */
.no-js .explore-layer, .no-js .explore-nav { display: none !important; }
.no-js .read-layer, .no-js .read-nav { display: block !important; }
.no-js .mode-switch, .no-js .nav-toggle, .no-js .explore-skip { display: none !important; }
.js body[data-site-mode="explore"] .read-skip { display: none !important; }
.js body[data-site-mode="explore"] .read-layer { display: none !important; }
.js body[data-site-mode="explore"] .read-nav, .js body[data-site-mode="read"] .explore-nav { display: none !important; }
:where(a, button, summary, input, [tabindex]):focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
}
.field-shortcuts { margin-top: 1.35rem; display: flex; flex-wrap: wrap; gap: .55rem 1.2rem; }
.field-shortcuts a { color: var(--ink-soft); font-size: .82rem; text-decoration: none; border-bottom: 1px solid var(--line-strong); }
.field-shortcuts a:hover { color: var(--warm); border-bottom-color: var(--warm); }
.demo-disclaimer { padding: .6rem .9rem; border-top: 1px solid var(--line); background: rgba(250,248,242,.85); color: var(--ink-soft); font-size: .78rem; line-height: 1.5; }
.instrument-note { line-height: 1.5; }
.evidence-eyebrow { margin: 1.2rem 0 .55rem; font: 700 .73rem/1.5 ui-monospace, Menlo, monospace; color: var(--warm); }
.project-result { margin: 1rem 0 1.2rem; max-width: 50rem; }
.project-result img { width: 100%; height: auto; border: 1px solid var(--line); background: var(--paper); }
.project-result figcaption, .result-caption { display: block; margin: .55rem 0 1rem; font-size: .83rem; line-height: 1.6; color: var(--ink-soft); }
.project-evidence[open] { margin-top: 1.25rem; }
.field-note-dialog { overflow-y: auto; overscroll-behavior: contain; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 860px) {
    .no-js .nav-shell { flex-wrap: wrap; }
    .no-js .read-nav { position: static !important; width: 100%; border: 0; background: transparent; }
    .no-js .read-nav ul { flex-direction: row; flex-wrap: wrap; gap: .25rem 1rem; padding: 0 0 .75rem; }
    .no-js .read-nav li { border: 0; }
    .no-js .read-nav a { padding: .35rem 0; }
}
@media (max-width: 700px) {
    .field-shortcuts { gap: .7rem 1.1rem; }
    .project-result figcaption { font-size: .84rem; }
}
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
}
'''
    contents['assets/css/site.css'] += css

    ignore = '\nnode_modules/\ntest-results/\nplaywright-report/\n__pycache__/\n*.pyc\n'
    if 'node_modules/' not in contents['.gitignore']:
        contents['.gitignore'] = contents['.gitignore'].rstrip('\n') + '\n' + ignore

    # The scientific interactions below are illustrative; remove claims that
    # a slider is doing the paper's computations. Quiet the perpetual animation.
    change('assets/js/explore.js', '''        function tick() {
            const delta = ((target - angle + 540) % 360) - 180;
            velocity += delta * .025; velocity *= .84; angle += velocity;
            needle.style.transform = `rotate(${angle}deg)`;
            requestAnimationFrame(tick);
        }
        tick();''', '''        let running = false;
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
        resume();''')
    change('assets/js/explore.js',
           'if(t<2.4) raf=requestAnimationFrame(drawWave); else pulseStart=-1;',
           'if(t<2.4 && !reduceMotion) raf=requestAnimationFrame(drawWave); else pulseStart=-1;')
    change('assets/js/explore.js', '''        waveFire.addEventListener('click',()=>{cancelAnimationFrame(raf);pulseStart=performance.now();drawWave(pulseStart);});
        waveShuffle.addEventListener('click',()=>{anomaly={x:.38+Math.random()*.32,y:.30+Math.random()*.37,r:.065+Math.random()*.045};drawWave();});''', '''        const waveStatus = document.getElementById('wave-status');
        waveFire.addEventListener('click',()=>{
            cancelAnimationFrame(raf);
            pulseStart = performance.now() - (reduceMotion ? 1800 : 0);
            drawWave(performance.now());
            if (waveStatus) waveStatus.textContent = 'Schematic pulse shown; no PDE solved.';
        });
        waveShuffle.addEventListener('click',()=>{
            anomaly={x:.38+Math.random()*.32,y:.30+Math.random()*.37,r:.065+Math.random()*.045};
            pulseStart=-1; cancelAnimationFrame(raf); drawWave();
            if (waveStatus) waveStatus.textContent = 'Hidden object moved in the schematic.';
        });''')
    change('assets/js/explore.js',
           "trajStatus.textContent=score<.42?'nothing interesting yet':score<.68?'something is moving':'structural change picked up';",
           "trajStatus.textContent=score<.42?'low':score<.68?'rising':'high (illustration only)';")
    change('assets/js/explore.js',
           "openPuzzle.addEventListener('click',()=>{puzzle.hidden=!puzzle.hidden;openPuzzle.textContent=puzzle.hidden?'See what this does':'Put it away';if(!puzzle.hidden&&cells.length===0)resetPuzzle();});",
           "openPuzzle.addEventListener('click',()=>{puzzle.hidden=!puzzle.hidden;openPuzzle.textContent=puzzle.hidden?'See what this does':'Put it away';openPuzzle.setAttribute('aria-expanded',String(!puzzle.hidden));if(!puzzle.hidden&&cells.length===0)resetPuzzle();});")

    # Use the source project's model naming in the dialog, not a broader claim.
    change('assets/js/explore.js',
           "'The detector only gets trajectories across an ordered parameter sweep. It does not get the governing equations, regime labels, or the model specific transition definition.',",
           "'The paper tests full-state trajectories from two deterministic benchmark families across ordered parameter sweeps. The detector sees no governing equations, regime labels, or model-specific transition definitions.',")
    change('assets/js/explore.js',
           "'ThermoBench is a small set of physical consistency checks meant to catch that kind of failure before the surrogate gets trusted downstream.'",
           "'ThermoBench checks physical consistency in pure-fluid EOS surrogates. The motivating VLE study involved a mixture, so the current benchmark does not claim to solve that original problem.'")

    # Split independent animations, hands-on illustrations and field notes.
    # All sections in the original IIFE are self-contained apart from reduceMotion.
    original = contents['assets/js/explore.js']
    prefix = "// /assets/js/explore.js\n(function () {\n    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n\n"
    motion_end = '    // WaveSleuth toy.'
    notes_begin = '    // Explore links open a short field note first.'
    if not original.startswith(prefix) or original.count(motion_end) != 1 or original.count(notes_begin) != 1 or not original.rstrip().endswith('})();'):
        raise RuntimeError('Cannot split explore.js: source structure changed. No files changed.')
    end = original.rfind('})();')
    body = original[len(prefix):end]
    first, rest = body.split(motion_end, 1)
    interactive, field_notes = rest.split(notes_begin, 1)
    contents['assets/js/explore.js'] = prefix + first + '\n})();\n'
    contents['assets/js/explore-instruments.js'] = ("// /assets/js/explore-instruments.js\n(function () {\n    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n\n"
        + motion_end + interactive + '\n})();\n')
    contents['assets/js/explore-notes.js'] = ("// /assets/js/explore-notes.js\n(function () {\n"
        + notes_begin + field_notes + '\n})();\n')

    # Drop-in replacement for the shared navigation controller.
    contents['assets/js/site.js'] = (ROOT / 'tools/site.new.js').read_text(encoding='utf-8')


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--check', action='store_true', help='verify compatibility, without changing files')
    args = p.parse_args()
    for path in TEXT_FILES:
        f = ROOT / path
        if not f.is_file():
            raise SystemExit(f'Missing {path}. Unzip into the root of the guptaaryanr.github.io repository.')
        contents[path] = f.read_text(encoding='utf-8')
    if 'October 2026 quality pass.' in contents['assets/css/site.css']:
        raise SystemExit('This update is already applied; no files changed.')
    try:
        apply_content()
    except RuntimeError as exc:
        raise SystemExit(str(exc)) from exc
    modified = sorted(k for k, v in contents.items() if not (ROOT / k).exists() or v != (ROOT / k).read_text(encoding='utf-8'))
    if args.check:
        print('Source matches the expected revision; no files changed.')
        for path in modified:
            print('  ' + path)
        return
    for path in modified:
        (ROOT / path).parent.mkdir(parents=True, exist_ok=True)
        (ROOT / path).write_text(contents[path], encoding='utf-8')
    print(f'Updated {len(modified)} website source files:')
    for path in modified:
        print('  ' + path)
    print('Run: python tools/verify_site.py && npm install && npx playwright install chromium && npm test')


if __name__ == '__main__':
    main()
