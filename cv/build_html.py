#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد نسخة HTML تفاعلية مستقلة للسيرة الذاتية — القالب «الاحترافي النظيف».
تعمل على أي جهاز بدون إنترنت: خط Cairo مدمج بصيغة base64،
مع زر «تفعيل التعديل» للكتابة مباشرة على السيرة، وزر الطباعة / حفظ PDF.
"""
import base64
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# ---------- 1) توليد جسد السيرة من تطبيق «سيرتي» (نفس القالب المستخدم في المحرر) ----------
out = subprocess.run(
    ["node", "-e", r"""
global.window = {};
require('./js/data.js');
require('./js/presets.js');
var CV = global.window.CV;
var presets = global.window.CV_PRESETS;
var p = presets[presets.length - 1];
process.stdout.write(CV.renderCv(p, 'pro'));
"""],
    cwd=ROOT, capture_output=True, text=True, check=True,
)
cv_body = out.stdout.strip()

# ---------- 2) خط Cairo بصيغة base64 ----------
with open(os.path.join(HERE, "fonts", "Cairo-Regular.ttf"), "rb") as f:
    font_reg = base64.b64encode(f.read()).decode()
with open(os.path.join(HERE, "fonts", "Cairo-Bold.ttf"), "rb") as f:
    font_bold = base64.b64encode(f.read()).decode()

FONT_CSS = (
    "@font-face{font-family:'Cairo';src:url(data:font/ttf;base64,%s) format('truetype');"
    "font-weight:400;font-style:normal}@font-face{font-family:'Cairo';"
    "src:url(data:font/ttf;base64,%s) format('truetype');font-weight:700;font-style:normal}"
    % (font_reg, font_bold)
)

# ---------- 3) صفحة مستقلة ----------
doc = f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>السيرة الذاتية — محمد البخيتي — موظف مكتب خدمات عامة</title>
<style>
{FONT_CSS}
html,body{{margin:0;padding:0;background:#eef1f7;font-family:'Cairo','Segoe UI',Tahoma,'Noto Naskh Arabic',Arial,sans-serif}}
body{{display:flex;justify-content:center;padding:24px 12px}}

/* ---------- أدوات التعديل والطباعة ---------- */
.toolbar{{position:fixed;top:14px;inset-inline-end:14px;display:flex;gap:8px;z-index:10}}
.toolbar .btn{{
  border:0;border-radius:9px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;
  box-shadow:0 4px 14px rgba(16,24,40,.18);color:#fff;background:#18466e;
}}
.toolbar .btn.alt{{background:#fff;color:#18466e;border:1.2px solid #18466e}}
@media print{{
  body{{background:#fff;padding:0;display:block}}
  .toolbar{{display:none}}
  .cv-page{{box-shadow:none!important;border-radius:0!important;margin:0}}
}}

/* ---------- CSS القالب «الاحترافي النظيف» (مطابق لتطبيق سيرتي) ---------- */
.cv-page{{
  width:210mm;min-height:297mm;background:#fff;color:#142030;box-sizing:border-box;
  font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:9.6pt;line-height:1.55;
  position:relative;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;
  --cv-accent:#1f3a5f;--cv-accent2:#c9a227;--cv-ink:#142030;--cv-mut:#687688;--cv-line:#e2e8f1;
  box-shadow:0 16px 40px rgba(16,24,40,.18);border-radius:4px;
}}
.cv-page *{{box-sizing:border-box}}
.cv-page p{{margin:0}}
.cv-page img{{max-width:100%}}
.cv-name{{font-size:21pt;line-height:1.12;font-weight:700;margin:0;letter-spacing:-.01em;color:var(--cv-ink)}}
.cv-role{{font-size:10.6pt;font-weight:600;color:var(--cv-accent);margin-top:1.6mm;line-height:1.3}}
.cv-contact{{display:flex;justify-content:flex-start;flex-wrap:wrap;gap:4.5mm;margin-top:3.2mm;font-size:8.6pt;color:var(--cv-mut);list-style:none;padding:0;margin-block-end:0}}
.cv-contact .cv-c{{display:inline-flex;align-items:center;gap:1.7mm}}
.cv-contact .cv-c a{{display:inline-flex;align-items:center;gap:1.7mm;color:var(--cv-mut);text-decoration:none}}
.cv-contact .cv-c a:hover{{color:var(--cv-accent)}}
.cv-contact .cv-c svg{{width:3.3mm;height:3.3mm;color:var(--cv-accent);flex:0 0 auto}}
.cv-contact a{{color:var(--cv-mut);text-decoration:none}}
.cv-contact a:hover{{color:var(--cv-accent)}}
.pro-wa{{color:var(--cv-accent);font-weight:600}}
.pro-rule{{margin-top:4.4mm;border-bottom:.3mm solid var(--cv-line);position:relative}}
.pro-rule::after{{content:"";position:absolute;inset-inline-end:0;bottom:-.3mm;width:34mm;height:.9mm;background:var(--cv-accent);border-radius:.45mm}}
.cv-sec{{margin-top:6.6mm}}
.cv-h{{font-size:10.8pt;font-weight:700;color:var(--cv-accent);margin:0 0 2.8mm;display:flex;align-items:center;gap:2.6mm}}
.cv-h::before{{content:"";width:2.3mm;height:2.3mm;background:var(--cv-accent);border-radius:.4mm;flex:0 0 auto}}
.cv-h::after{{content:"";height:.25mm;background:var(--cv-line);flex:1}}
.cv-summary{{font-size:9.4pt;color:var(--cv-ink);line-height:1.62}}
.pro-skills{{display:grid;grid-template-columns:1fr;gap:0}}
.pro-skill-cat{{font-size:8.4pt;font-weight:700;color:var(--cv-accent);letter-spacing:.07em;margin:2.2mm 0 1.2mm}}
.pro-skill-row{{display:grid;grid-template-columns:1fr 1fr;gap:0 7mm}}
.pro-skill-line{{display:flex;justify-content:space-between;align-items:center;gap:3mm;font-size:9.2pt;color:var(--cv-ink);padding:1.15mm 0;border-bottom:.2mm solid var(--cv-line)}}
.pro-skill-line .cv-dots{{width:5.6mm;display:inline-flex;gap:.8mm;flex:0 0 auto}}
.pro-skill-line .cv-dots i{{width:1.4mm;height:1.4mm;border-radius:50%;background:var(--cv-line);display:inline-block}}
.pro-skill-line .cv-dots i.on{{background:var(--cv-accent)}}
.cv-item{{margin-top:3.4mm}}
.cv-item:first-child{{margin-top:0}}
.cv-ihead{{display:flex;justify-content:space-between;align-items:baseline;gap:5mm}}
.cv-t{{font-size:10pt;font-weight:700;color:var(--cv-ink)}}
.cv-d{{font-size:8.5pt;color:var(--cv-mut);font-weight:500;white-space:nowrap}}
.cv-o{{font-size:9pt;color:var(--cv-accent);font-weight:600;margin-top:.7mm}}
.cv-desc ul{{margin:1.7mm 0 0;padding:0;list-style:none}}
.cv-desc li{{font-size:9.2pt;color:var(--cv-ink);line-height:1.52;padding:.55mm 0 .55mm 4.6mm;position:relative;border-bottom:.2mm solid var(--cv-line)}}
.cv-desc li:last-child{{border-bottom:0}}
.cv-desc li::before{{content:"";position:absolute;inset-inline-end:0;top:50%;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--cv-accent);transform:translateY(-50%)}}
.pro-langs{{display:grid;grid-template-columns:1fr 1fr;gap:0 7mm}}
.pro-lang-line{{display:flex;justify-content:space-between;align-items:center;gap:3mm;font-size:9.2pt;color:var(--cv-ink);padding:1.15mm 0;border-bottom:.2mm solid var(--cv-line)}}
.pro-lang-line em{{font-style:normal;color:var(--cv-mut);font-size:8.4pt}}
.pro-ready{{list-style:none;margin:0;padding:0}}
.pro-ready li{{font-size:9.2pt;color:var(--cv-ink);padding:1.05mm 0 1.05mm 4.6mm;position:relative;border-bottom:.2mm solid var(--cv-line)}}
.pro-ready li:last-child{{border-bottom:0}}
.pro-ready li::before{{content:"";position:absolute;inset-inline-end:0;top:50%;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--cv-accent);transform:translateY(-50%)}}
.pro-foot{{margin-top:7mm;padding-top:3mm;border-top:.3mm solid var(--cv-line);display:flex;justify-content:space-between;align-items:center;gap:5mm;font-size:7.8pt;color:var(--cv-mut)}}
.pro-foot-phone{{font-weight:600;color:var(--cv-accent);font-size:8.4pt}}

/* ---------- تعديل مباشر ---------- */
[contenteditable="true"]:focus{{outline:2px dashed #18466e;outline-offset:4px;border-radius:6px}}
[contenteditable="true"]{{cursor:text}}
</style>
</head>
<body>

<div class="toolbar">
  <button class="btn" id="editBtn" type="button" onclick="toggleEdit()">✏️ تفعيل التعديل</button>
  <button class="btn alt" type="button" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
</div>

<div id="sheet">
{cv_body}
</div>

<script>
function toggleEdit(){{
  var s=document.getElementById('sheet'), b=document.getElementById('editBtn');
  var on=s.getAttribute('contenteditable')==='true';
  s.setAttribute('contenteditable', on?'false':'true');
  b.textContent = on ? '✏️ تفعيل التعديل' : '✅ إيقاف التعديل';
  if(!on){{ s.focus(); }}
}}
</script>
</body>
</html>
"""

out_path = os.path.join(HERE, "cv-general-services.html")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(doc)
print("saved:", out_path, "| size:", len(doc))
