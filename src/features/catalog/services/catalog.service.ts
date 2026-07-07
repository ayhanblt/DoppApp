import { fetchStoresFromSupabase, fetchStoreCategories } from "../data";
import type { Store, Product } from "@/shared/lib/types";

export async function getAllProducts(): Promise<{store: Store, product: Product}[]> {
  const stores = await fetchStoresFromSupabase();
  const all: {store: Store, product: Product}[] = [];
  
  for (const store of stores) {
    if (store.menu) {
      for (const product of store.menu) {
        all.push({ store, product });
      }
    }
  }
  
  return all;
}

export async function searchProducts(query: string) {
  const all = await getAllProducts();
  const q = query.toLowerCase();
  
  return all
    .filter(({product, store}) => 
      product.name.tr.toLowerCase().includes(q) || 
      product.name.en.toLowerCase().includes(q) ||
      (product.description?.tr && product.description.tr.toLowerCase().includes(q)) ||
      store.name.tr.toLowerCase().includes(q)
    )
    .map(({store, product}) => ({
      storeId: store.id,
      storeName: store.name.tr,
      productId: product.id,
      name: product.name.tr,
      price: product.price,
      description: product.description?.tr || ""
    }))
    .slice(0, 20); // Limit results
}

export async function getProduct(productId: string) {
  const all = await getAllProducts();
  const match = all.find(p => p.product.id === productId);
  
  if (!match) {
    return null;
  }
  
  return {
    storeId: match.store.id,
    storeName: match.store.name.tr,
    productId: match.product.id,
    name: match.product.name.tr,
    price: match.product.price,
    description: match.product.description?.tr || "",
    calories: match.product.calories,
    options: match.product.optionGroups || []
  };
}

export async function getCategories() {
  const cats = await fetchStoreCategories();
  return cats.map(c => ({ 
    id: c.id, 
    name: c.name_tr,
    name_en: c.name_en
  }));
}

export async function getTrendingProducts() {
  const all = await getAllProducts();
  // Return random 5 products as trending
  const shuffled = all.sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, 5).map(({store, product}) => ({
    storeId: store.id,
    storeName: store.name.tr,
    productId: product.id,
    name: product.name.tr,
    price: product.price,
    description: product.description?.tr || ""
  }));
}
