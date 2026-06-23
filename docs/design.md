# DoppApp Premium Design System

Bu doküman, DoppApp projesinin güncellenmiş "Senior UI / Premium" tasarım sistemini, renk paletini, tipografisini ve kullanılan görsel yapıları standartlaştırmak için oluşturulmuştur. Bundan sonra eklenecek tüm yeni özellikler ve bileşenler bu "Design System" kurallarını baz almalıdır.

---

## 1. Tipografi ve Etkileşim (Typography & Interaction)

Uygulamanın genelinde **Geist Sans** ve monospace alanlarda **Geist Mono** fontları kullanılmıştır.
- **Premium Seçim Rengi (Text Selection):** Kullanıcı bir metni seçtiğinde varsayılan mavi yerine marka rengi (Turuncu/Grape/Mint) arka plan, beyaz metin kullanılır (`::selection`).
- **Scrollbar:** Tüm sayfalarda klasik kalın scrollbar yerine, iOS/Mac tarzı yarı saydam ve köşeleri yuvarlatılmış premium kaydırma çubuğu kullanılır.

## 2. Renk Paleti ve Arka Planlar (Colors & Backgrounds)

Uygulama, içeriği (beyaz kartları) ön plana çıkarmak için nötr ve ferah bir arkaplan kullanır.
- **Genel Uygulama Arka Planı (App BG):** `#fafafa` (Çok açık nötr gri). Kartların havada yüzmesini sağlar. (Önceden kullanılan sıcak kremsi #fff7ef tamamen terkedilmiştir).
- **Kart Arka Planları:** `#ffffff` (Saf beyaz).
- **Ürün Görselleri Arka Planı:** Beyaz arkaplanlı ürün görsellerini UI ile bütünleştirmek için görsel konteynerlarında `bg-zinc-50` arkaplanı ve görselde `mix-blend-multiply` CSS özelliği kullanılmalıdır. `bg-white` gibi sert arkaplanlar tasarımın şıklığını bozduğu için bu kombinasyon tercih edilmelidir.
- **Mağaza (Store) Başlıkları:** Saf beyaz listelerden ayrışması için çok hafif marka rengi tonlaması (`bg-[var(--accent)]/5`) kullanılır. Gradient (renk geçişi) kullanımı yasaktır.
- **Sınırlar (Borders):**
  - Kart dış sınırları: `border-black/10` (Hafif ve net).
  - Hover durumundaki sınırlar: `hover:border-[var(--accent)]/40` (Kullanıcı fareyi gezdirdiğinde markayı hissettirir).
  - İç ayırıcılar (Dividers): `divide-y divide-black/5` kullanılarak ürünler arası çizgi çekilir. Kutu-içinde-kutu (Box-within-a-box) mantığı kullanılmaz.

## 3. Bileşen Yapıları (Component Patterns)

### 3.1. Yumuşak Gölgeler ve Köşeler (Soft UI)
- **Köşe Yuvarlama (Radius):** Modern ve samimi bir his için global olarak `16px` (1rem) yani Tailwind'in `rounded-2xl` hissiyatı standartlaştırılmıştır.
- **Gölgelendirme (Shadows):** Klasik siyah lekeler yerine çok katmanlı, dumanlı gölgeler `globals.css` içerisine tanımlanmıştır. (Örn: `0 8px 30px rgba(0,0,0,0.05)`).
- **Hover Gölgeleri:** Tıklanabilir büyük kartlar üzerine gelindiğinde `hover:shadow-md` ile kullanıcıya tepki verir.

### 3.2. Butonlar (Buttons) ve Mikro-Animasyonlar
Projeye eklenen her `button` elementi otomatik olarak şu mikro-animasyon kurallarına tabiidir:
1. `cursor: pointer` aktiftir.
2. `transition: all 0.2s` geçişi vardır.
3. Fare ile üzerine gelindiğinde (Hover): `filter: brightness(1.05)` ile çok zarifçe parlar.
4. Tıklandığında (Active): `transform: scale(0.96)` ile buton hafifçe içe göçer ve gerçekçi bir basma hissi verir.

### 3.3. Modal ve Overlays (Popuplar)
Açılır pencereler (Ürün Ekleme, Adres Seçimi) artık dikey ve basit kutular yerine **Geniş Split-Layout (Bölünmüş Düzen)** yapısını kullanır.

**Modal Kuralları:**
1. **Kapatma İşlemleri:** Tüm modallar (veri giriş formu içermeyenler) mutlaka dış (backdrop) tıklamasıyla `onClick={() => setModalOpen(false)}` ve klavyeden ESC tuşu ile kapanabilmelidir.
2. **Mobilde Ekran Kaplamama:** Modallar mobilde tüm ekranı kaplamamalı, `max-h-[70vh]` gibi limitlerle sınırlandırılmalıdır.
3. **Görsel Boyutları:** Modal görselleri mutlaka `aspect-square` (1:1 tam kare) olmalı, `object-cover` ile alanı doldurmalı ve köşelerden kesilmemesi için en az `p-4 md:p-8` boşluk (padding) bırakılmalıdır.

**Örnek Ürün Detay Modalı Yapısı:**
```tsx
<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-4 md:p-8" onClick={() => setModalOpen(false)}>
  {/* Görselin kesilmemesi için min-h-[500px] hayatidir */}
  <div className="flex w-full min-h-[50vh] md:min-h-[500px] max-h-[70vh] max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl md:flex-row" onClick={e => e.stopPropagation()}>
    
    {/* SOL: Tam Yükseklik Görsel (Image) */}
    <div className="relative aspect-square shrink-0 bg-zinc-50 md:w-1/2">
       <Image fill src="..." alt="..." className="object-cover mix-blend-multiply" />
    </div>

    {/* SAĞ: Kaydırılabilir İçerik (Scrollable Content) */}
    <div className="relative flex flex-1 flex-col overflow-auto p-5 md:p-8">
       {/* Başlık, Açıklama, Opsiyonlar, Buton */}
    </div>
    
  </div>
</div>
```

## 4. Uzun Metinler (Truncation / Line Clamping)
Ürün listelerinde (Grid veya List view) yüksekliklerin eşitsizliğini (UI kırılmalarını) önlemek için metinler sabitlenir:
- **Ürün Başlığı:** `line-clamp-1`
- **Ürün Açıklaması:** `line-clamp-2`
- Orijinal uzun metin tıklanarak açılan Split-Modal içerisindeki `whitespace-pre-wrap` etiketine sahip alanda tam olarak gösterilir. HTML `title` tooltip'leri ucuz bir hissiyat yarattığı için kullanılmaz.
