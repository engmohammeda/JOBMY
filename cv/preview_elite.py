#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""معاينة سريعة أثناء التطوير: يبني HTML ثم يصوّره ويقيس ارتفاع المحتوى."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_elite as B  # noqa: E402

html = B.save_html()
from playwright.sync_api import sync_playwright  # noqa: E402

out = "/home/user/preview_cv.png"
with sync_playwright() as pw:
    b = pw.chromium.launch()
    page = b.new_page(viewport={"width": 900, "height": 1400}, device_scale_factor=1.6)
    page.goto("file://" + html)
    page.wait_for_timeout(300)
    page.emulate_media(media="print")
    page.wait_for_timeout(200)
    natural = page.evaluate(
        """() => {
        const s = document.querySelector('.sheet');
        const before = s.getBoundingClientRect().height;
        s.style.minHeight = '0'; s.style.height = 'auto';
        const h = s.getBoundingClientRect().height;
        s.style.minHeight = ''; s.style.height = '';
        return { natural: h, before: before, mm: 96/25.4 };
      }"""
    )
    print("natural content: %.1f mm" % (natural["natural"] / natural["mm"]))
    info = page.evaluate(
        """() => {
        const s = document.querySelector('.sheet');
        const cs = getComputedStyle(s, '::before');
        return {
          sheetH: s.getBoundingClientRect().height,
          contentH: s.scrollHeight,
          lastBottom: document.querySelector('.foot').getBoundingClientRect().bottom,
          beforeLeft: cs.left, beforeRight: cs.right, beforeWidth: cs.width,
          mm: 96 / 25.4
        };
      }"""
    )
    mm = info["mm"]
    print("sheet height  : %.1f mm" % (info["sheetH"] / mm))
    print("content height: %.1f mm" % (info["contentH"] / mm))
    print("footer bottom : %.1f mm (A4 = 297)" % (info["lastBottom"] / mm))
    print("side bar      : left=%s right=%s width=%s" % (info["beforeLeft"], info["beforeRight"], info["beforeWidth"]))
    page.locator(".sheet").screenshot(path=out)
    b.close()
print("→", out)
