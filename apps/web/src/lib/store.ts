import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@repo/shared';

interface AuthState {
  user: {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
  } | null;
  restaurant: {
    id: string;
    name: string;
    slug: string;
  } | null;
  setAuth: (user: AuthState['user'], restaurant: AuthState['restaurant']) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      restaurant: null,
      setAuth: (user, restaurant) => set({ user, restaurant }),
      clearAuth: () => set({ user: null, restaurant: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface CartState {
  carts: Record<string, CartItem[]>; // keyed by restaurant slug
  getCart: (slug: string) => CartItem[];
  addItem: (slug: string, item: CartItem) => void;
  removeItem: (slug: string, itemId: string) => void;
  updateQuantity: (slug: string, itemId: string, quantity: number) => void;
  clearCart: (slug: string) => void;
  getCartTotal: (slug: string) => number;
  getCartCount: (slug: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      getCart: (slug) => get().carts[slug] || [],
      addItem: (slug, item) =>
        set((state) => {
          const cart = state.carts[slug] || [];
          const existingIndex = cart.findIndex((i) => i.itemId === item.itemId);

          let newCart: CartItem[];
          if (existingIndex >= 0) {
            newCart = cart.map((i, idx) =>
              idx === existingIndex
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            newCart = [...cart, item];
          }

          return {
            carts: { ...state.carts, [slug]: newCart },
          };
        }),
      removeItem: (slug, itemId) =>
        set((state) => {
          const cart = state.carts[slug] || [];
          return {
            carts: {
              ...state.carts,
              [slug]: cart.filter((i) => i.itemId !== itemId),
            },
          };
        }),
      updateQuantity: (slug, itemId, quantity) =>
        set((state) => {
          const cart = state.carts[slug] || [];
          if (quantity <= 0) {
            return {
              carts: {
                ...state.carts,
                [slug]: cart.filter((i) => i.itemId !== itemId),
              },
            };
          }
          return {
            carts: {
              ...state.carts,
              [slug]: cart.map((i) =>
                i.itemId === itemId ? { ...i, quantity } : i
              ),
            },
          };
        }),
      clearCart: (slug) =>
        set((state) => ({
          carts: { ...state.carts, [slug]: [] },
        })),
      getCartTotal: (slug) => {
        const cart = get().carts[slug] || [];
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      getCartCount: (slug) => {
        const cart = get().carts[slug] || [];
        return cart.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

interface LanguageState {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    // Common
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'close': 'Close',
    'back': 'Back',
    'next': 'Next',
    'submit': 'Submit',
    'confirm': 'Confirm',

    // Auth
    'login': 'Login',
    'register': 'Register',
    'logout': 'Logout',
    'email': 'Email',
    'password': 'Password',
    'restaurant_name': 'Restaurant Name',
    'login_success': 'Login successful',
    'register_success': 'Registration successful',

    // Restaurant
    'open': 'Open',
    'closed': 'Closed',
    'min_order': 'Minimum Order',
    'delivery_fee': 'Delivery Fee',
    'working_hours': 'Working Hours',

    // Menu
    'menu': 'Menu',
    'categories': 'Categories',
    'items': 'Items',
    'add_category': 'Add Category',
    'add_item': 'Add Item',
    'category_name': 'Category Name',
    'item_name': 'Item Name',
    'description': 'Description',
    'price': 'Price',
    'available': 'Available',
    'unavailable': 'Unavailable',

    // Cart
    'cart': 'Cart',
    'empty_cart': 'Your cart is empty',
    'add_to_cart': 'Add to Cart',
    'remove_from_cart': 'Remove',
    'subtotal': 'Subtotal',
    'total': 'Total',
    'checkout': 'Checkout',
    'clear_cart': 'Clear Cart',

    // Checkout
    'your_details': 'Your Details',
    'name': 'Name',
    'phone': 'Phone Number',
    'delivery_address': 'Delivery Address',
    'area': 'Area',
    'street': 'Street',
    'building': 'Building',
    'floor': 'Floor',
    'apartment': 'Apartment',
    'notes': 'Notes',
    'payment_method': 'Payment Method',
    'cash': 'Cash on Delivery',
    'place_order': 'Place Order',
    'order_via_whatsapp': 'Order via WhatsApp',

    // Orders
    'orders': 'Orders',
    'order_number': 'Order #',
    'order_status': 'Status',
    'order_created': 'Order Created',
    'send_whatsapp': 'Send on WhatsApp',
    'view_order': 'View Order',
    'new': 'New',
    'confirmed': 'Confirmed',
    'delivering': 'Delivering',
    'completed': 'Completed',
    'canceled': 'Canceled',

    // Dashboard
    'dashboard': 'Dashboard',
    'settings': 'Settings',
    'analytics': 'Analytics',
    'total_orders': 'Total Orders',
    'total_revenue': 'Total Revenue',
    'today_orders': 'Today\'s Orders',
    'offers': 'Offers',
    'tables': 'Tables',
    'seo': 'SEO',
  },
  ar: {
    // Common
    'loading': 'جاري التحميل...',
    'error': 'خطأ',
    'success': 'نجاح',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'delete': 'حذف',
    'edit': 'تعديل',
    'add': 'إضافة',
    'search': 'بحث',
    'close': 'إغلاق',
    'back': 'رجوع',
    'next': 'التالي',
    'submit': 'إرسال',
    'confirm': 'تأكيد',

    // Auth
    'login': 'تسجيل الدخول',
    'register': 'إنشاء حساب',
    'logout': 'تسجيل الخروج',
    'email': 'البريد الإلكتروني',
    'password': 'كلمة المرور',
    'restaurant_name': 'اسم المطعم',
    'login_success': 'تم تسجيل الدخول بنجاح',
    'register_success': 'تم إنشاء الحساب بنجاح',

    // Restaurant
    'open': 'مفتوح',
    'closed': 'مغلق',
    'min_order': 'الحد الأدنى للطلب',
    'delivery_fee': 'رسوم التوصيل',
    'working_hours': 'ساعات العمل',

    // Menu
    'menu': 'القائمة',
    'categories': 'الأقسام',
    'items': 'الأصناف',
    'add_category': 'إضافة قسم',
    'add_item': 'إضافة صنف',
    'category_name': 'اسم القسم',
    'item_name': 'اسم الصنف',
    'description': 'الوصف',
    'price': 'السعر',
    'available': 'متوفر',
    'unavailable': 'غير متوفر',

    // Cart
    'cart': 'السلة',
    'empty_cart': 'سلة التسوق فارغة',
    'add_to_cart': 'أضف للسلة',
    'remove_from_cart': 'إزالة',
    'subtotal': 'المجموع الفرعي',
    'total': 'الإجمالي',
    'checkout': 'إتمام الطلب',
    'clear_cart': 'تفريغ السلة',

    // Checkout
    'your_details': 'بياناتك',
    'name': 'الاسم',
    'phone': 'رقم الهاتف',
    'delivery_address': 'عنوان التوصيل',
    'area': 'المنطقة',
    'street': 'الشارع',
    'building': 'المبنى',
    'floor': 'الطابق',
    'apartment': 'الشقة',
    'notes': 'ملاحظات',
    'payment_method': 'طريقة الدفع',
    'cash': 'الدفع عند الاستلام',
    'place_order': 'تأكيد الطلب',
    'order_via_whatsapp': 'اطلب عبر واتساب',

    // Orders
    'orders': 'الطلبات',
    'order_number': 'طلب #',
    'order_status': 'الحالة',
    'order_created': 'تم إنشاء الطلب',
    'send_whatsapp': 'إرسال عبر واتساب',
    'view_order': 'عرض الطلب',
    'new': 'جديد',
    'confirmed': 'مؤكد',
    'delivering': 'جاري التوصيل',
    'completed': 'مكتمل',
    'canceled': 'ملغي',

    // Dashboard
    'dashboard': 'لوحة التحكم',
    'settings': 'الإعدادات',
    'analytics': 'التحليلات',
    'total_orders': 'إجمالي الطلبات',
    'total_revenue': 'إجمالي الإيرادات',
    'today_orders': 'طلبات اليوم',
    'offers': 'العروض',
    'tables': 'الطاولات',
    'seo': 'تحسين محركات البحث',
  },
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key) => {
        const { lang } = get();
        return translations[lang]?.[key] || translations['en'][key] || key;
      },
    }),
    {
      name: 'language-storage',
    }
  )
);
