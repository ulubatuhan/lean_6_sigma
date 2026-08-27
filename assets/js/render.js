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

  /**
   * C / N / X seçici. Değer tam etiket olarak saklanır ('C — Kontrol Edilen').
   * Seçili düğmeye yeniden basmak seçimi kaldırır.
   */
  function cnxPicker(get, set, compact) {
    var box = el('div', { class: 'cnx-pick' + (compact ? ' compact' : '') });
    Y.CNX.forEach(function (c) {
      var b = el('button', {
        type: 'button', class: 'cnx-btn', 'data-k': c.key,
        title: c.label + ' — ' + c.desc, text: c.key
      });
      b.style.setProperty('--cnx', c.color);
      b.addEventListener('click', function () {
        set(Y.cnxKey(get()) === c.key ? '' : c.label);
        paint();
      });
      box.appendChild(b);
    });
    function paint() {
      var k = Y.cnxKey(get());
      Array.prototype.slice.call(box.children).forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-k') === k);
      });
    }
    paint();
    return box;
  }

  /** Basit metin listesi düzenleyici (SIPOC). */
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

    /** 'a*b' biçimindeki formülü satır üzerinde hesaplar. */
    function applyFormula(row) {
      cols.forEach(function (c) {
        if (!c.formula) return;
        var m = /^(\w+)\*(\w+)$/.exec(c.formula);
        if (!m) return;
        var a = parseFloat(row[m[1]]), b = parseFloat(row[m[2]]);
        row[c.name] = (isNaN(a) || isNaN(b)) ? '' : String(a * b);
      });
    }

    function cell(col, row) {
      var td = el('td');
      var n;
      if (col.cnx) {
        td.className = 'cnxcell';
        td.appendChild(cnxPicker(
          function () { return row[col.name]; },
          function (v) { row[col.name] = v; changed(); },
          true
        ));
        return td;
      }
      if (col.formula) {
        n = el('input', { type: 'number', readonly: true, tabindex: '-1', class: 'calc' });
        n.value = row[col.name] || '';
        td.appendChild(n);
        td.dataset.calc = col.name;
        return td;
      }
      if (col.type === 'textarea') {
        n = el('textarea', { rows: 1, placeholder: col.placeholder || '' });
        n.value = row[col.name] || '';
        n.addEventListener('input', function () {
          row[col.name] = n.value;
          n.style.height = 'auto';
          n.style.height = Math.min(180, n.scrollHeight + 2) + 'px';
          changed();
          maybeAutoGrow();
        });
        setTimeout(function () { n.style.height = Math.min(180, n.scrollHeight + 2) + 'px'; }, 0);
      } else if (col.type === 'select') {
        n = el('select');
        n.appendChild(el('option', { value: '', text: '—' }));
        (col.options || []).forEach(function (o) { n.appendChild(el('option', { value: o, text: o })); });
        n.value = row[col.name] || '';
        n.addEventListener('change', function () { row[col.name] = n.value; changed(); maybeAutoGrow(); });
      } else {
        n = el('input', { type: col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text',
          placeholder: col.placeholder || '' });
        n.value = row[col.name] || '';
        n.addEventListener('input', function () {
          row[col.name] = n.value;
          applyFormula(row);
          var tr = n.closest('tr');
          if (tr) {
            Array.prototype.slice.call(tr.querySelectorAll('[data-calc]')).forEach(function (c) {
              c.querySelector('input').value = row[c.dataset.calc] || '';
            });
          }
          changed();
          maybeAutoGrow();
        });
      }
      td.appendChild(n);
      return td;
    }

    /** Son satır dolduğunda otomatik olarak yeni boş satır ekler (field.autoGrow). */
    function maybeAutoGrow() {
      if (!field.autoGrow || !rows.length) return;
      var last = rows[rows.length - 1];
      var filled = Object.keys(last || {}).some(function (k) { return String(last[k] || '').trim(); });
      if (filled) {
        rows.push({});
        tbody.appendChild(buildRowEl(rows.length - 1));
      }
    }

    function buildRowEl(i) {
      var row = rows[i];
      var tr = el('tr');
      tr.appendChild(el('td', { class: 'rowno', text: String(i + 1) }));
      cols.forEach(function (c) { tr.appendChild(cell(c, row)); });
      var act = el('td', { class: 'rowact' });
      var del = el('button', { class: 'rowdel', type: 'button', title: 'Satırı sil', 'aria-label': 'Satırı sil', html: Y.ui('trash') });
      del.addEventListener('click', function () { rows.splice(i, 1); paint(); changed(); });
      act.appendChild(del);
      tr.appendChild(act);
      return tr;
    }

    function paint() {
      tbody.innerHTML = '';
      rows.forEach(function (row, i) { tbody.appendChild(buildRowEl(i)); });
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
    if (field.sortBy) {
      var sortBtn = el('button', { class: 'btn btn-sm btn-ghost', type: 'button', text: 'Skora göre sırala' });
      sortBtn.addEventListener('click', function () {
        rows.sort(function (a, b) {
          return (parseFloat(b[field.sortBy]) || 0) - (parseFloat(a[field.sortBy]) || 0);
        });
        paint(); changed();
      });
      actions.appendChild(sortBtn);
    }
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

    /* ---- çoklu işaret kutusu (resmî formlardaki onay kutucukları) ---- */
    checks: function (f, data, changed) {
      var sel = data[f.name];
      if (!Array.isArray(sel)) sel = data[f.name] = [];
      var box = el('div', { class: 'checks' });
      (f.options || []).forEach(function (o) {
        var lab = el('label', { class: 'check' });
        var cb = el('input', { type: 'checkbox' });
        cb.checked = sel.indexOf(o) >= 0;
        cb.addEventListener('change', function () {
          var i = sel.indexOf(o);
          if (cb.checked && i < 0) sel.push(o);
          else if (!cb.checked && i >= 0) sel.splice(i, 1);
          changed();
        });
        lab.appendChild(cb);
        lab.appendChild(el('span', { text: o }));
        box.appendChild(lab);
      });
      return box;
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
      // Eski kayıtlar düz metin dizisiydi; {t, kanit} biçimine taşı.
      v.whys = v.whys.map(function (w) {
        return (w && typeof w === 'object') ? { t: String(w.t || ''), kanit: String(w.kanit || '') }
                                            : { t: String(w == null ? '' : w), kanit: '' };
      });
      var count = f.count || 5;
      while (v.whys.length < count) v.whys.push({ t: '', kanit: '' });

      var box = el('div', { class: 'whychain' });

      function paint() {
        box.innerHTML = '';
        v.whys.forEach(function (item, i) {
          var isRoot = i === v.whys.length - 1;
          var row = el('div', { class: 'whyrow' + (isRoot ? ' root' : '') });
          row.appendChild(el('div', { class: 'whybadge', text: String(i + 1) }));
          var body = el('div', { class: 'whybody' });
          body.appendChild(el('div', { class: 'field-label', text: (i + 1) + '. Neden?' }));
          var ta = el('textarea', { class: 'ctl', rows: '2',
            placeholder: i === 0 ? 'Problem neden oluştu?' : 'Bir önceki cevap neden gerçekleşti?' });
          ta.value = item.t || '';
          ta.addEventListener('input', function () { item.t = ta.value; changed(); });
          body.appendChild(ta);
          if (f.evidence) {
            var ev = el('input', { class: 'ctl why-ev', type: 'text',
              placeholder: 'Kanıt / doğrulama — bunu nereden biliyoruz?' });
            ev.value = item.kanit || '';
            ev.addEventListener('input', function () { item.kanit = ev.value; changed(); });
            body.appendChild(ev);
          }
          row.appendChild(body);
          box.appendChild(row);
        });
      }
      paint();

      var wrap = el('div');
      wrap.appendChild(box);
      var acts = el('div', { class: 'tbl-actions' });
      var add = el('button', { class: 'btn btn-sm', type: 'button', html: Y.ui('plus') + '<span>Neden ekle</span>' });
      add.addEventListener('click', function () { v.whys.push({ t: '', kanit: '' }); paint(); changed(); });
      var rm = el('button', { class: 'btn btn-sm btn-ghost', type: 'button', text: 'Son satırı kaldır' });
      rm.addEventListener('click', function () {
        if (v.whys.length > 1) { v.whys.pop(); paint(); changed(); }
      });
      acts.appendChild(add); acts.appendChild(rm);
      wrap.appendChild(acts);

      var head = el('div', { class: 'why-root-head' });
      head.appendChild(el('div', { class: 'field-label', style: 'margin:0', text: 'Kök Neden' }));
      if (f.cnx) {
        head.appendChild(el('span', { class: 'tiny muted', text: 'CNX sınıfı:' }));
        head.appendChild(cnxPicker(
          function () { return v.cnx; },
          function (val) { v.cnx = val; changed(); }
        ));
      }
      var root = el('textarea', { class: 'ctl', rows: '2', placeholder: 'Zincirin sonunda ulaşılan kök neden' });
      root.value = v.root || '';
      root.addEventListener('input', function () { v.root = root.value; changed(); });
      wrap.appendChild(head);
      wrap.appendChild(root);
      return wrap;
    },

    /* ---- balık kılçığı ---- */
    fishbone: function (f, data, changed, ctx) {
      var cats = f.categories || Y.M6;
      var v = data[f.name];
      if (!v || typeof v !== 'object') v = data[f.name] = {};
      // Eski kayıtlar düz metin dizisiydi; {t, cnx} biçimine taşı.
      cats.forEach(function (c) {
        v[c.key] = Y.normCauseList(v[c.key]);
        while (v[c.key].length < 3) v[c.key].push({ t: '', cnx: '' });
      });

      var wrap = el('div');
      var grid = el('div', { class: 'fishgrid' });
      var preview = el('div', { class: 'diagram-preview' });
      var summary = el('div', { class: 'notice fish-summary', style: 'margin-top:12px' });

      function refresh() {
        preview.innerHTML = Y.fishboneSVG(cats, v, ctx.effectText ? ctx.effectText() : '');
        var n = 0, cnt = { C: 0, N: 0, X: 0 };
        cats.forEach(function (c) {
          (v[c.key] || []).forEach(function (o) {
            if (!String(o.t || '').trim()) return;
            n++;
            var k = Y.cnxKey(o.cnx);
            if (k) cnt[k]++;
          });
        });
        summary.innerHTML = '<strong>' + n + '</strong> neden girildi · Sınıflandırılan <strong>' +
          (cnt.C + cnt.N + cnt.X) + '</strong> · C <strong>' + cnt.C + '</strong> · N <strong>' +
          cnt.N + '</strong> · X <strong>' + cnt.X + '</strong>' +
          (cnt.X ? '' : ' — üzerinde çalışılacak <strong>X</strong> nedeni işaretlemeyi unutmayın.');
      }

      cats.forEach(function (c) {
        var col = el('div', { class: 'fishcat' });
        col.appendChild(el('div', { class: 'fishcat-head', html:
          '<span class="fishcat-dot" style="background:' + c.color + '"></span><span>' + Y.esc(c.label) + '</span>' }));
        var body = el('div', { class: 'fishcat-body' });

        function paint() {
          body.innerHTML = '';
          v[c.key].forEach(function (item, i) {
            var row = el('div', { class: 'causerow' });
            var inp = el('input', { class: 'ctl', type: 'text', value: item.t || '', placeholder: 'Neden…' });
            inp.addEventListener('input', function () { item.t = inp.value; changed(); refresh(); });
            row.appendChild(inp);
            row.appendChild(cnxPicker(
              function () { return item.cnx; },
              function (val) { item.cnx = val; changed(); refresh(); },
              true
            ));
            var del = el('button', { class: 'rowdel', type: 'button', title: 'Satırı sil',
              'aria-label': 'Satırı sil', html: Y.ui('trash') });
            del.addEventListener('click', function () {
              v[c.key].splice(i, 1);
              paint(); changed(); refresh();
            });
            row.appendChild(del);
            body.appendChild(row);
          });
          var add = el('button', { class: 'btn btn-sm btn-ghost', type: 'button', html: Y.ui('plus') + '<span>Ekle</span>' });
          add.addEventListener('click', function () {
            v[c.key].push({ t: '', cnx: '' });
            paint(); changed();
            var ins = body.querySelectorAll('input');
            if (ins.length) ins[ins.length - 1].focus();
          });
          body.appendChild(add);
        }
        paint();
        col.appendChild(body);
        grid.appendChild(col);
      });

      wrap.appendChild(grid);

      if (f.transferTo) {
        var acts = el('div', { class: 'tbl-actions' });
        var tr = el('button', { class: 'btn btn-sm', type: 'button',
          html: Y.ui('down') + '<span>İşaretli nedenleri önceliklendirmeye aktar</span>' });
        tr.addEventListener('click', function () {
          if (!Array.isArray(data[f.transferTo])) data[f.transferTo] = [];
          var target = data[f.transferTo];
          var have = {};
          target.forEach(function (r) { have[String(r.neden || '').trim()] = 1; });
          var added = 0;
          cats.forEach(function (c) {
            (v[c.key] || []).forEach(function (o) {
              var t = String(o.t || '').trim();
              if (!t || !Y.cnxKey(o.cnx) || have[t]) return;
              have[t] = 1; added++;
              target.push({ neden: t, kategori: c.label, cnx: o.cnx });
            });
          });
          // boş kalan tohum satırlarını temizle
          data[f.transferTo] = target.filter(function (r) {
            return Object.keys(r).some(function (k) { return String(r[k] || '').trim(); });
          });
          if (!added) { Y.toast('Aktarılacak yeni işaretli neden yok.', 'err'); return; }
          changed();
          ctx.rerender();
          Y.toast(added + ' neden önceliklendirme tablosuna aktarıldı.', 'ok');
        });
        acts.appendChild(tr);
        acts.appendChild(el('span', { class: 'muted tiny',
          text: 'Yalnızca C / N / X ile işaretlenmiş nedenler aktarılır.' }));
        wrap.appendChild(acts);
      }

      wrap.appendChild(summary);
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

    /* ---- kulvarlı proses haritası (sürükle-bırak) ---- */
    flowmap: function (f, data, changed, ctx) {
      var map = Y.normFlowmap(data[f.name]);
      data[f.name] = map;
      var host = el('div');
      var api = Y.mountFlowmapEditor(
        host,
        function () { return map; },
        function (next) { data[f.name] = map = next; changed(); }
      );
      ctx.onRefresh(function () { api.refresh(); });
      return host;
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
    },

    /* ---- SYB-D-0605 stratejik hedef-süreç matrisi ---- */
    stratmatrix: function (f, data, changed) {
      var v = data[f.name];
      if (!v || typeof v !== 'object') v = data[f.name] = { cols: [], marks: {} };
      if (!Array.isArray(v.cols)) v.cols = [];
      if (!v.marks || typeof v.marks !== 'object') v.marks = {};
      if (!v.cols.length) {
        Y.STRAT_PERSPEKTIF.forEach(function (p) {
          v.cols.push({ id: Y.uid(), persp: p.key, code: p.key + '1.1' });
        });
      }

      function perspOf(key) {
        var arr = Y.STRAT_PERSPEKTIF.filter(function (p) { return p.key === key; });
        return arr[0] || Y.STRAT_PERSPEKTIF[0];
      }

      var wrap = el('div', { class: 'stratmatrix' });
      var scroll = el('div', { class: 'tbl-wrap sm-wrap' });
      var table = el('table', { class: 'etbl sm-tbl' });
      scroll.appendChild(table);
      wrap.appendChild(scroll);

      var actions = el('div', { class: 'tbl-actions' });
      var addCol = el('button', { class: 'btn btn-sm', type: 'button', html: Y.ui('plus') + '<span>Hedef sütunu ekle</span>' });
      addCol.addEventListener('click', function () {
        v.cols.push({ id: Y.uid(), persp: 'F', code: '' });
        changed(); paint();
        var last = table.querySelectorAll('.sm-code');
        if (last.length) last[last.length - 1].focus();
      });
      actions.appendChild(addCol);
      wrap.appendChild(actions);

      function markKey(leaf) { return leaf; }

      function paint() {
        table.innerHTML = '';
        var thead = el('thead');
        var htr = el('tr');
        htr.appendChild(el('th', { text: 'Ana Grup', style: 'width:120px' }));
        htr.appendChild(el('th', { text: 'Üst Süreç', style: 'width:170px' }));
        htr.appendChild(el('th', { text: 'Alt Süreç', style: 'width:230px' }));
        v.cols.forEach(function (col, ci) {
          var p = perspOf(col.persp);
          var th = el('th', { class: 'sm-colhead' });
          var top = el('div', { class: 'sm-colhead-top' });
          var persp = el('button', { type: 'button', class: 'sm-persp', title: 'Perspektif: ' + p.label + ' — tıklayarak değiştir', text: col.persp });
          persp.style.background = p.color;
          persp.addEventListener('click', function () {
            var idx = Y.STRAT_PERSPEKTIF.indexOf(p);
            col.persp = Y.STRAT_PERSPEKTIF[(idx + 1) % Y.STRAT_PERSPEKTIF.length].key;
            changed(); paint();
          });
          var code = el('input', { class: 'ctl sm-code', type: 'text', value: col.code || '', placeholder: 'Örn. F1.1' });
          code.addEventListener('input', function () { col.code = code.value; changed(); });
          var del = el('button', { class: 'rowdel', type: 'button', title: 'Sütunu sil', 'aria-label': 'Sütunu sil', html: Y.ui('trash') });
          del.addEventListener('click', function () {
            v.cols.splice(ci, 1);
            changed(); paint();
          });
          top.appendChild(persp); top.appendChild(code); top.appendChild(del);
          th.appendChild(top);
          htr.appendChild(th);
        });
        thead.appendChild(htr);
        table.appendChild(thead);

        var tbody = el('tbody');
        Y.STRAT_HIYERARSI.forEach(function (grp, gi) {
          var grupAd = grp[0], ustAd = grp[1], altList = grp[2];
          altList.forEach(function (alt, ai) {
            var leaf = 'g' + gi + '_a' + ai;
            var tr = el('tr');
            if (ai === 0) {
              // Ana Grup rowspan: bu grup satırı ilk kez mi başlıyor?
              var isFirstOfGroup = gi === 0 || Y.STRAT_HIYERARSI[gi - 1][0] !== grupAd;
              if (isFirstOfGroup) {
                var groupSpan = 0;
                for (var k = gi; k < Y.STRAT_HIYERARSI.length && Y.STRAT_HIYERARSI[k][0] === grupAd; k++) {
                  groupSpan += Y.STRAT_HIYERARSI[k][2].length;
                }
                tr.appendChild(el('td', { class: 'sm-grup', rowspan: String(groupSpan), text: grupAd }));
              }
              tr.appendChild(el('td', { class: 'sm-ust', rowspan: String(altList.length), text: ustAd }));
            }
            tr.appendChild(el('td', { class: 'sm-alt', text: alt }));
            v.cols.forEach(function (col) {
              var td = el('td', { class: 'sm-mark' });
              var cb = el('input', { type: 'checkbox' });
              if (!v.marks[leaf]) v.marks[leaf] = {};
              cb.checked = !!v.marks[leaf][col.id];
              cb.addEventListener('change', function () {
                v.marks[leaf][col.id] = cb.checked;
                changed();
              });
              td.appendChild(cb);
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
        });
        table.appendChild(tbody);
      }
      paint();
      return wrap;
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
      },
      /** Alanlar arası veri aktarımından sonra formu baştan çizer. */
      rerender: function () {
        var y = window.scrollY;
        Y.renderForm(root, tpl, data, onChange);
        window.scrollTo(0, y);
      }
    };
    var changed = function () { onChange(); };

    function buildField(f) {
      if (f.type === 'static') {
        return el('div', { class: 'notice f-full', html: f.html || Y.esc(f.text || '') });
      }
      var maker = FIELDS[f.type] || FIELDS.text;
      var wrapCls = 'field ' + widthClass(
        ['table', 'pair', 'fivewhy', 'fishbone', 'sipoc', 'flowmap', 'orgchart', 'stratmatrix'].indexOf(f.type) >= 0 ? 'full' : f.width
      );
      var box = el('div', { class: wrapCls });
      if (f.label && ['table', 'pair', 'fishbone', 'sipoc', 'flowmap', 'orgchart', 'stratmatrix'].indexOf(f.type) < 0) {
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

  /** Bir alanın doldurulmuş sayılıp sayılmayacağı. */
  function hasContent(f, data) {
    var v = data[f.name];
    switch (f.type) {
      case 'table':
        return (v || []).some(function (r) {
          return Object.keys(r || {}).some(function (k) { return String(r[k] || '').trim(); });
        });
      case 'pair':
        return !!(v && ((v.before && (v.before.img || String(v.before.desc || '').trim())) ||
                        (v.after && (v.after.img || String(v.after.desc || '').trim()))));
      case 'fivewhy':
        return !!(v && ((v.whys || []).some(function (w) {
          return String((w && typeof w === 'object' ? w.t : w) || '').trim();
        }) || String(v.root || '').trim()));
      case 'fishbone':
        return !!v && Object.keys(v).some(function (k) {
          return Y.normCauseList(v[k]).some(function (o) { return o.t.trim(); });
        });
      case 'sipoc':
        return !!v && Object.keys(v).some(function (k) {
          return (v[k] || []).some(function (x) { return String(x || '').trim(); });
        });
      case 'flowmap':
        return Y.normFlowmap(v).nodes.some(function (n) { return String(n.metin || '').trim(); });
      case 'orgchart':
        return (v || []).some(function (n) { return String((n && (n.ad || n.unvan)) || '').trim(); });
      case 'checks':
        return Array.isArray(v) && v.length > 0;
      case 'stratmatrix':
        return !!v && v.marks && Object.keys(v.marks).some(function (leaf) {
          return Object.keys(v.marks[leaf]).some(function (cid) { return v.marks[leaf][cid]; });
        });
      default:
        return !!String(v == null ? '' : v).trim();
    }
  }

  /** Formun doluluk oranını hesaplar. */
  Y.formProgress = function (tpl, data) {
    var total = 0, done = 0;
    function walk(f) {
      if (!f || f.type === 'static' || !f.name) return;
      total++;
      if (hasContent(f, data)) done++;
    }
    (tpl.meta || []).forEach(walk);
    (tpl.sections || []).forEach(function (s) { (s.fields || []).forEach(walk); });
    return { total: total, done: done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

})(window.Y6S);
