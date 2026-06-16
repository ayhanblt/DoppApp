# DoppApp - Claude Code Optimization Guide

Bu dosya, Claude Code veya benzeri otonom yapay zeka araçlarının projeyi anlarken ve kod üretirken kullanacağı spesifik bağlamı (context) ve kuralları içerir.

## Project Context
DoppApp, çoklu kategori (Giyim, Elektronik, Restoran, Market) destekleyen, kurgusal bir e-ticaret ve kurye takip simülasyonudur. Projenin gerçek bir veritabanı veya ödeme altyapısı yoktur; tüm kalıcı veriler (persistence) tarayıcının `localStorage` API'si ile sağlanır. Kullanıcı bir ürün seçer, seçeneklerini belirler, sepete atar ve siparişi onayladıktan sonra haritada sanal bir kurye teslimatını izler. 

## Development Rules (Claude İçin Kod Yazma Kuralları)
Claude kod üretirken veya refactor yaparken aşağıdaki kurallara harfiyen uymalıdır:
- **Önce Mevcut Patternleri İncele:** Projeye yeni bir bileşen veya logic eklerken, `CatalogContext.tsx` gibi mevcut state yapılarına ve FSD (Feature-Sliced Design) klasör yapısına uygun hareket et.
- **Gereksiz Abstraction (Soyutlama) Yasak:** Henüz ihtiyaç duyulmayan karmaşık tasarımlardan, generic fonksiyonlardan veya over-engineering'den kaçın. Basit ve doğrudan çözümler üret.
- **Clean Code:** Bileşenleri küçük ve tekrar kullanılabilir yaz. `AdminPanel.tsx` gibi şişmiş dosyalar gördüğünde refactor etmeye meyilli ol.
- **Client-Side Heavy:** Harita (`Leaflet`) kullanan bileşenler SSR ortamında hata fırlatır. Harita veya `window` objesine ihtiyaç duyan kodları daima `next/dynamic` ile `ssr: false` bayrağını kullanarak çağır.

## Code Style
- **TypeScript:** Kesin (strict) mod aktiftir. `any` tipini KESİNLİKLE kullanma. Tüm tipleri `src/shared/lib/types.ts` dosyasından import et veya oraya ekle.
- **React:** Next.js 15 App Router ve React 19 kullanılıyor. Client mantığı gereken sayfalara/bileşenlere `"use client"` eklemeyi unutma.
- **Naming:** React bileşenleri için `PascalCase`, klasör isimleri için `kebab-case` veya `camelCase`, yardımcı fonksiyonlar için `camelCase` kullan.
- **Import Düzeni:** Önce React/Next.js bağımlılıkları, sonra 3. parti kütüphaneler (lucide-react vb.), ardından projenin kendi local modülleri (`@/` alias ile) import edilmeli.

## Before Coding Checklist (Kodlamaya Başlamadan Önce)
Herhangi bir dosyayı düzenlemeye veya yeni özellik eklemeye başlamadan önce:
1. İlgili feature/domain klasöründeki dosyaları tara (Örn: Sepet için `src/features/order/cart.ts`).
2. Kullanılan patternleri anla. `localStorage` nasıl kullanılıyor? i18n çevirileri nasıl çekiliyor?
3. Etkilenecek alanları (Impact Analysis) kontrol et.
4. Vitest + RTL tabanlı test ihtiyacını belirle.

## Testing Rules
Projeye eklenen her yeni iş mantığı için:
- Unit test KESİNLİKLE yazılmalı (`*.test.ts` formatında).
- "Arrange-Act-Assert" şablonu uygulanmalı.
- Edge case (uç durumlar) mutlaka düşünülmeli (Örn: Kurye başlangıç koordinatı ile müşteri koordinatı aynıysa?).
- `localStorage` veya Harita manipülasyonu yapan kısımlar için Mock stratejisi (örn. `vi.spyOn()`) uygulanmalı.
