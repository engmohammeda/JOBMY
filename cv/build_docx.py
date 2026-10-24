#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""توليد نسخة Word احترافية (RTL) من السيرة الذاتية."""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

INK    = RGBColor(0x12, 0x26, 0x3F)
ACCENT = RGBColor(0x1C, 0x5B, 0x8F)
ACC2   = RGBColor(0x0F, 0x3F, 0x66)
BODY   = RGBColor(0x26, 0x37, 0x4F)
MUTED  = RGBColor(0x6B, 0x7A, 0x90)
FONT   = "Segoe UI"

doc = Document()

# ---------- إعداد الصفحة ----------
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
sec.top_margin, sec.bottom_margin = Cm(1.15), Cm(1.0)
sec.left_margin, sec.right_margin = Cm(1.35), Cm(1.35)
# اتجاه الصفحة من اليمين إلى اليسار
sPr = sec._sectPr
bidi = OxmlElement('w:bidi'); sPr.append(bidi)

style = doc.styles['Normal']
style.font.name = FONT
style.font.size = Pt(10)
style.font.color.rgb = BODY
rpr = style.element.get_or_add_rPr()
rf = rpr.find(qn('w:rFonts'))
if rf is None:
    rf = OxmlElement('w:rFonts'); rpr.append(rf)
for a in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
    rf.set(qn(a), FONT)
style.paragraph_format.space_after = Pt(0)
style.paragraph_format.line_spacing = 1.18


def _run(p, text, size=10, bold=False, color=BODY, italic=False):
    r = p.add_run(text)
    r.font.name = FONT
    r.font.size = Pt(size)
    r.bold = bold
    r.italic = italic
    r.font.color.rgb = color
    rPr = r._element.get_or_add_rPr()
    f = rPr.find(qn('w:rFonts'))
    if f is None:
        f = OxmlElement('w:rFonts'); rPr.append(f)
    for a in ('w:ascii', 'w:hAnsi', 'w:cs'):
        f.set(qn(a), FONT)
    rtl = OxmlElement('w:rtl'); rPr.append(rtl)
    if bold:
        b = OxmlElement('w:bCs'); rPr.append(b)
    return r


def para(align=WD_ALIGN_PARAGRAPH.RIGHT, before=0, after=0, line=1.18,
         indent=0, hang=0, keep=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment = align
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    if indent:
        pf.right_indent = Cm(indent)
    if hang:
        pf.first_line_indent = Cm(-hang)
    if keep:
        pf.keep_with_next = True
    pPr = p._p.get_or_add_pPr()
    b = OxmlElement('w:bidi'); pPr.append(b)
    return p


def bottom_border(p, color="1C5B8F", size=12, space=2):
    pPr = p._p.get_or_add_pPr()
    bdr = OxmlElement('w:pBdr')
    bot = OxmlElement('w:bottom')
    bot.set(qn('w:val'), 'single'); bot.set(qn('w:sz'), str(size))
    bot.set(qn('w:space'), str(space)); bot.set(qn('w:color'), color)
    bdr.append(bot); pPr.append(bdr)


def section(title, en=""):
    p = para(before=9, after=3, keep=True)
    bottom_border(p, color="DFE6EE", size=6, space=1)
    _run(p, "▌ ", size=11.5, bold=True, color=ACCENT)
    _run(p, title, size=11.5, bold=True, color=ACC2)
    if en:
        _run(p, "   " + en, size=7.5, color=RGBColor(0x9A, 0xA9, 0xBC))


def bullets(items, size=9.6, after=1.5):
    for it in items:
        p = para(after=after, line=1.22, indent=0.55, hang=0.42)
        _run(p, "•  ", size=size, color=ACCENT, bold=True)
        # دعم **عريض**
        parts = it.split("**")
        for i, seg in enumerate(parts):
            if seg:
                _run(p, seg, size=size, bold=(i % 2 == 1), color=INK if i % 2 == 1 else BODY)


# ================= الترويسة =================
p = para(WD_ALIGN_PARAGRAPH.RIGHT, after=0)
_run(p, "محمد البخيتي", size=25, bold=True, color=INK)

p = para(after=1)
_run(p, "موظف مكتب خدمات عامة — دعم إداري وتنظيم مكتبي", size=12.5, bold=True, color=ACCENT)

p = para(after=5)
_run(p, "خبرة سنتين في إعداد المستندات وتلخيص المعاملات وخدمة المراجعين  •  إجادة تامة للحاسب وبرامج الأوفيس",
     size=8.8, color=MUTED)

p = para(after=1)
_run(p, "الجوال: 0566743293 (واتساب)    |    البريد: Mohammedalbkhty@gmail.com    |    الرياض — غرب الرياض    |    العمر: 24 سنة",
     size=9, color=BODY)
p = para(after=4)
bottom_border(p, color="1C5B8F", size=14, space=3)
_run(p, "الحالة النظامية: تأشيرة زيارة عائلية — جاهز لاستكمال إجراءات التوظيف    |    متاح للعمل فورًا",
     size=9, color=BODY)

# ================= الملف المهني =================
section("الملف المهني", "PROFILE")
p = para(WD_ALIGN_PARAGRAPH.JUSTIFY, after=0, line=1.3)
_run(p, "موظف مكتبي منظّم وخدوم أمتلك خبرة سنتين في مكتب أعمال ومكتبة، عملت خلالها على إعداد المستندات "
        "والخطابات وتنسيقها، وتلخيص المعاملات وتجهيز ملخصات واضحة عنها، وإدخال البيانات وأرشفتها، "
        "واستقبال المراجعين والتعامل معهم حتى إنجاز طلباتهم. أُجيد تشغيل الحاسب وبرامج الأوفيس "
        "(Word وExcel وPowerPoint والبريد الإلكتروني) وأتعامل مع الطباعة والمسح الضوئي والأرشفة "
        "بسرعة ودقة. أتميّز بحسن التعامل والأخلاق والالتزام والهدوء تحت الضغط، وأتعلّم أي نظام أو منصة "
        "إلكترونية جديدة بسرعة، وأبحث عن فرصة أخدم فيها مكتب خدمات عامة في غرب الرياض وأضيف قيمة "
        "حقيقية من أول أسبوع.", size=10.2)

# ================= المهارات =================
section("المهارات الأساسية", "CORE SKILLS")
skills = [
    ("الحاسب وبرامج الأوفيس", [
        "**Word:** صياغة وتنسيق الخطابات والتقارير والقوالب ودمج المراسلات",
        "**Excel:** إدخال البيانات والجداول والمعادلات (SUM / IF / VLOOKUP)",
        "**PowerPoint** للعروض والملخصات، و**Outlook** للمراسلات والمرفقات",
        "**Windows:** إدارة الملفات والنسخ الاحتياطي وتشغيل الطابعات والماسحات",
    ]),
    ("الأعمال المكتبية والسكرتارية", [
        "صياغة الخطابات والمستندات الرسمية بالعربية والإنجليزية",
        "تلخيص المعاملات وتجهيز مذكرات وملخصات واضحة في وقت قصير",
        "الأرشفة الإلكترونية والورقية وتنظيم الملفات وسهولة الوصول إليها",
        "إدخال البيانات ومراجعتها وتدقيق الأخطاء قبل الطباعة والإرسال",
    ]),
    ("خدمة العملاء والتعامل مع الجمهور", [
        "استقبال المراجعين والرد على الاستفسارات بلباقة واحترافية",
        "الاستماع الفعّال وفهم الطلب وتوجيه العميل للجهة الصحيحة",
        "متابعة الطلبات حتى الإنجاز والتعامل مع الاعتراضات بهدوء",
        "السرية والأمانة والمحافظة على صورة المكتب أمام المراجعين",
    ]),
    ("المنصات الإلكترونية والأنظمة", [
        "سرعة عالية في تعلّم أي منصة أو نظام جديد دون إشراف مستمر",
        "جاهزية تامة للعمل على المنصات الحكومية: **أبشر، قوى، ناجز، منصة الأعمال، اعتماد**",
        "إدخال الطلبات في الأنظمة ومتابعة حالتها وتحديثها",
        "رفع المستندات إلكترونيًا والتحقق من اكتمالها قبل الإرسال",
    ]),
]
for title, items in skills:
    p = para(before=3, after=1, keep=True)
    _run(p, "◆ ", size=9, color=RGBColor(0xB0, 0x8D, 0x3F))
    _run(p, title, size=9.8, bold=True, color=ACC2)
    bullets(items, size=9.2, after=1)

# ================= الخبرة =================
section("الخبرة العملية", "EXPERIENCE")

def job(title, org, meta, items):
    p = para(before=4, after=1, keep=True)
    _run(p, title, size=10.3, bold=True, color=INK)
    _run(p, "  —  " + org, size=9.8, bold=True, color=ACCENT)
    _run(p, "        " + meta, size=8.8, color=MUTED)
    bullets(items, size=9.5)

job("موظف إداري ومكتبي — خدمات المستندات", "مكتبة ومركز خدمات", "الرياض  •  2023 – 2025 (سنتان)", [
    "إعداد وكتابة وتنسيق المستندات والخطابات الرسمية بالعربية والإنجليزية ومراجعتها قبل الطباعة.",
    "تلخيص المعاملات وتجهيز ملخصات واضحة عنها، ما ساعد على سرعة المراجعة والإنجاز.",
    "إدخال البيانات وتنظيم السجلات على **Excel** وترتيب الأرشفة الورقية والإلكترونية.",
    "استقبال العملاء والرد على استفساراتهم ومتابعة طلباتهم حتى إتمامها بصورة مرضية.",
    "تشغيل أجهزة الطباعة والنسخ والمسح الضوئي ومعالجة الأعطال البسيطة والنسخ الاحتياطي.",
    "دعم فريق العمل في المهام اليومية وتجهيز المستندات المطلوبة في المواعيد المحددة.",
])
job("مسؤول مبيعات وكاشير", "متجر تجزئة", "الرياض  •  2025", [
    "تعامل يومي مباشر مع العملاء: استقبال، شرح، معالجة اعتراضات، وإتمام الطلب بلباقة.",
    "إدخال البيانات وإعداد تقارير المبيعات ومطابقة الأرقام بدقة على Excel.",
])

# ================= التعليم =================
section("المؤهل العلمي", "EDUCATION")
p = para(after=2)
_run(p, "دبلوم لمدة سنتين — التخصص: ........", size=10.2, bold=True, color=INK)
_run(p, "    |    اسم الجهة التعليمية", size=9.8, color=ACCENT)
_run(p, "        2026", size=8.8, color=MUTED)

# ================= الدورات =================
section("الدورات والشهادات", "CERTIFICATES")
bullets([
    "الحاسب الآلي / ICDL",
    "Excel للمبتدئين   •   Word — إعداد المستندات الاحترافية",
    "خدمة العملاء والتعامل مع الجمهور   •   الطباعة السريعة بالعربية والإنجليزية",
], size=9.4)

# ================= اللغات والمهارات الشخصية =================
section("اللغات والمهارات الشخصية", "LANGUAGES & SOFT SKILLS")
bullets([
    "**العربية:** اللغة الأم — إجادة تامة تحدثًا وكتابة.",
    "**الإنجليزية:** جيد — قراءة وكتابة المراسلات والمستندات.",
    "**سرعة التعلّم:** أتعلّم الأنظمة الجديدة بسرعة وأطوّر نفسي باستمرار.",
    "**الشخصية:** أمانة، التزام، لباقة، تنظيم، عمل بروح الفريق، مرونة.",
    "**تحت الضغط:** أداء ثابت مع كثرة المراجعين وتعدد المهام.",
    "**المظهر والحضور:** مظهر مهني لائق واحترام المواعيد.",
], size=9.4)

# ================= معلومات إضافية =================
section("معلومات إضافية", "ADDITIONAL")
bullets([
    "**الجاهزية:** متاح للعمل فورًا بعد استكمال إجراءات التوظيف.",
    "**السكن:** قريب من غرب الرياض — سهولة الوصول والالتزام بوقت الدوام.",
    "**التوصيات:** متاحة عند الطلب.",
    "**العمل الميداني:** مستعد لتغطية مهام المراجعات والجهات الحكومية عند الحاجة.",
], size=9.4)

doc.save("cv/cv-general-services.docx")
print("saved")
