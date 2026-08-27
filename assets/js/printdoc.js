/* ==========================================================================
   Yepas Lean 6 Sigma — çıktı belgesi üretimi (önizleme / PDF / Word ortak)
   ========================================================================== */

window.Y6S = window.Y6S || {};

(function (Y) {
  'use strict';

  var E = Y.esc;

  var WIDTH_PCT = { full: '100%', 'two-thirds': '64%', half: '48%', third: '31.5%', quarter: '23%' };

  function val(v) {
    var s = String(v == null ? '' : v).trim();
    return s ? '<div class="val">' + E(s) + '</div>' : '<div class="val empty">—</div>';
  }

  function fieldBlock(f, data) {
    var v = data[f.name];
    if (f.type === 'date') v = Y.fmtDate(v);
    return '<div class="p-field" style="flex-basis:' + (WIDTH_PCT[f.width || 'full'] || '100%') + '">' +
      (f.label ? '<div class="lab">' + E(f.label) + '</div>' : '') + val(v) + '</div>';
  }

  function isSimple(f) {
    return ['text', 'textarea', 'date', 'number', 'select'].indexOf(f.type) >= 0;
  }

  function rowHasData(row, cols) {
    for (var i = 0; i < cols.length; i++) {
      if (String(row[cols[i].name] || '').trim()) return true;
    }
    return false;
  }

  function tableBlock(f, data) {
    var cols = f.columns || [];
    var rows = (data[f.name] || []).filter(function (r) { return r && rowHasData(r, cols); });
    var h = '';
    if (f.label) h += '<div class="lab" style="font-size:7.6pt;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#55637a;margin-bottom:1mm">' + E(f.label) + '</div>';
    h += '<table class="p-tbl"><colgroup><col style="width:7mm">';
    cols.forEach(function (c) { h += '<col' + (c.width ? ' style="width:' + c.width + '"' : '') + '>'; });
    h += '</colgroup><thead><tr><th>#</th>';
    cols.forEach(function (c) { h += '<th>' + E(c.label) + '</th>'; });
    h += '</tr></thead><tbody>';
    if (!rows.length) {
      for (var k = 0; k < 3; k++) {
        h += '<tr><td class="n">' + (k + 1) + '</td>';
        cols.forEach(function () { h += '<td>&nbsp;</td>'; });
        h += '</tr>';
      }
    } else {
      rows.forEach(function (r, i) {
        h += '<tr><td class="n">' + (i + 1) + '</td>';
        cols.forEach(function (c) {
          var cv = r[c.name];
          if (c.type === 'date') cv = Y.fmtDate(cv);
          h += '<td' + (c.type === 'date' ? ' class="d"' : '') + '>' + E(cv == null ? '' : cv) + '</td>';
        });
        h += '</tr>';
      });
    }
    return h + '</tbody></table>';
  }

  function pairBlock(f, data) {
    var v = data[f.name] || {};
    var b = v.before || {}, a = v.after || {};
    function one(cls, title, s) {
      return '<div class="' + cls + '"><h4>' + E(title) + '</h4><div class="pbody">' +
        (s.img ? '<img src="' + s.img + '" alt="' + E(title) + '">' : '') +
        '<div class="cap">' + (String(s.desc || '').trim() ? E(s.desc) : '&nbsp;') + '</div></div></div>';
    }
    return '<div class="p-pair p-nobreak">' +
      one('before', f.beforeLabel || 'ÖNCESİ', b) +
      one('after', f.afterLabel || 'SONRASI', a) + '</div>';
  }

  function fiveWhyBlock(f, data) {
    var v = data[f.name] || {};
    var whys = v.whys || [];
    var h = '';
    if (f.label) h += '<div class="lab" style="font-size:7.6pt;font-weight:700;text-transform:uppercase;color:#55637a;margin-bottom:1mm">' + E(f.label) + '</div>';
    h += '<table class="p-why">';
    whys.forEach(function (w, i) {
      h += '<tr><td class="q">' + (i + 1) + '. Neden?</td><td>' + (String(w || '').trim() ? E(w) : '&nbsp;') + '</td></tr>';
    });
    h += '<tr class="root"><td class="q">Kök Neden</td><td>' + (String(v.root || '').trim() ? E(v.root) : '&nbsp;') + '</td></tr>';
    return h + '</table>';
  }

  function fishboneBlock(f, data, effect) {
    var cats = f.categories || Y.M6;
    var v = data[f.name] || {};
    var h = '<div class="p-diagram p-nobreak">' + Y.fishboneSVG(cats, v, effect) + '</div>';
    h += '<table class="p-tbl" style="margin-top:3mm"><thead><tr>';
    cats.forEach(function (c) { h += '<th>' + E(c.label) + '</th>'; });
    h += '</tr></thead><tbody><tr>';
    cats.forEach(function (c) {
      var list = (v[c.key] || []).filter(function (s) { return String(s || '').trim(); });
      h += '<td>' + (list.length ? list.map(function (s) { return '• ' + E(s); }).join('<br>') : '&nbsp;') + '</td>';
    });
    return h + '</tr></tbody></table>';
  }

  function sipocBlock(f, data) {
    var COLS = [
      { key: 's', tr: 'Tedarikçiler (S)' }, { key: 'i', tr: 'Girdiler (I)' },
      { key: 'p', tr: 'Süreç (P)' }, { key: 'o', tr: 'Çıktılar (O)' }, { key: 'c', tr: 'Müşteriler (C)' }
    ];
    var v = data[f.name] || {};
    var h = '<table class="p-tbl p-nobreak"><thead><tr>';
    COLS.forEach(function (c) { h += '<th style="text-align:center">' + E(c.tr) + '</th>'; });
    h += '</tr></thead><tbody><tr>';
    COLS.forEach(function (c) {
      var list = (v[c.key] || []).filter(function (s) { return String(s || '').trim(); });
      h += '<td style="height:36mm">' + (list.length
        ? list.map(function (s, i) { return (c.key === 'p' ? (i + 1) + '. ' : '• ') + E(s); }).join('<br>')
        : '&nbsp;') + '</td>';
    });
    return h + '</tr></tbody></table>';
  }

  function flowBlock(f, data) {
    var cols = [
      { name: 'adim', label: 'Adım', width: '26%' },
      { name: 'tur', label: 'Tür', width: '13%' },
      { name: 'sorumlu', label: 'Sorumlu', width: '14%' },
      { name: 'sure', label: 'Süre (dk)', width: '9%' },
      { name: 'kd', label: 'Katma Değer', width: '18%' },
      { name: 'girdi', label: 'Girdi', width: '10%' },
      { name: 'cikti', label: 'Çıktı', width: '10%' }
    ];
    var rows = data[f.name] || [];
    var tot = 0, kd = 0;
    rows.forEach(function (r) {
      var s = parseFloat(r.sure);
      if (!isNaN(s)) { tot += s; if (r.kd === 'Katma Değerli') kd += s; }
    });
    var oran = tot > 0 ? ((kd / tot) * 100).toFixed(1) : '0.0';

    var h = tableBlock({ name: f.name, columns: cols }, data);
    h += '<table class="p-meta" style="margin-top:2.5mm"><tr>' +
      '<td class="k">Toplam Süre</td><td>' + tot + ' dk</td>' +
      '<td class="k">Katma Değerli Süre</td><td>' + kd + ' dk</td>' +
      '<td class="k">Süreç Verimliliği</td><td>%' + oran + '</td></tr></table>';
    var svg = Y.flowSVG(rows);
    if (svg) h += '<div class="p-diagram p-nobreak" style="margin-top:3mm">' + svg + '</div>';
    return h;
  }

  function orgBlock(f, data) {
    var nodes = data[f.name] || [];
    var svg = Y.orgchartSVG(nodes);
    var h = svg ? '<div class="p-diagram p-nobreak">' + svg + '</div>' : '';
    var filled = nodes.filter(function (n) { return String(n.ad || n.unvan || '').trim(); });
    if (filled.length) {
      var byId = {};
      nodes.forEach(function (n) { byId[n.id] = n; });
      h += '<table class="p-tbl" style="margin-top:3mm"><thead><tr><th>#</th><th>Ad Soyad</th><th>Ünvan</th><th>Bağlı Olduğu</th></tr></thead><tbody>';
      filled.forEach(function (n, i) {
        var p = byId[n.parent];
        h += '<tr><td class="n">' + (i + 1) + '</td><td>' + E(n.ad || '') + '</td><td>' + E(n.unvan || '') +
          '</td><td>' + E(p ? (p.ad || p.unvan || '') : '—') + '</td></tr>';
      });
      h += '</tbody></table>';
    }
    return h;
  }

  function renderFields(fields, data, effect) {
    var h = '', buf = [];
    function flush() {
      if (!buf.length) return;
      h += '<div class="p-cols">' + buf.join('') + '</div>';
      buf = [];
    }
    (fields || []).forEach(function (f) {
      if (f.type === 'static') { flush(); h += '<div class="p-field">' + E(f.text || '') + '</div>'; return; }
      if (isSimple(f)) { buf.push(fieldBlock(f, data)); return; }
      flush();
      switch (f.type) {
        case 'table':    h += tableBlock(f, data); break;
        case 'pair':     h += pairBlock(f, data); break;
        case 'fivewhy':  h += fiveWhyBlock(f, data); break;
        case 'fishbone': h += fishboneBlock(f, data, effect); break;
        case 'sipoc':    h += sipocBlock(f, data); break;
        case 'flow':     h += flowBlock(f, data); break;
        case 'orgchart': h += orgBlock(f, data); break;
        default:         h += fieldBlock(f, data);
      }
    });
    flush();
    return h;
  }

  function metaTable(tpl, data) {
    var pairs = (tpl.meta || []).map(function (f) {
      var v = data[f.name];
      if (f.type === 'date') v = Y.fmtDate(v);
      return { k: f.label, v: String(v == null ? '' : v).trim() };
    });
    if (!pairs.length) return '';
    var perRow = 3;
    var h = '<table class="p-meta"><colgroup>';
    for (var c = 0; c < perRow; c++) h += '<col style="width:1%"><col style="width:' + (100 / perRow - 1).toFixed(1) + '%">';
    h += '</colgroup>';
    for (var i = 0; i < pairs.length; i += perRow) {
      h += '<tr>';
      for (var j = 0; j < perRow; j++) {
        var p = pairs[i + j];
        if (p) h += '<td class="k">' + E(p.k) + '</td><td>' + (p.v ? E(p.v) : '&nbsp;') + '</td>';
        else h += '<td class="k">&nbsp;</td><td>&nbsp;</td>';
      }
      h += '</tr>';
    }
    return h + '</table>';
  }

  /**
   * Yazdırılabilir belgeyi oluşturur.
   * @param {object} tpl şablon
   * @param {object} data veri
   * @param {object} opts {title, code}
   * @returns {HTMLElement} .pdoc-stage kökü
   */
  Y.buildPrintDoc = function (tpl, data, opts) {
    opts = opts || {};
    var effect = data.etki || data.problem || data.baslik || data.proje || opts.title || '';
    var subtitle = (opts.title && opts.title !== tpl.name) ? opts.title : '';

    var h = '';
    h += '<div class="p-head">' +
      '<div class="p-head-brand"><div class="b1">YEPAS</div><div class="b2">Lean 6 Sigma</div></div>' +
      '<div class="p-head-title"><div class="t1">' + E(tpl.name) + '</div>' +
      '<div class="t2">' + E(subtitle) + '</div></div>' +
      '<div class="p-head-code"><span>Form Kodu</span><b>' + E(tpl.code || '—') + '</b>' +
      '<span style="margin-top:1mm">Çıktı Tarihi</span><b>' + Y.fmtDate(Y.todayISO()) + '</b></div>' +
      '</div>';

    h += metaTable(tpl, data);

    var secs = (tpl.sections || []).map(function (sec, i) {
      return '<div class="p-sec"><div class="p-sec-title"><span class="n">' + (i + 1) + '</span>' +
        E(sec.title) + '</div><div class="p-sec-box">' + renderFields(sec.fields, data, effect) + '</div></div>';
    });

    if (tpl.a3) {
      var half = Math.ceil(secs.length / 2);
      h += '<div class="p-a3"><div>' + secs.slice(0, half).join('') + '</div>' +
        '<div>' + secs.slice(half).join('') + '</div></div>';
    } else {
      h += secs.join('');
    }

    h += '<div class="p-foot"><span>Yepas Lean 6 Sigma · ' + E(tpl.name) + ' (' + E(tpl.code || '') + ')</span>' +
      '<span>' + E(subtitle) + '</span></div>';

    var doc = Y.el('div', { class: 'pdoc' + (tpl.orientation === 'landscape' ? ' landscape' : ''), html: h });
    var stage = Y.el('div', { class: 'pdoc-stage' }, [doc]);
    return stage;
  };

})(window.Y6S);
