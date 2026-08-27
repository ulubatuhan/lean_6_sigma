/* ==========================================================================
   Yepas Lean 6 Sigma — şablon tanımları
   Yeni bir form eklemek için TEMPLATES dizisine yeni bir şema nesnesi ekleyin.
   ========================================================================== */

window.Y6S = window.Y6S || {};

/* ---------- DMAIC aşamaları ---------- */

Y6S.PHASES = {
  D: { label: 'Tanımla',   full: 'Define'  },
  M: { label: 'Ölç',       full: 'Measure' },
  A: { label: 'Analiz Et', full: 'Analyze' },
  I: { label: 'İyileştir', full: 'Improve' },
  C: { label: 'Kontrol Et', full: 'Control' }
};

/* ---------- Simge kütüphanesi (24x24 viewBox içeriği) ---------- */

Y6S.ICONS = {
  swap:    '<path d="M4 7h13M14 4l3 3-3 3M20 17H7M10 14l-3 3 3 3"/>',
  flow:    '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="16" width="7" height="5" rx="1"/><rect x="15" y="16" width="7" height="5" rx="1"/><path d="M12 7v4M5.5 16v-3h13v3"/>',
  bulb:    '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 1.9v.2h5.2v-.2c0-.7.3-1.4.9-1.9A6 6 0 0 0 12 3z"/>',
  root:    '<path d="M12 3v7M12 10c0 3-4 3-4 6v2M12 10c0 3 4 3 4 6v2"/><circle cx="12" cy="3" r="1.6"/><circle cx="8" cy="19" r="1.6"/><circle cx="16" cy="19" r="1.6"/>',
  sipoc:   '<rect x="2" y="6" width="4" height="12" rx="1"/><rect x="7.5" y="6" width="4" height="12" rx="1"/><rect x="13" y="6" width="4" height="12" rx="1"/><rect x="18.5" y="6" width="3.5" height="12" rx="1"/>',
  why:     '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4"/><circle cx="12" cy="16.8" r=".9" fill="currentColor" stroke="none"/>',
  fish:    '<path d="M3 12h15M6 12l3-5M6 12l3 5M11 12l3-5M11 12l3 5"/><path d="M18 8.5 22 12l-4 3.5z"/>',
  clip:    '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM8.5 11h7M8.5 15h5"/>',
  org:     '<rect x="9" y="2.5" width="6" height="4.5" rx="1"/><rect x="2" y="16.5" width="6" height="4.5" rx="1"/><rect x="16" y="16.5" width="6" height="4.5" rx="1"/><path d="M12 7v4.5M5 16.5v-3h14v3M12 11.5v2"/>',
  a3:      '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 9h18M3 15h9"/>',
  target:  '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  check:   '<path d="M4 12.5 9 17.5 20 6.5"/>',
  doc:     '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  matrix:  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
};

/* ---------- Ortak parçalar ---------- */

var META_STD = [
  { name: 'proje',     label: 'Proje / Konu Adı', type: 'text',  width: 'half',  placeholder: 'Örn. Depo sevkiyat süresinin kısaltılması' },
  { name: 'birim',     label: 'Bölüm / Departman', type: 'text',  width: 'quarter' },
  { name: 'tarih',     label: 'Tarih',             type: 'date',  width: 'quarter' },
  { name: 'hazirlayan', label: 'Hazırlayan',       type: 'text',  width: 'third' },
  { name: 'ekip',      label: 'Takım Üyeleri',     type: 'text',  width: 'two-thirds', placeholder: 'Virgülle ayırarak yazın' }
];

var ONAY = {
  name: 'onay', type: 'table', label: 'Hazırlayan / Kontrol / Onay',
  columns: [
    { name: 'rol',   label: 'Rol',     type: 'text', width: '22%' },
    { name: 'ad',    label: 'Ad Soyad', type: 'text', width: '30%' },
    { name: 'gorev', label: 'Görev',   type: 'text', width: '28%' },
    { name: 'tarih', label: 'Tarih',   type: 'date', width: '20%' }
  ],
  seed: [{ rol: 'Hazırlayan' }, { rol: 'Kontrol' }, { rol: 'Onay' }],
  addLabel: 'Satır ekle'
};

/* SGB-F-0650 Balık Kılçığı (Ishikawa) Diyagramı ana dal sırası. */
var M6 = [
  { key: 'insan',    label: 'İNSAN',    color: '#142E51' },
  { key: 'makine',   label: 'MAKİNE',   color: '#026A39' },
  { key: 'cevre',    label: 'ÇEVRE',    color: '#0e7490' },
  { key: 'olcum',    label: 'ÖLÇÜM',    color: '#B8860B' },
  { key: 'metot',    label: 'YÖNTEM',   color: '#7a4bbd' },
  { key: 'malzeme',  label: 'MALZEME',  color: '#E7242A' }
];

var DURUM_OPT = ['Planlandı', 'Devam Ediyor', 'Tamamlandı', 'İptal'];

/* Yalın üretimin 8 israf (muda) türü — TIMWOOD + kullanılmayan yetenek. */
var MUDA_TYPES = [
  'Fazla Üretim', 'Bekleme', 'Taşıma', 'Fazla İşlem',
  'Stok', 'Hareket', 'Hata / Yeniden İşleme', 'Kullanılmayan Yetenek'
];
Y6S.MUDA_TYPES = MUDA_TYPES;

/* CNX sınıflandırması — SGB-F-0650 Kök Neden Analiz Formları, NOT-1. */
var CNX_OPT = ['C — Kontrol edilebilir', 'N — Kontrol edilemez', 'X — Bilinmiyor'];

var CNX_LEGEND = {
  type: 'static', width: 'full',
  html: '<div class="cnx-legend">' +
    '<span class="cnx-legend-title">NOT-1 · C, N, X</span>' +
    '<span class="cnx-item"><b style="background:#026A39">C</b> <strong>Kontrol edilebilir</strong> — ' +
      'prosedür, talimat veya kontrol planı ile sabitlenebilen neden.</span>' +
    '<span class="cnx-item"><b style="background:#F7B449">N</b> <strong>Kontrol edilemez</strong> — ' +
      'doğrudan müdahale edilemeyen neden; etkisi izlenir.</span>' +
    '<span class="cnx-item"><b style="background:#E7242A">X</b> <strong>Bilinmiyor</strong> — ' +
      'kontrol edilebilirliği belirsiz; araştırma veya deney gerekir.</span>' +
    '</div>'
};

var CNX_SONUC = {
  title: 'C, N, X Sonuçları',
  hint: 'Sınıflandırmayı aksiyona çevirin: C\'ler standartlaştırılır, N\'ler izlenir, X\'ler araştırılır.',
  fields: [
    { name: 'cnx_c', label: 'C — Nasıl sabit tutulacak? (standart, talimat, kontrol planı)',
      type: 'textarea', width: 'third', rows: 3 },
    { name: 'cnx_n', label: 'N — Nasıl izlenecek? (ölçüm, kayıt, uyarı sınırı)',
      type: 'textarea', width: 'third', rows: 3 },
    { name: 'cnx_x', label: 'X — Hangi araştırma / deney yapılacak?',
      type: 'textarea', width: 'third', rows: 3 }
  ]
};

/* SYB-D-0605 Stratejik Hedef-Süreç Matrisi — YEPAŞ süreç hiyerarşisi (Ana Grup / Üst Süreç / Alt Süreç). */
var STRAT_HIYERARSI = [
  ['Temel İş Süreçleri', 'Hizmetlerin Geliştirilmesi', ['Yeni Hizmet Geliştirme', 'Yeni Kanal Geliştirme']],
  ['Temel İş Süreçleri', 'Kanal Yönetimi', ['Dış Bölge Bayi Yönetimi', 'Dijital Kanalların Yönetimi', 'Müşteri İşlem Merkezlerinin Yönetimi']],
  ['Temel İş Süreçleri', 'Hizmetin Satışı ve Sunumu', ['Kurumsal Satış Yönetimi', 'Bölge Satış Yönetimi', 'Sözleşme Yönetimi', 'Faturalama', 'Lisanssız Üreticiler Operasyonlarının Yönetimi', 'Tahsilat']],
  ['Temel İş Süreçleri', 'Elektrik Ticareti', ['Talep Tahminleme', 'Elektrik Tedariği ve Satışı']],
  ['Temel İş Süreçleri', 'Müşteri İlişkileri Yönetimi', ['Müşteri İhtiyaç ve Beklentilerinin Yönetimi', 'Müşteri Deneyimini Yönetme']],
  ['Yönetsel İş Süreçleri', 'Stratejik Yönetim', ['Stratejik Planlama', 'Kurumsal Performans Yönetimi', 'Kurumsal Risk Yönetimi', 'Kurumsal Yönetişim']],
  ['Yönetsel İş Süreçleri', 'Kurumsal Gelişim', ['Süreçlerle Yönetim', 'Projelerle Yönetim', 'Yönetim Sistemi Standartları ile Güçlenme', 'Kurum Kültürünü Güçlendirme']],
  ['Yönetsel İş Süreçleri', 'Kurumsal İletişim Yönetimi', ['Kurumsal Tanıtım', 'Kurumsal Algı ve İmaj Yönetimi', 'Kurum İçi İletişim Yönetimi']],
  ['Yönetsel İş Süreçleri', 'Sürdürülebilirlik Yönetimi', ['Yönetişim', 'Sosyal', 'Çevresel']],
  ['Destek İş Süreçleri', 'Çalışan Yönetimi', ['İstihdam Yönetimi', 'Çalışan Gelişimi', 'Çalışan Bağlılığı ve Motivasyon', 'Özlük İşleri', 'İş Sağlığı ve Güvenliği']],
  ['Destek İş Süreçleri', 'Mali Yönetim', ['Bütçe Yönetimi', 'Finans Yönetimi', 'Muhasebe İşlemleri', 'Tarife ve Regülasyon']],
  ['Destek İş Süreçleri', 'Hukuksal Yönetim', ['Mevzuat Yönetimi', 'Sözleşme ve Mütalaa Yönetimi', 'KVKK Süreç Yönetimi', 'Dava, Hakem Heyeti, Arabuluculuk ve Sözleşmeli Avukatların İcra Takip Denetimi Yönetimi']],
  ['Destek İş Süreçleri', 'BT Yönetimi', ['BT Envanter Yönetimi', 'BT Altyapı İş Sürekliliği', 'Yazılım Geliştirme', 'Kullanıcı Destek Süreci', 'Veri Güvenliği']],
  ['Destek İş Süreçleri', 'Tedarik ve Lojistik', ['Tedarikçi Yönetimi', 'Tedarik', 'Malzeme ve Depo Yönetimi', 'Araç Filo Yönetimi']],
  ['Destek İş Süreçleri', 'İdari Hizmetlerin Yönetimi', ['Şirket İçi İdari Hizmetler', 'Bina Tesis Yönetimi']]
];
Y6S.STRAT_HIYERARSI = STRAT_HIYERARSI;

/* Dengeli Skorkart (Balanced Scorecard) perspektifleri — SYB-D-0605 sütun grupları. */
var STRAT_PERSPEKTIF = [
  { key: 'F', label: 'Finansal',  color: '#026A39' },
  { key: 'M', label: 'Müşteri',   color: '#14708f' },
  { key: 'S', label: 'Süreç',     color: '#142E51' },
  { key: 'G', label: 'Gelişim',   color: '#7a4bbd' },
  { key: 'T', label: 'Diğer',     color: '#B8860B' }
];
Y6S.STRAT_PERSPEKTIF = STRAT_PERSPEKTIF;

/* SGB-F-0650 NOT-2. */
var KNA_NOT2 = {
  type: 'static', width: 'full', print: false,
  html: '<div class="notice">NOT-2: Probleme ait 5 Neden Analizi\'ni ' +
    '<strong>Balık Kılçığı Diyagramı</strong> veya <strong>5 Neden Analizi Formu</strong> ' +
    'kullanarak gerçekleştirebilirsiniz.</div>'
};

/* ==========================================================================
   ŞABLONLAR
   ========================================================================== */

Y6S.TEMPLATES = [

/* ---------------------------------------------------------------- 1 */
{
  id: 'kaizen-oncesi-sonrasi',
  tags: 'kaizen, once sonra, before after, iyilestirme, gorsel, fotograf',
  name: 'Öncesi / Sonrası Kaizen',
  code: 'SYB-F-0361',
  resmiAd: 'Öncesi-Sonrası Kaizen Formu',
  yayinTarihi: '1.07.2022',
  revNo: '1',
  revTarihi: '12.11.2025',
  icon: 'swap',
  phase: 'I',
  orientation: 'portrait',
  desc: 'İyileştirme öncesi ve sonrası durumu görsellerle karşılaştırın, kazanımları sayısallaştırın.',
  /* Künye alanları SYB-F-0361 üst tablosuyla aynı sırada. */
  meta: [
    { name: 'kaizen_no', label: 'Kaizen No', type: 'text', width: 'quarter', placeholder: 'KZN-2026-001' },
    { name: 'konu', label: 'Kaizen Konusu', type: 'text', width: 'half',
      placeholder: 'Örn. Depo sevkiyat süresinin kısaltılması' },
    { name: 'lider', label: 'Kaizen Lider', type: 'text', width: 'quarter' },
    { name: 'ekip', label: 'İyileştirme Projesi Üyeleri', type: 'text', width: 'half',
      placeholder: 'Virgülle ayırarak yazın' },
    { name: 'kategori', label: 'Kategori / Etkilediği Süreç', type: 'text', width: 'half' },
    { name: 'baslangic_tarihi', label: 'Başlangıç Tarihi', type: 'date', width: 'third' },
    { name: 'bitis_tarihi', label: 'Hedeflenen Bitiş Tarihi', type: 'date', width: 'third' },
    { name: 'tarih', label: 'Form Tarihi', type: 'date', width: 'third' }
  ],
  sections: [
    {
      title: 'Problem Tanımı ve Riskler',
      hint: 'İyileştirme öncesindeki durumu, kaybı ve etkisini net biçimde yazın.',
      fields: [
        { name: 'problem', label: 'Mevcut Durum / Problem', type: 'textarea', width: 'full', rows: 4,
          placeholder: 'Ne oluyor? Ne sıklıkla? Kime, ne kadar zarar veriyor?' },
        { name: 'riskler', label: 'Projede Öngörülen Riskler', type: 'textarea', width: 'full', rows: 3 },
        { name: 'kayip_turu', label: 'İsraf Türü', type: 'select', width: 'half', options: MUDA_TYPES }
      ]
    },
    {
      title: 'Kaizen Öncesi / Kaizen Sonrası',
      hint: 'Kroki, şema ve/veya fotoğraf ekleyin. Görselleri sürükleyip bırakabilir veya tıklayarak seçebilirsiniz.',
      fields: [
        { name: 'karsilastirma', type: 'pair', label: '',
          beforeLabel: 'KAIZEN ÖNCESİ', afterLabel: 'KAIZEN SONRASI' }
      ]
    },
    {
      title: 'Yapılan İyileştirme',
      fields: [
        { name: 'iyilestirme', label: 'Uygulanan Çözüm', type: 'textarea', width: 'full', rows: 4,
          placeholder: 'Hangi değişiklik yapıldı? Nasıl uygulandı?' },
        { name: 'maliyet', label: 'İyileştirme Maliyeti (TL)', type: 'text', width: 'third' },
        { name: 'uygulama_tarihi', label: 'Uygulama Tarihi', type: 'date', width: 'third' },
        { name: 'sorumlu', label: 'Uygulama Sorumlusu', type: 'text', width: 'third' }
      ]
    },
    {
      title: 'Kaizen Kazançları',
      hint: 'Bu kaizenin sağladığı kazanç türlerini işaretleyin, ölçülebilir kriterleri tabloya yazın.',
      fields: [
        { name: 'kazanc_turu', type: 'checks', label: 'Kazanç Türleri', perRow: 2,
          options: [
            'İş Gücü Tasarrufu', 'Malzeme Tasarrufu',
            'İş Sağlığı ve Güvenliği', 'Enerji Tasarrufu',
            'İş Kolaylığı / Ergonomi', 'Kalite İyileştirme',
            'Çevre İyileştirme', 'Dokümantasyon',
            'Müşteri Memnuniyeti', 'Diğer İyileştirmeler'
          ] },
        { name: 'kazanim', type: 'table', label: 'Ölçülebilir Kazanımlar',
          columns: [
            { name: 'kriter',  label: 'Kriter',  type: 'text', width: '30%', placeholder: 'Çevrim süresi' },
            { name: 'oncesi',  label: 'Öncesi',  type: 'text', width: '16%' },
            { name: 'sonrasi', label: 'Sonrası', type: 'text', width: '16%' },
            { name: 'kazanc',  label: 'Kazanç',  type: 'text', width: '18%' },
            { name: 'birim',   label: 'Birim',   type: 'text', width: '20%', placeholder: 'dk / TL / adet' }
          ],
          seed: [{}, {}, {}]
        },
        { name: 'yillik_kazanc', label: 'Yıllık TL Kazanç', type: 'text', width: 'half' }
      ]
    },
    {
      title: 'Yaygınlaştırma ve Onaylar',
      fields: [
        { name: 'standart', label: 'Standartlaştırma Adımları', type: 'textarea', width: 'full', rows: 3,
          placeholder: 'Talimat güncellendi mi? Eğitim verildi mi? Kontrol planına eklendi mi?' },
        { name: 'yaygin', label: 'Yaygınlaştırılabilecek Diğer Alanlar', type: 'textarea', width: 'full', rows: 2 },
        { name: 'onay', type: 'table', label: 'Onaylar',
          columns: [
            { name: 'rol',   label: 'Onay',      type: 'text', width: '34%' },
            { name: 'ad',    label: 'Ad Soyad',  type: 'text', width: '33%' },
            { name: 'tarih', label: 'İmza / Tarih', type: 'date', width: '33%' }
          ],
          seed: [{ rol: 'Finansal Kontrol Onayı' }, { rol: 'Şampiyon / Kara Kuşak Onayı' }],
          addLabel: 'Satır ekle'
        }
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 2 */
{
  id: 'proses-haritasi',
  tags: 'proses, surec, akis, flowchart, akis semasi, swimlane, kulvar, harita, is akisi',
  name: 'Proses Haritası',
  code: '',
  resmi: false,
  icon: 'flow',
  phase: 'M',
  orientation: 'landscape',
  desc: 'Kulvarlı tuvalde kutuları sürükleyip ok çizerek dallanmalı süreç akışı kurun.',
  meta: META_STD.concat([
    { name: 'surec_sahibi', label: 'Süreç Sahibi', type: 'text', width: 'third' },
    { name: 'baslangic', label: 'Süreç Başlangıcı', type: 'text', width: 'third', placeholder: 'Sipariş alınması' },
    { name: 'bitis', label: 'Süreç Bitişi', type: 'text', width: 'third', placeholder: 'Sevkiyat onayı' }
  ]),
  sections: [
    {
      title: 'Süreç Haritası',
      fields: [
        { name: 'adimlar', type: 'flowmap', label: '' }
      ]
    },
    {
      title: 'Girdi Sınıflandırması (CNX)',
      hint: 'Her kutunun özellik panelinden CNX sınıfı seçebilirsiniz; sınıf, kutunun sağ üstünde renkli rozet olarak görünür.',
      fields: [CNX_LEGEND].concat(CNX_SONUC.fields)
    },
    {
      title: 'Analiz ve Değerlendirme',
      fields: [
        { name: 'darbogaz', label: 'Darboğazlar', type: 'textarea', width: 'half', rows: 3,
          placeholder: 'Hangi adım akışı yavaşlatıyor?' },
        { name: 'israf', label: 'Tespit Edilen İsraflar', type: 'textarea', width: 'half', rows: 3 },
        { name: 'iyilestirme_firsati', label: 'İyileştirme Fırsatları', type: 'textarea', width: 'full', rows: 3 }
      ]
    },
    { title: 'Onay', fields: [ONAY] }
  ]
},

/* ---------------------------------------------------------------- 3 */
{
  id: 'beyin-firtinasi',
  tags: 'beyin firtinasi, brainstorming, fikir, oneri, toplanti',
  name: 'Beyin Fırtınası Formu',
  code: 'SGB-F-0648',
  resmiAd: 'Beyin Fırtınası Formu',
  yayinTarihi: '11.04.2025',
  revNo: '0',
  revTarihi: '11.04.2025',
  icon: 'bulb',
  phase: 'D',
  orientation: 'portrait',
  desc: 'Ekipten çıkan tüm fikirleri eleştirmeden ve oylamadan toplayın, kayıt altına alın.',
  meta: [
    { name: 'konu', label: 'Beyin Fırtınası Konusu', type: 'text', width: 'full',
      placeholder: 'Örn. Sevkiyat hatalarını azaltmak için neler yapabiliriz?' },
    { name: 'birim', label: 'Bölüm', type: 'text', width: 'third' },
    { name: 'moderator', label: 'Moderatör', type: 'text', width: 'third' },
    { name: 'tarih', label: 'Tarih', type: 'date', width: 'third' },
    { name: 'yer', label: 'Yer', type: 'text', width: 'third' },
    { name: 'sure', label: 'Süre', type: 'text', width: 'third', placeholder: '60 dk' },
    { name: 'katilimci_sayisi', label: 'Katılımcı Sayısı', type: 'number', width: 'third' }
  ],
  sections: [
    {
      title: 'Katılımcılar',
      fields: [
        { name: 'katilimcilar', type: 'table', label: '',
          columns: [
            { name: 'ad',    label: 'Ad Soyad', type: 'text', width: '40%' },
            { name: 'gorev', label: 'Görev',    type: 'text', width: '35%' },
            { name: 'birim', label: 'Bölüm',    type: 'text', width: '25%' }
          ],
          seed: [{}, {}, {}, {}]
        }
      ]
    },
    {
      title: 'Fikirler',
      hint: 'Kural: Bu aşamada hiçbir fikir eleştirilmez veya oylanmaz. Amaç, mümkün olduğunca çok sayıda fikri ' +
        'ortaya dökmek ve kaydetmektir. Son satıra yazmaya başladığınızda yeni satır otomatik eklenir.',
      fields: [
        { name: 'fikirler', type: 'table', label: '', autoGrow: true,
          columns: [
            { name: 'fikir',    label: 'Fikir',    type: 'textarea', width: '70%' },
            { name: 'kategori', label: 'Kategori', type: 'text',     width: '30%' }
          ],
          seed: [{}, {}, {}, {}]
        }
      ]
    },
    {
      title: 'Sonraki Adım',
      hint: 'Beyin fırtınasından çıkan fikirler; önceliklendirme için Pareto Analizi, kök neden için Balık Kılçığı / 5 Neden gibi diğer araçlara girdi olarak kullanılabilir.',
      fields: [
        { name: 'notlar', label: 'Toplantı Notları / Sonraki Adım', type: 'textarea', width: 'full', rows: 3 }
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 4 */
{
  id: 'kok-neden-analizi',
  tags: 'kok neden, root cause, rca, dof, duzeltici faaliyet, cnx, 8d',
  name: 'Kök Neden Analizi Formu',
  code: 'SGB-F-0650',
  resmiAd: 'Kök Neden Analiz Formları',
  yayinTarihi: '17.04.2025',
  revNo: '0',
  revTarihi: '17.04.2025',
  icon: 'root',
  phase: 'A',
  orientation: 'portrait',
  desc: 'Olası nedenleri listeleyin, veriyle doğrulayın ve kök nedeni kalıcı aksiyona bağlayın.',
  meta: META_STD.concat([
    { name: 'kayit_no', label: 'Kayıt No', type: 'text', width: 'quarter' }
  ]),
  sections: [
    {
      title: 'Problem Tanımı',
      hint: '5N1K yaklaşımı ile problemi olabildiğince somut tanımlayın.',
      fields: [
        { name: 'problem', label: 'Problem', type: 'textarea', width: 'full', rows: 3 },
        { name: 'ne',    label: 'Ne oldu?',       type: 'textarea', width: 'third', rows: 2 },
        { name: 'nerede', label: 'Nerede oldu?',  type: 'textarea', width: 'third', rows: 2 },
        { name: 'ne_zaman', label: 'Ne zaman oldu?', type: 'textarea', width: 'third', rows: 2 },
        { name: 'kim',   label: 'Kim tespit etti?', type: 'textarea', width: 'third', rows: 2 },
        { name: 'nasil', label: 'Nasıl oldu?',    type: 'textarea', width: 'third', rows: 2 },
        { name: 'ne_kadar', label: 'Ne kadar / kaç adet?', type: 'textarea', width: 'third', rows: 2 },
        { name: 'etki', label: 'Etkisi (müşteri, maliyet, iş güvenliği, kalite)', type: 'textarea', width: 'full', rows: 2 }
      ]
    },
    {
      title: 'Acil Önlem (Geçici Aksiyon)',
      fields: [
        { name: 'acil_onlem', label: 'Alınan Acil Önlem', type: 'textarea', width: 'two-thirds', rows: 2 },
        { name: 'acil_tarih', label: 'Uygulama Tarihi', type: 'date', width: 'third' }
      ]
    },
    {
      title: 'Olası Nedenler, Doğrulama ve CNX',
      hint: 'Her olası nedeni sahada veri ile doğrulayın, doğrulanmayanları eleyin ve doğrulananları CNX ile sınıflandırın.',
      fields: [
        CNX_LEGEND,
        { name: 'nedenler', type: 'table', label: '',
          columns: [
            { name: 'neden',     label: 'Olası Neden',        type: 'textarea', width: '27%' },
            { name: 'kategori',  label: 'Kategori (6M)',      type: 'select',   width: '14%',
              options: M6.map(function (m) { return m.label; }) },
            { name: 'dogrulama', label: 'Doğrulama Yöntemi',  type: 'textarea', width: '22%' },
            { name: 'sonuc',     label: 'Sonuç',              type: 'select',   width: '12%', options: ['Doğrulandı', 'Elendi', 'İnceleniyor'] },
            { name: 'cnx',       label: 'CNX',                type: 'select',   width: '17%', options: CNX_OPT, cnx: true },
            { name: 'kanit',     label: 'Kanıt',              type: 'text',     width: '8%' }
          ],
          seed: [{}, {}, {}, {}, {}]
        }
      ]
    },
    CNX_SONUC,
    {
      title: 'Kök Neden ve Kalıcı Aksiyon',
      fields: [
        { name: 'kok_neden', label: 'Belirlenen Kök Neden', type: 'textarea', width: 'two-thirds', rows: 3 },
        { name: 'kok_cnx', label: 'Kök Nedenin CNX Sınıfı', type: 'select', width: 'third', options: CNX_OPT },
        { name: 'aksiyonlar', type: 'table', label: 'Kalıcı Düzeltici Faaliyetler',
          columns: [
            { name: 'aksiyon', label: 'Aksiyon', type: 'textarea', width: '40%' },
            { name: 'sorumlu', label: 'Sorumlu', type: 'text',     width: '18%' },
            { name: 'termin',  label: 'Termin',  type: 'date',     width: '15%' },
            { name: 'durum',   label: 'Durum',   type: 'select',   width: '15%', options: DURUM_OPT },
            { name: 'kanit',   label: 'Kanıt',   type: 'text',     width: '12%' }
          ],
          seed: [{}, {}, {}]
        },
        { name: 'etkinlik', label: 'Etkinlik Kontrolü (aksiyon sonrası doğrulama)', type: 'textarea', width: 'two-thirds', rows: 2 },
        { name: 'etkinlik_tarih', label: 'Kontrol Tarihi', type: 'date', width: 'third' },
        ONAY
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 5 */
{
  id: 'sipoc',
  tags: 'sipoc, tedarikci girdi surec cikti musteri, ctq, kapsam',
  name: 'SIPOC Diyagramı',
  code: 'SGB-F-0658',
  resmiAd: 'SIPOC Diyagramı',
  yayinTarihi: '23.05.2025',
  revNo: '0',
  revTarihi: '23.05.2025',
  icon: 'sipoc',
  phase: 'D',
  orientation: 'landscape',
  desc: 'Süreci tedarikçiden müşteriye kadar üst seviyede haritalayarak kapsamı netleştirin.',
  meta: [
    { name: 'surec_adi', label: 'Süreç Adı', type: 'text', width: 'half' },
    { name: 'surec_sahibi', label: 'Süreç Sahibi', type: 'text', width: 'quarter' },
    { name: 'tarih', label: 'Tarih', type: 'date', width: 'quarter' },
    { name: 'birim', label: 'Bölüm', type: 'text', width: 'third' },
    { name: 'hazirlayan', label: 'Hazırlayan', type: 'text', width: 'third' },
    { name: 'versiyon', label: 'Versiyon', type: 'text', width: 'third', placeholder: 'v1.0' }
  ],
  sections: [
    {
      title: 'Süreç Sınırları',
      fields: [
        { name: 'baslangic', label: 'Başlangıç Noktası', type: 'text', width: 'half' },
        { name: 'bitis', label: 'Bitiş Noktası', type: 'text', width: 'half' },
        { name: 'amac', label: 'Sürecin Amacı', type: 'textarea', width: 'full', rows: 2 }
      ]
    },
    {
      title: 'SIPOC',
      hint: 'Süreç (P) kolonunu 4–7 üst seviye adımla sınırlayın. Detay adımlar proses haritasına aittir.',
      fields: [
        { name: 'sipoc', type: 'sipoc', label: '' },
        { name: 'kaynaklar', label: 'Resources (Kaynaklar)', type: 'textarea', width: 'full', rows: 2,
          placeholder: 'Süreci yürütmek için gereken insan, ekipman, sistem ve bilgi kaynakları' }
      ]
    },
    {
      title: 'Müşteri Gereksinimleri (CTQ)',
      fields: [
        { name: 'ctq', type: 'table', label: '',
          columns: [
            { name: 'musteri', label: 'Müşteri',        type: 'text',     width: '20%' },
            { name: 'ihtiyac', label: 'İhtiyaç / Beklenti', type: 'textarea', width: '34%' },
            { name: 'olcut',   label: 'Ölçüt (CTQ)',    type: 'text',     width: '26%' },
            { name: 'hedef',   label: 'Hedef Değer',    type: 'text',     width: '20%' }
          ],
          seed: [{}, {}, {}]
        }
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 6 */
{
  id: 'bes-neden',
  tags: '5 neden, bes neden, 5 why, five why, kok neden, cnx',
  name: '5 Neden Analizi',
  code: 'SGB-F-0650',
  resmiAd: 'Kök Neden Analiz Formları',
  yayinTarihi: '17.04.2025',
  revNo: '0',
  revTarihi: '17.04.2025',
  icon: 'why',
  phase: 'A',
  orientation: 'portrait',
  desc: 'Problemden kök nedene inen soru zincirini adım adım kurun ve karşı önlemi tanımlayın.',
  meta: META_STD,
  sections: [
    {
      title: 'Problem',
      hint: 'Her "neden" cevabı bir öncekinin doğrudan sebebi olmalı. Zincir mantıklı okunmuyorsa geriye dönün.',
      fields: [
        { name: 'problem', label: 'Problem İfadesi', type: 'textarea', width: 'full', rows: 2,
          placeholder: 'Örn. Sevkiyat aracı 40 dakika gecikmeli çıktı.' },
        { name: 'tespit_yeri', label: 'Tespit Yeri', type: 'text', width: 'half' },
        { name: 'tespit_tarihi', label: 'Tespit Tarihi', type: 'date', width: 'half' }
      ]
    },
    {
      title: 'Neden Zinciri',
      hint: 'Her cevabı bir kanıtla destekleyin — kanıtı olmayan halka varsayımdır. Kök nedeni CNX ile sınıflandırın.',
      fields: [
        CNX_LEGEND,
        { name: 'zincir', type: 'fivewhy', label: '', count: 5, evidence: true, cnx: true }
      ]
    },
    {
      title: 'Karşı Önlem',
      fields: [
        { name: 'karsi_onlem', label: 'Kök Nedene Yönelik Karşı Önlem', type: 'textarea', width: 'full', rows: 3 },
        { name: 'sorumlu', label: 'Sorumlu', type: 'text', width: 'third' },
        { name: 'termin', label: 'Termin', type: 'date', width: 'third' },
        { name: 'durum', label: 'Durum', type: 'select', width: 'third', options: DURUM_OPT },
        { name: 'dogrulama', label: 'Etkinlik Doğrulaması', type: 'textarea', width: 'full', rows: 2 },
        ONAY
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 7 */
{
  id: 'balik-kilcigi',
  tags: 'balik kilcigi, kilcik, ishikawa, sebep sonuc, fishbone, 6m, cnx',
  name: 'Balık Kılçığı (Ishikawa)',
  code: 'SGB-F-0650',
  resmiAd: 'Kök Neden Analiz Formları',
  yayinTarihi: '17.04.2025',
  revNo: '0',
  revTarihi: '17.04.2025',
  icon: 'fish',
  phase: 'A',
  orientation: 'landscape',
  desc: '6M kategorisinde nedenleri toplayın; diyagram girdiğiniz veriden otomatik çizilsin.',
  meta: META_STD,
  sections: [
    {
      title: 'Etki (Problem)',
      fields: [
        { name: 'etki', label: 'Analiz Edilen Problem / Etki', type: 'text', width: 'full',
          placeholder: 'Örn. Raf boşluk oranının yüksek olması' }
      ]
    },
    {
      title: 'Nedenler — 6M ve CNX',
      hint: 'Her kategoriye en az 2–3 neden yazın; yanındaki C / N / X düğmesiyle nedeni sınıflandırın. ' +
        'Sınıf, diyagramda renkli rozet olarak görünür.',
      fields: [
        CNX_LEGEND,
        { name: 'nedenler', type: 'fishbone', label: '', categories: M6, transferTo: 'oncelikli' }
      ]
    },
    {
      title: 'Önceliklendirme',
      hint: 'Skor kolonu, etki ve sıklık girildiğinde otomatik hesaplanır; satırlar skora göre sıralanabilir.',
      fields: [
        { name: 'oncelikli', type: 'table', label: 'Öncelikli Nedenler',
          columns: [
            { name: 'neden',    label: 'Neden',     type: 'textarea', width: '33%' },
            { name: 'kategori', label: 'Kategori',  type: 'select',   width: '16%', options: M6.map(function (m) { return m.label; }) },
            { name: 'cnx',      label: 'CNX',       type: 'select',   width: '17%', options: CNX_OPT, cnx: true },
            { name: 'etki',     label: 'Etki (1-5)', type: 'number',  width: '11%' },
            { name: 'siklik',   label: 'Sıklık (1-5)', type: 'number', width: '12%' },
            { name: 'skor',     label: 'Skor',      type: 'number',   width: '11%', formula: 'etki*siklik' }
          ],
          seed: [{}, {}, {}],
          sortBy: 'skor'
        },
        { name: 'sonuc', label: 'Analiz Sonucu / Sonraki Adım', type: 'textarea', width: 'full', rows: 3 }
      ]
    },
    CNX_SONUC
  ]
},

/* ---------------------------------------------------------------- 8 */
{
  id: 'is-analiz-formu',
  tags: 'is analizi, gorev tanimi, pozisyon, yetkinlik, is tanimi',
  name: 'İş Analiz Formu',
  code: 'SYB-F-0363',
  resmiAd: 'İş Analiz Formu',
  yayinTarihi: '1.07.2022',
  revNo: '0',
  revTarihi: '1.07.2022',
  icon: 'clip',
  phase: 'M',
  orientation: 'portrait',
  desc: 'Bir pozisyonun görevlerini, sürelerini, yetkinliklerini ve çalışma koşullarını kayıt altına alın.',
  meta: [
    { name: 'pozisyon', label: 'Pozisyon / Ünvan', type: 'text', width: 'half' },
    { name: 'birim', label: 'Departman', type: 'text', width: 'quarter' },
    { name: 'tarih', label: 'Analiz Tarihi', type: 'date', width: 'quarter' },
    { name: 'bagli_yonetici', label: 'Bağlı Olduğu Yönetici', type: 'text', width: 'third' },
    { name: 'analiz_yapan', label: 'Analizi Yapan', type: 'text', width: 'third' },
    { name: 'calisan', label: 'Görüşülen Çalışan', type: 'text', width: 'third' }
  ],
  sections: [
    {
      title: 'Görevin Amacı',
      fields: [
        { name: 'amac', label: 'Pozisyonun Varlık Amacı', type: 'textarea', width: 'full', rows: 3 },
        { name: 'bagli_kisi', label: 'Kendisine Bağlı Kişi Sayısı', type: 'number', width: 'third' },
        { name: 'vardiya', label: 'Çalışma Düzeni', type: 'select', width: 'third',
          options: ['Gündüz', 'Vardiyalı', 'Esnek', 'Uzaktan / Hibrit'] },
        { name: 'haftalik_saat', label: 'Haftalık Çalışma Saati', type: 'number', width: 'third' }
      ]
    },
    {
      title: 'Görev ve Sorumluluklar',
      hint: 'Süre kolonuna görevin haftalık toplam süresini dakika olarak yazın.',
      fields: [
        { name: 'gorevler', type: 'table', label: '',
          columns: [
            { name: 'gorev',    label: 'Görev / Sorumluluk', type: 'textarea', width: '38%' },
            { name: 'siklik',   label: 'Sıklık',   type: 'select', width: '15%',
              options: ['Sürekli', 'Günlük', 'Haftalık', 'Aylık', 'Yıllık', 'İhtiyaç Halinde'] },
            { name: 'sure',     label: 'Süre (dk/hafta)', type: 'number', width: '14%' },
            { name: 'kritiklik', label: 'Kritiklik', type: 'select', width: '14%', options: ['Yüksek', 'Orta', 'Düşük'] },
            { name: 'kdd',      label: 'Katma Değer', type: 'select', width: '19%',
              options: ['Katma Değerli', 'Katma Değersiz (Zorunlu)', 'İsraf'] }
          ],
          seed: [{}, {}, {}, {}, {}]
        }
      ]
    },
    {
      title: 'Yetkinlikler ve Nitelikler',
      fields: [
        { name: 'yetkinlikler', type: 'table', label: 'Yetkinlikler',
          columns: [
            { name: 'yetkinlik', label: 'Yetkinlik', type: 'text',     width: '32%' },
            { name: 'tur',       label: 'Tür',       type: 'select',   width: '20%', options: ['Teknik', 'Davranışsal', 'Yönetsel'] },
            { name: 'seviye',    label: 'Gerekli Seviye', type: 'select', width: '18%', options: ['Temel', 'Orta', 'İleri', 'Uzman'] },
            { name: 'aciklama',  label: 'Açıklama',  type: 'textarea', width: '30%' }
          ],
          seed: [{}, {}, {}]
        },
        { name: 'egitim', label: 'Gerekli Eğitim Düzeyi', type: 'text', width: 'third' },
        { name: 'deneyim', label: 'Gerekli Deneyim', type: 'text', width: 'third' },
        { name: 'sertifika', label: 'Sertifika / Belge', type: 'text', width: 'third' }
      ]
    },
    {
      title: 'Kaynaklar ve Çalışma Koşulları',
      fields: [
        { name: 'ekipman', type: 'table', label: 'Kullanılan Ekipman / Sistem',
          columns: [
            { name: 'ad',       label: 'Ekipman / Yazılım', type: 'text',     width: '40%' },
            { name: 'amac',     label: 'Kullanım Amacı',    type: 'textarea', width: '40%' },
            { name: 'yetkinlik', label: 'Gerekli Yetkinlik', type: 'text',    width: '20%' }
          ],
          seed: [{}, {}]
        },
        { name: 'kosullar', label: 'Fiziksel Çalışma Koşulları', type: 'textarea', width: 'half', rows: 3 },
        { name: 'riskler', label: 'İş Sağlığı ve Güvenliği Riskleri', type: 'textarea', width: 'half', rows: 3 },
        { name: 'oneri', label: 'İyileştirme Önerileri', type: 'textarea', width: 'full', rows: 3 },
        ONAY
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 9 */
{
  id: 'organizasyon-semasi',
  tags: 'organizasyon semasi, org sema, hiyerarsi, kadro, teskilat',
  name: 'Organizasyon Şeması',
  code: '',
  resmi: false,
  icon: 'org',
  phase: 'D',
  orientation: 'landscape',
  desc: 'Kişileri ve bağlı oldukları yöneticileri girin; hiyerarşi şeması otomatik çizilsin.',
  meta: [
    { name: 'birim', label: 'Birim / Şirket', type: 'text', width: 'half' },
    { name: 'tarih', label: 'Geçerlilik Tarihi', type: 'date', width: 'quarter' },
    { name: 'versiyon', label: 'Revizyon No', type: 'text', width: 'quarter' },
    { name: 'hazirlayan', label: 'Hazırlayan', type: 'text', width: 'half' },
    { name: 'onaylayan', label: 'Onaylayan', type: 'text', width: 'half' }
  ],
  sections: [
    {
      title: 'Kadro',
      hint: 'İlk satırı en üst yönetici olarak bırakın. Her kişi için bağlı olduğu yöneticiyi seçin.',
      fields: [
        { name: 'kadro', type: 'orgchart', label: '' }
      ]
    },
    {
      title: 'Notlar',
      fields: [
        { name: 'notlar', label: 'Açıklamalar', type: 'textarea', width: 'full', rows: 3 },
        { name: 'toplam', label: 'Toplam Kadro', type: 'number', width: 'third' },
        { name: 'acik', label: 'Açık Pozisyon', type: 'number', width: 'third' }
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 10 */
{
  id: 'a3-kaizen',
  tags: 'a3, puko, pdca, rapor, problem cozme, kaizen',
  name: 'A3 Kaizen Formu',
  code: 'SYB-F-0360',
  resmiAd: 'A3 Kaizen Formu',
  yayinTarihi: '1.07.2022',
  revNo: '1',
  revTarihi: '12.11.2025',
  icon: 'a3',
  phase: 'I',
  orientation: 'landscape',
  desc: 'Problemden standartlaştırmaya kadar tüm PUKÖ döngüsünü tek sayfada raporlayın.',
  /* Künye ve 8 adım SYB-F-0360 A3 Kaizen Formu ile aynı sırada. */
  meta: [
    { name: 'kaizen_no', label: 'Kaizen No', type: 'text', width: 'quarter' },
    { name: 'konu', label: 'Kaizen Konu', type: 'text', width: 'half' },
    { name: 'lider', label: 'Kaizen Lider', type: 'text', width: 'quarter' },
    { name: 'kategori', label: 'Kategori / Etkilediği Süreç', type: 'text', width: 'half' },
    { name: 'ekip', label: 'İyileştirme Projesi Üyeleri', type: 'text', width: 'half' },
    { name: 'baslangic_tarihi', label: 'Başlangıç Tarihi', type: 'date', width: 'half' },
    { name: 'bitis_tarihi', label: 'Hedeflenen Bitiş Tarihi', type: 'date', width: 'half' }
  ],
  a3: true,
  sections: [
    {
      title: 'Mevcut Durum',
      hint: 'Problemi veriyle tarif edin: ne oluyor, ne sıklıkla, hangi etkiyle?',
      fields: [
        { name: 'mevcut', label: 'Durum Açıklaması', type: 'textarea', width: 'full', rows: 4 },
        { name: 'mevcut_veri', type: 'table', label: 'Mevcut Performans',
          columns: [
            { name: 'gosterge', label: 'Gösterge', type: 'text', width: '46%' },
            { name: 'deger',    label: 'Değer',    type: 'text', width: '27%' },
            { name: 'birim',    label: 'Birim',    type: 'text', width: '27%' }
          ],
          seed: [{}, {}]
        }
      ]
    },
    {
      title: 'Hedef',
      fields: [
        { name: 'hedef', label: 'Hedef Durum', type: 'textarea', width: 'full', rows: 3 },
        { name: 'hedef_deger', label: 'Hedef Değer', type: 'text', width: 'half' },
        { name: 'hedef_tarih', label: 'Hedef Tarihi', type: 'date', width: 'half' }
      ]
    },
    {
      title: 'Proje Riskleri',
      fields: [
        { name: 'riskler', type: 'table', label: '',
          columns: [
            { name: 'risk',   label: 'Risk',   type: 'textarea', width: '46%' },
            { name: 'etki',   label: 'Etkisi', type: 'text',     width: '27%' },
            { name: 'onlem',  label: 'Önlem',  type: 'textarea', width: '27%' }
          ],
          seed: [{}, {}]
        }
      ]
    },
    {
      title: 'Kök Sebep Analizi',
      fields: [
        CNX_LEGEND,
        { name: 'analiz', label: 'Analiz Özeti', type: 'textarea', width: 'full', rows: 3 },
        { name: 'kok_zincir', type: 'fivewhy', label: '5 Neden', count: 5, evidence: true, cnx: true }
      ]
    },
    {
      title: '1. Aşama Gözden Geçirme (Şampiyon / Kara Kuşak)',
      hint: 'Kök sebep analizi onaylanmadan çözüm aşamasına geçilmez.',
      fields: [
        { name: 'gg1_not', label: 'Değerlendirme', type: 'textarea', width: 'full', rows: 2 },
        { name: 'gg1_ad',  label: 'Ad Soyad', type: 'text', width: 'half' },
        { name: 'gg1_tarih', label: 'İmza / Tarih', type: 'date', width: 'half' }
      ]
    },
    {
      title: 'Önerilen Çözümler',
      fields: [
        { name: 'onlemler', type: 'table', label: '',
          columns: [
            { name: 'onlem',    label: 'Önerilen Çözüm', type: 'textarea', width: '32%' },
            { name: 'neden',    label: 'Hangi Kök Nedene', type: 'textarea', width: '22%' },
            { name: 'sorumlu',  label: 'Sorumluluklar', type: 'text', width: '18%' },
            { name: 'termin',   label: 'Termin', type: 'date', width: '14%' },
            { name: 'maliyet',  label: 'Maliyet Tahmini', type: 'text', width: '14%' }
          ],
          seed: [{}, {}, {}]
        }
      ]
    },
    {
      title: 'İyileştirme Aksiyonlarının Uygulanması',
      fields: [
        { name: 'plan', type: 'table', label: '',
          columns: [
            { name: 'is',      label: 'Aksiyon', type: 'textarea', width: '38%' },
            { name: 'sorumlu', label: 'Sorumlu', type: 'text',     width: '18%' },
            { name: 'baslama', label: 'Başlama', type: 'date',     width: '14%' },
            { name: 'termin',  label: 'Termin',  type: 'date',     width: '14%' },
            { name: 'durum',   label: 'Durum',   type: 'select',   width: '16%', options: DURUM_OPT }
          ],
          seed: [{}, {}, {}, {}]
        }
      ]
    },
    {
      title: '2. Aşama Gözden Geçirme (Süreç Sahibi)',
      fields: [
        { name: 'gg2_not', label: 'Değerlendirme', type: 'textarea', width: 'full', rows: 2 },
        { name: 'gg2_ad',  label: 'Ad Soyad', type: 'text', width: 'half' },
        { name: 'gg2_tarih', label: 'İmza / Tarih', type: 'date', width: 'half' }
      ]
    },
    {
      title: 'Çözümün Kontrolü',
      fields: [
        { name: 'aksiyon_uygulandi', label: 'Aksiyon Uygulandı mı?', type: 'select', width: 'half',
          options: ['Evet', 'Kısmen', 'Hayır'] },
        { name: 'hedefe_ulasildi', label: 'Hedefe Ulaşıldı mı?', type: 'select', width: 'half',
          options: ['Evet', 'Kısmen', 'Hayır'] },
        { name: 'uygulama_maliyeti', label: 'Uygulamanın Maliyeti', type: 'text', width: 'half' },
        { name: 'yillik_getiri', label: 'Yıllık Getiri', type: 'text', width: 'half' },
        { name: 'takip_veri', type: 'table', label: 'Ölçüm Sonuçları',
          columns: [
            { name: 'gosterge', label: 'Gösterge', type: 'text', width: '34%' },
            { name: 'hedef',    label: 'Hedef',    type: 'text', width: '22%' },
            { name: 'gercek',   label: 'Gerçekleşen', type: 'text', width: '22%' },
            { name: 'durum',    label: 'Durum',    type: 'select', width: '22%', options: ['Hedefe Ulaşıldı', 'Kısmen', 'Ulaşılmadı'] }
          ],
          seed: [{}, {}]
        }
      ]
    },
    {
      title: '3. Aşama Gözden Geçirme (Finans Sorumlusu)',
      fields: [
        { name: 'gg3_not', label: 'Değerlendirme', type: 'textarea', width: 'full', rows: 2 },
        { name: 'gg3_ad',  label: 'Ad Soyad', type: 'text', width: 'half' },
        { name: 'gg3_tarih', label: 'İmza / Tarih', type: 'date', width: 'half' }
      ]
    },
    {
      title: 'Yayılım ve Standardizasyon',
      fields: [
        { name: 'standartlasti', label: 'Çözüm Standartlaştı mı?', type: 'select', width: 'half',
          options: ['Evet', 'Devam ediyor', 'Hayır'] },
        { name: 'yayildi', label: 'Çözüm diğer alanlara yayıldı mı?', type: 'select', width: 'half',
          options: ['Evet', 'Devam ediyor', 'Hayır'] },
        { name: 'standart', label: 'Standartlaştırma Adımları', type: 'textarea', width: 'full', rows: 3 },
        { name: 'ogrenilen', label: 'Öğrenilen Dersler', type: 'textarea', width: 'full', rows: 2 }
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 11 */
{
  id: 'aksiyon-plani',
  tags: 'aksiyon plani, 5n1k, 5w1h, termin, takip, is plani',
  name: 'Aksiyon Planı (5N1K)',
  code: '',
  resmi: false,
  icon: 'target',
  phase: 'I',
  orientation: 'landscape',
  desc: 'Kararları "ne, neden, nerede, ne zaman, kim, nasıl" disipliniyle takip edilebilir hale getirin.',
  meta: META_STD,
  sections: [
    {
      title: 'Kapsam',
      fields: [
        { name: 'amac', label: 'Planın Amacı', type: 'textarea', width: 'full', rows: 2 },
        { name: 'kaynak', label: 'Kaynağı', type: 'select', width: 'third',
          options: ['Kaizen', 'Denetim Bulgusu', 'Müşteri Şikayeti', 'Beyin Fırtınası', 'Kök Neden Analizi', 'Yönetim Kararı', 'Diğer'] },
        { name: 'baslangic', label: 'Başlangıç', type: 'date', width: 'third' },
        { name: 'bitis', label: 'Planlanan Bitiş', type: 'date', width: 'third' }
      ]
    },
    {
      title: 'Aksiyonlar',
      hint: 'Her satır tek bir sorumluya ve tek bir termine bağlanmalıdır.',
      fields: [
        { name: 'aksiyonlar', type: 'table', label: '',
          columns: [
            { name: 'ne',       label: 'Ne',      type: 'textarea', width: '22%' },
            { name: 'neden',    label: 'Neden',   type: 'textarea', width: '17%' },
            { name: 'nerede',   label: 'Nerede',  type: 'text',     width: '11%' },
            { name: 'ne_zaman', label: 'Ne Zaman', type: 'date',    width: '11%' },
            { name: 'kim',      label: 'Kim',     type: 'text',     width: '12%' },
            { name: 'nasil',    label: 'Nasıl',   type: 'textarea', width: '17%' },
            { name: 'durum',    label: 'Durum',          type: 'select',   width: '10%', options: DURUM_OPT }
          ],
          seed: [{}, {}, {}, {}, {}]
        }
      ]
    },
    {
      title: 'Takip',
      fields: [
        { name: 'riskler', label: 'Riskler ve Önlemler', type: 'textarea', width: 'half', rows: 3 },
        { name: 'ihtiyac', label: 'Gerekli Kaynak / Bütçe', type: 'textarea', width: 'half', rows: 3 },
        ONAY
      ]
    }
  ]
},

/* ---------------------------------------------------------------- 12 */
{
  id: 'stratejik-hedef-surec-matrisi',
  tags: 'stratejik, hedef, surec matrisi, bsc, balanced scorecard, x matrisi, hoshin, strateji haritasi',
  name: 'Stratejik Hedef-Süreç Matrisi',
  code: 'SYB-D-0605',
  resmiAd: 'Stratejik Hedef-Süreç Matrisi',
  yayinTarihi: '21.03.2024',
  revNo: '1',
  revTarihi: '16.06.2026',
  icon: 'matrix',
  phase: 'D',
  orientation: 'landscape',
  desc: 'YEPAŞ süreç hiyerarşisini stratejik hedeflerle eşleştirin; hangi sürecin hangi hedefi desteklediğini işaretleyin.',
  meta: [
    { name: 'donem', label: 'Dönem', type: 'text', width: 'third', placeholder: 'Örn. 2026' },
    { name: 'hazirlayan', label: 'Hazırlayan', type: 'text', width: 'third' },
    { name: 'tarih', label: 'Tarih', type: 'date', width: 'third' }
  ],
  sections: [
    {
      title: 'Hedef-Süreç Matrisi',
      hint: 'Sütun başlıklarındaki renkli harf perspektifi gösterir (F: Finansal, M: Müşteri, S: Süreç, G: Gelişim, T: Diğer) — tıklayarak değiştirebilirsiniz. ' +
        'Kod kutusuna o döneme ait stratejik hedef kodunu yazın (örn. F1.1) ve ilgili süreç satırlarında kutucuğu işaretleyin.',
      fields: [
        { name: 'matris', type: 'stratmatrix', label: '' }
      ]
    },
    {
      title: 'Değerlendirme',
      fields: [
        { name: 'notlar', label: 'Notlar / Öncelikli Alanlar', type: 'textarea', width: 'full', rows: 3 },
        ONAY
      ]
    }
  ]
}

];

/* ---------- Yardımcı erişim ---------- */

Y6S.getTemplate = function (id) {
  for (var i = 0; i < Y6S.TEMPLATES.length; i++) {
    if (Y6S.TEMPLATES[i].id === id) return Y6S.TEMPLATES[i];
  }
  return null;
};

Y6S.FLOW_TYPES = [
  { key: 'baslabitir', label: 'Başla / Bitir', shape: 'terminator' },
  { key: 'islem',      label: 'İşlem',         shape: 'process' },
  { key: 'karar',      label: 'Karar',         shape: 'decision' },
  { key: 'kontrol',    label: 'Kontrol',       shape: 'inspection' },
  { key: 'bekleme',    label: 'Bekleme',       shape: 'delay' },
  { key: 'tasima',     label: 'Taşıma',        shape: 'transport' },
  { key: 'depolama',   label: 'Depolama',      shape: 'storage' },
  { key: 'dokuman',    label: 'Doküman',       shape: 'document' }
];

Y6S.VALUE_TYPES = [
  { key: 'kd',    label: 'Katma Değerli',             color: '#026A39' },
  { key: 'kdz',   label: 'Katma Değersiz (Zorunlu)',  color: '#B8860B' },
  { key: 'israf', label: 'İsraf',                     color: '#E7242A' }
];

Y6S.M6 = M6;
