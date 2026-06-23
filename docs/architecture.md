# Architecture

## Genel Mimari Yaklaşım
DoppApp, artık **çift platformlu (Cross-Platform)** bir mimari yapıya sahiptir:
1. **Web Frontend (`src/`):** **Next.js 15 (App Router)** üzerinde çalışan, istemci ağırlıklı (Client-Side Heavy) bir React web uygulamasıdır.
2. **Mobile App (`mobile/`):** **React Native ve Expo Router** kullanan, mobil iOS ve Android platformları için geliştirilmiş kardeş uygulamadır.

Her iki platform da ortak bir veri kaynağı olarak **Supabase (PostgreSQL ve Storage)** kullanmaktadır. Veri kalıcılığı ve resim yüklemeleri Supabase üzerinden sağlanır. Mimari, hem web hem de mobil tarafında benzer mantıkların koşulabilmesi için paralel bir yapıda kurgulanmıştır.

Bileşen mimarisinde kodun temizliği ve tekrar kullanılabilirliği için **Feature-Sliced Design (FSD)** metodolojisi benimsenmiştir. Bu yapı, projeyi katmanlara (layers) ve domainlere (slices) bölerek kontrolü artırır. Mobil uygulama da bu FSD yaklaşımını kendi `mobile/src/` klasörü içinde kopyalar.

## Katmanlar (Layers) ve Veri Akışı

1. **Routing Katmanı (`app/` ve `mobile/app/`):** Sadece URL rotalarını, layoutları (Drawer, Stack, Tabs) ve dil (i18n) ayarlarını yönetir. İş mantığı barındırmaz, sadece alt bileşenleri çağırır.
   - Web: `/shop`, `/food`, `/market` ve `/store/[id]` rotaları mevcuttur.
   - Mobile: `mobile/app/(drawer)` altında Drawer navigation, `/store/[id]` rotası ile mağaza detayı, `/cart`, `/checkout` ve `/tracking` bağımsız yığın (stack) ekranları yer alır.
2. **Features Katmanı (`features/` ve `mobile/src/features/`):** İş mantığının (Business Logic) kalbidir. Sipariş hesaplamaları, katalog filtrelemeleri, admin işlemleri, yorum gönderme ve harita takibi burada domain bazlı klasörlenir.
3. **Shared Katmanı (`shared/` ve `mobile/src/shared/`):** Tüm projenin kullandığı ortak tipler (`types.ts`), formatlama fonksiyonları (`format.ts`), Supabase bağlantı istemcileri (`supabase.ts`), Markdown render edici (`MarkdownText.tsx`) ve çoklu dil sözlükleri (`dictionaries.ts`) burada yer alır.

**Veri Akışı:**
Veri Supabase API üzerinden asenkron çekilir ve `CatalogContext.tsx` aracılığıyla global state'e alınır. Tüm sayfalar bu context'i dinler. State güncellemeleri (örneğin sepete ürün ekleme veya Supabase üzerinde mağaza yorumlarını güncelleme) yine bu Context veya feature bazlı custom hook'lar üzerinden yönetilir. Mobilde de aynı bağlam mimarisi (`CatalogContext.tsx`) korunmuştur.

## Mevcut Klasör Yapısı (Çift Platform)

```text
DoppApp/
├── src/                      # Next.js Web Uygulaması (Ana FSD Yapısı)
│   ├── app/                  # Next.js App Router (Sayfalar ve Rotalar)
│   ├── features/             # Business Logic & Modüller
│   │   ├── catalog/          # Listeleme, HeaderMenu, Adres Seçici
│   │   ├── admin/            # Web tabanlı yönetim paneli
│   │   ├── order/            # Checkout ve Sepet
│   │   └── tracking/         # Harita takibi
│   └── shared/               # Ortak tipler ve fonksiyonlar
│
└── mobile/                   # React Native (Expo) Mobil Uygulaması
    ├── app/                  # Expo Router (Drawer, Ekranlar)
    │   ├── (drawer)/         # Yan Menü Layoutu (Giriş, Hakkında)
    │   ├── store/[id].tsx    # Mağaza Detay Sayfası & Yorum Entegrasyonu
    │   ├── cart.tsx          # Sepet Ekranı & Sepet Kaydet/Yükle UI
    │   ├── checkout.tsx      # Ödeme & Sipariş Hazırlığı
    │   └── tracking.tsx      # Canlı Kurye Takip Ekranı
    ├── src/                  # Mobil tarafa özel FSD Yapısı
    │   ├── features/         # Web'deki logic'in mobile uyarlanmış UI karşılıkları
    │   └── shared/           # Web'den taşınan tipler, i18n, ui (MarkdownText)
    ├── assets/               # Mobil resimler, logolar ve fontlar
    └── tailwind.config.js    # NativeWind v4 konfigürasyonu
```

## UI & Styling Stratejisi
- **Web:** Standart Tailwind CSS kullanılır. HTML etiketleri (`<nav>`, `<div>`, vs.) ile zengin modern web deneyimi sunulur.
- **Mobile:** **NativeWind v4** ile Tailwind class'ları React Native bileşenlerine ( `<View>`, `<Text>`) derlenir. Mobil tarafta Modal yönetimi için `react-native-safe-area-context` ve `Modal` bileşenleri kullanılırken, harita için `react-native-maps` paketinden yararlanılır. CSS değişkenleri (`var(--accent)`) Native Modal sınırlarını geçemediğinden, mobil `tailwind.config.js` içinde kritik renkler sabit (hardcoded) olarak tanımlanmıştır.
- **Yerel Kalıcılık:** Web'deki `localStorage` sepet kaydetme ve dil seçimi işlemleri mobilde `@react-native-async-storage/async-storage` aracılığıyla kalıcı hale getirilmiştir.

