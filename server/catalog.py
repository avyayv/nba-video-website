"""Persistent, incrementally refreshed index of publisher-hosted NBA videos.

Only metadata is stored. Videos stay on the publisher's CDN; no media is downloaded.
"""
import concurrent.futures
import datetime as dt
import json
import logging
import os
from pathlib import Path
import re
import sqlite3
import threading
import unicodedata
import urllib.request
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get('CATALOG_DB', ROOT / 'data' / 'catalog.sqlite3'))
API = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
PACIFIC = ZoneInfo('America/Los_Angeles')
LOCK = threading.Lock()
LOG = logging.getLogger('catalog')


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Courtside/1.0 (NBA video discovery)', 'Accept': 'application/json'})
    with urllib.request.urlopen(request, timeout=18) as response:
        return json.load(response)


def normalize(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text.lower()) if not unicodedata.combining(c))


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB_PATH, timeout=15)
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('CREATE TABLE IF NOT EXISTS clips (id TEXT PRIMARY KEY, published TEXT, game_date TEXT, kind TEXT, teams TEXT, search TEXT, payload TEXT)')
    db.execute('CREATE INDEX IF NOT EXISTS clips_published ON clips(published DESC)')
    db.execute('CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)')
    return db


def kind_for(title):
    title = title.lower()
    for kind, pattern in [('Dunks', r'dunk|slam|alley.oop|poster'), ('Three-pointers', r'3-point|three.point|from deep|triple|beyond the arc'), ('Blocks', r'block|reject|swat'), ('Assists', r'assist|dime|no.look|dish|behind.the.back pass'), ('Steals', r'steal|pick.pocket'), ('Layups', r'layup|lay-in|floater')]:
        if re.search(pattern, title):
            return kind
    return 'Highlights'


def clip_from(video, event=None):
    links = video.get('links', {})
    source = links.get('source', {}).get('href', '')
    if not source.startswith('https://') or not video.get('id'):
        return None
    # Never reinterpret a provider's explicit syndication restriction.
    if video.get('syndicatable') is False:
        return None
    published = video.get('originalPublishDate') or video.get('published') or video.get('lastModified') or ''
    expiry = video.get('timeRestrictions', {}).get('expirationDate', '')
    if expiry and expiry < dt.datetime.now(dt.timezone.utc).isoformat():
        return None
    categories = video.get('categories', [])
    teams = [{'id': str(c['teamId']), 'name': c['description'], 'abbr': c.get('team', {}).get('abbreviation', '')} for c in categories if c.get('type') == 'team' and c.get('teamId')]
    players = [{'id': str(c['athleteId']), 'name': c['description']} for c in categories if c.get('type') == 'athlete' and c.get('athleteId')]
    events = [c['description'] for c in categories if c.get('type') == 'event' and c.get('description')]
    matchup = events[0] if events else ''
    game_date = published[:10]
    if event:
        matchup = event['name']
        game_date = dt.datetime.fromisoformat(event['date'].replace('Z', '+00:00')).astimezone(PACIFIC).date().isoformat()
        # Some summary clips have no category tags. Preserve the actual matchup.
        for competitor in event.get('competitions', [{}])[0].get('competitors', []):
            team = competitor.get('team', {})
            if team.get('id') and not any(t['id'] == team['id'] for t in teams):
                teams.append({'id': team['id'], 'name': team['displayName'], 'abbr': team['abbreviation']})
    return {'id': str(video['id']), 'title': video['headline'], 'description': video.get('description', ''), 'published': published, 'gameDate': game_date, 'kind': kind_for(video['headline']), 'duration': video.get('duration', 0), 'thumbnail': video.get('thumbnail') or (video.get('images') or [{}])[0].get('url', ''), 'video': source, 'sourceUrl': links.get('web', {}).get('href') or f"https://www.espn.com/video/clip/_/id/{video['id']}", 'source': 'ESPN', 'teams': teams, 'players': players, 'matchup': matchup, 'expires': expiry}


def store(clips):
    with connect() as db:
        for clip in clips:
            if not clip:
                continue
            play_aliases = {'Dunks': 'dunk dunks slam slams poster', 'Three-pointers': 'three threes 3 3s 3pt three-pointer 3-pointer', 'Assists': 'assist assists pass passes dime dimes', 'Blocks': 'block blocks rejection', 'Steals': 'steal steals', 'Layups': 'layup layups lay-in floater'}
            team_aliases = {'GS': 'GSW', 'NY': 'NYK', 'SA': 'SAS', 'NO': 'NOP', 'WSH': 'WAS', 'UTAH': 'UTA'}
            search = normalize(' '.join([clip['title'], clip['description'], clip['kind'], clip['matchup'], play_aliases.get(clip['kind'], '')] + [t['name'] + ' ' + t['abbr'] + ' ' + team_aliases.get(t['abbr'], '') for t in clip['teams']] + [p['name'] for p in clip['players']]))
            db.execute('INSERT OR REPLACE INTO clips VALUES (?, ?, ?, ?, ?, ?, ?)', (clip['id'], clip['published'], clip['gameDate'], clip['kind'], json.dumps([t['id'] for t in clip['teams']]), search, json.dumps(clip)))


def initialize():
    with connect() as db:
        count = db.execute('SELECT COUNT(*) FROM clips').fetchone()[0]
    seed = ROOT / 'data' / 'seed.json'
    if not count and seed.exists():
        store(json.loads(seed.read_text()))


def sync(days=7):
    if not LOCK.acquire(blocking=False):
        return
    errors = []
    success = 0
    try:
        today = dt.datetime.now(PACIFIC).date()
        def day_events(day):
            return fetch(f'{API}/scoreboard?dates={day:%Y%m%d}').get('events', [])
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(day_events, today - dt.timedelta(days=i)) for i in range(days)]
            events = []
            for future in futures:
                try:
                    events.extend(future.result())
                except Exception as error:
                    errors.append(type(error).__name__)
            def game_clips(event):
                summary = fetch(f"{API}/summary?event={event['id']}")
                videos = summary.get('videos', [])
                roster = {}
                for team in summary.get('boxscore', {}).get('players', []):
                    for stats in team.get('statistics', []):
                        for row in stats.get('athletes', []):
                            athlete = row.get('athlete', {})
                            if athlete.get('id') and athlete.get('displayName'):
                                roster[athlete['id']] = {'id': athlete['id'], 'name': athlete['displayName']}
                clips = [clip_from(v, event) for v in videos]
                for clip in clips:
                    if not clip:
                        continue
                    text = normalize(clip['title'] + ' ' + clip['description'])
                    for player in roster.values():
                        name = normalize(player['name'])
                        parts = [p for p in name.split() if p not in ('jr.', 'jr', 'ii', 'iii', 'iv')]
                        surname = parts[-1]
                        unique = sum(normalize(p['name']).split()[-1] == surname for p in roster.values()) == 1
                        if name in text or (unique and re.search(r'(?<!\w)' + re.escape(surname) + r'(?!\w)', text)):
                            if not any(p['id'] == player['id'] for p in clip['players']):
                                clip['players'].append(player)
                return clips
            for future in [executor.submit(game_clips, event) for event in events]:
                try:
                    store(future.result())
                    success += 1
                except Exception as error:
                    errors.append(type(error).__name__)
            # News fills in publisher features and recaps not tied to a game summary.
            try:
                articles = fetch(f'{API}/news?limit=100').get('articles', [])
                with connect() as db:
                    known = {row[0] for row in db.execute('SELECT id FROM clips')}
                ids = [str(a['id']) for a in articles if a.get('type') == 'Media' and str(a['id']) not in known]
                def get_clip(clip_id):
                    videos = fetch(f'https://content.core.api.espn.com/v1/video/clips/{clip_id}').get('videos', [])
                    return clip_from(videos[0]) if videos else None
                for future in [executor.submit(get_clip, clip_id) for clip_id in ids]:
                    try:
                        store([future.result()])
                        success += 1
                    except Exception as error:
                        errors.append(type(error).__name__)
            except Exception as error:
                errors.append(type(error).__name__)
        with connect() as db:
            if success:
                db.execute('INSERT OR REPLACE INTO metadata VALUES (?, ?)', ('lastSync', dt.datetime.now(dt.timezone.utc).isoformat()))
            db.execute('INSERT OR REPLACE INTO metadata VALUES (?, ?)', ('syncErrors', str(len(errors))))
        LOG.info('Index refreshed: %s successful sources, %s unavailable', success, len(errors))
    finally:
        LOCK.release()


def search(params):
    query = (params.get('q', [''])[0])[:200]
    team = params.get('team', [''])[0]
    kind = params.get('kind', [''])[0]
    date = params.get('date', [''])[0]
    sort = params.get('sort', ['newest'])[0]
    try:
        offset = max(0, min(100000, int(params.get('offset', ['0'])[0])))
        limit = max(1, min(60, int(params.get('limit', ['24'])[0])))
    except ValueError:
        raise ValueError('Invalid page size or offset')
    clauses, values = [], []
    # Expired videos are never advertised as playable.
    clauses.append("(json_extract(payload, '$.expires') = '' OR json_extract(payload, '$.expires') > ?)")
    values.append(dt.datetime.now(dt.timezone.utc).isoformat())
    for token in normalize(query).split():
        clauses.append("search LIKE ? ESCAPE '\\'")
        values.append('%' + token.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_') + '%')
    if team:
        clauses.append('EXISTS (SELECT 1 FROM json_each(clips.teams) WHERE value = ?)')
        values.append(team)
    if kind:
        clauses.append('kind = ?')
        values.append(kind)
    if date:
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
            raise ValueError('Use a YYYY-MM-DD date')
        clauses.append('game_date = ?')
        values.append(date)
    where = ' WHERE ' + ' AND '.join(clauses)
    ordering = 'published ASC, id ASC' if sort == 'oldest' else 'CAST(json_extract(payload, "$.duration") AS INTEGER) ASC, published DESC' if sort == 'shortest' else 'published DESC, id DESC'
    with connect() as db:
        total = db.execute('SELECT COUNT(*) FROM clips' + where, values).fetchone()[0]
        clips = [json.loads(row[0]) for row in db.execute('SELECT payload FROM clips' + where + f' ORDER BY {ordering} LIMIT ? OFFSET ?', values + [limit, offset])]
    return {'clips': clips, 'total': total, 'offset': offset, 'hasMore': offset + len(clips) < total}


def metadata():
    with connect() as db:
        rows = [json.loads(row[0]) for row in db.execute("SELECT payload FROM clips WHERE json_extract(payload, '$.expires') = '' OR json_extract(payload, '$.expires') > ?", (dt.datetime.now(dt.timezone.utc).isoformat(),))]
        meta = dict(db.execute('SELECT key, value FROM metadata'))
    teams, players = {}, {}
    for row in rows:
        for team in row['teams']:
            teams[team['id']] = team
        for player in row['players']:
            players[player['id']] = player
    dates = sorted({row['gameDate'] for row in rows}, reverse=True)
    return {'total': len(rows), 'teams': sorted(teams.values(), key=lambda t: t['name']), 'players': sorted(players.values(), key=lambda p: p['name']), 'kinds': ['Highlights', 'Dunks', 'Three-pointers', 'Blocks', 'Assists', 'Steals', 'Layups'], 'dates': dates, 'lastSync': meta.get('lastSync'), 'syncErrors': int(meta.get('syncErrors', '0')), 'syncing': LOCK.locked(), 'source': 'ESPN', 'coverage': 'Recent publisher highlights. Not a complete play-by-play archive.'}


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    initialize()
    sync(int(os.environ.get('SYNC_DAYS', '14')))
    with connect() as db:
        rows = [json.loads(r[0]) for r in db.execute('SELECT payload FROM clips ORDER BY published DESC')]
    (ROOT / 'data' / 'seed.json').write_text(json.dumps(rows, ensure_ascii=False))
    print(f'Indexed {len(rows)} real clips')
