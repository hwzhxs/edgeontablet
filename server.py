#!/usr/bin/env python3
"""Simple HTTP server for Edge iPad Copilot prototype."""
import http.server
import socketserver

PORT = 8766

class Handler(http.server.SimpleHTTPRequestHandler):
    pass

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Edge iPad Copilot running at http://localhost:{PORT}")
    httpd.serve_forever()
