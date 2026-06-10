export type Locale = "tr" | "en";

export type ThemeName = "grape" | "sunset" | "ocean" | "mint";

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

export type MenuItem = {
  id: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  price: number;
  calories: number;
  image: string;
  optionGroups?: MenuOptionGroup[];
};

export type Restaurant = {
  id: string;
  name: Record<Locale, string>;
  category: Record<Locale, string>;
  emoji: string;
  badge?: Record<Locale, string>;
  rating: number;
  reviews: number;
  eta: string;
  deliveryFee: number;
  coordinate: [number, number];
  menu: MenuItem[];
};

export type CartSelection = Record<string, string[]>;

export type CartItem = {
  id: string;
  restaurantId: string;
  itemId: string;
  quantity: number;
  selections: CartSelection;
};

export type Address = {
  label: string;
  detail: string;
  coordinate: [number, number];
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
  restaurantCoordinate: [number, number];
  speed: DeliverySpeed;
  status: OrderStatus;
  placedAt: number;
  handoffAt: number;
  deliveredAt: number;
  items: CartItem[];
};
