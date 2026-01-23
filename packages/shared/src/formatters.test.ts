import { describe, it, expect } from 'vitest';
import {
  formatOrderMessage,
  generateWhatsAppUrl,
  formatCurrency,
  formatCurrencyAr,
  calculateOrderTotals,
  generateOrderNumber,
  generateSlug,
  isRestaurantOpen,
} from './formatters';
import type { OrderWithItems, Restaurant } from './types';
import { OrderStatus, PaymentMethod } from './types';

describe('formatOrderMessage', () => {
  const mockRestaurant: Restaurant = {
    id: '1',
    name: 'Test Restaurant',
    nameAr: 'مطعم تجريبي',
    slug: 'test-restaurant',
    phone: '01012345678',
    whatsappEnabled: true,
    logoUrl: null,
    address: 'Cairo, Egypt',
    addressAr: 'القاهرة، مصر',
    hoursJson: {},
    minOrder: 50,
    deliveryFee: 20,
    currency: 'EGP',
    createdAt: new Date(),
  };

  const mockOrder: OrderWithItems = {
    id: '1',
    restaurantId: '1',
    orderNumber: '20240115-ABC1',
    customerName: 'John Doe',
    customerPhone: '01098765432',
    addressJson: {
      area: 'Maadi',
      street: 'Street 9',
      building: '15',
      floor: '3',
      apartment: '5',
    },
    notes: 'No onions please',
    paymentMethod: PaymentMethod.CASH,
    subtotal: 150,
    deliveryFee: 20,
    total: 170,
    status: OrderStatus.NEW,
    createdAt: new Date('2024-01-15T14:30:00'),
    items: [
      {
        id: '1',
        orderId: '1',
        itemId: 'item1',
        nameSnapshot: 'Chicken Shawarma',
        nameSnapshotAr: 'شاورما دجاج',
        priceSnapshot: 75,
        quantity: 2,
      },
    ],
  };

  it('should generate both Arabic and English messages', () => {
    const result = formatOrderMessage(mockOrder, mockRestaurant);

    expect(result).toHaveProperty('ar');
    expect(result).toHaveProperty('en');
    expect(result.ar.length).toBeGreaterThan(0);
    expect(result.en.length).toBeGreaterThan(0);
  });

  it('should include order number in messages', () => {
    const result = formatOrderMessage(mockOrder, mockRestaurant);

    expect(result.en).toContain('20240115-ABC1');
    expect(result.ar).toContain('20240115-ABC1');
  });

  it('should include customer details', () => {
    const result = formatOrderMessage(mockOrder, mockRestaurant);

    expect(result.en).toContain('John Doe');
    expect(result.en).toContain('01098765432');
  });

  it('should include address details', () => {
    const result = formatOrderMessage(mockOrder, mockRestaurant);

    expect(result.en).toContain('Maadi');
    expect(result.en).toContain('Street 9');
    expect(result.en).toContain('15');
  });

  it('should include order items', () => {
    const result = formatOrderMessage(mockOrder, mockRestaurant);

    expect(result.en).toContain('Chicken Shawarma');
    expect(result.en).toContain('x2');
  });

  it('should include totals', () => {
    const result = formatOrderMessage(mockOrder, mockRestaurant);

    expect(result.en).toContain('150.00');
    expect(result.en).toContain('20.00');
    expect(result.en).toContain('170.00');
  });

  it('should include notes when present', () => {
    const result = formatOrderMessage(mockOrder, mockRestaurant);

    expect(result.en).toContain('No onions please');
  });

  it('should not include notes section when notes are empty', () => {
    const orderWithoutNotes = { ...mockOrder, notes: null };
    const result = formatOrderMessage(orderWithoutNotes, mockRestaurant);

    expect(result.en).not.toContain('Notes:');
  });
});

describe('generateWhatsAppUrl', () => {
  it('should generate valid WhatsApp URL', () => {
    const url = generateWhatsAppUrl('01012345678', 'Hello World');

    expect(url).toBe('https://wa.me/201012345678?text=Hello%20World');
  });

  it('should handle phone starting with 01', () => {
    const url = generateWhatsAppUrl('01012345678', 'Test');

    expect(url).toContain('201012345678');
  });

  it('should handle phone already with country code', () => {
    const url = generateWhatsAppUrl('201012345678', 'Test');

    expect(url).toContain('201012345678');
  });

  it('should URL encode special characters', () => {
    const url = generateWhatsAppUrl('01012345678', 'Hello & Goodbye');

    expect(url).toContain('Hello%20%26%20Goodbye');
  });
});

describe('formatCurrency', () => {
  it('should format currency with EGP', () => {
    expect(formatCurrency(100, 'EGP')).toBe('100.00 EGP');
  });

  it('should handle decimal amounts', () => {
    expect(formatCurrency(99.99, 'EGP')).toBe('99.99 EGP');
  });

  it('should default to EGP', () => {
    expect(formatCurrency(50)).toBe('50.00 EGP');
  });
});

describe('formatCurrencyAr', () => {
  it('should format currency with Arabic symbol', () => {
    expect(formatCurrencyAr(100, 'EGP')).toBe('100.00 ج.م');
  });
});

describe('calculateOrderTotals', () => {
  it('should calculate correct totals', () => {
    const items = [
      { price: 50, quantity: 2 },
      { price: 30, quantity: 1 },
    ];
    const deliveryFee = 20;

    const result = calculateOrderTotals(items, deliveryFee);

    expect(result.subtotal).toBe(130);
    expect(result.deliveryFee).toBe(20);
    expect(result.total).toBe(150);
  });

  it('should handle empty items', () => {
    const result = calculateOrderTotals([], 20);

    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(20);
  });

  it('should round to 2 decimal places', () => {
    const items = [{ price: 33.333, quantity: 3 }];

    const result = calculateOrderTotals(items, 0);

    expect(result.subtotal).toBe(100);
  });
});

describe('generateOrderNumber', () => {
  it('should generate order number with correct format', () => {
    const orderNumber = generateOrderNumber();

    expect(orderNumber).toMatch(/^\d{8}-[A-Z0-9]{4}$/);
  });

  it('should generate unique order numbers', () => {
    const orders = new Set();
    for (let i = 0; i < 100; i++) {
      orders.add(generateOrderNumber());
    }
    expect(orders.size).toBe(100);
  });
});

describe('generateSlug', () => {
  it('should convert name to lowercase slug', () => {
    expect(generateSlug('My Restaurant')).toBe('my-restaurant');
  });

  it('should remove special characters', () => {
    expect(generateSlug("Al-Baik's Kitchen!")).toBe('al-baiks-kitchen');
  });

  it('should handle Arabic text by removing it', () => {
    expect(generateSlug('مطعم Test')).toBe('test');
  });

  it('should limit slug length', () => {
    const longName = 'A'.repeat(100);
    expect(generateSlug(longName).length).toBeLessThanOrEqual(50);
  });
});

describe('isRestaurantOpen', () => {
  it('should return true when restaurant is open', () => {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];

    const hours = {
      [today]: { open: '00:00', close: '23:59', isOpen: true },
    };

    expect(isRestaurantOpen(hours)).toBe(true);
  });

  it('should return false when restaurant is closed for the day', () => {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];

    const hours = {
      [today]: { open: '10:00', close: '22:00', isOpen: false },
    };

    expect(isRestaurantOpen(hours)).toBe(false);
  });

  it('should return false when no hours defined for today', () => {
    expect(isRestaurantOpen({})).toBe(false);
  });
});
