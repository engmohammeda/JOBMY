#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سيرفر تطوير محلي بسيط لمشروع «سيرتي» (موقع ثابت بدون بناء).

- يستمع على 0.0.0.0 حتى يعمل داخل المعاينة (preview) في المنصات السحابية.
- يضيف ترويسات no-cache حتى تظهر أي تعديلات فورًا دون تحديث قسري.
- يضبط أنواع MIME المهمة (js, woff2, json, svg, pdf, docx...) لأن
  http.server الافتراضي يرسل بعضها كـ application/octet-stream.

الاستخدام:
    python3 serve.py            # المنفذ 8080 افتراضيًا
    PORT=3000 python3 serve.py  # منفذ مخصص
"""
import functools
import os
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8080"))
HOST = os.environ.get("HOST", "0.0.0.0")


class Handler(SimpleHTTPRequestHandler):
    # HTTP/1.1 يفعّل keep-alive ويسرّع تحميل الأصول (SimpleHTTPRequestHandler يرسل Content-Length)
    protocol_version = "HTTP/1.1"

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".ttf": "font/ttf",
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".md": "text/markdown; charset=utf-8",
        ".webmanifest": "application/manifest+json",
    }

    def end_headers(self):
        # تطوير: لا تخزين مؤقت
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), fmt % args))
        sys.stdout.flush()


def main():
    handler = functools.partial(Handler, directory=ROOT)
    with ThreadingHTTPServer((HOST, PORT), handler) as httpd:
        print(f"Sirati dev server → http://{HOST}:{PORT}/  (root: {ROOT})", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped", flush=True)


if __name__ == "__main__":
    main()
