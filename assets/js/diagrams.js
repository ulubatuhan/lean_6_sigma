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

  Y.wrapText = wrap;

  /** Neden kaydını {t, cnx} biçimine getirir (eski kayıtlar düz metindi). */
  Y.normCause = function (v) {
    if (v && typeof v === 'object') return { t: String(v.t || ''), cnx: String(v.cnx || '') };
    return { t: String(v == null ? '' : v), cnx: '' };
  };

  Y.normCauseList = function (arr) {
    return (Array.isArray(arr) ? arr : []).map(Y.normCause);
  };

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
      return Y.normCauseList(data[c.key]).filter(function (o) { return o.t.trim(); });
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
      '" rx="8" fill="#142E51"/>';
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
        var py = cy + dir * (28 + j * 20);
        var px = ax - skew * ((py - cy) * dir / boneH);
        s += '<line x1="' + px.toFixed(1) + '" y1="' + py + '" x2="' + (px + 13).toFixed(1) + '" y2="' + py +
          '" stroke="' + c.color + '" stroke-width="1.4"/>';
        var tx = px + 17;
        var ck = Y.cnxKey ? Y.cnxKey(cause.cnx) : '';
        if (ck) {
          s += '<circle cx="' + (tx + 6).toFixed(1) + '" cy="' + (py - 3.5) + '" r="6.5" fill="' + Y.cnxColor(ck) + '"/>' +
            '<text x="' + (tx + 6).toFixed(1) + '" y="' + (py + 0.5) + '" text-anchor="middle" font-size="8.5" ' +
            'font-weight="700" fill="#ffffff">' + ck + '</text>';
          tx += 17;
        }
        var txt = wrap(cause.t, 190, 11.5, 1)[0];
        s += '<text x="' + tx.toFixed(1) + '" y="' + (py + 4) + '" font-size="11.5" fill="#16202e">' + E(txt) + '</text>';
      });
    });

    return s + '</svg>';
  };

  /* Organizasyon şeması artık assets/js/orgchart.js içindeki sürükle-bırak
     editörü tarafından üretiliyor (Y.orgchartSVGString / Y.normOrgchart). */

})(window.Y6S);
