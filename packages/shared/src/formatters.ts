import type { OrderWithItems, Restaurant, OrderAddress, OrderType } from './types';

export interface FormattedMessage {
  ar: string;
  en: string;
}

/**
 * Format order message for WhatsApp
 * Returns both Arabic and English versions
 */
export function formatOrderMessage(
  order: OrderWithItems,
  restaurant: Restaurant
): FormattedMessage {
  const address = order.addressJson as OrderAddress;
  const createdAt = new Date(order.createdAt);
  const dateStr = createdAt.toLocaleDateString('en-EG');
  const timeStr = createdAt.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' });
  const dateStrAr = createdAt.toLocaleDateString('ar-EG');
  const timeStrAr = createdAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const isDineIn = order.orderType === 'DINE_IN';
  const hasDiscount = order.discountTotal && order.discountTotal > 0;

  // English version
  let en = `🧾 *New Order #${order.orderNumber}*\n`;
  en += isDineIn ? `🍽️ *Dine-In Order*\n` : `🛵 *Delivery Order*\n`;
  en += `📅 ${dateStr} ${timeStr}\n`;
  en += `━━━━━━━━━━━━━━━\n\n`;

  en += `*Customer Details:*\n`;
  en += `👤 ${order.customerName}\n`;
  en += `📱 ${order.customerPhone}\n\n`;

  if (isDineIn && order.tableNumber) {
    en += `*Table:*\n`;
    en += `🪑 Table #${order.tableNumber}\n\n`;
  } else if (!isDineIn && address) {
    en += `*Delivery Address:*\n`;
    en += `📍 ${address.area}, ${address.street}\n`;
    en += `🏠 Building: ${address.building}`;
    if (address.floor) en += `, Floor: ${address.floor}`;
    if (address.apartment) en += `, Apt: ${address.apartment}`;
    en += `\n\n`;
  }

  en += `*Order Items:*\n`;
  en += `───────────────\n`;

  order.items.forEach((item, index) => {
    en += `${index + 1}. ${item.nameSnapshot} x${item.quantity}\n`;
    en += `   ${formatCurrency(item.priceSnapshot * item.quantity, restaurant.currency)}\n`;
  });

  en += `───────────────\n`;
  en += `Subtotal: ${formatCurrency(order.subtotal, restaurant.currency)}\n`;

  if (!isDineIn) {
    en += `Delivery: ${formatCurrency(order.deliveryFee, restaurant.currency)}\n`;
  }

  if (hasDiscount) {
    en += `🎁 Discount: -${formatCurrency(order.discountTotal, restaurant.currency)}\n`;
    if (order.appliedOffers && order.appliedOffers.length > 0) {
      order.appliedOffers.forEach((ao) => {
        en += `   • ${ao.offerTitle}\n`;
      });
    }
  }

  en += `*Total: ${formatCurrency(order.total, restaurant.currency)}*\n\n`;

  en += `💵 Payment: Cash ${isDineIn ? 'at Table' : 'on Delivery'}\n`;

  if (order.notes) {
    en += `\n📝 *Notes:* ${order.notes}\n`;
  }

  // Arabic version
  let ar = `🧾 *طلب جديد #${order.orderNumber}*\n`;
  ar += isDineIn ? `🍽️ *طلب محلي*\n` : `🛵 *طلب توصيل*\n`;
  ar += `📅 ${dateStrAr} ${timeStrAr}\n`;
  ar += `━━━━━━━━━━━━━━━\n\n`;

  ar += `*بيانات العميل:*\n`;
  ar += `👤 ${order.customerName}\n`;
  ar += `📱 ${order.customerPhone}\n\n`;

  if (isDineIn && order.tableNumber) {
    ar += `*الطاولة:*\n`;
    ar += `🪑 طاولة رقم ${order.tableNumber}\n\n`;
  } else if (!isDineIn && address) {
    ar += `*عنوان التوصيل:*\n`;
    ar += `📍 ${address.area}، ${address.street}\n`;
    ar += `🏠 المبنى: ${address.building}`;
    if (address.floor) ar += `، الطابق: ${address.floor}`;
    if (address.apartment) ar += `، الشقة: ${address.apartment}`;
    ar += `\n\n`;
  }

  ar += `*عناصر الطلب:*\n`;
  ar += `───────────────\n`;

  order.items.forEach((item, index) => {
    const itemName = item.nameSnapshotAr || item.nameSnapshot;
    ar += `${index + 1}. ${itemName} x${item.quantity}\n`;
    ar += `   ${formatCurrencyAr(item.priceSnapshot * item.quantity, restaurant.currency)}\n`;
  });

  ar += `───────────────\n`;
  ar += `المجموع الفرعي: ${formatCurrencyAr(order.subtotal, restaurant.currency)}\n`;

  if (!isDineIn) {
    ar += `التوصيل: ${formatCurrencyAr(order.deliveryFee, restaurant.currency)}\n`;
  }

  if (hasDiscount) {
    ar += `🎁 الخصم: -${formatCurrencyAr(order.discountTotal, restaurant.currency)}\n`;
    if (order.appliedOffers && order.appliedOffers.length > 0) {
      order.appliedOffers.forEach((ao) => {
        ar += `   • ${ao.offerTitle}\n`;
      });
    }
  }

  ar += `*الإجمالي: ${formatCurrencyAr(order.total, restaurant.currency)}*\n\n`;

  ar += `💵 الدفع: نقداً ${isDineIn ? 'عند الطاولة' : 'عند الاستلام'}\n`;

  if (order.notes) {
    ar += `\n📝 *ملاحظات:* ${order.notes}\n`;
  }

  return { ar, en };
}

/**
 * Generate WhatsApp click-to-chat URL
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  // Clean phone number - remove any non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');

  // Add Egypt country code if not present
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '20' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('20')) {
    cleanPhone = '20' + cleanPhone;
  }

  // URL encode the message
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Format currency for display (English)
 */
export function formatCurrency(amount: number, currency: string = 'EGP'): string {
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Format currency for display (Arabic)
 */
export function formatCurrencyAr(amount: number, currency: string = 'EGP'): string {
  const currencyAr = currency === 'EGP' ? 'ج.م' : currency;
  return `${amount.toFixed(2)} ${currencyAr}`;
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(
  items: { price: number; quantity: number }[],
  deliveryFee: number
): { subtotal: number; deliveryFee: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Generate unique order number
 * Format: YYYYMMDD-XXXX (date + 4 random alphanumeric)
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${dateStr}-${random}`;
}

/**
 * Generate slug from restaurant name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50);
}

/**
 * Suggest alternative slugs if taken
 */
export function suggestSlugs(baseSlug: string): string[] {
  const random1 = Math.floor(Math.random() * 1000);
  const random2 = Math.floor(Math.random() * 1000);
  const random3 = Math.random().toString(36).substring(2, 5);

  return [
    `${baseSlug}-${random1}`,
    `${baseSlug}-${random2}`,
    `${baseSlug}-${random3}`,
  ];
}

/**
 * Check if restaurant is currently open based on hours
 */
export function isRestaurantOpen(hoursJson: Record<string, { open: string; close: string; isOpen: boolean }>): boolean {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];

  const todayHours = hoursJson[today];
  if (!todayHours || !todayHours.isOpen) {
    return false;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Handle overnight hours
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }

  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Format business hours for display
 */
export function formatBusinessHours(
  hoursJson: Record<string, { open: string; close: string; isOpen: boolean }>,
  locale: 'en' | 'ar' = 'en'
): { day: string; hours: string }[] {
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const daysKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const days = locale === 'ar' ? daysAr : daysEn;
  const closedText = locale === 'ar' ? 'مغلق' : 'Closed';

  return daysKey.map((key, index) => {
    const hours = hoursJson[key];
    return {
      day: days[index],
      hours: hours?.isOpen ? `${hours.open} - ${hours.close}` : closedText,
    };
  });
}
