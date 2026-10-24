#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد السيرة الذاتية بصيغة PDF (A4، صفحة واحدة) — تنسيق كامل من اليمين إلى اليسار
fpdf2 + خط Cairo المضمّن (تشكيل عربي كامل عبر HarfBuzz) + روابط قابلة للنقر
(اتصال، واتساب، بريد، لينكدإن، الموقع الشخصي).
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------- الهوية اللونية ----------
INK    = (18, 38, 63)
BODY   = (38, 55, 79)
MUTED  = (107, 122, 144)
ACCENT = (28, 91, 143)
ACC2   = (15, 63, 102)
GOLD   = (176, 141, 63)
LINE   = (223, 230, 238)
TINT   = (244, 248, 252)
SOFT   = (247, 250, 253)

M_L, M_R, M_T = 12.0, 12.0, 9.5
PW, PH = 210.0, 297.0
CW = PW - M_L - M_R
XR = PW - M_R
XL = M_L

PHONE_DISPLAY = "\u202a+966 56 674 3293\u202c"   # تضمين LTR لمنع انقلاب الرقم
PHONE_TEL     = "tel:+966566743293"
PHONE_WA      = "https://wa.me/966566743293"
EMAIL         = "Mohammedalbkhty@gmail.com"
LINKEDIN      = "https://www.linkedin.com/in/mohammed-albukhaiti-215a41302/"
SITE          = "https://engmohammeda.github.io/portfolio/"


class CV(FPDF):
    def header(self): pass
    def footer(self): pass


pdf = CV(orientation="P", unit="mm", format="A4")
pdf.set_margins(M_L, M_T, M_R)
pdf.set_auto_page_break(False)
pdf.add_font("Cairo", "", os.path.join(HERE, "fonts", "Cairo-Regular.ttf"))
pdf.add_font("Cairo", "B", os.path.join(HERE, "fonts", "Cairo-Bold.ttf"))
pdf.set_text_shaping(True)
pdf.set_title("السيرة الذاتية — محمد البخيتي — موظف مكتب خدمات عامة")
pdf.set_author("محمد البخيتي")
pdf.set_subject("موظف مكتب خدمات عامة — دعم إداري وتنظيم مكتبي — الرياض")
pdf.set_keywords("سيرة ذاتية, موظف مكتب خدمات عامة, خدمات إدارية, الأوفيس, الذكاء الاصطناعي, الرياض")
pdf.set_creator("Sirati CV")
pdf.add_page()
pdf.set_font("Cairo", "", 10)

y = M_T


# ============ أدوات مساعدة ============
def text_h(txt, size, w, style="", md=False, lh=1.30):
    pdf.set_font("Cairo", style, size)
    pdf.set_text_shaping(True)
    return pdf.multi_cell(w, size * 0.3528 * lh, txt, align="R", dry_run=True,
                          output="HEIGHT", markdown=md)


def line(txt, size, w=None, style="", color=BODY, md=False, lh=1.30, x=None):
    global y
    w = CW if w is None else w
    x = XL if x is None else x
    lh_mm = size * 0.3528 * lh
    h = text_h(txt, size, w, style, md, lh)
    pdf.set_font("Cairo", style, size)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*color)
    pdf.set_xy(x, y)
    pdf.multi_cell(w, lh_mm, txt, align="R", markdown=md,
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    y += h
    return h


def section(title, en=""):
    global y
    y += 1.9
    pdf.set_fill_color(*ACCENT)
    pdf.rect(XR - 2.2, y + 0.5, 2.2, 3.9, style="F", round_corners=True, corner_radius=0.6)
    pdf.set_font("Cairo", "B", 11.8)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACC2)
    tw = pdf.get_string_width(title)
    pdf.set_xy(XR - 5.8 - tw, y)
    pdf.cell(tw + 1.4, 5.2, title, align="R")
    if en:
        pdf.set_font("Cairo", "", 6.5)
        pdf.set_text_shaping(True)
        pdf.set_text_color(164, 178, 196)
        pdf.set_xy(XL, y + 1.0)
        pdf.cell(40, 4, en, align="L")
    y += 5.2
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.22)
    pdf.line(XL, y, XR, y)
    y += 1.3


def bullet(txt, size=9.0, w=CW, x=XL, marker="•", mcolor=ACCENT, lh=1.24, gap=0.75, indent=4.0):
    global y
    inner = w - indent - 0.8
    h = text_h(txt, size, inner, md=("**" in txt), lh=lh)
    lh_mm = size * 0.3528 * lh
    pdf.set_font("Cairo", "B", size)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*mcolor)
    pdf.set_xy(x + w - indent, y)
    pdf.cell(indent, lh_mm, marker, align="R")
    pdf.set_text_color(*BODY)
    pdf.set_font("Cairo", "", size)
    pdf.set_text_shaping(True)
    pdf.set_xy(x, y)
    pdf.multi_cell(inner, lh_mm, txt, align="R", markdown=("**" in txt),
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    y += h + gap


def card_h(w, title, items, size=7.95):
    pad = 2.2
    inner = w - 2 * pad - 3.0
    h = pad + text_h(title, 9.0, inner) + 0.3
    for it in items:
        h += text_h(it, size, inner, md=("**" in it), lh=1.19) + 0.45
    return h + pad - 0.5 + 0.1


def card(x, cy, w, title, items, size=7.95, h=None):
    pad = 2.2
    inner = w - 2 * pad - 3.0
    th = text_h(title, 9.0, inner)
    if h is None:
        h = card_h(w, title, items, size)
    pdf.set_fill_color(*TINT)
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.2)
    pdf.rect(x, cy, w, h, style="DF", round_corners=True, corner_radius=1.5)
    pdf.set_fill_color(*GOLD)
    pdf.ellipse(x + w - pad - 1.4, cy + pad + 1.1, 1.4, 1.4, style="F")
    pdf.set_font("Cairo", "B", 9.0)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACC2)
    pdf.set_xy(x + pad, cy + pad - 0.6)
    pdf.multi_cell(inner, 3.1, title, align="R", new_x=XPos.LEFT, new_y=YPos.TOP)
    ty = cy + pad + th + 0.3
    for it in items:
        ih = text_h(it, size, inner, md=("**" in it), lh=1.19)
        lh_mm = size * 0.3528 * 1.19
        pdf.set_font("Cairo", "B", size)
        pdf.set_text_shaping(True)
        pdf.set_text_color(*ACCENT)
        pdf.set_xy(x + w - pad - 2.8, ty)
        pdf.cell(2.8, lh_mm, "•", align="R")
        pdf.set_font("Cairo", "", size)
        pdf.set_text_shaping(True)
        pdf.set_text_color(*BODY)
        pdf.set_xy(x + pad, ty)
        pdf.multi_cell(inner, lh_mm, it, align="R", markdown=("**" in it),
                       new_x=XPos.LEFT, new_y=YPos.TOP)
        ty += ih + 0.45


def chip(text, x, cy, size=8.0, solid=False):
    pdf.set_font("Cairo", "B" if solid else "", size)
    pdf.set_text_shaping(True)
    tw = pdf.get_string_width(text) + 4.6
    h = 5.2
    if solid:
        pdf.set_fill_color(*ACCENT); pdf.set_draw_color(*ACCENT)
        txt_col = (255, 255, 255)
    else:
        pdf.set_fill_color(*SOFT); pdf.set_draw_color(205, 219, 232)
        txt_col = (44, 70, 97)
    pdf.set_line_width(0.18)
    pdf.rect(x - tw, cy, tw, h, style="DF", round_corners=True, corner_radius=2.6)
    pdf.set_text_color(*txt_col)
    pdf.set_xy(x - tw, cy + 0.5)
    pdf.cell(tw, h - 1.0, text, align="C")
    return tw


def contact_flow(items, size=8.4, ypos=None, color=(59, 76, 99), sep="|", gap=3.6, lh=4.4):
    """يرسم عناصر التواصل من اليمين لليسار مع التفاف تلقائي، وكل عنصر قد يكون رابطًا.
    items = [(نص, رابط أو None), ...]"""
    global y
    ypos = y if ypos is None else ypos
    pdf.set_font("Cairo", "", size)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*color)
    sw = pdf.get_string_width(" " + sep + " ")
    x = XR
    for txt, link in items:
        tw = pdf.get_string_width(txt)
        need = tw if x == XR else tw + sw
        if x - need < XL:
            ypos += lh + 0.35
            x = XR
            need = tw
        x -= need
        pos = x + (0 if x == XR else sw)
        pdf.set_xy(pos, ypos)
        pdf.set_font("Cairo", "B" if link else "", size)
        pdf.set_text_shaping(True)
        pdf.set_text_color(*(ACCENT if link else color))
        pdf.cell(tw, lh, txt, align="R", link=link if link else None)
        pdf.set_font("Cairo", "", size)
        pdf.set_text_shaping(True)
        if x != XR:
            pdf.set_text_color(178, 190, 206)
            pdf.set_xy(x, ypos)
            pdf.cell(sw, lh, " " + sep + " ", align="C")
            pdf.set_text_color(*color)
    y = ypos + lh + 0.4


# ===================== الترويسة =====================
pdf.set_font("Cairo", "B", 24)
pdf.set_text_shaping(True)
pdf.set_text_color(*INK)
pdf.set_xy(XL, y)
pdf.cell(CW, 10.4, "محمد البخيتي", align="R")
y += 10.6

pdf.set_font("Cairo", "B", 12.0)
pdf.set_text_shaping(True)
pdf.set_text_color(*ACCENT)
pdf.set_xy(XL, y)
pdf.cell(CW, 6.0, "موظف مكتب خدمات عامة — دعم إداري وتنظيم مكتبي", align="R")
y += 6.2

pdf.set_font("Cairo", "", 8.3)
pdf.set_text_shaping(True)
pdf.set_text_color(*MUTED)
pdf.set_xy(XL, y)
pdf.cell(CW, 4.2, "سنتان خبرة في إعداد المستندات وتلخيص المعاملات وخدمة المراجعين  •  إجادة تامة للحاسب والأوفيس  •  أدوات ذكاء اصطناعي وتقنية ترفع إنتاجية المكتب", align="R")
y += 5.2

contact_flow([
    (f"الجوال: {PHONE_DISPLAY}", PHONE_TEL),
    ("واتساب (اضغط للمحادثة)", PHONE_WA),
    (EMAIL, f"mailto:{EMAIL}"),
])
contact_flow([
    ("لينكدإن", LINKEDIN),
    ("الموقع الشخصي", SITE),
    ("الرياض — غرب الرياض", None),
    ("العمر: 24 سنة", None),
], size=8.2)
contact_flow([
    ("الحالة النظامية: تأشيرة زيارة عائلية — جاهز لاستكمال إجراءات التوظيف", None),
    ("متاح للعمل فورًا", None),
], size=8.1, color=(75, 90, 110))

# خطوط الفصل
pdf.set_draw_color(*ACCENT)
pdf.set_line_width(0.65)
pdf.line(XL, y, XR, y)
pdf.set_draw_color(*GOLD)
pdf.set_line_width(0.85)
pdf.line(XR - 42, y + 1.4, XR, y + 1.4)
y += 3.0

# ===================== الملف المهني =====================
section("الملف المهني", "PROFILE")
summary = (
    "موظف مكتبي منظّم وخدوم أمتلك **سنتين خبرة** في مكتب أعمال ومكتبة: أُعدّ الخطابات والمستندات وأنسّقها وأدقّقها، "
    "وأُلخّص المعاملات في ملخصات واضحة، وأُدخل البيانات وأؤرشفها، وأستقبل المراجعين وأتابع طلباتهم حتى الإنجاز. "
    "أُجيد الحاسب وبرامج **الأوفيس** (Word وExcel وPowerPoint والبريد)، وأستخدم **أدوات الذكاء الاصطناعي** في تلخيص المعاملات وصياغة الخطابات وتنظيم العمل. "
    "أضيف للمكتب قيمة إضافية: أدوات تقنية وتسويق رقمي وحضور إلكتروني يوسّع وصول العملاء. "
    "أتعلّم أي نظام جديد بسرعة، وأبحث عن استقرار مهني طويل في **غرب الرياض**."
)
line(summary, 9.2, md=True, lh=1.36)

# ===================== المهارات =====================
section("المهارات الأساسية", "CORE SKILLS")
v_gap = 2.2
g = 3.6
cw2 = (CW - g) / 2
right_x = XR - cw2
left_x = XL

skills_rows = [
    (("الحاسب وبرامج الأوفيس", [
        "**Word:** صياغة وتنسيق الخطابات والقوالب ودمج المراسلات",
        "**Excel:** بيانات وجداول ومعادلات (SUM / IF / VLOOKUP)",
        "**PowerPoint** للعروض، **Outlook** للبريد والمرفقات",
        "Google Docs + Sheets + Drive للعمل السحابي",
    ]), ("الأعمال المكتبية والسكرتارية", [
        "صياغة الخطابات والمستندات الرسمية بالعربية والإنجليزية",
        "تلخيص المعاملات وتجهيز مذكرات وملخصات واضحة بسرعة",
        "الأرشفة الورقية والإلكترونية وتنظيم الملفات",
        "إدخال البيانات وتدقيقها قبل الطباعة والإرسال",
    ])),
    (("خدمة العملاء والتعامل مع الجمهور", [
        "استقبال المراجعين والرد على الاستفسارات بلباقة واحترافية",
        "الاستماع الفعّال وتوجيه العميل للجهة الصحيحة",
        "متابعة الطلبات حتى الإنجاز وحل الاعتراضات بهدوء",
        "السرية والأمانة والمحافظة على صورة المكتب",
    ]), ("المنصات الإلكترونية والأنظمة", [
        "سرعة عالية في تعلّم أي منصة أو نظام جديد",
        "جاهزية للعمل على: **أبشر، قوى، ناجز، اعتماد**",
        "إدخال الطلبات في الأنظمة ومتابعة حالتها وتحديثها",
        "رفع المستندات إلكترونيًا والتأكد من اكتمالها",
    ])),
    (("الذكاء الاصطناعي وإنتاجية المكتب", [
        "**ChatGPT + Gemini + Copilot** في الصياغة والتلخيص",
        "كتابة الأوامر (Prompts) والحصول على مخرجات دقيقة",
        "تلخيص المستندات الطويلة واستخراج نقاطها في دقائق",
        "أتمتة المهام المتكررة وتنظيم المراسلات والبيانات",
    ]), ("التقنية والتسويق الرقمي", [
        "إعداد المواقع والصفحات التعريفية (HTML + CSS)",
        "**Canva** وإعداد المحتوى والتصاميم والمطبوعات",
        "إدارة صفحات التواصل وتحسين الظهور (SEO)",
        "أساسيات البرمجة وقواعد البيانات وتحليل الأرقام",
    ])),
]

for pair_r, pair_l in skills_rows:
    hh = max(card_h(cw2, *pair_r), card_h(cw2, *pair_l))
    card(right_x, y, cw2, *pair_r, h=hh)
    card(left_x, y, cw2, *pair_l, h=hh)
    y += hh + v_gap
y -= v_gap

# ===================== الخبرة =====================
section("الخبرة العملية", "EXPERIENCE")


def job(title, org, meta, items, first=False):
    global y
    if not first:
        y += 1.0
    top = y
    pdf.set_font("Cairo", "B", 10.0)
    pdf.set_text_shaping(True)
    tw = pdf.get_string_width(title)
    pdf.set_text_color(*INK)
    pdf.set_xy(XR - 6.2 - tw, y)
    pdf.cell(tw + 1, 4.4, title, align="R")
    pdf.set_font("Cairo", "B", 9.5)
    pdf.set_text_shaping(True)
    ow = pdf.get_string_width(" — " + org)
    pdf.set_text_color(*ACCENT)
    pdf.set_xy(XR - 6.2 - tw - ow, y)
    pdf.cell(ow, 4.4, " — " + org, align="R")
    pdf.set_font("Cairo", "", 8.2)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*MUTED)
    pdf.set_xy(XL, y + 0.3)
    pdf.cell(70, 4.2, meta, align="L")
    y += 4.5
    for it in items:
        bullet(it, size=8.9, w=CW - 6.2, x=XL, lh=1.20, gap=0.4)
    pdf.set_draw_color(207, 218, 230)
    pdf.set_fill_color(*ACCENT)
    pdf.set_line_width(0.42)
    pdf.line(XR - 1.5, top, XR - 1.5, y - 0.5)
    pdf.ellipse(XR - 2.55, top + 0.7, 2.1, 2.1, style="DF")


job("موظف إداري ومكتبي — خدمات المستندات", "مكتبة ومركز خدمات", "الرياض  •  2023 – 2025 (سنتان)", [
    "إعداد وكتابة وتنسيق المستندات والخطابات الرسمية بالعربية والإنجليزية ومراجعتها قبل الطباعة.",
    "تلخيص المعاملات وتجهيز ملخصات واضحة عنها، ما رفع **سرعة المراجعة والإنجاز**.",
    "إدخال البيانات وتنظيم السجلات على **Excel** وترتيب الأرشفة الورقية والإلكترونية.",
    "استقبال المراجعين والرد على استفساراتهم ومتابعة طلباتهم حتى إتمامها بصورة مرضية.",
    "توظيف أدوات الذكاء الاصطناعي في الصياغة والتلخيص وتجهيز قوالب جاهزة للمستندات المتكررة.",
    "تشغيل الطباعة والنسخ والمسح الضوئي ومعالجة الأعطال البسيطة والنسخ الاحتياطي.",
], first=True)

job("مسؤول مبيعات وكاشير", "متجر تجزئة", "الرياض  •  2025", [
    "تعامل يومي مباشر مع العملاء: استقبال، شرح، معالجة اعتراضات، وإتمام الطلب بلباقة.",
    "إدخال البيانات وإعداد تقارير المبيعات ومطابقة الأرقام بدقة على Excel.",
])

# ===================== التعليم =====================
section("المؤهل العلمي", "EDUCATION")
pdf.set_font("Cairo", "B", 9.8)
pdf.set_text_shaping(True)
pdf.set_text_color(*INK)
pdf.set_xy(XR - 70, y)
pdf.cell(70, 4.6, "دبلوم لمدة سنتين — التخصص: ........", align="R")
pdf.set_font("Cairo", "", 9.3)
pdf.set_text_shaping(True)
pdf.set_text_color(*ACCENT)
pdf.set_xy(XR - 70 - 52, y)
pdf.cell(52, 4.6, "|  اسم الجهة التعليمية", align="R")
pdf.set_font("Cairo", "", 8.3)
pdf.set_text_shaping(True)
pdf.set_text_color(*MUTED)
pdf.set_xy(XL, y)
pdf.cell(40, 4.6, "2026", align="L")
y += 4.6

# ===================== الدورات =====================
section("الدورات والشهادات", "CERTIFICATES")
cy = y + 0.4
x = XR
for t in ["الحاسب الآلي / ICDL", "Excel للمبتدئين", "Word — المستندات الاحترافية",
          "خدمة العملاء", "أدوات الذكاء الاصطناعي", "التسويق الرقمي"]:
    w = chip(t, x, cy, solid=(t == "الحاسب الآلي / ICDL"))
    x -= w + 2.0
y = cy + 5.2 + 1.0

# ===================== اللغات والمهارات الشخصية =====================
section("اللغات والمهارات الشخصية", "LANGUAGES & SOFT SKILLS")

G = 7.0
CW2 = (CW - G) / 2


def kv(k, v, x, w, ypos):
    pdf.set_font("Cairo", "B", 8.8)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACC2)
    kw = pdf.get_string_width(k + ":") + 1.5
    pdf.set_xy(x + w - kw, ypos)
    pdf.cell(kw, 4.4, k + ":", align="R")
    pdf.set_font("Cairo", "", 8.8)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*BODY)
    h = text_h(v, 8.8, w - kw, lh=1.24)
    pdf.set_xy(x, ypos)
    pdf.multi_cell(w - kw, 8.8 * 0.3528 * 1.24, v, align="R",
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    return max(h, 4.4)


def two_cols(rowset, ypos):
    i = 0
    while i < len(rowset):
        y0 = ypos
        pair = rowset[i:i + 2]
        if len(pair) == 2:
            h_r = kv(pair[0][0], pair[0][1], XR - CW2, CW2, y0)
            h_l = kv(pair[1][0], pair[1][1], XL, CW2, y0)
            ypos = y0 + max(h_r, h_l) + 0.6
        else:
            h_r = kv(pair[0][0], pair[0][1], XR - CW2, CW2, y0)
            ypos = y0 + h_r + 0.6
        i += 2
    return ypos


y = two_cols([
    ("العربية", "اللغة الأم — إجادة تامة تحدثًا وكتابة"),
    ("الإنجليزية", "جيد — قراءة وكتابة المراسلات والمستندات"),
    ("سرعة التعلّم", "أتعلّم الأنظمة الجديدة بسرعة وأطوّر نفسي"),
    ("الشخصية", "أمانة، التزام، لباقة، تنظيم، روح الفريق"),
    ("تحت الضغط", "أداء ثابت مع كثرة المراجعين وتعدد المهام"),
    ("المظهر والحضور", "مظهر مهني لائق واحترام المواعيد"),
], y)

# ===================== معلومات إضافية =====================
section("معلومات إضافية", "ADDITIONAL")
y = two_cols([
    ("الجاهزية", "متاح للعمل فورًا بعد استكمال إجراءات التوظيف"),
    ("السكن", "قريب من غرب الرياض — سهولة الوصول للدوام"),
    ("المصادر", "لينكدإن والموقع الشخصي أعلاه للاطلاع على الأعمال"),
    ("التوصيات", "متاحة عند الطلب"),
], y)

# ===================== تذييل =====================
pdf.set_draw_color(*LINE)
pdf.set_line_width(0.22)
fy = PH - 11.5
pdf.line(XL, fy, XR, fy)
pdf.set_font("Cairo", "", 7.4)
pdf.set_text_shaping(True)
pdf.set_text_color(154, 169, 188)
pdf.set_xy(XL, fy + 1.0)
pdf.cell(CW, 3.8, "سيرة ذاتية — محمد البخيتي  •  موظف مكتب خدمات عامة  •  الرياض", align="R")
pdf.set_xy(XL, fy + 1.0)
pdf.cell(CW, 3.8, PHONE_DISPLAY, align="L")

out = os.path.join(HERE, "cv-general-services.pdf")
pdf.output(out)
print("saved:", out, "| ends y =", round(y, 1), "/", PH, "| pages =", pdf.pages_count)
