/* =========================================================
   سيرتي — data.js
   الترجمات، القوالب، ومولّد معاينة السيرة الذاتية
   ========================================================= */
(function () {
  'use strict';

  var THEMES = [
    { a: '#2f4f8f', b: '#d9b36c', name: { ar: 'أزرق ملكي', en: 'Royal blue' } },
    { a: '#14352a', b: '#c9a227', name: { ar: 'أخضر وذهبي', en: 'Green & gold' } },
    { a: '#1b1413', b: '#f97316', name: { ar: 'أسود وبرتقالي', en: 'Black & orange' } },
    { a: '#16233f', b: '#f5c542', name: { ar: 'كحلي وأصفر', en: 'Navy & yellow' } },
    { a: '#101010', b: '#e11d2e', name: { ar: 'أسود وأحمر', en: 'Black & red' } },
    { a: '#1f6f5c', b: '#e0b25a', name: { ar: 'فيروزي', en: 'Teal' } },
    { a: '#7a2e4a', b: '#e6a6bd', name: { ar: 'عنابي', en: 'Plum' } },
    { a: '#3d3a63', b: '#b9a7ff', name: { ar: 'بنفسجي', en: 'Violet' } },
    { a: '#8a4b1e', b: '#f0c48a', name: { ar: 'بني', en: 'Brown' } },
    { a: '#245b6e', b: '#9ed0dd', name: { ar: 'أزرق داكن', en: 'Deep blue' } }
  ];
  var ACCENTS = THEMES.map(function (t) { return t.a; });

  var TEMPLATES = [
    { id: 'ats', name: { ar: 'ATS كلاسيكي', en: 'ATS Classic' }, desc: { ar: 'عمود واحد، نصوص صريحة، بدون صورة أو أيقونات', en: 'Single column, plain text, no photo or icons' }, ats: true },
    { id: 'ats-modern', name: { ar: 'ATS حديث', en: 'ATS Modern' }, desc: { ar: 'عمود واحد بعناوين ملوّنة وخط واضح', en: 'Single column with colored headings' }, ats: true },
    { id: 'elite',   name: { ar: 'النخبة',   en: 'Elite'   }, desc: { ar: 'عمود واحد، عناوين مرقّمة وخطوط شعرية — أرقى وأهدأ ما في التطبيق', en: 'Single column, numbered sections, hairline rules — the quietest premium look' } },
    { id: 'modern',  name: { ar: 'عصري',    en: 'Modern'  }, desc: { ar: 'شريط جانبي ملوّن مع صورة', en: 'Colored sidebar with photo' } },
    { id: 'classic', name: { ar: 'كلاسيكي', en: 'Classic' }, desc: { ar: 'عنوان في الوسط وتنسيق رسمي', en: 'Centered header, formal layout' } },
    { id: 'minimal', name: { ar: 'بسيط',    en: 'Minimal' }, desc: { ar: 'خطوط نظيفة ومساحات بيضاء',   en: 'Clean lines, plenty of whitespace' } },
    { id: 'elegant', name: { ar: 'أنيق',    en: 'Elegant' }, desc: { ar: 'ترويسة ملوّنة وعمودان',       en: 'Accent banner with two columns' } },
    { id: 'profile', name: { ar: 'ملفّي داكن', en: 'Profile Dark' }, desc: { ar: 'ترويسة كبيرة وبطاقات أرقام وشريط جانبي داكن', en: 'Big banner, stat cards, dark sidebar' } },
    { id: 'profile-light', name: { ar: 'ملفّي فاتح', en: 'Profile Light' }, desc: { ar: 'ترويسة ملوّنة وشريط جانبي فاتح', en: 'Colored banner with light sidebar' } },
    { id: 'pro', name: { ar: 'احترافي', en: 'Professional' }, desc: { ar: 'عمود واحد، مساحات بيضاء، خطوط نظيفة وعناوين ملوّنة — لا تكدّس', en: 'Single column, whitespace, clean typography — no clutter' } }
  ];

  var LABELS = {
    ar: {
      summary: 'الملخص المهني', experience: 'الخبرات العملية', education: 'المؤهل العلمي',
      skills: 'المهارات', languages: 'اللغات', projects: 'المشاريع',
      certifications: 'الشهادات والدورات', contact: 'معلومات التواصل', present: 'حتى الآن',
      name: 'الاسم الكامل', title: 'المسمى الوظيفي'
    },
    en: {
      summary: 'Professional Summary', experience: 'Work Experience', education: 'Education',
      skills: 'Skills', languages: 'Languages', projects: 'Projects',
      certifications: 'Certifications', contact: 'Contact', present: 'Present',
      name: 'Full Name', title: 'Job Title'
    }
  };

  var LEVELS = {
    ar: ['أساسي', 'متوسط', 'جيد', 'متقدم', 'خبير'],
    en: ['Basic', 'Intermediate', 'Good', 'Advanced', 'Expert']
  };
  var LANG_LEVELS = {
    ar: ['مبتدئ', 'متوسط', 'جيد', 'متقدم', 'اللغة الأم'],
    en: ['Beginner', 'Intermediate', 'Good', 'Advanced', 'Native']
  };

  /* ------------------------- i18n ------------------------- */
  var I18N = {
    ar: {
      brand: 'سيرتي', tagline: 'سير ذاتية احترافية بكل الصيغ',
      careerNav: 'مركز التقديم',
      navHome: 'السير الذاتية',
      navEditor: 'المحرر',
      workspace: 'مساحة العمل',
      live: 'مباشر',
      cvs: 'سيرة ذاتية',
      atsReady: 'جاهزة ATS',
      jobs: 'وظيفة',
      lastCv: 'آخر سيرة',
      resumeEditing: 'متابعة التحرير',
      editorKicker: 'محرر السيرة',
      openEditor: 'فتح المحرر',
      heroNextEmpty: 'أنشئ سيرتك الأولى ثم ابدأ التقديم.',
      heroNextJobs: 'لديك {n} وظيفة في مركز التقديم.',
      heroNextReady: 'سيرتك جاهزة. افتح المحرر أو قدّم على وظيفة.',
      heroTag: 'منشئ سير ذاتية',
      heroTitle: 'سيرتك الذاتية، بأكثر من قالب وبكل الصيغ',
      heroText: 'أنشئ عددًا غير محدود من السير الذاتية، اختر القالب واللون واللغة، ثم صدّرها كملف PDF أو Word أو صورة أو HTML.',
      newCv: 'سيرة جديدة', importBackup: 'استيراد نسخة', backupJson: 'نسخة احتياطية',
      myCvs: 'سيري الذاتية', emptyTitle: 'لا توجد سير ذاتية بعد',
      emptyText: 'ابدأ بإنشاء سيرتك الأولى، اختر القالب المناسب ثم عبّئ بياناتك وصدّرها.',
      edit: 'تعديل', duplicate: 'نسخ', delete: 'حذف', updated: 'آخر تحديث',
      back: 'رجوع', cvNamePh: 'اسم السيرة', saved: 'محفوظ تلقائيًا', saving: 'يتم الحفظ…',
      exportBtn: 'تصدير', exportPdf: 'PDF (طباعة / حفظ)', exportWord: 'مستند Word',
      exportPng: 'صورة عالية الدقة', exportHtml: 'صفحة ويب', exportTxt: 'نص عادي',
      exportJson: 'نسخة احتياطية JSON', preview: 'المعاينة', templateLabel: 'القالب', matchJob: 'مطابقة الوظيفة',

      formPersonal: 'البيانات الشخصية', formExperience: 'الخبرات العملية',
      formEducation: 'المؤهلات العلمية', formSkills: 'المهارات', formLanguages: 'اللغات',
      formProjects: 'المشاريع', formCerts: 'الشهادات والدورات', addItem: 'إضافة عنصر',
      fFullName: 'الاسم الكامل', fJobTitle: 'المسمى الوظيفي', fEmail: 'البريد الإلكتروني',
      fPhone: 'رقم الهاتف', fCity: 'المدينة / البلد', fWebsite: 'الموقع الإلكتروني',
      fLinkedin: 'LinkedIn', fGithub: 'GitHub', fBehance: 'Behance', fTwitter: 'X / Twitter',
      fSummary: 'نبذة مختصرة', fPhoto: 'الصورة الشخصية',
      noPhoto: 'لا صورة', pickPhoto: 'اختيار صورة', clearPhoto: 'إزالة',
      fRole: 'المسمى الوظيفي', fCompany: 'جهة العمل', fStart: 'من', fEnd: 'إلى',
      fCurrent: 'أعمل هنا حتى الآن', fDesc: 'المهام والإنجازات', fDescHint: 'اكتب كل إنجاز في سطر منفصل ليظهر كنقطة.',
      fDegree: 'الدرجة / التخصص', fSchool: 'الجامعة / المعهد', fNote: 'ملاحظات (التقدير، التخصص الدقيق…)',
      fSkill: 'المهارة', fLevel: 'المستوى', fLangName: 'اللغة',
      fProjName: 'اسم المشروع', fLink: 'الرابط', fCertName: 'اسم الشهادة', fIssuer: 'الجهة المانحة', fYear: 'السنة',
      itemExp: 'خبرة', itemEdu: 'مؤهل', itemSkill: 'مهارة', itemLang: 'لغة', itemProj: 'مشروع', itemCert: 'شهادة',
      moveUp: 'تحريك لأعلى', moveDown: 'تحريك لأسفل', remove: 'حذف',

      newCvTitle: 'سيرة ذاتية جديدة', newCvSub: 'اختر قالبًا واسمًا ولغة، ويمكنك تغييرها لاحقًا.',
      cvName: 'اسم السيرة', cvLanguage: 'لغة السيرة', chooseTemplate: 'القالب', accent: 'لون التمييز',
      create: 'إنشاء السيرة', cancel: 'إلغاء', arabic: 'العربية', english: 'الإنجليزية',
      deleteConfirm: 'سيتم حذف هذه السيرة نهائيًا، هل تريد المتابعة؟',
      deleteYes: 'نعم، احذف', deleteNo: 'تراجع',
      nameRequired: 'اكتب اسمًا للسيرة أولًا.',
      exported: 'تم التصدير بنجاح.', imported: 'تم استيراد السير بنجاح.',
      importFailed: 'الملف غير صالح أو ليس نسخة احتياطية من التطبيق.',
      pngFailed: 'تعذّر إنشاء الصورة في هذا المتصفح. جرّب PDF بدلًا منها.',
      backupDone: 'تم حفظ النسخة الاحتياطية.',
      photoHint: 'JPG أو PNG — تُقصّ تلقائيًا إلى مربع.',
      today: 'اليوم',

      atsTitle: 'توافق ATS',
      atsExcellent: 'ممتازة لأنظمة التقديم الآلي',
      atsGood: 'جيدة — أكمل النواقص لرفع التوافق',
      atsPoor: 'تحتاج تحسينًا قبل التقديم',
      atsVisualWarn: 'القالب الحالي بصري وقد لا يقرأه ATS بدقة. استخدم قالب ATS.',
      atsUse: 'استخدم قالب ATS',
      atsConverted: 'تم التحويل إلى قالب ATS.',
      atsGroup: 'قوالب ATS',
      visualGroup: 'قوالب بصرية',
      atsBadge: 'ATS',
      atsIssueTemplate: 'اختر قالب ATS',
      atsIssuePhoto: 'أزل الصورة',
      atsIssueContact: 'أضف البريد والهاتف',
      atsIssueTitle: 'أضف المسمى الوظيفي',
      atsIssueCity: 'أضف المدينة',
      atsIssueSummary: 'أضف ملخصًا 60+ حرفًا',
      atsIssueExp: 'أضف خبرة بوصف',
      atsIssueSkills: 'أضف 5 مهارات',
      atsIssueEdu: 'أضف المؤهل',
      atsAllGood: 'كل الأساسيات مكتملة',

      formExtra: 'إضافات التصميم (قالب ملفّي)',
      fMini: 'نص علوي صغير',
      fEnglish: 'العنوان بالإنجليزية',
      fIntro: 'سطر تعريفي',
      fHighlights: 'بطاقات الأرقام',
      hintPipe: 'سطر لكل بطاقة: القيمة | الوصف',
      fOfferTitle: 'عنوان صندوق العرض',
      fOfferItems: 'نقاط صندوق العرض',
      fProcessTitle: 'عنوان خطوات العمل',
      fProcess: 'خطوات العمل',
      hintPipe2: 'سطر لكل خطوة: العنوان | الوصف',
      fGridTitle: 'عنوان الشبكة',
      fGrid: 'عناصر الشبكة',
      fTools: 'الأدوات (مفصولة بفاصلة)',
      fReadinessTitle: 'عنوان الجاهزية',
      fWhatsapp: 'رقم واتساب',
      fReadiness: 'عناصر الجاهزية',
      fFooterNote: 'ملاحظة التذييل',
      extraHint: 'تظهر هذه الإضافات في قالبَي «ملفّي»؛ وتُختصر في قوالب ATS إلى الأدوات والمعلومات الإضافية.',
      fSkillGroup: 'المجموعة',
      fSkillGroupHint: 'اختياري — يجمع المهارات تحت عنوان واحد.',
      fLangNote: 'ملاحظة اللغة'
    },
    en: {
      brand: 'Sirati', tagline: 'Professional CVs in every format',
      careerNav: 'Career Hub',
      navHome: 'My CVs',
      navEditor: 'Editor',
      workspace: 'Workspace',
      live: 'Live',
      cvs: 'CVs',
      atsReady: 'ATS-ready',
      jobs: 'Jobs',
      lastCv: 'Last CV',
      resumeEditing: 'Resume editing',
      editorKicker: 'CV EDITOR',
      openEditor: 'Open editor',
      heroNextEmpty: 'Create your first CV, then start applying.',
      heroNextJobs: 'You have {n} job(s) in the Career Hub.',
      heroNextReady: 'Your CV is ready. Open the editor or apply for a job.',
      heroTag: 'CV BUILDER',
      heroTitle: 'Your CV, in more than one template and every format',
      heroText: 'Create unlimited CVs, pick the template, color and language, then export to PDF, Word, image or HTML.',
      newCv: 'New CV', importBackup: 'Import backup', backupJson: 'Backup',
      myCvs: 'My CVs', emptyTitle: 'No CVs yet',
      emptyText: 'Create your first CV, pick a template, fill in your details and export it.',
      edit: 'Edit', duplicate: 'Duplicate', delete: 'Delete', updated: 'Updated',
      back: 'Back', cvNamePh: 'CV name', saved: 'Saved automatically', saving: 'Saving…',
      exportBtn: 'Export', exportPdf: 'PDF (print / save)', exportWord: 'Word document',
      exportPng: 'High-res image', exportHtml: 'Web page', exportTxt: 'Plain text',
      exportJson: 'JSON backup', preview: 'Preview', templateLabel: 'Template', matchJob: 'Job match',

      formPersonal: 'Personal details', formExperience: 'Work experience',
      formEducation: 'Education', formSkills: 'Skills', formLanguages: 'Languages',
      formProjects: 'Projects', formCerts: 'Certifications', addItem: 'Add item',
      fFullName: 'Full name', fJobTitle: 'Job title', fEmail: 'Email',
      fPhone: 'Phone', fCity: 'City / Country', fWebsite: 'Website',
      fLinkedin: 'LinkedIn', fGithub: 'GitHub', fBehance: 'Behance', fTwitter: 'X / Twitter',
      fSummary: 'Professional summary', fPhoto: 'Photo',
      noPhoto: 'No photo', pickPhoto: 'Choose photo', clearPhoto: 'Remove',
      fRole: 'Job title', fCompany: 'Company', fStart: 'From', fEnd: 'To',
      fCurrent: 'I currently work here', fDesc: 'Responsibilities & achievements', fDescHint: 'Write each achievement on its own line to show it as a bullet.',
      fDegree: 'Degree / field', fSchool: 'University / institute', fNote: 'Notes (grade, specialization…)',
      fSkill: 'Skill', fLevel: 'Level', fLangName: 'Language',
      fProjName: 'Project name', fLink: 'Link', fCertName: 'Certificate', fIssuer: 'Issuer', fYear: 'Year',
      itemExp: 'Experience', itemEdu: 'Education', itemSkill: 'Skill', itemLang: 'Language', itemProj: 'Project', itemCert: 'Certificate',
      moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove',

      newCvTitle: 'New CV', newCvSub: 'Pick a template, a name and a language — you can change them later.',
      cvName: 'CV name', cvLanguage: 'CV language', chooseTemplate: 'Template', accent: 'Accent color',
      create: 'Create CV', cancel: 'Cancel', arabic: 'Arabic', english: 'English',
      deleteConfirm: 'This CV will be deleted permanently. Continue?',
      deleteYes: 'Yes, delete', deleteNo: 'Keep it',
      nameRequired: 'Please enter a name for the CV.',
      exported: 'Exported successfully.', imported: 'CVs imported successfully.',
      importFailed: 'This file is not a valid backup from this app.',
      pngFailed: 'Could not create the image in this browser. Try PDF instead.',
      backupDone: 'Backup saved.',
      photoHint: 'JPG or PNG — cropped to a square automatically.',
      today: 'today',

      atsTitle: 'ATS compatibility',
      atsExcellent: 'Excellent for applicant tracking systems',
      atsGood: 'Good — fix the gaps to improve it',
      atsPoor: 'Needs work before applying',
      atsVisualWarn: 'This visual template may not parse cleanly in an ATS. Switch to an ATS template.',
      atsUse: 'Use an ATS template',
      atsConverted: 'Switched to an ATS template.',
      atsGroup: 'ATS templates',
      visualGroup: 'Visual templates',
      atsBadge: 'ATS',
      atsIssueTemplate: 'Choose an ATS template',
      atsIssuePhoto: 'Remove the photo',
      atsIssueContact: 'Add email and phone',
      atsIssueTitle: 'Add a job title',
      atsIssueCity: 'Add a city',
      atsIssueSummary: 'Add a 60+ character summary',
      atsIssueExp: 'Add experience with details',
      atsIssueSkills: 'Add at least 5 skills',
      atsIssueEdu: 'Add education',
      atsAllGood: 'All essentials are complete',

      formExtra: 'Design extras (Profile templates)',
      fMini: 'Top mini label',
      fEnglish: 'English title',
      fIntro: 'Tagline',
      fHighlights: 'Stat cards',
      hintPipe: 'One card per line: value | description',
      fOfferTitle: 'Offer box title',
      fOfferItems: 'Offer box items',
      fProcessTitle: 'Process section title',
      fProcess: 'Process steps',
      hintPipe2: 'One step per line: title | description',
      fGridTitle: 'Grid section title',
      fGrid: 'Grid items',
      fTools: 'Tools (comma separated)',
      fReadinessTitle: 'Readiness title',
      fWhatsapp: 'WhatsApp number',
      fReadiness: 'Readiness items',
      fFooterNote: 'Footer note',
      extraHint: 'These extras appear in the “Profile” templates; ATS templates keep only tools and additional info.',
      fSkillGroup: 'Group',
      fSkillGroupHint: 'Optional — groups skills under one heading.',
      fLangNote: 'Language note'
    }
  };

  /* ------------------------- helpers ------------------------- */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function uid() {
    return 'cv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  var ICONS = {
    mail: '<path d="M3.5 6.5h17v11h-17z"/><path d="m3.7 7 8.3 6 8.3-6"/>',
    phone: '<path d="M6.5 3.5h3l1.6 4-2 1.3a12.5 12.5 0 0 0 5.6 5.6l1.3-2 4 1.6v3c0 1.1-.9 2-2 2A17 17 0 0 1 4.5 5.5c0-1.1.9-2 2-2z"/>',
    pin: '<path d="M12 21s6.8-6.2 6.8-11a6.8 6.8 0 1 0-13.6 0C5.2 14.8 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
    link: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>',
    linkedin: '<path d="M5 9.5V20M5 4.6v.1"/><path d="M10.5 20v-6.2a3.3 3.3 0 0 1 6.6 0V20"/><path d="M10.5 9.5V20"/>',
    github: '<path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C5.2 2.8 4.2 3.1 4.2 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 2.8 9.6c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V20"/>',
    behance: '<path d="M2.5 6h5.2a2.8 2.8 0 0 1 0 5.6H2.5zM2.5 11.6h5.6a2.9 2.9 0 0 1 0 5.8H2.5z"/><path d="M14.5 7.5h5M14 15.1a3 3 0 0 0 6 .1 3.1 3.1 0 0 0-6-.7 3.2 3.2 0 0 0 6 1.7"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>'
  };

  function ico(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  function prettyUrl(u) {
    return String(u || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
  }

  function levelText(n, lang) {
    var arr = LEVELS[lang] || LEVELS.ar;
    var i = Math.max(1, Math.min(5, Number(n) || 1)) - 1;
    return arr[i];
  }

  function langLevelText(n, lang) {
    var arr = LANG_LEVELS[lang] || LANG_LEVELS.ar;
    var i = Math.max(1, Math.min(5, Number(n) || 1)) - 1;
    return arr[i];
  }

  function dots(n) {
    var v = Math.max(0, Math.min(5, Number(n) || 0));
    var out = '';
    for (var i = 1; i <= 5; i++) out += '<i class="' + (i <= v ? 'on' : '') + '"></i>';
    return '<span class="cv-dots">' + out + '</span>';
  }

  function dateRange(it, L) {
    var s = String(it.start || '').trim();
    var e = it.current ? L.present : String(it.end || '').trim();
    if (!s && !e) return '';
    if (s && e) return esc(s) + ' — ' + esc(e);
    return esc(s || e);
  }

  function descHtml(text) {
    if (!text) return '';
    var lines = String(text).split(/\r?\n/)
      .map(function (s) { return s.replace(/^\s*[-•*·]\s*/, '').trim(); })
      .filter(Boolean);
    if (!lines.length) return '';
    if (lines.length === 1) return '<p class="cv-desc">' + esc(lines[0]) + '</p>';
    return '<div class="cv-desc"><ul>' + lines.map(function (l) {
      return '<li>' + esc(l) + '</li>';
    }).join('') + '</ul></div>';
  }

  function sec(title, inner) {
    if (!inner) return '';
    return '<section class="cv-sec"><h2 class="cv-h">' + esc(title) + '</h2>' + inner + '</section>';
  }

  function contactHtml(p) {
    var items = [];
    function add(kind, val) {
      if (!val) return;
      var ltr = kind === 'phone' || kind === 'mail' || kind === 'link' ||
        kind === 'linkedin' || kind === 'github' || kind === 'behance' || kind === 'x';
      var inner = ltr ? '<bdi dir="ltr">' + esc(val) + '</bdi>' : esc(val);
      items.push('<span class="cv-c">' + ico(kind) + '<span>' + inner + '</span></span>');
    }
    if (p.phone) add('phone', p.phone);
    if (p.email) add('mail', p.email);
    if (p.city) add('pin', p.city);
    if (p.website) add('link', prettyUrl(p.website));
    if (p.linkedin) add('linkedin', prettyUrl(p.linkedin));
    if (p.github) add('github', prettyUrl(p.github));
    if (p.behance) add('behance', prettyUrl(p.behance));
    if (p.x) add('x', prettyUrl(p.x));
    return items.length ? '<div class="cv-contact">' + items.join('') + '</div>' : '';
  }

  /* --------------------- section builders --------------------- */
  function summaryHtml(cv, L) {
    var s = (cv.personal && cv.personal.summary || '').trim();
    if (!s) return '';
    return sec(L.summary, '<p class="cv-summary">' + esc(s).replace(/\r?\n/g, '<br>') + '</p>');
  }

  function experienceHtml(cv, L) {
    var items = (cv.experience || []).filter(function (x) {
      return x && (x.role || x.company || x.description);
    });
    if (!items.length) return '';
    return sec(L.experience, items.map(function (it) {
      return '<div class="cv-item">' +
        '<div class="cv-ihead"><div class="cv-t">' + esc(it.role || '') + '</div>' +
        (dateRange(it, L) ? '<div class="cv-d">' + dateRange(it, L) + '</div>' : '') + '</div>' +
        (it.company ? '<div class="cv-o">' + esc(it.company) + '</div>' : '') +
        descHtml(it.description) +
        '</div>';
    }).join(''));
  }

  function educationHtml(cv, L) {
    var items = (cv.education || []).filter(function (x) {
      return x && (x.degree || x.school || x.note);
    });
    if (!items.length) return '';
    return sec(L.education, items.map(function (it) {
      return '<div class="cv-item">' +
        '<div class="cv-ihead"><div class="cv-t">' + esc(it.degree || '') + '</div>' +
        (dateRange(it, L) ? '<div class="cv-d">' + dateRange(it, L) + '</div>' : '') + '</div>' +
        (it.school ? '<div class="cv-o">' + esc(it.school) + '</div>' : '') +
        descHtml(it.note) +
        '</div>';
    }).join(''));
  }

  function projectsHtml(cv, L) {
    var items = (cv.projects || []).filter(function (x) {
      return x && (x.name || x.description || x.link);
    });
    if (!items.length) return '';
    return sec(L.projects, items.map(function (it) {
      return '<div class="cv-item">' +
        '<div class="cv-ihead"><div class="cv-t">' + esc(it.name || '') + '</div>' +
        (it.link ? '<div class="cv-d">' + esc(prettyUrl(it.link)) + '</div>' : '') + '</div>' +
        descHtml(it.description) +
        '</div>';
    }).join(''));
  }

  function certsHtml(cv, L) {
    var items = (cv.certifications || []).filter(function (x) {
      return x && (x.name || x.issuer);
    });
    if (!items.length) return '';
    return sec(L.certifications, items.map(function (it) {
      return '<div class="cv-item">' +
        '<div class="cv-ihead"><div class="cv-t">' + esc(it.name || '') + '</div>' +
        (it.year ? '<div class="cv-d">' + esc(it.year) + '</div>' : '') + '</div>' +
        (it.issuer ? '<div class="cv-o">' + esc(it.issuer) + '</div>' : '') +
        '</div>';
    }).join(''));
  }

  function skillsSideHtml(cv) {
    var items = (cv.skills || []).filter(function (x) { return x && x.name; });
    if (!items.length) return '';
    return items.map(function (s) {
      return '<div class="skill"><div class="skill-top"><span>' + esc(s.name) + '</span>' +
        dots(s.level) + '</div></div>';
    }).join('');
  }

  function skillsGridHtml(cv, L) {
    var items = (cv.skills || []).filter(function (x) { return x && x.name; });
    if (!items.length) return '';
    return sec(L.skills, '<div class="cv-skills">' + items.map(function (s) {
      return '<div class="cv-skill-line"><span>' + esc(s.name) + '</span><em>' +
        esc(levelText(s.level, cv.lang)) + '</em></div>';
    }).join('') + '</div>');
  }

  function skillsChipsHtml(cv, L) {
    var items = (cv.skills || []).filter(function (x) { return x && x.name; });
    if (!items.length) return '';
    return sec(L.skills, '<div class="cv-chips">' + items.map(function (s) {
      return '<span class="chip">' + esc(s.name) + dots(s.level) + '</span>';
    }).join('') + '</div>');
  }

  function languagesSideHtml(cv, L) {
    var items = (cv.languages || []).filter(function (x) { return x && x.name; });
    if (!items.length) return '';
    return items.map(function (it) {
      return '<div class="lang-row"><span>' + esc(it.name) + '</span><em>' +
        esc(langLevelText(it.level, cv.lang)) + '</em></div>';
    }).join('');
  }

  function languagesGridHtml(cv, L) {
    var items = (cv.languages || []).filter(function (x) { return x && x.name; });
    if (!items.length) return '';
    return sec(L.languages, '<div class="cv-skills">' + items.map(function (it) {
      return '<div class="cv-skill-line"><span>' + esc(it.name) + '</span><em>' +
        esc(langLevelText(it.level, cv.lang)) + '</em></div>';
    }).join('') + '</div>');
  }

  function languagesChipsHtml(cv, L) {
    var items = (cv.languages || []).filter(function (x) { return x && x.name; });
    if (!items.length) return '';
    return sec(L.languages, '<div class="cv-chips">' + items.map(function (it) {
      return '<span class="chip">' + esc(it.name) + ' · ' +
        esc(langLevelText(it.level, cv.lang)) + '</span>';
    }).join('') + '</div>');
  }

  /* ------------------- profile template (rich) ------------------- */
  var PF_EN = {
    profile: 'PROFILE', experience: 'EXPERIENCE', skills: 'SKILLS', education: 'EDUCATION',
    contact: 'CONTACT', tools: 'TOOLS', languages: 'LANGUAGES', readiness: 'READY'
  };

  function pfSection(title, en, inner) {
    if (!inner) return '';
    return '<section class="pf-sec">' +
      '<h2 class="pf-h"><span class="pf-h-ar">' + esc(title) + '</span>' +
      (en ? '<span class="pf-h-en">' + esc(en) + '</span>' : '') + '</h2>' + inner + '</section>';
  }

  function skillGroups(cv) {
    var items = (cv.skills || []).filter(function (s) { return s && s.name; });
    var groups = [], map = {};
    items.forEach(function (s) {
      var g = String(s.group || '').trim();
      if (!map[g]) { map[g] = { title: g, items: [] }; groups.push(map[g]); }
      map[g].items.push(s);
    });
    return groups;
  }

  function profileHtml(cv, L, light) {
    var p = cv.personal || {};
    var e = cv.extra || {};
    var name = (p.fullName || '').trim() || (cv.lang === 'en' ? 'Your Name' : 'الاسم الكامل');
    var title = (p.jobTitle || '').trim();
    var en = (e.english || '').trim();
    var intro = (e.intro || '').trim();
    var mini = (e.mini || '').trim();
    var footerNote = (e.footerNote || '').trim();
    var initial = name.replace(/^[^A-Za-z\u0600-\u06FF]+/, '').charAt(0) || '•';
    var photo = p.photo;

    var brand = photo
      ? '<img class="pf-photo" src="' + photo + '" alt="">'
      : '<span class="pf-mark-letter">' + esc(initial) + '</span>';

    var highlights = (e.highlights || []).filter(function (h) { return h && (h.value || h.label); }).slice(0, 3);
    var cards = highlights.length
      ? '<div class="pf-cards">' + highlights.map(function (h) {
          return '<div class="pf-card"><b>' + esc(h.value || '') + '</b><span>' + esc(h.label || '') + '</span></div>';
        }).join('') + '</div>'
      : '';

    var contactRows = '';
    if (p.phone) contactRows += '<div class="pf-c">' + ico('phone') + '<span><bdi dir="ltr">' + esc(p.phone) + '</bdi></span></div>';
    if (p.email) contactRows += '<div class="pf-c">' + ico('mail') + '<span><bdi dir="ltr">' + esc(p.email) + '</bdi></span></div>';
    if (p.city) contactRows += '<div class="pf-c">' + ico('pin') + '<span>' + esc(p.city) + '</span></div>';
    if (p.website) contactRows += '<div class="pf-c">' + ico('link') + '<span><bdi dir="ltr">' + esc(prettyUrl(p.website)) + '</bdi></span></div>';
    if (p.linkedin) contactRows += '<div class="pf-c">' + ico('linkedin') + '<span><bdi dir="ltr">' + esc(prettyUrl(p.linkedin)) + '</bdi></span></div>';
    if (p.github) contactRows += '<div class="pf-c">' + ico('github') + '<span><bdi dir="ltr">' + esc(prettyUrl(p.github)) + '</bdi></span></div>';
    if (p.behance) contactRows += '<div class="pf-c">' + ico('behance') + '<span><bdi dir="ltr">' + esc(prettyUrl(p.behance)) + '</bdi></span></div>';
    if (p.x) contactRows += '<div class="pf-c">' + ico('x') + '<span><bdi dir="ltr">' + esc(prettyUrl(p.x)) + '</bdi></span></div>';

    var wa = String(e.whatsapp || '').replace(/[^0-9]/g, '');
    var waBtn = wa
      ? '<a class="pf-wa" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' +
        '<span class="pf-wa-ico">' + ico('phone') + '</span>ابدأ محادثة واتساب</a>'
      : '';

    var tools = (e.tools || []).filter(Boolean);
    var toolsHtml = tools.length
      ? '<div class="pf-block"><h3 class="pf-side-h"><span>' + esc(cv.lang === 'ar' ? 'أدوات' : 'Tools') + '</span><em>TOOLS</em></h3>' +
        '<div class="pf-tools">' + tools.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div>'
      : '';

    var langs = (cv.languages || []).filter(function (x) { return x && x.name; });
    var langsHtml = langs.length
      ? '<div class="pf-block"><h3 class="pf-side-h"><span>' + esc(L.languages) + '</span><em>LANGUAGES</em></h3>' +
        langs.map(function (it) {
          return '<div class="pf-lang"><div class="pf-lang-txt"><b>' + esc(it.name) + '</b><em>' +
            esc(it.note || langLevelText(it.level, cv.lang)) + '</em></div>' + dots(it.level) + '</div>';
        }).join('') + '</div>'
      : '';

    var edu = (cv.education || []).filter(function (x) { return x && (x.degree || x.school || x.note); });
    var eduHtml = edu.length
      ? '<div class="pf-block"><h3 class="pf-side-h"><span>' + esc(L.education) + '</span><em>EDUCATION</em></h3>' +
        edu.map(function (it) {
          var dr = dateRange(it, L);
          return '<div class="pf-edu"><b>' + esc(it.degree || '') + '</b>' +
            (it.school ? '<span class="pf-edu-school">' + esc(it.school) + '</span>' : '') +
            (dr ? '<em>' + dr + '</em>' : '') +
            (it.note ? '<p>' + esc(it.note) + '</p>' : '') + '</div>';
        }).join('') + '</div>'
      : '';

    var ready = (e.readiness || []).filter(Boolean);
    var readyHtml = ready.length
      ? '<div class="pf-block"><h3 class="pf-side-h"><span>' + esc(e.readinessTitle || (cv.lang === 'ar' ? 'الجاهزية' : 'Readiness')) +
        '</span><em>READY</em></h3><ul class="pf-ready">' +
        ready.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>'
      : '';

    var offerItems = (e.offerItems || []).filter(Boolean);
    var offerHtml = '';
    if (offerItems.length) {
      offerHtml = '<div class="pf-offer">' +
        '<h3><span class="pf-diamond">◆</span>' + esc(e.offerTitle || (cv.lang === 'ar' ? 'ما أقدمه' : 'What I offer')) + '</h3>' +
        '<ol>' + offerItems.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>';
    }

    var process = (e.process || []).filter(function (s) { return s && (s.title || s.desc); });
    var processHtml = process.length
      ? pfSection(e.processTitle || (cv.lang === 'ar' ? 'خطوات العمل' : 'Process'), '',
        '<div class="pf-steps">' + process.map(function (s, i) {
          return '<div class="pf-step"><b>' + ('0' + (i + 1)).slice(-2) + '</b>' +
            '<h4>' + esc(s.title || '') + '</h4><p>' + esc(s.desc || '') + '</p></div>';
        }).join('') + '</div>')
      : '';

    var grid = (e.grid || []).filter(function (s) { return s && (s.title || s.desc); });
    var gridHtml = grid.length
      ? pfSection(e.gridTitle || (cv.lang === 'ar' ? 'إضافات' : 'Highlights'), '',
        '<div class="pf-grid">' + grid.map(function (s) {
          return '<div class="pf-grid-item"><h4>' + esc(s.title || '') + '</h4><p>' + esc(s.desc || '') + '</p></div>';
        }).join('') + '</div>')
      : '';

    var expItems = (cv.experience || []).filter(function (it) { return it && (it.role || it.company); });
    var expHtml = expItems.length
      ? pfSection(L.experience, PF_EN.experience,
        '<div class="pf-tl">' + expItems.map(function (it) {
          var dr = dateRange(it, L);
          return '<div class="pf-tl-item">' +
            (dr ? '<span class="pf-tl-date">' + dr + '</span>' : '') +
            '<h4>' + esc(it.role || '') + '</h4>' +
            (it.company ? '<div class="pf-tl-org">' + esc(it.company) + '</div>' : '') +
            descHtml(it.description) + '</div>';
        }).join('') + '</div>')
      : '';

    var groups = skillGroups(cv);
    var skillsHtml = groups.length
      ? pfSection(L.skills, PF_EN.skills,
        '<div class="pf-skills">' + groups.map(function (g) {
          return '<div class="pf-skill-row">' +
            (g.title ? '<div class="pf-skill-cat">' + esc(g.title) + '</div>' : '') +
            '<div class="pf-chips">' + g.items.map(function (s) {
              return '<span class="pf-chip">' + esc(s.name) + '</span>';
            }).join('') + '</div></div>';
        }).join('') + '</div>')
      : '';

    var sum = (p.summary || '').trim();
    var sumHtml = sum ? pfSection(cv.lang === 'ar' ? 'نبذة مهنية' : 'Profile', PF_EN.profile,
      '<p class="pf-summary">' + esc(sum).replace(/\r?\n/g, '<br>') + '</p>') : '';

    var foot = '<footer class="pf-foot">' +
      (p.phone ? '<span class="pf-foot-phone"><bdi dir="ltr">' + esc(p.phone) + '</bdi></span>' : '') +
      (footerNote ? '<span class="pf-foot-note">' + esc(footerNote) + '</span>' : '') + '</footer>';

    return '<div class="cv-page tpl-profile' + (light ? ' pf-light' : '') + '" dir="' +
      (cv.lang === 'en' ? 'ltr' : 'rtl') + '" style="--cv-accent:' + esc(cv.accent || '#2f4f8f') +
      ';--cv-accent2:' + esc(cv.accent2 || '#c9a227') + '">' +
      '<header class="pf-hero">' +
        '<div class="pf-top"><span class="pf-top-mini">' + esc(mini) + '</span>' +
          (p.city ? '<span class="pf-top-loc">' + esc(p.city) + '</span>' : '') + '</div>' +
        '<div class="pf-hero-row">' +
          '<div class="pf-hero-txt">' +
            '<h1 class="cv-name">' + esc(name) + '</h1>' +
            (title ? '<div class="cv-role">' + esc(title) + '</div>' : '') +
            (en ? '<div class="pf-en">' + esc(en) + '</div>' : '') +
            (intro ? '<p class="pf-intro">' + esc(intro) + '</p>' : '') +
          '</div>' +
          '<div class="pf-brand">' + brand + '</div>' +
        '</div>' +
      '</header>' +
      cards +
      '<div class="pf-body">' +
        '<aside class="pf-side">' +
          (contactRows ? '<div class="pf-block"><h3 class="pf-side-h"><span>' + esc(L.contact) +
            '</span><em>CONTACT</em></h3><div class="pf-contact">' + contactRows + '</div>' + waBtn + '</div>' : '') +
          toolsHtml + langsHtml + eduHtml + readyHtml +
          '<div class="pf-wm" aria-hidden="true">' + esc(initial) + '</div>' +
        '</aside>' +
        '<main class="pf-main">' +
          sumHtml + offerHtml + processHtml + gridHtml + expHtml + skillsHtml +
          (function () {
            var proj = projectsHtml(cv, L);
            var certs = certsHtml(cv, L);
            return proj + certs;
          })() +
        '</main>' +
      '</div>' + foot + '</div>';
  }

  /* ----------------------- ATS templates ----------------------- */
  function atsContactHtml(p) {
    var items = [];
    function add(val, ltr) {
      if (!val) return;
      items.push('<span' + (ltr ? ' dir="ltr"' : '') + '>' + esc(val) + '</span>');
    }
    add(p.phone, true);
    add(p.email, true);
    add(p.city, false);
    if (p.website) add(prettyUrl(p.website), true);
    if (p.linkedin) add(prettyUrl(p.linkedin), true);
    if (p.github) add(prettyUrl(p.github), true);
    if (p.behance) add(prettyUrl(p.behance), true);
    if (p.x) add(prettyUrl(p.x), true);
    if (!items.length) return '';
    return '<div class="ats-contact">' + items.join('<span class="ats-sep">•</span>') + '</div>';
  }

  function atsDesc(text) {
    if (!text) return '';
    var lines = String(text).split(/\r?\n/)
      .map(function (s) { return s.replace(/^\s*[-•*·]\s*/, '').trim(); })
      .filter(Boolean);
    if (!lines.length) return '';
    if (lines.length === 1) return '<p class="ats-p">' + esc(lines[0]) + '</p>';
    return '<ul class="ats-list">' + lines.map(function (l) {
      return '<li>' + esc(l) + '</li>';
    }).join('') + '</ul>';
  }

  function atsItem(title, dates, org, desc) {
    return '<div class="ats-item">' +
      '<div class="ats-row"><h3>' + esc(title || '') + '</h3>' +
        (dates ? '<span class="ats-date">' + dates + '</span>' : '') + '</div>' +
      (org ? '<div class="ats-org">' + esc(org) + '</div>' : '') +
      (desc || '') + '</div>';
  }

  function atsSection(title, inner) {
    if (!inner) return '';
    return '<section class="ats-sec"><h2 class="ats-h">' + esc(title) + '</h2>' + inner + '</section>';
  }

  function atsHtml(cv, L, modern) {
    var p = cv.personal || {};
    var e = cv.extra || {};
    var name = (p.fullName || '').trim() || (cv.lang === 'en' ? 'Your Name' : 'الاسم الكامل');
    var title = (p.jobTitle || '').trim();
    var sum = (p.summary || '').trim();

    var sumSec = sum
      ? atsSection(L.summary, '<p class="ats-p">' + esc(sum).replace(/\r?\n/g, '<br>') + '</p>')
      : '';

    var skillInner = '';
    skillGroups(cv).forEach(function (g) {
      var names = g.items.map(function (s) { return esc(s.name); }).join(cv.lang === 'ar' ? '، ' : ', ');
      skillInner += '<p class="ats-skill-line">' + (g.title ? '<b>' + esc(g.title) + ':</b> ' : '') + names + '</p>';
    });
    var tools = (e.tools || []).filter(Boolean);
    if (tools.length) {
      skillInner += '<p class="ats-skill-line"><b>' + (cv.lang === 'ar' ? 'الأدوات' : 'Tools') + ':</b> ' +
        tools.map(esc).join(cv.lang === 'ar' ? '، ' : ', ') + '</p>';
    }
    var skillsSec = atsSection(L.skills, skillInner);

    var expItems = (cv.experience || []).filter(function (it) {
      return it && (it.role || it.company || it.description);
    });
    var expSec = atsSection(L.experience, expItems.map(function (it) {
      return atsItem(it.role || '', dateRange(it, L), it.company || '', atsDesc(it.description));
    }).join(''));

    var eduItems = (cv.education || []).filter(function (it) {
      return it && (it.degree || it.school || it.note);
    });
    var eduSec = atsSection(L.education, eduItems.map(function (it) {
      return atsItem(it.degree || '', dateRange(it, L), it.school || '',
        it.note ? '<p class="ats-note">' + esc(it.note) + '</p>' : '');
    }).join(''));

    var projItems = (cv.projects || []).filter(function (it) {
      return it && (it.name || it.description || it.link);
    });
    var projSec = atsSection(L.projects, projItems.map(function (it) {
      return atsItem(it.name || '', it.link ? '<bdi dir="ltr">' + esc(prettyUrl(it.link)) + '</bdi>' : '',
        '', atsDesc(it.description));
    }).join(''));

    var certItems = (cv.certifications || []).filter(function (it) {
      return it && (it.name || it.issuer);
    });
    var certSec = atsSection(L.certifications, certItems.map(function (it) {
      return atsItem(it.name || '', esc(it.year || ''), it.issuer || '', '');
    }).join(''));

    var langs = (cv.languages || []).filter(function (it) { return it && it.name; });
    var langSec = atsSection(L.languages, langs.map(function (it) {
      return '<p class="ats-skill-line"><b>' + esc(it.name) + '</b> — ' +
        esc(it.note || langLevelText(it.level, cv.lang)) + '</p>';
    }).join(''));

    var ready = (e.readiness || []).filter(Boolean);
    var readySec = atsSection(cv.lang === 'ar' ? 'معلومات إضافية' : 'Additional Information',
      ready.length ? '<p class="ats-skill-line">' + esc(ready.join(' · ')) + '</p>' : '');

    var contact = atsContactHtml(p);

    return '<div class="cv-page tpl-' + (modern ? 'ats-modern' : 'ats') + '" dir="' +
      (cv.lang === 'en' ? 'ltr' : 'rtl') + '" style="--cv-accent:' + esc(cv.accent || '#2f4f8f') + '">' +
      '<header class="ats-head">' +
        '<h1 class="ats-name">' + esc(name) + '</h1>' +
        (title ? '<div class="ats-role">' + esc(title) + '</div>' : '') +
        contact +
      '</header>' +
      sumSec + expSec + skillsSec + eduSec + projSec + certSec + langSec + readySec +
      '</div>';
  }

  /* ----------------------- pro template (clean professional) ----------------------- */
  /* تصميم احترافي نظيف: عمود واحد، مساحات بيضاء، خطوط نظيفة،
     عناوين ملوّنة بشريط دقيق — بدون بطاقات أو أشرطة جانبية أو تكدّس. */
  function proContactHtml(p) {
    var items = [];
    function add(kind, val, href) {
      if (!val) return;
      var ltr = kind === 'phone' || kind === 'mail' || kind === 'link' ||
        kind === 'linkedin' || kind === 'github' || kind === 'behance' || kind === 'x';
      var inner = ltr ? '<bdi dir="ltr">' + esc(val) + '</bdi>' : esc(val);
      if (href) {
        items.push('<span class="cv-c"><a href="' + href + '"' +
          (kind === 'phone' ? '' : ' target="_blank" rel="noopener"') + '>' +
          ico(kind) + '<span>' + inner + '</span></a></span>');
      } else {
        items.push('<span class="cv-c">' + ico(kind) + '<span>' + inner + '</span></span>');
      }
    }
    add('phone', p.phone, 'tel:' + String(p.phone || '').replace(/\s|-/g, ''));
    add('mail', p.email, 'mailto:' + p.email);
    add('pin', p.city, null);
    add('link', prettyUrl(p.website), p.website);
    add('linkedin', prettyUrl(p.linkedin), p.linkedin);
    add('github', prettyUrl(p.github), p.github);
    add('behance', prettyUrl(p.behance), p.behance);
    add('x', prettyUrl(p.x), p.x);
    return items.length ? '<div class="cv-contact">' + items.join('') + '</div>' : '';
  }

  function proHtml(cv, L) {
    var p = cv.personal || {};
    var e = cv.extra || {};
    var name = (p.fullName || '').trim() || (cv.lang === 'en' ? 'Your Name' : 'الاسم الكامل');
    var title = (p.jobTitle || '').trim();
    var contact = proContactHtml(p);
    var wa = String(e.whatsapp || '').replace(/[^0-9]/g, '');
    var waBtn = wa
      ? '<span class="cv-c"><a class="pro-wa" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' +
        ico('phone') + '<span>واتساب ' + esc(wa) + '</span></a></span>'
      : '';

    var head = '<header class="cv-head">' +
      '<h1 class="cv-name">' + esc(name) + '</h1>' +
      (title ? '<div class="cv-role">' + esc(title) + '</div>' : '') +
      ((contact || waBtn) ? '<div class="cv-contact">' + contact + waBtn + '</div>' : '') +
      '</header><div class="pro-rule"></div>';

    var sum = summaryHtml(cv, L);

    /* المهارات: مجموعات بخطوط نظيفة ونقاط مستوى */
    var groups = skillGroups(cv);
    var skillsHtml = groups.length
      ? sec(L.skills, '<div class="pro-skills">' + groups.map(function (g) {
          return (g.title ? '<div class="pro-skill-cat">' + esc(g.title) + '</div>' : '') +
            '<div class="pro-skill-row">' + g.items.map(function (s) {
              return '<div class="pro-skill-line"><span>' + esc(s.name) + '</span>' + dots(s.level) + '</div>';
            }).join('') + '</div>';
        }).join('') + '</div>')
      : '';

    var exp = experienceHtml(cv, L);
    var edu = educationHtml(cv, L);
    var certs = certsHtml(cv, L);

    /* اللغات: صفوف نظيفة في عمودين */
    var langs = (cv.languages || []).filter(function (x) { return x && x.name; });
    var langsHtml = langs.length
      ? sec(L.languages, '<div class="pro-langs">' + langs.map(function (it) {
          return '<div class="pro-lang-line"><span>' + esc(it.name) + '</span><em>' +
            esc(it.note || langLevelText(it.level, cv.lang)) + '</em></div>';
        }).join('') + '</div>')
      : '';

    /* معلومات إضافية: نقاط مدمجة */
    var ready = (e.readiness || []).filter(Boolean);
    var readyHtml = ready.length
      ? sec(cv.lang === 'ar' ? 'معلومات إضافية' : 'Additional Information',
        '<ul class="pro-ready">' + ready.map(function (r) {
          return '<li>' + esc(r) + '</li>';
        }).join('') + '</ul>')
      : '';

    var foot = '<footer class="pro-foot">' +
      (e.footerNote ? '<span>' + esc(e.footerNote) + '</span>' : '') +
      (p.phone ? '<span class="pro-foot-phone"><bdi dir="ltr">' + esc(p.phone) + '</bdi></span>' : '') +
      '</footer>';

    return '<div class="cv-page tpl-pro" dir="' + (cv.lang === 'en' ? 'ltr' : 'rtl') +
      '" style="--cv-accent:' + esc(cv.accent || '#2f4f8f') +
      ';--cv-accent2:' + esc(cv.accent2 || '#c9a227') + '">' +
      head + sum + skillsHtml + exp + edu + certs + langsHtml + readyHtml + foot +
      '</div>';
  }

  /* ----------------------- main renderer ----------------------- */
  function renderCv(cv, tplId) {
    cv = cv || {};
    var tpl = tplId || cv.template || 'modern';
    var lang = cv.lang === 'en' ? 'en' : 'ar';
    var L = LABELS[lang];
    var p = cv.personal || {};
    var dir = lang === 'ar' ? 'rtl' : 'ltr';
    var accent = cv.accent || ACCENTS[0];
    var accent2 = cv.accent2 || '#c9a227';

    var name = (p.fullName || '').trim() || (lang === 'ar' ? 'الاسم الكامل' : 'Your Name');
    var title = (p.jobTitle || '').trim();
    var photo = p.photo ? '<img class="cv-photo" src="' + p.photo + '" alt="">' : '';
    var contact = contactHtml(p);

    var nameEl = '<h1 class="cv-name">' + esc(name) + '</h1>';
    var roleEl = title ? '<div class="cv-role">' + esc(title) + '</div>' : '';

    var sum = summaryHtml(cv, L);
    var exp = experienceHtml(cv, L);
    var edu = educationHtml(cv, L);
    var proj = projectsHtml(cv, L);
    var certs = certsHtml(cv, L);
    var skillsSide = skillsSideHtml(cv);
    var langsSide = languagesSideHtml(cv, L);

    if (tpl === 'profile' || tpl === 'profile-light') {
      return profileHtml(cv, L, tpl === 'profile-light');
    }

    if (tpl === 'ats' || tpl === 'ats-modern') {
      return atsHtml(cv, L, tpl === 'ats-modern');
    }

    if (tpl === 'elite' && window.CV_ELITE) {
      return window.CV_ELITE.render(cv);
    }

    if (tpl === 'pro') {
      return proHtml(cv, L);
    }

    var open = '<div class="cv-page tpl-' + tpl + '" dir="' + dir + '" style="--cv-accent:' + esc(accent) +
      ';--cv-accent2:' + esc(accent2) + '">';

    if (tpl === 'classic') {
      var skillsC = (cv.skills || []).filter(function (x) { return x && x.name; }).length ? skillsGridHtml(cv, L) : '';
      var langsC = (cv.languages || []).filter(function (x) { return x && x.name; }).length ? languagesGridHtml(cv, L) : '';
      return open +
        '<header class="cv-head">' + photo + nameEl + roleEl + contact + '</header>' +
        sum + exp + edu + skillsC + langsC + proj + certs +
        '</div>';
    }

    if (tpl === 'minimal') {
      return open +
        '<header class="cv-head">' +
          '<div class="cv-head-txt">' + nameEl + roleEl + '</div>' + photo +
        '</header>' +
        contact +
        sum + exp + edu + skillsChipsHtml(cv, L) + languagesChipsHtml(cv, L) + proj + certs +
        '</div>';
    }

    if (tpl === 'elegant') {
      return open +
        '<header class="cv-hero">' +
          '<div class="cv-hero-txt">' + nameEl + roleEl + contact + '</div>' + photo +
        '</header>' +
        '<div class="cv-body">' +
          '<div class="col-main">' + sum + exp + proj + certs + '</div>' +
          '<aside class="col-side">' +
            (skillsSide ? '<section class="cv-sec"><h2 class="cv-h">' + esc(L.skills) + '</h2>' + skillsSide + '</section>' : '') +
            (langsSide ? '<section class="cv-sec"><h2 class="cv-h">' + esc(L.languages) + '</h2>' + langsSide + '</section>' : '') +
            edu +
          '</aside>' +
        '</div>' +
        '</div>';
    }

    /* modern (default) */
    return open +
      '<aside class="cv-side">' +
        '<div class="cv-id">' + photo + nameEl + roleEl + '</div>' +
        (contact ? '<div class="cv-block"><h2 class="side-h">' + esc(L.contact) + '</h2>' + contact + '</div>' : '') +
        (skillsSide ? '<div class="cv-block"><h2 class="side-h">' + esc(L.skills) + '</h2>' + skillsSide + '</div>' : '') +
        (langsSide ? '<div class="cv-block"><h2 class="side-h">' + esc(L.languages) + '</h2>' + langsSide + '</div>' : '') +
      '</aside>' +
      '<div class="cv-main">' + sum + exp + edu + proj + certs + '</div>' +
      '</div>';
  }

  /* ------------------------- factories ------------------------- */
  function emptyCv(o) {
    o = o || {};
    return {
      id: uid(),
      name: o.name || 'سيرة ذاتية جديدة',
      template: o.template || 'modern',
      accent: o.accent || ACCENTS[0],
      accent2: o.accent2 || '#c9a227',
      lang: o.lang === 'en' ? 'en' : 'ar',
      created: Date.now(),
      updated: Date.now(),
      personal: {
        fullName: '', jobTitle: '', email: '', phone: '', city: '',
        website: '', linkedin: '', github: '', behance: '', x: '', summary: '', photo: ''
      },
      extra: {
        mini: '', english: '', intro: '', highlights: [],
        offerTitle: '', offerItems: [], processTitle: '', process: [],
        gridTitle: '', grid: [], tools: [], readinessTitle: '', readiness: [],
        footerNote: '', whatsapp: ''
      },
      experience: [],
      education: [],
      skills: [],
      languages: [],
      projects: [],
      certifications: []
    };
  }

  function demoCvs() {
    var ar = emptyCv({
      name: 'أحمد العلي — مهندس برمجيات',
      template: 'modern', accent: '#2f4f8f', lang: 'ar'
    });
    ar.personal = {
      fullName: 'أحمد محمد العلي',
      jobTitle: 'مهندس برمجيات أول',
      email: 'ahmed.ali@example.com',
      phone: '+966 55 123 4567',
      city: 'الرياض، السعودية',
      website: 'ahmedali.dev',
      linkedin: 'linkedin.com/in/ahmedali',
      github: 'github.com/ahmedali',
      behance: '',
      x: '',
      summary: 'مهندس برمجيات بخبرة تزيد على 7 سنوات في بناء تطبيقات الويب والخدمات السحابية. متخصص في تحسين أداء الأنظمة وتصميم واجهات برمجية قابلة للتوسّع، مع سجل حافل في قيادة فرق تقنية صغيرة وتسليم المشاريع في مواعيدها.',
      photo: ''
    };
    ar.experience = [
      {
        role: 'مهندس برمجيات أول', company: 'شركة حلول التقنية — الرياض',
        start: '2021', end: '', current: true,
        description: 'قادت فريقًا من 5 مهندسين لبناء منصة خدمات مالية تخدم أكثر من 200 ألف مستخدم.\nخفّضت زمن استجابة واجهات البرمجة بنسبة 45% عبر إعادة هيكلة الاستعلامات والتخزين المؤقت.\nأشرفت على الانتقال إلى بنية خدمات مصغّرة على Kubernetes.'
      },
      {
        role: 'مهندس برمجيات', company: 'منصة نُظم — جدة',
        start: '2018', end: '2021', current: false,
        description: 'طوّرت لوحة تحكم لإدارة المخزون باستخدام React وNode.js.\nأتمتت تقارير المبيعات الأسبوعية ووفّرت 12 ساعة عمل شهريًا لكل فرع.\nشاركت في بناء نظام اختبارات آلي رفع تغطية الاختبارات إلى 80%.'
      }
    ];
    ar.education = [
      { degree: 'بكالوريوس علوم الحاسب', school: 'جامعة الملك سعود', start: '2014', end: '2018', current: false, note: 'تقدير ممتاز — مرتبة الشرف' }
    ];
    ar.skills = [
      { name: 'JavaScript / TypeScript', level: 5 },
      { name: 'React & Next.js', level: 5 },
      { name: 'Node.js / NestJS', level: 4 },
      { name: 'قواعد البيانات (PostgreSQL)', level: 4 },
      { name: 'Docker و Kubernetes', level: 3 },
      { name: 'تصميم واجهات البرمجة REST / GraphQL', level: 4 }
    ];
    ar.languages = [
      { name: 'العربية', level: 5 },
      { name: 'الإنجليزية', level: 4 }
    ];
    ar.projects = [
      { name: 'منصة تحليلات مفتوحة المصدر', link: 'github.com/ahmedali/analytics', description: 'أداة خفيفة لعرض مؤشرات الأداء مباشرة من قواعد البيانات، تجاوزت 1.2 ألف نجمة على GitHub.' }
    ];
    ar.certifications = [
      { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2023' }
    ];

    var en = emptyCv({
      name: 'Sarah Mitchell — Product Designer',
      template: 'elegant', accent: '#1f6f5c', lang: 'en'
    });
    en.personal = {
      fullName: 'Sarah J. Mitchell',
      jobTitle: 'Senior Product Designer',
      email: 'sarah.mitchell@example.com',
      phone: '+1 (415) 555-0142',
      city: 'San Francisco, CA',
      website: 'sarahmitchell.design',
      linkedin: 'linkedin.com/in/sarahmitchell',
      github: '',
      behance: 'behance.net/sarahmitchell',
      x: 'x.com/sarahmitchell',
      summary: 'Product designer with 8 years of experience shaping consumer and B2B products. I turn messy problems into clear, accessible interfaces and partner closely with engineering to ship measurable outcomes.',
      photo: ''
    };
    en.experience = [
      {
        role: 'Senior Product Designer', company: 'Northwind Labs',
        start: '2021', end: '', current: true,
        description: 'Led end-to-end design for a subscription platform serving 400k users.\nRebuilt onboarding flow that lifted activation by 32%.\nIntroduced a shared component library adopted by 4 product teams.'
      },
      {
        role: 'Product Designer', company: 'Brightline Studio',
        start: '2017', end: '2021', current: false,
        description: 'Designed dashboards and mobile experiences for fintech and health clients.\nRan weekly usability sessions and turned findings into roadmap items.'
      }
    ];
    en.education = [
      { degree: 'BFA, Interaction Design', school: 'California College of the Arts', start: '2011', end: '2015', current: false, note: 'Graduated with honors' }
    ];
    en.skills = [
      { name: 'Figma & design systems', level: 5 },
      { name: 'User research', level: 4 },
      { name: 'Prototyping', level: 5 },
      { name: 'Accessibility (WCAG)', level: 4 },
      { name: 'HTML / CSS basics', level: 3 }
    ];
    en.languages = [
      { name: 'English', level: 5 },
      { name: 'Spanish', level: 3 }
    ];
    en.projects = [
      { name: 'Open design kit', link: 'figma.com/@sarahmitchell', description: 'A free UI kit for early-stage founders with 12k community downloads.' }
    ];
    en.certifications = [
      { name: 'Google UX Design Certificate', issuer: 'Google', year: '2022' }
    ];

    return [ar, en];
  }

  window.CV = {
    ACCENTS: ACCENTS,
    TEMPLATES: TEMPLATES,
    LABELS: LABELS,
    I18N: I18N,
    LEVELS: LEVELS,
    LANG_LEVELS: LANG_LEVELS,
    THEMES: THEMES,
    esc: esc,
    uid: uid,
    ico: ico,
    prettyUrl: prettyUrl,
    levelText: levelText,
    langLevelText: langLevelText,
    dots: dots,
    renderCv: renderCv,
    emptyCv: emptyCv,
    demoCvs: demoCvs,
    themeFor: function (accent) {
      var t = THEMES.filter(function (x) { return x.a === accent; })[0] || THEMES[0];
      return t;
    },
    isAts: function (id) {
      var t = TEMPLATES.filter(function (x) { return x.id === id; })[0];
      return !!(t && t.ats);
    },
    templateName: function (id, lang) {
      var t = TEMPLATES.filter(function (x) { return x.id === id; })[0] || TEMPLATES[0];
      return t.name[lang] || t.name.ar;
    }
  };
})();
