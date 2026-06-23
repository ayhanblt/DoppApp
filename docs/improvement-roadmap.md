# Improvement Roadmap & Technical Debt

Projenin analizi sonucunda tespit edilen mimari problemler, eksiklikler ve teknik borçlar (technical debt) bu dokümanda öncelik sırasına göre listelenmiştir.

## Tamamlanan Kilometre Taşları (Completed Milestones)

- **Web-Mobil Özellik Senkronizasyonu (100% Parity):**
  - **Mağaza Detay Sayfası (`app/store/[id].tsx`):** Yatay filtreleme barları, ürün kartları, modal detay entegrasyonu ve Supabase bazlı yorum yapma & yorum listeleme özellikleri mobil uygulamaya taşındı.
  - **Sepet Kaydet / Geri Yükle:** Mobil cihazlarda sepet durumunun AsyncStorage ile kaydedilip geri yüklenmesi sağlandı.
  - **Dinamik Dil Senkronizasyonu:** Sepet, checkout ve tracking ekranlarında dinamik locale takibi ve i18n sözlük entegrasyonu sağlandı.
  - **Hafif Markdown Çözümü:** Native kütüphanelere bağımlılık eklemeden hafif `MarkdownText` bileşeni ile ürün detaylarının zengin formatta gösterilmesi sağlandı.
  - **Tüm Proje Tip Güvenliği:** Mobil uygulamanın tsc derlemesi sıfır hata/uyarı ile tamamlandı.

## Teknik Borçlar (Technical Debt)

- **Test Eksikliği:** Projede hiçbir birim (unit), entegrasyon veya E2E test bulunmamaktadır. İş mantığındaki küçük bir değişiklik beklenmedik hatalara yol açabilir.

- **Admin Paneli Kod Tekrarı (Duplication):** `EditStoreModal` ve `EditProductsModal` içindeki form yapıları ve doğrulama mantıkları birbirine çok benzemesine rağmen ayrı ayrı yazılmıştır. Gelecekte Form kütüphaneleri (react-hook-form) kullanılarak standardize edilmelidir.
- **Harita Bileşeni SSR Problemleri:** `react-leaflet` kütüphanesi server tarafında çalışmadığı için `next/dynamic` ile client tarafına itilmektedir. Bu doğru bir yaklaşım olsa da yükleme (loading) durumlarında skeleton UI gösterilmemesi kullanıcı deneyimini zayıflatmaktadır.

---

## Geliştirme Yol Haritası (Roadmap)

### P0: Kritik (Hemen Yapılması Gerekenler)
1. **Test Altyapısının Kurulması:** 
   - Vitest ve React Testing Library (RTL) entegrasyonunun projeye dahil edilmesi.
   - `cart.ts` ve `geo.ts` gibi kritik yardımcı fonksiyonlara unit test yazılması.

### P1: Önemli (Kısa-Orta Vadede Yapılması Gerekenler)
1. **Form Yönetimi ve Validasyon:**
   - Admin panelindeki form işlemlerinin `react-hook-form` ve `zod` kullanılarak daha güvenli ve okunaklı hale getirilmesi.
2. **Feature-Sliced Design (FSD) Optimizasyonu:**
   - `docs/architecture.md` dosyasında önerilen şekilde UI bileşenlerinin `shared/ui` altına ve domain spesifik bileşenlerin `entities/` altına taşınarak dizin yapısının temizlenmesi.
3. **Harita Skeleton Ekranları:**
   - `next/dynamic` ile yüklenen harita bileşenleri (TrackingMap, AddressPickerMap) yüklenirken ekranda boşluk yerine "Harita Yükleniyor..." iskeleti (skeleton) gösterilmesi.

### P2: İyileştirme (Orta-Uzun Vadeli Vizyon)
2. **Kimlik Doğrulama (Authentication):**
   - Şu anda `admin` / `1234` şeklinde olan güvensiz yapının, NextAuth.js veya Firebase Auth ile güvenli bir yetkilendirme (authorization) sistemine dönüştürülmesi.
3. **E2E Testler:**
   - Ana kullanıcı akışının (müşterinin siteye girmesi, adres seçmesi, sepete ürün eklemesi ve siparişi tamamlaması) Cypress veya Playwright kullanılarak uçtan uca test edilmesi.

