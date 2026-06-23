# Design Principles & Aesthetics

## Tasarım Felsefesi (Premium & Canlı)
DoppApp, kullanıcılara "premium" bir deneyim yaşatmayı hedefler. Sıkıcı, düz formlar veya basit listelemeler (MVP hissiyatı) yerine akıcı animasyonlar ve şık bileşenler kullanılmalıdır.
- **Micro-Animations:** Tıklanan bir butonun hafifçe küçülüp büyümesi (scale effects), Modal açılışlarının ekranın ortasından veya altından yumuşakça süzülmesi (slide/fade effects), hover durumlarında ikon ve metinlerin nazik renk geçişleri yapması (transition-colors) zorunludur.
- **Glassmorphism:** Yapılabiliyorsa (özellikle arka plan bulanıklığını destekleyen native/web bileşenlerinde) üst üste binen menüler veya modal arka planları için yarı saydam (blur/backdrop-filter) etkileri kullanılmalıdır. Web'de `backdrop-blur-md` class'ları bolca yer almalıdır.
- **Zengin Renk Paleti:** Klasik düz kırmızı/yeşil yerine, özenle seçilmiş HSL veya özel HEX renkleri (Örn: `accent: #fb4824` - Canlı Turuncu, `background: #fff7ef` - Sıcak Krem) global CSS değişkenleri (`global.css`) veya `tailwind.config.js` üzerinden yönetilmelidir.

## Responsive (Duyarlı) & Çift Platform Uyumlu UI
Tasarım hem büyük ekranlı web tarayıcılarında (max-w-4xl wrapper ile ortalanmış şekilde), hem mobil web tarayıcılarında, hem de iOS/Android Native cihazlarda harika görünmelidir.

- **Web:** Desktop için Tailwind CSS breakpoint'leri (`md:`, `lg:`) kullanılarak grid yapısı, mobil için ise esnek flexbox yapısı uygulanır. Hamburger Menu (HeaderMenu) üst kısımda bulunur ve Dropdown (aşağı açılır) şekilde info, dil gibi menüleri gösterir. Arama çubuğu (Search) Header'a entegredir. Adres seçici bir Web Modal olarak açılır.
- **Mobile (React Native):** NativeWind v4 kullanılarak mobil cihazlara özgü `<View>`, `<Text>` ve `react-native-safe-area-context` ile çalışılır. Çentik (Notch/Dynamic Island) altına tam oturması sağlanır. Yan menü (Drawer navigation) web'deki hamburger menünün karşılığı olarak ekranın kenarından kayarak gelir. Adres seçici, mobilin doğasına uygun bir şekilde tam ekran veya `react-native-maps` içeren büyük bir Native Modal olarak çıkarılır.

## NativeWind v4 & Mobil Stil Kuralları (Önemli!)
Mobil tarafta tasarım yaparken NativeWind v4 ile ilgili aşağıdaki sınırlamalara ve kurallara kesinlikle uyulmalıdır:
1. **Dinamik Sınıf Sınırlamaları:** Sınıf adlarının dinamik olarak birleştirilmesi (Örn: `className={`text-${color}`}`) NativeWind v4 runtime derleyicisinde stil çözümlenememesi veya çökmelere yol açabilir. Sınıf adları her zaman statik dizgiler halinde olmalı veya tüm koşullar inline üçlü işleçler ile (`condition ? 'text-orange-500' : 'text-zinc-500'`) açıkça yazılmalıdır.
2. **CSS Değişkenleri:** CSS değişkenleri (`var(--accent)`) Native Modal sınırlarını geçemediğinden, `tailwind.config.js` içinde `theme.colors` alanı statik HEX kodları ile (`#fb4824` vb.) ayarlanmalıdır.
3. **Gölge ve Opaklık Sınıfları:** `shadow` veya `opacity` gibi efektler dinamik NativeWind sınıflarıyla birleştiğinde `react-native-css-interop` tarafında "Couldn't find a navigation context" gibi dolaylı Expo Router hatalarına sebep olabilmektedir. Bu gibi kritik arayüzlerde (Örn: Tab Bar, Butonlar) inline stiller (`style={{ opacity: active ? 1 : 0.5 }}`) tercih edilmelidir.

## Görsel Formatları ve Modal Davranışları
- Tüm küçük ikonik görseller ve listeleme görselleri (Product Image, Store Logo) mutlaka "Aspect Square (1:1)" formatında, "Object Cover" özelliğiyle tam kareye oturtulmalıdır. `object-contain` kullanılması yasaktır. Mobilde de `aspect-square object-cover` class'ı uygulanır.
- Tüm Modal arayüzlerinde (Ürün detayı, Sıralama, Adres vs.) kapanma aksiyonu net ve açık olmalıdır: Hem dış alana (backdrop) tıklayarak, hem Web'de ESC tuşuna basarak hem de Modal içindeki `X` (kapat) ikonuna tıklayarak kapanabilmelidir. (Web'de AddressModal dış tıklamaları için `e.stopPropagation()` kullanılmıştır, Mobilde de `Modal` özellikleri uygun yapılandırılmalıdır.)

## Metin ve İkonografi
- Google Fonts (örneğin Inter veya Roboto) kullanılarak tipografik hiyerarşi (Başlıklar çok belirgin siyah `font-black`, alt başlıklar grimsi `text-zinc-500`) yaratılır.
- İkonlar için Web'de `lucide-react`, React Native'de `lucide-react-native` kullanılır. İkon renklerinin gri tonlarından (`text-zinc-400` veya statik `#52525b`) ziyade, hover veya aktif durumda `accent` rengine dönmesi tasarımsal olarak beklenir.
- Web'de ve Mobilde markdown içeren veriler düz metin değil, "Rich Text" olarak render edilmelidir. Mobilde bu işlem için harici ağır paketler yerine, hafif ve güvenli `MarkdownText.tsx` yardımcı bileşeni kullanılır.

