/* =========================================================
   سيرتي — match.js
   مطابقة الوظيفة: يقارن نص إعلان الوظيفة بمحتوى السيرة
   ويستخرج الكلمات المفتاحية الناقصة — كل شيء داخل المتصفح.
   ========================================================= */
(function () {
  'use strict';

  var STOP = {
    ar: ('من في على إلى عن مع أن إن إلى أي ما لا لم لن قد كان كانت يكون تكون هذا هذه هذي ذلك تلك التي الذي الذين ' +
      'ثم أو و لكن كما حتى إذا كل بعض غير بين عند لدى منذ خلال بعد قبل نحو حول دون سوى ' +
      'نحن أنت أنتم هم هي هو إياك اياك يجب ينبغي يمكن يوجد توجد ' +
      'وظيفة وظائف العمل عمل الشركة شركة المؤسسة مؤسسة الوظيفة مهام المهام المطلوب مطلوبة الشروط المزايا ' +
      'خبرة سنوات سنة خبره لديه لديها يفضل يفضلون يفضل ان يكون انه يوجد عندنا ' +
      'ريال راتب رواتب دوام كامل جزئي موقع الرياض جدة الدمام السعودية المملكة ' +
      'عربي العربية انجليزي الانجليزية اللغة اتقان إجادة اجادة جيد جيدة ممتاز ممتازة ' +
      'يرجى الرجاء للتقديم التقديم ارسال إرسال السيرة الذاتية الذاتيه عبر البريد الايميل ' +
      'التواصل تفاصيل عنوان الشارع رقم هاتف للاستفسار المزيد عنه عنها عليه عليها فيه فيها ' +
      'وغير ذلك وفق حسب أيضاً ايضا اخرى آخر اخر جميع كافة ضمن داخل خارج ' +
      'مثل بحيث فقط جدا حتى الأن الآن خلال أيام يوم ساعات ساعة أسبوع اسبوع شهر شهور ' +
      'مطلوب مطلوبة للعمل والرد الرد الرياض جدة الدمام السعودي السعودية مهارات مهارة القدرة ' +
      'الرد والتواصل التواصل اعلان إعلان موظفين للتوظيف التوظيف وظيفه بشركة شركه مؤسسه').split(/\s+/),
    en: ('a an the and or but if of to in on at for with from by as is are was were be been being ' +
      'this that these those it its our your their my we you they he she i not no do does did ' +
      'will would can could should must may might have has had will work working job role position ' +
      'company team candidate candidates applicant applicants experience years year skills skill ' +
      'requirements responsibilities duties required preferred ability able good excellent strong ' +
      'must please apply application send email cv resume contact details full time part location ' +
      'based salary package benefits plus etc using use used new all any more most other such').split(/\s+/)
  };

  /* مصطلحات مهنية نمنحها وزنًا إضافيًا عند ورودها في الإعلان */
  var LEXICON = [
    ['خدمة العملاء', 2], ['خدمة عملاء', 2], ['customer service', 2],
    ['إدخال البيانات', 2], ['إدخال بيانات', 2], ['data entry', 2],
    ['الأرشفة', 2], ['أرشفة', 2], ['filing', 2], ['الملفات', 1],
    ['تقارير', 2], ['التقارير', 2], ['reports', 2],
    ['جداول', 2], ['excel', 3], ['word', 3], ['powerpoint', 2], ['outlook', 2],
    ['office', 3], ['الأوفيس', 3], ['icdl', 2], ['الحاسب', 2],
    ['المراجعين', 2], ['الجمهور', 1], ['العملاء', 2], ['العملاء', 2],
    ['منصات', 2], ['المنصات', 2], ['حكومية', 1], ['أبشر', 2], ['قوى', 2], ['ناجز', 2], ['اعتماد', 2],
    ['مستندات', 2], ['الخطابات', 2], ['خطابات', 2], ['صياغة', 2],
    ['سكرتارية', 2], ['إدارية', 1], ['إداري', 1], ['مكتب', 1], ['مكتبي', 2],
    ['سجلات', 2], ['تنظيم', 1], ['تدقيق', 2], ['دقة', 2],
    ['متابعة', 2], ['تنسيق', 2], ['استقبال', 2], ['معاملات', 2], ['المعاملات', 2],
    ['مبيعات', 2], ['كاشير', 2], ['نقاط البيع', 2], ['pos', 2], ['crm', 3], ['erp', 3],
    ['فاتورة', 2], ['فواتير', 2], ['محاسبة', 2], ['مخزون', 2],
    ['chatgpt', 2], ['الذكاء الاصطناعي', 2], ['ذكاء اصطناعي', 2], ['ai', 1],
    ['الإنجليزية', 1], ['العربية', 1], ['التواصل', 1], ['العمل تحت الضغط', 2]
  ];

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')   // تشكيل وتطويل
      .replace(/[إأآا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[ؤئ]/g, 'ء')
      .replace(/[^\p{L}\p{N}\s.]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokens(text) {
    return normalize(text).split(' ').filter(Boolean);
  }

  /* مفتاح المقارنة: بلا تشكيل، بلا «ال» التعريف، وبألف/هاء/ياء موحّدة */
  function key(w) {
    var k = normalize(w);
    if (k.length > 4 && k.indexOf('ال') === 0) k = k.slice(2);
    /* و/ب/ل/ف/ك الملتصقة ببداية الكلمة */
    if (k.length > 5 && 'وبلفك'.indexOf(k.charAt(0)) !== -1) k = k.slice(1);
    if (k.length > 4 && k.indexOf('ال') === 0) k = k.slice(2);
    return k;
  }

  function stopSet(lang) {
    var set = {};
    STOP.ar.concat(STOP.en).forEach(function (w) { set[normalize(w)] = true; });
    if (lang === 'en') STOP.en.forEach(function (w) { set[w] = true; });
    return set;
  }

  function cvToText(cv) {
    var p = cv.personal || {};
    var e = cv.extra || {};
    var parts = [p.fullName, p.jobTitle, p.summary, p.city];
    (cv.experience || []).forEach(function (x) {
      parts.push(x.role, x.company, x.description);
    });
    (cv.education || []).forEach(function (x) { parts.push(x.degree, x.school, x.note); });
    (cv.skills || []).forEach(function (x) { parts.push(x.name); });
    (cv.languages || []).forEach(function (x) { parts.push(x.name, x.note); });
    (cv.projects || []).forEach(function (x) { parts.push(x.name, x.description); });
    (cv.certifications || []).forEach(function (x) { parts.push(x.name, x.issuer); });
    (e.tools || []).forEach(function (x) { parts.push(x); });
    (e.offerItems || []).forEach(function (x) { parts.push(x); });
    (e.process || []).forEach(function (x) { parts.push(x.title, x.desc); });
    (e.grid || []).forEach(function (x) { parts.push(x.title, x.desc); });
    return parts.filter(Boolean).join(' \n ');
  }

  /* يستخرج عبارات مهمة (كلمة/كلمتان) من إعلان الوظيفة */
  function extractOld(jd, lang) {
    var stop = stopSet(lang);
    var words = tokens(jd);
    var freq = {};
    var keep = [];

    words.forEach(function (w, i) {
      if (w.length < 3 || stop[w] || /^\d+$/.test(w)) return;
      freq[w] = (freq[w] || 0) + 1;
      keep.push({ w: w, i: i });
    });

    /* ثنائيات: كلمتان متتاليتان كلتاهما ليستا من كلمات الإيقاف */
    var bi = {};
    for (var k = 0; k < words.length - 1; k++) {
      var a = words[k], b = words[k + 1];
      if (a.length < 3 || b.length < 3) continue;
      if (stop[a] || stop[b]) continue;
      var key = a + ' ' + b;
      bi[key] = (bi[key] || 0) + 1;
    }

    var items = [];
    Object.keys(bi).forEach(function (key) {
      if (bi[key] >= 2) items.push({ term: key, weight: bi[key] * 1.6 });
    });
    Object.keys(freq).forEach(function (term) {
      items.push({ term: term, weight: freq[term] });
    });

    /* وزن إضافي لمصطلحات القاموس المهني */
    LEXICON.forEach(function (pair) {
      var term = normalize(pair[0]);
      var hit = items.filter(function (x) { return x.term === term; })[0];
      if (hit) hit.weight += pair[1] * 2;
      else if (normalize(jd).indexOf(term) !== -1) items.push({ term: term, weight: pair[1] });
    });

    /* إزالة التكرار والحشو */
    var seen = {};
    var out = [];
    items
      .sort(function (x, y) { return y.weight - x.weight; })
      .forEach(function (it) {
        if (seen[it.term]) return;
        if (it.term.split(' ').some(function (w) { return stop[w]; })) return;
        seen[it.term] = true;
        out.push(it);
      });

    /* لا نحتفظ بالكلمة المفردة إن كانت جزءًا من ثنائية محفوظة */
    var keptBi = out.filter(function (x) { return x.term.indexOf(' ') !== -1; });
    return out.filter(function (x) {
      if (x.term.indexOf(' ') !== -1) return true;
      return !keptBi.some(function (b) { return b.term.split(' ').indexOf(x.term) !== -1; });
    }).slice(0, 26);
  }

  function extract(jd, lang) {
    var stop = stopSet(lang);
    var raw = String(jd || '').split(/\s+/).filter(Boolean);
    var words = [], orig = {};
    raw.forEach(function (w) {
      var n = normalize(w);
      if (!n) return;
      words.push(n);
      if (!orig[n]) orig[n] = w.replace(/[.,،؛:!؟()\[\]"']/g, '');
    });

    var freq = {};
    words.forEach(function (w) {
      if (w.length < 3 || stop[w] || stop[key(w)] || /^\d+$/.test(w)) return;
      var k = key(w);
      freq[k] = (freq[k] || 0) + 1;
    });

    var bi = {};
    for (var i = 0; i < words.length - 1; i++) {
      var a = words[i], b = words[i + 1];
      if (a.length < 3 || b.length < 3) continue;
      if (stop[a] || stop[b]) continue;
      if (/^\d+$/.test(a) || /^\d+$/.test(b)) continue;
      var kk = key(a) + ' ' + key(b);
      bi[kk] = bi[kk] || { w: kk, n: 0, orig: (orig[a] || a) + ' ' + (orig[b] || b) };
      bi[kk].n += 1;
    }

    var items = [];
    Object.keys(bi).forEach(function (k) {
      if (bi[k].n >= 2) items.push({ term: bi[k].w, label: bi[k].orig, weight: bi[k].n * 1.8 });
    });
    Object.keys(freq).forEach(function (k) {
      if (items.some(function (x) { return x.term === k; })) return;
      items.push({ term: k, label: orig[origKey(k)] || k, weight: freq[k] });
    });

    function origKey(k) {
      for (var w in orig) { if (key(w) === k) return w; }
      return k;
    }

    /* وزن إضافي لمصطلحات القاموس المهني */
    var jdKey = ' ' + words.map(key).join(' ') + ' ';
    LEXICON.forEach(function (pair) {
      var k = key(pair[0]);
      var hit = items.filter(function (x) { return x.term === k; })[0];
      if (hit) hit.weight += pair[1] * 2;
      else if (jdKey.indexOf(' ' + k + ' ') !== -1) {
        items.push({ term: k, label: pair[0], weight: pair[1] });
      }
    });

    /* إزالة التكرار والحشو */
    var seen = {};
    var out = [];
    items
      .sort(function (x, y) { return y.weight - x.weight; })
      .forEach(function (it) {
        if (seen[it.term]) return;
        seen[it.term] = true;
        out.push(it);
      });

    /* لا نحتفظ بالكلمة المفردة إن كانت جزءًا من ثنائية محفوظة */
    var keptBi = out.filter(function (x) { return x.term.indexOf(' ') !== -1; });
    return out.filter(function (x) {
      if (x.term.indexOf(' ') !== -1) return true;
      return !keptBi.some(function (b) { return b.term.split(' ').indexOf(x.term) !== -1; });
    }).slice(0, 28);
  }

  function analyze(cv, jd) {
    var lang = cv.lang === 'en' ? 'en' : 'ar';
    var cvWords = tokens(cvToText(cv)).map(key).filter(function (w) { return w.length > 2; });
    var cvSet = {};
    cvWords.forEach(function (w) { cvSet[w] = true; });
    var cvJoined = ' ' + cvWords.join(' ') + ' ';

    var terms = extract(jd, lang);
    var matched = [], missing = [], totalW = 0, gotW = 0;

    terms.forEach(function (it) {
      var parts = it.term.split(' ');
      var hit = parts.length === 1
        ? !!cvSet[it.term]
        : cvJoined.indexOf(' ' + it.term + ' ') !== -1;
      totalW += it.weight;
      if (hit) { gotW += it.weight; matched.push(it.label || it.term); }
      else { missing.push(it.label || it.term); }
    });

    var score = totalW ? Math.round((gotW / totalW) * 100) : 0;
    return {
      score: Math.max(0, Math.min(100, score)),
      matched: matched,
      missing: missing,
      terms: terms.length
    };
  }

  /* ---------------- UI ---------------- */
  function chips(list, cls) {
    return list.map(function (x) {
      return '<span class="kw ' + cls + '">' + escapeHtml(x) + '</span>';
    }).join('') || '<span class="kw-empty">—</span>';
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function open() {
    var app = window.SIRATI_APP;
    if (!app) return;
    var cv = app.getCurrent();
    if (!cv) return;
    var lang = cv.lang === 'en' ? 'en' : 'ar';
    var T = lang === 'en' ? EN : AR;

    app.openModal(
      '<h3>' + T.title + '</h3>' +
      '<p class="sub">' + T.sub + '</p>' +
      '<label class="field" style="display:block">' +
        '<span>' + T.label + '</span>' +
        '<textarea id="jdText" rows="6" placeholder="' + T.ph + '"></textarea>' +
      '</label>' +
      '<div id="jdResult" class="kw-result" hidden></div>' +
      '<div class="modal-foot">' +
        '<button class="btn" type="button" data-close="1">' + T.close + '</button>' +
        '<button class="btn primary" type="button" id="jdRun">' + T.run + '</button>' +
      '</div>'
    );

    var root = document.getElementById('modalRoot');
    var ta = root.querySelector('#jdText');
    var box = root.querySelector('#jdResult');
    ta.focus();

    root.querySelector('#jdRun').addEventListener('click', function () {
      var jd = ta.value.trim();
      if (jd.length < 40) { app.toast(T.short, true); return; }
      var res = analyze(cv, jd);
      var cls = res.score >= 70 ? 'good' : res.score >= 45 ? 'warn' : 'bad';
      box.hidden = false;
      box.innerHTML =
        '<div class="kw-gauge ' + cls + '"><b>' + res.score + '%</b><span>' + T.coverage + '</span></div>' +
        '<div class="kw-block"><b class="kw-h ok">' + T.matched + ' · ' + res.matched.length + '</b>' + chips(res.matched, 'ok') + '</div>' +
        '<div class="kw-block"><b class="kw-h miss">' + T.missing + ' · ' + res.missing.length + '</b>' + chips(res.missing, 'miss') + '</div>' +
        (res.missing.length
          ? '<div class="kw-tip">' + T.tip + '</div>'
          : '<div class="kw-tip ok">' + T.perfect + '</div>');
      box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  var AR = {
    title: 'مطابقة الوظيفة',
    sub: 'الصق نص إعلان الوظيفة، وسنقارنه بمحتوى سيرتك ونخبرك بالكلمات المفتاحية الناقصة.',
    label: 'نص إعلان الوظيفة',
    ph: 'مثال: مطلوب موظف خدمة عملاء، خبرة في إدخال البيانات والأرشفة، إجادة Excel و Word، التقارير اليومية…',
    run: 'تحليل المطابقة',
    close: 'إغلاق',
    coverage: 'نسبة تغطية الإعلان',
    matched: 'موجودة في سيرتك',
    missing: 'ناقصة — أضفها إن كانت تنطبق عليك',
    tip: 'أضف الكلمات الناقصة التي تُجيدها فعلًا إلى المهارات أو الوصف الوظيفي، وأعد التصدير — لا تضف ما لا تجيده.',
    perfect: 'سيرتك تغطي كل المصطلحات المهمة في هذا الإعلان.',
    short: 'الصق نص الإعلان كاملًا أولًا.'
  };
  var EN = {
    title: 'Job match',
    sub: 'Paste the job advert and we will compare it with your CV and list the keywords you are missing.',
    label: 'Job description',
    ph: 'e.g. Customer service assistant required. Data entry, filing, Excel and Word, daily reports…',
    run: 'Analyse match',
    close: 'Close',
    coverage: 'advert coverage',
    matched: 'In your CV',
    missing: 'Missing — add only if true',
    tip: 'Add the missing terms you genuinely have to your skills or experience, then re-export. Never claim what you cannot do.',
    perfect: 'Your CV already covers every important term in this advert.',
    short: 'Paste the full advert first.'
  };

  window.CV_MATCH = { analyze: analyze, open: open };
})();
