#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد السيرة الذاتية بصيغة PDF — القالب «الاحترافي النظيف»
A4، صفحة واحدة، تصميم هادئ: عمود واحد، مساحات بيضاء، خطوط نظيفة،
عناوين ملوّنة بشريط دقيق، نقاط مستوى بسيطة — بدون بطاقات أو تكدّس.
fpdf2 + خط Cairo المضمّن (تشكيل عربي كامل عبر HarfBuzz) + روابط قابلة للنقر.
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------- الهوية اللونية (هادئة واحترافية) ----------
INK    = (20, 32, 48)        # نص أساسي داكن
BODY   = (44, 60, 82)        # نص الج body
MUTED  = (104, 118, 136)     # نص مساعد (ثانوي)
ACCENT = (24, 70, 110)       # أزرق احترافي
ACC2   = (30, 84, 128)        # لون العناوين
LINE   = (226, 232, 239)      # خطوط فصل فاتحة
SOFT   = (245, 248, 251)

M_L, M_R, M_T, M_B = 14.0, 14.0, 12.0, 10.0
PW, PH = 210.0, 297.0
CW = PW - M_L - M_R
XR = PW - M_R
XL = M_L

PHONE_DISPLAY = "‎+966 56 674 3293‎"   # تضمين LTR لمنع انقلاب الرقم
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
def text_h(txt, size, w, style="", lh=1.30, md=False):
    pdf.set_font("Cairo", style, size)
    pdf.set_text_shaping(True)
    return pdf.multi_cell(w, size * 0.3528 * lh, txt, align="R", dry_run=True,
                          output="HEIGHT", markdown=md)


def line(txt, size, w=None, style="", color=BODY, lh=1.30, x=None, gap=0.0, md=False):
    global y
    w = CW if w is None else w
    x = XL if x is None else x
    lh_mm = size * 0.3528 * lh
    h = text_h(txt, size, w, style, lh, md=md)
    pdf.set_font("Cairo", style, size)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*color)
    pdf.set_xy(x, y)
    pdf.multi_cell(w, lh_mm, txt, align="R", markdown=md,
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    y += h + gap
    return h


def section(title, en=""):
    global y
    y += 1.4
    pdf.set_fill_color(*ACCENT)
    pdf.rect(XR - 2.4, y + 0.35, 2.4, 4.2, style="F", round_corners=True, corner_radius=0.5)
    pdf.set_font("Cairo", "B", 11.0)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACC2)
    tw = pdf.get_string_width(title)
    pdf.set_xy(XR - 5.6 - tw, y)
    pdf.cell(tw + 1.4, 5.0, title, align="R")
    if en:
        pdf.set_font("Cairo", "", 6.2)
        pdf.set_text_shaping(True)
        pdf.set_text_color(160, 174, 192)
        pdf.set_xy(XL, y + 1.1)
        pdf.cell(42, 4.0, en, align="L")
    y += 5.0
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.22)
    pdf.line(XL, y, XR, y)
    y += 1.5


def bullet(txt, size=9.0, w=CW, x=XL, marker="•", mcolor=ACCENT, lh=1.24, gap=0.55, indent=4.2):
    global y
    inner = w - indent
    h = text_h(txt, size, inner, lh=lh)
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
    pdf.multi_cell(inner, lh_mm, txt, align="R",
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    y += h + gap


def dots(n, x, cy, r=0.55, gap=0.85):
    """نقط مستوى على شكل دوائر صغيرة — ترسم من اليسار لليمين."""
    v = max(0, min(5, int(n)))
    for i in range(1, 6):
        on = i <= v
        pdf.set_fill_color(*(ACCENT if on else LINE))
        pdf.ellipse(x + (i - 1) * gap, cy, r, r, style="F")


def contact_flow(items, size=8.3, ypos=None, color=(70, 84, 102), sep="|", gap=3.2, lh=4.2):
    """عناصر التواصل من اليمين لليسار مع التفاف تلقائي — كل عنصر قد يكون رابطًا."""
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
            ypos += lh + 0.25
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
            pdf.set_text_color(186, 198, 212)
            pdf.set_xy(x, ypos)
            pdf.cell(sw, lh, " " + sep + " ", align="C")
            pdf.set_text_color(*color)
    y = ypos + lh + 0.4


def kv_row(key, val, x, w, ypos, ksize=8.9, vsize=8.9, lh=1.24):
    """صف Key/Value نظيف — المفتاح بلون ACC2، القيمة بالنص الج body."""
    pdf.set_font("Cairo", "B", ksize)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACC2)
    kw = pdf.get_string_width(key + ":") + 1.2
    pdf.set_xy(x + w - kw, ypos)
    pdf.cell(kw, 4.2, key + ":", align="R")
    pdf.set_font("Cairo", "", vsize)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*BODY)
    h = text_h(val, vsize, w - kw, lh=lh)
    pdf.set_xy(x, ypos)
    pdf.multi_cell(w - kw, vsize * 0.3528 * lh, val, align="R",
                   new_x=XPos.LEFT, new_y=YPos.TOP)
    return max(h, 4.2)


# ===================== الترويسة =====================
pdf.set_font("Cairo", "B", 20)
pdf.set_text_shaping(True)
pdf.set_text_color(*INK)
pdf.set_xy(XL, y)
pdf.cell(CW, 9.0, "محمد البخيتي", align="R")
y += 9.4

pdf.set_font("Cairo", "B", 11.0)
pdf.set_text_shaping(True)
pdf.set_text_color(*ACCENT)
pdf.set_xy(XL, y)
pdf.cell(CW, 5.4, "موظف مكتب خدمات عامة — دعم إداري وتنظيم مكتبي", align="R")
y += 5.8

pdf.set_font("Cairo", "", 8.4)
pdf.set_text_shaping(True)
pdf.set_text_color(*MUTED)
pdf.set_xy(XL, y)
pdf.cell(CW, 4.2, "سنتان خبرة في إعداد المستندات وتلخيص المعاملات وخدمة المراجعين  •  إجادة تامة للحاسب والأوفيس  •  سرعة تعلّم استثنائية", align="R")
y += 4.6

contact_flow([
    (f"الجوال: {PHONE_DISPLAY}", PHONE_TEL),
    ("واتساب", PHONE_WA),
    (EMAIL, f"mailto:{EMAIL}"),
])
contact_flow([
    ("لينكدإن", LINKEDIN),
    ("الموقع الشخصي", SITE),
    ("الرياض — غرب الرياض", None),
], size=8.2)
contact_flow([
    ("العمر: 24 سنة", None),
    ("مقيم في الرياض — متاح للعمل فورًا", None),
], size=8.2)

# الشريط الدقيق
pdf.set_draw_color(*ACCENT)
pdf.set_line_width(0.9)
pdf.line(XR - 34, y, XR, y)
pdf.set_draw_color(*LINE)
pdf.set_line_width(0.3)
pdf.line(XL, y, XR, y)
y += 2.8

# ===================== الملف المهني =====================
section("الملف المهني", "PROFILE")
summary = (
    "موظف مكتب خدمات عامة منظم وخدوم، خبرة **سنتين** في مكتب أعمال ومكتبة: "
    "أُعدّ المستندات والخطابات وأنسّقها وأدقّقها، وأُلخّص المعاملات في ملخصات واضحة، "
    "وأُدخل البيانات وأؤرشفها، وأستقبل المراجعين وأتابع طلباتهم حتى الإنجاز. "
    "أُجيد الحاسب وبرامج **الأوفيس** (Word وExcel وPowerPoint والبريد) إجادة تامة، "
    "وأستخدم **أدوات الذكاء الاصطناعي** في تلخيص المعاملات وصياغة الخطابات وتنظيم العمل. "
    "أتمتّع بحسن التعامل والأخلاق والالتزام، وأتعلّم أي نظام جديد بسرعة — "
    "وأبحث عن استقرار مهني طويل في **غرب الرياض**."
)
line(summary, 9.3, md=True, lh=1.40)

# ===================== المهارات =====================
section("المهارات الأساسية", "CORE SKILLS")

G = 3.4
cw2 = (CW - G) / 2
right_x = XR - cw2
left_x = XL


def skill_group_h(items, size=9.0):
    """ارتفاع مجموعة مهارات بصفوف عمودين."""
    rows = (len(items) + 1) // 2
    return rows * 4.3 + 2.6


skill_groups = [
    ("الحاسب وبرامج الأوفيس", [
        ("Word — صياغة وتنسيق المستندات والخطابات", 5),
        ("Excel — جداول، معادلات، تقارير", 4),
        ("PowerPoint — عروض تقديمية", 4),
        ("Outlook و Gmail — بريد ومراسلات", 4),
        ("Google Docs / Sheets / Drive — عمل سحابي", 4),
    ]),
    ("الأعمال المكتبية والسكرتارية", [
        ("صياغة الخطابات والمستندات الرسمية", 5),
        ("تلخيص المعاملات وتجهيز الملخصات", 5),
        ("الأرشفة الورقية والإلكترونية", 4),
        ("إدخال البيانات وتدقيقها", 4),
    ]),
    ("خدمة العملاء والتعامل مع الجمهور", [
        ("استقبال المراجعين والرد على الاستفسارات", 5),
        ("الاستماع الفعّال وحل الاعتراضات", 4),
        ("متابعة الطلبات حتى الإنجاز", 5),
        ("السرية والأمانة والالتزام", 5),
    ]),
    ("المنصات الحكومية والأنظمة", [
        ("سرعة تعلّم أي منصة أو نظام جديد", 5),
        ("أبشر، قوى، ناجز، اعتماد — جاهز للعمل عليها", 4),
        ("إدخال الطلبات ومتابعة الحالة وتحديثها", 4),
        ("رفع المستندات إلكترونيًا والتأكد من اكتمالها", 4),
    ]),
    ("أدوات الذكاء الاصطناعي", [
        ("ChatGPT و Gemini و Copilot", 4),
        ("تلخيص المستندات الطويلة واستخراج النقاط", 4),
        ("صياغة الخطابات والمراسلات", 4),
        ("أتمتة المهام المتكررة وتنظيم البيانات", 3),
    ]),
]

for gtitle, items in skill_groups:
    pdf.set_font("Cairo", "B", 8.4)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACCENT)
    pdf.set_xy(XR - pdf.get_string_width(gtitle), y)
    pdf.cell(pdf.get_string_width(gtitle) + 2.0, 3.6, gtitle, align="R")
    y += 3.6
    # عمودان
    col_items = [items[i:i + 2] for i in range(0, len(items), 2)]
    for pair in col_items:
        h = 4.2
        if y + h > PH - 8:
            pdf.add_page()
            y = M_T
        for col_x, it in ((right_x, pair[0]), (left_x, pair[1] if len(pair) > 1 else None)):
            if not it:
                continue
            name, lvl = it
            # نقط المستوى في بداية العمود (يسار)، ثم اسم المهارة منسجمًا لليمين
            dots(lvl, col_x + 1.1, y + 1.4)
            pdf.set_font("Cairo", "", 9.0)
            pdf.set_text_shaping(True)
            pdf.set_text_color(*BODY)
            pdf.set_xy(col_x + 6.8, y + 0.9)
            pdf.multi_cell(cw2 - 6.8 - 2.4, 9.0 * 0.3528 * 1.22, name, align="R",
                           new_x=XPos.LEFT, new_y=YPos.TOP)
        y += h
    y += 1.0

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
    pdf.cell(tw + 1.0, 4.4, title, align="R")
    pdf.set_font("Cairo", "B", 9.2)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACCENT)
    pdf.set_xy(XL, y + 0.4)
    pdf.cell(70, 4.4, meta, align="L")
    y += 4.5
    pdf.set_font("Cairo", "B", 9.4)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*ACCENT)
    ow = pdf.get_string_width("— " + org)
    pdf.set_xy(XR - 6.2 - ow, y)
    pdf.cell(ow + 1.0, 4.2, "— " + org, align="R")
    y += 4.4
    for it in items:
        bullet(it, size=8.9, w=CW - 6.2, x=XL, lh=1.20, gap=0.4)


job("موظف إداري ومكتبي — خدمات المستندات", "مكتبة ومركز خدمات",
    "الرياض • 2023 – 2025 (سنتان)", [
    "إعداد وتنسيق المستندات والخطابات الرسمية بالعربية والإنجليزية ومراجعتها قبل الطباعة.",
    "تلخيص المعاملات وتجهيز ملخصات واضحة عنها، ما رفع **سرعة المراجعة والإنجاز**.",
    "إدخال البيانات وتنظيم السجلات على **Excel** والأرشفة الورقية والإلكترونية.",
    "استقبال المراجعين والرد على استفساراتهم ومتابعة طلباتهم حتى إتمامها بصورة مرضية.",
    "توظيف أدوات الذكاء الاصطناعي في الصياغة والتلخيص وتجهيز قوالب للمستندات المتكررة.",
], first=True)

job("مسؤول مبيعات وكاشير", "متجر تجزئة", "الرياض • 2025", [
    "تعامل يومي مباشر مع العملاء: استقبال، شرح، معالجة اعتراضات، وإتمام الطلب بلباقة.",
    "إدخال البيانات وإعداد تقارير المبيعات ومطابقة الأرقام بدقة على Excel.",
])

# ===================== المؤهل العلمي =====================
section("المؤهل العلمي", "EDUCATION")
pdf.set_font("Cairo", "B", 9.8)
pdf.set_text_shaping(True)
pdf.set_text_color(*INK)
pdf.set_xy(XR - 74, y)
pdf.cell(74, 4.6, "دبلوم لمدة سنتين", align="R")
pdf.set_font("Cairo", "", 8.3)
pdf.set_text_shaping(True)
pdf.set_text_color(*MUTED)
pdf.set_xy(XL, y)
pdf.cell(44, 4.6, "2026", align="L")
y += 4.8
pdf.set_font("Cairo", "B", 9.2)
pdf.set_text_shaping(True)
pdf.set_text_color(*ACCENT)
pdf.set_xy(XR - 100, y)
pdf.cell(100, 4.2, "التخصص: ........", align="R")
pdf.set_font("Cairo", "", 8.6)
pdf.set_text_shaping(True)
pdf.set_text_color(*MUTED)
pdf.set_xy(XL, y)
pdf.cell(CW, 4.2, "اسم الجهة التعليمية — خلفية تعزز الدقة والانضباط وتنظيم البيانات", align="R")
y += 4.4

# ===================== الدورات والشهادات =====================
section("الدورات والشهادات", "CERTIFICATES")
cy = y + 0.4
x = XR
certs = ["الحاسب الآلي / ICDL", "Excel للمبتدئين", "Word — المستندات الاحترافية",
         "خدمة العملاء", "أدوات الذكاء الاصطناعي"]
for t in certs:
    pdf.set_font("Cairo", "B", 8.3)
    pdf.set_text_shaping(True)
    pdf.set_text_color(*BODY)
    tw = pdf.get_string_width(t) + 5.0
    if x - tw < XL:
        cy += 5.2
        x = XR
    pdf.set_fill_color(*SOFT)
    pdf.set_draw_color(205, 219, 232)
    pdf.set_line_width(0.16)
    pdf.rect(x - tw, cy, tw, 5.0, style="DF", round_corners=True, corner_radius=2.5)
    pdf.set_text_color(*BODY)
    pdf.set_xy(x - tw, cy + 0.7)
    pdf.cell(tw, 3.6, t, align="C")
    x -= tw + 2.2
y = cy + 5.2 + 1.0

# ===================== اللغات والمهارات الشخصية =====================
section("اللغات والمهارات الشخصية", "LANGUAGES & SOFT SKILLS")

G = 7.0
CW2 = (CW - G) / 2


def two_cols(rowset, ypos):
    i = 0
    while i < len(rowset):
        y0 = ypos
        pair = rowset[i:i + 2]
        if len(pair) == 2:
            h_r = kv_row(pair[0][0], pair[0][1], XR - CW2, CW2, y0)
            h_l = kv_row(pair[1][0], pair[1][1], XL, CW2, y0)
            ypos = y0 + max(h_r, h_l) + 0.55
        else:
            h_r = kv_row(pair[0][0], pair[0][1], XR - CW2, CW2, y0)
            ypos = y0 + h_r + 0.55
        i += 2
    return ypos


y = two_cols([
    ("العربية", "اللغة الأم — إجادة تامة تحدثًا وكتابة"),
    ("الإنجليزية", "جيد — قراءة وكتابة المراسلات والمستندات"),
    ("سرعة التعلّم", "أتعلّم الأنظمة الجديدة بسرعة وأطوّر نفسي باستمرار"),
    ("الشخصية", "أمانة، التزام، لباقة، تنظيم، روح الفريق"),
    ("تحت الضغط", "أداء ثابت مع كثرة المراجعين وتعدد المهام"),
    ("المظهر والحضور", "مظهر مهني لائق واحترام المواعيد"),
], y)

# ===================== معلومات إضافية =====================
section("معلومات إضافية", "ADDITIONAL")
y = two_cols([
    ("الجاهزية", "متاح للعمل فورًا بعد استكمال إجراءات التوظيف"),
    ("السكن", "قريب من غرب الرياض — سهولة الوصول للدوام"),
    ("الحالة النظامية", "تأشيرة زيارة عائلية — جاهز لاستكمال الإجراءات"),
    ("المصادر", "لينكدإن والموقع الشخصي أعلاه للاطلاع على الأعمال"),
], y)

# ===================== تذييل =====================
pdf.set_draw_color(*LINE)
pdf.set_line_width(0.24)
fy = PH - 11.0
pdf.line(XL, fy, XR, fy)
pdf.set_font("Cairo", "", 7.5)
pdf.set_text_shaping(True)
pdf.set_text_color(154, 169, 188)
pdf.set_xy(XL, fy + 1.0)
pdf.cell(CW, 3.8, "سيرة ذاتية — محمد البخيتي  •  موظف مكتب خدمات عامة  •  الرياض", align="R")
pdf.set_xy(XL, fy + 1.0)
pdf.cell(CW, 3.8, PHONE_DISPLAY, align="L")

out = os.path.join(HERE, "cv-general-services.pdf")
pdf.output(out)
print("saved:", out, "| ends y =", round(y, 1), "/", PH, "| pages =", pdf.pages_count)
