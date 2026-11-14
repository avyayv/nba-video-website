"""API contract tests: search intersection, safe literal input, paging and failures."""
import functools
import http.server
import json
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.error
import urllib.parse
import urllib.request
import catalog
from main import Handler


class CatalogAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.previous = catalog.DB_PATH
        catalog.DB_PATH = Path(cls.temp.name) / 'test.sqlite3'
        # Deliberately different dates, tags and types make filter mistakes observable.
        def clip(id, title, date, kind, team, players, seconds):
            return {'id': id, 'title': title, 'description': title, 'published': date + 'T20:00:00Z', 'gameDate': date, 'kind': kind, 'teams': [{'id': team, 'name': 'Los Angeles Lakers' if team == '13' else 'Golden State Warriors', 'abbr': 'LAL' if team == '13' else 'GS'}], 'players': [{'id': '23', 'name': players}], 'matchup': 'Warriors at Lakers', 'duration': seconds, 'expires': '', 'video': 'https://example.org/video.mp4', 'thumbnail': 'https://example.org/image.jpg', 'sourceUrl': 'https://example.org', 'source': 'ESPN'}
        clips = [clip('1', 'LeBron James throws down', '2026-11-11', 'Dunks', '13', 'LeBron James', 30), clip('2', 'James makes a three', '2026-11-12', 'Three-pointers', '13', 'LeBron James', 20), clip('3', 'Stephen Curry fires from deep', '2026-11-12', 'Three-pointers', '9', 'Stephen Curry', 15)]
        expired = clip('4', 'Expired LeBron clip', '2026-11-12', 'Dunks', '13', 'LeBron James', 10)
        expired['expires'] = '2001-01-01T00:00:00Z'
        catalog.store(clips + [expired])
        cls.http = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=cls.temp.name))
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f'http://127.0.0.1:{cls.http.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        catalog.DB_PATH = cls.previous
        cls.temp.cleanup()

    def get(self, path='/api/clips', **params):
        with urllib.request.urlopen(self.origin + path + '?' + urllib.parse.urlencode(params)) as response:
            return json.load(response)

    def test_search_filters_intersect_and_paginate_without_expired_clips(self):
        self.assertEqual(self.get(q='lebron', team='13', kind='Dunks')['total'], 1)
        self.assertEqual(self.get(q='lebron', team='9')['total'], 0)
        self.assertEqual(self.get(q='Curry threes')['clips'][0]['id'], '3')
        self.assertEqual(self.get(date='2026-11-12', kind='Three-pointers')['total'], 2)
        first = self.get(limit=1, sort='oldest')
        self.assertEqual(first['clips'][0]['id'], '1')
        self.assertTrue(first['hasMore'])
        self.assertEqual(self.get(limit=1, offset=1, sort='oldest')['clips'][0]['id'], '2')
        self.assertEqual(self.get(sort='shortest')['clips'][0]['id'], '3')
        self.assertEqual(self.get()['total'], 3)
        self.assertEqual(self.get('/api/meta')['total'], 3)

    def test_untrusted_search_is_literal_and_bad_paging_is_a_client_error(self):
        for query in ["' OR 1=1 --", '%', '_']:
            with self.subTest(query=query):
                self.assertEqual(self.get(q=query)['total'], 0)
        for params in [{'offset': 'abc'}, {'date': 'yesterday'}]:
            with self.subTest(params=params), self.assertRaises(urllib.error.HTTPError) as error:
                self.get(**params)
            self.assertEqual(error.exception.code, 400)
            error.exception.close()
        self.assertEqual(self.get('/api/clips/2')['title'], 'James makes a three')
        with self.assertRaises(urllib.error.HTTPError) as error:
            self.get('/api/clips/does-not-exist')
        self.assertEqual(error.exception.code, 404)
        error.exception.close()


if __name__ == '__main__':
    unittest.main()
