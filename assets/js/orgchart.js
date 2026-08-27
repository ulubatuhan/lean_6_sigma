/* ==========================================================================
   Yepas Lean 6 Sigma — sürükle-bırak organizasyon şeması editörü

   Veri modeli:
     [{ id, ad, unvan, parent, x, y }]
   Konumlar (x, y) kalıcıdır — otomatik diz düğmesi ağaç düzenine göre
   yeniden hesaplar, kullanıcı sürükleyerek serbestçe taşıyabilir.
   Aynı yapı hem ekranda düzenlenir hem de PDF/Word çıktısına gider.
   ========================================================================== */

window.Y6S = window.Y6S || {};

(function (Y) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  var NW = 178, NH = 56, HG = 22, VG = 50, GRID = 8;
  var PAL = ['#142E51', '#2E7D32', '#026A39', '#4A7BA8', '#7FA3C4', '#B8860B'];

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

  /* ---------------------------------------------------------------- veri */

  /**
   * Veriyi normalize eder; id atar, geçersiz parent bağlarını temizler,
   * konumu olmayan düğümleri otomatik ağaç düzenine yerleştirir.
   */
  Y.normOrgchart = function (v) {
    var nodes = Array.isArray(v) ? v.map(function (n) { return Object.assign({}, n); }) : [];
    if (!nodes.length) nodes = [{ id: Y.uid(), ad: '', unvan: '', parent: '' }];
    var ids = {};
    nodes.forEach(function (n) { if (!n.id) n.id = Y.uid(); ids[n.id] = 1; });
    nodes.forEach(function (n) { if (n.parent && (!ids[n.parent] || n.parent === n.id)) n.parent = ''; });
    // Döngü koruması: atadan torununa geri bağlanan parent'ları temizle
    nodes.forEach(function (n) {
      var seen = {}, p = n.parent, byId = {};
      nodes.forEach(function (x) { byId[x.id] = x; });
      while (p) {
        if (p === n.id || seen[p]) { n.parent = ''; break; }
        seen[p] = 1;
        var pn = byId[p];
        p = pn ? pn.parent : '';
      }
    });
    if (nodes.some(function (n) { return typeof n.x !== 'number' || typeof n.y !== 'number'; })) {
      Y.orgTreeLayout(nodes);
    }
    return nodes;
  };

  /** Kids/roots haritasını çıkarır. */
  function tree(nodes) {
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });
    var kids = {}, roots = [];
    nodes.forEach(function (n) {
      if (n.parent && byId[n.parent]) (kids[n.parent] = kids[n.parent] || []).push(n);
      else roots.push(n);
    });
    return { byId: byId, kids: kids, roots: roots };
  }

  /**
   * Klasik ağaç dizilimi (measure/place); her düğümün x/y'sini doğrudan
   * veri üzerinde günceller. Var olan tüm düğümleri yeniden dizer.
   */
  Y.orgTreeLayout = function (nodes) {
    var t = tree(nodes);
    function measure(n) {
      var ch = t.kids[n.id] || [];
      if (!ch.length) { n._w = NW; return NW; }
      var tot = 0;
      ch.forEach(function (c) { tot += measure(c) + HG; });
      tot -= HG;
      n._w = Math.max(NW, tot);
      return n._w;
    }
    function place(n, x, d) {
      n.y = 16 + d * (NH + VG);
      var ch = t.kids[n.id] || [];
      if (!ch.length) { n.x = x + (n._w - NW) / 2; return; }
      var cx = x, tot = 0;
      ch.forEach(function (c) { tot += c._w + HG; });
      tot -= HG;
      cx = x + (n._w - tot) / 2;
      ch.forEach(function (c) { place(c, cx, d + 1); cx += c._w + HG; });
      n.x = (ch[0].x + ch[ch.length - 1].x) / 2;
    }
    var cursor = 16;
    t.roots.forEach(function (r) { measure(r); place(r, cursor, 0); cursor += r._w + HG * 2; });
    nodes.forEach(function (n) { delete n._w; });
  };

  function canvasSize(nodes) {
    var maxX = 0, maxY = 0;
    nodes.forEach(function (n) { maxX = Math.max(maxX, (n.x || 0) + NW); maxY = Math.max(maxY, (n.y || 0) + NH); });
    return { w: Math.max(640, maxX + 24), h: Math.max(160, maxY + 24) };
  }

  /* ---------------------------------------------------------------- çizim */

  Y.renderOrgchartInto = function (svg, nodes, opts) {
    opts = opts || {};
    var t = tree(nodes);
    var size = canvasSize(nodes);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + size.w + ' ' + size.h);
    svg.setAttribute('data-w', size.w);
    svg.setAttribute('data-h', size.h);
    svg.appendChild(s('rect', { width: size.w, height: size.h, fill: '#ffffff' }));

    var linesG = s('g', { class: 'oc-lines' });
    nodes.forEach(function (n) {
      var ch = t.kids[n.id] || [];
      if (!ch.length) return;
      var px = n.x + NW / 2, py = n.y + NH;
      var midY = py + VG / 2;
      linesG.appendChild(s('line', { x1: px, y1: py, x2: px, y2: midY, stroke: '#b9c3d1', 'stroke-width': 1.5 }));
      ch.forEach(function (c) {
        var ccx = c.x + NW / 2;
        linesG.appendChild(s('line', { x1: ccx, y1: midY, x2: ccx, y2: c.y, stroke: '#b9c3d1', 'stroke-width': 1.5 }));
      });
      if (ch.length > 1) {
        var a = ch[0].x + NW / 2, b = ch[ch.length - 1].x + NW / 2;
        linesG.appendChild(s('line', { x1: a, y1: midY, x2: b, y2: midY, stroke: '#b9c3d1', 'stroke-width': 1.5 }));
      }
    });
    svg.appendChild(linesG);

    var nodesG = s('g', { class: 'oc-nodes' });
    nodes.forEach(function (n) {
      var depth = 0, p = n.parent, byId = t.byId, guard = 0;
      while (p && byId[p] && guard++ < 20) { depth++; p = byId[p].parent; }
      var col = PAL[Math.min(depth, PAL.length - 1)];
      var sel = opts.selection === n.id;
      var g = s('g', { class: 'oc-node' + (sel ? ' is-sel' : ''), 'data-node': n.id });
      g.appendChild(s('rect', {
        x: n.x, y: n.y, width: NW, height: NH, rx: 6,
        fill: '#ffffff', stroke: sel ? '#2E7D32' : col, 'stroke-width': sel ? 2.4 : 1.6
      }));
      g.appendChild(s('rect', { x: n.x, y: n.y, width: 5, height: NH, rx: 2.5, fill: col, 'pointer-events': 'none' }));
      var adLine = Y.wrapText(n.ad || 'İsimsiz', NW - 24, 12.5, 1)[0];
      g.appendChild(s('text', {
        x: n.x + 14, y: n.y + 21, 'font-size': 12.5, 'font-weight': 700, fill: '#16202e', 'pointer-events': 'none', text: adLine
      }));
      var unLines = Y.wrapText(n.unvan || '', NW - 24, 11, 2);
      var ut = s('text', { x: n.x + 14, y: n.y + 36, 'font-size': 10.5, fill: '#55637a', 'pointer-events': 'none' });
      unLines.forEach(function (l, i) { ut.appendChild(s('tspan', { x: n.x + 14, y: n.y + 36 + i * 12, text: l })); });
      g.appendChild(ut);
      nodesG.appendChild(g);
    });
    svg.appendChild(nodesG);
    return svg;
  };

  Y.buildOrgchartSVG = function (nodes, opts) {
    var size = canvasSize(nodes);
    var svg = s('svg', {
      xmlns: NS, width: size.w, height: size.h,
      'font-family': 'Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif', class: 'oc-svg'
    });
    Y.renderOrgchartInto(svg, nodes, opts);
    return svg;
  };

  Y.orgchartSVGString = function (v) {
    var nodes = Y.normOrgchart(v).filter(function (n) { return String(n.ad || n.unvan || '').trim(); });
    if (!nodes.length) return null;
    var svg = Y.buildOrgchartSVG(nodes, { interactive: false });
    return new XMLSerializer().serializeToString(svg);
  };

  /* ==========================================================================
     Editör
     ========================================================================== */

  var el = function () { return Y.el.apply(Y, arguments); };

  Y.mountOrgchartEditor = function (host, getData, setData) {
    var nodes = getData();
    var sel = null;
    var zoom = 1;

    host.innerHTML = '';
    host.className = 'fm-editor oc-editor';

    var bar2 = el('div', { class: 'fm-toolbar2' });
    function tool(label, icon, fn, cls) {
      var b = el('button', { class: 'btn btn-sm ' + (cls || ''), type: 'button',
        html: (icon ? Y.ui(icon) : '') + '<span>' + Y.esc(label) + '</span>' });
      b.addEventListener('click', fn);
      bar2.appendChild(b);
      return b;
    }
    tool('Kişi ekle', 'plus', function () { addNode(); });
    tool('Otomatik diz', 'align', function () {
      Y.orgTreeLayout(nodes);
      commit();
      Y.toast('Şema hiyerarşiye göre dizildi.', 'ok');
    });
    var delBtn = tool('Seçileni sil', 'trash', deleteSelection, 'btn-danger');
    bar2.appendChild(el('div', { style: 'flex:1' }));
    var zoomOut = el('button', { class: 'btn btn-sm btn-ghost btn-icon', type: 'button', title: 'Uzaklaştır', text: '−' });
    var zoomLbl = el('span', { class: 'fm-zoom', text: '%100' });
    var zoomIn = el('button', { class: 'btn btn-sm btn-ghost btn-icon', type: 'button', title: 'Yakınlaştır', text: '+' });
    zoomOut.addEventListener('click', function () { setZoom(zoom - 0.1); });
    zoomIn.addEventListener('click', function () { setZoom(zoom + 0.1); });
    bar2.appendChild(zoomOut); bar2.appendChild(zoomLbl); bar2.appendChild(zoomIn);
    host.appendChild(bar2);

    var hint = el('div', { class: 'fm-hint', html:
      'Kutuyu <strong>sürükleyerek</strong> serbestçe taşıyın. Kutuya tıklayıp sağdaki panelden ' +
      '<strong>bağlı olduğu yöneticiyi</strong> değiştirerek hiyerarşiyi kurun. Boş alana ' +
      '<strong>çift tıklayarak</strong> hızlıca kişi ekleyebilir, <strong>Otomatik diz</strong> ile şemayı toparlayabilirsiniz.' });
    host.appendChild(hint);

    var stage = el('div', { class: 'fm-stage', tabindex: '0' });
    host.appendChild(stage);

    var props = el('div', { class: 'fm-props' });
    host.appendChild(props);

    var svg = null;

    function commit() { setData(nodes); draw(); }

    function byId(id) {
      for (var i = 0; i < nodes.length; i++) if (nodes[i].id === id) return nodes[i];
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

    function addNode(at) {
      var last = nodes[nodes.length - 1];
      var n = { id: Y.uid(), ad: '', unvan: '', parent: sel && byId(sel) ? sel : '', x: 40, y: 16 };
      if (at) { n.x = Math.max(8, snap(at.x - NW / 2)); n.y = Math.max(8, snap(at.y - NH / 2)); }
      else {
        var maxX = 0;
        nodes.forEach(function (o) { maxX = Math.max(maxX, o.x + NW); });
        n.x = maxX ? maxX + HG : 40;
        n.y = last ? last.y : 16;
      }
      nodes.push(n);
      sel = n.id;
      commit();
      var f = props.querySelector('input, select');
      if (f) f.focus();
    }

    function deleteSelection() {
      if (!sel) { Y.toast('Önce bir kutu seçin.'); return; }
      var gone = sel;
      nodes = nodes.filter(function (n) { return n.id !== gone; });
      nodes.forEach(function (n) { if (n.parent === gone) n.parent = ''; });
      sel = null;
      setData(nodes);
      draw();
    }

    /* ---- etkileşim ---- */

    var drag = null;

    function onPointerDown(e) {
      var nodeEl = e.target.closest && e.target.closest('.oc-node');
      if (nodeEl) {
        var n = byId(nodeEl.getAttribute('data-node'));
        if (!n) return;
        sel = n.id;
        var p = toSVG(e);
        drag = { node: n, dx: p.x - n.x, dy: p.y - n.y };
        svg.setPointerCapture(e.pointerId);
        draw();
        return;
      }
      sel = null;
      draw();
    }
    function onPointerMove(e) {
      if (!drag) return;
      var p = toSVG(e);
      drag.node.x = Math.max(4, snap(p.x - drag.dx));
      drag.node.y = Math.max(4, snap(p.y - drag.dy));
      drawSoon();
    }
    function onPointerUp() {
      if (drag) { drag = null; commit(); }
    }
    function onDblClick(e) {
      if (e.target.closest && e.target.closest('.oc-node')) return;
      addNode(toSVG(e));
    }

    stage.addEventListener('keydown', function (e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); deleteSelection(); }
    });

    /* ---- özellik paneli ---- */

    function field(label, node, key, type, options) {
      var wrap = el('div', { class: 'fm-field' });
      wrap.appendChild(el('label', { class: 'field-label', text: label }));
      var inp;
      if (type === 'select') {
        inp = el('select', { class: 'ctl' });
        options.forEach(function (o) { inp.appendChild(el('option', { value: o.value, text: o.text })); });
        inp.value = node[key] || '';
        inp.addEventListener('change', function () { node[key] = inp.value; commit(); });
      } else {
        inp = el('input', { class: 'ctl', type: 'text' });
        inp.value = node[key] || '';
        inp.addEventListener('input', function () { node[key] = inp.value; setData(nodes); drawCanvasOnly(); });
      }
      wrap.appendChild(inp);
      return wrap;
    }

    function drawProps() {
      props.innerHTML = '';
      var n = sel && byId(sel);
      if (!n) {
        props.appendChild(el('div', { class: 'fm-props-empty', text: 'Özelliklerini düzenlemek için bir kutu seçin.' }));
        return;
      }
      props.appendChild(el('div', { class: 'fm-panel-title', text: 'Kişi özellikleri' }));
      var g = el('div', { class: 'fm-props-grid' });
      g.appendChild(field('Ad Soyad', n, 'ad', 'text'));
      g.appendChild(field('Ünvan / Görev', n, 'unvan', 'text'));
      var opts = [{ value: '', text: '— en üst —' }].concat(
        nodes.filter(function (o) { return o.id !== n.id; })
          .map(function (o) { return { value: o.id, text: o.ad || o.unvan || 'İsimsiz' }; })
      );
      g.appendChild(field('Bağlı olduğu yönetici', n, 'parent', 'select', opts));
      props.appendChild(g);

      var acts = el('div', { class: 'fm-props-actions' });
      var dup = el('button', { class: 'btn btn-sm', type: 'button', html: Y.ui('copy') + '<span>Kutuyu çoğalt</span>' });
      dup.addEventListener('click', function () {
        var c = Object.assign({}, n, { id: Y.uid(), x: n.x + 40, y: n.y + 24 });
        nodes.push(c);
        sel = c.id;
        commit();
      });
      var rm = el('button', { class: 'btn btn-sm btn-danger', type: 'button', html: Y.ui('trash') + '<span>Kutuyu sil</span>' });
      rm.addEventListener('click', deleteSelection);
      acts.appendChild(dup); acts.appendChild(rm);
      props.appendChild(acts);
    }

    function ensureSVG() {
      if (svg) return;
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'fm-svg oc-svg');
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
      Y.renderOrgchartInto(svg, nodes, { interactive: true, selection: sel });
      applyZoom();
      delBtn.disabled = !sel;
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
    }

    draw();
    return {
      refresh: function () { nodes = getData(); draw(); }
    };
  };

})(window.Y6S);
