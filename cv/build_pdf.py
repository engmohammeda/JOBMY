#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد السيرة الذاتية بصيغة PDF (A4، صفحة واحدة) — تنسيق كامل من اليمين إلى اليسار
يعتمد على fpdf2 + خط Cairo المضمّن (تشكيل عربي كامل عبر HarfBuzz).
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

M_L, M_R, M_T = 13.0, 13.0, 10.5
PW, PH = 210.0, 297.0
CW = PW - M_L - M_R          # 184
XR = PW - M_R                # 197
XL = M_L


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
pdf.set_keywords("سيرة ذاتية, موظف مكتب خدمات عامة, خدمات إدارية, الأوفيس, الرياض")
pdf.set_creator("Sirati CV")
pdf.add_page()
pdf.set_font("Cairo", "", 10)

y = M_T


# ============ أدوات مساعدة ============
def text_h(txt, size, w, style="", md=False, lh=1.32):
    pdf.set_font("Cairo", style, size)
    pdf.set_text_shaping(True)
    return pdf.multi_cell(w, size * 0.3528 * lh, txt, align="R", dry_run=True,
                          output="HEIGHT", markdown=md)


def line(txt, size, w=None, style="", color=BODY, md=False, lh=1.32,
         x=None, align="R", h=None):
    """سطر نصي (يدعم الالتفاف). يعيد الارتفاع المستهلك."""
    global y
    w = CW if w is None else w
    x = XL if x is None else x
    lh_mm = size * 0.3528 * lh
    h = text_h(txt, size, w, style, md, lh) if h is None else h
    pdf.set_font("Cairo", style, size)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*color)
    pdf.set_xy(x, y)
    pdf.multi_cell(w, lh_mm, txt, align=align, markdown=md,
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    y += h
    return h


def section(title, en=""):
    global y
    y += 2.0
    # شريط لوني
    pdf.set_fill_color(*ACCENT)
    pdf.rect(XR - 2.3, y + 0.5, 2.3, 4.0, style="F", round_corners=True, corner_radius=0.6)
    pdf.set_font("Cairo", "B", 12.2)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACC2)
    pdf.set_xy(XR - 6.0 - (pdf.get_string_width(title) + 2), y)
    pdf.cell(pdf.get_string_width(title) + 2, 5.4, title, align="R")
    if en:
        pdf.set_font("Cairo", "", 6.8)
        pdf.set_text_shaping(True)
        pdf.set_text_color(154, 169, 188)
        pdf.set_xy(XL, y + 1.1)
        pdf.cell(40, 4, en, align="L")
    y += 5.4
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.25)
    pdf.line(XL, y, XR, y)
    y += 1.6


def bullet(txt, size=9.2, w=CW, x=XL, marker="•", mcolor=ACCENT, lh=1.3, gap=0.9, indent=4.4):
    """نقطة برأسية مع التفاف النص وإزاحة السطر التالي."""
    global y
    pdf.set_font("Cairo", "", size)
    pdf.set_text_shaping(True)
    inner = w - indent - 1.0
    h = text_h(txt, size, inner, md=True, lh=lh) if "**" in txt else text_h(txt, size, inner, lh=lh)
    lh_mm = size * 0.3528 * lh
    # العلامة على اليمين
    pdf.set_font("Cairo", "B", size)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*mcolor)
    pdf.set_xy(x + w - indent, y)
    pdf.cell(indent, lh_mm, marker, align="R")
    # النص
    pdf.set_text_color(*BODY)
    pdf.set_font("Cairo", "", size)
    pdf.set_text_shaping(True)
    pdf.set_xy(x, y)
    pdf.multi_cell(inner, lh_mm, txt, align="R", markdown=("**" in txt),
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    y += h + gap


def card_h(w, title, items, size=8.4):
    pad = 2.4
    inner = w - 2 * pad - 3.2
    th = text_h(title, 9.2, inner)
    h = pad + th + 0.4
    for it in items:
        h += text_h(it, size, inner, md=("**" in it), lh=1.24) + 0.6
    h += pad - 0.6 + 0.2
    return h


def card(x, cy, w, title, items, size=8.4, h=None):
    """بطاقة مهارات ذات خلفية فاتحة وإطار."""
    pad = 2.4
    inner = w - 2 * pad - 3.2
    th = text_h(title, 9.2, inner)
    if h is None:
        h = card_h(w, title, items, size)
    pdf.set_fill_color(*TINT)
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.22)
    pdf.rect(x, cy, w, h, style="DF", round_corners=True, corner_radius=1.6)
    # عنوان البطاقة
    pdf.set_fill_color(*GOLD)
    pdf.ellipse(x + w - pad - 1.5, cy + pad + 1.3, 1.5, 1.5, style="F")
    pdf.set_font("Cairo", "B", 9.2)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACC2)
    pdf.set_xy(x + pad, cy + pad - 0.5)
    pdf.multi_cell(w - 2 * pad - 3.2, 3.25, title, align="R",
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    ty = cy + pad + th + 0.4
    for it in items:
        ih = text_h(it, size, inner, md=("**" in it), lh=1.24)
        lh_mm = size * 0.3528 * 1.24
        pdf.set_font("Cairo", "B", size)
        pdf.set_text_shaping(True)
        pdf.set_text_color(*ACCENT)
        pdf.set_xy(x + w - pad - 3.2, ty)
        pdf.cell(3.2, lh_mm, "•", align="R")
        pdf.set_font("Cairo", "", size)
        pdf.set_text_shaping(True)
        pdf.set_text_color(*BODY)
        pdf.set_xy(x + pad, ty)
        pdf.multi_cell(inner, lh_mm, it, align="R", markdown=("**" in it),
                       new_x=XPos.LEFT, new_y=YPos.TOP)
        ty += ih + 0.6
    return h


def chip(text, x, cy, size=8.3, solid=False):
    pdf.set_font("Cairo", "B" if solid else "", size)
    pdf.set_text_shaping(True)
    tw = pdf.get_string_width(text) + 5.0
    h = 5.6
    if solid:
        pdf.set_fill_color(*ACCENT); pdf.set_draw_color(*ACCENT)
        txt_col = (255, 255, 255)
    else:
        pdf.set_fill_color(*SOFT); pdf.set_draw_color(205, 219, 232)
        txt_col = (44, 70, 97)
    pdf.set_line_width(0.2)
    pdf.rect(x - tw, cy, tw, h, style="DF", round_corners=True, corner_radius=2.8)
    pdf.set_text_color(*txt_col)
    pdf.set_xy(x - tw, cy + 0.55)
    pdf.cell(tw, h - 1.1, text, align="C")
    return tw


# ===================== الترويسة =====================
pdf.set_font("Cairo", "B", 25)
pdf.set_text_shaping(True)
pdf.set_text_color(*INK)
pdf.set_xy(XL, y)
pdf.cell(CW, 10.6, "محمد البخيتي", align="R")
y += 11.0

pdf.set_font("Cairo", "B", 12.6)
pdf.set_text_shaping(True)
pdf.set_text_color(*ACCENT)
pdf.set_xy(XL, y)
pdf.cell(CW, 6.2, "موظف مكتب خدمات عامة — دعم إداري وتنظيم مكتبي", align="R")
y += 6.4

pdf.set_font("Cairo", "", 8.6)
pdf.set_text_shaping(True)
pdf.set_text_color(*MUTED)
pdf.set_xy(XL, y)
pdf.cell(CW, 4.4, "خبرة سنتين في إعداد المستندات وتلخيص المعاملات وخدمة المراجعين   •   إجادة تامة للحاسب وبرامج الأوفيس", align="R")
y += 6.2

# أسطر الاتصال
pdf.set_font("Cairo", "", 8.9)
pdf.set_text_shaping(True)
pdf.set_text_color(59, 76, 99)
pdf.set_xy(XL, y)
pdf.cell(CW, 4.6, "الجوال: 0566743293 (واتساب)     |     البريد: Mohammedalbkhty@gmail.com     |     الرياض — غرب الرياض", align="R")
y += 4.8

pdf.set_font("Cairo", "", 8.5)
pdf.set_text_shaping(True)
pdf.set_xy(XL, y)
pdf.cell(CW, 4.4, "الحالة النظامية: تأشيرة زيارة عائلية — جاهز لاستكمال إجراءات التوظيف     |     العمر: 24 سنة     |     متاح للعمل فورًا", align="R")
y += 5.4

# خطوط الفصل
pdf.set_draw_color(*ACCENT)
pdf.set_line_width(0.7)
pdf.line(XL, y, XR, y)
pdf.set_draw_color(*GOLD)
pdf.set_line_width(0.9)
pdf.line(XR - 46, y + 1.5, XR, y + 1.5)
y += 3.4

# ===================== الملف المهني =====================
section("الملف المهني", "PROFILE")
summary = (
    "موظف مكتبي منظّم وخدوم أمتلك خبرة سنتين في مكتب أعمال ومكتبة، عملت خلالها على إعداد المستندات والخطابات وتنسيقها، "
    "وتلخيص المعاملات وتجهيز ملخصات واضحة عنها، وإدخال البيانات وأرشفتها، واستقبال المراجعين والتعامل معهم حتى إنجاز طلباتهم. "
    "أُجيد تشغيل الحاسب وبرامج **الأوفيس** (Word وExcel وPowerPoint والبريد الإلكتروني) وأتعامل مع الطباعة والمسح الضوئي والأرشفة بسرعة ودقة. "
    "أتميّز بحسن التعامل والأخلاق والالتزام والهدوء تحت الضغط، وأتعلّم أي نظام أو منصة إلكترونية جديدة بسرعة، "
    "وأبحث عن فرصة أخدم فيها مكتب خدمات عامة في **غرب الرياض**."
)
line(summary, 9.5, md=True, lh=1.40)

# ===================== المهارات =====================
section("المهارات الأساسية", "CORE SKILLS")
gap = 4.0
cw2 = (CW - gap) / 2
right_x = XR - cw2
left_x = XL

cards_r = [
    ("الحاسب وبرامج الأوفيس", [
        "**Word:** صياغة وتنسيق الخطابات والتقارير والقوالب ودمج المراسلات",
        "**Excel:** إدخال البيانات والجداول والمعادلات (SUM / VLOOKUP)",
        "**PowerPoint** للعروض، **Outlook** للبريد والمرفقات",
        "**Windows:** إدارة الملفات والنسخ الاحتياطي وتشغيل الطابعات",
    ]),
    ("خدمة العملاء والتعامل مع الجمهور", [
        "استقبال المراجعين والرد على الاستفسارات بلباقة واحترافية",
        "الاستماع الفعّال وتوجيه العميل للجهة الصحيحة",
        "متابعة الطلبات حتى الإنجاز والتعامل مع الاعتراضات بهدوء",
        "السرية والأمانة والمحافظة على صورة المكتب",
    ]),
]
cards_l = [
    ("الأعمال المكتبية والسكرتارية", [
        "صياغة الخطابات والمستندات الرسمية بالعربية والإنجليزية",
        "تلخيص المعاملات وتجهيز ملخصات ومذكرات واضحة بسرعة",
        "الأرشفة الورقية والإلكترونية وتنظيم الملفات",
        "إدخال البيانات وتدقيقها قبل الطباعة والإرسال",
    ]),
    ("المنصات الإلكترونية والأنظمة", [
        "سرعة عالية في تعلّم أي منصة أو نظام جديد",
        "جاهزية للعمل على المنصات الحكومية: **أبشر، قوى، ناجز، اعتماد**",
        "إدخال الطلبات في الأنظمة ومتابعة حالتها وتحديثها",
        "رفع المستندات إلكترونيًا والتأكد من اكتمالها",
    ]),
]

v_gap = 2.4
for pair_r, pair_l in ((cards_r[0], cards_l[0]), (cards_r[1], cards_l[1])):
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
        y += 1.2
    # خط جانبي ونقطة
    pdf.set_draw_color(207, 218, 230)
    pdf.set_line_width(0.45)
    top = y
    pdf.set_font("Cairo", "B", 10.3)
    pdf.set_text_shaping(True)
    tw = pdf.get_string_width(title)
    pdf.set_text_color(*INK)
    pdf.set_xy(XR - 6.5 - tw, y)
    pdf.cell(tw + 1, 4.6, title, align="R")
    pdf.set_font("Cairo", "B", 9.8)
    pdf.set_text_shaping(True)
    ow = pdf.get_string_width(" — " + org)
    pdf.set_text_color(*ACCENT)
    pdf.set_xy(XR - 6.5 - tw - ow, y)
    pdf.cell(ow, 4.6, " — " + org, align="R")
    pdf.set_font("Cairo", "", 8.4)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*MUTED)
    pdf.set_xy(XL, y + 0.3)
    pdf.cell(70, 4.4, meta, align="L")
    y += 4.7
    for it in items:
        bullet(it, size=9.15, w=CW - 6.5, x=XL, lh=1.22, gap=0.45)
    pdf.set_draw_color(207, 218, 230)
    pdf.set_fill_color(*ACCENT)
    pdf.set_line_width(0.45)
    pdf.line(XR - 1.6, top, XR - 1.6, y - 0.6)
    pdf.ellipse(XR - 2.7, top + 0.7, 2.2, 2.2, style="DF")


job("موظف إداري ومكتبي — خدمات المستندات", "مكتبة ومركز خدمات", "الرياض  •  2023 – 2025 (سنتان)", [
    "إعداد وكتابة وتنسيق المستندات والخطابات الرسمية بالعربية والإنجليزية ومراجعتها قبل الطباعة.",
    "تلخيص المعاملات وتجهيز ملخصات واضحة عنها، ما ساعد على **سرعة المراجعة والإنجاز**.",
    "إدخال البيانات وتنظيم السجلات على **Excel** وترتيب الأرشفة الورقية والإلكترونية.",
    "استقبال المراجعين والرد على استفساراتهم ومتابعة طلباتهم حتى إتمامها بصورة مرضية.",
    "تشغيل أجهزة الطباعة والنسخ والمسح الضوئي ومعالجة الأعطال البسيطة والنسخ الاحتياطي.",
    "دعم فريق العمل في المهام اليومية وتجهيز المستندات المطلوبة في المواعيد المحددة.",
], first=True)

job("مسؤول مبيعات وكاشير", "متجر تجزئة", "الرياض  •  2025", [
    "تعامل يومي مباشر مع العملاء: استقبال، شرح، معالجة اعتراضات، وإتمام الطلب بلباقة.",
    "إدخال البيانات وإعداد تقارير المبيعات ومطابقة الأرقام بدقة على Excel.",
])

# ===================== التعليم =====================
section("المؤهل العلمي", "EDUCATION")
pdf.set_font("Cairo", "B", 10.2)
pdf.set_text_shaping(True)
pdf.set_text_color(*INK)
pdf.set_xy(XR - 62, y)
pdf.cell(62, 4.8, "دبلوم لمدة سنتين — التخصص: ........", align="R")
pdf.set_font("Cairo", "", 9.7)
pdf.set_text_shaping(True)
pdf.set_text_color(*ACCENT)
pdf.set_xy(XR - 62 - 55, y)
pdf.cell(55, 4.8, "|  اسم الجهة التعليمية", align="R")
pdf.set_font("Cairo", "", 8.5)
pdf.set_text_shaping(True)
pdf.set_text_color(*MUTED)
pdf.set_xy(XL, y)
pdf.cell(40, 4.8, "2026", align="L")
y += 4.8

# ===================== الدورات =====================
section("الدورات والشهادات", "CERTIFICATES")
cy = y + 0.6
x = XR
for t in ["الحاسب الآلي / ICDL", "Excel للمبتدئين", "Word — المستندات الاحترافية",
          "خدمة العملاء", "الطباعة السريعة"]:
    w = chip(t, x, cy, solid=(t == "الحاسب الآلي / ICDL"))
    x -= w + 2.2
y = cy + 5.6 + 1.2

# ===================== اللغات والمهارات الشخصية =====================
section("اللغات والمهارات الشخصية", "LANGUAGES & SOFT SKILLS")

G = 7.0
CW2 = (CW - G) / 2


def kv(k, v, x, w, ypos):
    """سطر (مفتاح: قيمة) داخل عمود. يعيد الارتفاع المستهلك."""
    pdf.set_font("Cairo", "B", 9.0)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACC2)
    kw = pdf.get_string_width(k + ":") + 1.6
    pdf.set_xy(x + w - kw, ypos)
    pdf.cell(kw, 4.6, k + ":", align="R")
    pdf.set_font("Cairo", "", 9.0)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*BODY)
    h = text_h(v, 9.0, w - kw, lh=1.26)
    pdf.set_xy(x, ypos)
    pdf.multi_cell(w - kw, 9.0 * 0.3528 * 1.26, v, align="R",
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    return max(h, 4.6)


def two_cols(rowset, ypos):
    """يرسم أزواج (مفتاح/قيمة) في عمودين ثم يعيد y الجديد."""
    i = 0
    while i < len(rowset):
        y0 = ypos
        pair = rowset[i:i + 2]
        if len(pair) == 2:
            h_r = kv(pair[0][0], pair[0][1], XR - CW2, CW2, y0)
            h_l = kv(pair[1][0], pair[1][1], XL, CW2, y0)
            ypos = y0 + max(h_r, h_l) + 0.8
        else:
            h_r = kv(pair[0][0], pair[0][1], XR - CW2, CW2, y0)
            ypos = y0 + h_r + 0.8
        i += 2
    return ypos


y = two_cols([
    ("العربية", "اللغة الأم — إجادة تامة تحدثًا وكتابة"),
    ("الإنجليزية", "جيد — قراءة وكتابة المراسلات والمستندات"),
    ("سرعة التعلّم", "أتعلّم الأنظمة الجديدة بسرعة وأطوّر نفسي"),
    ("الشخصية", "أمانة، التزام، لباقة، تنظيم، عمل بروح الفريق"),
    ("تحت الضغط", "أداء ثابت مع كثرة المراجعين وتعدد المهام"),
    ("المظهر والحضور", "مظهر مهني لائق واحترام المواعيد"),
], y)

# ===================== معلومات إضافية =====================
section("معلومات إضافية", "ADDITIONAL")
y = two_cols([
    ("الجاهزية", "متاح للعمل فورًا بعد استكمال إجراءات التوظيف"),
    ("السكن", "قريب من غرب الرياض — سهولة الوصول للدوام"),
    ("التوصيات", "متاحة عند الطلب"),
    ("العمل الميداني", "مستعد لمهام المراجعات والجهات الحكومية"),
], y)

# ===================== تذييل =====================
pdf.set_draw_color(*LINE)
pdf.set_line_width(0.25)
fy = PH - 13.0
pdf.line(XL, fy, XR, fy)
pdf.set_font("Cairo", "", 7.8)
pdf.set_text_shaping(True)
pdf.set_text_color(154, 169, 188)
pdf.set_xy(XL, fy + 1.2)
pdf.cell(CW, 4, "سيرة ذاتية — محمد البخيتي", align="R")
pdf.set_xy(XL, fy + 1.2)
pdf.cell(CW, 4, "موظف مكتب خدمات عامة  •  الرياض", align="L")

out = os.path.join(HERE, "cv-general-services.pdf")
pdf.output(out)
print("saved:", out, "| content ends at y =", round(y, 1), "/", PH, "| pages =", pdf.pages_count)
