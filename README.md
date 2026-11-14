# Courtside

**The game. On repeat.** An independent NBA highlight film room at `nba.avyayv.com`.

A complete replacement for the original AnalyzeBall frontend: warm editorial design, responsive video cards, full-text player/team/play search, combinable team/date/play filters, player and team directories, grid/list layouts, shareable clip links, keyboard search (`/`), and browser-local saved clips.

## History

This repository began in 2021 as `nba-video-website`, a Flask and React app that browsed NBA clips through a third-party source. When that source went away and the hosting was shut off for cost, the project went dormant. This rebuild revives it on the same repository. Clip metadata now comes from ESPN's public highlight feed, so the catalog is recent publisher highlights rather than the original 2018–2021 archive.

## Run a complete preview

Requires Docker, Node 22+, Python 3.11+ and the installed `tunnel` CLI.

```sh
npm ci
npm test
npm run build
tunnel up --name nba-redesign --build --target web:8080 .
tunnel doctor
```

Use the URL printed by `tunnel`. It owns both the app and index service. Previews expire after 30 minutes; SQLite data is preserved. Re-run the same `tunnel up` command to rebuild; `tunnel down nba-redesign` stops it.

```sh
npm run test:e2e
# For another environment:
BASE_URL=https://nba.avyayv.com npm run test:e2e
# First-time Playwright users: npx playwright install chromium
```

`PLAYWRIGHT_EXECUTABLE_PATH` optionally selects an already-installed test browser.

## Data, not demo content

The bundled seed contains actual, publisher-supplied clip metadata from ESPN. Videos stream directly from the publisher; no video files are copied or hosted here. A background task indexes the latest seven game dates and recent video articles every 30 minutes, retaining discovered metadata in SQLite. Initialization can run without the upstream being available.

Search covers titles, descriptions, teams/matchups, provider-tagged athletes, and players mentioned in clip text matched to the game's box score. Play types are title-based classifications, not official play-by-play tags. Filters intersect; query strings preserve the search. Expired clips are excluded from results. Saved clips use this browser's local storage and do not sync between devices.

**Coverage is recent publisher highlights, not every NBA play or the original 2018–2021 shot archive.** The original Google Cloud API returns errors and no original database export is in this repository. There is no fake fallback dataset. Upstream outages retain the last good index; regional restrictions, media expiration, and publisher feed changes can affect availability. The player offers a link to the original publisher if playback fails.

To explicitly refresh the local seed from real data:

```sh
npm run sync # defaults to 14 game dates; SYNC_DAYS can narrow this
```

## Production on Hetzner

The multi-stage image builds Vite/React/Tailwind and runs a same-origin Python API/static server as a non-root user. SQLite lives in the `courtside-nba-catalog` Docker volume, separate from releases. The app has memory/CPU/process limits, no host-published ports, a read-only root filesystem, dropped capabilities, a health check, and security headers. No paid APIs, accounts, or database service are required.

Production source releases live under `/home/avyay/nba.avyayv.com/releases/`. Copy a source release (excluding old `frontend/`, `backend/`, `.git`, `node_modules`, build output, and local SQLite files) to a new directory there, then run:

```sh
bash deploy/hetzner.sh <unique-release-label>
```

The script builds and preflights the exact image before switching only `courtside-nba`. It retains the previous container for rollback and does not alter other apps or Traefik configuration. It attaches to the existing `traefik-network` with the hostname `nba.avyayv.com` and existing `letsencrypt` resolver. Public DNS must have an A record pointing `nba` to this host before HTTPS issuance succeeds.

To roll back, stop the current `courtside-nba`, rename it for inspection, rename the retained previous container to `courtside-nba`, and start it. Preserve the catalog volume. Do not delete volumes or prune unrelated Docker resources.

## Source layout

- `app/`: current React/Tailwind application
- `server/`: SQLite catalog, publisher ingestion, HTTP API, contract tests
- `tests/`: real full-stack browser tests, including actual video playback
- `data/seed.json`: real clip metadata, not video bytes
- `deploy/hetzner.sh`: scoped deployment and automatic failed-health rollback
- `frontend/`, `backend/`: untouched legacy source, retained for historical reference; not built or deployed

Fonts: Manrope and Barlow Condensed, licensed under the SIL Open Font License (included in `public/fonts/`). Video and imagery belong to ESPN and their respective owners. Courtside is not affiliated with the NBA or ESPN.
