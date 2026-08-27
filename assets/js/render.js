/* ==========================================================================
   Yepas Lean 6 Sigma — şemadan etkileşimli form üretimi
   ========================================================================== */

window.Y6S = window.Y6S || {};

(function (Y) {
  'use strict';

  var el = Y.el;

  /* ---------------------------------------------------------------- ortak */

  function labelFor(field) {
    return el('label', { class: 'field-label', text: field.label || '' });
  }

  function widthClass(w) {
    return 'f-' + (w || 'full');
  }

  /** Görseli küçültüp data URL döndürür. */
  function readImage(file, cb) {
    if (!file || !/^image\//.test(file.type)) { cb(null); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1400, w = img.width, h = img.height;
        var sc = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * sc));
        c.height = Math.max(1, Math.round(h * sc));
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        try { cb(c.toDataURL('image/jpeg', 0.82)); } catch (e) { cb(null); }
      };
      img.onerror = function () { cb(null); };
      img.src = fr.result;
    };
    fr.onerror = function () { cb(null); };
    fr.readAsDataURL(file);
  }

  /** Basit metin listesi düzenleyici (SIPOC, balık kılçığı). */
  function listEditor(getArr, setArr, opts) {
    opts = opts || {};
    var box = el('div', { class: 'fishcat-body' });

    function paint() {
      box.innerHTML = '';
      var arr = getArr();
      var min = opts.minRows || 3;
      while (arr.length < min) arr.push('');
      arr.forEach(function (v, i) {
        var row = el('div', { class: 'causerow' });
        var inp = el('input', { class: 'ctl', type: 'text', value: v || '', placeholder: opts.placeholder || '' });
        inp.addEventListener('input', function () { arr[i] = inp.value; setArr(arr); });
        var del = el('button', {
          class: 'rowdel', type: 'button', 'aria-label': 'Satırı sil', title: 'Satırı sil', html: Y.ui('trash')
        });
        del.addEventListener('click', function () {
          arr.splice(i, 1);
          setArr(arr);
          paint();
        });
        row.appendChild(inp);
        row.appendChild(del);
        box.appendChild(row);
      });
      var add = el('button', { class: 'btn btn-sm btn-ghost', type: 'button', html: Y.ui('plus') + '<span>Ekle</span>' });
      add.addEventListener('click', function () {
        var a = getArr(); a.push(''); setArr(a); paint();
        var inputs = box.querySelectorAll('input');
        if (inputs.length) inputs[inputs.length - 1].focus();
      });
      box.appendChild(add);
    }
    paint();
    return box;
  }

  /* ---------------------------------------------------------------- tablo */

  function tableEditor(field, data, changed) {
    var cols = field.columns || [];
    if (!Array.isArray(data[field.name])) {
      data[field.name] = (field.seed || [{}]).map(function (s) { return Object.assign({}, s); });
    }
    var rows = data[field.name];

    var wrap = el('div');
    if (field.label) wrap.appendChild(labelFor(field));

    var scroll = el('div', { class: 'tbl-wrap' });
    var tbl = el('table', { class: 'etbl' });
    var thead = el('thead');
    var htr = el('tr');
    htr.appendChild(el('th', { text: '#', style: 'width:34px;text-align:center' }));
    cols.forEach(function (c) {
      htr.appendChild(el('th', { text: c.label, style: c.width ? 'width:' + c.width : '' }));
    });
    htr.appendChild(el('th', { html: '<span class="sr-only">İşlem</span>', style: 'width:38px' }));
    thead.appendChild(htr);
    tbl.appendChild(thead);
    var tbody = el('tbody');
    tbl.appendChild(tbody);
    scroll.appendChild(tbl);
    wrap.appendChild(scroll);

    function cell(col, row) {
      var td = el('td');
      var n;
      if (col.type === 'textarea') {
        n = el('textarea', { rows: 1, placeholder: col.placeholder || '' });
        n.value = row[col.name] || '';
        n.addEventListener('input', function () {
          row[col.name] = n.value;
          n.style.height = 'auto';
          n.style.height = Math.min(180, n.scrollHeight + 2) + 'px';
          changed();
        });
        setTimeout(function () { n.style.height = Math.min(180, n.scrollHeight + 2) + 'px'; }, 0);
      } else if (col.type === 'select') {
        n = el('select');
        n.appendChild(el('option', { value: '', text: '—' }));
        (col.options || []).forEach(function (o) { n.appendChild(el('option', { value: o, text: o })); });
        n.value = row[col.name] || '';
        n.addEventListener('change', function () { row[col.name] = n.value; changed(); });
      } else {
        n = el('input', { type: col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text',
          placeholder: col.placeholder || '' });
        n.value = row[col.name] || '';
        n.addEventListener('input', function () { row[col.name] = n.value; changed(); });
      }
      td.appendChild(n);
      return td;
    }

    function paint() {
      tbody.innerHTML = '';
      rows.forEach(function (row, i) {
        var tr = el('tr');
        tr.appendChild(el('td', { class: 'rowno', text: String(i + 1) }));
        cols.forEach(function (c) { tr.appendChild(cell(c, row)); });
        var act = el('td', { class: 'rowact' });
        var del = el('button', { class: 'rowdel', type: 'button', title: 'Satırı sil', 'aria-label': 'Satırı sil', html: Y.ui('trash') });
        del.addEventListener('click', function () { rows.splice(i, 1); paint(); changed(); });
        act.appendChild(del);
        tr.appendChild(act);
        tbody.appendChild(tr);
      });
      if (!rows.length) {
        tbody.appendChild(el('tr', {}, [
          el('td', { colspan: String(cols.length + 2), class: 'muted tiny', style: 'padding:14px;text-align:center',
            text: 'Henüz satır yok.' })
        ]));
      }
    }

    var actions = el('div', { class: 'tbl-actions' });
    var add = el('button', { class: 'btn btn-sm', type: 'button', html: Y.ui('plus') + '<span>' + Y.esc(field.addLabel || 'Satır ekle') + '</span>' });
    add.addEventListener('click', function () {
      rows.push({});
      paint(); changed();
      var last = tbody.querySelector('tr:last-child input, tr:last-child textarea');
      if (last) last.focus();
    });
    var add5 = el('button', { class: 'btn btn-sm btn-ghost', type: 'button', text: '+5 satır' });
    add5.addEventListener('click', function () {
      for (var i = 0; i < 5; i++) rows.push({});
      paint(); changed();
    });
    actions.appendChild(add);
    actions.appendChild(add5);
    wrap.appendChild(actions);

    paint();
    return { node: wrap, repaint: paint };
  }

  /* ---------------------------------------------------------------- alanlar */

  var FIELDS = {

    text: function (f, data, changed) {
      var n = el('input', { class: 'ctl', type: 'text', placeholder: f.placeholder || '' });
      n.value = data[f.name] || '';
      n.addEventListener('input', function () { data[f.name] = n.value; changed(); });
      return n;
    },

    number: function (f, data, changed) {
      var n = el('input', { class: 'ctl', type: 'number', placeholder: f.placeholder || '' });
      n.value = data[f.name] || '';
      n.addEventListener('input', function () { data[f.name] = n.value; changed(); });
      return n;
    },

    date: function (f, data, changed) {
      var n = el('input', { class: 'ctl', type: 'date' });
      n.value = data[f.name] || '';
      n.addEventListener('input', function () { data[f.name] = n.value; changed(); });
      return n;
    },

    select: function (f, data, changed) {
      var n = el('select', { class: 'ctl' });
      n.appendChild(el('option', { value: '', text: '— seçiniz —' }));
      (f.options || []).forEach(function (o) { n.appendChild(el('option', { value: o, text: o })); });
      n.value = data[f.name] || '';
      n.addEventListener('change', function () { data[f.name] = n.value; changed(); });
      return n;
    },

    textarea: function (f, data, changed) {
      var n = el('textarea', { class: 'ctl', rows: String(f.rows || 3), placeholder: f.placeholder || '' });
      n.value = data[f.name] || '';
      n.addEventListener('input', function () { data[f.name] = n.value; changed(); });
      return n;
    },

    /* ---- öncesi / sonrası ---- */
    pair: function (f, data, changed) {
      var v = data[f.name];
      if (!v || typeof v !== 'object') v = data[f.name] = { before: {}, after: {} };
      if (!v.before) v.before = {};
      if (!v.after) v.after = {};

      function side(key, cls, title) {
        var s = v[key];
        var box = el('div', { class: 'pairbox ' + cls });
        box.appendChild(el('div', { class: 'pairbox-head', html: Y.ui('img') + '<span>' + Y.esc(title) + '</span>' }));
        var body = el('div', { class: 'pairbox-body' });

        var dz = el('div', { class: 'dropzone', tabindex: '0', role: 'button' });
        var file = el('input', { type: 'file', accept: 'image/*' });
        dz.appendChild(file);
        var ph = el('div', { html: Y.ui('img', 26) + '<div>Görsel seçmek için tıklayın<br>veya buraya sürükleyin</div>' });

        function paint() {
          dz.innerHTML = '';
          dz.appendChild(file);
          if (s.img) {
            dz.appendChild(el('img', { src: s.img, alt: title + ' görseli' }));
          } else {
            dz.appendChild(ph.cloneNode(true));
          }
        }
        function set(dataUrl) {
          if (!dataUrl) { Y.toast('Görsel okunamadı.', 'err'); return; }
          s.img = dataUrl; paint(); changed();
        }
        dz.addEventListener('click', function () { file.click(); });
        dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
        file.addEventListener('change', function () { if (file.files[0]) readImage(file.files[0], set); });
        ['dragenter', 'dragover'].forEach(function (ev) {
          dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('dragover'); });
        });
        ['dragleave', 'drop'].forEach(function (ev) {
          dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('dragover'); });
        });
        dz.addEventListener('drop', function (e) {
          var ff = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
          if (ff) readImage(ff, set);
        });
        paint();
        body.appendChild(dz);

        var tools = el('div', { class: 'img-tools' });
        var rm = el('button', { class: 'btn btn-sm btn-ghost', type: 'button', html: Y.ui('trash') + '<span>Görseli kaldır</span>' });
        rm.addEventListener('click', function () { s.img = ''; paint(); changed(); });
        tools.appendChild(rm);
        body.appendChild(tools);

        var ta = el('textarea', { class: 'ctl', rows: '4', placeholder: title + ' durum açıklaması', style: 'margin-top:10px' });
        ta.value = s.desc || '';
        ta.addEventListener('input', function () { s.desc = ta.value; changed(); });
        body.appendChild(ta);

        box.appendChild(body);
        return box;
      }

      var grid = el('div', { class: 'pairgrid' });
      grid.appendChild(side('before', 'before', f.beforeLabel || 'ÖNCESİ'));
      grid.appendChild(side('after', 'after', f.afterLabel || 'SONRASI'));
      return grid;
    },

    /* ---- 5 neden ---- */
    fivewhy: function (f, data, changed) {
      var v = data[f.name];
      if (!v || typeof v !== 'object') v = data[f.name] = { whys: [] };
      if (!Array.isArray(v.whys)) v.whys = [];
      var count = f.count || 5;
      while (v.whys.length < count) v.whys.push('');

      var box = el('div', { class: 'whychain' });

      function paint() {
        box.innerHTML = '';
        v.whys.forEach(function (val, i) {
          var isRoot = i === v.whys.length - 1;
          var row = el('div', { class: 'whyrow' + (isRoot ? ' root' : '') });
          row.appendChild(el('div', { class: 'whybadge', text: String(i + 1) }));
          var body = el('div', { class: 'whybody' });
          body.appendChild(el('div', { class: 'field-label', text: (i + 1) + '. Neden?' }));
          var ta = el('textarea', { class: 'ctl', rows: '2',
            placeholder: i === 0 ? 'Problem neden oluştu?' : 'Bir önceki cevap neden gerçekleşti?' });
          ta.value = val || '';
          ta.addEventListener('input', function () { v.whys[i] = ta.value; changed(); });
          body.appendChild(ta);
          row.appendChild(body);
          box.appendChild(row);
        });
      }
      paint();

      var wrap = el('div');
      wrap.appendChild(box);
      var acts = el('div', { class: 'tbl-actions' });
      var add = el('button', { class: 'btn btn-sm', type: 'button', html: Y.ui('plus') + '<span>Neden ekle</span>' });
      add.addEventListener('click', function () { v.whys.push(''); paint(); changed(); });
      var rm = el('button', { class: 'btn btn-sm btn-ghost', type: 'button', text: 'Son satırı kaldır' });
      rm.addEventListener('click', function () {
        if (v.whys.length > 1) { v.whys.pop(); paint(); changed(); }
      });
      acts.appendChild(add); acts.appendChild(rm);
      wrap.appendChild(acts);

      var lab = el('div', { class: 'field-label', style: 'margin-top:16px', text: 'Kök Neden' });
      var root = el('textarea', { class: 'ctl', rows: '2', placeholder: 'Zincirin sonunda ulaşılan kök neden' });
      root.value = v.root || '';
      root.addEventListener('input', function () { v.root = root.value; changed(); });
      wrap.appendChild(lab);
      wrap.appendChild(root);
      return wrap;
    },

    /* ---- balık kılçığı ---- */
    fishbone: function (f, data, changed, ctx) {
      var cats = f.categories || Y.M6;
      var v = data[f.name];
      if (!v || typeof v !== 'object') v = data[f.name] = {};
      cats.forEach(function (c) { if (!Array.isArray(v[c.key])) v[c.key] = ['', '', '']; });

      var wrap = el('div');
      var grid = el('div', { class: 'fishgrid' });
      var preview = el('div', { class: 'diagram-preview' });

      function refresh() {
        preview.innerHTML = Y.fishboneSVG(cats, v, ctx.effectText ? ctx.effectText() : '');
      }

      cats.forEach(function (c) {
        var col = el('div', { class: 'fishcat' });
        col.appendChild(el('div', { class: 'fishcat-head', html:
          '<span class="fishcat-dot" style="background:' + c.color + '"></span><span>' + Y.esc(c.label) + '</span>' }));
        col.appendChild(listEditor(
          function () { return v[c.key]; },
          function (arr) { v[c.key] = arr; changed(); refresh(); },
          { placeholder: 'Neden…', minRows: 3 }
        ));
        grid.appendChild(col);
      });

      wrap.appendChild(grid);
      wrap.appendChild(el('div', { class: 'diagram-label', text: 'Diyagram önizleme' }));
      wrap.appendChild(preview);
      refresh();
      ctx.onRefresh(refresh);
      return wrap;
    },

    /* ---- SIPOC ---- */
    sipoc: function (f, data, changed) {
      var COLS = [
        { key: 's', letter: 'S', word: 'Suppliers', tr: 'Tedarikçiler', ph: 'Tedarikçi' },
        { key: 'i', letter: 'I', word: 'Inputs',    tr: 'Girdiler',     ph: 'Girdi' },
        { key: 'p', letter: 'P', word: 'Process',   tr: 'Süreç',        ph: 'Adım' },
        { key: 'o', letter: 'O', word: 'Outputs',   tr: 'Çıktılar',     ph: 'Çıktı' },
        { key: 'c', letter: 'C', word: 'Customers', tr: 'Müşteriler',   ph: 'Müşteri' }
      ];
      var v = data[f.name];
      if (!v || typeof v !== 'object') v = data[f.name] = {};
      COLS.forEach(function (c) { if (!Array.isArray(v[c.key])) v[c.key] = ['', '', '']; });

      var grid = el('div', { class: 'sipoc-grid' });
      COLS.forEach(function (c) {
        var col = el('div', { class: 'sipoc-col' });
        col.appendChild(el('div', { class: 'sipoc-head', html:
          '<div class="sipoc-letter">' + c.letter + '</div><div class="sipoc-word">' + Y.esc(c.tr) + '</div>' }));
        var body = listEditor(
          function () { return v[c.key]; },
          function (arr) { v[c.key] = arr; changed(); },
          { placeholder: c.ph, minRows: 3 }
        );
        body.className = 'sipoc-body';
        col.appendChild(body);
        grid.appendChild(col);
      });
      return grid;
    },

    /* ---- süreç akışı ---- */
    flow: function (f, data, changed, ctx) {
      var cols = [
        { name: 'adim',    label: 'Adım',      type: 'textarea', width: '28%', placeholder: 'Ne yapılıyor?' },
        { name: 'tur',     label: 'Tür',       type: 'select',   width: '13%', options: Y.FLOW_TYPES.map(function (t) { return t.label; }) },
        { name: 'sorumlu', label: 'Sorumlu',   type: 'text',     width: '13%' },
        { name: 'sure',    label: 'Süre (dk)', type: 'number',   width: '9%' },
        { name: 'kd',      label: 'Katma Değer', type: 'select', width: '17%', options: Y.VALUE_TYPES.map(function (t) { return t.label; }) },
        { name: 'girdi',   label: 'Girdi',     type: 'text',     width: '10%' },
        { name: 'cikti',   label: 'Çıktı',     type: 'text',     width: '10%' }
      ];
      var seed = [
        { adim: 'Başla', tur: 'Başla / Bitir' }, {}, {}, {},
        { adim: 'Bitir', tur: 'Başla / Bitir' }
      ];
      var t = tableEditor({ name: f.name, label: '', columns: cols, seed: seed, addLabel: 'Adım ekle' }, data, function () {
        changed(); refresh();
      });

      var wrap = el('div');
      wrap.appendChild(t.node);

      var sum = el('div', { class: 'notice', style: 'margin-top:12px' });
      var preview = el('div', { class: 'diagram-preview' });

      function refresh() {
        var rows = data[f.name] || [];
        var svg = Y.flowSVG(rows);
        preview.innerHTML = svg || '<p class="muted tiny" style="padding:20px;text-align:center;margin:0">Adım girildikçe diyagram burada oluşur.</p>';
        var tot = 0, kd = 0, n = 0;
        rows.forEach(function (r) {
          var s = parseFloat(r.sure);
          if (!isNaN(s)) { tot += s; if (r.kd === 'Katma Değerli') kd += s; }
          if (String(r.adim || '').trim()) n++;
        });
        var oran = tot > 0 ? ((kd / tot) * 100).toFixed(1) : '0.0';
        sum.innerHTML = '<strong>' + n + '</strong> adım · Toplam süre <strong>' + tot + ' dk</strong> · ' +
          'Katma değerli <strong>' + kd + ' dk</strong> · Süreç verimliliği <strong>%' + oran + '</strong>';
      }

      wrap.appendChild(sum);
      wrap.appendChild(el('div', { class: 'diagram-label', text: 'Akış diyagramı önizleme' }));
      wrap.appendChild(preview);
      refresh();
      ctx.onRefresh(refresh);
      return wrap;
    },

    /* ---- organizasyon şeması ---- */
    orgchart: function (f, data, changed, ctx) {
      if (!Array.isArray(data[f.name]) || !data[f.name].length) {
        data[f.name] = [{ id: Y.uid(), ad: '', unvan: '', parent: '' }];
      }
      var nodes = data[f.name];
      nodes.forEach(function (n) { if (!n.id) n.id = Y.uid(); });

      var wrap = el('div');
      var list = el('div', { class: 'orgnode-list' });
      var preview = el('div', { class: 'diagram-preview' });

      function refresh() {
        var svg = Y.orgchartSVG(nodes.map(function (n) { return { id: n.id, ad: n.ad, unvan: n.unvan, parent: n.parent }; }));
        preview.innerHTML = svg || '<p class="muted tiny" style="padding:20px;text-align:center;margin:0">Kişi eklendikçe şema burada oluşur.</p>';
      }

      /** Yönetici listelerindeki isimleri, kutulara yazıldıkça günceller. */
      function syncOptions() {
        var byId = {};
        nodes.forEach(function (n) { byId[n.id] = n; });
        Array.prototype.slice.call(list.querySelectorAll('.orgnode select')).forEach(function (sel) {
          Array.prototype.slice.call(sel.options).forEach(function (o) {
            var t = o.value && byId[o.value];
            if (t) o.textContent = t.ad || t.unvan || 'İsimsiz';
          });
        });
      }

      function paint() {
        list.innerHTML = '';
        nodes.forEach(function (n, i) {
          var row = el('div', { class: 'orgnode' });
          var ad = el('input', { class: 'ctl', type: 'text', placeholder: 'Ad Soyad' });
          ad.value = n.ad || '';
          ad.addEventListener('input', function () { n.ad = ad.value; changed(); syncOptions(); refresh(); });

          var un = el('input', { class: 'ctl', type: 'text', placeholder: 'Ünvan / Görev' });
          un.value = n.unvan || '';
          un.addEventListener('input', function () { n.unvan = un.value; changed(); syncOptions(); refresh(); });

          var par = el('select', { class: 'ctl' });
          par.appendChild(el('option', { value: '', text: '— en üst —' }));
          nodes.forEach(function (o) {
            if (o.id === n.id) return;
            par.appendChild(el('option', { value: o.id, text: (o.ad || o.unvan || 'İsimsiz') }));
          });
          par.value = n.parent || '';
          par.addEventListener('change', function () { n.parent = par.value; changed(); refresh(); });

          var del = el('button', { class: 'rowdel', type: 'button', title: 'Kişiyi sil', 'aria-label': 'Kişiyi sil', html: Y.ui('trash') });
          del.addEventListener('click', function () {
            var gone = nodes[i].id;
            nodes.splice(i, 1);
            nodes.forEach(function (o) { if (o.parent === gone) o.parent = ''; });
            paint(); changed(); refresh();
          });

          row.appendChild(ad); row.appendChild(un); row.appendChild(par); row.appendChild(del);
          list.appendChild(row);
        });
      }

      var acts = el('div', { class: 'tbl-actions' });
      var add = el('button', { class: 'btn btn-sm', type: 'button', html: Y.ui('plus') + '<span>Kişi ekle</span>' });
      add.addEventListener('click', function () {
        var last = nodes[nodes.length - 1];
        nodes.push({ id: Y.uid(), ad: '', unvan: '', parent: last ? (last.parent || '') : '' });
        paint(); changed(); refresh();
        var inputs = list.querySelectorAll('.orgnode input');
        if (inputs.length) inputs[inputs.length - 2].focus();
      });
      acts.appendChild(add);
      acts.appendChild(el('span', { class: 'muted tiny', text: 'Bağlı olduğu yöneticiyi seçerek hiyerarşiyi kurun.' }));

      wrap.appendChild(list);
      wrap.appendChild(acts);
      wrap.appendChild(el('div', { class: 'diagram-label', text: 'Şema önizleme' }));
      wrap.appendChild(preview);
      paint(); refresh();
      ctx.onRefresh(refresh);
      return wrap;
    },

    table: function (f, data, changed) {
      return tableEditor(f, data, changed).node;
    }
  };

  /* ---------------------------------------------------------------- ana */

  /**
   * Şemayı verilen köke basar.
   * @param {HTMLElement} root
   * @param {object} tpl  şablon şeması
   * @param {object} data kayıt verisi (yerinde değiştirilir)
   * @param {function} onChange her değişiklikte çağrılır
   */
  Y.renderForm = function (root, tpl, data, onChange) {
    root.innerHTML = '';
    var refreshers = [];
    var ctx = {
      onRefresh: function (fn) { refreshers.push(fn); },
      effectText: function () {
        return data.etki || data.problem || data.baslik || data.proje || '';
      }
    };
    var changed = function () { onChange(); };

    function buildField(f) {
      if (f.type === 'static') {
        return el('div', { class: 'notice f-full', html: f.html || Y.esc(f.text || '') });
      }
      var maker = FIELDS[f.type] || FIELDS.text;
      var wrapCls = 'field ' + widthClass(
        ['table', 'pair', 'fivewhy', 'fishbone', 'sipoc', 'flow', 'orgchart'].indexOf(f.type) >= 0 ? 'full' : f.width
      );
      var box = el('div', { class: wrapCls });
      if (f.label && ['table', 'pair', 'fishbone', 'sipoc', 'flow', 'orgchart'].indexOf(f.type) < 0) {
        box.appendChild(labelFor(f));
      }
      box.appendChild(maker(f, data, changed, ctx));
      if (f.help) box.appendChild(el('div', { class: 'field-help', text: f.help }));
      return box;
    }

    /* Künye */
    if (tpl.meta && tpl.meta.length) {
      var mSec = el('section', { class: 'fsection' });
      mSec.appendChild(el('div', { class: 'fsection-head' }, [
        el('span', { class: 'fsection-num', html: Y.svgIcon('doc', 14) }),
        el('h2', { text: 'Belge Künyesi' })
      ]));
      var mBody = el('div', { class: 'fsection-body' });
      var mGrid = el('div', { class: 'fgrid' });
      tpl.meta.forEach(function (f) { mGrid.appendChild(buildField(f)); });
      mBody.appendChild(mGrid);
      mSec.appendChild(mBody);
      root.appendChild(mSec);
    }

    /* Bölümler */
    (tpl.sections || []).forEach(function (sec, si) {
      var s = el('section', { class: 'fsection' });
      s.appendChild(el('div', { class: 'fsection-head' }, [
        el('span', { class: 'fsection-num', text: String(si + 1) }),
        el('h2', { text: sec.title })
      ]));
      var body = el('div', { class: 'fsection-body' });
      if (sec.hint) body.appendChild(el('div', { class: 'fsection-hint', text: sec.hint }));
      var grid = el('div', { class: 'fgrid' });
      (sec.fields || []).forEach(function (f) { grid.appendChild(buildField(f)); });
      body.appendChild(grid);
      s.appendChild(body);
      root.appendChild(s);
    });

    return { refreshAll: function () { refreshers.forEach(function (fn) { fn(); }); } };
  };

})(window.Y6S);
