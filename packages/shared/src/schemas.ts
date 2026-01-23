import { z } from 'zod';

// Egyptian phone number pattern: 01[0125][0-9]{8}
const egyptPhoneRegex = /^01[0125][0-9]{8}$/;

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Restaurant Schemas
export const businessHoursSchema = z.record(
  z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    isOpen: z.boolean(),
  })
);

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  nameAr: z.string().min(2).max(100).optional(),
  slug: slugSchema.optional(),
  phone: z.string().regex(egyptPhoneRegex, 'Invalid Egyptian phone number').optional(),
  whatsappEnabled: z.boolean().optional(),
  logoUrl: z.string().url().nullable().optional(),
  address: z.string().max(500).optional(),
  addressAr: z.string().max(500).optional(),
  hoursJson: businessHoursSchema.optional(),
  minOrder: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  currency: z.string().default('EGP').optional(),
});

// Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  nameAr: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameAr: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// Item Schemas
export const createItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Name is required').max(200),
  nameAr: z.string().max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  descriptionAr: z.string().max(1000).nullable().optional(),
  price: z.number().min(0, 'Price must be positive'),
  imageUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().default(true),
});

export const updateItemSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  nameAr: z.string().max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  descriptionAr: z.string().max(1000).nullable().optional(),
  price: z.number().min(0).optional(),
  imageUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().optional(),
});

// Order Schemas
export const orderAddressSchema = z.object({
  area: z.string().min(1, 'Area is required').max(200),
  street: z.string().min(1, 'Street is required').max(200),
  building: z.string().min(1, 'Building is required').max(100),
  floor: z.string().max(50).optional().default(''),
  apartment: z.string().max(50).optional().default(''),
});

export const orderItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerPhone: z.string().regex(egyptPhoneRegex, 'Invalid Egyptian phone number (must start with 01)'),
  address: orderAddressSchema,
  notes: z.string().max(500).nullable().optional(),
  paymentMethod: z.literal('CASH'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'CONFIRMED', 'DELIVERING', 'COMPLETED', 'CANCELED']),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderAddressInput = z.infer<typeof orderAddressSchema>;
