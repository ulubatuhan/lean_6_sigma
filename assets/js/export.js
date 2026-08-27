/* ==========================================================================
   Yepas Lean 6 Sigma — çıktı alma: PDF (yazdırma), Word (.doc), JSON
   ========================================================================== */

window.Y6S = window.Y6S || {};

(function (Y) {
  'use strict';

  /* ---------------------------------------------------------------- PDF */

  function setPageSize(orientation) {
    var st = document.getElementById('y6s-page-style');
    if (!st) {
      st = document.createElement('style');
      st.id = 'y6s-page-style';
      document.head.appendChild(st);
    }
    st.textContent = '@page { size: A4 ' + (orientation === 'landscape' ? 'landscape' : 'portrait') +
      '; margin: 10mm; }';
  }

  function mountPrintDoc(tpl, data, opts) {
    var root = document.getElementById('print-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'print-root';
      document.body.appendChild(root);
    }
    root.innerHTML = '';
    root.appendChild(Y.buildPrintDoc(tpl, data, opts));
    setPageSize(tpl.orientation);
    return root;
  }

  Y.exportPDF = function (tpl, data, opts) {
    mountPrintDoc(tpl, data, opts);
    var title = document.title;
    document.title = (opts && opts.title ? opts.title + ' — ' : '') + tpl.name;
    setTimeout(function () {
      window.print();
      setTimeout(function () { document.title = title; }, 800);
    }, 120);
  };

  Y.previewDoc = function (tpl, data, opts) {
    var stage = Y.buildPrintDoc(tpl, data, opts);
    Y.modal({
      title: 'Çıktı Önizleme — ' + tpl.name,
      wide: true, flat: true,
      body: stage,
      actions: [
        { label: 'Kapat', class: 'btn-ghost' },
        '-',
        { label: 'Word (.doc)', icon: 'word', onClick: function () { Y.exportWord(tpl, data, opts); return false; } },
        { label: 'PDF olarak yazdır', class: 'btn-primary', icon: 'print',
          onClick: function () { Y.exportPDF(tpl, data, opts); return false; } }
      ]
    });
  };

  /* ---------------------------------------------------------------- Word */

  function b64utf8(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    }
    return btoa(bin);
  }

  function chunk76(b64) {
    return (b64.match(/.{1,76}/g) || []).join('\r\n');
  }

  /** SVG düğümünü PNG data URL'e çevirir. */
  function svgToPng(svg, scale) {
    return new Promise(function (resolve) {
      try {
        var w = parseFloat(svg.getAttribute('width')) || 900;
        var h = parseFloat(svg.getAttribute('height')) || 600;
        var src = new XMLSerializer().serializeToString(svg);
        if (src.indexOf('xmlns=') < 0) {
          src = src.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        var url = 'data:image/svg+xml;base64,' + b64utf8(src);
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          c.width = Math.round(w * (scale || 2));
          c.height = Math.round(h * (scale || 2));
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          try { resolve({ url: c.toDataURL('image/png'), w: w, h: h }); }
          catch (e) { resolve(null); }
        };
        img.onerror = function () { resolve(null); };
        img.src = url;
      } catch (e) { resolve(null); }
    });
  }

  /** Flex kapsayıcıları Word'ün anladığı tablolara çevirir. */
  function flexToTable(root, selector, opts) {
    opts = opts || {};
    Array.prototype.slice.call(root.querySelectorAll(selector)).forEach(function (fx) {
      var kids = Array.prototype.slice.call(fx.children);
      if (!kids.length) { fx.parentNode.removeChild(fx); return; }
      var t = document.createElement('table');
      t.setAttribute('width', '100%');
      t.setAttribute('cellspacing', '0');
      t.setAttribute('cellpadding', '0');
      t.className = 'wlayout';
      var tb = document.createElement('tbody');
      var tr = document.createElement('tr');
      kids.forEach(function (k) {
        var td = document.createElement('td');
        td.style.verticalAlign = 'top';
        td.style.padding = opts.pad || '0 6pt 0 0';
        var basis = k.style && k.style.flexBasis;
        td.setAttribute('width', basis && basis.indexOf('%') > 0 ? basis : Math.floor(100 / kids.length) + '%');
        if (k.style) k.style.flexBasis = '';
        td.appendChild(k);
        tr.appendChild(td);
      });
      tb.appendChild(tr);
      t.appendChild(tb);
      fx.parentNode.replaceChild(t, fx);
    });
  }

  var WORD_CSS = [
    'body{font-family:"Segoe UI",Arial,sans-serif;font-size:10pt;color:#16202e;}',
    'table{border-collapse:collapse;}',
    'td,th{vertical-align:top;}',
    'table.wlayout,table.wlayout>tbody>tr>td{border:none;}',
    '.p-head-brand{background:#0e4d64;color:#fff;padding:6pt 8pt;}',
    '.p-head-brand .b1{font-size:13pt;font-weight:bold;}',
    '.p-head-brand .b2{font-size:6.5pt;letter-spacing:1pt;}',
    '.p-head-title{padding:6pt 8pt;}',
    '.p-head-title .t1{font-size:13pt;font-weight:bold;}',
    '.p-head-title .t2{font-size:8.5pt;color:#55637a;}',
    '.p-head-code{padding:6pt 8pt;font-size:7.5pt;color:#55637a;border-left:0.75pt solid #b9c3d1;}',
    '.p-head-code b{display:block;font-size:9pt;color:#16202e;}',
    'table.p-meta{width:100%;margin:0 0 8pt 0;font-size:8.5pt;}',
    'table.p-meta td{border:0.75pt solid #b9c3d1;padding:3pt 5pt;}',
    'table.p-meta td.k{background:#f4f7fa;font-weight:bold;color:#55637a;white-space:nowrap;}',
    '.p-sec{margin-bottom:9pt;}',
    '.p-sec-title{background:#0e4d64;color:#fff;font-size:9.5pt;font-weight:bold;padding:3pt 6pt;}',
    '.p-sec-title .n{display:none;}',
    '.p-sec-box{border:0.75pt solid #b9c3d1;padding:6pt;}',
    '.p-field{margin-bottom:6pt;}',
    '.p-field .lab{font-size:7.5pt;font-weight:bold;color:#55637a;text-transform:uppercase;}',
    '.p-field .val{font-size:9pt;border-bottom:0.5pt dotted #dde3ea;padding-bottom:2pt;}',
    '.p-field .val.empty{color:#a7b0bd;}',
    'table.p-tbl{width:100%;font-size:8.5pt;}',
    'table.p-tbl th{background:#0e4d64;color:#fff;border:0.75pt solid #0e4d64;padding:3pt 4pt;text-align:left;font-size:8pt;}',
    'table.p-tbl td{border:0.75pt solid #b9c3d1;padding:3pt 4pt;}',
    'table.p-tbl td.n{text-align:center;color:#55637a;}',
    'table.p-tbl td.d{white-space:nowrap;}',
    'table.p-why{width:100%;font-size:9pt;}',
    'table.p-why td{border:0.75pt solid #b9c3d1;padding:4pt 5pt;}',
    'table.p-why td.q{width:70pt;background:#f4f7fa;font-weight:bold;color:#0e4d64;}',
    '.p-pair h4{margin:0;padding:3pt 5pt;font-size:8.5pt;color:#fff;background:#0e4d64;}',
    '.p-pair .before h4{background:#b3261e;}',
    '.p-pair .after h4{background:#1c7c54;}',
    '.p-pair .pbody{border:0.75pt solid #b9c3d1;padding:5pt;}',
    '.p-pair .cap{font-size:8.5pt;}',
    '.p-diagram{text-align:center;margin:6pt 0;}',
    '.p-foot{margin-top:8pt;padding-top:3pt;border-top:0.75pt solid #b9c3d1;font-size:7.5pt;color:#55637a;}',
    '.p-cnx{display:inline-block;padding:0 3pt;border-radius:7pt;color:#fff;font-size:7.5pt;font-weight:bold;}',
    '.p-static{font-size:7.8pt;color:#55637a;border:0.5pt dashed #b9c3d1;padding:4pt 5pt;margin-bottom:6pt;}',
    '.p-static .cnx-legend-title{display:none;}',
    '.p-static .cnx-item{display:inline-block;margin-right:10pt;}',
    '.p-static .cnx-item b{display:inline-block;color:#fff;border-radius:6pt;padding:0 3pt;font-size:7.4pt;}',
    '.p-static .cnx-item strong{color:#16202e;}',
    'table.p-why .why-ev{margin-top:2pt;font-size:7.8pt;color:#55637a;border-left:0.75pt solid #b9c3d1;padding-left:4pt;}',
    '.diagram-label{display:none;}'
  ].join('\n');

  Y.exportWord = function (tpl, data, opts) {
    opts = opts || {};
    var stage = Y.buildPrintDoc(tpl, data, opts);
    var doc = stage.querySelector('.pdoc');
    var landscape = tpl.orientation === 'landscape';

    // Word'e uygun yapıya dönüştür
    flexToTable(doc, '.p-head', { pad: '0' });
    flexToTable(doc, '.p-a3', { pad: '0 8pt 0 0' });
    flexToTable(doc, '.p-pair', { pad: '0 6pt 0 0' });
    flexToTable(doc, '.p-cols', { pad: '0 8pt 0 0' });
    Array.prototype.slice.call(doc.querySelectorAll('table.wlayout')).forEach(function (t) {
      if (t.previousSibling === null && t.parentNode === doc) t.style.marginBottom = '8pt';
    });

    var parts = [];
    var svgs = Array.prototype.slice.call(doc.querySelectorAll('svg'));

    // Görseller MHTML parçasına taşınır. Gerçek <img> düğümü yerine yer tutucu
    // yorum satırı bırakılır; aksi halde tarayıcı henüz var olmayan dosyayı
    // indirmeye çalışır.
    function imgToken(name, w, h) {
      return document.createComment('Y6SIMG:' + name + ':' + Math.round(w) + ':' + Math.round(h));
    }

    Array.prototype.slice.call(doc.querySelectorAll('img')).forEach(function (im) {
      var src = im.getAttribute('src') || '';
      var m = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(src);
      if (!m || !im.parentNode) return;
      var name = 'image' + (parts.length + 1) + (m[1] === 'image/png' ? '.png' : '.jpg');
      parts.push({ name: name, type: m[1], b64: m[2] });
      // Yükseklik 0 bırakılır; Word en/boy oranını kendisi korur.
      im.parentNode.replaceChild(imgToken(name, 300, 0), im);
    });

    Promise.all(svgs.map(function (s) { return svgToPng(s, 2); })).then(function (pngs) {
      pngs.forEach(function (p, i) {
        var svg = svgs[i];
        if (!svg.parentNode) return;
        if (!p) { svg.parentNode.removeChild(svg); return; }
        var name = 'image' + (parts.length + 1) + '.png';
        parts.push({ name: name, type: 'image/png', b64: p.url.split(',')[1] });
        var maxW = landscape ? 660 : 470; // kullanılabilir sayfa genişliği (px)
        var w = Math.min(p.w, maxW);
        svg.parentNode.replaceChild(imgToken(name, w, p.h * (w / p.w)), svg);
      });

      // Yer tutucuları gerçek <img> etiketlerine çevir
      var inner = doc.innerHTML.replace(
        /<!--Y6SIMG:([^:>]+):(\d+):(\d+)-->/g,
        function (m, name, w, h) {
          return '<img src="' + name + '" width="' + w + '"' +
            (Number(h) > 0 ? ' height="' + h + '"' : '') + ' alt="">';
        }
      );

      var page = landscape
        ? 'size:29.7cm 21.0cm;mso-page-orientation:landscape;margin:1.0cm 1.0cm 1.0cm 1.0cm;'
        : 'size:21.0cm 29.7cm;margin:1.2cm 1.2cm 1.2cm 1.2cm;';

      var html =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
        '<title>' + Y.esc(opts.title || tpl.name) + '</title>' +
        '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>' +
        '<w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
        '<style>@page WordSection1{' + page + '}div.WordSection1{page:WordSection1;}\n' + WORD_CSS + '</style>' +
        '</head><body><div class="WordSection1">' + inner + '</div></body></html>';

      var B = '----=_NextPart_Y6S_01';
      var base = 'file:///C:/y6s/';
      var mht = 'MIME-Version: 1.0\r\n' +
        'Content-Type: multipart/related; type="text/html"; boundary="' + B + '"\r\n\r\n' +
        'This is a multi-part message in MIME format.\r\n\r\n' +
        '--' + B + '\r\n' +
        'Content-Location: ' + base + 'main.html\r\n' +
        'Content-Type: text/html; charset="utf-8"\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        chunk76(b64utf8(html)) + '\r\n\r\n';

      parts.forEach(function (p) {
        mht += '--' + B + '\r\n' +
          'Content-Location: ' + base + p.name + '\r\n' +
          'Content-Type: ' + p.type + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n\r\n' +
          chunk76(p.b64) + '\r\n\r\n';
      });
      mht += '--' + B + '--\r\n';

      var name = Y.slug(opts.title || tpl.name) + '-' + Y.todayISO() + '.doc';
      Y.download(new Blob([mht], { type: 'application/msword' }), name);
      Y.toast('Word belgesi indirildi: ' + name, 'ok');
    });
  };

  /* ---------------------------------------------------------------- JSON */

  Y.exportRecordJSON = function (rec, tpl) {
    var payload = {
      app: 'yepas-lean-6-sigma', version: 1,
      exportedAt: new Date().toISOString(),
      records: [rec]
    };
    var name = Y.slug(rec.title || (tpl && tpl.name) || 'kayit') + '-' + Y.todayISO() + '.json';
    Y.download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), name);
    Y.toast('JSON yedeği indirildi.', 'ok');
  };

  Y.exportAllJSON = function () {
    var payload = Y.Store.exportAll();
    if (!payload.records.length) { Y.toast('Yedeklenecek kayıt yok.', 'err'); return; }
    var name = 'yepas-lean6sigma-yedek-' + Y.todayISO() + '.json';
    Y.download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), name);
    Y.toast(payload.records.length + ' kayıt yedeklendi.', 'ok');
  };

  Y.importJSONFile = function (file, mode, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var n = Y.Store.importAll(JSON.parse(fr.result), mode);
        Y.toast(n + ' kayıt içe aktarıldı.', 'ok');
        cb(null, n);
      } catch (e) {
        Y.toast('Dosya okunamadı: ' + e.message, 'err');
        cb(e);
      }
    };
    fr.onerror = function () { Y.toast('Dosya okunamadı.', 'err'); cb(new Error('read')); };
    fr.readAsText(file);
  };

})(window.Y6S);
