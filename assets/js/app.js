/* ==========================================================================
   Yepas Lean 6 Sigma — ana sayfa
   ========================================================================== */

(function (Y) {
  'use strict';

  var el = Y.el;

  Y.initTheme();
  Y.mountThemeButton(document.getElementById('theme-slot'));

  var storageOK = Y.Store.available();

  /* ---------------------------------------------------------------- seçici */

  var select = document.getElementById('tpl-select');
  var desc = document.getElementById('picker-desc');

  Object.keys(Y.PHASES).forEach(function (pk) {
    var list = Y.TEMPLATES.filter(function (t) { return t.phase === pk; });
    if (!list.length) return;
    var g = el('optgroup', { label: Y.PHASES[pk].label + ' · ' + Y.PHASES[pk].full });
    list.forEach(function (t) { g.appendChild(el('option', { value: t.id, text: t.name })); });
    select.appendChild(g);
  });

  function paintDesc() {
    var t = Y.getTemplate(select.value);
    if (!t) { desc.textContent = ''; return; }
    desc.innerHTML = '<strong>' + Y.esc(t.name) + '</strong> — ' + Y.esc(t.desc) +
      ' <span class="pill pill-' + t.phase + '" style="margin-left:6px">' + Y.esc(Y.PHASES[t.phase].label) + '</span>' +
      ' <span class="pill">' + Y.esc(t.code) + '</span>' +
      ' <span class="pill">' + (t.orientation === 'landscape' ? 'A4 Yatay' : 'A4 Dikey') + '</span>';
  }

  function start(id) {
    location.href = 'form.html?t=' + encodeURIComponent(id);
  }

  select.addEventListener('change', paintDesc);
  document.getElementById('btn-start').addEventListener('click', function () { start(select.value); });
  select.addEventListener('keydown', function (e) { if (e.key === 'Enter') start(select.value); });
  paintDesc();

  /* ---------------------------------------------------------------- kartlar */

  var grid = document.getElementById('tpl-grid');
  var phaseFilter = document.getElementById('phase-filter');
  Object.keys(Y.PHASES).forEach(function (pk) {
    phaseFilter.appendChild(el('option', { value: pk, text: Y.PHASES[pk].label + ' (' + Y.PHASES[pk].full + ')' }));
  });

  function paintGrid() {
    var f = phaseFilter.value;
    var list = Y.TEMPLATES.filter(function (t) { return !f || t.phase === f; });
    grid.innerHTML = '';
    list.forEach(function (t) {
      var a = el('a', { class: 'tcard', href: 'form.html?t=' + encodeURIComponent(t.id) });
      a.appendChild(el('div', { class: 'tcard-top' }, [
        el('span', { class: 'tcard-ico', html: Y.svgIcon(t.icon) }),
        el('h3', { text: t.name })
      ]));
      a.appendChild(el('p', { text: t.desc }));
      a.appendChild(el('div', { class: 'tcard-foot' }, [
        el('span', { class: 'pill pill-' + t.phase, text: Y.PHASES[t.phase].label }),
        el('span', { class: 'pill', text: t.code })
      ]));
      grid.appendChild(a);
    });
    document.getElementById('tpl-count').textContent = list.length + ' şablon';
  }
  phaseFilter.addEventListener('change', paintGrid);
  paintGrid();

  /* ---------------------------------------------------------------- kayıtlar */

  var recList = document.getElementById('rec-list');

  function recNode(r, onChanged) {
    var tpl = Y.getTemplate(r.tpl);
    var node = el('div', { class: 'rec' });
    node.appendChild(el('span', { class: 'rec-ico', html: Y.svgIcon(tpl ? tpl.icon : 'doc') }));
    var main = el('div', { class: 'rec-main' });
    main.appendChild(el('div', { class: 'rec-title', text: r.title || 'Adsız belge' }));
    main.appendChild(el('div', { class: 'rec-meta',
      text: (tpl ? tpl.name : r.tpl) + ' · ' + Y.fmtWhen(r.updatedAt) }));
    node.appendChild(main);

    var acts = el('div', { class: 'rec-actions' });
    var open = el('a', { class: 'btn btn-sm btn-primary', href: 'form.html?id=' + encodeURIComponent(r.id), text: 'Aç' });
    acts.appendChild(open);

    var dup = el('button', { class: 'btn btn-sm btn-ghost btn-icon', type: 'button',
      title: 'Kopyala', 'aria-label': 'Kopyala', html: Y.ui('copy') });
    dup.addEventListener('click', function () {
      var c = Y.Store.duplicate(r.id);
      if (c) { Y.toast('Kopya oluşturuldu.', 'ok'); onChanged(); }
    });
    acts.appendChild(dup);

    var del = el('button', { class: 'btn btn-sm btn-ghost btn-icon', type: 'button',
      title: 'Sil', 'aria-label': 'Sil', html: Y.ui('trash') });
    del.addEventListener('click', function () {
      Y.confirm('Kaydı sil', '"' + (r.title || 'Adsız belge') + '" kalıcı olarak silinecek. Devam edilsin mi?', 'Sil', function () {
        Y.Store.remove(r.id);
        Y.toast('Kayıt silindi.');
        onChanged();
      });
    });
    acts.appendChild(del);

    node.appendChild(acts);
    return node;
  }

  function paintRecents() {
    var all = Y.Store.list();
    document.getElementById('rec-count').textContent = all.length + ' kayıt';
    document.getElementById('btn-records').innerHTML =
      Y.ui('folder') + '<span>Kayıtlarım (' + all.length + ')</span>';
    recList.innerHTML = '';
    if (!storageOK) {
      recList.appendChild(el('div', { class: 'empty',
        text: 'Tarayıcı belleği bu ortamda kullanılamıyor (gizli sekme veya kısıtlı ayar). Formlar doldurulabilir ancak otomatik kaydedilmez.' }));
      return;
    }
    if (!all.length) {
      recList.appendChild(el('div', { class: 'empty',
        text: 'Henüz kayıtlı çalışmanız yok. Yukarıdan bir şablon seçip başlayın — doldurduğunuz her form otomatik olarak buraya kaydedilir.' }));
      return;
    }
    var box = el('div', { class: 'rec-list' });
    all.slice(0, 6).forEach(function (r) { box.appendChild(recNode(r, paintRecents)); });
    recList.appendChild(box);
    document.getElementById('usage-note').textContent =
      'Tarayıcı belleği: ' + Y.humanSize(Y.Store.usage());
  }

  /* ---------------------------------------------------------------- yönetim */

  function openManager() {
    var body = el('div');

    function paint() {
      body.innerHTML = '';
      var all = Y.Store.list();
      if (!all.length) {
        body.appendChild(el('div', { class: 'empty', text: 'Kayıt yok.' }));
      } else {
        var box = el('div', { class: 'rec-list' });
        all.forEach(function (r) { box.appendChild(recNode(r, function () { paint(); paintRecents(); })); });
        body.appendChild(box);
      }
      body.appendChild(el('div', { class: 'notice', style: 'margin-top:16px',
        html: 'Kayıtlar yalnızca <strong>bu tarayıcıda</strong> saklanır. Başka bir cihaza taşımak veya ' +
          'yedeklemek için JSON dışa aktarımını kullanın.' }));
    }
    paint();

    var fileInput = el('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
    fileInput.addEventListener('change', function () {
      if (!fileInput.files[0]) return;
      Y.importJSONFile(fileInput.files[0], 'merge', function () { paint(); paintRecents(); });
      fileInput.value = '';
    });
    body.appendChild(fileInput);

    Y.modal({
      title: 'Kayıtlarım',
      wide: true,
      body: body,
      actions: [
        { label: 'Tümünü sil', class: 'btn-danger', icon: 'trash', onClick: function () {
          Y.confirm('Tüm kayıtları sil', 'Bu tarayıcıdaki tüm Lean 6 Sigma kayıtları silinecek. Bu işlem geri alınamaz.', 'Hepsini sil', function () {
            Y.Store.clearAll(); paint(); paintRecents(); Y.toast('Tüm kayıtlar silindi.');
          });
          return false;
        } },
        '-',
        { label: 'JSON içe aktar', icon: 'up', onClick: function () { fileInput.click(); return false; } },
        { label: 'JSON yedek al', icon: 'down', onClick: function () { Y.exportAllJSON(); return false; } },
        { label: 'Kapat', class: 'btn-primary' }
      ]
    });
  }

  document.getElementById('btn-records').addEventListener('click', openManager);
  document.getElementById('btn-manage').addEventListener('click', openManager);

  paintRecents();

})(window.Y6S);
