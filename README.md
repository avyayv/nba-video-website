# Courtside

A small NBA clip search app built on recent ESPN highlights. Throwaway example; not maintained for real use.

## Run

Requires Node 22+ and Python 3.11+.

```sh
npm ci
npm test       # python unit tests in server/
npm run build  # vite build to dist/
npm run sync   # refresh data/seed.json from ESPN (SYNC_DAYS narrows the date range)
npm run test:e2e  # Playwright; needs a running app or BASE_URL
```

## Layout

- `app/`: React/Tailwind frontend
- `server/`: catalog ingestion, HTTP API, tests
- `tests/`: Playwright end-to-end tests
- `data/seed.json`: clip metadata from ESPN (no video files)
- `deploy/`, `Dockerfile`, `compose.yml`: container build and deploy script
- `frontend/`, `backend/`: legacy 2021 code, not built

## Notes

Videos stream from ESPN. Courtside is not affiliated with the NBA or ESPN. Fonts (Manrope, Barlow Condensed) are SIL OFL and included in `public/fonts/`.
