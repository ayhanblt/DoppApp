<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DoppApp - AI Agent Operations Manual

Bu doküman, projede kod yazacak tüm AI kodlama asistanlarının uyması gereken katı mimari kuralları ve standartları belirler.

## Projenin Amacı ve Özellikleri
- Supabase tabanlı PostgreSQL veritabanı ve Storage kullanan çoklu kategorili (Shop, Food, Market) e-ticaret/kurye takip simülasyonu.
- Çoklu dil (i18n) desteğine sahiptir (Tr/En).
- **Çift Platform (Cross-Platform):** Web tarafı `src/` klasöründe Next.js 15 ile, Mobil uygulama tarafı ise `mobile/` klasöründe React Native, Expo Router ve NativeWind v4 kullanılarak geliştirilmektedir. Web özellikleri ile Mobil özellikleri birbirinin aynasıdır.

## Klasör Yapısı (Feature-Sliced Design - FSD)
Projeye yeni bir özellik ekleneceğinde her iki platform için de FSD prensiplerine sadık kalınmalıdır:
- **`app/` (Web) veya `mobile/app/` (Mobil):** Sadece rota (URL) tanımlamaları ve layoutlar bulunur. İş mantığı burada yazılmaz.
- **`features/` (Web) veya `mobile/src/features/` (Mobil):** Domain bazlı iş mantığı (Örn: `catalog`, `admin`, `order`, `tracking`). Her feature sadece kendi scope'undan sorumludur.
- **`shared/` (Web) veya `mobile/src/shared/` (Mobil):** Uygulama genelinde paylaşılan her şey (`types.ts`, `dictionaries.ts`, helper fonksiyonları, api clientleri).

## Kod Yazma Standartları ve State Yönetimi
- **Tip Güvenliği:** `any` kullanımı kesinlikle yasaktır. Her zaman `shared/lib/types.ts` içerisindeki kesin TypeScript tiplerini kullanın.
- **State Yönetimi:** Redux, MobX, Zustand gibi harici state yönetim kütüphaneleri KULLANILMAYACAKTIR. Global arayüz state işlemleri için `CatalogContext.tsx` yapısını koruyun.

## Naming Convention (İsimlendirme)
- **Dosyalar:** React bileşenleri `PascalCase` (Örn: `TrackingMap.tsx`), yardımcı fonksiyonlar ve hook'lar `camelCase` (Örn: `useImageCache.ts`, `geo.ts`).
- **Değişkenler:** Anlaşılır ve uzun isimler kullanın. `arr`, `obj`, `data` gibi jenerik isimlerden kaçının.

## Cross-Platform UI Kuralları (Önemli!)
- **Web UI:** Standart HTML etiketleri (`<nav>`, `<button>`) ve standart TailwindCSS kullanın. Hamburger Menü, Dropdown, Adres haritası (Modal içi) web'de Next.js bileşenleriyle oluşturulmuştur. Varsayılan açılış sayfası `/shop` rotasıdır. Arama çubuğu (Search Bar) Web Header'ında sabittir.
- **Mobile UI:** Yalnızca Native bileşenler (`<View>`, `<Text>`, `<Pressable>`) kullanın. NativeWind v4 ile Tailwind class'larını kullanın.
  - Mobil uygulamada çentik (Notch/Dynamic Island) altına tam oturması için `react-native-safe-area-context` kullanın (React Native'in kendi `SafeAreaView`'unu DEĞİL!).
  - Web'deki Hamburger Menünün karşılığı olarak Mobilde **Drawer Navigation** (`expo-router/drawer`) kullanın.
  - Konum/Adres seçici harita ekranını Mobilde `react-native-maps` ile oluşturup Native `Modal` içinde barındırın. **ÖNEMLİ:** Kullanıcının henüz seçili bir adresi yoksa harita çökmemsi için varsayılan koordinat Beşiktaş / İstanbul (`lat: 41.0422, lng: 29.0060`) olarak ayarlanmalıdır. Seçili adres cihazda `AsyncStorage` ile kalıcı hale getirilmelidir.
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

