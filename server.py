#!/usr/bin/env python3
"""HTTP server with reverse proxy for Edge iPad Copilot prototype."""
import http.server
import os
import urllib.request
import urllib.parse
import mimetypes
import re

PORT = 8766
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # ===== Proxy endpoint =====
        if parsed.path == '/proxy':
            self.handle_proxy(parsed.query)
            return

        # ===== Static file serving =====
        # Map URL path to local file
        file_path = parsed.path
        if file_path == '/':
            file_path = '/index.html'

        local_path = os.path.join(ROOT, file_path.lstrip('/'))
        local_path = os.path.normpath(local_path)

        # Security: don't serve files outside ROOT
        if not local_path.startswith(ROOT):
            self.send_error(403, 'Forbidden')
            return

        if not os.path.isfile(local_path):
            self.send_error(404, 'Not Found')
            return

        # Serve the file
        content_type, _ = mimetypes.guess_type(local_path)
        if content_type is None:
            content_type = 'application/octet-stream'

        with open(local_path, 'rb') as f:
            body = f.read()

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_proxy(self, query_string):
        params = urllib.parse.parse_qs(query_string)
        target_url = params.get('url', [None])[0]

        if not target_url:
            self.send_error(400, 'Missing url parameter')
            return

        try:
            req = urllib.request.Request(target_url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                              'AppleWebKit/537.36 (KHTML, like Gecko) '
                              'Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            })
            resp = urllib.request.urlopen(req, timeout=10)
            body = resp.read()
            content_type = resp.headers.get('Content-Type', 'text/html')

            # For HTML: inject <base> tag so relative URLs resolve
            if 'text/html' in content_type:
                parsed_url = urllib.parse.urlparse(target_url)
                base_url = f'{parsed_url.scheme}://{parsed_url.netloc}'

                body_str = body.decode('utf-8', errors='replace')
                base_tag = f'<base href="{base_url}/" target="_self">'
                body_str = re.sub(
                    r'(<head[^>]*>)',
                    rf'\1{base_tag}',
                    body_str,
                    count=1,
                    flags=re.IGNORECASE
                )
                body = body_str.encode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            # No X-Frame-Options or CSP — allow iframe embedding
            self.end_headers()
            self.wfile.write(body)

        except Exception as e:
            error_msg = f'Proxy error: {e}'
            self.send_response(502)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Content-Length', str(len(error_msg)))
            self.end_headers()
            self.wfile.write(error_msg.encode())

    def log_message(self, format, *args):
        msg = format % args
        if '/proxy' in msg or '404' in msg or '502' in msg:
            super().log_message(format, *args)


with http.server.HTTPServer(("", PORT), Handler) as httpd:
    print(f"Edge iPad Copilot running at http://localhost:{PORT}")
    print(f"Proxy: http://localhost:{PORT}/proxy?url=<URL>")
    httpd.serve_forever()
