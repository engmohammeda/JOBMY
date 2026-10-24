/* =========================================================
   سيرتي — career.js
   مركز التقديم: قائمة الوظائف، الرسائل، المقابلة، والمهارات.
   ========================================================= */
(function () {
  'use strict';

  var DATA = window.CareerData || {};
  var STORE = 'sirati.career.v1';
  var state = { version: 1, jobs: [] };
  var activeId = null;
  var activeTab = 'overview';
  var filter = 'all';
  var search = '';
  var phoneCat = 'all';
  var phoneQuery = '';
  var saveTimer = null;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) {
    if (window.CV && CV.esc) return CV.esc(v);
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function uid() { return 'job_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function addDays(iso, n) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function fmtDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
      if (isNaN(d.getTime())) return iso;
      return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch (e) { return iso; }
  }
  function profile() {
    return DATA.profile || {
      name: 'محمد البخيتي', firstName: 'محمد', phone: '+966 56 674 3293',
      email: 'Mohammedalbkhty@gmail.com', city: 'الرياض، السعودية', age: '24',
      cvName: 'محمد البخيتي — مبيعات وخدمة عملاء (جوالات)'
    };
  }
  function statuses() { return DATA.statuses || [{ id: 'ready', label: 'جاهز للتقديم' }]; }
  function statusMeta(id) {
    return statuses().filter(function (s) { return s.id === id; })[0] || statuses()[0];
  }
  function statusBadge(id) {
    var s = statusMeta(id);
    return '<span class="career-status ' + esc(s.id) + '">' + esc(s.label) + '</span>';
  }
  function getJob(id) {
    for (var i = 0; i < state.jobs.length; i++) if (state.jobs[i].id === id) return state.jobs[i];
    return null;
  }
  function activeJob() { return getJob(activeId) || state.jobs[0] || null; }
  function getCvs() {
    if (window.Sirati && Sirati.getCvs) return Sirati.getCvs();
    try {
      var raw = JSON.parse(localStorage.getItem('sirati.cv.v1') || '{}');
      return Array.isArray(raw.cvs) ? raw.cvs : [];
    } catch (e) { return []; }
  }
  function resolveCv(job) {
    if (!job) return null;
    var cvs = getCvs();
    if (job.cvId) {
      for (var i = 0; i < cvs.length; i++) if (cvs[i].id === job.cvId) return cvs[i];
    }
    if (job.cvName) {
      for (var j = 0; j < cvs.length; j++) if (cvs[j].name === job.cvName) return cvs[j];
      for (var k = 0; k < cvs.length; k++) {
        if (String(cvs[k].name || '').indexOf('مبيعات وخدمة عملاء') !== -1) return cvs[k];
      }
    }
    return null;
  }
  function toast(msg, isErr) {
    if (window.Sirati && Sirati.toast) { Sirati.toast(msg, isErr); return; }
    var el = document.getElementById('toast');
    if (!el) { if (isErr) console.warn(msg); else console.log(msg); return; }
    el.hidden = false;
    el.className = 'toast' + (isErr ? ' err' : '');
    el.innerHTML = '<div></div>';
    el.firstChild.textContent = msg;
    setTimeout(function () { el.hidden = true; }, 3200);
  }
  function copyText(text, okMsg) {
    var value = String(text == null ? '' : text);
    function done() { toast(okMsg || 'تم النسخ.'); }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', 'readonly');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (e) { toast('تعذّر النسخ. حدّد النص وانسخه يدويًا.', true); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(fallback);
    } else fallback();
  }
  function fillTemplate(text, job) {
    var p = profile();
    var map = {
      name: p.name,
      firstName: p.firstName,
      company: (job && job.company) || 'الجهة',
      title: (job && job.title) || 'الوظيفة',
      city: p.city,
      phone: p.phone,
      email: p.email,
      cvName: (job && job.cvName) || p.cvName,
      date: job && job.appliedAt ? fmtDate(job.appliedAt) : 'تاريخ الإرسال',
      time: 'الموعد المتفق عليه',
      location: (job && job.location) || 'المكان المتفق عليه',
      contactName: (job && job.contactName) || 'فريق التوظيف',
      salary: 'الراتب المقترح'
    };
    return String(text || '').replace(/\{\{(\w+)\}\}/g, function (_, key) {
      return map[key] != null ? map[key] : '';
    });
  }
  function templateText(t, job) {
    if (job && job.messages && Object.prototype.hasOwnProperty.call(job.messages, t.id)) {
      return job.messages[t.id];
    }
    return fillTemplate(t.text, job);
  }
  function categoryLabel(id) {
    var list = DATA.phoneCategories || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
    return id;
  }
  function normalizeJob(raw) {
    raw = raw || {};
    return {
      id: raw.id || uid(),
      title: String(raw.title || ''),
      company: String(raw.company || ''),
      location: String(raw.location || ''),
      contract: String(raw.contract || ''),
      level: String(raw.level || ''),
      qualification: String(raw.qualification || ''),
      source: String(raw.source || ''),
      url: String(raw.url || ''),
      status: statuses().some(function (s) { return s.id === raw.status; }) ? raw.status : 'ready',
      appliedAt: String(raw.appliedAt || ''),
      contactName: String(raw.contactName || ''),
      contactPhone: String(raw.contactPhone || ''),
      contactEmail: String(raw.contactEmail || ''),
      cvId: String(raw.cvId || ''),
      cvName: String(raw.cvName || ''),
      notes: String(raw.notes || ''),
      jobText: String(raw.jobText || ''),
      match: Array.isArray(raw.match) ? raw.match.filter(Boolean).map(String) : [],
      messages: raw.messages && typeof raw.messages === 'object' ? raw.messages : {},
      timeline: Array.isArray(raw.timeline) ? raw.timeline.filter(function (x) {
        return x && typeof x === 'object';
      }).map(function (x) {
        return {
          date: String(x.date || todayISO()),
          type: String(x.type || 'note'),
          text: String(x.text || ''),
          created: Number(x.created) || Date.now()
        };
      }) : [],
      created: Number(raw.created) || Date.now(),
      updated: Number(raw.updated) || Date.now()
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.jobs)) {
          state = { version: 1, jobs: parsed.jobs.map(normalizeJob) };
          activeId = parsed.activeId || (state.jobs[0] ? state.jobs[0].id : null);
          return;
        }
      }
    } catch (e) { /* ignore */ }
    state = { version: 1, jobs: (DATA.seedJobs || []).map(normalizeJob) };
    activeId = state.jobs[0] ? state.jobs[0].id : null;
    save();
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        version: 1,
        activeId: activeId,
        jobs: state.jobs
      }));
      updateChrome();
      if ($('#view-career') && !$('#view-career').hidden) renderSidebar();
    } catch (e) {
      toast('تعذّر حفظ بيانات الوظائف: مساحة التخزين ممتلئة.', true);
    }
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 250);
  }
  function updateChrome() {
    var n = state.jobs.length;
    var badge = $('#careerCount');
    if (badge) {
      badge.textContent = n;
      badge.hidden = !n;
    }
    var strip = $('#careerStripText');
    if (strip) {
      if (!n) {
        strip.textContent = 'تابع الوظائف التي تقدمت عليها، رسائل التقديم، والاستعداد للمقابلة.';
      } else {
        var latest = state.jobs.slice().sort(function (a, b) {
          return (b.updated || b.created || 0) - (a.updated || a.created || 0);
        })[0];
        strip.textContent = n === 1
          ? 'وظيفة واحدة قيد المتابعة — الحالة: ' + statusMeta(latest.status).label
          : n + ' وظائف قيد المتابعة — آخر حالة: ' + statusMeta(latest.status).label;
      }
    }
  }

  /* ------------------------- render ------------------------- */
  function render() {
    if (!activeId && state.jobs.length) activeId = state.jobs[0].id;
    if (activeId && !getJob(activeId)) activeId = state.jobs[0] ? state.jobs[0].id : null;
    renderSidebar();
    renderMain();
    updateChrome();
  }
  function renderSidebar() {
    var total = state.jobs.length;
    var activeCount = state.jobs.filter(function (j) {
      return j.status !== 'rejected' && j.status !== 'withdrawn';
    }).length;
    var interviews = state.jobs.filter(function (j) {
      return j.status === 'interview' || j.status === 'offer';
    }).length;
    var offers = state.jobs.filter(function (j) { return j.status === 'offer'; }).length;
    var stats = $('#careerStats');
    if (stats) {
      stats.innerHTML =
        '<div class="career-stat"><b>' + total + '</b><span>وظائف</span></div>' +
        '<div class="career-stat"><b>' + activeCount + '</b><span>قيد المتابعة</span></div>' +
        '<div class="career-stat"><b>' + (interviews || offers) + '</b><span>مقابلات/عروض</span></div>';
    }

    var filters = $('#careerFilters');
    if (filters) {
      var chips = [{ id: 'all', label: 'الكل', count: total }].concat(statuses().map(function (s) {
        return {
          id: s.id, label: s.label,
          count: state.jobs.filter(function (j) { return j.status === s.id; }).length
        };
      }));
      filters.innerHTML = chips.map(function (c) {
        return '<button class="career-filter' + (filter === c.id ? ' on' : '') +
          '" type="button" data-career-filter="' + esc(c.id) + '">' +
          esc(c.label) + (c.count ? ' (' + c.count + ')' : '') + '</button>';
      }).join('');
    }

    var list = state.jobs.slice().sort(function (a, b) {
      return (b.updated || b.created || 0) - (a.updated || a.created || 0);
    }).filter(function (j) {
      if (filter !== 'all' && j.status !== filter) return false;
      if (!search) return true;
      var q = search.toLowerCase();
      var hay = [j.title, j.company, j.location, j.jobText, j.notes, j.contactName].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    var host = $('#careerJobList');
    if (!host) return;
    if (!list.length) {
      host.innerHTML = '<div class="career-empty"><h3>لا توجد نتائج</h3><p>جرّب كلمة بحث أخرى أو أضف وظيفة جديدة.</p></div>';
      return;
    }
    host.innerHTML = list.map(function (j) {
      var preview = j.jobText || j.notes || j.source || '';
      return '<button class="career-job' + (j.id === activeId ? ' active' : '') +
        '" type="button" data-job-id="' + esc(j.id) + '">' +
        '<div class="career-job-top"><b>' + esc(j.title || 'وظيفة بدون مسمى') + '</b>' +
          statusBadge(j.status) + '</div>' +
        '<div class="career-job-meta"><span>' + esc(j.company || 'جهة غير محددة') + '</span>' +
          (j.location ? '<span>' + esc(j.location) + '</span>' : '') +
          (j.appliedAt ? '<span>' + esc(fmtDate(j.appliedAt)) + '</span>' : '') + '</div>' +
        (preview ? '<div class="career-job-preview">' + esc(preview) + '</div>' : '') +
        '</button>';
    }).join('');
  }

  function tabsHtml() {
    var tabs = [
      { id: 'overview', label: 'نظرة عامة' },
      { id: 'messages', label: 'الرسائل' },
      { id: 'interview', label: 'المقابلة' },
      { id: 'phone', label: 'مهارات الجوالات' },
      { id: 'notes', label: 'المتابعة' }
    ];
    return '<div class="career-tabs" role="tablist">' + tabs.map(function (t) {
      return '<button class="career-tab' + (activeTab === t.id ? ' on' : '') +
        '" type="button" role="tab" data-career-tab="' + t.id + '" aria-selected="' +
        (activeTab === t.id ? 'true' : 'false') + '">' + esc(t.label) + '</button>';
    }).join('') + '</div>';
  }

  function renderMain() {
    var host = $('#careerMain');
    if (!host) return;
    var job = activeJob();
    if (!job) {
      host.innerHTML = '<div class="career-empty">' +
        '<h3>ابدأ بمركز التقديم</h3>' +
        '<p>أضف الوظيفة التي تقدمت عليها، واربط سيرتها، ثم استخدم رسائل التقديم والاستعداد للمقابلة.</p>' +
        '<button class="btn primary" type="button" data-career-act="add-job">＋ إضافة وظيفة</button>' +
        '</div>';
      return;
    }

    var sub = [];
    if (job.company) sub.push('<span>' + esc(job.company) + '</span>');
    if (job.location) sub.push('<span>' + esc(job.location) + '</span>');
    if (job.contract) sub.push('<span>' + esc(job.contract) + '</span>');
    if (job.level) sub.push('<span>' + esc(job.level) + '</span>');
    if (job.appliedAt) sub.push('<span>تقديم: ' + esc(fmtDate(job.appliedAt)) + '</span>');

    var statusOpts = statuses().map(function (s) {
      return '<option value="' + esc(s.id) + '"' + (job.status === s.id ? ' selected' : '') + '>' +
        esc(s.label) + '</option>';
    }).join('');

    var body = '';
    if (activeTab === 'messages') body = messagesHtml(job);
    else if (activeTab === 'interview') body = interviewHtml(job);
    else if (activeTab === 'phone') body = phoneHtml(job);
    else if (activeTab === 'notes') body = notesHtml(job);
    else body = overviewHtml(job);

    host.innerHTML =
      '<div class="career-detail-head">' +
        '<div class="career-eyebrow">' + esc(job.status === 'ready' ? 'جاهز للتقديم' : 'ملف الوظيفة') + '</div>' +
        '<h1>' + esc(job.title || 'وظيفة بدون مسمى') + '</h1>' +
        '<div class="career-detail-sub">' + sub.join('') + '</div>' +
        '<div class="career-detail-actions">' +
          '<select class="select" data-career-status aria-label="حالة التقديم">' + statusOpts + '</select>' +
          '<button class="btn primary sm" type="button" data-career-act="open-cv">فتح السيرة</button>' +
          '<button class="btn sm" type="button" data-career-act="copy-first">نسخ الرسالة الأولى</button>' +
          '<button class="btn sm" type="button" data-career-act="edit-job">تعديل</button>' +
          '<button class="btn sm danger" type="button" data-career-act="delete-job">حذف</button>' +
        '</div>' +
      '</div>' +
      tabsHtml() +
      '<div class="career-tab-body" id="careerTabBody">' + body + '</div>';

    if (activeTab === 'phone') renderPhoneList();
    if (activeTab === 'messages') autoGrowMessages();
  }
  function autoGrow(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight + 2) + 'px';
  }
  function autoGrowMessages() {
    var run = function () { $$('.msg-text[data-msg-input]').forEach(autoGrow); };
    run();
    if (window.requestAnimationFrame) requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  function overviewHtml(job) {
    var cv = resolveCv(job);
    var cvBlock;
    if (cv) {
      cvBlock = '<div class="career-cv-row"><div><b>' + esc(cv.name) + '</b>' +
        '<div class="career-note">' + esc(window.CV ? CV.templateName(cv.template, 'ar') : cv.template) +
        (window.CV && CV.isAts(cv.template) ? ' · متوافق مع ATS' : '') + '</div></div>' +
        '<button class="btn sm primary" type="button" data-career-act="open-cv">فتح السيرة</button></div>';
    } else {
      cvBlock = '<div class="career-cv-row"><div><b>' + esc(job.cvName || 'غير مرتبطة') + '</b>' +
        '<div class="career-note">لم يتم العثور على السيرة في التطبيق. اربط سيرة موجودة من زر «تعديل».</div></div>' +
        '<button class="btn sm" type="button" data-career-act="edit-job">ربط سيرة</button></div>';
    }

    var matches = (job.match || []).map(function (m, i) {
      return '<div class="career-match-item"><b>نقطة ' + (i + 1) + '</b>' + esc(m) + '</div>';
    }).join('');
    if (!matches) {
      matches = '<div class="career-match-item"><b>المطابقة</b>راجع السيرة ورسالة التقديم قبل الإرسال.</div>';
    }

    var contact = [job.contactName, job.contactPhone, job.contactEmail].filter(Boolean).join(' · ') || 'غير محددة';
    var follow = job.appliedAt
      ? 'تابع بعد 3 أيام: ' + fmtDate(addDays(job.appliedAt, 3))
      : 'سجّل تاريخ التقديم أولًا لتظهر لك متابعة تلقائية بعد 3 أيام.';

    return '<div class="career-grid2">' +
        '<div class="career-card"><div class="career-kicker">لماذا تناسبك</div>' +
          '<div class="career-match">' + matches + '</div></div>' +
        '<div class="career-card"><div class="career-kicker">بيانات الوظيفة</div>' +
          '<div class="career-kv">' +
            kv('الشركة', job.company || 'غير محددة') +
            kv('المدينة', job.location || 'غير محددة') +
            kv('نوع العقد', job.contract || 'غير محدد') +
            kv('المستوى', job.level || 'غير محدد') +
            kv('المؤهل', job.qualification || 'غير محدد') +
            kv('المصدر', job.source || 'غير محدد') +
            kv('تاريخ التقديم', job.appliedAt ? fmtDate(job.appliedAt) : 'لم يُسجّل بعد') +
            kv('التواصل', contact) +
          '</div></div>' +
      '</div>' +
      '<div class="career-card"><div class="career-kicker">السيرة المرتبطة</div>' + cvBlock + '</div>' +
      '<div class="career-card"><div class="career-kicker">خطة التقديم</div>' +
        '<ol class="career-steps">' +
          '<li>راجع السيرة والرسالة الأولى، وعدّل اسم المتجر أو المسؤول إذا عرفته.</li>' +
          '<li>أرسل الرسالة مع السيرة عبر واتساب أو البريد، وحدّث الحالة إلى «تم التقديم».</li>' +
          '<li>' + esc(follow) + '</li>' +
          '<li>بعد المقابلة أرسل رسالة شكر، وسجّل النتيجة في «المتابعة».</li>' +
        '</ol></div>' +
      (job.jobText ? '<details class="career-acc"><summary>نص الوظيفة / الإعلان</summary>' +
        '<div class="acc-body"><div class="career-jobtext">' + esc(job.jobText) + '</div></div></details>' : '') +
      (job.notes ? '<div class="career-card"><div class="career-kicker">ملاحظات</div><p class="career-note">' + esc(job.notes) + '</p></div>' : '');
  }
  function kv(label, value) {
    return '<div class="career-kv-row"><span>' + esc(label) + '</span><b>' + esc(value) + '</b></div>';
  }

  function messagesHtml(job) {
    var list = DATA.templates || [];
    if (!list.length) return '<div class="career-empty"><h3>لا توجد قوالب</h3><p>أضف قوالب الرسائل في ملف البيانات.</p></div>';
    var note = '<div class="career-card"><div class="career-kicker">قبل الإرسال</div>' +
      '<p class="career-note">عدّل النص حسب اسم المتجر والمسؤول. المتغيرات بين {{ }} تُستبدل تلقائيًا. ' +
      'عند تعديل أي رسالة تُحفظ نسخة خاصة بهذه الوظيفة، ويمكنك استعادة القالب الأصلي في أي وقت.</p></div>';
    return note + list.map(function (t) {
      var txt = templateText(t, job);
      var edited = job.messages && Object.prototype.hasOwnProperty.call(job.messages, t.id);
      return '<div class="career-message">' +
        '<div class="career-message-head"><b>' + esc(t.title) + '</b>' +
          '<span class="career-chip">' + esc(t.channel) + '</span>' +
          (edited ? '<span class="career-chip">معدّلة</span>' : '') + '</div>' +
        '<textarea class="msg-text" data-msg-input="' + esc(t.id) + '" spellcheck="false" dir="rtl">' +
          esc(txt) + '</textarea>' +
        '<div class="career-message-foot">' +
          '<button class="btn sm primary" type="button" data-copy-msg="' + esc(t.id) + '">نسخ</button>' +
          (t.channel.indexOf('WhatsApp') !== -1
            ? '<button class="btn sm" type="button" data-wa-msg="' + esc(t.id) + '">فتح واتساب</button>'
            : '') +
          (edited ? '<button class="btn sm ghost" type="button" data-reset-msg="' + esc(t.id) + '">استعادة القالب</button>' : '') +
        '</div></div>';
    }).join('');
  }

  function interviewHtml(job) {
    var I = DATA.interview || {};
    var questions = (I.questions || []).map(function (q, i) {
      return '<details class="career-acc"><summary>' + esc(q.q) + '</summary>' +
        '<div class="acc-body"><p class="career-note"><b>لماذا يسألون؟</b> ' + esc(q.why || '') + '</p>' +
        '<div class="career-quote">' + esc(q.answer || '') + '</div>' +
        '<div class="career-copy-row"><button class="btn sm" type="button" data-copy-answer="' + i + '">نسخ الإجابة</button></div>' +
        '</div></details>';
    }).join('');
    var plan = (I.plan || []).map(function (x) {
      return '<li><b>' + esc(x.time) + ':</b> ' + esc(x.text) + '</li>';
    }).join('');
    var ask = (I.ask || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var dos = (I.do || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var donts = (I.dont || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var never = ((DATA.tips || {}).never || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');

    return '<div class="career-card"><div class="career-kicker">تعريفك في 60 ثانية</div>' +
        '<p class="career-note">' + esc(I.intro || '') + '</p>' +
        '<div class="career-copy-row"><button class="btn sm primary" type="button" data-copy-intro="1">نسخ التعريف</button></div></div>' +
      '<div class="career-card"><div class="career-kicker">خطة المقابلة</div><ul class="career-steps">' + plan + '</ul></div>' +
      '<div class="career-warn"><b>حدود مهنية مهمة:</b> لا تذكر تجاوز حسابات Google أو iCloud أو تغيير IMEI. ' +
        'قل إنك تلتزم بإثبات الملكية وتستخدم القنوات الرسمية؛ هذه نقطة ثقة أمام صاحب المتجر.</div>' +
      '<div class="career-card"><div class="career-kicker">أسئلة متوقعة وإجابات جاهزة</div>' + questions + '</div>' +
      '<div class="career-grid2">' +
        '<div class="career-card"><div class="career-kicker">أسئلة اسألها للجهة</div><ul>' + ask + '</ul></div>' +
        '<div class="career-card"><div class="career-kicker">الراتب</div><p class="career-note">' + esc(I.salary || '') + '</p>' +
          '<div class="career-quote">' + esc(I.close || '') + '</div></div>' +
      '</div>' +
      '<div class="career-grid2">' +
        '<div class="career-card"><div class="career-do"><h4>افعل</h4><ul>' + dos + '</ul></div></div>' +
        '<div class="career-card"><div class="career-dont"><h4>لا تفعل</h4><ul>' + donts + '</ul></div></div>' +
      '</div>' +
      '<div class="career-card"><div class="career-dont"><h4>لا تقلها في المقابلة</h4><ul>' + never + '</ul></div></div>';
  }

  function phoneHtml(job) {
    var cats = (DATA.phoneCategories || []).map(function (c) {
      return '<button class="career-filter' + (phoneCat === c.id ? ' on' : '') +
        '" type="button" data-phone-cat="' + esc(c.id) + '">' + esc(c.label) + '</button>';
    }).join('');
    return '<div class="career-card"><div class="career-kicker">كيف تستخدم هذه المكتبة</div>' +
        '<p class="career-note">لا تحفظ كل شيء. اختر 3 مواضيع تتقنها واشرحها بثقة في المقابلة، وكن صادقًا فيما لا تجربه. ' +
        'الهدف أن يفهم المقابل أنك تفهم الجهاز والعميل، لا أن تحفظ مصطلحات.</p>' +
        '<div class="career-warn">لا تدّعِ إصلاح البورد أو المعالجات إذا لم تتدرب عليه. قل: «أشخّص وأحوّل للمختص عند الحاجة» — هذه إجابة مهنية أقوى من المبالغة.</div></div>' +
      '<div class="career-phone-search"><input type="search" data-phone-search="1" value="' + esc(phoneQuery) +
        '" placeholder="ابحث عن مصطلح: PMIC، تفليش، شاشة..." aria-label="بحث في مهارات الجوالات"></div>' +
      '<div class="career-phone-cats">' +
        '<button class="career-filter' + (phoneCat === 'all' ? ' on' : '') +
          '" type="button" data-phone-cat="all">الكل</button>' + cats + '</div>' +
      '<div id="phoneList"></div>';
  }
  function renderPhoneList() {
    var host = $('#phoneList');
    if (!host) return;
    var q = phoneQuery.toLowerCase();
    var list = (DATA.phoneSkills || []).map(function (x, i) { return { x: x, i: i }; }).filter(function (o) {
      var x = o.x;
      if (phoneCat !== 'all' && x.cat !== phoneCat) return false;
      if (!q) return true;
      return [x.term, x.en, x.what, x.say, x.caution, categoryLabel(x.cat)].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    if (!list.length) {
      host.innerHTML = '<div class="career-empty"><h3>لا توجد نتائج</h3><p>جرّب كلمة أخرى أو اختر «الكل».</p></div>';
      return;
    }
    host.innerHTML = list.map(function (o) {
      var x = o.x;
      return '<details class="career-acc"><summary><span class="career-phone-term"><b>' + esc(x.term) +
        '</b><em>' + esc(x.en || '') + '</em></span><span class="career-chip">' +
        esc(categoryLabel(x.cat)) + '</span></summary>' +
        '<div class="acc-body"><p><b>ما هو؟</b> ' + esc(x.what || '') + '</p>' +
        '<div class="career-quote"><b>قلها في المقابلة:</b> ' + esc(x.say || '') + '</div>' +
        (x.caution ? '<div class="career-warn">' + esc(x.caution) + '</div>' : '') +
        '<div class="career-copy-row"><button class="btn sm" type="button" data-copy-say="' + o.i + '">نسخ الجملة</button></div>' +
        '</div></details>';
    }).join('');
  }

  function notesHtml(job) {
    var contact = [job.contactName, job.contactPhone, job.contactEmail].filter(Boolean).join(' · ') || 'غير محددة';
    var timeline = (job.timeline || []).map(function (x, i) {
      var labels = { note: 'ملاحظة', message: 'رسالة', call: 'اتصال', interview: 'مقابلة', offer: 'عرض', other: 'أخرى' };
      return '<li><time>' + esc(fmtDate(x.date)) + ' · ' + esc(labels[x.type] || x.type) + '</time>' +
        '<p>' + esc(x.text) + '</p>' +
        '<button class="btn ghost sm" type="button" data-del-log="' + i + '" title="حذف">✕</button></li>';
    }).join('');
    return '<div class="career-grid2">' +
        '<div class="career-card"><div class="career-kicker">بيانات التواصل</div>' +
          '<p class="career-note">' + esc(contact) + '</p>' +
          '<div class="career-copy-row"><button class="btn sm" type="button" data-career-act="edit-job">تعديل البيانات</button></div></div>' +
        '<div class="career-card"><div class="career-kicker">ملاحظات حرة</div>' +
          '<textarea class="msg-text" data-career-notes="1" spellcheck="false" dir="rtl" style="min-height:110px">' +
            esc(job.notes || '') + '</textarea></div>' +
      '</div>' +
      '<div class="career-card"><div class="career-kicker">سجل المحادثات والمتابعة</div>' +
        (timeline ? '<ul class="career-timeline">' + timeline + '</ul>' : '<p class="career-note">لا توجد أحداث بعد. أضف أول متابعة.</p>') +
        '<div class="career-log-form">' +
          '<label class="field"><span>التاريخ</span><input type="date" id="logDate" value="' + todayISO() + '"></label>' +
          '<label class="field"><span>النوع</span><select id="logType">' +
            '<option value="message">رسالة</option><option value="call">اتصال</option>' +
            '<option value="interview">مقابلة</option><option value="offer">عرض</option>' +
            '<option value="note">ملاحظة</option></select></label>' +
          '<label class="field"><span>التفاصيل</span><input type="text" id="logText" placeholder="مثال: أرسلت السيرة عبر واتساب"></label>' +
          '<button class="btn primary" type="button" data-career-act="add-log">إضافة</button>' +
        '</div></div>' +
      '<div class="career-card"><div class="career-kicker">إدارة الوظيفة</div>' +
        '<div class="career-copy-row"><button class="btn sm danger" type="button" data-career-act="delete-job">حذف الوظيفة من المركز</button></div></div>';
  }

  /* ------------------------- actions ------------------------- */
  function open() {
    if (window.Sirati && Sirati.showView) { Sirati.showView('career'); return; }
    var home = $('#view-home'), editor = $('#view-editor'), career = $('#view-career');
    if (home) home.hidden = true;
    if (editor) editor.hidden = true;
    if (career) career.hidden = false;
    render();
  }
  function openCv() {
    var job = activeJob();
    if (!job) return;
    var cv = resolveCv(job);
    if (!cv) { toast('لم يتم العثور على السيرة المرتبطة. اربط سيرة من زر «تعديل».', true); return; }
    if (window.Sirati && Sirati.openCv) Sirati.openCv(cv.id);
    else toast('افتح السيرة من الصفحة الرئيسية.', true);
  }
  function copyFirst() {
    var job = activeJob();
    var list = DATA.templates || [];
    var t = list.filter(function (x) { return x.id === 'first'; })[0] || list[0];
    if (!job || !t) return;
    copyText(templateText(t, job), 'تم نسخ الرسالة الأولى.');
  }
  function openWhatsApp(id) {
    var job = activeJob();
    var t = (DATA.templates || []).filter(function (x) { return x.id === id; })[0];
    if (!job || !t) return;
    var digits = String(job.contactPhone || '').replace(/\D/g, '');
    if (digits.length < 8) {
      toast('أضف رقم واتساب جهة الاتصال من زر «تعديل» أولًا.', true);
      return;
    }
    var url = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(templateText(t, job));
    window.open(url, '_blank', 'noopener');
  }
  function addLog() {
    var job = activeJob();
    if (!job) return;
    var date = $('#logDate') ? $('#logDate').value : todayISO();
    var type = $('#logType') ? $('#logType').value : 'note';
    var text = $('#logText') ? $('#logText').value.trim() : '';
    if (!text) { toast('اكتب تفاصيل المتابعة أولًا.', true); return; }
    job.timeline = job.timeline || [];
    job.timeline.unshift({ date: date || todayISO(), type: type, text: text, created: Date.now() });
    job.updated = Date.now();
    save();
    renderMain();
    toast('تمت إضافة المتابعة.');
  }
  function exportJobs() {
    var payload = {
      app: 'sirati-career',
      version: 1,
      exportedAt: new Date().toISOString(),
      jobs: state.jobs
    };
    try {
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'sirati-career-' + todayISO() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      toast('تم حفظ نسخة احتياطية للوظائف.');
    } catch (e) { toast('تعذّر إنشاء النسخة الاحتياطية.', true); }
  }

  /* ------------------------- job modal ------------------------- */
  function field(label, name, value, opts) {
    opts = opts || {};
    var control = opts.textarea
      ? '<textarea data-cjob="' + name + '" rows="' + (opts.rows || 3) + '"' +
          (opts.dir ? ' dir="' + opts.dir + '"' : '') + '>' + esc(value) + '</textarea>'
      : '<input type="' + (opts.type || 'text') + '" data-cjob="' + name + '" value="' + esc(value) + '"' +
          (opts.dir ? ' dir="' + opts.dir + '"' : '') +
          (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + '>';
    return '<label class="field' + (opts.span2 ? ' span2' : '') + '"><span>' + esc(label) + '</span>' +
      control + '</label>';
  }
  function openJobModal(job) {
    var isEdit = !!job;
    var j = job || {};
    var cvs = getCvs();
    var cvId = j.cvId || (resolveCv(j) ? resolveCv(j).id : '');
    var cvOpts = '<option value="">بدون ربط</option>' + cvs.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === cvId ? ' selected' : '') + '>' +
        esc(c.name) + '</option>';
    }).join('');
    var statusOpts = statuses().map(function (s) {
      return '<option value="' + esc(s.id) + '"' + ((j.status || 'ready') === s.id ? ' selected' : '') + '>' +
        esc(s.label) + '</option>';
    }).join('');
    var html = '<div class="modal-backdrop career-modal">' +
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<button class="btn ghost sm icon modal-close" type="button" data-career-close="1" aria-label="close">✕</button>' +
      '<h3>' + (isEdit ? 'تعديل الوظيفة' : 'إضافة وظيفة') + '</h3>' +
      '<p class="sub">أضف بيانات الوظيفة واربط السيرة المناسبة. يمكنك تعديلها لاحقًا.</p>' +
      '<div class="grid2">' +
        field('مسمى الوظيفة', 'title', j.title || '', { span2: true, placeholder: 'مثال: موظف مبيعات وخدمة عملاء' }) +
        field('الشركة / المتجر', 'company', j.company || '') +
        '<label class="field"><span>الحالة</span><select data-cjob="status">' + statusOpts + '</select></label>' +
        field('المدينة', 'location', j.location || '', { placeholder: 'الرياض' }) +
        field('نوع العقد', 'contract', j.contract || '', { placeholder: 'دوام كامل' }) +
        field('المستوى', 'level', j.level || '', { placeholder: 'متدرب / خبرة' }) +
        field('المؤهل المطلوب', 'qualification', j.qualification || '', { placeholder: 'ثانوية عامة' }) +
        field('المصدر', 'source', j.source || '', { span2: true, placeholder: 'واتساب / LinkedIn / إعلان' }) +
        field('رابط الإعلان', 'url', j.url || '', { span2: true, dir: 'ltr', placeholder: 'https://' }) +
        field('تاريخ التقديم', 'appliedAt', j.appliedAt || '', { type: 'date' }) +
        field('اسم المسؤول', 'contactName', j.contactName || '') +
        field('رقم التواصل', 'contactPhone', j.contactPhone || '', { dir: 'ltr', placeholder: '+9665xxxxxxxx' }) +
        field('البريد الإلكتروني', 'contactEmail', j.contactEmail || '', { dir: 'ltr' }) +
        '<label class="field span2"><span>السيرة المرتبطة</span><select data-cjob="cvId">' + cvOpts + '</select></label>' +
        field('نص الوظيفة / الإعلان', 'jobText', j.jobText || '', { span2: true, textarea: true, rows: 5 }) +
        field('ملاحظات', 'notes', j.notes || '', { span2: true, textarea: true, rows: 3 }) +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn" type="button" data-career-close="1">إلغاء</button>' +
        '<button class="btn primary" type="button" data-career-save-job="' + (isEdit ? esc(j.id) : '') + '">حفظ</button>' +
      '</div></div></div>';
    $('#careerModalRoot').innerHTML = html;
    document.body.style.overflow = 'hidden';
    var title = $('#careerModalRoot [data-cjob="title"]');
    if (title) title.focus();
  }
  function closeJobModal() {
    $('#careerModalRoot').innerHTML = '';
    document.body.style.overflow = '';
  }
  function saveJobFromModal() {
    var root = $('#careerModalRoot');
    if (!root) return;
    function val(name) {
      var el = root.querySelector('[data-cjob="' + name + '"]');
      return el ? String(el.value || '').trim() : '';
    }
    var title = val('title');
    if (!title) { toast('اكتب مسمى الوظيفة أولًا.', true); return; }
    var id = root.querySelector('[data-career-save-job]').getAttribute('data-career-save-job');
    var job = id ? getJob(id) : null;
    var isNew = !job;
    if (isNew) {
      job = normalizeJob({ id: uid(), created: Date.now(), messages: {}, timeline: [] });
      state.jobs.unshift(job);
    }
    job.title = title;
    job.company = val('company');
    job.status = val('status') || 'ready';
    job.location = val('location');
    job.contract = val('contract');
    job.level = val('level');
    job.qualification = val('qualification');
    job.source = val('source');
    job.url = val('url');
    job.appliedAt = val('appliedAt');
    job.contactName = val('contactName');
    job.contactPhone = val('contactPhone');
    job.contactEmail = val('contactEmail');
    job.cvId = val('cvId');
    job.jobText = val('jobText');
    job.notes = val('notes');
    var cv = null;
    for (var i = 0; i < getCvs().length; i++) if (getCvs()[i].id === job.cvId) { cv = getCvs()[i]; break; }
    job.cvName = cv ? cv.name : (job.cvName || '');
    if (job.status === 'applied' && !job.appliedAt) job.appliedAt = todayISO();
    if (isNew && !job.timeline.length) {
      job.timeline.push({ date: todayISO(), type: 'note', text: 'تمت إضافة الوظيفة إلى مركز التقديم.', created: Date.now() });
    }
    job.updated = Date.now();
    save();
    closeJobModal();
    activeId = job.id;
    activeTab = 'overview';
    render();
    toast(isNew ? 'تمت إضافة الوظيفة.' : 'تم حفظ تعديلات الوظيفة.');
  }
  function confirmDeleteJob(job) {
    if (!job) return;
    var html = '<div class="modal-backdrop career-modal">' +
      '<div class="modal" role="dialog" aria-modal="true" style="width:min(500px,100%)">' +
      '<button class="btn ghost sm icon modal-close" type="button" data-career-close="1" aria-label="close">✕</button>' +
      '<h3>حذف الوظيفة</h3>' +
      '<p class="sub">سيتم حذف «' + esc(job.title || '') + '» وكل رسائلها وملاحظاتها من هذا المتصفح. هل تريد المتابعة؟</p>' +
      '<div class="modal-foot">' +
        '<button class="btn" type="button" data-career-close="1">تراجع</button>' +
        '<button class="btn primary" type="button" data-career-confirm-delete="' + esc(job.id) + '">نعم، احذف</button>' +
      '</div></div></div>';
    $('#careerModalRoot').innerHTML = html;
    document.body.style.overflow = 'hidden';
  }
  function deleteJob(id) {
    state.jobs = state.jobs.filter(function (j) { return j.id !== id; });
    if (activeId === id) activeId = state.jobs[0] ? state.jobs[0].id : null;
    save();
    closeJobModal();
    render();
    toast('تم حذف الوظيفة.');
  }

  /* ------------------------- events ------------------------- */
  function handleAction(action) {
    var job = activeJob();
    if (action === 'add-job') openJobModal();
    else if (action === 'edit-job') { if (job) openJobModal(job); }
    else if (action === 'delete-job') { if (job) confirmDeleteJob(job); }
    else if (action === 'open-cv') openCv();
    else if (action === 'copy-first') copyFirst();
    else if (action === 'export-jobs') exportJobs();
    else if (action === 'add-log') addLog();
    else if (action === 'home') { if (window.Sirati) Sirati.showView('home'); }
  }
  function bind() {
    var view = $('#view-career');
    if (!view) return;
    view.addEventListener('click', function (e) {
      var jobBtn = e.target.closest('[data-job-id]');
      if (jobBtn) {
        activeId = jobBtn.getAttribute('data-job-id');
        save();
        render();
        return;
      }
      var tab = e.target.closest('[data-career-tab]');
      if (tab) {
        activeTab = tab.getAttribute('data-career-tab');
        renderMain();
        return;
      }
      var filterBtn = e.target.closest('[data-career-filter]');
      if (filterBtn) {
        filter = filterBtn.getAttribute('data-career-filter');
        renderSidebar();
        return;
      }
      var act = e.target.closest('[data-career-act]');
      if (act) { handleAction(act.getAttribute('data-career-act')); return; }

      var copyMsg = e.target.closest('[data-copy-msg]');
      if (copyMsg) {
        var id = copyMsg.getAttribute('data-copy-msg');
        var ta = view.querySelector('[data-msg-input="' + id + '"]');
        if (ta) copyText(ta.value, 'تم نسخ الرسالة.');
        return;
      }
      var resetMsg = e.target.closest('[data-reset-msg]');
      if (resetMsg) {
        var job = activeJob();
        var rid = resetMsg.getAttribute('data-reset-msg');
        if (job && job.messages) { delete job.messages[rid]; job.updated = Date.now(); save(); renderMain(); toast('تمت استعادة القالب.'); }
        return;
      }
      var waMsg = e.target.closest('[data-wa-msg]');
      if (waMsg) { openWhatsApp(waMsg.getAttribute('data-wa-msg')); return; }

      var cat = e.target.closest('[data-phone-cat]');
      if (cat) {
        phoneCat = cat.getAttribute('data-phone-cat');
        $$('[data-phone-cat]', view).forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-phone-cat') === phoneCat);
        });
        renderPhoneList();
        return;
      }
      var copyIntro = e.target.closest('[data-copy-intro]');
      if (copyIntro) { copyText((DATA.interview || {}).intro || '', 'تم نسخ التعريف.'); return; }
      var copyAnswer = e.target.closest('[data-copy-answer]');
      if (copyAnswer) {
        var qi = Number(copyAnswer.getAttribute('data-copy-answer'));
        var q = ((DATA.interview || {}).questions || [])[qi];
        if (q) copyText(q.answer || '', 'تم نسخ الإجابة.');
        return;
      }
      var copySay = e.target.closest('[data-copy-say]');
      if (copySay) {
        var si = Number(copySay.getAttribute('data-copy-say'));
        var skill = (DATA.phoneSkills || [])[si];
        if (skill) copyText(skill.say || '', 'تم نسخ الجملة.');
        return;
      }
      var delLog = e.target.closest('[data-del-log]');
      if (delLog) {
        var j = activeJob();
        var idx = Number(delLog.getAttribute('data-del-log'));
        if (j && j.timeline && j.timeline[idx]) {
          j.timeline.splice(idx, 1);
          j.updated = Date.now();
          save();
          renderMain();
          toast('تم حذف المتابعة.');
        }
      }
    });

    view.addEventListener('input', function (e) {
      var msg = e.target.closest('[data-msg-input]');
      if (msg) {
        var job = activeJob();
        if (!job) return;
        job.messages = job.messages || {};
        job.messages[msg.getAttribute('data-msg-input')] = msg.value;
        job.updated = Date.now();
        autoGrow(msg);
        scheduleSave();
        return;
      }
      var notes = e.target.closest('[data-career-notes]');
      if (notes) {
        var j = activeJob();
        if (!j) return;
        j.notes = notes.value;
        j.updated = Date.now();
        scheduleSave();
        return;
      }
      if (e.target.id === 'careerSearch') {
        search = e.target.value;
        renderSidebar();
        return;
      }
      if (e.target.matches('[data-phone-search]')) {
        phoneQuery = e.target.value;
        renderPhoneList();
      }
    });

    view.addEventListener('change', function (e) {
      var status = e.target.closest('[data-career-status]');
      if (!status) return;
      var job = activeJob();
      if (!job) return;
      job.status = status.value;
      if (job.status === 'applied' && !job.appliedAt) job.appliedAt = todayISO();
      job.updated = Date.now();
      save();
      renderMain();
      renderSidebar();
      toast('تم تحديث حالة الوظيفة.');
    });

    var add = $('#careerAdd');
    if (add) add.addEventListener('click', function () { openJobModal(); });
    var exportBtn = $('#careerExport');
    if (exportBtn) exportBtn.addEventListener('click', exportJobs);
    var nav = $('#btnCareer');
    if (nav) nav.addEventListener('click', open);
    var strip = $('#careerStripBtn');
    if (strip) strip.addEventListener('click', open);

    var modalRoot = $('#careerModalRoot');
    if (modalRoot) {
      modalRoot.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-backdrop')) { closeJobModal(); return; }
        if (e.target.closest('[data-career-close]')) { closeJobModal(); return; }
        if (e.target.closest('[data-career-save-job]')) { saveJobFromModal(); return; }
        var del = e.target.closest('[data-career-confirm-delete]');
        if (del) deleteJob(del.getAttribute('data-career-confirm-delete'));
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('#careerModalRoot').innerHTML) closeJobModal();
    });
    window.addEventListener('resize', function () {
      if (activeTab === 'messages') autoGrowMessages();
    });
  }

  /* ------------------------- boot ------------------------- */
  window.Career = { render: render, open: open };
  function boot() {
    load();
    bind();
    render();
    if (window.Sirati && Sirati.refreshHome) Sirati.refreshHome();
    try {
      var params = new URLSearchParams(location.search);
      if (location.hash === '#career' || params.get('view') === 'career') {
        var tab = params.get('careerTab');
        if (tab) activeTab = tab;
        open();
      }
    } catch (e) { /* ignore deep-link errors */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
