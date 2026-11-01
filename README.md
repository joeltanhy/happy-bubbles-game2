# HAPPY BUBBLES v2 — GitHub Pages root-folder upload

This edition has **no subfolders**. All files belong directly at the top level of your GitHub repository.

## Uploading to GitHub

1. Unzip `Happy_Bubbles_v2_FLAT_GitHub_Upload.zip` on your computer.
2. Open your GitHub repository, choose **Add file → Upload files**.
3. Select **all 11 files inside** the extracted folder, not the ZIP and not the containing folder.
4. Commit the changes. If replacing an older version, overwrite existing files with the new versions.
5. Under **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/(root)`, then **Save**.
6. Once the site finishes building, open the published GitHub Pages URL. Allow a short moment for your browser to refresh any cached files if you previously published an earlier version.

## Files at repository root

- `index.html` — web app structure (GitHub Pages entry point)
- `styles.css` — responsive mobile UI and bubble styling
- `game.js` — gameplay, movement, spawn rules, scores, dialogues
- `dialogues.js` — the 30 scenario stories / 360 card interactions from the rebalanced workbook
- `card-gentle-reframe.webp`, `card-small-steps.webp`, `card-grounding.webp`, `card-validation.webp` — four card illustrations
- `icon.svg` — site icon
- `manifest.webmanifest` — optional install-to-home-screen metadata
- `README.md` — this file

## Controls

- Phones: drag the joystick; tap PICK UP near cards; touch bubbles to begin; select a card and tap USE CARD.
- Desktop: arrow keys/WASD to move, Space or Enter to interact, and arrow keys to select cards during conversations.
- The score is the **number of bubbles treated**, not cards collected.
- **Card inventory has no holding limit**: keep collecting any number of cards; the four coloured counters show your totals.

This is the revised, folder-free v2 game. A static site: no Node or build step required. The dialogue is illustrative and is not a substitute for mental-health care.
