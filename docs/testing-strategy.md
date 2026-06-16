# Testing Strategy

DoppApp projesinde şu an itibarıyla kurulu bir test altyapısı bulunmamaktadır. Uygulamanın büyümesi ve karmaşıklaşması göz önüne alındığında, sağlam ve sürdürülebilir bir test altyapısının kurulması hayati önem taşır.

Bu doküman, projede kullanılacak test teknolojilerini, hedeflenen test kapsamlarını ve standartları belirler.

## Önerilen Test Altyapısı

Modern Next.js (App Router) projelerinde hız, verimlilik ve TypeScript uyumluluğu sebebiyle aşağıdaki stack tercih edilmiştir:
- **Test Runner:** [Vitest](https://vitest.dev/) (Jest'e kıyasla çok daha hızlı, Vite esasına dayanır ve TypeScript desteği kusursuzdur).
- **DOM Testing:** [React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro/) (Bileşenleri kullanıcı gibi test etmeyi sağlar).
- **Mocking:** `vi.mock()` ve gerekirse API katmanı için [MSW (Mock Service Worker)](https://mswjs.io/).

## Test Edilecek Ana Alanlar

1. **Kritik İş Mantığı (Business Logic):**
   - `src/features/order/cart.ts` -> `getCartTotals`, `findProduct`, `getItemUnitPrice` fonksiyonları. Sepet hesaplamaları hataya en kapalı olması gereken kısımdır.
   - `src/features/tracking/geo.ts` -> Kurye hareketlerinin doğru simüle edildiğinden emin olmak için interpolasyon hesaplamaları test edilmeli.

2. **Custom Hook'lar ve State Yönetimi:**
   - `CatalogContext.tsx` içindeki durum değişimleri, özellikle `localStorage` senkronizasyon mantığı.

3. **Bileşenler (Components):**
   - Sadece render edilip edilmediği değil, kullanıcı etkileşimleri test edilmeli (Örn: `CatalogList`'de "Ekle" butonuna basınca sepet hook'unun tetiklenmesi).
   - *Not: Harita bileşenleri (`TrackingMap`) Leaflet tabanlı olduğundan test edilmesi zordur. Bu tür 3rd party DOM manipülasyonu yapan bileşenler için Mock stratejisi izlenmelidir.*

## Birim Test (Unit Test) Kuralları

Her test yazılırken aşağıdaki kurallara kesinlikle uyulmalıdır:

1. **Tek Bir Davranış:** Her test (`it` veya `test` bloğu) sadece tek bir mantıksal davranışı test etmelidir.
2. **Davranışa Odaklanın:** İmplementasyon detayına (örneğin "state içindeki array'in 2. indexi değişti mi?") değil, kullanıcı davranışına ("Ekranda hata mesajı göründü mü?") odaklanın.
3. **Açıklayıcı İsimlendirme:** Test isimleri İngilizce (veya projede karar kılındıysa Türkçe) açıklayıcı olmalıdır.
   - *Kötü:* `it('works', ...)`
   - *İyi:* `it('should return filtered products when category changes to shop', ...)`

### Test Kapsamı (Test Cases)
Bir fonksiyon veya bileşen test edilirken şu senaryolar düşünülmelidir:
- **Happy Path:** Her şeyin yolunda gittiği standart akış.
- **Empty State:** Verinin olmadığı (Örn: Boş sepet) durumlar.
- **Error State:** Hata fırlatılması veya verinin eksik/bozuk geldiği durumlar.
- **Boundary Cases (Sınır Durumları):** Sayısal verilerde sıfır, negatif değerler veya aşırı büyük/küçük veri yükleri.

### Örnek Test Taslağı (Vitest + RTL)

```typescript
import { describe, it, expect } from 'vitest';
import { getCartTotals } from './cart';

describe('cart calculations', () => {
  it('should calculate total correctly for empty cart', () => {
    const totals = getCartTotals([], []);
    expect(totals.total).toBe(0);
  });

  it('should calculate total correctly with multiple items and options', () => {
    // Arrange (Veri hazırlığı)
    // Act (Aksiyon)
    // Assert (Doğrulama)
  });
});
```
