export type Locale = "tr" | "en";

export type ThemeName = "grape" | "sunset" | "mint";

export type StoreType = "shop" | "food" | "market";

export type DeliverySpeed = "rabbit" | "turtle";

export type StoreCategory = {
  id: string;
  type: StoreType;
  name_tr: string;
  name_en: string;
  parent_id?: string | null;
  sort_order: number;
};

export type ProductCategory = {
  id: string;
  store_cat_id: string;
  name_tr: string;
  name_en: string;
  sort_order: number;
};

export type DeliveryTimeConfig = {
  shop: { min: number; max: number };
  market: { min: number; max: number };
  food: { min: number; max: number };
};

export type DeliverySpeedsConfig = {
  rabbit: { baseMs: number; kmMultiplierMs: number };
  turtle: { baseMs: number; kmMultiplierMs: number };
};

export type GlobalConfig = {
  delivery_times?: DeliveryTimeConfig;
  delivery_speeds?: DeliverySpeedsConfig;
  [key: string]: unknown;
};

export type MenuOption = {
  id: string;
  label: Record<Locale, string>;
  priceDelta: number;
};

export type MenuOptionGroup = {
  id: string;
  label: Record<Locale, string>;
  required?: boolean;
  multiple?: boolean;
  options: MenuOption[];
};


export type Product = {
  id: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  price: number;
  calories?: number; 
  image: string;
  optionGroups?: MenuOptionGroup[];
  product_category_id: string;
  section_label_tr?: string | null;
  section_label_en?: string | null;
  section_color?: string | null;
  product_categories?: {
    id: string;
    name_tr: string;
    name_en: string;
  };
};

export type StoreReview = {
  author: string;
  rating: number;
  comment: string;
};

export type Store = {
  id: string;
  type: StoreType;
  name: Record<Locale, string>;
  description?: Record<Locale, string>;
  category_id: string;
  store_categories?: {
    id: string;
    name_tr: string;
    name_en: string;
  };
  logo: string;
  badge?: Record<Locale, string>;
  rating: number;
  reviews: number;
  reviews_data?: StoreReview[];
  eta: string;
  deliveryFee: number;
  coordinate: [number, number];
  menu: Product[];
};

export type CartSelection = Record<string, string[]>;

export type CartItem = {
  id: string;
  storeId: string;
  itemId: string;
  quantity: number;
  selections: CartSelection;
};

export type Address = {
  id: string;
  title: string;
  address: string;
  shortAddress?: string;
  latitude: number;
  longitude: number;
};

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "handoff"
  | "delivering"
  | "delivered";

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  addressText: string;
  note: string;
  addressCoordinate: [number, number];
  storeCoordinate: [number, number];
  courierStartCoordinate: [number, number];
  speed: DeliverySpeed;
  status: OrderStatus;
  routeWaypoints?: [number, number][];
  placedAt: number;
  handoffAt: number;
  deliveringAt: number;
  deliveredAt: number;
  items: CartItem[];
};
