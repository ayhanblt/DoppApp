# Architecture

## Genel Mimari Yaklaşım
DoppApp, **Next.js 15 (App Router)** üzerinde çalışan, tamamen **Client-Side Heavy** (istemci ağırlıklı) bir React uygulamasıdır. 
Şu an için bir gerçek backend olarak Supabase (PostgreSQL ve Storage) kullanılmaktadır. Veri kalıcılığı Supabase üzerinden sağlanır.
Mimari, gelecekte React Native mobile taşınabilirlik düşünülerek modüler bir yaklaşımla kurgulanmıştır.

Bileşen mimarisinde kodun temizliği ve tekrar kullanılabilirliği için **Feature-Sliced Design (FSD)** metodolojisine doğru bir geçiş benimsenmiştir. Bu yapı, projeyi katmanlara (layers) ve domainlere (slices) bölerek kontrolü artırır.

## Katmanlar (Layers) ve Veri Akışı

1. **Routing Katmanı (`app/`):** Sadece URL rotalarını, layoutları ve dil (i18n) ayarlarını yönetir. İş mantığı barındırmaz, sadece alt bileşenleri çağırır.
2. **Features Katmanı (`features/`):** İş mantığının (Business Logic) kalbidir. Sipariş hesaplamaları, katalog filtrelemeleri, admin işlemleri ve harita takibi burada domain bazlı klasörlenir.
3. **Shared Katmanı (`shared/`):** Tüm projenin kullandığı ortak tipler (`types.ts`), formatlama fonksiyonları, ve çoklu dil sözlükleri (`dictionaries.ts`) burada yer alır.

**Veri Akışı:**
Veri Supabase API üzerinden asenkron çekilir ve `CatalogContext.tsx` aracılığıyla global state'e alınır. Tüm sayfalar (`/shop`, `/food`, `/market`) bu context'i dinler. State güncellemeleri (örneğin sepete ürün ekleme) yine bu Context veya feature bazlı custom hook'lar üzerinden yönetilir.

## Mevcut Klasör Yapısı (Current)

```text
src/
├── app/                  # Next.js App Router (Sayfalar ve Rotalar)
│   ├── [locale]/         # i18n rotaları
│   └── api/              # Image upload vb. küçük uç noktalar
├── features/             # Business Logic & Modüller
│   ├── admin/            # Admin paneli bileşenleri
│   ├── catalog/          # Mağaza listeleme, Context ve Layout
│   ├── order/            # Sepet hesaplamaları (cart.ts)
│   └── tracking/         # Harita ve Kurye takibi
└── shared/               # Ortak tipler ve araçlar
    ├── i18n/
    └── lib/
```

## İdeal Klasör Yapısı (Önerilen FSD Yaklaşımı)

İlerleyen aşamalarda projeyi daha net bir Feature-Sliced Design (FSD) standardına getirmek için yapı aşağıdaki formata evrilmelidir:

```text
src/
├── app/                    # Sadece App Router ve Global Providers
├── pages/                  # Sayfa bileşenlerinin kendisi (Composition layer)
├── widgets/                # Birden fazla feature'ı birleştiren bloklar (Örn: Header, CartFooter)
├── features/               # Kullanıcı aksiyonları (Örn: AddToCart, FilterStores, AdminEditStore)
├── entities/               # İş nesneleri ve onlara ait UI/Logik (Örn: StoreCard, ProductItem, OrderTimeline)
└── shared/                 # Her yerde kullanılan, iş mantığı içermeyen kodlar
    ├── ui/                 # Reusable UI componentleri (Button, Modal, Input)
    ├── lib/                # Yardımcı fonksiyonlar (formatMoney, uid)
    ├── api/                # Base API client (gelecekte)
    └── config/             # i18n, sabitler (constants)
```

**Neden Böyle Olmalı?**
- **Ayrıştırma (Decoupling):** Şu an UI bileşenleri ve iş mantığı `features` altında iç içe girmiş durumda. Entities ve Features katmanlarına bölmek, örneğin bir `StoreCard` bileşenini (Entity) sepete ekleme mantığından (Feature) ayırmayı sağlar.
- **Yeniden Kullanılabilirlik (Reusability):** Tüm genel geçer UI bileşenleri `shared/ui` altına toplanarak farklı projelerde veya sayfalarda direkt kullanılabilir hale gelir.
- **Ölçeklenebilirlik:** Projeye yeni bir domain (örneğin "Kullanıcı Profili" veya "Ödeme Sistemleri") eklendiğinde nereye konacağı FSD sayesinde nettir.
