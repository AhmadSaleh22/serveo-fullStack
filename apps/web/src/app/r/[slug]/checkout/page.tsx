'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useCartStore, useLanguageStore } from '@/lib/store';
import { FormInput, FormTextarea } from '@/components/ui/FormInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatCurrencyAr } from '@repo/shared';
import clsx from 'clsx';

const deliverySchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().regex(/^01[0125][0-9]{8}$/, 'Invalid Egyptian phone number (must start with 01)'),
  area: z.string().min(1, 'Area is required'),
  street: z.string().min(1, 'Street is required'),
  building: z.string().min(1, 'Building is required'),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  notes: z.string().optional(),
});

const dineInSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().regex(/^01[0125][0-9]{8}$/, 'Invalid Egyptian phone number (must start with 01)'),
  notes: z.string().optional(),
});

type DeliveryForm = z.infer<typeof deliverySchema>;
type DineInForm = z.infer<typeof dineInSchema>;
type CheckoutForm = DeliveryForm;

interface Restaurant {
  minOrder: number;
  deliveryFee: number;
  currency: string;
  whatsappEnabled: boolean;
  phone: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { t, lang } = useLanguageStore();
  const { getCart, getCartTotal, clearCart } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<'DELIVERY' | 'DINE_IN'>('DELIVERY');

  const cart = getCart(slug);
  const cartTotal = getCartTotal(slug);
  const formatPrice = lang === 'ar' ? formatCurrencyAr : formatCurrency;

  const isDineIn = orderType === 'DINE_IN';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(isDineIn ? dineInSchema : deliverySchema),
  });

  // Check for table number in session storage
  useEffect(() => {
    const storedTable = sessionStorage.getItem(`table_${slug}`);
    if (storedTable) {
      const tableNum = parseInt(storedTable, 10);
      if (!isNaN(tableNum)) {
        setTableNumber(tableNum);
        setOrderType('DINE_IN');
      }
    }
  }, [slug]);

  useEffect(() => {
    if (cart.length === 0) {
      router.replace(`/r/${slug}`);
      return;
    }

    const fetchRestaurant = async () => {
      try {
        const data = await api.getPublicRestaurant(slug) as Restaurant;
        setRestaurant(data);

        // Check minimum order only for delivery
        if (!isDineIn && cartTotal < data.minOrder) {
          toast.error(
            lang === 'ar'
              ? `الحد الأدنى للطلب ${formatCurrencyAr(data.minOrder, 'EGP')}`
              : `Minimum order is ${formatCurrency(data.minOrder, 'EGP')}`
          );
          router.replace(`/r/${slug}/cart`);
        }
      } catch {
        router.replace(`/r/${slug}`);
      }
    };

    fetchRestaurant();
  }, [cart.length, cartTotal, router, slug, lang, isDineIn]);

  const onSubmit = async (data: CheckoutForm, sendViaWhatsApp = false) => {
    setIsLoading(true);
    try {
      const orderData: Record<string, unknown> = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: data.notes || null,
        paymentMethod: 'CASH' as const,
        orderType,
        items: cart.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      };

      if (isDineIn && tableNumber) {
        orderData.tableNumber = tableNumber;
      } else {
        orderData.address = {
          area: (data as DeliveryForm).area,
          street: (data as DeliveryForm).street,
          building: (data as DeliveryForm).building,
          floor: (data as DeliveryForm).floor || '',
          apartment: (data as DeliveryForm).apartment || '',
        };
      }

      const result = await api.createPublicOrder(slug, orderData) as {
        order: { orderNumber: string };
        whatsappUrl: string;
        messages: { ar: string; en: string };
      };

      // Clear cart
      clearCart(slug);

      if (sendViaWhatsApp && result.whatsappUrl) {
        // Open WhatsApp directly
        window.open(result.whatsappUrl, '_blank');
        // Then redirect to success page
        const finalDeliveryFee = isDineIn ? 0 : (restaurant?.deliveryFee || 0);
        sessionStorage.setItem(
          `order_${slug}`,
          JSON.stringify({
            orderNumber: result.order.orderNumber,
            whatsappUrl: result.whatsappUrl,
            total: cartTotal + finalDeliveryFee,
          })
        );
        router.push(`/r/${slug}/order-success`);
      } else {
        // Store order info for confirmation page
        const finalDeliveryFee = isDineIn ? 0 : (restaurant?.deliveryFee || 0);
        sessionStorage.setItem(
          `order_${slug}`,
          JSON.stringify({
            orderNumber: result.order.orderNumber,
            whatsappUrl: result.whatsappUrl,
            total: cartTotal + finalDeliveryFee,
          })
        );
        // Redirect to confirmation
        router.push(`/r/${slug}/order-success`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  if (!restaurant || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const deliveryFee = isDineIn ? 0 : restaurant.deliveryFee;
  const total = cartTotal + deliveryFee;

  return (
    <div className={clsx('min-h-screen bg-gray-50', lang === 'ar' && 'rtl')} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/r/${slug}/cart`} className="text-gray-600 hover:text-gray-900">
            <svg className={clsx("w-6 h-6", lang === 'ar' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">{t('checkout')}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-40">
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
          {/* Customer details */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4">{t('your_details')}</h2>
            <div className="space-y-4">
              <FormInput
                label={t('name')}
                placeholder={lang === 'ar' ? 'أحمد محمد' : 'Ahmed Mohamed'}
                error={errors.customerName?.message}
                {...register('customerName')}
              />
              <FormInput
                label={t('phone')}
                placeholder="01012345678"
                type="tel"
                error={errors.customerPhone?.message}
                {...register('customerPhone')}
              />
            </div>
          </div>

          {/* Order type selector (only show if table was set) */}
          {tableNumber && (
            <div className="card p-4">
              <h2 className="font-semibold mb-4">
                {lang === 'ar' ? 'نوع الطلب' : 'Order Type'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={clsx(
                    'p-3 rounded-lg border-2 text-center transition-colors',
                    orderType === 'DINE_IN'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className="text-2xl block mb-1">🪑</span>
                  <span className="text-sm font-medium">
                    {lang === 'ar' ? `طاولة ${tableNumber}` : `Table ${tableNumber}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={clsx(
                    'p-3 rounded-lg border-2 text-center transition-colors',
                    orderType === 'DELIVERY'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className="text-2xl block mb-1">🛵</span>
                  <span className="text-sm font-medium">
                    {lang === 'ar' ? 'توصيل' : 'Delivery'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Dine-in info */}
          {isDineIn && tableNumber && (
            <div className="card p-4 bg-primary-50 border-primary-200">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🪑</span>
                <div>
                  <h3 className="font-medium text-primary-900">
                    {lang === 'ar' ? `طاولة رقم ${tableNumber}` : `Table ${tableNumber}`}
                  </h3>
                  <p className="text-sm text-primary-700">
                    {lang === 'ar' ? 'طلب محلي - بدون رسوم توصيل' : 'Dine-in order - No delivery fee'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery address - only for delivery orders */}
          {!isDineIn && (
            <div className="card p-4">
              <h2 className="font-semibold mb-4">{t('delivery_address')}</h2>
              <div className="space-y-4">
                <FormInput
                  label={t('area')}
                  placeholder={lang === 'ar' ? 'المعادي' : 'Maadi'}
                  error={(errors as Record<string, { message?: string }>).area?.message}
                  {...register('area' as keyof CheckoutForm)}
                />
                <FormInput
                  label={t('street')}
                  placeholder={lang === 'ar' ? 'شارع ٩' : 'Street 9'}
                  error={(errors as Record<string, { message?: string }>).street?.message}
                  {...register('street' as keyof CheckoutForm)}
                />
                <div className="grid grid-cols-3 gap-3">
                  <FormInput
                    label={t('building')}
                    placeholder="15"
                    error={(errors as Record<string, { message?: string }>).building?.message}
                    {...register('building' as keyof CheckoutForm)}
                  />
                  <FormInput
                    label={t('floor')}
                    placeholder="3"
                    {...register('floor' as keyof CheckoutForm)}
                  />
                  <FormInput
                    label={t('apartment')}
                    placeholder="5"
                    {...register('apartment' as keyof CheckoutForm)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card p-4">
            <FormTextarea
              label={t('notes')}
              placeholder={lang === 'ar' ? 'ملاحظات إضافية للطلب...' : 'Additional notes for your order...'}
              {...register('notes')}
            />
          </div>

          {/* Payment method */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4">{t('payment_method')}</h2>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="radio"
                id="cash"
                checked
                readOnly
                className="w-4 h-4"
              />
              <label htmlFor="cash" className="flex items-center gap-2">
                <span className="text-xl">💵</span>
                {t('cash')}
              </label>
            </div>
          </div>

          {/* Order summary */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4">
              {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
            </h2>
            <div className="space-y-2 text-sm">
              {cart.map((item) => (
                <div key={item.itemId} className="flex justify-between">
                  <span>
                    {lang === 'ar' && item.nameAr ? item.nameAr : item.name} x{item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity, 'EGP')}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span>{formatPrice(cartTotal, 'EGP')}</span>
                </div>
                {!isDineIn && (
                  <div className="flex justify-between">
                    <span>{t('delivery_fee')}</span>
                    <span>{formatPrice(deliveryFee, 'EGP')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>{t('total')}</span>
                  <span>{formatPrice(total, 'EGP')}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Place order buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {/* WhatsApp order button - shown if restaurant has WhatsApp enabled */}
          {restaurant.whatsappEnabled && (
            <button
              onClick={handleWhatsAppOrder}
              disabled={isLoading}
              className="btn w-full btn-lg flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t('order_via_whatsapp')} • {formatPrice(total, 'EGP')}
                </>
              )}
            </button>
          )}

          {/* Regular order button */}
          <button
            onClick={handleSubmit((data) => onSubmit(data, false))}
            disabled={isLoading}
            className={clsx(
              "btn w-full btn-lg",
              restaurant.whatsappEnabled ? "btn-secondary" : "btn-primary"
            )}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                {t('place_order')} • {formatPrice(total, 'EGP')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
