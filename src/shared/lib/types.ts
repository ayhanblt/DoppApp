export type Locale = "tr" | "en";

export type ThemeName = "grape" | "sunset" | "mint";

export type StoreType = "shop" | "food" | "market";

export type DeliverySpeed = "rabbit" | "turtle";

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

export type ProductType = "clothing" | "electronics" | "other";

export type Product = {
  id: string;
  productType?: ProductType; // Only for "shop"
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  price: number;
  calories: number; // Maybe optional for non-food, but leaving as is for simplicity
  image: string;
  optionGroups?: MenuOptionGroup[]; // Only for "shop" and maybe food
};

export type Store = {
  id: string;
  type: StoreType;
  name: Record<Locale, string>;
  description?: Record<Locale, string>;
  category: Record<Locale, string>;
  logo: string;
  badge?: Record<Locale, string>;
  rating: number;
  reviews: number;
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
  placedAt: number;
  handoffAt: number;
  deliveringAt: number;
  deliveredAt: number;
  items: CartItem[];
};
