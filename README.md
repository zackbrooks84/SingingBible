# SingTheVerse

SingTheVerse is a static React + TypeScript app that loads the full King James Bible (KJV, public domain) and sings selected verses in browser.

## Features
- Full 66-book KJV data set, normalized in `public/data/kjv.json`.
- Book -> Chapter -> Verse navigation.
- Search by reference (`John 3:16`) or keyword text.
- Two singing modes:
  - Melody Mode (Tone.js synth, deterministic note mapping).
  - Voice Mode (Web Speech API fallback, adjustable voice/rate/pitch).
- Karaoke-style word highlighting while melody plays.
- Offline support with service worker and cached app shell + `kjv.json`.
- Resume to last visited location via localStorage.

## Local development
```bash
npm install
npm run data:fetch
npm run data:normalize
npm run dev
```

Build and preview:
```bash
npm run build
npm run preview
```

## Data source and licensing
- Raw source is downloaded by `scripts/fetch-kjv.mjs` from:
  - `https://github.com/scrollmapper/bible_databases` (`formats/json/KJV.json`)
- KJV text is public domain.
- This project ships only KJV and does not embed copyrighted modern translations.

## How singing works
- Melody Mode hashes verse text + settings (key, scale, pitch range) so melody generation is deterministic.
- Each word maps to a scale note, with duration influenced by word length and punctuation.
- Voice Mode uses `speechSynthesis` as fallback with selectable browser voices.

## GitHub Pages deployment
1. Push to `main`.
2. In GitHub repo settings, ensure Pages source is "GitHub Actions".
3. Workflow `.github/workflows/deploy.yml` builds and deploys `/dist` to root pages URL.

## Limitations and future ideas
- Melody phrasing is intentionally simple and synthetic.
- Browser voice quality varies by operating system.
- Future ideas: better rhythm model, harmonic backing, favorites/playlists, and multi-translation support with license checks.
