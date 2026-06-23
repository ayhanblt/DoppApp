# Project Overview

## Nedir?
DoppApp, **Shop (Alışveriş)**, **Food (Yemek)** ve **Market (Süpermarket)** olmak üzere 3 temel kategori altında farklı türden mağazaların sipariş ve kurye takip süreçlerini simüle eden, çift platformlu (Web + Mobil) interaktif bir deneme (sandbox) uygulamasıdır. 
Gerçek bir e-ticaret uygulaması gibi davranır ancak ödeme alınmaz; amaç baştan sona sipariş verme, kurye hızını ayarlama (Rabbit/Turtle) ve harita üzerinde gerçek zamanlı takip deneyimini yaşatmaktır.

## Temel Akış (Core Flow)
1. **Giriş ve Landing:** Kullanıcı siteye ilk girdiğinde (Web veya Mobil) "DoppApp" animasyonlu bir Landing Modal ekranı (veya tam sayfa yüklenme ekranı) ile karşılaşır. "Start Now" butonuna basarak ana akışa dahil olur.
2. **Kategori Seçimi (Shop/Food/Market):** Ana sayfa varsayılan olarak **Shop** sekmesinden başlar. Kullanıcı sekme menüsü (veya mobil tab menüsü) üzerinden Food ve Market arasında geçiş yapabilir.
3. **Adres ve Konum Belirleme:** Kullanıcı, üst menüde (veya Web'de Navbar'da) yer alan Adres Seçici üzerinden kendisine bir teslimat adresi tanımlar. "Haritadan Seç" veya "Konumumu Bul" özellikleri (Web'de AddressModal, Mobilde react-native-maps içeren bir overlay Modal) ile nokta atışı koordinat ayarlanır. **Eğer henüz bir konum seçilmemişse, harita varsayılan olarak Beşiktaş / İstanbul (lat: 41.0422, lng: 29.0060) koordinatlarından başlar.** Seçilen bu koordinata göre, çevredeki mağazaların pozisyonları dinamik olarak Supabase üzerinden çekilen veriler etrafında harmanlanır.
4. **Alışveriş ve Sepet:** İlgili mağaza tipi seçildiğinde mağazalar listelenir. Kullanıcı bir mağazaya girip ürünlerini sepete ekler (Zorunlu ve Seçmeli opsiyonlar desteklenir). Uygulamada gelişmiş bir Arama Çubuğu (Search Bar) sayesinde anlık filtreleme yapılabilir.
5. **Ödeme (Checkout):** Sepetteki ürünlerle birlikte "Checkout" ekranına gidilir. Burada kullanıcıdan kurye teslimat hızı (Rabbit = Hızlı, Turtle = Yavaş) seçmesi istenir. 
6. **Harita Takibi (Tracking):** Sipariş verildiği an, gerçek zamanlı simülasyon başlar. OSRM verileriyle hesaplanmış harita rotası üzerinde bir kurye ikonu (Kurye aracı) mağazadan kullanıcı adresine doğru seçilen hıza oranla (Rabbit = 60km/h, Turtle = 20km/h vb.) animasyonlu şekilde ilerler.

## Platform Özeti
- **Web (`src/`):** Arama Çubuğu, Adres Seçimi, Hamburger Menü (Dropdown ile Info, Dil Değişimi, Hakkında, Geri Bildirim) özellikleri Next.js ile masaüstü/mobil web uyumlu şekilde FSD kurallarına göre tasarlanmıştır.
- **Mobile (`mobile/`):** Expo ve React Native tabanlı uygulama. Web ile eşgüdümlü olarak Expo Router alt yapısını kullanır. Üst menü (Drawer) üzerinden Info, Hakkında ve Dil Değişimi sağlanır. Haritalar `react-native-maps` ile native olarak optimize edilmiştir.

## Çoklu Dil (i18n)
Uygulama tam kapsamlı Türkçe (Tr) ve İngilizce (En) desteğine sahiptir. Sadece arayüz metinleri değil, Supabase'den gelen veriler (kategori adları, mağaza ve ürün açıklamaları) de kullanıcının seçtiği dile göre dinamik olarak basılır (`name_tr`, `name_en` vb.).

## Admin Paneli (Web Only)
Uygulamanın `/admin` rotasında web tabanlı bir yönetim paneli yer alır.
Bu panelden:
- Yeni Mağaza, Kategori, Ürün ve Ürün Opsiyonları (Seçenek Grupları) eklenebilir.
- Çok dilli giriş desteği mevcuttur (Sekmeli arayüz ile Türkçe ve İngilizce formlar).
- Zengin metin (Markdown) ile açıklama yazılabilir.
- Restoranların kendi içlerindeki ürün gruplarına özel isim (Section Label) ataması yapılabilir (Örn: "Soğuk İçecekler").
