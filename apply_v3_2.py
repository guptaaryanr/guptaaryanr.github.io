#!/usr/bin/env python3
"""Apply the v3.2 mobile-header overflow repair without overwriting local CSS."""
from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STYLE = ROOT / "assets/css/visual-repair.css"
PATCH = ROOT / "tools/header-zoom.css"
TEST = ROOT / "tests/header-zoom.spec.mjs"
START = "/* v3.2: Keep the mobile header inside its column when text is enlarged."


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate files and show what would change")
    args = parser.parse_args()

    for path in [STYLE, PATCH, TEST]:
        if not path.is_file():
            parser.error(f"Missing {path.relative_to(ROOT)}. Extract the ZIP into the repository root first.")

    original = STYLE.read_text(encoding="utf-8")
    if "V3 RESPONSIVE REPAIR" not in original:
        parser.error("Expected the v3 visual-repair.css. Apply the v3 package first.")

    patch = PATCH.read_text(encoding="utf-8")
    if not patch.startswith(START):
        parser.error("Invalid v3.2 CSS patch.")

    if START in original:
        print("The v3.2 header fix is already applied. Nothing to change.")
        return

    if args.check:
        print("Compatible with v3 stylesheet. The header fix can be appended safely.")
        return

    STYLE.write_text(original.rstrip() + "\n\n" + patch.rstrip() + "\n", encoding="utf-8")
    print("Updated assets/css/visual-repair.css without replacing existing rules.")
    print("Run: npx playwright test tests/header-zoom.spec.mjs tests/visual-layout.spec.mjs")


if __name__ == "__main__":
    main()
