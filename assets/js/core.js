/* ==========================================================================
   Yepas Lean 6 Sigma — ortak yardımcılar ve tarayıcı belleği (localStorage)
   ========================================================================== */

window.Y6S = window.Y6S || {};

(function (Y) {
  'use strict';

  /* ---------------------------------------------------------------- DOM */

  Y.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  Y.el = function (tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'text') n.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.keys(v).forEach(function (d) { n.dataset[d] = v[d]; });
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  };

  Y.svgIcon = function (key, size) {
    var body = Y.ICONS[key] || Y.ICONS.doc;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + (size ? ' width="' + size + '" height="' + size + '"' : '') +
      ' aria-hidden="true">' + body + '</svg>';
  };

  var UI_ICONS = {
    plus:   '<path d="M12 5v14M5 12h14"/>',
    trash:  '<path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    save:   '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3M8 21v-7h8v7"/>',
    print:  '<path d="M7 9V3h10v6M7 19H4v-8h16v8h-3"/><rect x="7" y="14" width="10" height="7"/>',
    word:   '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 12l1.4 5 1.6-4 1.6 4 1.4-5"/>',
    eye:    '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
    back:   '<path d="M15 19l-7-7 7-7"/>',
    close:  '<path d="M6 6l12 12M18 6L6 18"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    down:   '<path d="M12 3v13M7 11l5 5 5-5M4 21h16"/>',
    up:     '<path d="M12 21V8M7 13l5-5 5 5M4 3h16"/>',
    sun:    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:   '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    copy:   '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    ok:     '<path d="M4 12.5 9 17.5 20 6.5"/>',
    warn:   '<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17.2v.1"/>',
    img:    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5-5-6 6-2-2-5 5"/>',
    align:  '<rect x="2" y="9" width="6" height="6" rx="1"/><rect x="16" y="9" width="6" height="6" rx="1"/><path d="M8 12h8M13 9l3 3-3 3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    doc:    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    tag:    '<path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="7.5" r="1.4"/>'
  };

  Y.ui = function (key, size) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + (size ? ' width="' + size + '" height="' + size + '"' : '') +
      ' aria-hidden="true">' + (UI_ICONS[key] || '') + '</svg>';
  };

  /* ---------------------------------------------------------------- Genel */

  Y.uid = function () {
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  Y.debounce = function (fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms);
    };
  };

  Y.todayISO = function () {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  Y.fmtDate = function (iso) {
    if (!iso) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (m) return m[3] + '.' + m[2] + '.' + m[1];
    return iso;
  };

  Y.fmtWhen = function (ts) {
    if (!ts) return '';
    var d = new Date(ts), now = Date.now(), diff = (now - ts) / 1000;
    if (diff < 60) return 'az önce';
    if (diff < 3600) return Math.floor(diff / 60) + ' dk önce';
    if (diff < 86400) return Math.floor(diff / 3600) + ' saat önce';
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' +
      p(d.getHours()) + ':' + p(d.getMinutes());
  };

  Y.slug = function (s) {
    var map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
    return String(s || 'belge')
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, function (c) { return map[c]; })
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'belge';
  };

  Y.download = function (blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
  };

  /* ---------------------------------------------------------------- Bildirim */

  Y.toast = function (msg, kind) {
    var box = document.querySelector('.toaster');
    if (!box) { box = Y.el('div', { class: 'toaster' }); document.body.appendChild(box); }
    var ic = kind === 'err' ? 'warn' : kind === 'ok' ? 'ok' : '';
    var t = Y.el('div', { class: 'toast ' + (kind || ''), html: (ic ? Y.ui(ic) : '') + '<span></span>' });
    t.querySelector('span').textContent = msg;
    box.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .25s'; t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, 2600);
  };

  /* ---------------------------------------------------------------- Modal */

  Y.modal = function (opts) {
    var back = Y.el('div', { class: 'modal-back' });
    var box = Y.el('div', { class: 'modal' + (opts.wide ? ' modal-lg' : '') });
    var head = Y.el('div', { class: 'modal-head' }, [Y.el('h3', { text: opts.title || '' })]);
    var xbtn = Y.el('button', { class: 'btn btn-ghost btn-icon', 'aria-label': 'Kapat', html: Y.ui('close') });
    head.appendChild(xbtn);
    var body = Y.el('div', { class: 'modal-body' + (opts.flat ? ' flat' : '') });
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);
    box.appendChild(head); box.appendChild(body);

    var close = function () {
      document.removeEventListener('keydown', onKey);
      if (back.parentNode) back.parentNode.removeChild(back);
    };
    var onKey = function (e) { if (e.key === 'Escape') close(); };

    if (opts.actions && opts.actions.length) {
      var foot = Y.el('div', { class: 'modal-foot' });
      opts.actions.forEach(function (a) {
        if (a === '-') { foot.appendChild(Y.el('div', { class: 'spacer' })); return; }
        var b = Y.el('button', {
          class: 'btn ' + (a.class || ''),
          html: (a.icon ? Y.ui(a.icon) : '') + '<span></span>'
        });
        b.querySelector('span').textContent = a.label;
        b.addEventListener('click', function () {
          if (!a.onClick || a.onClick() !== false) close();
        });
        foot.appendChild(b);
      });
      box.appendChild(foot);
    }

    xbtn.addEventListener('click', close);
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', onKey);
    back.appendChild(box);
    document.body.appendChild(back);
    return { close: close, body: body, root: back };
  };

  Y.confirm = function (title, message, okLabel, onOk) {
    Y.modal({
      title: title,
      body: Y.el('p', { class: 'muted', text: message, style: 'margin:0' }),
      actions: [
        { label: 'Vazgeç', class: 'btn-ghost' },
        { label: okLabel || 'Sil', class: 'btn-danger', icon: 'trash', onClick: onOk }
      ]
    });
  };

  /* ---------------------------------------------------------------- Tema */

  var THEME_KEY = 'y6s:theme';

  Y.initTheme = function () {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* yok sayılır */ }
    var t = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
    return t;
  };

  Y.toggleTheme = function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* yok sayılır */ }
    return next;
  };

  Y.mountThemeButton = function (container) {
    var b = Y.el('button', { class: 'btn btn-ghost btn-icon', 'aria-label': 'Açık / koyu tema', title: 'Açık / koyu tema' });
    var paint = function () {
      b.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? Y.ui('sun') : Y.ui('moon');
    };
    b.addEventListener('click', function () { Y.toggleTheme(); paint(); });
    paint();
    container.appendChild(b);
  };

  /* ==========================================================================
     Tarayıcı belleği
     ========================================================================== */

  var IDX = 'y6s:index';
  var REC = 'y6s:rec:';

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  var Store = {

    available: function () {
      try {
        localStorage.setItem('y6s:probe', '1');
        localStorage.removeItem('y6s:probe');
        return true;
      } catch (e) { return false; }
    },

    /** Kayıt özetleri, en son güncellenen başta. */
    list: function () {
      var idx = readJSON(IDX, []);
      if (!Array.isArray(idx)) idx = [];
      return idx.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    },

    get: function (id) {
      return readJSON(REC + id, null);
    },

    /**
     * Kaydı yazar. rec = {id, tpl, title, data}
     * @returns {{ok:boolean, error?:string}}
     */
    save: function (rec) {
      var now = Date.now();
      rec.updatedAt = now;
      if (!rec.createdAt) rec.createdAt = now;
      try {
        localStorage.setItem(REC + rec.id, JSON.stringify(rec));
      } catch (e) {
        return {
          ok: false,
          error: (e && e.name === 'QuotaExceededError')
            ? 'Tarayıcı belleği doldu. Görselleri küçültün veya eski kayıtları silin.'
            : 'Kayıt yazılamadı: ' + (e && e.message ? e.message : 'bilinmeyen hata')
        };
      }
      var idx = readJSON(IDX, []);
      if (!Array.isArray(idx)) idx = [];
      var hit = null;
      for (var i = 0; i < idx.length; i++) { if (idx[i].id === rec.id) { hit = idx[i]; break; } }
      if (!hit) { hit = { id: rec.id, createdAt: rec.createdAt }; idx.push(hit); }
      hit.tpl = rec.tpl;
      hit.title = rec.title;
      hit.updatedAt = now;
      try { localStorage.setItem(IDX, JSON.stringify(idx)); } catch (e) { /* dizin yazılamadı */ }
      return { ok: true };
    },

    remove: function (id) {
      try { localStorage.removeItem(REC + id); } catch (e) { /* yok sayılır */ }
      var idx = readJSON(IDX, []).filter(function (r) { return r.id !== id; });
      try { localStorage.setItem(IDX, JSON.stringify(idx)); } catch (e) { /* yok sayılır */ }
    },

    duplicate: function (id) {
      var rec = Store.get(id);
      if (!rec) return null;
      var copy = {
        id: Y.uid(), tpl: rec.tpl,
        title: (rec.title || 'Belge') + ' (kopya)',
        data: JSON.parse(JSON.stringify(rec.data || {}))
      };
      Store.save(copy);
      return copy;
    },

    clearAll: function () {
      Store.list().forEach(function (r) {
        try { localStorage.removeItem(REC + r.id); } catch (e) { /* yok sayılır */ }
      });
      try { localStorage.removeItem(IDX); } catch (e) { /* yok sayılır */ }
    },

    /** Tüm kayıtları tek JSON nesnesine toplar. */
    exportAll: function () {
      return {
        app: 'yepas-lean-6-sigma',
        version: 1,
        exportedAt: new Date().toISOString(),
        records: Store.list().map(function (r) { return Store.get(r.id); }).filter(Boolean)
      };
    },

    /** JSON yedeğini içe aktarır; mevcut id çakışırsa yeni id verilir. */
    importAll: function (obj, mode) {
      if (!obj || !Array.isArray(obj.records)) throw new Error('Dosya biçimi tanınmadı.');
      if (mode === 'replace') Store.clearAll();
      var have = {};
      Store.list().forEach(function (r) { have[r.id] = 1; });
      var n = 0;
      obj.records.forEach(function (rec) {
        if (!rec || !rec.tpl) return;
        var copy = JSON.parse(JSON.stringify(rec));
        if (!copy.id || have[copy.id]) copy.id = Y.uid();
        have[copy.id] = 1;
        if (Store.save(copy).ok) n++;
      });
      return n;
    },

    /** Yaklaşık kullanım (bayt). */
    usage: function () {
      var total = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('y6s:') === 0) total += (localStorage.getItem(k) || '').length * 2;
        }
      } catch (e) { /* yok sayılır */ }
      return total;
    }
  };

  Y.humanSize = function (b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };

  Y.Store = Store;

})(window.Y6S);
