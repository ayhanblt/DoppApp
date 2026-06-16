<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DoppApp - AI Agent Operations Manual

Bu doküman, projede kod yazacak tüm AI kodlama asistanlarının uyması gereken katı mimari kuralları ve standartları belirler.

## Projenin Amacı ve Özellikleri
- Supabase tabanlı PostgreSQL veritabanı ve Storage kullanan çoklu kategorili (Shop, Food, Market) e-ticaret/kurye takip simülasyonu.
- Çoklu dil (i18n) desteğine sahiptir (Tr/En).

## Klasör Yapısı (Feature-Sliced Design - FSD)
Projeye yeni bir özellik ekleneceğinde FSD prensiplerine sadık kalınmalıdır:
- **`app/`**: Sadece rota (URL) tanımlamaları ve layoutlar bulunur. İş mantığı burada yazılmaz.
- **`features/`**: Domain bazlı iş mantığı (Örn: `catalog`, `admin`, `order`, `tracking`). Her feature sadece kendi scope'undan sorumludur.
- **`shared/`**: Uygulama genelinde paylaşılan her şey (`types.ts`, `dictionaries.ts`, helper fonksiyonları).

## Kod Yazma Standartları
- **Tip Güvenliği:** `any` kullanımı kesinlikle yasaktır. Her zaman `src/shared/lib/types.ts` içerisindeki veya yeni tanımlanmış kesin TypeScript tiplerini kullanın.
- **React Hook'ları:** Mümkün olduğunca custom hook'lar oluşturarak bileşen içindeki state karmaşasını engelleyin.
- **Bileşen Boyutu:** Bir bileşen 200 satırı aşıyorsa, onu daha küçük mantıksal alt bileşenlere bölmeye çalışın.

## State Yönetimi
- Projede Redux, MobX, Zustand gibi harici state yönetim kütüphaneleri KULLANILMAYACAKTIR.
- Global arayüz state işlemleri için `CatalogContext.tsx` yapısını koruyun veya benzer native React Context'leri kullanın.

## Error Handling ve Validation
- Hata yönetimi için fırlatılacak hatalar mutlaka yakalanmalı (`try/catch`) ve UI katmanında kullanıcıya dostane bir dille (i18n üzerinden) gösterilmelidir.
- Veri validasyonları için ileride `zod` eklenecektir, şimdilik manuel tip kontrollerini sıkı tutun.

## Naming Convention (İsimlendirme)
- **Dosyalar:** React bileşenleri `PascalCase` (Örn: `TrackingMap.tsx`), yardımcı fonksiyonlar ve hook'lar `camelCase` (Örn: `useImageCache.ts`, `geo.ts`).
- **Değişkenler:** Anlaşılır ve uzun isimler kullanın. `arr`, `obj`, `data` gibi jenerik isimlerden kaçının. (Örn: `filteredStores` kullanın).

## Test Yazma Kuralları
- Test framework'ü olarak **Vitest + React Testing Library (RTL)** kullanılmaktadır.
- Yeni bir fonksiyon veya karmaşık UI bileşeni eklerken mutlaka `*.test.ts` veya `*.test.tsx` dosyasını oluşturun.
- Birim testler "Arrange-Act-Assert" şablonunda yazılmalı ve "Happy Path" dışında sınır/hata (Boundary/Error) durumlarını kapsamalıdır.

## Review Checklist (Kod Yazdıktan Sonra Kontrol Edilecekler)
- [ ] Yeni metin eklendiyse `dictionaries.ts` dosyasına hem Türkçe hem İngilizce çevirisi yapıldı mı?
- [ ] Bileşene özgü CSS ihtiyacı varsa Tailwind class'ları kullanıldı mı? (Custom CSS/SCSS yazmayın).
- [ ] Harita tabanlı (`leaflet`) bir kütüphane eklendiyse SSR hatalarını önlemek için `dynamic(..., { ssr: false })` kullanıldı mı?
- [ ] `tsc --noEmit` çalıştırıldığında tip hatası alınıyor mu?
- [ ] Eklenen iş mantığı (business logic) için bir test senaryosu düşünüldü mü?

## Delivery Timeline Configuration
Sipariş statü geçişleri ve kurye hareket süreleri `DELIVERY_CONFIG` içinde yönetilir (`src/features/catalog/appConfig.ts` veya ilgili dosya).
Kurye hızı hesaplaması: `baseMs + (distanceKm × kmMultiplierMs)`.
Bu süreler güncellendiğinde animasyonlar otomatik olarak senkronize olur.
