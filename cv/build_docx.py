#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""توليد نسخة Word احترافية (RTL) من السيرة الذاتية."""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.opc.constants import RELATIONSHIP_TYPE as RT

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


def add_link(p, text, url, size=9, bold=False, color=ACCENT):
    """إضافة ارتباط تشعبي (يُفتح بالنقر) داخل فقرة RTL."""
    part = p.part
    r_id = part.relate_to(url, RT.HYPERLINK, is_external=True)
    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)
    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    f = OxmlElement('w:rFonts')
    for a in ('w:ascii', 'w:hAnsi', 'w:cs'):
        f.set(qn(a), FONT)
    rPr.append(f)
    c = OxmlElement('w:color'); c.set(qn('w:val'), '%02X%02X%02X' % (color[0], color[1], color[2])); rPr.append(c)
    sz = OxmlElement('w:sz'); sz.set(qn('w:val'), str(int(size * 2))); rPr.append(sz)
    szcs = OxmlElement('w:szCs'); szcs.set(qn('w:val'), str(int(size * 2))); rPr.append(szcs)
    if bold:
        rPr.append(OxmlElement('w:b')); rPr.append(OxmlElement('w:bCs'))
    rPr.append(OxmlElement('w:rtl'))
    new_run.append(rPr)
    t = OxmlElement('w:t'); t.text = text
    t.set(qn('xml:space'), 'preserve')
    new_run.append(t)
    hyperlink.append(new_run)
    p._p.append(hyperlink)


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
_run(p, "سنتان خبرة في إعداد المستندات وتلخيص المعاملات وخدمة المراجعين  •  إجادة تامة للحاسب والأوفيس  •  أدوات ذكاء اصطناعي وتقنية ترفع إنتاجية المكتب",
     size=8.8, color=MUTED)

p = para(after=1)
_run(p, "الجوال: ", size=9, color=BODY)
add_link(p, "+966 56 674 3293", "tel:+966566743293", size=9, bold=True)
_run(p, "  (اتصال مباشر)    |    واتساب: ", size=9, color=BODY)
add_link(p, "اضغط للمحادثة", "https://wa.me/966566743293", size=9, bold=True)
_run(p, "    |    البريد: ", size=9, color=BODY)
add_link(p, "Mohammedalbkhty@gmail.com", "mailto:Mohammedalbkhty@gmail.com", size=9, bold=True)

p = para(after=4)
_run(p, "لينكدإن: ", size=9, color=BODY)
add_link(p, "linkedin.com/in/mohammed-albukhaiti", "https://www.linkedin.com/in/mohammed-albukhaiti-215a41302/", size=9)
_run(p, "    |    الموقع الشخصي: ", size=9, color=BODY)
add_link(p, "engmohammeda.github.io/portfolio", "https://engmohammeda.github.io/portfolio/", size=9)
_run(p, "    |    الرياض — غرب الرياض  •  العمر: 24 سنة", size=9, color=BODY)
bottom_border(p, color="1C5B8F", size=14, space=3)

p = para(after=2)
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
        "**Word:** صياغة وتنسيق الخطابات والقوالب ودمج المراسلات",
        "**Excel:** بيانات وجداول ومعادلات (SUM / IF / VLOOKUP)",
        "**PowerPoint** للعروض، **Outlook** للبريد والمرفقات",
        "Google Docs + Sheets + Drive للعمل السحابي",
    ]),
    ("الأعمال المكتبية والسكرتارية", [
        "صياغة الخطابات والمستندات الرسمية بالعربية والإنجليزية",
        "تلخيص المعاملات وتجهيز مذكرات وملخصات واضحة بسرعة",
        "الأرشفة الورقية والإلكترونية وتنظيم الملفات",
        "إدخال البيانات وتدقيقها قبل الطباعة والإرسال",
    ]),
    ("خدمة العملاء والتعامل مع الجمهور", [
        "استقبال المراجعين والرد على الاستفسارات بلباقة واحترافية",
        "الاستماع الفعّال وتوجيه العميل للجهة الصحيحة",
        "متابعة الطلبات حتى الإنجاز وحل الاعتراضات بهدوء",
        "السرية والأمانة والمحافظة على صورة المكتب",
    ]),
    ("المنصات الإلكترونية والأنظمة", [
        "سرعة عالية في تعلّم أي منصة أو نظام جديد",
        "جاهزية للعمل على: **أبشر، قوى، ناجز، اعتماد**",
        "إدخال الطلبات في الأنظمة ومتابعة حالتها وتحديثها",
        "رفع المستندات إلكترونيًا والتأكد من اكتمالها",
    ]),
    ("الذكاء الاصطناعي وإنتاجية المكتب", [
        "**ChatGPT + Gemini + Copilot** في الصياغة والتلخيص",
        "كتابة الأوامر (Prompts) والحصول على مخرجات دقيقة",
        "تلخيص المستندات الطويلة واستخراج نقاطها في دقائق",
        "أتمتة المهام المتكررة وتنظيم المراسلات والبيانات",
    ]),
    ("التقنية والتسويق الرقمي", [
        "إعداد المواقع والصفحات التعريفية (HTML + CSS)",
        "**Canva** وإعداد المحتوى والتصاميم والمطبوعات",
        "إدارة صفحات التواصل وتحسين الظهور (SEO)",
        "أساسيات البرمجة وقواعد البيانات وتحليل الأرقام",
    ]),
]
for title, items in skills:
    p = para(before=3, after=1, keep=True)
    _run(p, "◆ ", size=9, color=RGBColor(0xB0, 0x8D, 0x3F))
    _run(p, title, size=9.8, bold=True, color=ACC2)
    bullets(items, size=9.0, after=0.8)

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
    "توظيف أدوات الذكاء الاصطناعي في الصياغة والتلخيص وتجهيز قوالب جاهزة للمستندات المتكررة.",
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
    "الحاسب الآلي / ICDL   •   Excel للمبتدئين   •   Word — إعداد المستندات الاحترافية",
    "خدمة العملاء والتعامل مع الجمهور   •   أدوات الذكاء الاصطناعي   •   التسويق الرقمي",
], size=9.0)

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
    "**المصادر:** لينكدإن والموقع الشخصي أعلاه للاطلاع على الأعمال.\n**التوصيات:** متاحة عند الطلب.",
    "**العمل الميداني:** مستعد لتغطية مهام المراجعات والجهات الحكومية عند الحاجة.",
], size=9.4)

doc.save("cv/cv-general-services.docx")
print("saved")
