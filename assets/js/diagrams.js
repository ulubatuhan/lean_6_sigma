/* ==========================================================================
   Yepas Lean 6 Sigma — SVG diyagram üreticileri
   Tüm fonksiyonlar SVG kaynak metni döndürür (hem ekranda hem çıktıda kullanılır).
   ========================================================================== */

window.Y6S = window.Y6S || {};

(function (Y) {
  'use strict';

  var E = Y.esc;

  /** Metni yaklaşık genişliğe göre satırlara böler. */
  function wrap(text, maxPx, fontPx, maxLines) {
    var words = String(text || '').trim().split(/\s+/).filter(Boolean);
    var per = fontPx * 0.55;
    var max = Math.max(3, Math.floor(maxPx / per));
    var lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!cur) { cur = w; }
      else if ((cur + ' ' + w).length <= max) { cur += ' ' + w; }
      else { lines.push(cur); cur = w; }
      if (maxLines && lines.length === maxLines) break;
    }
    if (cur && (!maxLines || lines.length < maxLines)) lines.push(cur);
    if (maxLines && lines.length >= maxLines) {
      var used = lines.join(' ').split(/\s+/).length;
      if (used < words.length) {
        var last = lines[maxLines - 1];
        lines[maxLines - 1] = (last.length > max - 1 ? last.slice(0, max - 1) : last) + '…';
      }
    }
    return lines.length ? lines : [''];
  }

  function tspans(lines, x, y, lh) {
    return lines.map(function (l, i) {
      return '<tspan x="' + x + '" y="' + (y + i * lh) + '">' + E(l) + '</tspan>';
    }).join('');
  }

  var FONT = 'font-family="Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"';

  function open(w, h, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" ' +
      'width="' + w + '" height="' + h + '" ' + FONT + ' ' + (extra || '') + '>' +
      '<rect width="' + w + '" height="' + h + '" fill="#ffffff"/>';
  }

  /* ==========================================================================
     Balık kılçığı (Ishikawa)
     ========================================================================== */

  Y.fishboneSVG = function (categories, data, effect) {
    data = data || {};
    var cats = categories || Y.M6;
    var lists = cats.map(function (c) {
      return (data[c.key] || []).filter(function (s) { return String(s || '').trim(); });
    });
    var maxN = lists.reduce(function (m, l) { return Math.max(m, l.length); }, 0);

    var W = 1160;
    var boneH = Math.max(150, 40 + maxN * 20);
    var H = boneH * 2 + 100;
    var cy = H / 2;
    var x0 = 34, headW = 190, x1 = W - headW - 16;

    var s = open(W, H);

    // Omurga
    s += '<line x1="' + x0 + '" y1="' + cy + '" x2="' + x1 + '" y2="' + cy + '" stroke="#16202e" stroke-width="3"/>';
    s += '<polygon points="' + x1 + ',' + (cy - 9) + ' ' + (x1 + 16) + ',' + cy + ' ' + x1 + ',' + (cy + 9) + '" fill="#16202e"/>';

    // Etki kutusu
    var effLines = wrap(effect || 'Problem / Etki', headW - 24, 14, 4);
    var effH = Math.max(56, effLines.length * 18 + 24);
    s += '<rect x="' + (x1 + 18) + '" y="' + (cy - effH / 2) + '" width="' + (headW - 18) + '" height="' + effH +
      '" rx="8" fill="#0e4d64"/>';
    s += '<text x="' + (x1 + 18 + (headW - 18) / 2) + '" y="' + (cy - effH / 2 + 22) +
      '" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">' +
      tspans(effLines, x1 + 18 + (headW - 18) / 2, cy - effH / 2 + 22, 17) + '</text>';

    // Kılçıklar
    var span = x1 - x0 - 150;
    var step = span / 3;
    var skew = 92;

    cats.forEach(function (c, i) {
      var top = i < 3;
      var col = i % 3;
      var ax = x0 + 110 + col * step + (top ? 0 : step * 0.16);
      var dir = top ? -1 : 1;
      var ex = ax - skew, ey = cy + dir * boneH;

      s += '<line x1="' + ax + '" y1="' + cy + '" x2="' + ex + '" y2="' + ey + '" stroke="' + c.color + '" stroke-width="2.4"/>';

      // Kategori etiketi
      var lw = 128, lh = 26;
      var lx = ex - lw / 2, ly = top ? ey - lh - 2 : ey + 2;
      s += '<rect x="' + lx + '" y="' + ly + '" width="' + lw + '" height="' + lh + '" rx="5" fill="' + c.color + '"/>';
      s += '<text x="' + ex + '" y="' + (ly + 17) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">' +
        E(c.label) + '</text>';

      // Nedenler
      lists[i].forEach(function (cause, j) {
        var t = (j + 1) / (maxN + 1.2);
        var py = cy + dir * (28 + j * 20);
        var px = ax - skew * ((py - cy) * dir / boneH);
        s += '<line x1="' + px.toFixed(1) + '" y1="' + py + '" x2="' + (px + 13).toFixed(1) + '" y2="' + py +
          '" stroke="' + c.color + '" stroke-width="1.4"/>';
        var txt = wrap(cause, 190, 11.5, 1)[0];
        s += '<text x="' + (px + 17).toFixed(1) + '" y="' + (py + 4) + '" font-size="11.5" fill="#16202e">' + E(txt) + '</text>';
        void t;
      });
    });

    return s + '</svg>';
  };

  /* ==========================================================================
     Süreç akış diyagramı
     ========================================================================== */

  function flowShape(shape, x, y, w, h, fill, stroke) {
    var cx = x + w / 2, cy = y + h / 2;
    var a = 'fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.6"';
    switch (shape) {
      case 'terminator':
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '" ' + a + '/>';
      case 'decision':
        return '<polygon points="' + cx + ',' + y + ' ' + (x + w) + ',' + cy + ' ' + cx + ',' + (y + h) + ' ' + x + ',' + cy + '" ' + a + '/>';
      case 'delay':
        return '<path d="M' + x + ' ' + y + ' H' + (x + w - h / 2) + ' A' + (h / 2) + ' ' + (h / 2) + ' 0 0 1 ' +
          (x + w - h / 2) + ' ' + (y + h) + ' H' + x + ' Z" ' + a + '/>';
      case 'transport':
        return '<polygon points="' + x + ',' + y + ' ' + (x + w - 22) + ',' + y + ' ' + (x + w) + ',' + cy + ' ' +
          (x + w - 22) + ',' + (y + h) + ' ' + x + ',' + (y + h) + '" ' + a + '/>';
      case 'storage':
        return '<polygon points="' + x + ',' + y + ' ' + (x + w) + ',' + y + ' ' + cx + ',' + (y + h) + '" ' + a + '/>';
      case 'inspection':
        return '<polygon points="' + (x + 20) + ',' + y + ' ' + (x + w - 20) + ',' + y + ' ' + (x + w) + ',' + cy + ' ' +
          (x + w - 20) + ',' + (y + h) + ' ' + (x + 20) + ',' + (y + h) + ' ' + x + ',' + cy + '" ' + a + '/>';
      case 'document':
        return '<path d="M' + x + ' ' + y + ' H' + (x + w) + ' V' + (y + h - 9) +
          ' q' + (-w / 4) + ' 12 ' + (-w / 2) + ' 0 q' + (-w / 4) + ' -12 ' + (-w / 2) + ' 0 Z" ' + a + '/>';
      default:
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" ' + a + '/>';
    }
  }

  function shapeFor(label) {
    for (var i = 0; i < Y.FLOW_TYPES.length; i++) {
      if (Y.FLOW_TYPES[i].label === label) return Y.FLOW_TYPES[i].shape;
    }
    return 'process';
  }

  function valueColor(label) {
    for (var i = 0; i < Y.VALUE_TYPES.length; i++) {
      if (Y.VALUE_TYPES[i].label === label) return Y.VALUE_TYPES[i].color;
    }
    return '#8a94a6';
  }

  Y.flowSVG = function (rows) {
    rows = (rows || []).filter(function (r) {
      return r && (String(r.adim || '').trim() || String(r.sorumlu || '').trim());
    });
    if (!rows.length) return null;

    var W = 900, boxW = 300, boxH = 56, gap = 40;
    var left = 240;
    var H = 28 + rows.length * (boxH + gap) + 12;
    var s = open(W, H);

    rows.forEach(function (r, i) {
      var y = 28 + i * (boxH + gap);
      var shape = shapeFor(r.tur);
      var vc = valueColor(r.kd);

      // Bağlantı oku
      if (i > 0) {
        var py = y - gap;
        s += '<line x1="' + (left + boxW / 2) + '" y1="' + py + '" x2="' + (left + boxW / 2) + '" y2="' + (y - 9) +
          '" stroke="#8a94a6" stroke-width="1.6"/>';
        s += '<polygon points="' + (left + boxW / 2 - 5) + ',' + (y - 9) + ' ' + (left + boxW / 2 + 5) + ',' + (y - 9) +
          ' ' + (left + boxW / 2) + ',' + y + '" fill="#8a94a6"/>';
      }

      // Sıra numarası
      s += '<circle cx="' + (left - 26) + '" cy="' + (y + boxH / 2) + '" r="12" fill="#eceff4" stroke="#b9c3d1"/>';
      s += '<text x="' + (left - 26) + '" y="' + (y + boxH / 2 + 4) + '" text-anchor="middle" font-size="11" ' +
        'font-weight="700" fill="#55637a">' + (i + 1) + '</text>';

      // Katma değer şeridi
      s += '<rect x="' + (left - 8) + '" y="' + y + '" width="5" height="' + boxH + '" rx="2.5" fill="' + vc + '"/>';

      // Şekil
      s += flowShape(shape, left, y, boxW, boxH, '#f4f7fa', '#0e4d64');

      var lines = wrap(r.adim, boxW - 40, 12, 2);
      var ty = y + boxH / 2 - (lines.length - 1) * 7 + 4;
      s += '<text x="' + (left + boxW / 2) + '" y="' + ty + '" text-anchor="middle" font-size="12" fill="#16202e">' +
        tspans(lines, left + boxW / 2, ty, 14) + '</text>';

      // Sağ bilgi
      var info = [];
      if (r.sorumlu) info.push(String(r.sorumlu));
      if (r.sure) info.push(String(r.sure) + ' dk');
      if (r.tur) info.push(String(r.tur));
      var iy = y + 16;
      s += '<text x="' + (left + boxW + 18) + '" y="' + iy + '" font-size="11" fill="#55637a">' +
        tspans(info.length ? info : [''], left + boxW + 18, iy, 15) + '</text>';
    });

    return s + '</svg>';
  };

  /* ==========================================================================
     Organizasyon şeması
     ========================================================================== */

  Y.orgchartSVG = function (nodes) {
    nodes = (nodes || []).filter(function (n) { return n && String(n.ad || n.unvan || '').trim(); });
    if (!nodes.length) return null;

    var byId = {};
    nodes.forEach(function (n, i) { n._i = i; n._id = n.id || ('n' + i); byId[n._id] = n; });

    var kids = {}, roots = [];
    nodes.forEach(function (n) {
      var p = n.parent && byId[n.parent] && n.parent !== n._id ? n.parent : null;
      if (p) { (kids[p] = kids[p] || []).push(n); }
      else roots.push(n);
    });

    // Döngü koruması: erişilemeyen düğümleri köke al
    var seen = {};
    (function mark(list, depth) {
      if (depth > 12) return;
      list.forEach(function (n) {
        if (seen[n._id]) return;
        seen[n._id] = 1;
        mark(kids[n._id] || [], depth + 1);
      });
    })(roots, 0);
    nodes.forEach(function (n) { if (!seen[n._id]) { roots.push(n); seen[n._id] = 1; } });

    var NW = 178, NH = 56, HG = 20, VG = 46;

    function measure(n) {
      var ch = kids[n._id] || [];
      if (!ch.length) { n._w = NW; return NW; }
      var tot = 0;
      ch.forEach(function (c) { tot += measure(c) + HG; });
      tot -= HG;
      n._w = Math.max(NW, tot);
      return n._w;
    }
    function place(n, x, d) {
      n._d = d;
      n._y = 16 + d * (NH + VG);
      var ch = kids[n._id] || [];
      if (!ch.length) { n._x = x + (n._w - NW) / 2; return; }
      var cx = x, tot = 0;
      ch.forEach(function (c) { tot += c._w + HG; });
      tot -= HG;
      cx = x + (n._w - tot) / 2;
      ch.forEach(function (c) { place(c, cx, d + 1); cx += c._w + HG; });
      n._x = (ch[0]._x + ch[ch.length - 1]._x) / 2;
    }

    var cursor = 16, maxDepth = 0;
    roots.forEach(function (r) { measure(r); place(r, cursor, 0); cursor += r._w + HG * 2; });
    nodes.forEach(function (n) { if (n._d != null) maxDepth = Math.max(maxDepth, n._d); });

    var W = Math.max(600, cursor + 16);
    var H = 32 + (maxDepth + 1) * (NH + VG) - VG + 16;
    var s = open(W, H);

    var PAL = ['#0e4d64', '#14708f', '#2b8ca8', '#4aa3bd', '#6fb9cd'];

    // Bağlantılar
    nodes.forEach(function (n) {
      var ch = kids[n._id] || [];
      if (!ch.length || n._x == null) return;
      var px = n._x + NW / 2, py = n._y + NH;
      var midY = py + VG / 2;
      s += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + midY + '" stroke="#b9c3d1" stroke-width="1.5"/>';
      ch.forEach(function (c) {
        var ccx = c._x + NW / 2;
        s += '<line x1="' + ccx + '" y1="' + midY + '" x2="' + ccx + '" y2="' + c._y + '" stroke="#b9c3d1" stroke-width="1.5"/>';
      });
      if (ch.length > 1) {
        var a = ch[0]._x + NW / 2, b = ch[ch.length - 1]._x + NW / 2;
        s += '<line x1="' + a + '" y1="' + midY + '" x2="' + b + '" y2="' + midY + '" stroke="#b9c3d1" stroke-width="1.5"/>';
      }
    });

    // Kutular
    nodes.forEach(function (n) {
      if (n._x == null) return;
      var col = PAL[Math.min(n._d, PAL.length - 1)];
      s += '<rect x="' + n._x + '" y="' + n._y + '" width="' + NW + '" height="' + NH +
        '" rx="6" fill="#ffffff" stroke="' + col + '" stroke-width="1.6"/>';
      s += '<rect x="' + n._x + '" y="' + n._y + '" width="5" height="' + NH + '" rx="2.5" fill="' + col + '"/>';
      var ad = wrap(n.ad, NW - 24, 12.5, 1)[0];
      var un = wrap(n.unvan, NW - 24, 11, 2);
      s += '<text x="' + (n._x + 14) + '" y="' + (n._y + 21) + '" font-size="12.5" font-weight="700" fill="#16202e">' + E(ad) + '</text>';
      s += '<text x="' + (n._x + 14) + '" y="' + (n._y + 36) + '" font-size="10.5" fill="#55637a">' +
        tspans(un, n._x + 14, n._y + 36, 12) + '</text>';
    });

    return s + '</svg>';
  };

})(window.Y6S);
