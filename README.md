# nba-video-website

A small NBA clip search app built on recent ESPN highlights. Not maintained.

## What it is

This is an NBA clip browser that I first worked on in 2020/21, where the idea was that I would use the NBA API to pull every single clip, and make them super easily searchable. Unfortunately it looks like the NBA took down the API, but I asked Codex using Dari Router to rebuild the app. 

## Cost Analysis

The app was rebuilt in one Dari Codex session (`Recreate and Deploy a Beautiful Searchable Website`, 95 model steps). The same session priced three ways. Dollar figures are list-price equivalents metered by Dari on subscription keys, not necessarily amounts billed.

| Scenario | Cost | Router savings |
|---|---|---|
| Router, as run (mix of `gpt-6.1-sol` and `gpt-6-luna`) | **$1.71** | — |
| Every step on `gpt-6.1-sol` | $3.54 (approx.) | 52% |
| Every step on `gpt-6-astra` (top model) | $23.77 | 93% |

## Layout

- `app/`: React/Tailwind frontend
- `server/`: catalog ingestion, HTTP API, tests
- `tests/`: Playwright end-to-end tests
- `data/seed.json`: clip metadata from ESPN (no video files)
- `deploy/`, `Dockerfile`, `compose.yml`: container build and deploy script
- `frontend/`, `backend/`: legacy 2020/21 code, not built

## Notes

Videos stream from ESPN. Not affiliated with the NBA or ESPN. 

## Run

Requires Node 22+ and Python 3.11+.

```sh
npm ci
npm test       # python unit tests in server/
npm run build  # vite build to dist/
npm run sync   # refresh data/seed.json from ESPN (SYNC_DAYS narrows the date range)
npm run test:e2e  # Playwright; needs a running app or BASE_URL
```
