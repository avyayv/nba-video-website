#!/usr/bin/env bash
# Run on the Hetzner host from a source release directory. Does not touch other apps.
set -euo pipefail
release="${1:?Pass a unique release label}"
[[ "$release" =~ ^[a-zA-Z0-9._-]+$ ]] || { echo 'Invalid release label' >&2; exit 1; }
image="courtside-nba:$release"
name="courtside-nba"
backup="courtside-nba-previous-$release"
docker network inspect traefik-network >/dev/null
docker build --label "courtside.release=$release" -t "$image" .
# Validate the exact image before changing the production router.
probe="courtside-check-$release"
docker run -d --name "$probe" --memory 384m --cpus 1 --pids-limit 128 --cap-drop ALL --security-opt no-new-privileges --read-only --tmpfs /tmp --tmpfs /app/storage:uid=10001,gid=10001 -e DISABLE_SYNC=1 "$image" >/dev/null
trap 'docker rm -f "$probe" >/dev/null 2>&1 || true' EXIT
for attempt in $(seq 1 30); do
  if docker exec "$probe" python -c "import json,urllib.request; x=json.load(urllib.request.urlopen('http://127.0.0.1:8080/api/health')); assert x['clips'] > 0" >/dev/null 2>&1; then break; fi
  if [ "$attempt" = 30 ]; then echo 'Preflight health check failed' >&2; exit 1; fi
  sleep 1
done
docker rm -f "$probe" >/dev/null
trap - EXIT
had_previous=0
if docker container inspect "$name" >/dev/null 2>&1; then
  had_previous=1
  docker stop "$name" >/dev/null
  docker rename "$name" "$backup"
fi
if ! docker run -d --name "$name" --restart unless-stopped --network traefik-network \
  --memory 384m --cpus 1 --pids-limit 128 --cap-drop ALL --security-opt no-new-privileges \
  --read-only --tmpfs /tmp -v courtside-nba-catalog:/app/storage \
  --label traefik.enable=true \
  --label 'traefik.http.routers.courtside-nba.rule=Host(`nba.avyayv.com`)' \
  --label traefik.http.routers.courtside-nba.entrypoints=websecure \
  --label traefik.http.routers.courtside-nba.tls.certresolver=letsencrypt \
  --label traefik.http.services.courtside-nba.loadbalancer.server.port=8080 \
  --label "courtside.release=$release" "$image" >/dev/null; then
  docker rm -f "$name" >/dev/null 2>&1 || true
  if [ "$had_previous" = 1 ]; then docker rename "$backup" "$name"; docker start "$name"; fi
  exit 1
fi
for attempt in $(seq 1 30); do
  if docker exec "$name" python -c "import json,urllib.request; x=json.load(urllib.request.urlopen('http://127.0.0.1:8080/api/health')); assert x['clips'] > 0" >/dev/null 2>&1; then
    echo "Deployed $image. Previous container (if any): $backup"
    exit 0
  fi
  sleep 1
done
echo 'Production health check failed; rolling back.' >&2
docker rm -f "$name" >/dev/null
if [ "$had_previous" = 1 ]; then docker rename "$backup" "$name"; docker start "$name"; fi
exit 1
