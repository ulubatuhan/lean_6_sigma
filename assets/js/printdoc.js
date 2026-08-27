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

  /** CNX değerini renkli harf rozeti olarak basar. */
  function cnxBadge(v, withLabel) {
    var k = Y.cnxKey(v);
    if (!k) return '&nbsp;';
    var c = Y.cnxColor(k);
    return '<span class="p-cnx" style="background:' + c + '">' + k + '</span>' +
      (withLabel ? ' ' + E(String(v).replace(/^\s*[CNX]\s*[—-]\s*/, '')) : '');
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
          if (c.cnx) { h += '<td class="d">' + cnxBadge(cv) + '</td>'; return; }
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
    var whys = (v.whys || []).map(function (w) {
      return (w && typeof w === 'object') ? w : { t: String(w == null ? '' : w), kanit: '' };
    });
    var h = '';
    if (f.label) h += '<div class="lab" style="font-size:7.6pt;font-weight:700;text-transform:uppercase;color:#55637a;margin-bottom:1mm">' + E(f.label) + '</div>';
    h += '<table class="p-why">';
    whys.forEach(function (w, i) {
      h += '<tr><td class="q">' + (i + 1) + '. Neden?</td><td>' +
        (String(w.t || '').trim() ? E(w.t) : '&nbsp;') +
        (f.evidence && String(w.kanit || '').trim()
          ? '<div class="why-ev">Kanıt: ' + E(w.kanit) + '</div>' : '') +
        '</td></tr>';
    });
    h += '<tr class="root"><td class="q">Kök Neden</td><td>' +
      (f.cnx ? cnxBadge(v.cnx, true) + (Y.cnxKey(v.cnx) ? '<br>' : '') : '') +
      (String(v.root || '').trim() ? E(v.root) : '&nbsp;') + '</td></tr>';
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
      var list = Y.normCauseList(v[c.key]).filter(function (o) { return o.t.trim(); });
      h += '<td>' + (list.length ? list.map(function (o) {
        var k = Y.cnxKey(o.cnx);
        return (k ? cnxBadge(o.cnx) + ' ' : '• ') + E(o.t);
      }).join('<br>') : '&nbsp;') + '</td>';
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

  function flowmapBlock(f, data) {
    var map = Y.normFlowmap(data[f.name]);
    if (!map.nodes.length) return '<div class="p-field"><div class="val empty">Henüz süreç adımı girilmemiş.</div></div>';

    var svg = Y.flowmapSVGString(map);
    var h = svg ? '<div class="p-diagram p-nobreak">' + svg + '</div>' : '';

    var m = Y.flowmapMetrics(map);
    h += '<table class="p-meta" style="margin-top:3mm"><tr>' +
      '<td class="k">Adım</td><td>' + m.steps + '</td>' +
      '<td class="k">Karar Noktası</td><td>' + m.decisions + '</td>' +
      '<td class="k">Toplam Süre</td><td>' + m.total + ' dk</td>' +
      '</tr><tr>' +
      '<td class="k">Katma Değerli</td><td>' + m.va + ' dk</td>' +
      '<td class="k">İsraf</td><td>' + m.waste + ' dk</td>' +
      '<td class="k">Süreç Verimliliği</td><td>%' + m.eff.toFixed(1) + '</td>' +
      '</tr></table>';

    // Adım tablosu: dallanmalar "Sonraki adım" kolonunda etiketleriyle listelenir
    var laneAd = {};
    map.lanes.forEach(function (l) { laneAd[l.id] = l.ad || 'Kulvar'; });
    var order = Y.flowmapOrder(map);
    var num = {};
    order.forEach(function (n, i) { num[n.id] = i + 1; });

    h += '<table class="p-tbl" style="margin-top:3mm">' +
      '<colgroup><col style="width:7mm"><col style="width:24%"><col style="width:14%"><col style="width:12%">' +
      '<col style="width:8%"><col style="width:14%"><col style="width:7%"><col style="width:21%"></colgroup>' +
      '<thead><tr><th>#</th><th>Adım</th><th>Kulvar / Sorumlu</th><th>Tür</th><th>Süre</th>' +
      '<th>Katma Değer</th><th>CNX</th><th>Sonraki Adım</th></tr></thead><tbody>';
    order.forEach(function (n, i) {
      var outs = map.edges.filter(function (e) { return e.from === n.id; }).map(function (e) {
        var lbl = String(e.etiket || '').trim();
        return (lbl ? lbl + ' → ' : '→ ') + (num[e.to] != null ? '#' + num[e.to] : '?');
      });
      h += '<tr><td class="n">' + (i + 1) + '</td>' +
        '<td>' + E(n.metin || '') + '</td>' +
        '<td>' + E(laneAd[n.lane] || '') + '</td>' +
        '<td>' + E(n.tur || '') + '</td>' +
        '<td class="d">' + (String(n.sure || '').trim() ? E(n.sure) + ' dk' : '') + '</td>' +
        '<td>' + E(n.kd || '') + '</td>' +
        '<td class="d">' + cnxBadge(n.cnx) + '</td>' +
        '<td>' + (outs.length ? E(outs.join(' · ')) : 'Süreç sonu') + '</td></tr>';
    });
    h += '</tbody></table>';
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
      if (f.type === 'static') {
        flush();
        h += f.print === false ? '' : '<div class="p-static">' + (f.html || E(f.text || '')) + '</div>';
        return;
      }
      if (isSimple(f)) { buf.push(fieldBlock(f, data)); return; }
      flush();
      switch (f.type) {
        case 'table':    h += tableBlock(f, data); break;
        case 'pair':     h += pairBlock(f, data); break;
        case 'fivewhy':  h += fiveWhyBlock(f, data); break;
        case 'fishbone': h += fishboneBlock(f, data, effect); break;
        case 'sipoc':    h += sipocBlock(f, data); break;
        case 'flowmap':  h += flowmapBlock(f, data); break;
        case 'orgchart': h += orgBlock(f, data); break;
        case 'checks':   h += checksBlock(f, data); break;
        default:         h += fieldBlock(f, data);
      }
    });
    flush();
    return h;
  }

  /** Resmî formlardaki işaretli kutucuk listesi. */
  function checksBlock(f, data) {
    var sel = data[f.name];
    if (!Array.isArray(sel)) sel = [];
    var cells = (f.options || []).map(function (o) {
      var on = sel.indexOf(o) >= 0;
      return '<td class="p-chk"><span class="bx">' + (on ? '×' : '') + '</span>' + E(o) + '</td>';
    });
    var perRow = f.perRow || 2;
    var rows = '';
    for (var i = 0; i < cells.length; i += perRow) {
      var r = cells.slice(i, i + perRow);
      while (r.length < perRow) r.push('<td class="p-chk"></td>');
      rows += '<tr>' + r.join('') + '</tr>';
    }
    return (f.label ? '<div class="p-field"><div class="lab">' + E(f.label) + '</div></div>' : '') +
      '<table class="p-checks">' + rows + '</table>';
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
  /**
   * Resmî YEPAŞ form başlığı: logo | form adı | doküman künyesi.
   * Kurumsal formların (SYB-F-xxxx) üst tablosuyla birebir aynı düzendedir.
   */
  function officialHead(tpl, subtitle) {
    var logo = (Y.BRAND && Y.BRAND.logo) || '';
    var rows = [
      ['DOKÜMAN NO', tpl.code || '—'],
      ['YAYIN TARİHİ', tpl.yayinTarihi || '—'],
      ['REVİZYON NO', tpl.revNo != null ? tpl.revNo : '—'],
      ['REVİZYON TARİHİ', tpl.revTarihi || '—']
    ];
    var künye = rows.map(function (r) {
      return '<tr><th>' + E(r[0]) + '</th><td>' + E(r[1]) + '</td></tr>';
    }).join('');

    return '<table class="p-official"><tr>' +
      '<td class="po-logo">' +
        (logo ? '<img src="' + logo + '" alt="YEPAŞ">' : '<b>YEPAŞ</b>') +
      '</td>' +
      '<td class="po-title">' +
        '<div class="t1">' + E(tpl.resmiAd || tpl.name) + '</div>' +
        (subtitle ? '<div class="t2">' + E(subtitle) + '</div>' : '') +
      '</td>' +
      '<td class="po-meta"><table>' + künye + '</table></td>' +
      '</tr></table>' +
      (tpl.resmi === false
        ? '<div class="p-unofficial">Kurum içi çalışma aracı — resmî doküman numarası bulunmamaktadır.</div>'
        : '');
  }

  Y.buildPrintDoc = function (tpl, data, opts) {
    opts = opts || {};
    var effect = data.etki || data.problem || data.baslik || data.proje || opts.title || '';
    var subtitle = (opts.title && opts.title !== tpl.name) ? opts.title : '';

    var h = officialHead(tpl, subtitle);

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

    h += '<div class="p-foot">' +
      '<span>' + E(tpl.resmiAd || tpl.name) + (tpl.code ? ' · ' + E(tpl.code) : '') + '</span>' +
      '<span>' + E(subtitle) + '</span>' +
      '<span>Çıktı tarihi: ' + Y.fmtDate(Y.todayISO()) + '</span></div>';

    var doc = Y.el('div', { class: 'pdoc' + (tpl.orientation === 'landscape' ? ' landscape' : ''), html: h });
    var stage = Y.el('div', { class: 'pdoc-stage' }, [doc]);
    return stage;
  };

})(window.Y6S);
