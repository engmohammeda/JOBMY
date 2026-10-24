/* =========================================================
   سيرتي — export.js
   تصدير السيرة: PDF (طباعة)، Word (.docx)، PNG، HTML، TXT، JSON
   يعمل بالكامل داخل المتصفح دون أي مكتبات خارجية
   ========================================================= */
(function () {
  'use strict';

  var CV = window.CV;

  /* ------------------------- download ------------------------- */
  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1500);
  }

  function slug(s) {
    var out = String(s || 'cv').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-');
    return out.slice(0, 60) || 'cv';
  }

  function baseName(cv) {
    return slug(cv.name || (cv.personal && cv.personal.fullName) || 'cv');
  }

  function cvCss() {
    var el = document.getElementById('cv-styles');
    return el ? el.textContent : '';
  }

  function waitForImages(root) {
    var imgs = Array.prototype.slice.call(root.querySelectorAll('img'));
    return Promise.all(imgs.map(function (img) {
      if (img.complete) return Promise.resolve();
      return new Promise(function (res) { img.onload = res; img.onerror = res; });
    }));
  }

  /* ---------------------------- PNG ---------------------------- */
  function png(pageEl, cv) {
    return new Promise(function (resolve, reject) {
      var stage = document.createElement('div');
      stage.style.cssText = 'position:fixed;left:-12000px;top:0;width:210mm;background:#fff;pointer-events:none;z-index:-1';
      var clone = pageEl.cloneNode(true);
      clone.style.boxShadow = 'none';
      clone.style.borderRadius = '0';
      roundPhoto(clone);
      stage.appendChild(clone);
      document.body.appendChild(stage);

      waitForImages(clone).then(function () {
        return new Promise(function (r) { setTimeout(r, 30); });
      }).then(function () {
        var w = Math.ceil(clone.offsetWidth);
        var h = Math.ceil(clone.offsetHeight);
        if (!w || !h) throw new Error('empty');

        var styleEl = document.createElement('style');
        styleEl.textContent = cvCss();
        clone.insertBefore(styleEl, clone.firstChild);

        var xhtml = new XMLSerializer().serializeToString(clone);
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" ' +
          'viewBox="0 0 ' + w + ' ' + h + '">' +
          '<foreignObject x="0" y="0" width="' + w + '" height="' + h + '">' + xhtml + '</foreignObject></svg>';

        return new Promise(function (res, rej) {
          var img = new Image();
          img.onload = function () { res({ img: img, w: w, h: h }); };
          img.onerror = function () { rej(new Error('svg-render')); };
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        });
      }).then(function (data) {
        var scale = 2;
        var maxSide = 16000;
        if (data.h * scale > maxSide) scale = maxSide / data.h;
        if (data.w * scale > maxSide) scale = Math.min(scale, maxSide / data.w);

        var canvas = document.createElement('canvas');
        canvas.width = Math.round(data.w * scale);
        canvas.height = Math.round(data.h * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(data.img, 0, 0);

        return new Promise(function (res, rej) {
          canvas.toBlob(function (blob) {
            if (!blob) { rej(new Error('toBlob')); return; }
            download(blob, baseName(cv) + '.png');
            res();
          }, 'image/png');
        });
      }).then(function () {
        stage.remove();
        resolve();
      }).catch(function (err) {
        stage.remove();
        reject(err);
      });
    });
  }

  /* يجعل الصورة دائرية داخل الـ canvas عند التصدير (Chrome لا يقصّ border-radius دائمًا) */
  function roundPhoto(root) {
    var imgs = root.querySelectorAll('.cv-photo');
    Array.prototype.forEach.call(imgs, function (img) {
      var nw = img.naturalWidth, nh = img.naturalHeight;
      if (!nw || !nh) return;
      try {
        var size = 512;
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        var s = Math.max(size / nw, size / nh);
        var dw = nw * s, dh = nh * s;
        ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
        ctx.restore();
        img.src = canvas.toDataURL('image/png');
        var radius = getComputedStyle(img).borderRadius;
        if (radius && radius !== '50%') {
          img.style.borderRadius = '0';
        } else {
          img.style.borderRadius = '50%';
        }
      } catch (e) { /* ignore */ }
    });
  }

  /* ---------------------------- HTML ---------------------------- */
  function html(cv) {
    var lang = cv.lang === 'en' ? 'en' : 'ar';
    var dir = lang === 'ar' ? 'rtl' : 'ltr';
    var body = CV.renderCv(cv);
    var doc = '<!doctype html>\n<html lang="' + lang + '" dir="' + dir + '">\n<head>\n' +
      '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      '<title>' + CV.esc(cv.name || 'CV') + '</title>\n<style>\n' + cvCss() + '\n' +
      'html,body{margin:0;padding:0;background:#eef1f7}\n' +
      'body{display:flex;justify-content:center;padding:24px 12px}\n' +
      '.cv-page{box-shadow:0 16px 40px rgba(16,24,40,.18)}\n' +
      '@media print{@page{size:A4;margin:0}body{padding:0;background:#fff;display:block}' +
      '.cv-page{box-shadow:none!important;border-radius:0!important}}\n' +
      '</style>\n</head>\n<body>\n' + body + '\n</body>\n</html>';
    download(new Blob([doc], { type: 'text/html;charset=utf-8' }), baseName(cv) + '.html');
  }

  /* ---------------------------- TXT ---------------------------- */
  function txt(cv) {
    var lang = cv.lang === 'en' ? 'en' : 'ar';
    var L = CV.LABELS[lang];
    var p = cv.personal || {};
    var lines = [];
    var contact = [p.phone, p.email, p.city, p.website, p.linkedin, p.github, p.behance, p.x]
      .filter(Boolean).join(' | ');

    lines.push((p.fullName || '').toUpperCase());
    if (p.jobTitle) lines.push(p.jobTitle);
    if (contact) lines.push(contact);
    lines.push('');

    if (p.summary) {
      lines.push(L.summary.toUpperCase());
      lines.push(p.summary);
      lines.push('');
    }

    var e = cv.extra || {};
    var ar = lang === 'ar';
    function extraSection(title, rows) {
      if (!rows.length) return;
      lines.push(String(title).toUpperCase());
      rows.forEach(function (r) { lines.push('  - ' + r); });
      lines.push('');
    }
    extraSection(e.offerTitle || (ar ? 'ما أقدمه' : 'What I offer'),
      (e.offerItems || []).filter(Boolean));
    extraSection(e.processTitle || (ar ? 'خطوات العمل' : 'Process'),
      (e.process || []).map(function (s) { return [s && s.title, s && s.desc].filter(Boolean).join(': '); }));
    extraSection(e.gridTitle || (ar ? 'إضافات' : 'Highlights'),
      (e.grid || []).map(function (s) { return [s && s.title, s && s.desc].filter(Boolean).join(': '); }));
    if ((e.tools || []).length) {
      lines.push((ar ? 'الأدوات' : 'TOOLS').toUpperCase());
      lines.push(e.tools.join(' · '));
      lines.push('');
    }
    extraSection(e.readinessTitle || (ar ? 'الجاهزية' : 'Readiness'),
      (e.readiness || []).filter(Boolean));

    if ((cv.experience || []).length) {
      lines.push(L.experience.toUpperCase());
      (cv.experience || []).forEach(function (it) {
        var range = [it.start, it.current ? L.present : it.end].filter(Boolean).join(' — ');
        lines.push((it.role || '') + (range ? '  (' + range + ')' : ''));
        if (it.company) lines.push('  ' + it.company);
        String(it.description || '').split(/\r?\n/).filter(Boolean).forEach(function (d) {
          lines.push('   - ' + d.replace(/^\s*[-•*]\s*/, ''));
        });
        lines.push('');
      });
    }
    if ((cv.education || []).length) {
      lines.push(L.education.toUpperCase());
      (cv.education || []).forEach(function (it) {
        var range = [it.start, it.current ? L.present : it.end].filter(Boolean).join(' — ');
        lines.push((it.degree || '') + (range ? '  (' + range + ')' : ''));
        if (it.school) lines.push('  ' + it.school);
        if (it.note) lines.push('  ' + it.note);
        lines.push('');
      });
    }
    if ((cv.skills || []).length) {
      lines.push(L.skills.toUpperCase());
      lines.push((cv.skills || []).filter(function (s) { return s.name; }).map(function (s) {
        return s.name + ' (' + CV.levelText(s.level, lang) + ')';
      }).join(' · '));
      lines.push('');
    }
    if ((cv.languages || []).length) {
      lines.push(L.languages.toUpperCase());
      lines.push((cv.languages || []).filter(function (s) { return s.name; }).map(function (s) {
        return s.name + ' (' + CV.langLevelText(s.level, lang) + ')';
      }).join(' · '));
      lines.push('');
    }
    if ((cv.projects || []).length) {
      lines.push(L.projects.toUpperCase());
      (cv.projects || []).forEach(function (it) {
        lines.push((it.name || '') + (it.link ? ' — ' + it.link : ''));
        if (it.description) lines.push('  ' + it.description);
        lines.push('');
      });
    }
    if ((cv.certifications || []).length) {
      lines.push(L.certifications.toUpperCase());
      (cv.certifications || []).forEach(function (it) {
        lines.push([it.name, it.issuer, it.year].filter(Boolean).join(' — '));
      });
      lines.push('');
    }

    download(new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' }), baseName(cv) + '.txt');
  }

  /* ---------------------------- DOCX ---------------------------- */
  var crcTable = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function zipStore(files) {
    var enc = new TextEncoder();
    var parts = [];
    var central = [];
    var offset = 0;

    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var data = f.data;
      var crc = crc32(data);

      var local = new Uint8Array(30 + nameBytes.length);
      var dv = new DataView(local.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, 0x0800, true);
      dv.setUint16(8, 0, true);
      dv.setUint16(10, 0, true);
      dv.setUint16(12, 0x21, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, data.length, true);
      dv.setUint32(22, data.length, true);
      dv.setUint16(26, nameBytes.length, true);
      dv.setUint16(28, 0, true);
      local.set(nameBytes, 30);
      parts.push(local, data);

      var cd = new Uint8Array(46 + nameBytes.length);
      var cv2 = new DataView(cd.buffer);
      cv2.setUint32(0, 0x02014b50, true);
      cv2.setUint16(4, 20, true);
      cv2.setUint16(6, 20, true);
      cv2.setUint16(8, 0x0800, true);
      cv2.setUint16(10, 0, true);
      cv2.setUint16(12, 0, true);
      cv2.setUint16(14, 0x21, true);
      cv2.setUint32(16, crc, true);
      cv2.setUint32(20, data.length, true);
      cv2.setUint32(24, data.length, true);
      cv2.setUint16(28, nameBytes.length, true);
      cv2.setUint16(30, 0, true);
      cv2.setUint16(32, 0, true);
      cv2.setUint16(34, 0, true);
      cv2.setUint16(36, 0, true);
      cv2.setUint32(38, 0, true);
      cv2.setUint32(42, offset, true);
      cd.set(nameBytes, 46);
      central.push(cd);

      offset += local.length + data.length;
    });

    var cdSize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var eocd = new Uint8Array(22);
    var ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob(parts.concat(central, [eocd]), {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }

  function xesc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function dataUrlToBytes(url) {
    var m = /^data:([^;]+);base64,(.*)$/.exec(url || '');
    if (!m) return null;
    try {
      var bin = atob(m[2]);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { mime: m[1], bytes: bytes };
    } catch (e) { return null; }
  }

  function docx(cv) {
    var lang = cv.lang === 'en' ? 'en' : 'ar';
    var L = CV.LABELS[lang];
    var rtl = lang === 'ar';
    var accent = String(cv.accent || '#2f4f8f').replace('#', '').toUpperCase();
    var p = cv.personal || {};
    var FONT = 'w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Arial"';

    function run(text, o) {
      o = o || {};
      if (text == null || text === '') return '';
      var r = '<w:rFonts ' + FONT + '/>';
      if (o.bold) r += '<w:b/><w:bCs/>';
      if (o.italic) r += '<w:i/><w:iCs/>';
      if (o.caps) r += '<w:caps/>';
      if (o.color) r += '<w:color w:val="' + o.color + '"/>';
      r += '<w:sz w:val="' + (o.size || 20) + '"/><w:szCs w:val="' + (o.size || 20) + '"/>';
      if (rtl) r += '<w:rtl/>';
      return '<w:r><w:rPr>' + r + '</w:rPr><w:t xml:space="preserve">' + xesc(text) + '</w:t></w:r>';
    }

    function para(content, o) {
      o = o || {};
      var pr = '';
      if (o.border) pr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="D9DEE7"/></w:pBdr>';
      if (rtl) pr += '<w:bidi/>';
      pr += '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '" w:line="264" w:lineRule="auto"/>';
      if (o.indent) {
        pr += rtl ? '<w:ind w:right="' + o.indent + '" w:hanging="' + o.indent + '"/>'
                  : '<w:ind w:left="' + o.indent + '" w:hanging="' + o.indent + '"/>';
      }
      if (o.align) pr += '<w:jc w:val="' + o.align + '"/>';
      return '<w:p>' + (pr ? '<w:pPr>' + pr + '</w:pPr>' : '') + (content || '') + '</w:p>';
    }

    function heading(text) {
      return para(run(text, { bold: true, caps: true, color: accent, size: 20 }),
        { before: 280, after: 110, border: true });
    }

    var contactText = [p.phone, p.email, p.city, p.website, p.linkedin, p.github, p.behance, p.x]
      .filter(Boolean).join('   •   ');
    var name = p.fullName || (rtl ? 'الاسم الكامل' : 'Your Name');
    var title = p.jobTitle || '';

    var photo = p.photo && !CV.isAts(cv.template) ? dataUrlToBytes(p.photo) : null;
    var photoExt = photo ? (photo.mime === 'image/png' ? 'png' : 'jpeg') : '';
    var photoRel = photo ? 'rIdPhoto' : '';
    var body = '';

    var drawing = '';
    if (photo) {
      drawing = '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
        '<wp:extent cx="1200000" cy="1200000"/>' +
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
        '<wp:docPr id="1" name="CV Photo"/>' +
        '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:pic>' +
        '<pic:nvPicPr><pic:cNvPr id="2" name="photo.' + photoExt + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="' + photoRel + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1200000" cy="1200000"/></a:xfrm>' +
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
        '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    }

    if (photo) {
      body += '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>' +
        '<w:tblLayout w:type="fixed"/><w:tblCellMar>' +
        '<w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/>' +
        '<w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
        '<w:tblGrid><w:gridCol w:w="7600"/><w:gridCol w:w="2300"/></w:tblGrid><w:tr>' +
        '<w:tc><w:tcPr><w:tcW w:w="7600" w:type="dxa"/></w:tcPr>' +
        para(run(name, { bold: true, size: 40, color: '1F2533' }), { after: 40 }) +
        (title ? para(run(title, { bold: true, size: 24, color: accent }), { after: 60 }) : '') +
        (contactText ? para(run(contactText, { size: 17, color: '5A6473' }), { after: 0 }) : '') +
        '</w:tc>' +
        '<w:tc><w:tcPr><w:tcW w:w="2300" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>' +
        '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>' + drawing + '</w:p>' +
        '</w:tc></w:tr></w:tbl>' +
        para('', { after: 40 });
    } else {
      body += para(run(name, { bold: true, size: 40, color: '1F2533' }), { after: 40 });
      if (title) body += para(run(title, { bold: true, size: 24, color: accent }), { after: 60 });
      if (contactText) body += para(run(contactText, { size: 17, color: '5A6473' }), { after: 100 });
    }

    if (p.summary) {
      body += heading(L.summary);
      String(p.summary).split(/\r?\n/).filter(Boolean).forEach(function (line) {
        body += para(run(line, { size: 20 }), { after: 40, align: 'both' });
      });
    }

    var e = cv.extra || {};
    var offerItems = (e.offerItems || []).filter(Boolean);
    if (offerItems.length) {
      body += heading(e.offerTitle || (rtl ? 'ما أقدمه' : 'What I offer'));
      offerItems.forEach(function (it) {
        body += para(run('•   ' + it, { size: 19 }), { after: 30, indent: 340 });
      });
    }

    var process = (e.process || []).filter(function (s) { return s && (s.title || s.desc); });
    if (process.length) {
      body += heading(e.processTitle || (rtl ? 'خطوات العمل' : 'Process'));
      process.forEach(function (s, i) {
        body += para(
          run(('0' + (i + 1)).slice(-2) + '   ' + (s.title || ''), { bold: true, size: 19 }) +
          (s.desc ? run(' — ' + s.desc, { size: 18, color: '5A6473' }) : ''),
          { after: 30 });
      });
    }

    var grid = (e.grid || []).filter(function (s) { return s && (s.title || s.desc); });
    if (grid.length) {
      body += heading(e.gridTitle || (rtl ? 'إضافات' : 'Highlights'));
      grid.forEach(function (s) {
        body += para(
          run(s.title || '', { bold: true, size: 19 }) +
          (s.desc ? run(' — ' + s.desc, { size: 18, color: '5A6473' }) : ''),
          { after: 30 });
      });
    }

    if ((e.tools || []).length) {
      body += heading(rtl ? 'الأدوات' : 'Tools');
      body += para(run(e.tools.join('   ·   '), { size: 19 }), { after: 60 });
    }

    var ready = (e.readiness || []).filter(Boolean);
    if (ready.length) {
      body += heading(e.readinessTitle || (rtl ? 'الجاهزية' : 'Readiness'));
      ready.forEach(function (it) {
        body += para(run('•   ' + it, { size: 19 }), { after: 30, indent: 340 });
      });
    }


    var exp = (cv.experience || []).filter(function (x) { return x && (x.role || x.company || x.description); });
    if (exp.length) {
      body += heading(L.experience);
      exp.forEach(function (it) {
        var range = [it.start, it.current ? L.present : it.end].filter(Boolean).join(' — ');
        body += para(
          run(it.role || '', { bold: true, size: 21 }) +
          (range ? run('   •   ' + range, { size: 17, color: '5A6473' }) : ''),
          { before: 100, after: 20 });
        if (it.company) body += para(run(it.company, { bold: true, size: 19, color: accent }), { after: 40 });
        String(it.description || '').split(/\r?\n/).map(function (s) {
          return s.replace(/^\s*[-•*·]\s*/, '').trim();
        }).filter(Boolean).forEach(function (line) {
          body += para(run('•   ' + line, { size: 19 }), { after: 30, indent: 340 });
        });
      });
    }

    var edu = (cv.education || []).filter(function (x) { return x && (x.degree || x.school || x.note); });
    if (edu.length) {
      body += heading(L.education);
      edu.forEach(function (it) {
        var range = [it.start, it.current ? L.present : it.end].filter(Boolean).join(' — ');
        body += para(
          run(it.degree || '', { bold: true, size: 21 }) +
          (range ? run('   •   ' + range, { size: 17, color: '5A6473' }) : ''),
          { before: 80, after: 20 });
        if (it.school) body += para(run(it.school, { bold: true, size: 19, color: accent }), { after: 30 });
        if (it.note) body += para(run(it.note, { size: 19 }), { after: 30 });
      });
    }

    var skills = (cv.skills || []).filter(function (s) { return s && s.name; });
    if (skills.length) {
      body += heading(L.skills);
      body += para(skills.map(function (s) {
        return run(s.name, { bold: true, size: 19 }) +
          run('  (' + CV.levelText(s.level, lang) + ')', { size: 17, color: '5A6473' });
      }).join(run('   ·   ', { size: 18, color: '9AA3B0' })), { after: 60 });
    }

    var langs = (cv.languages || []).filter(function (s) { return s && s.name; });
    if (langs.length) {
      body += heading(L.languages);
      body += para(langs.map(function (s) {
        return run(s.name, { bold: true, size: 19 }) +
          run('  (' + CV.langLevelText(s.level, lang) + ')', { size: 17, color: '5A6473' });
      }).join(run('   ·   ', { size: 18, color: '9AA3B0' })), { after: 60 });
    }

    var proj = (cv.projects || []).filter(function (x) { return x && (x.name || x.description || x.link); });
    if (proj.length) {
      body += heading(L.projects);
      proj.forEach(function (it) {
        body += para(
          run(it.name || '', { bold: true, size: 21 }) +
          (it.link ? run('   •   ' + it.link, { size: 16, color: '5A6473' }) : ''),
          { before: 80, after: 20 });
        if (it.description) body += para(run(it.description, { size: 19 }), { after: 40 });
      });
    }

    var certs = (cv.certifications || []).filter(function (x) { return x && (x.name || x.issuer); });
    if (certs.length) {
      body += heading(L.certifications);
      certs.forEach(function (it) {
        body += para(
          run(it.name || '', { bold: true, size: 19 }) +
          (it.issuer ? run('   •   ' + it.issuer, { size: 17, color: '5A6473' }) : '') +
          (it.year ? run('   •   ' + it.year, { size: 17, color: '5A6473' }) : ''),
          { after: 30 });
      });
    }

    var sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" ' +
      'w:header="500" w:footer="500" w:gutter="0"/>' + (rtl ? '<w:bidi/>' : '') + '</w:sectPr>';

    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<w:body>' + body + sect + '</w:body></w:document>';

    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      (photo ? '<Default Extension="' + photoExt + '" ContentType="' + photo.mime + '"/>' : '') +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>';

    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>';

    var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      (photo ? '<Relationship Id="rIdPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo.' + photoExt + '"/>' : '') +
      '</Relationships>';

    var enc = new TextEncoder();
    var files = [
      { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
      { name: '_rels/.rels', data: enc.encode(rootRels) },
      { name: 'word/document.xml', data: enc.encode(documentXml) },
      { name: 'word/_rels/document.xml.rels', data: enc.encode(docRels) }
    ];
    if (photo) files.push({ name: 'word/media/photo.' + photoExt, data: photo.bytes });

    download(zipStore(files), baseName(cv) + '.docx');
  }

  /* ---------------------------- JSON ---------------------------- */
  function jsonBackup(cvs) {
    var payload = {
      app: 'sirati-cv',
      version: 1,
      exportedAt: new Date().toISOString(),
      cvs: cvs
    };
    download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      'sirati-backup-' + new Date().toISOString().slice(0, 10) + '.json');
  }

  window.Exporter = {
    png: png,
    html: html,
    txt: txt,
    docx: docx,
    jsonBackup: jsonBackup,
    download: download,
    slug: slug
  };
})();
