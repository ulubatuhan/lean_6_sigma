# Yepas Lean 6 Sigma

Yalın üretim ve Altı Sigma çalışmaları için etkileşimli form ve şablon merkezi.
Şablonu seçersiniz, formu tarayıcıda doldurursunuz, **PDF** veya **Word** olarak
çıktı alırsınız. Doldurduğunuz her belge tarayıcınızın belleğinde saklanır.

Derleme adımı, sunucu veya bağımlılık yoktur — saf HTML/CSS/JS. GitHub Pages'te
olduğu gibi çalışır.

---

## Şablonlar

| # | Form | Kod | DMAIC | Sayfa |
|---|------|-----|-------|-------|
| 1 | Öncesi / Sonrası Kaizen | `FR-KZN-01` | İyileştir | A4 dikey |
| 2 | Proses Haritası | `FR-PRS-01` | Ölç | A4 yatay |
| 3 | Beyin Fırtınası Formu | `FR-BYF-01` | Tanımla | A4 dikey |
| 4 | Kök Neden Analizi Formu | `FR-KNA-01` | Analiz Et | A4 dikey |
| 5 | SIPOC Diyagramı | `FR-SPC-01` | Tanımla | A4 yatay |
| 6 | 5 Neden Analizi | `FR-5N-01` | Analiz Et | A4 dikey |
| 7 | Balık Kılçığı (Ishikawa) | `FR-ISK-01` | Analiz Et | A4 yatay |
| 8 | İş Analiz Formu | `FR-IAF-01` | Ölç | A4 dikey |
| 9 | Organizasyon Şeması | `FR-ORG-01` | Tanımla | A4 yatay |
| 10 | A3 Kaizen Formu | `FR-A3-01` | İyileştir | A4 yatay |
| 11 | Aksiyon Planı (5N1K) | `FR-AKS-01` | İyileştir | A4 yatay |

Balık kılçığı, proses haritası ve organizasyon şemasında **diyagram girdiğiniz
veriden otomatik çizilir** ve çıktıya aynen aktarılır.

---

## Kullanım

1. Ana sayfada açılır listeden bir form seçin, **Başla**'ya basın.
2. Formu doldurun — her değişiklik ~0,7 sn içinde otomatik kaydedilir.
3. **Önizleme** ile A4 çıktının nasıl görüneceğini kontrol edin.
4. **PDF** düğmesi yazdırma penceresini açar; hedef olarak *"PDF olarak kaydet"*
   seçin. Sayfa boyutu ve yönü şablona göre otomatik ayarlanır.
5. **Word** düğmesi düzenlenebilir bir `.doc` dosyası indirir (diyagramlar ve
   fotoğraflar gömülüdür).

### Klavye kısayolları

| Kısayol | İşlev |
|---------|-------|
| `Ctrl` + `S` | Kaydet |
| `Ctrl` + `P` | PDF çıktısı |
| `Esc` | Açık pencereyi kapat |

---

## Veri saklama

- Kayıtlar tarayıcının `localStorage` alanında tutulur (`y6s:` ön eki).
- Veriler **hiçbir sunucuya gönderilmez**; yalnızca o tarayıcıda kalır.
- Farklı bir cihaza taşımak için **Kayıtlarım → JSON yedek al**, hedef cihazda
  **JSON içe aktar** kullanın.
- Görseller yüklenirken en fazla 1400 px'e küçültülüp JPEG'e çevrilir; buna
  rağmen `localStorage` sınırı (~5 MB) dolarsa uyarı gösterilir.

> Tarayıcı verilerini temizlemek kayıtları da siler. Önemli belgeleri PDF/Word
> olarak dışa aktarın veya JSON yedeği alın.

---

## Yayınlama (GitHub Pages)

Depo ayarlarından **Settings → Pages → Build and deployment → Source: Deploy from
a branch** seçin, dalı ve `/ (root)` klasörünü belirtin. Birkaç dakika içinde
site şu adreste yayına girer:

```
https://<kullanıcı-adı>.github.io/lean_6_sigma/
```

Depoda `.nojekyll` dosyası bulunur; Jekyll işlemesi devre dışıdır.

Yerelde denemek için:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

---

## Dosya düzeni

```
index.html              Ana sayfa: şablon seçimi, kartlar, son kayıtlar
form.html               Form barındırıcı (?t=<şablon> veya ?id=<kayıt>)
assets/css/main.css     Arayüz stilleri (açık/koyu tema)
assets/css/print.css    A4 çıktı belgesi ve @media print
assets/js/templates.js  Tüm form şemaları  ← yeni form buraya
assets/js/core.js       Yardımcılar, modal, bildirim, localStorage katmanı
assets/js/diagrams.js   SVG üreticiler (balık kılçığı, akış, organizasyon)
assets/js/render.js     Şema → etkileşimli DOM
assets/js/printdoc.js   Şema + veri → A4 çıktı belgesi
assets/js/export.js     PDF (yazdırma), Word (MHTML), JSON
assets/js/app.js        Ana sayfa mantığı
assets/js/form.js       Form sayfası mantığı
```

---

## Yeni form eklemek

`assets/js/templates.js` içindeki `Y6S.TEMPLATES` dizisine bir nesne ekleyin:

```js
{
  id: 'ornek-form',
  name: 'Örnek Form',
  code: 'FR-ORN-01',
  icon: 'doc',            // Y6S.ICONS içindeki anahtar
  phase: 'D',             // D | M | A | I | C
  orientation: 'portrait',// portrait | landscape
  desc: 'Kart üzerinde görünen kısa açıklama.',
  meta: [ { name: 'proje', label: 'Proje', type: 'text', width: 'half' } ],
  sections: [
    {
      title: 'Bölüm Başlığı',
      hint: 'İsteğe bağlı yönlendirme notu.',
      fields: [
        { name: 'aciklama', label: 'Açıklama', type: 'textarea', width: 'full', rows: 3 },
        { name: 'liste', type: 'table', label: 'Tablo',
          columns: [
            { name: 'is', label: 'İş', type: 'textarea', width: '60%' },
            { name: 'kim', label: 'Sorumlu', type: 'text', width: '40%' }
          ],
          seed: [{}, {}]
        }
      ]
    }
  ]
}
```

Ana sayfa, form sayfası ve tüm çıktı biçimleri şemayı otomatik olarak işler.

### Alan tipleri

| Tip | Açıklama |
|-----|----------|
| `text` `textarea` `date` `number` `select` | Temel alanlar (`width`: `full`, `two-thirds`, `half`, `third`, `quarter`) |
| `table` | Satır eklenip silinebilen tablo (`columns`, `seed`) |
| `pair` | Öncesi/sonrası görsel + açıklama |
| `fivewhy` | 5 Neden zinciri + kök neden |
| `fishbone` | 6M neden girişi + canlı Ishikawa diyagramı |
| `sipoc` | Beş kolonlu SIPOC girişi |
| `flow` | Süreç adımları tablosu + akış diyagramı + verimlilik özeti |
| `orgchart` | Kişi/yönetici girişi + hiyerarşi şeması |

---

## Tarayıcı desteği

Chrome, Edge, Firefox ve Safari'nin güncel sürümleri. PDF çıktısı için
tarayıcının yazdırma penceresindeki "PDF olarak kaydet" seçeneği kullanılır.
