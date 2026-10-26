/* =========================================================
   سيرتي — elite.js
   قالب «النخبة»: عمود واحد، عناوين مرقّمة، خطوط شعرية،
   مساحات بيضاء محسوبة — نفس لغة تصميم سيرة cv-elite.pdf
   ========================================================= */
(function () {
  'use strict';

  var EN = {
    profile: 'PROFILE', experience: 'EXPERIENCE', skills: 'SKILLS',
    education: 'EDUCATION & MORE', projects: 'PROJECTS', readiness: 'AVAILABILITY'
  };

  var AR = {
    profile: 'الملخص المهني', experience: 'الخبرات العملية', skills: 'المهارات',
    education: 'التعليم واللغات والدورات', projects: 'المشاريع',
    readiness: 'الجاهزية', eduCol: 'المؤهل العلمي', langsCol: 'اللغات',
    certsCol: 'الدورات والشهادات', cv: 'سيرة ذاتية', present: 'حتى الآن'
  };
  var ENL = {
    profile: 'Professional Summary', experience: 'Work Experience', skills: 'Skills',
    education: 'Education, Languages & Certifications', projects: 'Projects',
    readiness: 'Availability', eduCol: 'Education', langsCol: 'Languages',
    certsCol: 'Certifications', cv: 'Curriculum Vitae', present: 'Present'
  };

  function el(tag, cls, html) {
    return '<' + tag + (cls ? ' class="' + cls + '"' : '') + '>' + (html || '') + '</' + tag + '>';
  }

  function secHead(num, title, en) {
    return '<div class="el-sec-head">' +
      '<span class="el-sec-num">' + num + '</span>' +
      '<h2>' + (window.CV.esc(title)) + '</h2>' +
      (en ? '<span class="el-sec-en">' + window.CV.esc(en) + '</span>' : '') +
      '</div>';
  }

  var SEQ = 0;

  function section(title, en, inner) {
    if (!inner) return '';
    SEQ += 1;
    var num = ('0' + SEQ).slice(-2);
    return '<section class="el-sec">' + secHead(num, title, en) + inner + '</section>';
  }

  function dateRange(it, L) {
    var s = String(it.start || '').trim();
    if (it.current) {
      return s
        ? '<bdi>' + window.CV.esc(s) + ' — ' + L.present + '</bdi>'
        : L.present;
    }
    var e = String(it.end || '').trim();
    if (s && e) return '<bdi dir="ltr">' + window.CV.esc(s) + ' — ' + window.CV.esc(e) + '</bdi>';
    return window.CV.esc(s || e);
  }

  function bullets(text) {
    var lines = String(text || '').split(/\r?\n/)
      .map(function (s) { return s.replace(/^\s*[-•*·▪]\s*/, '').trim(); })
      .filter(Boolean);
    if (!lines.length) return '';
    if (lines.length === 1) return '<p class="el-text">' + window.CV.esc(lines[0]) + '</p>';
    return '<ul class="el-bullets">' + lines.map(function (l) {
      return '<li>' + window.CV.esc(l) + '</li>';
    }).join('') + '</ul>';
  }

  function render(cv) {
    SEQ = 0;
    var CV = window.CV;
    var esc = CV.esc;
    var p = cv.personal || {};
    var e = cv.extra || {};
    var lang = cv.lang === 'en' ? 'en' : 'ar';
    var L = lang === 'en' ? ENL : AR;
    var LEN = lang === 'en' ? EN : { profile: 'PROFILE', experience: 'EXPERIENCE', skills: 'SKILLS', education: 'EDUCATION & MORE', projects: 'PROJECTS', readiness: 'AVAILABILITY' };

    var name = (p.fullName || '').trim() || (lang === 'en' ? 'Your Name' : 'الاسم الكامل');
    var role = (p.jobTitle || '').trim();
    var eyebrow = (e.mini || '').trim() || L.cv;
    var english = (e.english || '').trim();

    var meta = [];
    function addMeta(kind, val, href) {
      if (!val) return;
      var inner = (kind === 'pin')
        ? esc(val)
        : '<bdi dir="ltr">' + esc(val) + '</bdi>';
      var body = href
        ? '<a href="' + href + '"' + (kind === 'phone' ? '' : ' target="_blank" rel="noopener"') + '>' + inner + '</a>'
        : inner;
      meta.push('<li>' + CV.ico(kind) + body + '</li>');
    }
    addMeta('phone', p.phone, 'tel:' + String(p.phone || '').replace(/\s|-/g, ''));
    addMeta('mail', p.email, 'mailto:' + p.email);
    addMeta('pin', p.city, null);
    addMeta('linkedin', p.linkedin ? CV.prettyUrl(p.linkedin) : '', p.linkedin);
    addMeta('link', p.website ? CV.prettyUrl(p.website) : '', p.website);
    addMeta('github', p.github ? CV.prettyUrl(p.github) : '', p.github);
    addMeta('behance', p.behance ? CV.prettyUrl(p.behance) : '', p.behance);
    addMeta('x', p.x ? CV.prettyUrl(p.x) : '', p.x);

    var head = '<header class="el-head">' +
      '<div class="el-eyebrow"><span>' + esc(eyebrow) + '</span>' +
        (english ? '<span class="el-tag">' + esc(english) + '</span>' : '') +
      '</div>' +
      '<h1 class="el-name">' + esc(name) + '</h1>' +
      (role ? '<p class="el-role">' + esc(role) + '</p>' : '') +
      (meta.length ? '<ul class="el-meta">' + meta.join('') + '</ul>' : '') +
      '</header>';

    /* 01 · الملخص */
    var sum = (p.summary || '').trim();
    var secSummary = sum
      ? section(L.profile, LEN.profile, '<p class="el-summary">' + esc(sum).replace(/\r?\n/g, '<br>') + '</p>')
      : '';

    /* 02 · الخبرات */
    var jobs = (cv.experience || []).filter(function (x) {
      return x && (x.role || x.company || x.description);
    });
    var expInner = jobs.map(function (it) {
      return '<article class="el-exp">' +
        '<div class="el-exp-top">' +
          '<h3 class="el-exp-role">' + esc(it.role || '') + '</h3>' +
          '<span class="el-exp-date">' + dateRange(it, L) + '</span>' +
        '</div>' +
        (it.company ? '<p class="el-exp-org">' + esc(it.company) + '</p>' : '') +
        bullets(it.description) +
        '</article>';
    }).join('');
    var secExp = section(L.experience, LEN.experience, expInner);

    /* 03 · المهارات */
    var groups = [];
    var map = {};
    (cv.skills || []).forEach(function (s) {
      if (!s || !s.name) return;
      var g = String(s.group || '').trim();
      if (!map[g]) { map[g] = { title: g, items: [] }; groups.push(map[g]); }
      map[g].items.push(s.name);
    });
    var skillsInner = groups.length
      ? '<dl class="el-skills">' + groups.map(function (g) {
          return (g.title ? '<dt>' + esc(g.title) + '</dt>' : '') +
            '<dd>' + g.items.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('<i>·</i>') + '</dd>';
        }).join('') + '</dl>'
      : '';
    var secSkills = section(L.skills, LEN.skills, skillsInner);

    /* 04 · التعليم واللغات والدورات */
    var edu = (cv.education || []).filter(function (x) {
      return x && (x.degree || x.school || x.note);
    });
    var eduHtml = edu.map(function (it) {
      var dr = dateRange(it, L);
      return '<p class="el-kv"><b>' + esc(it.degree || '') + '</b>' +
        (it.school ? '<span class="el-sub">' + esc(it.school) + '</span>' : '') +
        (dr ? '<span class="el-sub">' + dr + '</span>' : '') +
        (it.note ? '<span class="el-note">' + esc(it.note) + '</span>' : '') + '</p>';
    }).join('');

    var langs = (cv.languages || []).filter(function (x) { return x && x.name; });
    var langsHtml = langs.map(function (it) {
      return '<p class="el-kv"><b>' + esc(it.name) + '</b><span class="el-sub">' +
        esc(it.note || CV.langLevelText(it.level, lang)) + '</span></p>';
    }).join('');

    var certs = (cv.certifications || []).filter(function (x) { return x && (x.name || x.issuer); });
    var certsHtml = certs.length
      ? '<div class="el-chips">' + certs.map(function (it) {
          return '<span class="el-chip">' + esc(it.name || '') +
            (it.year ? '<i>' + esc(it.year) + '</i>' : '') + '</span>';
        }).join('') + '</div>'
      : '';

    var colsInner = (eduHtml || langsHtml || certsHtml)
      ? '<div class="el-cols">' +
          '<div>' + (eduHtml ? '<p class="el-col-h">' + esc(L.eduCol) + '</p>' + eduHtml : '') + '</div>' +
          '<div>' + (langsHtml ? '<p class="el-col-h">' + esc(L.langsCol) + '</p>' + langsHtml : '') + '</div>' +
          '<div>' + (certsHtml ? '<p class="el-col-h">' + esc(L.certsCol) + '</p>' + certsHtml : '') + '</div>' +
        '</div>'
      : '';
    var secEdu = section(L.education, LEN.education, colsInner);

    /* 05 · المشاريع */
    var projs = (cv.projects || []).filter(function (x) {
      return x && (x.name || x.description || x.link);
    });
    var projInner = projs.map(function (it) {
      return '<article class="el-exp">' +
        '<div class="el-exp-top"><h3 class="el-exp-role">' + esc(it.name || '') + '</h3>' +
        (it.link ? '<span class="el-exp-date"><bdi dir="ltr">' + esc(CV.prettyUrl(it.link)) + '</bdi></span>' : '') +
        '</div>' + bullets(it.description) + '</article>';
    }).join('');
    var secProj = section(L.projects, LEN.projects, projInner);

    /* 06 · الجاهزية */
    var ready = (e.readiness || []).filter(Boolean);
    var readyInner = ready.length
      ? '<div class="el-ready">' + ready.map(function (r) {
          return '<span>' + esc(r) + '</span>';
        }).join('') + '</div>'
      : '';
    var secReady = section(L.readiness, LEN.readiness, readyInner);

    var foot = '<footer class="el-foot">' +
      '<span>' + esc((e.footerNote || '').trim() || name) + '</span>' +
      '<span class="el-foot-meta"><b><bdi dir="ltr">' + esc(p.phone || '') + '</bdi></b>' +
        (p.email ? ' · <bdi dir="ltr">' + esc(p.email) + '</bdi>' : '') + '</span>' +
      '</footer>';

    return '<div class="cv-page tpl-elite" dir="' + (lang === 'ar' ? 'rtl' : 'ltr') +
      '" style="--cv-accent:' + esc(cv.accent || '#1B3A5C') +
      ';--cv-accent2:' + esc(cv.accent2 || '#B4874A') + '">' +
      head + secSummary + secExp + secSkills + secEdu + secProj + secReady + foot +
      '</div>';
  }

  window.CV_ELITE = { render: render };
})();
