#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سيرتي — مولّد سيرة «النخبة»
Single source of truth  →  data.json
Outputs                 →  cv-elite.html  ·  cv-elite.pdf  ·  cv-elite.docx

الاستخدام:
    python3 cv/build_elite.py            # يبني كل الصيغ
    python3 cv/build_elite.py --html     # HTML فقط
    python3 cv/build_elite.py --pdf      # PDF فقط (يتطلب playwright + chromium)
    python3 cv/build_elite.py --docx     # Word فقط (يتطلب python-docx)
"""
from __future__ import annotations

import base64
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONT_DIR = os.path.join(ROOT, "fonts", "plex")
DATA_PATH = os.path.join(HERE, "elite", "data.json")
CSS_PATH = os.path.join(HERE, "elite", "cv.css")          # ورقة السيرة المستقلة
TPL_CSS_PATH = os.path.join(HERE, "elite", "template.css")  # نفس القالب داخل التطبيق
OUT = HERE

# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------
def load_data() -> dict:
    with open(DATA_PATH, encoding="utf-8") as fh:
        return json.load(fh)


def esc(s: str) -> str:
    return (
        str(s or "")
        .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def tel(phone: str) -> str:
    return "tel:" + re.sub(r"[^0-9+]", "", phone or "")


def font_css(weights=(400, 500, 600, 700), subsets=("arabic", "latin")) -> str:
    """يبني @font-face مع تضمين الخط بصيغة base64 ليعمل الملف بدون إنترنت."""
    out = []
    for w in weights:
        for sub in subsets:
            path = os.path.join(FONT_DIR, f"plex-ar-{w}-{sub}.woff2")
            if not os.path.exists(path):
                continue
            b64 = base64.b64encode(open(path, "rb").read()).decode()
            out.append(
                "@font-face{font-family:'PlexAr';font-style:normal;font-weight:%d;"
                "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');}" % (w, b64)
            )
    return "\n".join(out)


ICONS = {
    "phone": '<path d="M6.6 3.6h3l1.5 3.9-2 1.3a12.4 12.4 0 0 0 5.5 5.5l1.3-2 3.9 1.5v3a2 2 0 0 1-2.1 2A17.2 17.2 0 0 1 4.6 5.7a2 2 0 0 1 2-2.1z"/>',
    "mail": '<rect x="3.2" y="5.6" width="17.6" height="12.8" rx="1.8"/><path d="m3.8 6.6 8.2 5.6 8.2-5.6"/>',
    "pin": '<path d="M12 21.2s6.6-6.1 6.6-10.8a6.6 6.6 0 1 0-13.2 0C5.4 15.1 12 21.2 12 21.2z"/><circle cx="12" cy="10.2" r="2.3"/>',
    "linkedin": '<path d="M5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>',
    "globe": '<circle cx="12" cy="12" r="8.6"/><path d="M3.6 12h16.8M12 3.4a13.6 13.6 0 0 1 0 17.2 13.6 13.6 0 0 1 0-17.2"/>',
}


FILLED = {"linkedin"}


def ico(name: str) -> str:
    if name in FILLED:
        return ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
                + ICONS[name] + "</svg>")
    return (
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + ICONS[name] + "</svg>"
    )


# --------------------------------------------------------------------------
# HTML
# --------------------------------------------------------------------------
def build_html(data: dict, embed_fonts: bool = True) -> str:
    p = data["personal"]
    meta = data["meta"]
    css = open(CSS_PATH, encoding="utf-8").read()
    fonts = font_css() if embed_fonts else ""
    accent = meta.get("accent", "#1B3A5C")
    accent2 = meta.get("accent2", "#B4874A")

    # ---- header meta row
    meta_items = [
        f'<li>{ico("phone")}<a href="{esc(tel(p["phone"]))}" dir="ltr"><bdi>{esc(p["phone"])}</bdi></a></li>',
        f'<li>{ico("mail")}<a href="mailto:{esc(p["email"])}" dir="ltr"><bdi>{esc(p["email"])}</bdi></a></li>',
        f'<li>{ico("pin")}<span>{esc(p["city"])}</span></li>',
        f'<li>{ico("linkedin")}<a href="{esc(p["linkedinUrl"])}" dir="ltr"><bdi>{esc(p["linkedin"])}</bdi></a></li>',
        f'<li>{ico("globe")}<a href="{esc(p["websiteUrl"])}" dir="ltr"><bdi>{esc(p["website"])}</bdi></a></li>',
    ]

    # ---- summary
    seq = [0]

    def sec_head(title, en):
        seq[0] += 1
        return (f'<div class="sec-head"><span class="sec-num">{seq[0]:02d}</span>'
                f'<h2>{title}</h2><span class="sec-en">{en}</span></div>')

    summary = f"""
    <section class="sec">
      {sec_head("الملخص المهني", "Profile")}
      <p class="summary">{esc(data["summary"])}</p>
    </section>"""

    # ---- experience
    exp_blocks = []
    for job in data["experience"]:
        start = esc(job.get("start", ""))
        if job.get("current"):
            dates = f'<bdi>{start} — حتى الآن</bdi>' if start else "حتى الآن"
        else:
            end = esc(job.get("end", ""))
            dates = f'<bdi dir="ltr">{start} — {end}</bdi>' if (start and end) else (start or end)
        bullets = "".join(f"<li>{esc(b)}</li>" for b in job["bullets"])
        place = f'<span class="place">{esc(job["place"])}</span>' if job.get("place") else ""
        exp_blocks.append(f"""
      <article class="exp">
        <div class="exp-top">
          <h3 class="exp-role">{esc(job["role"])}</h3>
          <span class="exp-date">{dates}</span>
        </div>
        <p class="exp-org">{esc(job["org"])}{place}</p>
        <ul class="bullets">{bullets}</ul>
      </article>""")
    experience = f"""
    <section class="sec">
      {sec_head("الخبرات العملية", "Experience")}
      {"".join(exp_blocks)}
    </section>"""

    # ---- skills
    rows = []
    for grp in data["skills"]:
        items = '<span class="dot">·</span>'.join(f"<span>{esc(i)}</span>" for i in grp["items"])
        rows.append(f"<dt>{esc(grp['label'])}</dt><dd>{items}</dd>")
    skills = f"""
    <section class="sec">
      {sec_head("المهارات", "Skills")}
      <dl class="skills">{"".join(rows)}</dl>
    </section>"""

    # ---- education / languages / certifications
    edu = data["education"][0]
    edu_html = f'<p class="kv"><b>{esc(edu["degree"])}</b>'
    if edu.get("school"):
        edu_html += f'<span class="sub">{esc(edu["school"])}</span>'
    edu_html += f'<span class="sub">{esc(edu["year"])}</span>'
    if edu.get("note"):
        edu_html += f'<span class="note">{esc(edu["note"])}</span>'
    edu_html += "</p>"

    langs = "".join(
        f'<p class="kv"><b>{esc(l["name"])}</b><span class="sub">{esc(l["level"])}</span></p>'
        for l in data["languages"]
    )
    certs = "".join(f'<span class="chip">{esc(c)}</span>' for c in data["certifications"])

    cols = f"""
    <section class="sec">
      {sec_head("التعليم واللغات والدورات", "Education &amp; more")}
      <div class="cols3">
        <div><p class="col-h">المؤهل العلمي</p>{edu_html}</div>
        <div><p class="col-h">اللغات</p>{langs}</div>
        <div><p class="col-h">الدورات والشهادات</p><div class="chips">{certs}</div></div>
      </div>
    </section>"""

    ready = "".join(f"<span>{esc(x)}</span>" for x in data.get("availability", []))
    ready_html = (f'<section class="sec">{sec_head("الجاهزية", "Availability")}'
                  f'<div class="ready">{ready}</div></section>') if ready else ""

    footer = f"""
    <footer class="foot">
      <span>{esc(data.get("footerNote", ""))}</span>
      <span class="fx"><b><bdi dir="ltr">{esc(p["phone"])}</bdi></b> · <bdi dir="ltr">{esc(p["email"])}</bdi></span>
    </footer>"""

    toolbar = """
  <div class="toolbar" role="toolbar" aria-label="أدوات الملف">
    <button type="button" class="primary" onclick="window.print()">طباعة / حفظ PDF</button>
    <button type="button" id="editBtn">تفعيل التعديل</button>
  </div>
  <script>
    (function () {
      var btn = document.getElementById('editBtn');
      var sheet = document.querySelector('.sheet');
      var on = false;
      btn.addEventListener('click', function () {
        on = !on;
        sheet.setAttribute('contenteditable', on ? 'true' : 'false');
        sheet.style.outline = on ? '2px dashed rgba(27,58,92,.35)' : 'none';
        btn.textContent = on ? 'إنهاء التعديل' : 'تفعيل التعديل';
      });
    })();
  </script>"""

    return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(meta["title"])}</title>
<meta name="author" content="{esc(p["fullName"])}">
<meta name="description" content="{esc(p["jobTitle"])} — {esc(p["city"])}">
<style>{fonts}</style>
<style>
:root{{--accent:{accent};--accent2:{accent2}}}
{css}
</style>
</head>
<body>
<main class="sheet">
  <header class="head">
    <div class="eyebrow"><span>{esc(p["eyebrow"])}</span><span class="tag">{esc(p["status"])}</span></div>
    <h1 class="name">{esc(p["fullName"])}</h1>
    <p class="role">{esc(p["jobTitle"])}<span class="sep">·</span>{esc(p["jobTitleLine2"])}</p>
    <ul class="meta">{"".join(meta_items)}</ul>
  </header>
{summary}
{experience}
{skills}
{cols}
{ready_html}
{footer}
</main>
{toolbar}
</body>
</html>
"""


def save_html() -> str:
    data = load_data()
    html = build_html(data)
    path = os.path.join(OUT, "cv-elite.html")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html)
    return path


# --------------------------------------------------------------------------
# EMBED — يحقن الخطوط وقالب النخبة داخل index.html بين علامات واضحة
# --------------------------------------------------------------------------
def embed_into_app() -> None:
    idx = os.path.join(ROOT, "index.html")
    html = open(idx, encoding="utf-8").read()

    def inject(html: str, tag: str, payload: str) -> str:
        start = f"/* >>> {tag} >>> */"
        end = f"/* <<< {tag} <<< */"
        i = html.index(start)
        j = html.index(end)
        return html[: i + len(start)] + "\n" + payload + "\n" + html[j:]

    fonts = font_css()
    elite = open(TPL_CSS_PATH, encoding="utf-8").read()
    html = inject(html, "ELITE-FONTS", fonts)
    html = inject(html, "ELITE-CV-CSS", elite)
    open(idx, "w", encoding="utf-8").write(html)
    print("EMBED → index.html  (fonts %d KB · template %d KB)" % (len(fonts) // 1024, len(elite) // 1024))


# --------------------------------------------------------------------------
# PDF (Chromium → طباعة حقيقية A4 مع تشكيل عربي سليم)
# --------------------------------------------------------------------------
def save_pdf() -> str:
    html_path = save_html()
    pdf_path = os.path.join(OUT, "cv-elite.pdf")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:  # pragma: no cover
        raise SystemExit("playwright غير مثبّت — نفّذ: pip install playwright && python3 -m playwright install chromium")

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1240, "height": 1754})
        page.goto("file://" + html_path)
        page.emulate_media(media="print")
        page.wait_for_timeout(400)
        page.pdf(
            path=pdf_path,
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        browser.close()
    return pdf_path


# --------------------------------------------------------------------------
# DOCX
# --------------------------------------------------------------------------
def save_docx() -> str:
    from docx import Document
    from docx.enum.section import WD_SECTION
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt, RGBColor

    data = load_data()
    p = data["personal"]
    accent = data["meta"].get("accent", "#1B3A5C").lstrip("#").upper()
    ink = "141E2B"
    body = "333F4E"
    muted = "6C7887"
    hair = "D3DBE4"
    FONT = "Dubai"

    doc = Document()

    # ---- page setup
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.top_margin = Cm(1.5)
    sec.bottom_margin = Cm(1.3)
    sec.left_margin = Cm(1.7)
    sec.right_margin = Cm(1.7)
    sec._sectPr.append(OxmlElement("w:bidi"))

    # ---- default style
    style = doc.styles["Normal"]
    style.font.name = FONT
    style.font.size = Pt(9.5)
    style.font.color.rgb = RGBColor.from_string(body)
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(attr), FONT)
    rtl = OxmlElement("w:rtl")
    rpr.append(rtl)
    style.paragraph_format.space_after = Pt(0)
    style.paragraph_format.line_spacing = 1.28

    def para(space_before=0, space_after=0, align=WD_ALIGN_PARAGRAPH.RIGHT, line=1.28, keep=False, rtl_par=True):
        par = doc.add_paragraph()
        fmt = par.paragraph_format
        fmt.space_before = Pt(space_before)
        fmt.space_after = Pt(space_after)
        fmt.line_spacing = line
        fmt.alignment = align
        fmt.keep_with_next = keep
        ppr = par._p.get_or_add_pPr()
        bidi = OxmlElement("w:bidi")
        bidi.set(qn("w:val"), "1" if rtl_par else "0")
        ppr.append(bidi)
        return par

    def run(par, text, size=9.5, bold=False, color=body, font=FONT, spacing=None, caps=False, ltr=False):
        r = par.add_run(text)
        r.font.name = font
        r.font.size = Pt(size)
        r.bold = bold
        r.font.color.rgb = RGBColor.from_string(color)
        r.font.all_caps = caps
        rpr = r._element.get_or_add_rPr()
        rf = rpr.find(qn("w:rFonts"))
        if rf is None:
            rf = OxmlElement("w:rFonts")
            rpr.append(rf)
        for attr in ("w:ascii", "w:hAnsi", "w:cs"):
            rf.set(qn(attr), font)
        if ltr:
            mark = OxmlElement("w:rtl")
            mark.set(qn("w:val"), "0")
            rpr.append(mark)
        else:
            rpr.append(OxmlElement("w:rtl"))
        if spacing:
            sp = OxmlElement("w:spacing")
            sp.set(qn("w:val"), str(int(spacing * 20)))
            rpr.append(sp)
        return r

    def bottom_border(par, color=hair, size=6, space=4):
        ppr = par._p.get_or_add_pPr()
        pbdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), str(size))
        bottom.set(qn("w:space"), str(space))
        bottom.set(qn("w:color"), color)
        pbdr.append(bottom)
        ppr.append(pbdr)

    def section_title(ar, en):
        par = para(space_before=14, space_after=6, keep=True)
        run(par, ar, size=12, bold=True, color=ink)
        run(par, "   " + en.upper(), size=6.5, color=muted, spacing=1.6)
        bottom_border(par)
        return par

    # ---- header
    par = para(space_after=2)
    run(par, p["eyebrow"], size=7.5, color=muted, spacing=1.4)
    run(par, "      " + p["status"], size=8, color=accent, bold=True)
    par = para(space_after=1)
    run(par, p["fullName"], size=26, bold=True, color=ink)
    par = para(space_after=4)
    run(par, p["jobTitle"], size=11, bold=True, color=accent)
    run(par, "  ·  " + p["jobTitleLine2"], size=10, color=accent)
    par = para(space_after=10, rtl_par=False)
    contacts = [p["phone"], p["email"], p["linkedin"], p["website"]]
    for c in contacts:
        run(par, "\u200e" + c + "\u200e", size=8.2, color=body, ltr=True)
        run(par, "   |   ", size=8.2, color=muted, ltr=True)
    run(par, p["city"], size=8.2, color=body)
    bottom_border(par, size=12, space=6)

    # ---- summary
    section_title("الملخص المهني", "Profile")
    par = para(line=1.5)
    par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run(par, data["summary"], size=9.6)

    # ---- experience
    section_title("الخبرات العملية", "Experience")
    for i, job in enumerate(data["experience"]):
        end = "حتى الآن" if job.get("current") else job.get("end", "")
        dates = f'{job.get("start","")} — {end}'
        par = para(space_before=0 if i == 0 else 8, space_after=1, keep=True)
        run(par, job["role"], size=10.6, bold=True, color=ink)
        run(par, "        \u200e" + dates + "\u200e", size=8, color=muted, ltr=True)
        par = para(space_after=3, keep=True)
        org = job["org"] + (" · " + job["place"] if job.get("place") else "")
        run(par, org, size=8.9, color=accent, bold=True)
        for b in job["bullets"]:
            bp = para(space_after=1.5, line=1.42)
            bp.paragraph_format.left_indent = Cm(0.55)
            bp.paragraph_format.first_line_indent = Cm(-0.55)
            run(bp, "▪  ", size=8.6, color=accent)
            run(bp, b, size=9.25)

    # ---- skills
    section_title("المهارات", "Skills")
    for grp in data["skills"]:
        par = para(space_after=2, line=1.4)
        run(par, grp["label"] + ":", size=8.9, bold=True, color=ink)
        run(par, "  " + "  ·  ".join(grp["items"]), size=9.05)

    # ---- education / languages / certifications (single flow, clean)
    section_title("التعليم واللغات والدورات", "Education & more")
    edu = data["education"][0]
    par = para(space_after=1)
    run(par, edu["degree"], size=9.6, bold=True, color=ink)
    run(par, "   \u200e" + edu["year"] + "\u200e", size=8.2, color=muted, ltr=True)
    if edu.get("note"):
        par = para(space_after=3)
        run(par, edu["note"], size=8.8, color=muted)
    par = para(space_after=1)
    run(par, "اللغات: ", size=9.0, bold=True, color=ink)
    run(par, "  ·  ".join(f'{l["name"]} — {l["level"]}' for l in data["languages"]), size=9.0)
    par = para(space_after=2)
    run(par, "الدورات والشهادات: ", size=9.0, bold=True, color=ink)
    run(par, "  ·  ".join(data["certifications"]), size=9.0)

    # ---- availability
    section_title("الجاهزية", "Availability")
    for item in data.get("availability", []):
        bp = para(space_after=1.2, line=1.35)
        bp.paragraph_format.left_indent = Cm(0.55)
        bp.paragraph_format.first_line_indent = Cm(-0.55)
        run(bp, "▪  ", size=8.6, color=accent)
        run(bp, item, size=9.0)

    # ---- footer
    par = para(space_before=12, space_after=0)
    run(par, data.get("footerNote", ""), size=7.6, color=muted)
    par = para(space_after=0)
    run(par, "\u200e" + p["phone"] + " · " + p["email"] + "\u200e", size=7.6, color=muted, ltr=True)

    path = os.path.join(OUT, "cv-elite.docx")
    doc.save(path)
    return path


# --------------------------------------------------------------------------
def main() -> None:
    args = sys.argv[1:]
    todo = set(args) if args else {"--embed", "--html", "--pdf", "--docx"}
    if "--embed" in todo:
        embed_into_app()
    if "--html" in todo:
        print("HTML →", save_html())
    if "--pdf" in todo:
        print("PDF  →", save_pdf())
    if "--docx" in todo:
        print("DOCX →", save_docx())


if __name__ == "__main__":
    main()
