// Default business hours (Egypt working hours)
export const DEFAULT_BUSINESS_HOURS = {
  sunday: { open: '10:00', close: '23:00', isOpen: true },
  monday: { open: '10:00', close: '23:00', isOpen: true },
  tuesday: { open: '10:00', close: '23:00', isOpen: true },
  wednesday: { open: '10:00', close: '23:00', isOpen: true },
  thursday: { open: '10:00', close: '23:00', isOpen: true },
  friday: { open: '12:00', close: '23:00', isOpen: true },
  saturday: { open: '10:00', close: '23:00', isOpen: true },
};

// Order status labels
export const ORDER_STATUS_LABELS = {
  en: {
    NEW: 'New',
    CONFIRMED: 'Confirmed',
    DELIVERING: 'Delivering',
    COMPLETED: 'Completed',
    CANCELED: 'Canceled',
  },
  ar: {
    NEW: 'جديد',
    CONFIRMED: 'مؤكد',
    DELIVERING: 'جاري التوصيل',
    COMPLETED: 'مكتمل',
    CANCELED: 'ملغي',
  },
};

// Order status colors for UI
export const ORDER_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-yellow-100 text-yellow-800',
  DELIVERING: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800',
};

// Days of week
export const DAYS_OF_WEEK = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};

export const DAYS_OF_WEEK_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Currency
export const CURRENCY = {
  code: 'EGP',
  symbol: 'ج.م',
  symbolEn: 'EGP',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  RESTAURANT: {
    ME: '/restaurant/me',
  },
  PUBLIC: {
    RESTAURANT: (slug: string) => `/public/restaurants/${slug}`,
    CREATE_ORDER: (slug: string) => `/public/restaurants/${slug}/orders`,
  },
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
  },
  ITEMS: {
    BASE: '/items',
    BY_ID: (id: string) => `/items/${id}`,
  },
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    STATUS: (id: string) => `/orders/${id}/status`,
  },
  UPLOAD: {
    IMAGE: '/upload/image',
  },
};

// Validation limits
export const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_ADDRESS_LENGTH: 500,
  MAX_NOTES_LENGTH: 500,
  MIN_SLUG_LENGTH: 3,
  MAX_SLUG_LENGTH: 50,
  MAX_ITEMS_PER_ORDER: 50,
};

// Rate limiting
export const RATE_LIMITS = {
  ORDER_CREATION: {
    MAX_REQUESTS: 10,
    WINDOW_SECONDS: 60,
  },
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Image upload
export const IMAGE_UPLOAD = {
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  CLOUDINARY_FOLDER: 'menu-saas',
};
