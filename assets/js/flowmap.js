/* ==========================================================================
   Yepas Lean 6 Sigma — kulvarlı proses haritası (sürükle-bırak editör)

   Veri modeli:
     {
       lanes: [{ id, ad }],
       nodes: [{ id, lane, x, yOff, tur, metin, sure, kd, cnx, girdi, cikti, notlar }],
       edges: [{ id, from, to, etiket }]
     }
   Aynı SVG hem ekranda düzenlenir hem de PDF/Word çıktısına gider.
   ========================================================================== */

window.Y6S = window.Y6S || {};

(function (Y) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  var HEADER_H = 34;   // üst şerit (kulvar başlığı bandı yok, sadece boşluk)
  var LANE_W   = 148;  // sol kulvar etiket kolonu
  var LANE_H   = 158;  // varsayılan kulvar yüksekliği
  var LANE_H_MIN = 90;
  var LANE_H_MAX = 420;
  var NODE_W   = 176;
  var NODE_H   = 64;
  var DEC_H    = 78;   // karar kutusu
  var GRID     = 8;
  var MIN_W    = 1180;

  function nodeH(n) { return n.tur === 'Karar' ? DEC_H : NODE_H; }

  /** Kulvarın ayarlanmış yüksekliği (Excel'de satır yüksekliği gibi, kulvar başına). */
  function laneHeight(lane) {
    var h = lane && lane.h;
    return (typeof h === 'number' && h > 0) ? h : LANE_H;
  }
  /** i. kulvarın üst y koordinatı — önceki kulvarların yüksekliklerinin toplamı. */
  function laneTop(data, li) {
    var y = HEADER_H;
    for (var i = 0; i < li; i++) y += laneHeight(data.lanes[i]);
    return y;
  }

  /* ---------------------------------------------------------------- SVG yardımcıları */

  function s(tag, attrs, kids) {
    var n = document.createElementNS(NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'text') n.textContent = v;
        else n.setAttribute(k, v);
      });
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function textNode(lines, x, y, attrs) {
    var t = s('text', attrs || {});
    lines.forEach(function (l, i) {
      t.appendChild(s('tspan', { x: x, y: y + i * 14, text: l }));
    });
    return t;
  }

  /* ---------------------------------------------------------------- veri */

  /* SGB-F-0650 Kök Neden Analiz Formları, NOT-1 uyarınca. */
  Y.CNX = [
    { key: 'C', label: 'C — Kontrol edilebilir', color: '#026A39',
      desc: 'Kontrol edilebilir neden: prosedür, talimat veya kontrol planı ile sabitlenebilir.' },
    { key: 'N', label: 'N — Kontrol edilemez', color: '#F7B449',
      desc: 'Kontrol edilemeyen neden: doğrudan müdahale edilemez, etkisi izlenir.' },
    { key: 'X', label: 'X — Bilinmiyor', color: '#E7242A',
      desc: 'Bilinmiyor: kontrol edilebilirliği belirsiz, araştırma/deney gerekir.' }
  ];

  Y.cnxColor = function (k) {
    for (var i = 0; i < Y.CNX.length; i++) if (Y.CNX[i].key === k) return Y.CNX[i].color;
    return '#8a94a6';
  };

  Y.CNX_LABELS = Y.CNX.map(function (c) { return c.label; });

  /** Etiketten ('C — Kontrol Edilen' veya 'C') tek harf çıkarır. */
  Y.cnxKey = function (v) {
    var m = /^\s*([CNX])\b/.exec(String(v || ''));
    return m ? m[1] : '';
  };

  function shapeOf(tur) {
    for (var i = 0; i < Y.FLOW_TYPES.length; i++) {
      if (Y.FLOW_TYPES[i].label === tur) return Y.FLOW_TYPES[i].shape;
    }
    return 'process';
  }

  function kdColor(kd) {
    for (var i = 0; i < Y.VALUE_TYPES.length; i++) {
      if (Y.VALUE_TYPES[i].label === kd) return Y.VALUE_TYPES[i].color;
    }
    return null;
  }

  /**
   * Veriyi normalize eder; eski tablo biçimindeki kayıtları (dizi) tuvale taşır.
   */
  Y.normFlowmap = function (v) {
    var out = { lanes: [], nodes: [], edges: [] };

    if (Array.isArray(v)) {
      // Eski sürüm: satır listesi → tek kulvarda zincir
      var laneMap = {}, order = [];
      v.forEach(function (r) {
        var k = String((r && r.sorumlu) || '').trim() || 'Sorumlu';
        if (!laneMap[k]) { laneMap[k] = { id: Y.uid(), ad: k }; order.push(laneMap[k]); }
      });
      if (!order.length) order.push({ id: Y.uid(), ad: 'Sorumlu' });
      out.lanes = order;
      var prev = null, col = 0;
      v.forEach(function (r) {
        if (!r || !String(r.adim || '').trim()) return;
        var laneId = laneMap[String(r.sorumlu || '').trim() || 'Sorumlu'].id;
        var n = {
          id: Y.uid(), lane: laneId, x: 40 + col * (NODE_W + 64), yOff: 46,
          tur: r.tur || 'İşlem', metin: r.adim || '', sure: r.sure || '',
          kd: r.kd || '', cnx: '', girdi: r.girdi || '', cikti: r.cikti || '', notlar: ''
        };
        out.nodes.push(n);
        if (prev) out.edges.push({ id: Y.uid(), from: prev.id, to: n.id, etiket: '' });
        prev = n; col++;
      });
      if (!out.nodes.length) return seed(out);
      return out;
    }

    if (!v || typeof v !== 'object') return seed(out);
    out.lanes = Array.isArray(v.lanes) ? v.lanes : [];
    out.nodes = Array.isArray(v.nodes) ? v.nodes : [];
    out.edges = Array.isArray(v.edges) ? v.edges : [];
    if (!out.lanes.length || !out.nodes.length) return seed(out);

    // Bütünlük: geçersiz kulvar / kenar temizliği
    var laneIds = {};
    out.lanes.forEach(function (l) { if (!l.id) l.id = Y.uid(); laneIds[l.id] = 1; });
    var nodeIds = {};
    out.nodes.forEach(function (n) {
      if (!n.id) n.id = Y.uid();
      if (!laneIds[n.lane]) n.lane = out.lanes[0].id;
      if (typeof n.x !== 'number') n.x = 40;
      if (typeof n.yOff !== 'number') n.yOff = 46;
      nodeIds[n.id] = 1;
    });
    out.edges = out.edges.filter(function (e) {
      return e && nodeIds[e.from] && nodeIds[e.to] && e.from !== e.to;
    });
    out.edges.forEach(function (e) { if (!e.id) e.id = Y.uid(); });
    return out;
  };

  function seed(out) {
    var l1 = { id: Y.uid(), ad: 'Talep Eden' };
    var l2 = { id: Y.uid(), ad: 'Operasyon' };
    out.lanes = [l1, l2];
    var a = { id: Y.uid(), lane: l1.id, x: 40,  yOff: 46, tur: 'Başla / Bitir', metin: 'Başla', sure: '', kd: '', cnx: '', girdi: '', cikti: '', notlar: '' };
    var b = { id: Y.uid(), lane: l2.id, x: 288, yOff: 46, tur: 'İşlem', metin: 'İlk işlem adımı', sure: '', kd: 'Katma Değerli', cnx: '', girdi: '', cikti: '', notlar: '' };
    var c = { id: Y.uid(), lane: l2.id, x: 536, yOff: 40, tur: 'Karar', metin: 'Uygun mu?', sure: '', kd: '', cnx: '', girdi: '', cikti: '', notlar: '' };
    var d = { id: Y.uid(), lane: l1.id, x: 784, yOff: 46, tur: 'Başla / Bitir', metin: 'Bitir', sure: '', kd: '', cnx: '', girdi: '', cikti: '', notlar: '' };
    out.nodes = [a, b, c, d];
    out.edges = [
      { id: Y.uid(), from: a.id, to: b.id, etiket: '' },
      { id: Y.uid(), from: b.id, to: c.id, etiket: '' },
      { id: Y.uid(), from: c.id, to: d.id, etiket: 'Evet' }
    ];
    return out;
  }

  /* ---------------------------------------------------------------- geometri */

  function laneIndex(data, laneId) {
    for (var i = 0; i < data.lanes.length; i++) if (data.lanes[i].id === laneId) return i;
    return 0;
  }

  function box(data, n) {
    var li = laneIndex(data, n.lane);
    var h = nodeH(n);
    var top = laneTop(data, li) + n.yOff;
    return { x: LANE_W + n.x, y: top, w: NODE_W, h: h,
      cx: LANE_W + n.x + NODE_W / 2, cy: top + h / 2 };
  }

  function canvasSize(data) {
    var maxX = 0;
    data.nodes.forEach(function (n) { maxX = Math.max(maxX, n.x + NODE_W); });
    var lanesH = data.lanes.reduce(function (sum, l) { return sum + laneHeight(l); }, 0);
    return {
      w: Math.max(MIN_W, LANE_W + maxX + 90),
      h: HEADER_H + Math.max(LANE_H, lanesH) + 16
    };
  }

  function anchor(b, side) {
    switch (side) {
      case 'r': return { x: b.x + b.w, y: b.cy };
      case 'l': return { x: b.x, y: b.cy };
      case 't': return { x: b.cx, y: b.y };
      default:  return { x: b.cx, y: b.y + b.h };
    }
  }

  /** İki kutu arasında dirsekli yol ve etiket noktası üretir. */
  function route(a, b) {
    var dx = b.cx - a.cx, dy = b.cy - a.cy;

    if (dx < -12) {
      // geri dönüş: kutuların altından dolaş
      var p1 = anchor(a, 'b'), p2 = anchor(b, 'b');
      var yy = Math.max(p1.y, p2.y) + 30;
      return {
        d: 'M' + p1.x + ' ' + p1.y + ' L' + p1.x + ' ' + yy + ' L' + p2.x + ' ' + yy + ' L' + p2.x + ' ' + p2.y,
        lx: (p1.x + p2.x) / 2, ly: yy
      };
    }
    if (Math.abs(dx) >= Math.abs(dy)) {
      var q1 = anchor(a, 'r'), q2 = anchor(b, 'l');
      var mx = (q1.x + q2.x) / 2;
      return {
        d: 'M' + q1.x + ' ' + q1.y + ' L' + mx + ' ' + q1.y + ' L' + mx + ' ' + q2.y + ' L' + q2.x + ' ' + q2.y,
        lx: mx, ly: (q1.y + q2.y) / 2
      };
    }
    var r1 = anchor(a, dy >= 0 ? 'b' : 't'), r2 = anchor(b, dy >= 0 ? 't' : 'b');
    var my = (r1.y + r2.y) / 2;
    return {
      d: 'M' + r1.x + ' ' + r1.y + ' L' + r1.x + ' ' + my + ' L' + r2.x + ' ' + my + ' L' + r2.x + ' ' + r2.y,
      lx: (r1.x + r2.x) / 2, ly: my
    };
  }

  /* ---------------------------------------------------------------- şekiller */

  function shapePath(shape, x, y, w, h) {
    var cx = x + w / 2, cy = y + h / 2;
    switch (shape) {
      case 'terminator':
        return { tag: 'rect', attrs: { x: x, y: y, width: w, height: h, rx: h / 2 } };
      case 'decision':
        return { tag: 'polygon', attrs: { points: cx + ',' + y + ' ' + (x + w) + ',' + cy + ' ' + cx + ',' + (y + h) + ' ' + x + ',' + cy } };
      case 'delay':
        return { tag: 'path', attrs: { d: 'M' + x + ' ' + y + ' H' + (x + w - h / 2) +
          ' A' + (h / 2) + ' ' + (h / 2) + ' 0 0 1 ' + (x + w - h / 2) + ' ' + (y + h) + ' H' + x + ' Z' } };
      case 'transport':
        return { tag: 'polygon', attrs: { points: x + ',' + y + ' ' + (x + w - 24) + ',' + y + ' ' + (x + w) + ',' + cy +
          ' ' + (x + w - 24) + ',' + (y + h) + ' ' + x + ',' + (y + h) } };
      case 'storage':
        return { tag: 'polygon', attrs: { points: x + ',' + y + ' ' + (x + w) + ',' + y + ' ' + cx + ',' + (y + h) } };
      case 'inspection':
        return { tag: 'polygon', attrs: { points: (x + 22) + ',' + y + ' ' + (x + w - 22) + ',' + y + ' ' + (x + w) + ',' + cy +
          ' ' + (x + w - 22) + ',' + (y + h) + ' ' + (x + 22) + ',' + (y + h) + ' ' + x + ',' + cy } };
      case 'document':
        return { tag: 'path', attrs: { d: 'M' + x + ' ' + y + ' H' + (x + w) + ' V' + (y + h - 10) +
          ' q' + (-w / 4) + ' 13 ' + (-w / 2) + ' 0 q' + (-w / 4) + ' -13 ' + (-w / 2) + ' 0 Z' } };
      default:
        return { tag: 'rect', attrs: { x: x, y: y, width: w, height: h, rx: 5 } };
    }
  }

  /* ---------------------------------------------------------------- çizim */

  /**
   * Tuvali verilen <svg> içine çizer. Düğüm değiştirilmez; sürükleme sırasında
   * işaretçi yakalaması (pointer capture) kopmasın diye aynı eleman korunur.
   * @param {SVGSVGElement} svg
   * @param {object} data normalize edilmiş harita
   * @param {object} opts {interactive:boolean, selection:{type,id}}
   */
  Y.renderFlowmapInto = function (svg, data, opts) {
    opts = opts || {};
    var size = canvasSize(data);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + size.w + ' ' + size.h);
    svg.setAttribute('data-w', size.w);
    svg.setAttribute('data-h', size.h);

    svg.appendChild(s('defs', {}, [
      s('marker', { id: 'fm-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5',
        markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' },
        [s('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#55637a' })])
    ]));

    svg.appendChild(s('rect', { width: size.w, height: size.h, fill: '#ffffff' }));

    /* --- kulvarlar --- */
    var lanesG = s('g', { class: 'fm-lanes' });
    data.lanes.forEach(function (lane, i) {
      var y = laneTop(data, i);
      var lh = laneHeight(lane);
      lanesG.appendChild(s('rect', {
        x: 0, y: y, width: size.w, height: lh,
        fill: i % 2 ? '#f7f9fb' : '#ffffff', stroke: '#dde3ea', 'stroke-width': 1
      }));
      lanesG.appendChild(s('rect', {
        x: 0, y: y, width: LANE_W, height: lh,
        fill: '#142E51', stroke: '#142E51', 'stroke-width': 1,
        class: 'fm-lane-head', 'data-lane': lane.id
      }));
      var lines = Y.wrapText(lane.ad || 'Kulvar', lh - 30, 12.5, 2);
      var t = textNode(lines, 0, 0, {
        fill: '#ffffff', 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'middle',
        transform: 'translate(' + (LANE_W / 2) + ',' + (y + lh / 2) + ') rotate(-90)',
        'pointer-events': 'none'
      });
      // dikey yazı: tspan konumlarını sıfırla
      Array.prototype.slice.call(t.childNodes).forEach(function (ts, k) {
        ts.setAttribute('x', 0);
        ts.setAttribute('y', k * 15 - (lines.length - 1) * 7.5 + 4);
      });
      lanesG.appendChild(t);
      if (opts.interactive) {
        // Excel'deki satır yüksekliği çekme kolu gibi: alt kenardan sürükleyerek kulvarı yeniden boyutlandırır.
        lanesG.appendChild(s('rect', {
          x: 0, y: y + lh - 3, width: size.w, height: 6,
          class: 'fm-lane-resize', 'data-lane': lane.id, fill: 'transparent'
        }));
      }
    });
    lanesG.appendChild(s('rect', {
      x: 0, y: 0, width: size.w, height: HEADER_H, fill: '#eceff4', stroke: '#dde3ea'
    }));
    lanesG.appendChild(s('text', {
      x: 12, y: 22, fill: '#55637a', 'font-size': 12, 'font-weight': 700,
      text: 'KULVAR / SORUMLU', 'letter-spacing': '0.06em'
    }));
    svg.appendChild(lanesG);

    /* --- kenarlar --- */
    var byId = {};
    data.nodes.forEach(function (n) { byId[n.id] = n; });
    var edgesG = s('g', { class: 'fm-edges' });
    data.edges.forEach(function (e) {
      var a = byId[e.from], b = byId[e.to];
      if (!a || !b) return;
      var r = route(box(data, a), box(data, b));
      var sel = opts.selection && opts.selection.type === 'edge' && opts.selection.id === e.id;
      if (opts.interactive) {
        edgesG.appendChild(s('path', {
          d: r.d, fill: 'none', stroke: 'transparent', 'stroke-width': 14,
          class: 'fm-edge-hit', 'data-edge': e.id
        }));
      }
      edgesG.appendChild(s('path', {
        d: r.d, fill: 'none',
        stroke: sel ? '#2E7D32' : '#55637a', 'stroke-width': sel ? 2.6 : 1.6,
        'marker-end': 'url(#fm-arrow)', 'pointer-events': 'none'
      }));
      if (String(e.etiket || '').trim()) {
        var lw = String(e.etiket).length * 6.6 + 12;
        edgesG.appendChild(s('rect', {
          x: r.lx - lw / 2, y: r.ly - 9, width: lw, height: 18, rx: 4,
          fill: '#ffffff', stroke: '#dde3ea', 'pointer-events': 'none'
        }));
        edgesG.appendChild(s('text', {
          x: r.lx, y: r.ly + 4, 'text-anchor': 'middle', 'font-size': 11,
          fill: '#16202e', text: e.etiket, 'pointer-events': 'none'
        }));
      }
    });
    svg.appendChild(edgesG);

    /* --- düğümler --- */
    var nodesG = s('g', { class: 'fm-nodes' });
    data.nodes.forEach(function (n) {
      var b = box(data, n);
      var sel = opts.selection && opts.selection.type === 'node' && opts.selection.id === n.id;
      var g = s('g', { class: 'fm-node' + (sel ? ' is-sel' : ''), 'data-node': n.id });

      var sp = shapePath(shapeOf(n.tur), b.x, b.y, b.w, b.h);
      var kc = kdColor(n.kd);
      g.appendChild(s(sp.tag, Object.assign({}, sp.attrs, {
        fill: '#f7f9fb', stroke: sel ? '#2E7D32' : '#142E51', 'stroke-width': sel ? 2.4 : 1.6
      })));

      var lines = Y.wrapText(n.metin, b.w - (n.tur === 'Karar' ? 62 : 30), 12, 2);
      var ty = b.cy - (lines.length - 1) * 7 + 4 - (n.sure ? 5 : 0);
      g.appendChild(textNode(lines, b.cx, ty, {
        'text-anchor': 'middle', 'font-size': 12, fill: '#16202e', 'pointer-events': 'none'
      }));

      if (String(n.sure || '').trim()) {
        g.appendChild(s('text', {
          x: b.cx, y: b.y + b.h - 8, 'text-anchor': 'middle', 'font-size': 10,
          fill: '#55637a', text: n.sure + ' dk', 'pointer-events': 'none'
        }));
      }
      if (kc) {
        g.appendChild(s('rect', {
          x: b.x + 6, y: b.y + b.h - 4, width: b.w - 12, height: 3, rx: 1.5,
          fill: kc, 'pointer-events': 'none'
        }));
      }
      if (n.kd === 'İsraf' && String(n.israfTuru || '').trim()) {
        g.appendChild(s('text', {
          x: b.cx, y: b.y - 5, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 700,
          fill: '#E7242A', text: 'İSRAF · ' + n.israfTuru.toUpperCase(), 'pointer-events': 'none'
        }));
      }
      var ck = Y.cnxKey(n.cnx);
      if (ck) {
        // Köşe rozeti: yuvarlak yerine etiket biçimi — silme düğmesiyle karışmasın.
        // Eşkenar dörtgende köşe boş olduğu için rozet metnin altına, gövde içine alınır.
        var dia = n.tur === 'Karar';
        var bx = dia ? b.cx - 9 : b.x + 7;
        var by = dia ? b.y + b.h - 24 : b.y + 6;
        g.appendChild(s('rect', {
          x: bx, y: by, width: 18, height: 14, rx: 3,
          fill: Y.cnxColor(ck), 'pointer-events': 'none'
        }));
        g.appendChild(s('text', {
          x: bx + 9, y: by + 10.5, 'text-anchor': 'middle', 'font-size': 9.5,
          'font-weight': 700, fill: '#ffffff', text: ck, 'pointer-events': 'none'
        }));
      }

      if (opts.interactive) {
        ['t', 'r', 'b', 'l'].forEach(function (side) {
          var p = anchor(b, side);
          g.appendChild(s('circle', {
            cx: p.x, cy: p.y, r: 5.5, class: 'fm-port',
            'data-port': side, 'data-node': n.id
          }));
        });
      }
      nodesG.appendChild(g);
    });
    svg.appendChild(nodesG);

    if (opts.interactive) {
      svg.appendChild(s('path', { class: 'fm-ghost', d: '', fill: 'none',
        stroke: '#2E7D32', 'stroke-width': 2, 'stroke-dasharray': '5 4', 'pointer-events': 'none' }));
    }
    return svg;
  };

  Y.buildFlowmapSVG = function (data, opts) {
    var size = canvasSize(data);
    var svg = s('svg', {
      xmlns: NS, width: size.w, height: size.h,
      'font-family': 'Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
      class: 'fm-svg'
    });
    Y.renderFlowmapInto(svg, data, opts);
    return svg;
  };

  Y.flowmapSVGString = function (v) {
    var data = Y.normFlowmap(v);
    if (!data.nodes.length) return null;
    var svg = Y.buildFlowmapSVG(data, { interactive: false });
    return new XMLSerializer().serializeToString(svg);
  };

  /* ---------------------------------------------------------------- ölçümler */

  Y.flowmapMetrics = function (data) {
    var tot = 0, va = 0, nva = 0, waste = 0, cnx = { C: 0, N: 0, X: 0 };
    data.nodes.forEach(function (n) {
      var v = parseFloat(n.sure);
      if (!isNaN(v)) {
        tot += v;
        if (n.kd === 'Katma Değerli') va += v;
        else if (n.kd === 'İsraf') waste += v;
        else if (n.kd) nva += v;
      }
      var k = Y.cnxKey(n.cnx);
      if (k) cnx[k]++;
    });
    return {
      steps: data.nodes.length, edges: data.edges.length,
      total: tot, va: va, nva: nva, waste: waste,
      eff: tot > 0 ? (va / tot) * 100 : 0,
      cnx: cnx,
      decisions: data.nodes.filter(function (n) { return n.tur === 'Karar'; }).length
    };
  };

  /** Okuma sırası: kaynaklardan başlayarak genişlik öncelikli. */
  Y.flowmapOrder = function (data) {
    var indeg = {}, adj = {}, byId = {};
    data.nodes.forEach(function (n) { indeg[n.id] = 0; adj[n.id] = []; byId[n.id] = n; });
    data.edges.forEach(function (e) {
      if (adj[e.from] && indeg[e.to] != null) { adj[e.from].push(e.to); indeg[e.to]++; }
    });
    var queue = data.nodes.filter(function (n) { return !indeg[n.id]; })
      .sort(function (a, b) { return a.x - b.x; }).map(function (n) { return n.id; });
    if (!queue.length && data.nodes.length) queue = [data.nodes[0].id];
    var seen = {}, out = [];
    while (queue.length) {
      var id = queue.shift();
      if (seen[id]) continue;
      seen[id] = 1;
      out.push(byId[id]);
      adj[id].forEach(function (t) { if (!seen[t]) queue.push(t); });
    }
    data.nodes.forEach(function (n) { if (!seen[n.id]) out.push(n); });
    return out;
  };

  /* ==========================================================================
     Editör
     ========================================================================== */

  var el = function () { return Y.el.apply(Y, arguments); };

  /**
   * Sürükle-bırak editörünü verilen kaba kurar.
   * @param {HTMLElement} host
   * @param {function} getData  güncel veriyi döndürür
   * @param {function} setData  değişikliği kaydeder
   */
  Y.mountFlowmapEditor = function (host, getData, setData) {
    var data = getData();
    var sel = null;                 // {type:'node'|'edge'|'lane', id}
    var zoom = 1;

    host.innerHTML = '';
    host.className = 'fm-editor';

    /* --- araç çubuğu --- */
    var bar = el('div', { class: 'fm-toolbar' });
    var addWrap = el('div', { class: 'fm-add' });
    addWrap.appendChild(el('span', { class: 'fm-add-label', text: 'Kutu ekle:' }));
    Y.FLOW_TYPES.forEach(function (t) {
      var b = el('button', { class: 'fm-chip', type: 'button', title: t.label + ' ekle' });
      b.appendChild(el('span', { class: 'fm-chip-ico', html: chipIcon(t.shape) }));
      b.appendChild(el('span', { text: t.label }));
      b.addEventListener('click', function () { addNode(t.label); });
      addWrap.appendChild(b);
    });
    bar.appendChild(addWrap);

    var bar2 = el('div', { class: 'fm-toolbar2' });
    function tool(label, icon, fn, cls) {
      var b = el('button', { class: 'btn btn-sm ' + (cls || ''), type: 'button',
        html: (icon ? Y.ui(icon) : '') + '<span>' + Y.esc(label) + '</span>' });
      b.addEventListener('click', fn);
      bar2.appendChild(b);
      return b;
    }
    tool('Kulvar ekle', 'plus', function () {
      data.lanes.push({ id: Y.uid(), ad: 'Yeni kulvar' });
      commit();
    });
    tool('Otomatik diz', 'align', autoArrange);
    var delBtn = tool('Seçileni sil', 'trash', deleteSelection, 'btn-danger');
    bar2.appendChild(el('div', { style: 'flex:1' }));
    var zoomOut = el('button', { class: 'btn btn-sm btn-ghost btn-icon', type: 'button', title: 'Uzaklaştır', text: '−' });
    var zoomLbl = el('span', { class: 'fm-zoom', text: '%100' });
    var zoomIn = el('button', { class: 'btn btn-sm btn-ghost btn-icon', type: 'button', title: 'Yakınlaştır', text: '+' });
    zoomOut.addEventListener('click', function () { setZoom(zoom - 0.1); });
    zoomIn.addEventListener('click', function () { setZoom(zoom + 0.1); });
    bar2.appendChild(zoomOut); bar2.appendChild(zoomLbl); bar2.appendChild(zoomIn);

    host.appendChild(bar);
    host.appendChild(bar2);

    var hint = el('div', { class: 'fm-hint', html:
      'Kutuyu <strong>sürükleyerek</strong> taşıyın — bıraktığınız kulvar sorumlusu olur. ' +
      'Kulvarın <strong>alt kenarından tutup sürükleyerek</strong> (Excel’de satır yüksekliği ayarlar gibi) kulvar yüksekliğini değiştirin; ' +
      'kulvar panelindeki sayı kutusuna da yazabilirsiniz. ' +
      'Kutunun kenarındaki <strong>bağlantı noktasından</strong> başka bir kutuya sürükleyerek ok çizin; ' +
      'karar kutusundan çıkan oklara <strong>Evet / Hayır</strong> etiketi verip dallanma oluşturun. ' +
      'Boş alana <strong>çift tıklayarak</strong> hızlıca işlem kutusu ekleyebilirsiniz.' });
    host.appendChild(hint);

    var stage = el('div', { class: 'fm-stage', tabindex: '0' });
    host.appendChild(stage);

    var lanePanel = el('div', { class: 'fm-lanes-panel' });
    host.appendChild(lanePanel);

    var props = el('div', { class: 'fm-props' });
    host.appendChild(props);

    var metrics = el('div', { class: 'notice fm-metrics' });
    host.appendChild(metrics);

    var svg = null;

    /* ---------------------------------------------------------------- yardımcı */

    function commit() {
      setData(data);
      draw();
    }

    function byId(id) {
      for (var i = 0; i < data.nodes.length; i++) if (data.nodes[i].id === id) return data.nodes[i];
      return null;
    }
    function edgeById(id) {
      for (var i = 0; i < data.edges.length; i++) if (data.edges[i].id === id) return data.edges[i];
      return null;
    }

    function setZoom(z) {
      zoom = Math.min(1.6, Math.max(0.4, Math.round(z * 10) / 10));
      applyZoom();
      zoomLbl.textContent = '%' + Math.round(zoom * 100);
    }
    function applyZoom() {
      if (!svg) return;
      svg.setAttribute('width', Number(svg.getAttribute('data-w')) * zoom);
      svg.setAttribute('height', Number(svg.getAttribute('data-h')) * zoom);
    }

    function toSVG(evt) {
      var ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      var p = svg.createSVGPoint();
      p.x = evt.clientX; p.y = evt.clientY;
      var q = p.matrixTransform(ctm.inverse());
      return { x: q.x, y: q.y };
    }

    function snap(v) { return Math.round(v / GRID) * GRID; }

    function laneIndexAtY(absY) {
      var y = HEADER_H;
      for (var i = 0; i < data.lanes.length - 1; i++) {
        y += laneHeight(data.lanes[i]);
        if (absY < y) return i;
      }
      return data.lanes.length - 1;
    }

    function placeAt(n, absX, absY) {
      var li = Math.max(0, laneIndexAtY(absY));
      n.lane = data.lanes[li].id;
      n.x = Math.max(8, snap(absX - LANE_W));
      var bandTop = laneTop(data, li);
      var bandH = laneHeight(data.lanes[li]);
      n.yOff = Math.max(10, Math.min(bandH - nodeH(n) - 10, snap(absY - bandTop)));
    }

    function addNode(tur, at) {
      var laneId = (sel && sel.type === 'node' && byId(sel.id)) ? byId(sel.id).lane : data.lanes[0].id;
      var n = {
        id: Y.uid(), lane: laneId, x: 40, yOff: 46,
        tur: tur, metin: '', sure: '', kd: '', cnx: '', girdi: '', cikti: '', notlar: ''
      };
      if (at) placeAt(n, at.x - NODE_W / 2, at.y - nodeH(n) / 2);
      else {
        // aynı kulvarda en sağdaki kutunun sağına yerleştir
        var maxX = 0;
        data.nodes.forEach(function (o) { if (o.lane === laneId) maxX = Math.max(maxX, o.x + NODE_W); });
        n.x = maxX ? maxX + 64 : 40;
      }
      data.nodes.push(n);
      sel = { type: 'node', id: n.id };
      commit();
      var f = props.querySelector('textarea, input');
      if (f) f.focus();
    }

    function deleteSelection() {
      if (!sel) { Y.toast('Önce bir kutu veya ok seçin.'); return; }
      if (sel.type === 'node') {
        data.nodes = data.nodes.filter(function (n) { return n.id !== sel.id; });
        data.edges = data.edges.filter(function (e) { return e.from !== sel.id && e.to !== sel.id; });
      } else if (sel.type === 'edge') {
        data.edges = data.edges.filter(function (e) { return e.id !== sel.id; });
      }
      sel = null;
      commit();
    }

    function autoArrange() {
      var order = Y.flowmapOrder(data);
      var depth = {}, byIdMap = {};
      data.nodes.forEach(function (n) { byIdMap[n.id] = n; depth[n.id] = 0; });
      // en uzun yol derinliği
      for (var pass = 0; pass < data.nodes.length; pass++) {
        var moved = false;
        data.edges.forEach(function (e) {
          if (depth[e.to] < depth[e.from] + 1) { depth[e.to] = depth[e.from] + 1; moved = true; }
        });
        if (!moved) break;
      }
      order.forEach(function (n) {
        n.x = 40 + depth[n.id] * (NODE_W + 72);
        var li = laneIndex(data, n.lane);
        n.yOff = Math.round((laneHeight(data.lanes[li]) - nodeH(n)) / 2);
      });
      commit();
      Y.toast('Kutular akışa göre dizildi.', 'ok');
    }

    /* ---------------------------------------------------------------- etkileşim */

    var drag = null;   // {node, dx, dy}
    var conn = null;   // {fromId, fromBox}
    var laneResize = null; // {laneId, startY, startH}

    function onPointerDown(e) {
      var resizeEl = e.target.closest && e.target.closest('.fm-lane-resize');
      var portEl = e.target.closest && e.target.closest('.fm-port');
      var nodeEl = e.target.closest && e.target.closest('.fm-node');
      var edgeEl = e.target.closest && e.target.closest('.fm-edge-hit');
      var laneEl = e.target.closest && e.target.closest('.fm-lane-head');

      if (resizeEl) {
        e.preventDefault();
        var lane = data.lanes.filter(function (l) { return l.id === resizeEl.getAttribute('data-lane'); })[0];
        if (!lane) return;
        laneResize = { lane: lane, startY: toSVG(e).y, startH: laneHeight(lane) };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (portEl) {
        e.preventDefault();
        conn = { fromId: portEl.getAttribute('data-node') };
        svg.setPointerCapture(e.pointerId);
        return;
      }
      if (nodeEl) {
        var n = byId(nodeEl.getAttribute('data-node'));
        if (!n) return;
        sel = { type: 'node', id: n.id };
        var p = toSVG(e);
        var b = box(data, n);
        drag = { node: n, dx: p.x - b.x, dy: p.y - b.y };
        svg.setPointerCapture(e.pointerId);
        draw();
        return;
      }
      if (edgeEl) {
        sel = { type: 'edge', id: edgeEl.getAttribute('data-edge') };
        draw();
        return;
      }
      if (laneEl) {
        sel = { type: 'lane', id: laneEl.getAttribute('data-lane') };
        draw();
        return;
      }
      sel = null;
      draw();
    }

    function onPointerMove(e) {
      if (laneResize) {
        var y = toSVG(e).y;
        laneResize.lane.h = Math.max(LANE_H_MIN, Math.min(LANE_H_MAX, snap(laneResize.startH + (y - laneResize.startY))));
        drawSoon();
      } else if (drag) {
        var p = toSVG(e);
        placeAt(drag.node, p.x - drag.dx, p.y - drag.dy);
        drawSoon();
      } else if (conn) {
        var q = toSVG(e);
        var from = byId(conn.fromId);
        if (!from) return;
        var b = box(data, from);
        var g = svg.querySelector('.fm-ghost');
        if (g) g.setAttribute('d', 'M' + b.cx + ' ' + b.cy + ' L' + q.x + ' ' + q.y);
        var over = document.elementFromPoint(e.clientX, e.clientY);
        var nEl = over && over.closest && over.closest('.fm-node');
        Array.prototype.slice.call(svg.querySelectorAll('.fm-node')).forEach(function (x) {
          x.classList.toggle('is-target', nEl === x && x.getAttribute('data-node') !== conn.fromId);
        });
      }
    }

    function onPointerUp(e) {
      if (laneResize) { laneResize = null; commit(); return; }
      if (drag) { drag = null; commit(); return; }
      if (conn) {
        var over = document.elementFromPoint(e.clientX, e.clientY);
        var nEl = over && over.closest && over.closest('.fm-node');
        var toId = nEl && nEl.getAttribute('data-node');
        if (toId && toId !== conn.fromId) {
          var dup = data.edges.some(function (x) { return x.from === conn.fromId && x.to === toId; });
          if (dup) {
            Y.toast('Bu iki kutu arasında zaten ok var.', 'err');
          } else {
            var src = byId(conn.fromId);
            var lbl = '';
            if (src && src.tur === 'Karar') {
              var out = data.edges.filter(function (x) { return x.from === src.id; }).length;
              lbl = out === 0 ? 'Evet' : out === 1 ? 'Hayır' : '';
            }
            var ed = { id: Y.uid(), from: conn.fromId, to: toId, etiket: lbl };
            data.edges.push(ed);
            sel = { type: 'edge', id: ed.id };
          }
        }
        conn = null;
        commit();
      }
    }

    function onDblClick(e) {
      if (e.target.closest && (e.target.closest('.fm-node') || e.target.closest('.fm-lane-head'))) return;
      var p = toSVG(e);
      if (p.x < LANE_W || p.y < HEADER_H) return;
      addNode('İşlem', p);
    }

    stage.addEventListener('keydown', function (e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault();
        deleteSelection();
      }
    });

    /* ---------------------------------------------------------------- paneller */

    function drawLanes() {
      lanePanel.innerHTML = '';
      lanePanel.appendChild(el('div', { class: 'fm-panel-title', text: 'Kulvarlar' }));
      var list = el('div', { class: 'fm-lane-rows' });
      var head = el('div', { class: 'fm-lane-row fm-lane-row-head' });
      head.appendChild(el('span', { class: 'fm-lane-n' }));
      head.appendChild(el('span', { class: 'tiny muted', text: 'Ad' }));
      head.appendChild(el('span', { class: 'tiny muted fm-lane-h-lab', text: 'Yükseklik (px)' }));
      list.appendChild(head);
      data.lanes.forEach(function (lane, i) {
        var row = el('div', { class: 'fm-lane-row' + (sel && sel.type === 'lane' && sel.id === lane.id ? ' is-sel' : '') });
        row.appendChild(el('span', { class: 'fm-lane-n', text: String(i + 1) }));
        var inp = el('input', { class: 'ctl', type: 'text', value: lane.ad || '', placeholder: 'Sorumlu / departman' });
        inp.addEventListener('input', function () {
          lane.ad = inp.value;
          setData(data);
          drawCanvasOnly();
        });
        row.appendChild(inp);

        var hInp = el('input', { class: 'ctl fm-lane-h', type: 'number', min: String(LANE_H_MIN), max: String(LANE_H_MAX),
          step: '8', title: 'Kulvar yüksekliği (piksel)', value: String(laneHeight(lane)) });
        hInp.addEventListener('change', function () {
          lane.h = Math.max(LANE_H_MIN, Math.min(LANE_H_MAX, parseInt(hInp.value, 10) || LANE_H));
          hInp.value = String(lane.h);
          commit();
        });
        row.appendChild(hInp);

        var up = el('button', { class: 'rowdel', type: 'button', title: 'Yukarı taşı', 'aria-label': 'Yukarı taşı', html: Y.ui('up') });
        up.disabled = i === 0;
        up.addEventListener('click', function () {
          data.lanes.splice(i - 1, 0, data.lanes.splice(i, 1)[0]);
          commit();
        });
        row.appendChild(up);

        var del = el('button', { class: 'rowdel', type: 'button', title: 'Kulvarı sil', 'aria-label': 'Kulvarı sil', html: Y.ui('trash') });
        del.addEventListener('click', function () {
          if (data.lanes.length < 2) { Y.toast('En az bir kulvar bulunmalı.', 'err'); return; }
          var target = data.lanes[i === 0 ? 1 : i - 1].id;
          data.nodes.forEach(function (n) { if (n.lane === lane.id) n.lane = target; });
          data.lanes.splice(i, 1);
          commit();
        });
        row.appendChild(del);
        list.appendChild(row);
      });
      lanePanel.appendChild(list);
    }

    function field(label, node, key, type, options, ph) {
      var wrap = el('div', { class: 'fm-field' });
      wrap.appendChild(el('label', { class: 'field-label', text: label }));
      var inp;
      if (type === 'select') {
        inp = el('select', { class: 'ctl' });
        inp.appendChild(el('option', { value: '', text: '— seçiniz —' }));
        options.forEach(function (o) { inp.appendChild(el('option', { value: o, text: o })); });
        inp.value = node[key] || '';
        inp.addEventListener('change', function () { node[key] = inp.value; commit(); });
      } else if (type === 'textarea') {
        inp = el('textarea', { class: 'ctl', rows: '2', placeholder: ph || '' });
        inp.value = node[key] || '';
        inp.addEventListener('input', function () { node[key] = inp.value; setData(data); drawCanvasOnly(); });
      } else {
        inp = el('input', { class: 'ctl', type: type || 'text', placeholder: ph || '' });
        inp.value = node[key] || '';
        inp.addEventListener('input', function () { node[key] = inp.value; setData(data); drawCanvasOnly(); });
      }
      wrap.appendChild(inp);
      return wrap;
    }

    function drawProps() {
      props.innerHTML = '';
      if (!sel) {
        props.appendChild(el('div', { class: 'fm-props-empty',
          text: 'Özelliklerini düzenlemek için bir kutu veya ok seçin.' }));
        return;
      }
      if (sel.type === 'edge') {
        var e2 = edgeById(sel.id);
        if (!e2) { sel = null; return drawProps(); }
        var a = byId(e2.from), b = byId(e2.to);
        props.appendChild(el('div', { class: 'fm-panel-title', text: 'Ok özellikleri' }));
        props.appendChild(el('div', { class: 'fm-props-path', text:
          (a ? (a.metin || 'Adsız') : '?') + '  →  ' + (b ? (b.metin || 'Adsız') : '?') }));
        var g2 = el('div', { class: 'fm-props-grid' });
        var w = el('div', { class: 'fm-field' });
        w.appendChild(el('label', { class: 'field-label', text: 'Ok etiketi (karar çıkışı)' }));
        var i2 = el('input', { class: 'ctl', type: 'text', value: e2.etiket || '', placeholder: 'Evet / Hayır / koşul' });
        i2.addEventListener('input', function () { e2.etiket = i2.value; setData(data); drawCanvasOnly(); });
        w.appendChild(i2);
        var quick = el('div', { class: 'fm-quick' });
        ['Evet', 'Hayır', 'Uygun', 'Uygun değil', ''].forEach(function (q) {
          var qb = el('button', { class: 'btn btn-sm btn-ghost', type: 'button', text: q || 'Etiketi kaldır' });
          qb.addEventListener('click', function () { e2.etiket = q; i2.value = q; setData(data); drawCanvasOnly(); });
          quick.appendChild(qb);
        });
        w.appendChild(quick);
        g2.appendChild(w);
        props.appendChild(g2);
        return;
      }
      if (sel.type === 'lane') {
        props.appendChild(el('div', { class: 'fm-props-empty',
          text: 'Kulvar adını aşağıdaki listeden düzenleyebilirsiniz.' }));
        return;
      }

      var n = byId(sel.id);
      if (!n) { sel = null; return drawProps(); }
      props.appendChild(el('div', { class: 'fm-panel-title', text: 'Kutu özellikleri' }));
      var g = el('div', { class: 'fm-props-grid' });
      g.appendChild(field('Adım açıklaması', n, 'metin', 'textarea', null, 'Ne yapılıyor?'));
      g.appendChild(field('Tür', n, 'tur', 'select', Y.FLOW_TYPES.map(function (t) { return t.label; })));
      var laneWrap = el('div', { class: 'fm-field' });
      laneWrap.appendChild(el('label', { class: 'field-label', text: 'Kulvar (sorumlu)' }));
      var laneSel = el('select', { class: 'ctl' });
      data.lanes.forEach(function (l) {
        laneSel.appendChild(el('option', { value: l.id, text: l.ad || 'Kulvar' }));
      });
      laneSel.value = n.lane;
      laneSel.addEventListener('change', function () { n.lane = laneSel.value; commit(); });
      laneWrap.appendChild(laneSel);
      g.appendChild(laneWrap);

      g.appendChild(field('Süre (dk)', n, 'sure', 'number'));
      g.appendChild(field('Katma değer', n, 'kd', 'select', Y.VALUE_TYPES.map(function (t) { return t.label; })));
      if (n.kd === 'İsraf') {
        g.appendChild(field('İsraf Türü (Muda)', n, 'israfTuru', 'select', Y.MUDA_TYPES));
      }
      g.appendChild(field('CNX sınıfı', n, 'cnx', 'select', Y.CNX_LABELS));
      g.appendChild(field('Girdi', n, 'girdi', 'text'));
      g.appendChild(field('Çıktı', n, 'cikti', 'text'));
      g.appendChild(field('Not', n, 'notlar', 'textarea'));
      props.appendChild(g);

      var acts = el('div', { class: 'fm-props-actions' });
      var dup = el('button', { class: 'btn btn-sm', type: 'button', html: Y.ui('copy') + '<span>Kutuyu çoğalt</span>' });
      dup.addEventListener('click', function () {
        var li = laneIndex(data, n.lane);
        var c = Object.assign({}, n, { id: Y.uid(), x: n.x + 40,
          yOff: Math.min(laneHeight(data.lanes[li]) - nodeH(n) - 10, n.yOff + 24) });
        data.nodes.push(c);
        sel = { type: 'node', id: c.id };
        commit();
      });
      var rm = el('button', { class: 'btn btn-sm btn-danger', type: 'button', html: Y.ui('trash') + '<span>Kutuyu sil</span>' });
      rm.addEventListener('click', deleteSelection);
      acts.appendChild(dup); acts.appendChild(rm);
      props.appendChild(acts);
    }

    function drawMetrics() {
      var m = Y.flowmapMetrics(data);
      metrics.innerHTML =
        '<strong>' + m.steps + '</strong> kutu · <strong>' + m.edges + '</strong> ok · ' +
        '<strong>' + m.decisions + '</strong> karar noktası · ' +
        'Toplam süre <strong>' + m.total + ' dk</strong> · ' +
        'Katma değerli <strong>' + m.va + ' dk</strong> · ' +
        'İsraf <strong>' + m.waste + ' dk</strong> · ' +
        'Süreç verimliliği <strong>%' + m.eff.toFixed(1) + '</strong>' +
        (m.cnx.C + m.cnx.N + m.cnx.X
          ? ' · CNX: <strong>C ' + m.cnx.C + '</strong> / <strong>N ' + m.cnx.N + '</strong> / <strong>X ' + m.cnx.X + '</strong>'
          : '');
    }

    function ensureSVG() {
      if (svg) return;
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'fm-svg');
      svg.setAttribute('font-family', 'Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif');
      stage.appendChild(svg);
      svg.addEventListener('pointerdown', onPointerDown);
      svg.addEventListener('pointermove', onPointerMove);
      svg.addEventListener('pointerup', onPointerUp);
      svg.addEventListener('pointercancel', onPointerUp);
      svg.addEventListener('dblclick', onDblClick);
    }

    function drawCanvasOnly() {
      ensureSVG();
      Y.renderFlowmapInto(svg, data, { interactive: true, selection: sel });
      applyZoom();
      drawMetrics();
      delBtn.disabled = !sel || sel.type === 'lane';
    }

    var rafPending = false;
    function drawSoon() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () { rafPending = false; drawCanvasOnly(); });
    }

    function draw() {
      drawCanvasOnly();
      drawProps();
      drawLanes();
    }

    draw();
    return {
      refresh: function () { data = getData(); draw(); }
    };
  };

  function chipIcon(shape) {
    var box = '<svg viewBox="0 0 26 16" width="24" height="15" fill="none" stroke="currentColor" stroke-width="1.5">';
    switch (shape) {
      case 'terminator': return box + '<rect x="1" y="2" width="24" height="12" rx="6"/></svg>';
      case 'decision':   return box + '<path d="M13 1.5 25 8l-12 6.5L1 8z"/></svg>';
      case 'delay':      return box + '<path d="M1 2h17a6 6 0 0 1 0 12H1z"/></svg>';
      case 'transport':  return box + '<path d="M1 2h19l5 6-5 6H1z"/></svg>';
      case 'storage':    return box + '<path d="M1 2h24l-12 12z"/></svg>';
      case 'inspection': return box + '<path d="M5 2h16l4 6-4 6H5L1 8z"/></svg>';
      case 'document':   return box + '<path d="M1 2h24v9q-6 4-12 0T1 11z"/></svg>';
      default:           return box + '<rect x="1" y="2" width="24" height="12" rx="2"/></svg>';
    }
  }

})(window.Y6S);
