# DoppApp WebMCP Entegrasyonu

Bu proje, yapay zeka ajanlarının DoppApp'in temel özelliklerini kullanabilmesi için WebMCP (Model Context Protocol) entegrasyonu içermektedir.

## Mimari
WebMCP entegrasyonu, **Feature-Sliced Design (FSD)** prensiplerine uygun olarak oluşturulmuştur. 
Mevcut web uygulaması (Next.js) üzerindeki arayüz hiçbir değişikliğe uğramadan çalışmaya devam ederken; arka plandaki işlemler yapay zeka ajanları için `src/features/.../services` altındaki özel modüller (Application Services) aracılığıyla sunulmaktadır.

- **Bağlantı Türü:** HTTP / Server-Sent Events (SSE)
- **Endpoint:** `GET /api/mcp` (Bağlantı başlatma), `POST /api/mcp` (Mesaj gönderme)
- **State Yönetimi:** AI ajanları kendi bağımsız `sessionId`'lerini oluşturarak `Agent Cart Service` üzerinden tamamen sanal (in-memory) bir sepet deneyimi yaşarlar.

## Kullanılabilir Araçlar (Tools)

WebMCP sunucumuz ajanlara şu araçları (JSON-RPC) açar:

### 🛒 Katalog Araçları
- **`searchProducts`**: Mağazalardaki menü öğelerinde ve isimlerde arama yapar. (`query` string alır)
- **`getProduct`**: Belirli bir ürünün tüm detaylarını (kalori, açıklama) getirir. (`productId` alır)
- **`getCategories`**: Sistemdeki tüm mağaza kategorilerini getirir.
- **`getTrendingProducts`**: Listede öne çıkarılan/rastgele ürünleri getirir.

### 🛍 Sepet Araçları
- **`getCart`**: Belirtilen `sessionId` altındaki sepeti getirir.
- **`addToCart`**: İlgili `sessionId` için sepete bir ürün ekler. (Parametreler: `sessionId`, `storeId`, `productId`, `quantity`)
- **`updateCart`**: Sepetteki ürünün adetini günceller veya 0 ise siler.
- **`removeFromCart`**: Bir ürünü sepetten çıkarır.
- **`clearCart`**: Mevcut oturumdaki sepeti tamamen boşaltır.

### 📦 Sipariş ve Takip Araçları
- **`createOrder`**: Belirtilen `sessionId` içerisindeki mevcut sepeti kullanıp Supabase veri tabanına sipariş kaydı atar. (Geriye `orderId` ve detayları döner).
- **`trackOrder`**: Ajanlara güncel kurye durumunu JSON formatında sunar. Koordinat, tahmini teslimat süresi ve durumu (Örn: "Yolda") döner.

### 🧾 Fiş (Receipt) Araçları
- **`generateReceipt`**: İlgili sipariş (`orderId`) için oluşturulmuş görsel (imaj) linkini döner.
- **`shareReceipt`**: Siparişi sosyal medyada paylaşmak için üretilen URL'yi döner.

## Örnek Kullanım Akışı
Bir AI Ajanı, DoppApp üzerinde şu adımları izleyebilir:
1. `searchProducts` ile "Burger" araması yapar.
2. Dönen ürünler arasından birini `addToCart` ile sepete atar (Kendi oluşturduğu rastgele bir `sessionId` ile).
3. `createOrder` fonksiyonunu çağırıp sepeti siparişe dönüştürür.
4. `trackOrder` fonksiyonu ile kurye durumunu izleyebilir.
5. Kullanıcıya "Siparişiniz yola çıktı, takip edebilirsiniz." diyebilir.

*Not: Tüm bu adımlar mevcut web sitesinin yapısını bozmadan, tamamen backend (Next.js API Routes) seviyesinde işlenmektedir.*
