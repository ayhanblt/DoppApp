# DoppApp Design Document

Bu doküman, DoppApp projesinin UI/UX tasarım sistemini, renk paletini, tipografisini ve kullanılan görsel yapıları standartlaştırmak için oluşturulmuştur. Tasarım kararları "Feature-Sliced Design" kurallarına göre birleştirilmiş ve TailwindCSS kullanılarak inşa edilmiştir.

---

## 1. Tipografi (Typography)

Uygulamanın genelinde **Geist Sans** ve monospace alanlarda **Geist Mono** fontları kullanılmıştır.
- **Heading (H1, H2, H3):** Font ağırlığı yüksek (`font-black` veya `font-bold`), dikkat çekici ve kolay okunabilir olarak tercih edilmiştir.
- **Gövde Metinleri (Body):** Düzenli ağırlıkta (`font-regular`) ve gri tonlarda (`text-zinc-500` veya `text-zinc-600`) kullanılarak hiyerarşi sağlanmıştır.

## 2. Renk Paleti (Color Palette)

Uygulama, dinamik tema yapısıyla (kategori bazlı renkler) çalışmaktadır. 

### Kategori Temaları (Accent Colors)
- **Shop (Alışveriş - Grape):** `#6b21a8` (Mor tonları)
- **Food (Yemek - Sunset):** `#ea580c` (Turuncu tonları)
- **Market (Market - Mint):** `#059669` (Yeşil tonları)

### Zemin ve Gri Tonları
- **Genel Arka Plan:** `#fff7ef` (Açık krem - Sıcaklık hissi vermek için)
- **Kart Arka Planları:** `#ffffff` (Saf beyaz)
- **Metin Renkleri:** 
  - Ana Başlıklar: `text-zinc-950` veya `text-black`
  - İkincil Metinler / Açıklamalar: `text-zinc-500`
  - Sınırlar (Borders): `border-black/10` (Hafif geçirgen siyah)

## 3. Bileşen Yapıları (Component Patterns)

DoppApp'teki modern ve canlı UI hissini yaratmak için belirli kalıplar (patterns) izlenmiştir:

### 3.1. Kartlar ve Gölgeler
Tüm ana bileşenler (Mağaza kartları, ürün listeleri, popup modal'lar) şu Tailwind yapısını takip eder:
- **Köşe Yuvarlama:** `rounded-lg` (Büyük bloklar için) veya `rounded-full` (İkonlar ve butonlar için).
- **Gölgelendirme:** `shadow-sm` veya `shadow-2xl` (Modal pop-uplar gibi öne çıkması gereken yerlerde).
- **Sınır:** `border border-black/10` hafif kontur vermek için.

### 3.2. Butonlar (Buttons)
- **Ana Aksiyon Butonları (Primary):** Dinamik kategori rengini arkaplan olarak alır `bg-[var(--accent)]` ve beyaz kalın metin kullanır `text-white font-black`.
- **İkincil Butonlar (Secondary):** Beyaz arkaplanlı, hafif gölgeli `bg-white shadow-sm border border-black/10 text-zinc-600`.

### 3.3. İkonlar
Uygulama genelinde **Lucide React** ikon seti kullanılmaktadır. Arayüzün karmaşıklaşmaması için ikonlar genellikle `size={18}` veya `size={14}` gibi minimal boyutlarda tercih edilmektedir (Örn: `Clock`, `Bike`, `ShoppingCart`).

### 3.4. Modal ve Overlays (Popuplar)
Açılır pencereler (Ürün Ekleme, Adres Seçimi) ekranın tam ortasında belirir:
```tsx
<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
  <div className="w-full max-h-[92vh] max-w-lg overflow-auto rounded-lg bg-white p-5 shadow-2xl">
     {/* İçerik */}
  </div>
</div>
```

## 4. Animasyonlar ve Etkileşim (Interaction & Motion)
- Temalar arası geçişte header renginin yavaşça değişmesi için `transition-colors duration-300` kullanılmıştır.
- Kurye takip ekranındaki araç (motor) animasyonları Leaflet.js tarafında `requestAnimationFrame` kullanılarak saniyede 60 kare hızında akıcı olarak render edilmektedir.
