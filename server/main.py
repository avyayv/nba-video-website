"""Same-origin API and production static server; no third-party runtime packages."""
import functools
import http.server
import json
import logging
import os
from pathlib import Path
import threading
import time
import urllib.parse

from catalog import ROOT, connect, initialize, metadata, search, sync


class Handler(http.server.SimpleHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.espn.com https://*.espncdn.com https://*.akamaized.net data:; media-src https://*.akamaized.net https://*.dssott.com; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'")
        if self.path.startswith('/assets/') or self.path.startswith('/fonts/'):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        else:
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urllib.parse.urlsplit(self.path)
        try:
            if url.path == '/api/clips':
                return self.send_json(search(urllib.parse.parse_qs(url.query)))
            if url.path == '/api/meta':
                return self.send_json(metadata())
            if url.path.startswith('/api/clips/'):
                clip_id = url.path.rsplit('/', 1)[-1]
                with connect() as db:
                    row = db.execute('SELECT payload FROM clips WHERE id = ?', (clip_id,)).fetchone()
                return self.send_json(json.loads(row[0]) if row else {'error': 'Clip not found'}, 200 if row else 404)
            if url.path == '/api/health':
                return self.send_json({'status': 'ok', 'clips': metadata()['total']})
            if url.path.startswith('/api/'):
                return self.send_json({'error': 'Not found'}, 404)
            if url.path == '/':
                self.path = '/index.html'
            return super().do_GET()
        except ValueError as error:
            self.send_json({'error': str(error)}, 400)
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            logging.exception('Request failed')
            self.send_json({'error': 'The film room is temporarily unavailable. Please try again.'}, 500)


class Server(http.server.ThreadingHTTPServer):
    """Bound public request concurrency in addition to container resource limits."""
    slots = threading.BoundedSemaphore(48)

    def process_request(self, request, address):
        if not self.slots.acquire(blocking=False):
            try:
                request.sendall(b'HTTP/1.0 503 Service Unavailable\r\nContent-Length: 0\r\nConnection: close\r\n\r\n')
            finally:
                self.shutdown_request(request)
            return
        try:
            super().process_request(request, address)
        except Exception:
            self.slots.release()
            raise

    def process_request_thread(self, request, address):
        try:
            super().process_request_thread(request, address)
        finally:
            self.slots.release()


def refresh_loop():
    while True:
        try:
            sync(7)
        except Exception:
            logging.exception('Refresh unavailable; retaining the last good index')
        time.sleep(1800)


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    initialize()
    if os.environ.get('DISABLE_SYNC') != '1':
        threading.Thread(target=refresh_loop, daemon=True).start()
    handler = functools.partial(Handler, directory=str(ROOT / 'dist'))
    server = Server(('0.0.0.0', int(os.environ.get('PORT', '8080'))), handler)
    server.serve_forever()
