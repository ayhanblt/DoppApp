# DoppApp - AI Assistant Optimization Guide (Claude & Gemini)

Bu dosya, projede kod yazacak tüm AI kodlama asistanlarının uyması gereken katı mimari kuralları ve standartları belirler.

## Projenin Amacı ve Özellikleri
- Supabase tabanlı PostgreSQL veritabanı ve Storage kullanan çoklu kategorili (Shop, Food, Market) e-ticaret/kurye takip simülasyonu.
- Çoklu dil (i18n) desteğine sahiptir (Tr/En).
- **Çift Platform (Cross-Platform):** Web tarafı `src/` klasöründe Next.js 15 ile, Mobil uygulama tarafı ise `mobile/` klasöründe React Native, Expo Router ve NativeWind v4 kullanılarak geliştirilmektedir. Web özellikleri ile Mobil özellikleri birbirinin aynasıdır.

## Klasör Yapısı (Feature-Sliced Design - FSD)
Projeye yeni bir özellik ekleneceğinde her iki platform için de FSD prensiplerine sadık kalınmalıdır:
- **`app/` (Web) veya `mobile/app/` (Mobil):** Sadece rota (URL) tanımlamaları ve layoutlar bulunur. İş mantığı burada yazılmaz.
- **`features/` (Web) veya `mobile/src/features/` (Mobil):** Domain bazlı iş mantığı (Örn: `catalog`, `admin`, `order`, `tracking`). Her feature sadece kendi scope'undan sorumludur.
- **`shared/` (Web) veya `mobile/src/shared/` (Mobil):** Uygulama genelinde paylaşılan her şey (`types.ts`, `dictionaries.ts`, helper fonksiyonları, api clientleri).

## Genel Kod Yazma ve Geliştirme Kuralları (Development Rules)
- **Önce Mevcut Patternleri İncele:** Projeye yeni bir bileşen veya logic eklerken, `CatalogContext.tsx` gibi mevcut state yapılarına ve FSD (Feature-Sliced Design) klasör yapısına uygun hareket et.
- **Gereksiz Abstraction (Soyutlama) Yasak:** Henüz ihtiyaç duyulmayan karmaşık tasarımlardan, generic fonksiyonlardan veya over-engineering'den kaçın. Basit ve doğrudan çözümler üret.
- **Clean Code:** Bileşenleri küçük ve tekrar kullanılabilir yaz. `AdminPanel.tsx` gibi şişmiş dosyalar gördüğünde refactor etmeye meyilli ol.
- **Client-Side Heavy:** Harita (`Leaflet`) kullanan bileşenler SSR ortamında hata fırlatır. Harita veya `window` objesine ihtiyaç duyan kodları daima `next/dynamic` ile `ssr: false` bayrağını kullanarak çağır.

## State ve Tip Yönetimi (Code Style)
- **Tip Güvenliği (TypeScript):** Kesin (strict) mod aktiftir. `any` kullanımı kesinlikle yasaktır. Her zaman `shared/lib/types.ts` içerisindeki kesin TypeScript tiplerini kullanın veya oraya ekleyin.
- **State Yönetimi:** Redux, MobX, Zustand gibi harici state yönetim kütüphaneleri KULLANILMAYACAKTIR. Global arayüz state işlemleri için `CatalogContext.tsx` yapısını koruyun.
- **React:** Next.js 15 App Router ve React 19 kullanılıyor. Client mantığı gereken sayfalara/bileşenlere `"use client"` eklemeyi unutma.
- **Import Düzeni:** Önce React/Next.js bağımlılıkları, sonra 3. parti kütüphaneler (lucide-react vb.), ardından projenin kendi local modülleri (`@/` alias ile) import edilmeli.

## Naming Convention (İsimlendirme)
- **Dosyalar:** React bileşenleri `PascalCase` (Örn: `TrackingMap.tsx`), yardımcı fonksiyonlar ve hook'lar `camelCase` (Örn: `useImageCache.ts`, `geo.ts`). Klasör isimleri için `kebab-case` veya `camelCase`.
- **Değişkenler:** Anlaşılır ve uzun isimler kullanın. `arr`, `obj`, `data` gibi jenerik isimlerden kaçının.

## Cross-Platform UI Kuralları (Önemli!)
- **Web UI:** Standart HTML etiketleri (`<nav>`, `<button>`) ve standart TailwindCSS kullanın. Hamburger Menü, Dropdown, Adres haritası (Modal içi) web'de Next.js bileşenleriyle oluşturulmuştur. Varsayılan açılış sayfası `/shop` rotasıdır. Arama çubuğu (Search Bar) Web Header'ında sabittir.
- **Mobile UI:** Yalnızca Native bileşenler (`<View>`, `<Text>`, `<Pressable>`) kullanın. NativeWind v4 ile Tailwind class'larını kullanın.
  - Mobil uygulamada çentik (Notch/Dynamic Island) altına tam oturması için `react-native-safe-area-context` kullanın (React Native'in kendi `SafeAreaView`'unu DEĞİL!).
  - Web'deki Hamburger Menünün karşılığı olarak Mobilde **Drawer Navigation** (`expo-router/drawer`) kullanın.
  - Konum/Adres seçici harita ekranını Mobilde `react-native-maps` ile oluşturup Native `Modal` içinde barındırın. **ÖNEMLİ:** Kullanıcının henüz seçili bir adresi yoksa harita çökmemsi için varsayılan koordinat "Ev" başlığı ile Şişli / İstanbul (`lat: 41.0603, lng: 28.9877`) olarak ayarlanmalıdır. Seçili adres cihazda `AsyncStorage` ile kalıcı hale getirilmelidir.
  - Adres açıklamasından koordinat bulma (Geocoding) işlemi için harita uyumluluğu sebebiyle **Nominatim (OpenStreetMap)** API'sini kullanın.
  - Fiş (Receipt) üretimi ve paylaşımı gibi Web tarafında Next.js `next/og` ile çizilen dinamik görseller, Mobil tarafta doğrudan Web API'ye data parametresi gönderilerek `Image` ile gösterilmeli; Supabase `shared_receipts` tablosuna yazılıp kısa link ile Native `Share` kütüphanesi üzerinden paylaşılmalıdır.
  - CSS Değişkenleri (`var(--accent)`) Native Modal sınırlarını geçemediğinden, `tailwind.config.js` içinde `theme.colors` alanını statik HEX kodları ile (`#fb4824` vb.) ayarlayın.

## Form ve Veri Gösterimi
- Admin paneli (Web Only) çok dilli formlar (`AdminLangTabs`) ve Markdown textarea kullanır.
- Hem Web hem Mobilde Markdown verilerini parse ederek zengin içerikli şekilde gösterin (`react-markdown` veya benzeri paketler).

## V2 Kategori Hiyerarşisi (Supabase Veritabanı Kuralları)
- **`store_categories`** (Ana Kategoriler - Tree Yapısı)
- **`product_categories`** (Mağaza bazlı alt kategoriler)
- **`stores`** (`category_id` FK)
- **`products`** (`product_category_id` FK). Opsiyonel `section_label_tr/en` kullanır (Arayüzde başlık olarak `COALESCE(section_label, product_category.name)` esastır).
Veritabanında teslimat süreleri (min/max) DAKİKA DEĞİL, SANİYE olarak tutulur.

## Review Checklist (Kod Yazdıktan Sonra Kontrol Edilecekler)
- [ ] Yeni metin eklendiyse `dictionaries.ts` dosyasına hem Türkçe hem İngilizce çevirisi yapıldı mı?
- [ ] Bileşene özgü CSS ihtiyacı varsa (Web) Tailwind class'ları, (Mobil) NativeWind class'ları kullanıldı mı?
- [ ] Mobil tarafta çalışırken `lucide-react` yerine `lucide-react-native` import edildi mi?
- [ ] Modal kapatma işlemleri dış alana (backdrop) tıklama ve ESC tuşu ile desteklendi mi?
- [ ] Görseller kare formatta (`aspect-square object-cover`) ayarlandı mı?
- [ ] Web ve Mobil eşzamanlı olarak FSD yapısına sadık kaldı mı?
- [ ] React Native'de (Mobil) `TextInput` içeren sayfalar ve modallarda, klavye açıldığında input alanlarının kapanmaması için `KeyboardAvoidingView` kullanımı uygulandı mı?

## Before Coding Checklist (Kodlamaya Başlamadan Önce)
Herhangi bir dosyayı düzenlemeye veya yeni özellik eklemeye başlamadan önce:
1. İlgili feature/domain klasöründeki dosyaları tara (Örn: Sepet için `src/features/order/cart.ts`).
2. Kullanılan patternleri anla. Supabase fetch/upsert işlemleri nasıl yapılıyor? i18n çevirileri nasıl çekiliyor?
3. Etkilenecek alanları (Impact Analysis) kontrol et.
4. Vitest + RTL tabanlı test ihtiyacını belirle.

## Testing Rules (Test Kuralları)
Projeye eklenen her yeni iş mantığı için:
- Unit test KESİNLİKLE yazılmalı (`*.test.ts` formatında).
- "Arrange-Act-Assert" şablonu uygulanmalı.
- Edge case (uç durumlar) mutlaka düşünülmeli (Örn: Kurye başlangıç koordinatı ile müşteri koordinatı aynıysa?).
- Supabase API veya Harita manipülasyonu yapan kısımlar için Mock stratejisi (örn. `vi.spyOn()`) uygulanmalı.

## NativeWind v4 - Dinamik Class Optimizasyonu
- NativeWind v4 kullanırken `className` içinde eksik veya dalgalanan (fluctuating) class isimlerinden kaçının. Örneğin `className={\`shadow-${isActive ? 'sm' : 'none'}\`}` gibi kullanımlar veya bir durumda `shadow-sm` varken diğer durumda gölge class'ının tamamen silinmesi render hatalarına sebep olabilir.
- **İyi Kullanım:** Ana stili her durumda sabit tutun ve yokluk durumunu açıkça belirtin. (Örn: `className={\`shadow-sm ${isActive ? 'shadow-md' : 'shadow-none'}\`}`)

## Rota ve Teslimat Hesaplamaları (Multi-Stop Routing)
- Sepette birden fazla mağazadan ürün varsa, kurye **OSRM /trip API** kullanılarak Gezgin Satıcı Problemi (TSP) çözümü ile rotalandırılır.
- Uzaklık ve optimizasyon hesaplaması için eski "kuş uçuşu (haversine)" mantığı kullanılmaz. Tüm mağazalar ve ev koordinatı API'ye gönderilir.
- `routeWaypoints` (dizisi) içerisinde sırayla uğranacak mağazalar ve **en son** teslimat adresi bulunur. Bu sıralama doğrudan OSRM `trip` diziliminden alınır ve `orders` tablosuna yazılır.
- Kurye, ev adresi haricindeki en mantıklı (veya API tarafından fallback olarak atanan) mağazadan başlar. Rotada V şekli gibi mantıksız çizimlerin önüne doğrudan Karayolu Geometrisi optimizasyonuyla geçilmiştir.

## Kurye Takip ve Paylaşım (Tracking & Sharing)
- **Ziyaret Edilen Mağazalar:** Sipariş takip ekranında kurye rotasındaki mağazalara uğradıkça (ya da sipariş teslim edildiğinde), mağaza ikonları yeşil `CircleCheckBig` olarak güncellenmelidir. (Web'de `TrackingMap.tsx` içinde Marker icon prop'u ile, Mobilde ise WebView içine JS string `window.initMap` ile enjekte edilerek.)
- **Harita Tooltip/Popup:** Web'de `react-leaflet` in `<Tooltip>` bileşeni kullanılarak, mobilde ise `marker.bindPopup` HTML stringi üzerinden mağazanın adı ve sepetteki ilgili ürünleri (`name x qty`) gösterilmelidir.
- **Paylaşım (Share):** Siparişi paylaş butonunun yanına, resmi Native Share menüsü yerine sadece sipariş URL'sini panoya kopyalayan (`expo-clipboard` / `navigator.clipboard`) "Link Kopyala" (Link2) ikonu konulmalıdır.
- **Native Görsel Paylaşımı (Mobile):** Mobilde "Siparişi Paylaş" butonuna tıklandığında açılan `ReceiptShareModal` içerisinde, `expo-file-system` (`downloadAsync`, `cacheDirectory` / legacy metodlar) kullanılarak görsel cihaza indirilmeli ve `expo-sharing` ile (resim dosyası formatında) paylaşılmalıdır.

## Görsel Yükleme ve Gösterim Standartları (Ürün & Mağaza)
- **Admin Paneli Görsel Standardizasyonu:** Admin panelinden yüklenen tüm ürün (itemImage) ve mağaza (storeLogo) fotoğrafları tarayıcı tarafında (Client-Side HTML Canvas ile) **1080x1080 kare ve beyaz arkaplanlı (object-contain)** formata otomatik olarak zorlanır. Görselin dışına çıkılarak kırpma yapılmasına olanak tanınır.
- Sunucuya/Supabase'e giden nihai görseller her zaman 1:1 karedir. Bu sayede web ve mobil UI tarafında ek bir `object-cover` veya bulanık arkaplan hesaplaması yapmaya gerek kalmaz.
- **Dosya İsimlendirme (Slug):** Yüklenen görseller rastgele id yerine okunabilir bir "slug" yapısıyla sunucuya gönderilmelidir. Ürün veya mağaza adı temizlenip (Türkçe karakter ve boşluklar dahil) üzerine benzersiz bir id eklenerek (Örn: `acili-kebap-x9f-2z.jpg`) isimlendirilir.
- **FSD Mimarisi:** Görsel kütüphanesi ve kırpma aracı `src/features/admin/image-library` altında yönetilmelidir. Eski yüklenen fotoğrafları listeleyen (ImageLibraryModal) ve kırpma işlemini (ImageCropperModal) yapan modüller burada yer alır. Modallar `z-[99999]` sınıfına sahip olarak diğer UI katmanlarını (ör: z-50 olan AdminModal) ezer.
- **Kütüphane Optimizasyonu:** Yüklenen görselleri listeleyen kütüphane her seferinde ağ isteği yapmamak için bellek içi (in-memory variable) cache kullanmalıdır. Kütüphane, arama ve çoklu seçim (bulk delete) işlemlerini desteklemelidir. Çoklu görsel seçildiğinde kütüphanedeki kırp ve seç butonları devreden çıkıp yalnızca çoklu sil butonuna izin verilmelidir.

## Modal ve Scroll (Kaydırma) Yönetimi
- **Arkaplan Kaymasını (Scroll) Engelleme:** Admin panelinde herhangi bir Modal (`AdminModal`, `ImageCropperModal`, `ImageLibraryModal` vb.) açıldığında arka plandaki ana sayfanın kaymaması için `src/shared/hooks/useScrollLock.ts` hook'u kullanılmalıdır. Inline styling veya body'ye doğrudan style ataması yapmak yerine (örn: `document.body.style.overflow`) component içerisinde `useScrollLock()` çağrılması standarttır. Bu yapı, performans sorunu yaratmadan React yaşam döngüsüne uygun olarak mount anında scroll'u kitler ve unmount anında serbest bırakır.
- **Tip (Type) Güvenliği ve FSD:** Sayfa içerisinde, komponentlerin bulunduğu `tsx` dosyalarının başında (`AdminModalProps` vb.) tip tanımlamak yerine, tüm global ve ortak tipler FSD mimarisine uygun olarak sadece `src/shared/lib/types.ts` içerisinden `import type` ile içeri alınmalıdır.

## Animasyon ve Dinamik Arayüz Standartları
- **Web Animasyonları:** Next.js (Web) tarafındaki arayüz tasarımlarında statik bileşenler yerine hareketli ve premium hissettiren tasarımlar kullanılacaktır. Web tarafı için **`framer-motion`** kütüphanesi kullanılacaktır. (Not: App Router'da framer-motion kullanılan componentlerin en üstünde `"use client";` eklenmelidir).
- **Mobil Animasyonları:** React Native (Mobil) tarafında akıcı ve yüksek performanslı animasyonlar için **`react-native-reanimated`** kullanılacaktır.
- **Tasarım Dili:** Bundan sonra eklenecek yeni UI bileşenleri, modal açılışları, buton hover/tap efektleri ve liste render işlemleri (stagger effect) doğrudan animasyon kütüphaneleriyle entegre şekilde kodlanacaktır. Uygulama "ölü" (statik) hissettirmemeli, mikro etkileşimlerle (micro-interactions) canlı olmalıdır.

## Çoklu Dil ve Çevre Değişkenleri
- **Çevre Değişkenleri (.env Yönetimi):** Projemizde Mobil klasörü içerisinde `.env`, Web klasörü içerisinde ise `.env.local` kullanılmaktadır. Veritabanı bağlantısı için doğrudan `EXPO_PUBLIC_SUPABASE_URL` kullanılmaktadır. Mobil tarafında Next.js API uç noktalarına (örn: fiş çizimi için `/api/receipt`) yapılan istekler için geliştirme ortamında yerel sunucu IP adresi (örn: `EXPO_PUBLIC_API_URL=http://192.168.1.129:3000/api`) kullanılır. Ancak uygulama production'a (canlıya) çıkmadan önce `.env` içerisindeki bu adres kesinlikle ana sitenin adresine (örn: `EXPO_PUBLIC_API_URL=https://doppapp.com/api`) yönlendirilmelidir. Web tarafında ise Next.js kendi içinde çalıştığı için yerel isteklerde varsayılan yapı (localhost) kullanılmaya devam edebilir.
