# Portfolio refresh: October 2026

This package is an overlay for the existing `guptaaryanr.github.io` GitHub Pages repository. It does not rebuild the site or replace its visual identity.

## Apply

1. Extract the ZIP into the **root of your local repository**, retaining the folder paths. Allow it to replace the existing one-line `README.md`.
2. Run `python apply_portfolio_update.py --check` to confirm that your source matches the audited main-branch version.
3. Run `python apply_portfolio_update.py`. The updater verifies all expected source fragments before writing any changed files.
4. Run `python tools/verify_site.py`.
5. For browser checks, run `npm install`, `npx playwright install chromium`, and `npm test`.
6. Inspect `git diff`, then commit and push as usual.

On Windows, `py` may be used instead of `python`.

## Changes

- Imperial changed from an upcoming plan to current enrolment in the About/Explore, Experience, and CV HTML pages.
- Added direct research, CV, and email routes from the Explore first screen; improved the Read hero's shortcuts.
- Fixed the no-JavaScript experience to show the actual Read page, including a usable mobile navigation fallback.
- Made keyboard focus and mobile navigation more reliable on mode changes.
- Reduced unnecessary animation work in hidden modes, and respected reduced-motion preferences.
- Labelled the interactive instruments as illustrative rather than results from the research packages.
- Tightened project scope, limitations, and quantitative labels, with supporting evidence links.
- Added a chart of the WaveSleuth v1.0.0 release's reference IoU values; expanded the real trajectory result in the research page.
- Updated passive project descriptions and retired the stale public ideas page while preserving its URL.
- Improved muted-text contrast, image aspect-ratio hints, landmark roles, and accessible control statuses.
- Added canonical/OG/Twitter metadata, a 1200 × 630 social card, and Person/ScholarlyArticle structured data.
- Split Explore JavaScript into motion, interactive instruments, and field notes modules.
- Added GitHub Actions browser and accessibility smoke tests, a local site integrity test, and optional external-link validation.
- Updated repository documentation and `.gitignore` for the new test tooling.

## Verification and limits

The updates are built against the GitHub main-branch source inspected on October 17, 2026. Source fragments were verified directly and the guarded patch ran successfully against synthetic source fixtures. The social card and WaveSleuth chart were rendered and inspected. The replacement navigation logic passed a headless Chromium spot test for switching focus and opening/closing the menu.

The **complete updated production site** was not run through an instrumented browser in the creation environment. The included Playwright suite and GitHub Action do that when run in your checkout or on push.

The existing two-page **CV PDF is not modified**. It should be reviewed separately for the Imperial-status wording; the HTML page and sidebar have been updated. The package also does not invent thermodynamics plots or Costgate runtime measurements that are not present in the released research artifacts. It surfaces existing documented test cases and directs readers to the reproducible reports instead.
