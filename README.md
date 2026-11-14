# Courtside

A small NBA clip search app built on recent ESPN highlights. Throwaway example; not maintained for real use.

## What it is

This is an NBA clip browser that I first worked on in 2019. It was built around a third-party clip source and hosted on Google Cloud. When that source went away and hosting was shut off for cost, the project went dormant. This version brings it back as a full rewrite in the same repository. It searches recent publisher highlights from ESPN's public feed. It is not a copy of the original code: the legacy `frontend/` and `backend/` directories are kept for reference only.

## Run

Requires Node 22+ and Python 3.11+.

```sh
npm ci
npm test       # python unit tests in server/
npm run build  # vite build to dist/
npm run sync   # refresh data/seed.json from ESPN (SYNC_DAYS narrows the date range)
npm run test:e2e  # Playwright; needs a running app or BASE_URL
```

## Cost analysis

The app was rebuilt in one Dari Codex session (`Recreate and Deploy a Beautiful Searchable Website`, 95 model steps). The same session priced three ways. Dollar figures are list-price equivalents metered by Dari on subscription keys, not necessarily amounts billed.

| Scenario | Cost | Router savings |
|---|---|---|
| Router, as run (mix of `gpt-6.1-sol` and `gpt-6-luna`) | **$1.71** | — |
| Every step on `gpt-6.1-sol` | $3.54 (approx.) | 52% |
| Every step on `gpt-6-astra` (top model) | $23.77 | 93% |

- Routed mix: 53 steps on `sol` (all high effort) and 42 on `luna` (41 high, 1 low).
- The all-`sol` figure uses fitted per-token rates with about 3.5% error, so treat it as approximate.
- The all-`astra` figure uses the same method and matches an unrelated session that ran entirely on `astra` to the cent.
- A separate Claude Code session that updated docs and merged these changes cost about $0.31 and is not part of the build.

## Layout

- `app/`: React/Tailwind frontend
- `server/`: catalog ingestion, HTTP API, tests
- `tests/`: Playwright end-to-end tests
- `data/seed.json`: clip metadata from ESPN (no video files)
- `deploy/`, `Dockerfile`, `compose.yml`: container build and deploy script
- `frontend/`, `backend/`: legacy 2021 code, not built

## Notes

Videos stream from ESPN. Courtside is not affiliated with the NBA or ESPN. Fonts (Manrope, Barlow Condensed) are SIL OFL and included in `public/fonts/`.
