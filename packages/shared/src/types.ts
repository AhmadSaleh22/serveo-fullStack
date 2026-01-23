// User & Auth Types
export enum UserRole {
  OWNER = 'OWNER',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  restaurantId: string | null;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  restaurantId: string | null;
}

// Plan Types
export enum PlanType {
  BASIC = 'BASIC',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
}

// Restaurant Types
export interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  phone: string;
  whatsappEnabled: boolean;
  logoUrl: string | null;
  address: string;
  addressAr?: string;
  hoursJson: BusinessHours;
  minOrder: number;
  deliveryFee: number;
  currency: string;
  planType: PlanType;
  // SEO fields
  metaTitle?: string | null;
  metaTitleAr?: string | null;
  metaDescription?: string | null;
  metaDescriptionAr?: string | null;
  keywords?: string | null;
  keywordsAr?: string | null;
  createdAt: Date;
}

export interface RestaurantWithMenu extends Restaurant {
  categories: CategoryWithItems[];
}

// Category Types
export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  nameAr?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface CategoryWithItems extends Category {
  items: Item[];
}

// Item Types
export interface ItemImage {
  id: string;
  itemId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface Item {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  nameAr?: string;
  description: string | null;
  descriptionAr?: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  images?: ItemImage[];
  createdAt: Date;
}

// Offer Types
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  BUNDLE = 'BUNDLE',
}

export enum OfferTarget {
  GLOBAL = 'GLOBAL',
  CATEGORY = 'CATEGORY',
  ITEM = 'ITEM',
}

export interface BundleConfig {
  buyQty: number;
  getQty: number;
  itemId?: string;
}

export interface Offer {
  id: string;
  restaurantId: string;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  discountType: DiscountType;
  discountValue: number;
  bundleConfig?: BundleConfig | null;
  targetType: OfferTarget;
  targetCategoryId?: string | null;
  targetItemId?: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

// Table Types
export interface Table {
  id: string;
  restaurantId: string;
  number: number;
  name?: string | null;
  capacity: number;
  isActive: boolean;
  qrCodeUrl?: string | null;
  createdAt: Date;
}

// Order Types
export enum OrderStatus {
  NEW = 'NEW',
  CONFIRMED = 'CONFIRMED',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum PaymentMethod {
  CASH = 'CASH',
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  DINE_IN = 'DINE_IN',
}

export interface OrderAddress {
  area: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
}

export interface OrderOffer {
  id: string;
  orderId: string;
  offerId?: string | null;
  offerTitle: string;
  discountAmount: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  addressJson: OrderAddress;
  notes: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discountTotal: number;
  total: number;
  status: OrderStatus;
  orderType: OrderType;
  tableId?: string | null;
  tableNumber?: number | null;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string | null;
  nameSnapshot: string;
  nameSnapshotAr?: string;
  priceSnapshot: number;
  quantity: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  appliedOffers?: OrderOffer[];
  table?: Table | null;
  restaurant?: Restaurant;
}

// Cart Types (Frontend)
export interface CartItem {
  itemId: string;
  name: string;
  nameAr?: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

export interface Cart {
  restaurantSlug: string;
  items: CartItem[];
}

// Analytics Types
export interface DashboardAnalytics {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
