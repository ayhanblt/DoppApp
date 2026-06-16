import { createClient } from "@supabase/supabase-js";
import { uid } from "../src/shared/lib/format";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const generateLogo = (name: string) => `https://placehold.co/100x100.webp?text=${encodeURIComponent(name.split(' ')[0])}`;
const generateProductImage = (name: string) => `https://placehold.co/400x400.webp?text=${encodeURIComponent(name.split(' ').join('+'))}`;

// Base coordinates around Istanbul to spread the stores
const baseLat = 41.0422;
const baseLng = 29.0094;

function randomCoordinate(): [number, number] {
  // Add a small random offset to base coordinates
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  return [baseLat + latOffset, baseLng + lngOffset];
}

const shopStores = Array.from({ length: 10 }).map((_, i) => ({
  id: `shop-${i + 1}`,
  type: "shop" as const,
  name: { tr: `Teknoloji & Giyim ${i + 1}`, en: `Tech & Wear ${i + 1}` },
  description: { tr: "Elektronik & Giyim", en: "Electronics & Clothing" },
  category: { tr: "Alışveriş", en: "Shopping" },
  badge: { tr: "Yeni", en: "New" },
  logo: generateLogo(`Shop ${i + 1}`),
  rating: 4.5 + Math.random() * 0.5,
  reviews: Math.floor(Math.random() * 1000),
  eta: "1-2 days",
  deliveryFee: 0,
  coordinate: randomCoordinate(),
  menu: [
    {
      id: `shop-${i + 1}-clothing`,
      name: { tr: "Premium Tişört", en: "Premium T-Shirt" },
      description: { tr: "%100 Pamuklu", en: "100% Cotton" },
      price: 500 + Math.random() * 500,
      calories: 0,
      image: generateProductImage("T-Shirt"),
      optionGroups: []
    },
    {
      id: `shop-${i + 1}-watch`,
      name: { tr: "Akıllı Saat X", en: "Smart Watch X" },
      description: { tr: "Nabız, Adım, Uyku Takibi", en: "Heart Rate, Steps, Sleep Tracking" },
      price: 3000 + Math.random() * 5000,
      calories: 0,
      image: generateProductImage("Watch"),
      optionGroups: []
    },
    {
      id: `shop-${i + 1}-phone`,
      name: { tr: "iPhone 17 Pro Max", en: "iPhone 17 Pro Max" },
      description: { tr: "256GB, Titanium", en: "256GB, Titanium" },
      price: 85000,
      calories: 0,
      image: generateProductImage("iPhone"),
      optionGroups: []
    }
  ]
}));

const foodStores = Array.from({ length: 10 }).map((_, i) => ({
  id: `food-${i + 1}`,
  type: "food" as const,
  name: { tr: `Lezzet Noktası ${i + 1}`, en: `Flavor Point ${i + 1}` },
  description: { tr: "Leziz Yemekler", en: "Delicious Meals" },
  category: { tr: "Restoran", en: "Restaurant" },
  badge: undefined,
  logo: generateLogo(`Food ${i + 1}`),
  rating: 4.2 + Math.random() * 0.8,
  reviews: Math.floor(Math.random() * 2000),
  eta: "20-30 min",
  deliveryFee: 20 + Math.floor(Math.random() * 30),
  coordinate: randomCoordinate(),
  menu: [
    {
      id: `food-${i + 1}-burger`,
      name: { tr: "Klasik Burger", en: "Classic Burger" },
      description: { tr: "150g köfte, cheddar, karamelize soğan", en: "150g patty, cheddar, caramelized onions" },
      price: 250,
      calories: 850,
      image: generateProductImage("Burger"),
      optionGroups: []
    },
    {
      id: `food-${i + 1}-pizza`,
      name: { tr: "Margarita Pizza", en: "Margherita Pizza" },
      description: { tr: "Taze mozzarella ve fesleğen", en: "Fresh mozzarella and basil" },
      price: 320,
      calories: 1200,
      image: generateProductImage("Pizza"),
      optionGroups: []
    },
    {
      id: `food-${i + 1}-drink`,
      name: { tr: "Soğuk İçecek", en: "Cold Beverage" },
      description: { tr: "Buz gibi ferahlatıcı", en: "Ice cold refreshing" },
      price: 50,
      calories: 150,
      image: generateProductImage("Drink"),
      optionGroups: []
    }
  ]
}));

const marketStores = Array.from({ length: 10 }).map((_, i) => ({
  id: `market-${i + 1}`,
  type: "market" as const,
  name: { tr: `Süpermarket ${i + 1}`, en: `Supermarket ${i + 1}` },
  description: { tr: "Taze Market Ürünleri", en: "Fresh Groceries" },
  category: { tr: "Market", en: "Grocery" },
  badge: undefined,
  logo: generateLogo(`Market ${i + 1}`),
  rating: 4.0 + Math.random() * 1.0,
  reviews: Math.floor(Math.random() * 1500),
  eta: "10-20 min",
  deliveryFee: 15 + Math.floor(Math.random() * 15),
  coordinate: randomCoordinate(),
  menu: [
    {
      id: `market-${i + 1}-milk`,
      name: { tr: "Taze Süt 1L", en: "Fresh Milk 1L" },
      description: { tr: "Tam yağlı günlük süt", en: "Full fat daily milk" },
      price: 35,
      calories: 600,
      image: generateProductImage("Milk"),
      optionGroups: []
    },
    {
      id: `market-${i + 1}-bread`,
      name: { tr: "Fırın Ekmek", en: "Bakery Bread" },
      description: { tr: "Taze köy ekmeği", en: "Fresh village bread" },
      price: 15,
      calories: 250,
      image: generateProductImage("Bread"),
      optionGroups: []
    },
    {
      id: `market-${i + 1}-egg`,
      name: { tr: "Organik Yumurta 10'lu", en: "Organic Eggs 10pcs" },
      description: { tr: "Serbest gezen tavuk yumurtası", en: "Free range eggs" },
      price: 65,
      calories: 700,
      image: generateProductImage("Eggs"),
      optionGroups: []
    }
  ]
}));

const allStores = [...shopStores, ...foodStores, ...marketStores];

async function runSeeding() {
  console.log("Starting seeding process...");

  for (const store of allStores) {
    const storeRow = {
      id: store.id,
      type: store.type,
      name_tr: store.name.tr,
      name_en: store.name.en,
      description_tr: store.description?.tr || "",
      description_en: store.description?.en || "",
      category_tr: store.category.tr,
      category_en: store.category.en,
      logo: store.logo,
      badge_tr: store.badge?.tr || null,
      badge_en: store.badge?.en || null,
      rating: Number(store.rating.toFixed(1)),
      reviews: store.reviews,
      eta: store.eta,
      delivery_fee: store.deliveryFee,
      coordinates: store.coordinate
    };

    const { error: storeError } = await supabase.from('stores').upsert(storeRow);
    if (storeError) {
      console.error(`Failed to insert store ${store.id}:`, storeError);
      continue;
    }

    const productRows = store.menu.map((p) => ({
      id: p.id,
      store_id: store.id,
      product_type: (p as any).productType || null,
      name_tr: p.name.tr,
      name_en: p.name.en,
      description_tr: p.description.tr,
      description_en: p.description.en,
      price: p.price,
      image: p.image,
      calories: p.calories,
      option_groups: p.optionGroups || []
    }));

    if (productRows.length > 0) {
      const { error: productsError } = await supabase.from('products').upsert(productRows);
      if (productsError) {
        console.error(`Failed to insert products for store ${store.id}:`, productsError);
      }
    }

    console.log(`Inserted store: ${store.id}`);
  }

  console.log("Seeding completed successfully!");
}

runSeeding().catch(console.error);
