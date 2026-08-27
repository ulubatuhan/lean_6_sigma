/* ==========================================================================
   Yepas Lean 6 Sigma — form sayfası
   ========================================================================== */

(function (Y) {
  'use strict';

  var el = Y.el;

  Y.initTheme();

  /* ---------------------------------------------------------------- kayıt */

  var q = new URLSearchParams(location.search);
  var recId = q.get('id');
  var tplId = q.get('t');
  var storageOK = Y.Store.available();

  var rec = null, tpl = null;

  if (recId) {
    rec = Y.Store.get(recId);
    if (!rec) {
      Y.toast('Kayıt bulunamadı, yeni belge açıldı.', 'err');
      recId = null;
    } else {
      tpl = Y.getTemplate(rec.tpl);
    }
  }
  if (!rec) {
    tpl = Y.getTemplate(tplId);
    if (!tpl) {
      document.getElementById('form-root').innerHTML =
        '<div class="empty">Şablon bulunamadı. <a href="index.html">Ana sayfaya dön</a> ve listeden bir form seçin.</div>';
      document.getElementById('save-text').textContent = '';
      return;
    }
    rec = {
      id: Y.uid(),
      tpl: tpl.id,
      title: tpl.name,
      data: {}
    };
    if (!rec.data.tarih) rec.data.tarih = Y.todayISO();
  }
  if (!tpl) {
    document.getElementById('form-root').innerHTML =
      '<div class="empty">Bu kaydın şablonu tanınmıyor. <a href="index.html">Ana sayfaya dön</a>.</div>';
    return;
  }
  if (!rec.data) rec.data = {};

  document.title = rec.title + ' — Yepas Lean 6 Sigma';

  /* ---------------------------------------------------------------- üst çubuk */

  document.querySelector('.form-toolbar a.btn').innerHTML = Y.ui('back');

  var titleInput = document.getElementById('doc-title');
  titleInput.value = rec.title || '';

  var dot = document.getElementById('savedot');
  var saveText = document.getElementById('save-text');

  var progress = Y.el('span', { class: 'progress-chip',
    html: '<span class="progress-bar"><i style="width:0%"></i></span><span class="progress-txt"></span>' });
  document.querySelector('.doc-sub').appendChild(progress);

  function setState(kind, text) {
    dot.className = 'savedot' + (kind ? ' ' + kind : '');
    saveText.textContent = text;
  }

  function paintProgress() {
    var p = Y.formProgress(tpl, rec.data);
    progress.querySelector('i').style.width = p.pct + '%';
    progress.querySelector('.progress-txt').textContent = '%' + p.pct + ' dolu (' + p.done + '/' + p.total + ')';
    progress.title = 'Doldurulan alan: ' + p.done + ' / ' + p.total;
  }

  var actions = document.getElementById('toolbar-actions');

  function tbtn(label, icon, cls, fn) {
    var b = el('button', { class: 'btn btn-sm ' + (cls || ''), type: 'button',
      html: Y.ui(icon) + '<span>' + Y.esc(label) + '</span>' });
    b.addEventListener('click', fn);
    actions.appendChild(b);
    return b;
  }

  /* ---------------------------------------------------------------- kaydetme */

  var dirty = false;

  function doSave(silent) {
    rec.title = titleInput.value.trim() || tpl.name;
    if (!storageOK) {
      setState('err', 'Tarayıcı belleği kapalı — kaydedilmiyor');
      return false;
    }
    var res = Y.Store.save(rec);
    if (res.ok) {
      dirty = false;
      setState('', 'Kaydedildi · ' + Y.fmtWhen(rec.updatedAt));
      if (!silent) Y.toast('Kaydedildi.', 'ok');
      if (!history.state || history.state.id !== rec.id) {
        history.replaceState({ id: rec.id }, '', 'form.html?id=' + encodeURIComponent(rec.id));
      }
      return true;
    }
    setState('err', res.error);
    Y.toast(res.error, 'err');
    return false;
  }

  var autosave = Y.debounce(function () { doSave(true); }, 700);

  var paintProgressSoon = Y.debounce(paintProgress, 250);

  function onChange() {
    dirty = true;
    setState('pending', 'Kaydediliyor…');
    autosave();
    paintProgressSoon();
  }

  titleInput.addEventListener('input', onChange);

  /* ---------------------------------------------------------------- form */

  var form = Y.renderForm(document.getElementById('form-root'), tpl, rec.data, onChange);

  document.getElementById('foot-note').textContent =
    tpl.name + ' · Form kodu ' + (tpl.code || '—') + ' · Çıktı sayfa düzeni: ' +
    (tpl.orientation === 'landscape' ? 'A4 yatay' : 'A4 dikey') +
    ' · Değişiklikler otomatik olarak tarayıcı belleğine kaydedilir.';

  /* ---------------------------------------------------------------- eylemler */

  function opts() { return { title: rec.title }; }

  tbtn('Önizleme', 'eye', '', function () {
    doSave(true);
    form.refreshAll();
    Y.previewDoc(tpl, rec.data, opts());
  });

  tbtn('PDF', 'print', 'btn-primary', function () {
    doSave(true);
    form.refreshAll();
    Y.exportPDF(tpl, rec.data, opts());
  });

  tbtn('Word', 'word', '', function () {
    doSave(true);
    form.refreshAll();
    Y.toast('Word belgesi hazırlanıyor…');
    Y.exportWord(tpl, rec.data, opts());
  });

  tbtn('Kaydet', 'save', '', function () { doSave(false); });

  tbtn('Daha fazla', 'folder', 'btn-ghost', function () {
    var body = el('div', { class: 'stack' });

    function item(title, note, label, icon, cls, fn) {
      var row = el('div', { class: 'rec' });
      var main = el('div', { class: 'rec-main' });
      main.appendChild(el('div', { class: 'rec-title', text: title }));
      main.appendChild(el('div', { class: 'rec-meta', text: note }));
      row.appendChild(main);
      var b = el('button', { class: 'btn btn-sm ' + (cls || ''), type: 'button',
        html: Y.ui(icon) + '<span>' + Y.esc(label) + '</span>' });
      b.addEventListener('click', fn);
      row.appendChild(el('div', { class: 'rec-actions' }, [b]));
      return row;
    }

    body.appendChild(item('JSON yedeği', 'Bu belgeyi dosya olarak indirin; başka bir cihazda içe aktarabilirsiniz.',
      'İndir', 'down', '', function () { doSave(true); Y.exportRecordJSON(rec, tpl); }));

    body.appendChild(item('Kopyasını oluştur', 'Mevcut veriyle yeni bir belge açar.',
      'Kopyala', 'copy', '', function () {
        doSave(true);
        var c = Y.Store.duplicate(rec.id);
        if (c) location.href = 'form.html?id=' + encodeURIComponent(c.id);
      }));

    body.appendChild(item('Formu temizle', 'Tüm alanlar boşaltılır, belge kaydı korunur.',
      'Temizle', 'trash', 'btn-danger', function () {
        Y.confirm('Formu temizle', 'Bu belgedeki tüm veriler silinecek. Devam edilsin mi?', 'Temizle', function () {
          rec.data = { tarih: Y.todayISO() };
          form = Y.renderForm(document.getElementById('form-root'), tpl, rec.data, onChange);
          doSave(true);
          paintProgress();
          Y.toast('Form temizlendi.');
        });
      }));

    body.appendChild(item('Belgeyi sil', 'Kayıt tarayıcı belleğinden kalıcı olarak silinir.',
      'Sil', 'trash', 'btn-danger', function () {
        Y.confirm('Belgeyi sil', '"' + rec.title + '" kalıcı olarak silinecek.', 'Sil', function () {
          Y.Store.remove(rec.id);
          location.href = 'index.html';
        });
      }));

    body.appendChild(el('div', { class: 'notice',
      html: 'İpucu: <span class="kbd">Ctrl</span> + <span class="kbd">S</span> kaydeder, ' +
        '<span class="kbd">Ctrl</span> + <span class="kbd">P</span> PDF çıktısı alır.' }));

    Y.modal({ title: 'Belge işlemleri', body: body, actions: [{ label: 'Kapat', class: 'btn-primary' }] });
  });

  Y.mountThemeButton(actions);

  /* ---------------------------------------------------------------- kısayollar */

  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    var k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); doSave(false); }
    else if (k === 'p') {
      e.preventDefault();
      doSave(true);
      form.refreshAll();
      Y.exportPDF(tpl, rec.data, opts());
    }
  });

  window.addEventListener('beforeunload', function (e) {
    if (!dirty) return;
    doSave(true);
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------------------------------------------------------------- başlangıç */

  if (recId) {
    setState('', 'Kaydedildi · ' + Y.fmtWhen(rec.updatedAt));
  } else {
    // Boş kayıtla listeyi kirletmemek için ilk değişikliğe kadar yazmıyoruz.
    setState('pending', storageOK ? 'Yeni belge — ilk yazdığınızda kaydedilir'
                                  : 'Tarayıcı belleği kapalı — kaydedilmiyor');
  }
  paintProgress();

})(window.Y6S);
