import type { Restaurant } from "@/shared/lib/types";
import { coordinateDistanceKm, offsetCoordinate, snapCoordinateToRoad } from "@/features/tracking/geo";

export const defaultOptionGroups = [
  {
    id: "spice",
    label: { tr: "Lezzet seçimi", en: "Flavor" },
    required: true,
    options: [
      { id: "mild", label: { tr: "Sade", en: "Mild" }, priceDelta: 0 },
      { id: "normal", label: { tr: "Orta", en: "Regular" }, priceDelta: 0 },
      { id: "hot", label: { tr: "Acılı", en: "Spicy" }, priceDelta: 0 }
    ]
  },
  {
    id: "size",
    label: { tr: "Boyut", en: "Size" },
    options: [
      { id: "small", label: { tr: "Küçük", en: "Small" }, priceDelta: -30 },
      { id: "regular", label: { tr: "Normal", en: "Regular" }, priceDelta: 0 },
      { id: "large", label: { tr: "Büyük", en: "Large" }, priceDelta: 45 }
    ]
  },
  {
    id: "extras",
    label: { tr: "Ek ürünler", en: "Extras" },
    multiple: true,
    options: [
      { id: "cheese", label: { tr: "Peynir sos", en: "Cheese sauce" }, priceDelta: 35 },
      { id: "drink", label: { tr: "İçecek ekle", en: "Add drink" }, priceDelta: 45 }
    ]
  }
];

const img = (name: string) => `/images/menu/${name}`;

export const seedRestaurants: Restaurant[] = [
  {
    id: "chicken-bite",
    name: { tr: "Tek Lokma Tavuk", en: "One Bite Chicken" },
    category: { tr: "Tavuk", en: "Chicken" },
    emoji: "🍗",
    badge: { tr: "Popüler", en: "Popular" },
    rating: 4.9,
    reviews: 2847,
    eta: "25-35",
    deliveryFee: 75,
    coordinate: [41.0422, 29.0094],
    menu: [
      { id: "crispy-half", name: { tr: "Çıtır Yarım Yarım Tavuk", en: "Crispy Half & Half Chicken" }, description: { tr: "Sade ve soslu çift lezzet", en: "Plain and sauced double flavor" }, price: 650, calories: 1800, image: img("c1.png"), optionGroups: defaultOptionGroups },
      { id: "soy-boneless", name: { tr: "Kemiksiz Soya Tavuk", en: "Boneless Soy Chicken" }, description: { tr: "Tatlı tuzlu imza sos", en: "Sweet-savory signature sauce" }, price: 590, calories: 1650, image: img("c2.png"), optionGroups: defaultOptionGroups },
      { id: "cheese-balls", name: { tr: "5'li Peynir Topu", en: "Cheese Balls 5 pcs" }, description: { tr: "Dışı çıtır içi yumuşak", en: "Crisp outside, soft inside" }, price: 135, calories: 320, image: img("c3.png") }
    ]
  },
  {
    id: "tokyo-ramen",
    name: { tr: "Tokyo Ramen İstasyonu", en: "Tokyo Ramen Station" },
    category: { tr: "Japon", en: "Japanese" },
    emoji: "🍜",
    badge: { tr: "Önerilen", en: "Featured" },
    rating: 4.8,
    reviews: 1523,
    eta: "18-28",
    deliveryFee: 95,
    coordinate: [41.0369, 28.9851],
    menu: [
      { id: "tonkotsu", name: { tr: "Tonkotsu Ramen", en: "Tonkotsu Ramen" }, description: { tr: "12 saat kaynamış yoğun et suyu", en: "Rich broth simmered for 12 hours" }, price: 330, calories: 750, image: img("r1.png"), optionGroups: defaultOptionGroups },
      { id: "miso", name: { tr: "Acılı Miso Ramen", en: "Spicy Miso Ramen" }, description: { tr: "Baharatlı miso tabanı", en: "Spicy miso base" }, price: 360, calories: 820, image: img("r2.png"), optionGroups: defaultOptionGroups },
      { id: "karaage", name: { tr: "Karaage", en: "Karaage" }, description: { tr: "6 parça çıtır tavuk", en: "Six crispy chicken bites" }, price: 195, calories: 480, image: img("r3.png"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "pasta-lab",
    name: { tr: "PastaLab Mutfak", en: "PastaLab Kitchen" },
    category: { tr: "İtalyan", en: "Italian" },
    emoji: "🍝",
    rating: 4.7,
    reviews: 983,
    eta: "30-40",
    deliveryFee: 85,
    coordinate: [41.0281, 29.0245],
    menu: [
      { id: "rose-shrimp", name: { tr: "Karidesli Rose Makarna", en: "Shrimp Rose Pasta" }, description: { tr: "Yumuşak rose sos", en: "Creamy rose sauce" }, price: 445, calories: 680, image: img("p1.png"), optionGroups: defaultOptionGroups },
      { id: "vongole", name: { tr: "Vongole Yağlı Makarna", en: "Vongole Oil Pasta" }, description: { tr: "Deniz kokulu hafif tabak", en: "Light coastal plate" }, price: 415, calories: 620, image: img("p2.jpg"), optionGroups: defaultOptionGroups },
      { id: "garlic", name: { tr: "Sarımsaklı Ekmek", en: "Garlic Bread" }, description: { tr: "Tereyağlı kızarmış ekmek", en: "Buttery toasted bread" }, price: 120, calories: 280, image: img("p3.jpg") }
    ]
  },
  {
    id: "green-poke",
    name: { tr: "Green Poke House", en: "Green Poke House" },
    category: { tr: "Salata", en: "Salad" },
    emoji: "🥗",
    badge: { tr: "Yeni", en: "New" },
    rating: 4.9,
    reviews: 1205,
    eta: "15-25",
    deliveryFee: 55,
    coordinate: [41.0642, 29.0098],
    menu: [
      { id: "salmon-poke", name: { tr: "Somon Poke Bowl", en: "Salmon Poke Bowl" }, description: { tr: "Somon, avokado ve taze yeşillik", en: "Salmon, avocado, fresh greens" }, price: 405, calories: 520, image: img("g1.jpg"), optionGroups: defaultOptionGroups },
      { id: "chicken-poke", name: { tr: "Tavuklu Poke Bowl", en: "Chicken Poke Bowl" }, description: { tr: "Protein dolu hafif öğün", en: "A protein-rich light meal" }, price: 355, calories: 430, image: img("g2.jpg"), optionGroups: defaultOptionGroups },
      { id: "mango-yogurt", name: { tr: "Mango Yoğurt", en: "Mango Yogurt" }, description: { tr: "Ferah tatlı kapanış", en: "A bright dessert finish" }, price: 145, calories: 180, image: img("g3.jpg") }
    ]
  },
  {
    id: "mom-kitchen",
    name: { tr: "Anne Eli Lokantası", en: "Mom's Korean Kitchen" },
    category: { tr: "Ev yemeği", en: "Home cooking" },
    emoji: "🍚",
    badge: { tr: "Popüler", en: "Popular" },
    rating: 4.8,
    reviews: 3102,
    eta: "20-30",
    deliveryFee: 65,
    coordinate: [41.0155, 28.9796],
    menu: [
      { id: "kimchi", name: { tr: "Kimchi Güveç", en: "Kimchi Stew" }, description: { tr: "Derin, ekşi ve sıcak", en: "Deep, tangy, and warm" }, price: 285, calories: 550, image: img("h1.jpg"), optionGroups: defaultOptionGroups },
      { id: "bibimbap", name: { tr: "Taş Kase Bibimbap", en: "Stone Bowl Bibimbap" }, description: { tr: "Çıtır pirinç tabanı", en: "Crispy rice base" }, price: 330, calories: 620, image: img("h2.jpg"), optionGroups: defaultOptionGroups },
      { id: "pork-set", name: { tr: "Baharatlı Et Seti", en: "Spicy Stir-fry Set" }, description: { tr: "Acı tatlı doyurucu set", en: "Sweet-spicy hearty set" }, price: 360, calories: 700, image: img("h3.jpg"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "burger-factory",
    name: { tr: "Burger Factory", en: "Burger Factory" },
    category: { tr: "Burger", en: "Burger" },
    emoji: "🍔",
    rating: 4.6,
    reviews: 1760,
    eta: "16-26",
    deliveryFee: 80,
    coordinate: [41.0521, 28.9923],
    menu: [
      { id: "smash", name: { tr: "Smash Burger", en: "Smash Burger" }, description: { tr: "Çift köfte ve eritilmiş cheddar", en: "Double patty and melted cheddar" }, price: 390, calories: 920, image: img("bg1.jpg"), optionGroups: defaultOptionGroups },
      { id: "fries", name: { tr: "Trüflü Patates", en: "Truffle Fries" }, description: { tr: "İnce çıtır patates", en: "Thin crispy fries" }, price: 150, calories: 510, image: img("bg2.jpg") },
      { id: "shake", name: { tr: "Vanilyalı Shake", en: "Vanilla Shake" }, description: { tr: "Soğuk ve yoğun", en: "Cold and thick" }, price: 170, calories: 430, image: img("bg3.jpg") }
    ]
  },
  {
    id: "dragon-china",
    name: { tr: "Dragon China", en: "Dragon China" },
    category: { tr: "Çin", en: "Chinese" },
    emoji: "🥡",
    rating: 4.6,
    reviews: 1876,
    eta: "22-32",
    deliveryFee: 90,
    coordinate: [41.0214, 29.0041],
    menu: [
      { id: "noodle", name: { tr: "Soya Soslu Noodle", en: "Soy Sauce Noodles" }, description: { tr: "Wok ateşinde sebzeli noodle", en: "Wok-fired vegetable noodles" }, price: 225, calories: 680, image: img("cn1.jpg"), optionGroups: defaultOptionGroups },
      { id: "sweet-sour", name: { tr: "Tatlı Ekşi Tavuk", en: "Sweet Sour Chicken" }, description: { tr: "Çıtır kaplama ve parlak sos", en: "Crispy coating and glossy sauce" }, price: 570, calories: 1200, image: img("cn2.jpg"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "spicy-tteok",
    name: { tr: "Acı Tatlı Tteokbokki", en: "Spicy Sweet Tteokbokki" },
    category: { tr: "Sokak lezzeti", en: "Street food" },
    emoji: "🧡",
    badge: { tr: "Uygun teslimat", en: "Low fee" },
    rating: 4.5,
    reviews: 4521,
    eta: "12-20",
    deliveryFee: 45,
    coordinate: [41.0316, 29.0162],
    menu: [
      { id: "rose-tteok", name: { tr: "Rose Tteokbokki", en: "Rose Tteokbokki" }, description: { tr: "Kremalı baharatlı pirinç keki", en: "Creamy spicy rice cakes" }, price: 240, calories: 580, image: img("b1.jpg"), optionGroups: defaultOptionGroups },
      { id: "fried-set", name: { tr: "Karışık Kızartma", en: "Mixed Fry Set" }, description: { tr: "Sebze, karides ve çıtır rulolar", en: "Vegetable, shrimp, and crispy rolls" }, price: 135, calories: 380, image: img("b3.jpg"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "sweet-roastery",
    name: { tr: "Tatlı Roastery", en: "Sweet Roastery" },
    category: { tr: "Kafe", en: "Cafe" },
    emoji: "☕",
    badge: { tr: "Önerilen", en: "Featured" },
    rating: 4.7,
    reviews: 2234,
    eta: "10-18",
    deliveryFee: 75,
    coordinate: [41.0436, 28.9821],
    menu: [
      { id: "americano", name: { tr: "Buzlu Americano", en: "Iced Americano" }, description: { tr: "Düşük asiditeli harman", en: "Low-acid house blend" }, price: 135, calories: 10, image: img("cf1.jpg"), optionGroups: defaultOptionGroups },
      { id: "strawberry-cake", name: { tr: "Çilekli Pasta", en: "Strawberry Cream Cake" }, description: { tr: "İki kat yumuşak kek", en: "Soft two-layer sponge" }, price: 235, calories: 450, image: img("cf2.jpg"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "mala-house",
    name: { tr: "Mala Hong", en: "Mala Hong" },
    category: { tr: "Mala", en: "Mala" },
    emoji: "🌶️",
    badge: { tr: "Popüler", en: "Popular" },
    rating: 4.6,
    reviews: 1654,
    eta: "20-30",
    deliveryFee: 85,
    coordinate: [41.0572, 29.0305],
    menu: [
      { id: "mala-tang", name: { tr: "Mala Tang", en: "Mala Tang" }, description: { tr: "Kendi malzemeni seçtiğin acı çorba", en: "Spicy soup with chosen ingredients" }, price: 390, calories: 750, image: img("ml1.jpg"), optionGroups: defaultOptionGroups },
      { id: "mala-xiang", name: { tr: "Mala Xiang Guo", en: "Mala Xiang Guo" }, description: { tr: "Tavada yoğun baharat", en: "Stir-fried deep spice" }, price: 480, calories: 920, image: img("ml2.jpg"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "delicious-dessert",
    name: { tr: "Delicious Dessert", en: "Delicious Dessert" },
    category: { tr: "Dondurma", en: "Ice cream" },
    emoji: "🍦",
    badge: { tr: "Yeni", en: "New" },
    rating: 4.8,
    reviews: 987,
    eta: "8-15",
    deliveryFee: 60,
    coordinate: [41.0244, 28.9742],
    menu: [
      { id: "pint", name: { tr: "Pint Dondurma", en: "Ice Cream Pint" }, description: { tr: "İki lezzet seçilebilir", en: "Choose two flavors" }, price: 270, calories: 520, image: img("ic1.jpg"), optionGroups: defaultOptionGroups },
      { id: "ice-cake", name: { tr: "Dondurma Pastası", en: "Ice Cream Cake" }, description: { tr: "Çikolata ve vanilya katları", en: "Chocolate and vanilla layers" }, price: 780, calories: 1200, image: img("ic2.jpg"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "pretty-gopchang",
    name: { tr: "Şık Gopchang", en: "Pretty Gopchang" },
    category: { tr: "Izgara", en: "Grill" },
    emoji: "🔥",
    badge: { tr: "Popüler", en: "Popular" },
    rating: 4.8,
    reviews: 1342,
    eta: "25-35",
    deliveryFee: 60,
    coordinate: [41.0491, 29.0418],
    menu: [
      { id: "veg-gop", name: { tr: "Sebzeli Gopchang", en: "Vegetable Gopchang" }, description: { tr: "Sebzeli sıcak tava", en: "Hot pan with vegetables" }, price: 420, calories: 420, image: img("gp1.jpg"), optionGroups: defaultOptionGroups },
      { id: "makchang", name: { tr: "Baharatlı Makchang", en: "Spicy Makchang" }, description: { tr: "Tatlı acı ızgara", en: "Sweet-spicy grill" }, price: 450, calories: 510, image: img("gp3.jpg"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "sushi-hiro",
    name: { tr: "Sushi Hiro", en: "Sushi Hiro" },
    category: { tr: "Sushi", en: "Sushi" },
    emoji: "🍣",
    badge: { tr: "Önerilen", en: "Featured" },
    rating: 4.9,
    reviews: 2105,
    eta: "20-30",
    deliveryFee: 90,
    coordinate: [41.0391, 29.0441],
    menu: [
      { id: "sushi-mix", name: { tr: "10'lu Karışık Sushi", en: "Mixed Sushi 10 pcs" }, description: { tr: "Somon, ton balığı ve levrek", en: "Salmon, tuna, and sea bass" }, price: 570, calories: 650, image: "/images/menu/sushi-mix.jpg", optionGroups: defaultOptionGroups },
      { id: "salmon-sushi", name: { tr: "6'lı Somon Sushi", en: "Salmon Sushi 6 pcs" }, description: { tr: "Kalın kesim taze somon", en: "Thick-cut fresh salmon" }, price: 390, calories: 380, image: "/images/menu/salmon-sushi.jpg", optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "yup-tteok",
    name: { tr: "Yup Tteok", en: "Yup Tteok" },
    category: { tr: "Kore atıştırmalık", en: "Korean snack" },
    emoji: "🌶️",
    badge: { tr: "Popüler", en: "Popular" },
    rating: 4.7,
    reviews: 3210,
    eta: "15-25",
    deliveryFee: 60,
    coordinate: [41.0268, 29.0347],
    menu: [
      { id: "single-tteok", name: { tr: "Tek Kişilik Tteokbokki", en: "Single Tteokbokki" }, description: { tr: "Bağımlılık yapan acı tatlı sos", en: "Addictive sweet-spicy sauce" }, price: 300, calories: 620, image: img("b1.jpg"), optionGroups: defaultOptionGroups },
      { id: "kimbap", name: { tr: "Ton Balıklı Kimbap", en: "Tuna Kimbap" }, description: { tr: "İki rulo doyurucu kimbap", en: "Two filling kimbap rolls" }, price: 165, calories: 420, image: img("b2.jpg") }
    ]
  },
  {
    id: "pizza-lab",
    name: { tr: "Taş Fırın PizzaLab", en: "Stone Oven PizzaLab" },
    category: { tr: "Pizza", en: "Pizza" },
    emoji: "🍕",
    rating: 4.7,
    reviews: 1164,
    eta: "25-38",
    deliveryFee: 80,
    coordinate: [41.0705, 29.0229],
    menu: [
      { id: "margherita", name: { tr: "Margherita", en: "Margherita" }, description: { tr: "Fesleğen, mozzarella, domates", en: "Basil, mozzarella, tomato" }, price: 360, calories: 840, image: "/images/menu/margherita.jpg", optionGroups: defaultOptionGroups },
      { id: "pepperoni", name: { tr: "Pepperoni Pizza", en: "Pepperoni Pizza" }, description: { tr: "İnce hamur, bol pepperoni", en: "Thin crust, lots of pepperoni" }, price: 430, calories: 980, image: "/images/menu/pepperoni.jpg", optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "tako-king",
    name: { tr: "Takoyaki Kralı", en: "Takoyaki King" },
    category: { tr: "Japon sokak", en: "Japanese street" },
    emoji: "🐙",
    rating: 4.6,
    reviews: 872,
    eta: "12-22",
    deliveryFee: 50,
    coordinate: [41.0615, 28.9978],
    menu: [
      { id: "takoyaki", name: { tr: "8'li Takoyaki", en: "Takoyaki 8 pcs" }, description: { tr: "Bol soslu ahtapot topları", en: "Saucy octopus balls" }, price: 250, calories: 490, image: "/images/menu/takoyaki.jpg", optionGroups: defaultOptionGroups },
      { id: "yakisoba", name: { tr: "Yakisoba", en: "Yakisoba" }, description: { tr: "Sebzeli kızarmış noodle", en: "Vegetable fried noodles" }, price: 285, calories: 610, image: img("cn1.jpg"), optionGroups: defaultOptionGroups }
    ]
  },
  {
    id: "bingsu-24",
    name: { tr: "Bingsu 24", en: "Bingsu 24" },
    category: { tr: "Tatlı", en: "Dessert" },
    emoji: "🍧",
    rating: 4.8,
    reviews: 744,
    eta: "10-18",
    deliveryFee: 55,
    coordinate: [41.0333, 29.0504],
    menu: [
      { id: "mango-bingsu", name: { tr: "Mango Bingsu", en: "Mango Bingsu" }, description: { tr: "İnce buz, mango ve süt kreması", en: "Shaved ice, mango, milk cream" }, price: 320, calories: 540, image: "/images/menu/mango-bingsu.jpg", optionGroups: defaultOptionGroups },
      { id: "redbean", name: { tr: "Kırmızı Fasulye Bingsu", en: "Red Bean Bingsu" }, description: { tr: "Klasik soğuk Kore tatlısı", en: "Classic cold Korean dessert" }, price: 290, calories: 510, image: img("ic1.jpg"), optionGroups: defaultOptionGroups }
    ]
  }
];

export function getStoredRestaurants() {
  if (typeof window === "undefined") return seedRestaurants;
  const raw = window.localStorage.getItem("doppapp-restaurants");
  if (!raw) return seedRestaurants;
  try {
    return JSON.parse(raw) as Restaurant[];
  } catch {
    return seedRestaurants;
  }
}

function restaurantSeed(id: string) {
  return id.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function getRestaurantsAroundAddress(center: [number, number]) {
  return getStoredRestaurants().map((restaurant, index) => {
    const seed = restaurantSeed(restaurant.id);
    const distanceKm = 0.5 + ((seed * 37 + index * 53) % 450) / 100;
    const bearing = (seed * 29 + index * 47) % 360;

    return {
      ...restaurant,
      coordinate: offsetCoordinate(center, distanceKm, bearing)
    };
  });
}

export async function getRestaurantsOnRoadsAroundAddress(center: [number, number]) {
  const candidates = getRestaurantsAroundAddress(center);
  const snapped = await Promise.all(
    candidates.map(async (restaurant) => {
      const roadCoordinate = await snapCoordinateToRoad(restaurant.coordinate).catch(() => null);
      if (!roadCoordinate) return restaurant;

      const distanceKm = coordinateDistanceKm(center, roadCoordinate);
      if (distanceKm < 0.5 || distanceKm > 5) return restaurant;

      return {
        ...restaurant,
        coordinate: roadCoordinate
      };
    })
  );

  return snapped;
}
