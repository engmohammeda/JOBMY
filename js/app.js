/* =========================================================
   سيرتي — app.js
   واجهة التطبيق: القائمة، المحرّر، المعاينة الحيّة، والتصدير
   ========================================================= */
(function () {
  'use strict';

  var CV = window.CV;
  var Exporter = window.Exporter;
  var STORE = 'sirati.cv.v1';
  var PRESET_KEY = 'sirati.presets.v1';

  var LISTS = ['experience', 'education', 'skills', 'languages', 'projects', 'certifications'];
  var BLANKS = {
    experience: { role: '', company: '', start: '', end: '', current: false, description: '' },
    education: { degree: '', school: '', start: '', end: '', current: false, note: '' },
    skills: { name: '', level: 3, group: '' },
    languages: { name: '', level: 3, note: '' },
    projects: { name: '', link: '', description: '' },
    certifications: { name: '', issuer: '', year: '' }
  };

  var state = null;
  var currentId = null;
  var zoom = 1;
  var saveTimer = null;
  var previewTimer = null;
  var toastTimer = null;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function t(key) {
    var lang = state && state.ui ? state.ui.lang : 'ar';
    var dict = CV.I18N[lang] || CV.I18N.ar;
    var v = dict[key];
    if (v == null) v = CV.I18N.ar[key];
    return v == null ? key : v;
  }

  /* ------------------------- state ------------------------- */
  function normalizeCv(raw) {
    raw = raw || {};
    var base = CV.emptyCv({
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : null,
      template: raw.template,
      accent: raw.accent,
      lang: raw.lang
    });
    base.id = typeof raw.id === 'string' && raw.id ? raw.id : base.id;
    base.created = Number(raw.created) || Date.now();
    base.updated = Number(raw.updated) || Date.now();

    var p = raw.personal && typeof raw.personal === 'object' ? raw.personal : {};
    Object.keys(base.personal).forEach(function (k) {
      if (typeof p[k] === 'string') base.personal[k] = p[k];
      else if (k === 'photo' && typeof p[k] === 'string') base.personal[k] = p[k];
    });

    LISTS.forEach(function (key) {
      if (Array.isArray(raw[key])) {
        base[key] = raw[key].filter(function (x) { return x && typeof x === 'object'; })
          .map(function (x) {
            var o = {};
            Object.keys(x).forEach(function (k) { o[k] = x[k]; });
            return o;
          });
      }
    });

    if (!CV.TEMPLATES.some(function (tmpl) { return tmpl.id === base.template; })) base.template = 'modern';
    if (CV.ACCENTS.indexOf(base.accent) === -1 && !/^#[0-9a-f]{6}$/i.test(base.accent)) base.accent = CV.ACCENTS[0];
    base.accent2 = /^#[0-9a-f]{6}$/i.test(raw.accent2 || '') ? raw.accent2 : CV.themeFor(base.accent).b;
    base.lang = base.lang === 'en' ? 'en' : 'ar';

    var ex = raw.extra && typeof raw.extra === 'object' ? raw.extra : {};
    var def = base.extra;
    ['mini', 'english', 'intro', 'offerTitle', 'processTitle', 'gridTitle', 'readinessTitle', 'footerNote', 'whatsapp']
      .forEach(function (k) { if (typeof ex[k] === 'string') def[k] = ex[k]; });
    ['highlights', 'offerItems', 'process', 'grid', 'tools', 'readiness'].forEach(function (k) {
      if (!Array.isArray(ex[k])) return;
      def[k] = ex[k].filter(function (x) { return x != null; }).map(function (x) {
        return x && typeof x === 'object' ? JSON.parse(JSON.stringify(x)) : String(x);
      });
    });

    return base;
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.cvs)) {
          return {
            version: 1,
            ui: {
              lang: parsed.ui && parsed.ui.lang === 'en' ? 'en' : 'ar',
              theme: parsed.ui && parsed.ui.theme === 'dark' ? 'dark' : 'light'
            },
            cvs: parsed.cvs.map(normalizeCv)
          };
        }
      }
    } catch (e) { /* ignore corrupted storage */ }

    return {
      version: 1,
      ui: { lang: 'ar', theme: 'light' },
      cvs: CV.demoCvs().map(normalizeCv)
    };
  }

  function saveNow() {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
      return true;
    } catch (e) {
      toast(state.ui.lang === 'ar'
        ? 'تعذّر الحفظ: مساحة التخزين ممتلئة. جرّب تصدير نسخة احتياطية.'
        : 'Could not save: storage is full. Try exporting a backup.', true);
      return false;
    }
  }

  function getCurrent() {
    if (!currentId) return null;
    for (var i = 0; i < state.cvs.length; i++) {
      if (state.cvs[i].id === currentId) return state.cvs[i];
    }
    return null;
  }

  function setPath(obj, path, value) {
    var parts = String(path).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function getPath(obj, path) {
    return String(path).split('.').reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  /* ------------------- extra text fields ------------------- */
  function splitPipe(text) {
    return String(text || '').split(/\r?\n/).map(function (line) {
      return line.trim();
    }).filter(Boolean).map(function (line) {
      var i = line.indexOf('|');
      return i === -1
        ? { a: line, b: '' }
        : { a: line.slice(0, i).trim(), b: line.slice(i + 1).trim() };
    });
  }

  function splitLines(text) {
    return String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
  }

  function splitCommas(text) {
    return String(text || '').split(/[,،]/).map(function (l) { return l.trim(); }).filter(Boolean);
  }

  var EXTRA_TEXT = {
    'extra.highlightsText': {
      get: function (cv) {
        return (cv.extra.highlights || []).map(function (h) {
          if (!h || (!h.value && !h.label)) return '';
          return h.value && h.label ? h.value + ' | ' + h.label : (h.value || h.label);
        }).filter(Boolean).join('\n');
      },
      set: function (cv, v) {
        cv.extra.highlights = splitPipe(v).map(function (p) { return { value: p.a, label: p.b }; });
      }
    },
    'extra.offerItemsText': {
      get: function (cv) { return (cv.extra.offerItems || []).join('\n'); },
      set: function (cv, v) { cv.extra.offerItems = splitLines(v); }
    },
    'extra.processText': {
      get: function (cv) {
        return (cv.extra.process || []).map(function (s) {
          return s && s.title ? (s.title + (s.desc ? ' | ' + s.desc : '')) : '';
        }).filter(Boolean).join('\n');
      },
      set: function (cv, v) {
        cv.extra.process = splitPipe(v).map(function (p) { return { title: p.a, desc: p.b }; });
      }
    },
    'extra.gridText': {
      get: function (cv) {
        return (cv.extra.grid || []).map(function (s) {
          return s && s.title ? (s.title + (s.desc ? ' | ' + s.desc : '')) : '';
        }).filter(Boolean).join('\n');
      },
      set: function (cv, v) {
        cv.extra.grid = splitPipe(v).map(function (p) { return { title: p.a, desc: p.b }; });
      }
    },
    'extra.toolsText': {
      get: function (cv) { return (cv.extra.tools || []).join('، '); },
      set: function (cv, v) { cv.extra.tools = splitCommas(v); }
    },
    'extra.readinessText': {
      get: function (cv) { return (cv.extra.readiness || []).join('\n'); },
      set: function (cv, v) { cv.extra.readiness = splitLines(v); }
    }
  };

  /* ------------------------- theme & i18n ------------------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = $('#btnTheme');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.4A8.6 8.6 0 0 1 9.6 3.5 8.6 8.6 0 1 0 20.5 14.4z"/></svg>';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Light theme' : 'Dark theme');
    }
  }

  function applyI18n() {
    document.documentElement.lang = state.ui.lang;
    document.documentElement.dir = state.ui.lang === 'ar' ? 'rtl' : 'ltr';

    $$('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    $$('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });

    var langBtn = $('#btnUiLang');
    if (langBtn) langBtn.textContent = state.ui.lang === 'ar' ? 'EN' : 'ع';

    var nameInput = $('#cvName');
    if (nameInput) nameInput.setAttribute('placeholder', t('cvNamePh'));

    document.title = state.ui.lang === 'ar'
      ? 'سيرتي — منشئ السير الذاتية'
      : 'Sirati — CV Builder';
  }

  /* ------------------------- toast ------------------------- */
  function toast(msg, isErr) {
    var el = $('#toast');
    if (!el) return;
    el.hidden = false;
    el.className = 'toast' + (isErr ? ' err' : '');
    el.innerHTML = '<div></div>';
    el.firstChild.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3200);
  }

  /* ------------------------- views ------------------------- */
  function showView(view) {
    $('#view-home').hidden = view !== 'home';
    $('#view-editor').hidden = view !== 'editor';
    var careerView = $('#view-career');
    if (careerView) careerView.hidden = view !== 'career';

    var navHome = $('#navHome');
    var navEditor = $('#navEditor');
    var navCareer = $('#btnCareer');
    if (navHome) navHome.classList.toggle('on', view === 'home');
    if (navEditor) navEditor.classList.toggle('on', view === 'editor');
    if (navCareer) navCareer.classList.toggle('on', view === 'career');

    if (view === 'home') { window.scrollTo(0, 0); renderHome(); }
    if (view === 'editor') setTimeout(fitPreview, 0);
    if (view === 'career' && window.Career && window.Career.render) {
      window.Career.render();
    }
  }

  function fmtDate(ts) {
    try {
      return new Intl.DateTimeFormat(state.ui.lang === 'ar' ? 'ar-EG' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric'
      }).format(new Date(ts));
    } catch (e) {
      return new Date(ts).toLocaleDateString();
    }
  }

  function latestCv() {
    return state.cvs.slice().sort(function (a, b) {
      return (b.updated || b.created || 0) - (a.updated || a.created || 0);
    })[0] || null;
  }

  function careerJobs() {
    try {
      var parsed = JSON.parse(localStorage.getItem('sirati.career.v1') || '{}');
      return Array.isArray(parsed.jobs) ? parsed.jobs : [];
    } catch (e) { return []; }
  }

  function openLatest() {
    var cv = latestCv();
    if (cv) openEditor(cv.id);
    else newCvModal();
  }

  function cardHtml(cv) {
    return '<article class="cv-card" data-id="' + cv.id + '">' +
      '<div class="card-thumb" data-act="open" role="button" tabindex="0" aria-label="' + CV.esc(cv.name) + '">' +
        (CV.isAts(cv.template) ? '<span class="card-ats">' + CV.esc(t('atsBadge')) + '</span>' : '') +
        '<div class="thumb-inner">' + CV.renderCv(cv) + '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<h3 title="' + CV.esc(cv.name) + '">' + CV.esc(cv.name) + '</h3>' +
        '<div class="card-meta">' + CV.esc(CV.templateName(cv.template, state.ui.lang)) +
          ' · ' + fmtDate(cv.updated || cv.created || Date.now()) + '</div>' +
        '<div class="card-actions">' +
          '<button class="btn sm" type="button" data-act="open">' + t('edit') + '</button>' +
          '<button class="btn sm" type="button" data-act="dup">' + t('duplicate') + '</button>' +
          '<button class="btn sm danger" type="button" data-act="del" title="' + t('delete') + '">✕</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderHome() {
    var grid = $('#cvGrid');
    var cvs = state.cvs.slice().sort(function (a, b) {
      return (b.updated || b.created || 0) - (a.updated || a.created || 0);
    });
    var jobs = careerJobs();
    var atsCount = cvs.filter(function (cv) { return CV.isAts(cv.template); }).length;
    var latest = cvs[0] || null;

    var count = $('#cvCount');
    if (count) count.textContent = cvs.length ? '· ' + cvs.length : '';

    var statCvs = $('#statCvs');
    var statAts = $('#statAts');
    var statJobs = $('#statJobs');
    if (statCvs) statCvs.textContent = cvs.length;
    if (statAts) statAts.textContent = atsCount;
    if (statJobs) statJobs.textContent = jobs.length;

    var heroNext = $('#heroNext');
    if (heroNext) {
      if (!cvs.length) heroNext.textContent = t('heroNextEmpty');
      else if (jobs.length) heroNext.textContent = t('heroNextJobs').replace('{n}', jobs.length);
      else heroNext.textContent = t('heroNextReady');
    }
    var heroLastTitle = $('#heroLastTitle');
    if (heroLastTitle) heroLastTitle.textContent = latest ? latest.name : '—';

    if (!cvs.length) {
      grid.innerHTML = '<div class="empty">' +
        '<h3>' + t('emptyTitle') + '</h3>' +
        '<p>' + t('emptyText') + '</p>' +
        '<button class="btn primary" type="button" data-act="new">＋ ' + t('newCv') + '</button>' +
        '</div>';
      return;
    }
    grid.innerHTML = cvs.map(cardHtml).join('');
  }

  function openEditor(id) {
    if (!id) return;
    currentId = id;
    zoom = 1;
    showView('editor');
    fillEditor();
  }

  function fillEditor() {
    var cv = getCurrent();
    if (!cv) return;

    $('#cvName').value = cv.name || '';
    $('#saveState').textContent = t('saved');

    $$('#cvLangSeg button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-cvlang') === cv.lang);
    });

    renderTemplateSelect();
    renderSwatches();

    $$('#formPane [data-field]').forEach(function (el) {
      var path = el.getAttribute('data-field');
      if (EXTRA_TEXT[path]) { el.value = EXTRA_TEXT[path].get(cv); return; }
      var v = getPath(cv, path);
      el.value = v == null ? '' : v;
    });

    renderLists();
    updatePhotoBox();
    renderPreview();
  }

  function renderTemplateSelect() {
    var cv = getCurrent();
    var sel = $('#tplSelect');
    if (!cv || !sel) return;
    function option(tmpl) {
      return '<option value="' + tmpl.id + '">' + CV.esc(tmpl.name[state.ui.lang] || tmpl.name.ar) + '</option>';
    }
    var ats = CV.TEMPLATES.filter(function (x) { return x.ats; });
    var visual = CV.TEMPLATES.filter(function (x) { return !x.ats; });
    sel.innerHTML =
      '<optgroup label="' + CV.esc(t('atsGroup')) + '">' + ats.map(option).join('') + '</optgroup>' +
      '<optgroup label="' + CV.esc(t('visualGroup')) + '">' + visual.map(option).join('') + '</optgroup>';
    sel.value = cv.template;
    sel.setAttribute('aria-label', t('templateLabel'));
  }

  function themeSwatch(th, pressed, attr, i) {
    var a = attr || 'accent';
    return '<button class="sw theme-sw" type="button" data-' + a + '="' + th.a + '" data-' + a + '2="' + th.b + '"' +
      ' style="--sw-a:' + th.a + ';--sw-b:' + th.b + '" aria-pressed="' + (pressed ? 'true' : 'false') + '"' +
      ' title="' + CV.esc(th.name[state.ui.lang] || th.name.ar) + '"><i></i></button>';
  }

  function renderSwatches() {
    var cv = getCurrent();
    var host = $('#swatches');
    if (!cv || !host) return;
    host.innerHTML = CV.THEMES.map(function (th, i) {
      return themeSwatch(th, th.a === cv.accent, 'accent', i);
    }).join('');
  }

  /* ------------------------- form lists ------------------------- */
  function fieldHtml(label, path, value, opts) {
    opts = opts || {};
    var attrs = ' data-field="' + path + '"' + (opts.dir ? ' dir="' + opts.dir + '"' : '') +
      (opts.disabled ? ' disabled' : '') +
      (opts.placeholder ? ' placeholder="' + CV.esc(opts.placeholder) + '"' : '');
    var control = opts.textarea
      ? '<textarea rows="' + (opts.rows || 3) + '"' + attrs + '>' + CV.esc(value == null ? '' : value) + '</textarea>'
      : '<input type="text"' + attrs + ' value="' + CV.esc(value == null ? '' : value) + '">';
    return '<label class="field' + (opts.span2 ? ' span2' : '') + '"><span>' + CV.esc(label) + '</span>' +
      control + (opts.hint ? '<span class="hint">' + CV.esc(opts.hint) + '</span>' : '') + '</label>';
  }

  function selectHtml(label, path, value, words, span2) {
    var v = Number(value) || 1;
    var opts = words.map(function (w, idx) {
      return '<option value="' + (idx + 1) + '"' + (v === idx + 1 ? ' selected' : '') + '>' + CV.esc(w) + '</option>';
    }).join('');
    return '<label class="field' + (span2 ? ' span2' : '') + '"><span>' + CV.esc(label) + '</span>' +
      '<select data-field="' + path + '">' + opts + '</select></label>';
  }

  function itemShell(type, index, title, inner) {
    return '<div class="item-card">' +
      '<div class="item-top">' +
        '<strong>' + CV.esc(title) + '</strong>' +
        '<button class="mini" type="button" data-move="up" data-list="' + type + '" data-index="' + index + '" title="' + t('moveUp') + '">↑</button>' +
        '<button class="mini" type="button" data-move="down" data-list="' + type + '" data-index="' + index + '" title="' + t('moveDown') + '">↓</button>' +
        '<button class="mini del" type="button" data-del="' + type + '" data-index="' + index + '" title="' + t('remove') + '">✕</button>' +
      '</div>' + inner + '</div>';
  }

  function itemHtml(type, it, i) {
    var p = type + '.' + i + '.';

    if (type === 'experience') {
      return itemShell(type, i, it.role || (t('itemExp') + ' ' + (i + 1)),
        '<div class="grid2">' +
          fieldHtml(t('fRole'), p + 'role', it.role, { span2: true }) +
          fieldHtml(t('fCompany'), p + 'company', it.company, { span2: true }) +
          fieldHtml(t('fStart'), p + 'start', it.start, { placeholder: '2021' }) +
          fieldHtml(t('fEnd'), p + 'end', it.end, { placeholder: '2024', disabled: !!it.current }) +
          '<label class="check span2"><input type="checkbox" data-toggle-path="' + (p + 'current') + '"' +
            (it.current ? ' checked' : '') + '><span>' + t('fCurrent') + '</span></label>' +
          fieldHtml(t('fDesc'), p + 'description', it.description,
            { span2: true, textarea: true, rows: 4, hint: t('fDescHint') }) +
        '</div>');
    }

    if (type === 'education') {
      return itemShell(type, i, it.degree || (t('itemEdu') + ' ' + (i + 1)),
        '<div class="grid2">' +
          fieldHtml(t('fDegree'), p + 'degree', it.degree, { span2: true }) +
          fieldHtml(t('fSchool'), p + 'school', it.school, { span2: true }) +
          fieldHtml(t('fStart'), p + 'start', it.start, { placeholder: '2014' }) +
          fieldHtml(t('fEnd'), p + 'end', it.end, { placeholder: '2018', disabled: !!it.current }) +
          '<label class="check span2"><input type="checkbox" data-toggle-path="' + (p + 'current') + '"' +
            (it.current ? ' checked' : '') + '><span>' + t('fCurrent') + '</span></label>' +
          fieldHtml(t('fNote'), p + 'note', it.note, { span2: true, textarea: true, rows: 2 }) +
        '</div>');
    }

    if (type === 'skills') {
      return itemShell(type, i, it.name || (t('itemSkill') + ' ' + (i + 1)),
        '<div class="grid2">' +
          fieldHtml(t('fSkill'), p + 'name', it.name) +
          selectHtml(t('fLevel'), p + 'level', it.level, CV.LEVELS[getCurrent().lang] || CV.LEVELS.ar) +
          fieldHtml(t('fSkillGroup'), p + 'group', it.group, { span2: true, hint: t('fSkillGroupHint') }) +
        '</div>');
    }

    if (type === 'languages') {
      return itemShell(type, i, it.name || (t('itemLang') + ' ' + (i + 1)),
        '<div class="grid2">' +
          fieldHtml(t('fLangName'), p + 'name', it.name) +
          selectHtml(t('fLevel'), p + 'level', it.level, CV.LANG_LEVELS[getCurrent().lang] || CV.LANG_LEVELS.ar) +
          fieldHtml(t('fLangNote'), p + 'note', it.note, { span2: true }) +
        '</div>');
    }

    if (type === 'projects') {
      return itemShell(type, i, it.name || (t('itemProj') + ' ' + (i + 1)),
        '<div class="grid2">' +
          fieldHtml(t('fProjName'), p + 'name', it.name, { span2: true }) +
          fieldHtml(t('fLink'), p + 'link', it.link, { span2: true, dir: 'ltr', placeholder: 'https://' }) +
          fieldHtml(t('fDesc'), p + 'description', it.description, { span2: true, textarea: true, rows: 3 }) +
        '</div>');
    }

    return itemShell(type, i, it.name || (t('itemCert') + ' ' + (i + 1)),
      '<div class="grid2">' +
        fieldHtml(t('fCertName'), p + 'name', it.name, { span2: true }) +
        fieldHtml(t('fIssuer'), p + 'issuer', it.issuer) +
        fieldHtml(t('fYear'), p + 'year', it.year, { placeholder: '2023' }) +
      '</div>');
  }

  function renderLists() {
    var cv = getCurrent();
    if (!cv) return;
    LISTS.forEach(function (key) {
      var host = document.getElementById('list-' + key);
      if (!host) return;
      var arr = cv[key] || [];
      host.innerHTML = arr.map(function (it, i) { return itemHtml(key, it, i); }).join('');
      var badge = document.getElementById('badge' + key.charAt(0).toUpperCase() + key.slice(1));
      if (badge) badge.textContent = arr.length;
    });
  }

  /* ------------------------- preview ------------------------- */
  function atsCheck(cv) {
    var p = cv.personal || {};
    var issues = [];
    var score = 0;
    function check(points, ok, key) {
      if (ok) score += points;
      else issues.push(t(key));
    }
    check(30, CV.isAts(cv.template), 'atsIssueTemplate');
    check(10, !p.photo || CV.isAts(cv.template), 'atsIssuePhoto');
    check(15, !!(p.email && p.phone), 'atsIssueContact');
    check(5, !!p.jobTitle, 'atsIssueTitle');
    check(5, !!p.city, 'atsIssueCity');
    check(10, String(p.summary || '').trim().length >= 60, 'atsIssueSummary');
    check(15, (cv.experience || []).some(function (x) {
      return x && (x.role || x.company) && String(x.description || '').trim().length >= 20;
    }), 'atsIssueExp');
    check(5, (cv.skills || []).filter(function (s) { return s && s.name; }).length >= 5, 'atsIssueSkills');
    check(5, (cv.education || []).some(function (x) { return x && (x.degree || x.school); }), 'atsIssueEdu');
    return { score: score, issues: issues };
  }

  function renderAtsBar(cv) {
    var bar = $('#atsBar');
    if (!bar) return;
    var res = atsCheck(cv);
    var score = res.score;
    bar.className = 'ats-bar ' + (score >= 85 ? 'good' : score >= 60 ? 'warn' : 'bad');
    $('#atsScore').textContent = score;
    $('#atsTitle').textContent = t('atsTitle');
    $('#atsMsg').textContent = !CV.isAts(cv.template)
      ? t('atsVisualWarn')
      : (score >= 85 ? t('atsExcellent') : score >= 60 ? t('atsGood') : t('atsPoor'));
    $('#atsIssues').innerHTML = res.issues.length
      ? res.issues.slice(0, 4).map(function (x) {
          return '<span class="ats-issue">' + CV.esc(x) + '</span>';
        }).join('')
      : '<span class="ats-issue ok">' + CV.esc(t('atsAllGood')) + '</span>';
    var btn = $('#btnAtsFix');
    if (btn) btn.hidden = CV.isAts(cv.template);
  }

  function renderPreview() {
    var cv = getCurrent();
    if (!cv) return;
    var holder = $('#cvHolder');
    holder.innerHTML = CV.renderCv(cv);
    fitPreview();
    renderAtsBar(cv);
    updatePageFit();
  }

  /* مؤشر «صفحة واحدة A4»: يقيس ارتفاع الورقة الفعلي ويخبرك إن تجاوزت الصفحة */
  function updatePageFit() {
    var chip = $('#pageFit');
    var page = $('#cvHolder .cv-page');
    if (!chip || !page) return;
    var probe = page.cloneNode(true);
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.insetInlineStart = '-9999px';
    probe.style.top = '0';
    probe.style.transform = 'none';
    probe.style.minHeight = '0';
    hover_append(probe);
    var mm = probe.getBoundingClientRect().height / (96 / 25.4);
    probe.remove();

    var one = mm <= 298.5;
    chip.hidden = false;
    chip.className = 'page-fit ' + (one ? 'ok' : 'over');
    var lang = state.ui.lang;
    chip.textContent = one
      ? (lang === 'ar' ? 'صفحة واحدة A4' : 'Fits one A4 page')
      : (lang === 'ar'
        ? 'تتجاوز A4 بـ ' + Math.round(mm - 297) + ' مم — قلّل المحتوى'
        : 'Overflows A4 by ' + Math.round(mm - 297) + 'mm');
    chip.title = lang === 'ar'
      ? 'ارتفاع المحتوى: ' + mm.toFixed(0) + ' مم من 297 مم'
      : 'Content height: ' + mm.toFixed(0) + 'mm of 297mm';
  }

  function hover_append(el) {
    document.body.appendChild(el);
  }

  function fitPreview() {
    var page = $('#cvHolder .cv-page');
    if (!page) return;
    var scroll = $('#previewScroll');
    var scaler = $('#previewScaler');
    var holder = $('#cvHolder');

    holder.style.transform = 'none';
    holder.style.width = 'auto';
    var w = page.offsetWidth || 794;
    var h = page.offsetHeight || 1123;
    var avail = scroll.clientWidth - 48;
    if (avail < 220) avail = 220;

    var base = Math.min(1, avail / w);
    var s = Math.max(0.25, Math.min(2.5, base * zoom));

    holder.style.width = w + 'px';
    holder.style.transform = 'scale(' + s + ')';
    scaler.style.width = Math.round(w * s) + 'px';
    scaler.style.height = Math.round(h * s) + 'px';

    var zv = $('#zoomVal');
    if (zv) zv.textContent = Math.round(s * 100) + '%';
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 90);
  }

  function markDirty() {
    var cv = getCurrent();
    if (!cv) return;
    cv.updated = Date.now();
    var st = $('#saveState');
    if (st) st.textContent = t('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveNow();
      var el = $('#saveState');
      if (el) el.textContent = t('saved');
    }, 400);
  }

  function updatePhotoBox() {
    var cv = getCurrent();
    var box = $('#photoPrev');
    if (!cv || !box) return;
    if (cv.personal.photo) {
      box.innerHTML = '<img src="' + cv.personal.photo + '" alt="">';
    } else {
      box.innerHTML = '<span></span>';
      box.firstChild.textContent = t('noPhoto');
    }
  }

  /* ------------------------- modals ------------------------- */
  function openModal(html) {
    var root = $('#modalRoot');
    root.innerHTML = '<div class="modal-backdrop" data-close="1">' +
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<button class="btn ghost sm icon modal-close" type="button" data-close="1" aria-label="close">✕</button>' +
      html + '</div></div>';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('#modalRoot').innerHTML = '';
    document.body.style.overflow = '';
  }

  function newCvModal() {
    var uiLang = state.ui.lang;
    var sample = CV.demoCvs();
    var sampleCv = uiLang === 'ar' ? sample[0] : sample[1];

    var tplCards = CV.TEMPLATES.map(function (tmpl, idx) {
      return '<label class="tpl-pick">' +
        '<input type="radio" name="tpl" value="' + tmpl.id + '"' + (idx === 0 ? ' checked' : '') + '>' +
        (tmpl.ats ? '<span class="tpl-badge">' + CV.esc(t('atsBadge')) + '</span>' : '') +
        '<div class="pv"><div>' + CV.renderCv(sampleCv, tmpl.id) + '</div></div>' +
        '<b>' + CV.esc(tmpl.name[uiLang] || tmpl.name.ar) + '</b>' +
        '<small>' + CV.esc(tmpl.desc[uiLang] || tmpl.desc.ar) + '</small>' +
        '</label>';
    }).join('');

    var swatches = CV.THEMES.map(function (th, i) {
      return themeSwatch(th, i === 0, 'modal-accent', i);
    }).join('');

    openModal(
      '<h3>' + t('newCvTitle') + '</h3>' +
      '<p class="sub">' + t('newCvSub') + '</p>' +
      '<label class="field"><span>' + t('cvName') + '</span>' +
        '<input type="text" id="mName" maxlength="60" placeholder="' +
        CV.esc(uiLang === 'ar' ? 'مثال: سيرة مهندس برمجيات' : 'e.g. Software Engineer CV') + '"></label>' +
      '<div class="field"><span>' + t('chooseTemplate') + '</span></div>' +
      '<div class="tpl-grid" id="mTemplates">' + tplCards + '</div>' +
      '<div class="grid2">' +
        '<label class="field"><span>' + t('cvLanguage') + '</span><select id="mLang">' +
          '<option value="ar" selected>' + t('arabic') + '</option>' +
          '<option value="en">' + t('english') + '</option></select></label>' +
        '<div class="field"><span>' + t('accent') + '</span>' +
          '<div class="swatches" id="mSwatches">' + swatches + '</div>' +
          '<input type="hidden" id="mAccent" value="' + CV.THEMES[0].a + '">' +
          '<input type="hidden" id="mAccent2" value="' + CV.THEMES[0].b + '"></div>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn" type="button" data-close="1">' + t('cancel') + '</button>' +
        '<button class="btn primary" type="button" data-create="1">' + t('create') + '</button>' +
      '</div>'
    );

    var nameEl = $('#mName');
    if (nameEl) nameEl.focus();
  }

  function confirmDelete(id) {
    var cv = state.cvs.filter(function (c) { return c.id === id; })[0];
    openModal(
      '<h3>' + t('delete') + '</h3>' +
      '<p class="sub">' + CV.esc(cv ? cv.name : '') + ' — ' + t('deleteConfirm') + '</p>' +
      '<div class="modal-foot">' +
        '<button class="btn" type="button" data-close="1">' + t('deleteNo') + '</button>' +
        '<button class="btn primary" type="button" data-delete-cv="' + id + '">' + t('deleteYes') + '</button>' +
      '</div>'
    );
  }

  /* ------------------------- exports ------------------------- */
  function printCv() {
    var page = $('#cvHolder .cv-page');
    if (!page) return;
    var area = $('#print-area');
    area.innerHTML = '';
    var clone = page.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.margin = '0';
    area.appendChild(clone);

    function cleanup() {
      setTimeout(function () { area.innerHTML = ''; }, 400);
    }
    window.addEventListener('afterprint', cleanup, { once: true });

    setTimeout(function () {
      try { window.print(); } catch (e) { toast(t('pngFailed'), true); }
      setTimeout(function () { area.innerHTML = ''; }, 60000);
    }, 180);
  }

  function doExport(kind) {
    var cv = getCurrent();
    if (!cv) return;
    closeExportMenu();

    if (kind === 'pdf') { printCv(); return; }
    if (kind === 'docx') { Exporter.docx(cv); toast(t('exported')); return; }
    if (kind === 'html') { Exporter.html(cv); toast(t('exported')); return; }
    if (kind === 'txt') { Exporter.txt(cv); toast(t('exported')); return; }
    if (kind === 'json') { Exporter.jsonBackup(state.cvs); toast(t('backupDone')); return; }
    if (kind === 'png') {
      var page = $('#cvHolder .cv-page');
      if (!page) return;
      Exporter.png(page, cv).then(function () {
        toast(t('exported'));
      }).catch(function () {
        toast(t('pngFailed'), true);
      });
    }
  }

  function toggleExportMenu(force) {
    var menu = $('#exportMenu');
    var open = typeof force === 'boolean' ? force : menu.hidden;
    menu.hidden = !open;
  }
  function closeExportMenu() { toggleExportMenu(false); }

  /* ------------------------- public hooks ------------------------- */
  /* تُستخدم من وحدات مستقلة (مثل match.js) دون كسر نطاق التطبيق */
  window.SIRATI_APP = {
    getCurrent: function () { return getCurrent(); },
    openModal: function (html) { openModal(html); },
    closeModal: function () { closeModal(); },
    toast: function (msg, isErr) { toast(msg, isErr); },
    save: function () { saveNow(); },
    t: function (k) { return t(k); }
  };

  /* ------------------------- photo ------------------------- */
  function pickPhoto() { $('#photoInput').click(); }

  function handlePhotoFile(file) {
    var cv = getCurrent();
    if (!cv || !file || !/^image\//.test(file.type)) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 480;
        var ratio = Math.min(1, max / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * ratio));
        var h = Math.max(1, Math.round(img.height * ratio));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try {
          cv.personal.photo = canvas.toDataURL('image/jpeg', 0.86);
        } catch (e) {
          cv.personal.photo = reader.result;
        }
        markDirty();
        updatePhotoBox();
        schedulePreview();
      };
      img.onerror = function () { toast(t('importFailed'), true); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ------------------------- global bindings ------------------------- */
  function bind() {
    $('#brandLink').addEventListener('click', function (e) {
      e.preventDefault();
      if (state.cvs.length) renderHome();
      showView('home');
    });

    $('#btnUiLang').addEventListener('click', function () {
      state.ui.lang = state.ui.lang === 'ar' ? 'en' : 'ar';
      saveNow();
      applyI18n();
      renderHome();
      if (!$('#view-editor').hidden) fillEditor();
    });

    $('#btnTheme').addEventListener('click', function () {
      state.ui.theme = state.ui.theme === 'dark' ? 'light' : 'dark';
      applyTheme(state.ui.theme);
      saveNow();
    });

    var navHome = $('#navHome');
    if (navHome) navHome.addEventListener('click', function () {
      saveNow();
      renderHome();
      showView('home');
    });
    var navEditor = $('#navEditor');
    if (navEditor) navEditor.addEventListener('click', function () {
      saveNow();
      openLatest();
    });
    var btnNewTop = $('#btnNewTop');
    if (btnNewTop) btnNewTop.addEventListener('click', newCvModal);
    var btnResume = $('#btnResume');
    if (btnResume) btnResume.addEventListener('click', openLatest);
    var btnOpenEditor = $('#btnOpenEditor');
    if (btnOpenEditor) btnOpenEditor.addEventListener('click', openLatest);
    var btnNewLib = $('#btnNewLib');
    if (btnNewLib) btnNewLib.addEventListener('click', newCvModal);

    $('#btnNew').addEventListener('click', newCvModal);
    $('#btnImport').addEventListener('click', function () { $('#jsonInput').click(); });
    $('#btnBackup').addEventListener('click', function () {
      Exporter.jsonBackup(state.cvs);
      toast(t('backupDone'));
    });

    $('#cvGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'new') { newCvModal(); return; }
      var card = btn.closest('[data-id]');
      if (!card) return;
      var id = card.getAttribute('data-id');
      if (act === 'open') openEditor(id);
      if (act === 'dup') duplicateCv(id);
      if (act === 'del') confirmDelete(id);
    });

    $('#cvGrid').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var thumb = e.target.closest('.card-thumb');
      if (!thumb) return;
      e.preventDefault();
      var card = thumb.closest('[data-id]');
      if (card) openEditor(card.getAttribute('data-id'));
    });

    $('#btnBack').addEventListener('click', function () {
      saveNow();
      currentId = null;
      renderHome();
      showView('home');
    });

    $('#cvName').addEventListener('input', function (e) {
      var cv = getCurrent();
      if (!cv) return;
      cv.name = e.target.value;
      markDirty();
    });

    $('#cvLangSeg').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cvlang]');
      if (!btn) return;
      var cv = getCurrent();
      if (!cv) return;
      cv.lang = btn.getAttribute('data-cvlang');
      $$('#cvLangSeg button').forEach(function (b) {
        b.classList.toggle('on', b === btn);
      });
      markDirty();
      renderLists();
      renderPreview();
    });

    $('#tplSelect').addEventListener('change', function (e) {
      var cv = getCurrent();
      if (!cv) return;
      cv.template = e.target.value;
      markDirty();
      renderPreview();
    });

    var matchBtn = $('#btnMatch');
    if (matchBtn) matchBtn.addEventListener('click', function () {
      if (window.CV_MATCH) CV_MATCH.open();
    });

    var atsFix = $('#btnAtsFix');
    if (atsFix) atsFix.addEventListener('click', function () {
      var cv = getCurrent();
      if (!cv || CV.isAts(cv.template)) return;
      cv.template = 'ats';
      renderTemplateSelect();
      renderPreview();
      markDirty();
      toast(t('atsConverted'));
    });

    $('#swatches').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-accent]');
      if (!btn) return;
      var cv = getCurrent();
      if (!cv) return;
      cv.accent = btn.getAttribute('data-accent');
      cv.accent2 = btn.getAttribute('data-accent2') || cv.accent2;
      renderSwatches();
      markDirty();
      renderPreview();
    });

    $('#btnExport').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleExportMenu();
    });

    $('#exportMenu').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-export]');
      if (!btn) return;
      doExport(btn.getAttribute('data-export'));
    });

    $('#btnDeleteCv').addEventListener('click', function () {
      if (currentId) confirmDelete(currentId);
    });

    $('#zoomIn').addEventListener('click', function () {
      zoom = Math.min(2.5, zoom + 0.1);
      fitPreview();
    });
    $('#zoomOut').addEventListener('click', function () {
      zoom = Math.max(0.4, zoom - 0.1);
      fitPreview();
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.menu-wrap')) closeExportMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if ($('#modalRoot').innerHTML) closeModal();
        closeExportMenu();
      }
    });

    /* form inputs */
    var pane = $('#formPane');
    var handler = function (e) {
      var el = e.target;
      var path = el.getAttribute('data-field');
      if (path) {
        var cv = getCurrent();
        if (!cv) return;
        var val = el.value;
        if (EXTRA_TEXT[path]) {
          EXTRA_TEXT[path].set(cv, val);
          markDirty();
          schedulePreview();
          return;
        }
        if (String(getPath(cv, path)) === String(val)) return;
        setPath(cv, path, val);
        markDirty();
        schedulePreview();
      }
      var toggle = el.getAttribute('data-toggle-path');
      if (toggle) {
        var cv2 = getCurrent();
        if (!cv2) return;
        setPath(cv2, toggle, !!el.checked);
        markDirty();
        renderLists();
        schedulePreview();
      }
    };
    pane.addEventListener('input', handler);
    pane.addEventListener('change', handler);

    pane.addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]');
      if (act && act.getAttribute('data-act') === 'pickPhoto') { pickPhoto(); return; }
      if (act && act.getAttribute('data-act') === 'clearPhoto') {
        var cv = getCurrent();
        if (!cv) return;
        cv.personal.photo = '';
        markDirty();
        updatePhotoBox();
        schedulePreview();
        return;
      }

      var add = e.target.closest('[data-add]');
      if (add) {
        addItem(add.getAttribute('data-add'));
        return;
      }

      var del = e.target.closest('[data-del]');
      if (del) {
        var cv2 = getCurrent();
        if (!cv2) return;
        var list = del.getAttribute('data-del');
        var idx = Number(del.getAttribute('data-index'));
        cv2[list].splice(idx, 1);
        markDirty();
        renderLists();
        schedulePreview();
        return;
      }

      var mv = e.target.closest('[data-move]');
      if (mv) {
        var cv3 = getCurrent();
        if (!cv3) return;
        var l = mv.getAttribute('data-list');
        var i = Number(mv.getAttribute('data-index'));
        var dir = mv.getAttribute('data-move') === 'up' ? -1 : 1;
        var j = i + dir;
        if (j < 0 || j >= cv3[l].length) return;
        var tmp = cv3[l][i];
        cv3[l][i] = cv3[l][j];
        cv3[l][j] = tmp;
        markDirty();
        renderLists();
        schedulePreview();
      }
    });

    $('#photoInput').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      handlePhotoFile(file);
      e.target.value = '';
    });

    $('#jsonInput').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) importFile(file);
      e.target.value = '';
    });

    $('#modalRoot').addEventListener('click', function (e) {
      /* إغلاق فقط عند النقر على الخلفية نفسها أو على زر إغلاق —
         سابقًا كانت أي نقرة داخل النافذة تُغلقها قبل تنفيذ الإجراء. */
      var closeEl = e.target.closest('[data-close]');
      if (closeEl && (closeEl === e.target || closeEl.tagName === 'BUTTON')) {
        closeModal();
        return;
      }

      var sw = e.target.closest('[data-modal-accent]');
      if (sw) {
        $$('#mSwatches [data-modal-accent]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        sw.setAttribute('aria-pressed', 'true');
        $('#mAccent').value = sw.getAttribute('data-modal-accent');
        $('#mAccent2').value = sw.getAttribute('data-modal-accent2') || CV.THEMES[0].b;
        return;
      }

      var create = e.target.closest('[data-create]');
      if (create) { createFromModal(); return; }

      var del = e.target.closest('[data-delete-cv]');
      if (del) {
        var id = del.getAttribute('data-delete-cv');
        state.cvs = state.cvs.filter(function (c) { return c.id !== id; });
        if (currentId === id) currentId = null;
        saveNow();
        closeModal();
        renderHome();
        showView('home');
      }
    });

    window.addEventListener('resize', function () {
      if (!$('#view-editor').hidden) fitPreview();
    });

    window.addEventListener('beforeunload', function () {
      if (state) saveNow();
    });
  }

  function addItem(type) {
    var cv = getCurrent();
    if (!cv || !BLANKS[type]) return;
    var blank = JSON.parse(JSON.stringify(BLANKS[type]));
    cv[type].push(blank);
    markDirty();
    renderLists();
    schedulePreview();
    var host = document.getElementById('list-' + type);
    if (host) {
      var cards = host.querySelectorAll('.item-card');
      var last = cards[cards.length - 1];
      if (last) {
        var input = last.querySelector('input, textarea');
        if (input) input.focus();
      }
    }
  }

  function duplicateCv(id) {
    var src = state.cvs.filter(function (c) { return c.id === id; })[0];
    if (!src) return;
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = CV.uid();
    copy.name = src.name + (state.ui.lang === 'ar' ? ' — نسخة' : ' — copy');
    copy.created = Date.now();
    copy.updated = Date.now();
    state.cvs.push(normalizeCv(copy));
    saveNow();
    renderHome();
    toast(state.ui.lang === 'ar' ? 'تم إنشاء نسخة.' : 'Copy created.');
  }

  function createFromModal() {
    var modal = $('#modalRoot .modal');
    if (!modal) return;
    var lang = $('#mLang') ? $('#mLang').value : state.ui.lang;
    var tplEl = modal.querySelector('input[name="tpl"]:checked');
    var nameEl = $('#mName');
    var name = nameEl && nameEl.value.trim();
    if (!name) name = lang === 'ar' ? 'سيرة ذاتية جديدة' : 'New CV';

    var cv = CV.emptyCv({
      name: name,
      template: tplEl ? tplEl.value : 'modern',
      accent: $('#mAccent') ? $('#mAccent').value : CV.ACCENTS[0],
      accent2: $('#mAccent2') ? $('#mAccent2').value : CV.THEMES[0].b,
      lang: lang
    });
    state.cvs.push(cv);
    saveNow();
    closeModal();
    renderHome();
    openEditor(cv.id);
  }

  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var list = Array.isArray(data) ? data : (data && Array.isArray(data.cvs) ? data.cvs : null);
        if (!list || !list.length) throw new Error('invalid');
        var added = 0;
        list.forEach(function (raw) {
          if (!raw || typeof raw !== 'object') return;
          var cv = normalizeCv(raw);
          cv.id = CV.uid();
          cv.created = Number(raw.created) || Date.now();
          cv.updated = Date.now();
          state.cvs.push(cv);
          added++;
        });
        if (!added) throw new Error('empty');
        saveNow();
        renderHome();
        showView('home');
        toast(t('imported'));
      } catch (e) {
        toast(t('importFailed'), true);
      }
    };
    reader.readAsText(file);
  }

  /* ------------------- preset CVs (once) ------------------- */
  function importPresets() {
    try {
      if (localStorage.getItem(PRESET_KEY)) return;
      var list = window.CV_PRESETS;
      if (Array.isArray(list) && list.length) {
        var added = 0;
        list.forEach(function (raw) {
          var cv = normalizeCv(raw);
          var exists = state.cvs.some(function (c) {
            return c.name === cv.name && c.personal.fullName === cv.personal.fullName;
          });
          if (!exists) { state.cvs.push(cv); added++; }
        });
        if (added) saveNow();
      }
      localStorage.setItem(PRESET_KEY, '1');
    } catch (e) { /* ignore */ }
  }

  /* ------------------------- public API ------------------------- */
  window.Sirati = {
    showView: showView,
    toast: toast,
    getCvs: function () { return state && state.cvs ? state.cvs.slice() : []; },
    openCv: openEditor,
    getLang: function () { return state && state.ui ? state.ui.lang : 'ar'; },
    refreshHome: renderHome
  };

  /* ------------------------- boot ------------------------- */
  function boot() {
    state = loadState();
    importPresets();
    applyTheme(state.ui.theme);
    applyI18n();
    renderHome();
    bind();
    showView('home');
    saveNow();

    try {
      var params = new URLSearchParams(location.search);
      if (params.get('view') === 'editor') {
        var key = params.get('cv');
        var cv = null;
        if (key) {
          if (/^\d+$/.test(key)) cv = state.cvs[Number(key)] || null;
          else cv = state.cvs.filter(function (c) { return c.id === key; })[0] || null;
        }
        if (!cv) cv = latestCv();
        if (cv) openEditor(cv.id);
      }
    } catch (e) { /* ignore deep-link errors */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
