# Project Overview

## Projenin Amacı
DoppApp, kullanıcıların hayali mağazalar, restoranlar ve marketler üzerinden sipariş deneyimini baştan uca yaşayabilecekleri, çoklu dil (Türkçe/İngilizce) destekli bir e-ticaret/yemek sipariş simülasyonudur. Projenin ana hedefi, gerçek bir ödeme veya teslimat altyapısı kurmadan sipariş verme, sepet yönetimi ve kurye takip simülasyonlarını pürüzsüz bir arayüz ile sunmaktır. Bu proje aynı zamanda ileriye dönük bir React Native dönüşümü veya gerçek bir backend entegrasyonu için "hazır bir ön yüz ve state iskeleti" görevi görmektedir.

## Kullanıcı Hedefi
Son kullanıcılar, gerçek bir e-ticaret uygulamasında bulabilecekleri şu özellikleri deneyimler:
1. İstenen kategoriye (Mağaza, Yemek, Market) göre ürün listeleme.
2. Ürün seçeneklerini (beden, ekstra malzemeler, opsiyonlar) belirleyip sepete ekleme.
3. Sepet tutarını görüntüleme ve simüle edilmiş bir ödeme ekranından geçme.
4. Leaflet tabanlı interaktif bir harita üzerinde siparişin kurye tarafından teslim edilmesini canlı olarak takip etme.

## Business Mantığı
Sistemde gerçek bir backend veya veritabanı bulunmamaktadır. 
Tüm veriler (mağazalar, siparişler, sepet, dil tercihleri) tarayıcının `localStorage` API'si üzerinden yönetilir. 
İş mantığı şu prensiplere dayanır:
- **Mağaza Çeşitliliği:** Sistem; *Shop* (elektronik, giyim), *Food* (restoranlar) ve *Market* (bakkal vb.) olmak üzere üç temel mağaza tipini destekler.
- **Dinamik Teslimat Algoritması:** Teslimat süreleri, kullanıcının seçtiği teslimat adresi ile mağazanın konumu arasındaki gerçekçi harita mesafesine (OpenStreetMap üzerinden) ve seçilen kurye hızına ("rabbit" veya "turtle") göre milisaniye cinsinden hesaplanır.
- **Kurye Simülasyonu:** Müşteri siparişi verdikten sonra kuryenin anlık lokasyonu, mağazadan adrese doğru doğrusal bir interpolasyonla (linear interpolation) saniye saniye simüle edilir ve haritada gösterilir.

## Ana Kullanım Senaryoları (Use Cases)

1. **Kategori Gezintisi:**
   Kullanıcı `/tr/shop`, `/tr/food` veya `/tr/market` rotalarına giderek sadece o kategoriye ait mağazaları listeler.

2. **Sepet ve Özelleştirme:**
   Kullanıcı bir mağazaya girip ürünü seçer. Eğer ürünün opsiyonları varsa (Örn: "Pizzanın boyutu" veya "Tişörtün bedeni") zorunlu ve opsiyonel seçimleri yapar, adedi belirler ve sepete ekler.

3. **Sipariş Takibi:**
   Sipariş oluşturulduktan sonra müşteri Tracking sayfasına yönlendirilir. Burada sipariş durumları (Onaylandı, Hazırlanıyor, Kuryede, Teslim Edildi) zaman bazlı olarak güncellenirken, kuryenin haritadaki hareketi canlı izlenir.

4. **Admin Yönetimi (`/admin`):**
   Uygulamanın bir de yerel yönetici paneli bulunur. Yöneticiler yeni mağazalar ekleyebilir, mevcut mağazaları düzenleyebilir, ürün ve opsiyon grupları oluşturabilirler. Tüm bu değişiklikler sadece yöneticinin tarayıcı önbelleğinde (`localStorage`) saklanır, ancak gelecekte bir veritabanına bağlanacak altyapıdadır.
