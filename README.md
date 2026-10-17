# Portfolio language edit (October 2026)

A copy-only editorial pass for `guptaaryanr.github.io`. It removes formulaic transitions, repeated self-commentary, and generic research descriptions while keeping the website's field-journal voice and technical evidence.

No CSS, layout, navigation, animations, interactive behaviour, figures, numerical results, or external links are changed.

## Use

Unzip this folder **into the root of your current local GitHub Pages repository** so that `apply_language_edit.py` and `language_replacements.json` are beside `index.html`. Do not rerun any earlier v1/v2/v3 installer.

```bash
python apply_language_edit.py --check
python apply_language_edit.py
git diff --check
git diff -- index.html research.html work.html cv.html assets/js/explore-notes.js
```

If your existing site test dependencies are installed, run `npm test` too. The modifications are text-only except removal of three redundant `<p>`/`<aside>` elements.

The updater validates **all 53 edits** before writing. If your local copy differs, it stops without making partial edits. You can inspect the affected source and the exact before/after pair in `language_replacements.json`. Do not force mismatched replacements.

It is safe to run twice: already-applied edits are skipped.

## Files changed

- `index.html` (22 edits): Explore timeline, captions and margin notes, Read homepage descriptions, project previews.
- `research.html` (11 edits): project introductions, scope phrasing, unnecessary explanations.
- `work.html` (6 edits): work history and education prose.
- `cv.html` (1 edit): short CV page description.
- `assets/js/explore-notes.js` (13 edits): text in the field-note pop-ups.

**No other website files are modified.** The manifest records all 53 proposed replacements verbatim with a short reason for each.

## What stays

The field-journal design, intentional first-person voice, technical figures, benchmarks and caveats, specific results, and idiosyncratic lines that already sound like a person. Not every personal or poetic sentence is a problem. The target is repetitive polish, not personality.

## Scope and validation

- All 53 original phrases were found uniquely in GitHub `main` on 17 October 2026.
- Installer dry-run, actual application, repeat application and mismatch refusal passed against a synthetic fixture containing those exact phrases.
- JavaScript replacement strings passed `node --check` and HTML edit tags were checked for accidental structural changes.
- Browser screenshot tests and full-site Playwright tests were **not** rerun against your local repository; run them before pushing.

The HTML order modifications from v3 are unaffected because this package matches exact text, not the arrangement of entire elements.
