'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, useLanguageStore } from '@/lib/store';
import { formatCurrency, formatCurrencyAr } from '@repo/shared';
import clsx from 'clsx';

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { t, lang } = useLanguageStore();
  const { getCart, updateQuantity, removeItem, clearCart, getCartTotal } = useCartStore();

  const cart = getCart(slug);
  const cartTotal = getCartTotal(slug);
  const formatPrice = lang === 'ar' ? formatCurrencyAr : formatCurrency;

  if (cart.length === 0) {
    return (
      <div className={clsx('min-h-screen bg-gray-50 flex items-center justify-center', lang === 'ar' && 'rtl')} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center p-6">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-xl font-bold mb-2">{t('empty_cart')}</h1>
          <p className="text-gray-600 mb-6">
            {lang === 'ar' ? 'أضف بعض الأصناف من القائمة' : 'Add some items from the menu'}
          </p>
          <Link href={`/r/${slug}`} className="btn btn-primary">
            {t('back')} {t('menu')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('min-h-screen bg-gray-50', lang === 'ar' && 'rtl')} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/r/${slug}`} className="text-gray-600 hover:text-gray-900">
            <svg className={clsx("w-6 h-6", lang === 'ar' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">{t('cart')}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-40">
        {/* Cart items */}
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.itemId} className="card p-4 flex gap-4">
              {item.imageUrl && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium">
                  {lang === 'ar' && item.nameAr ? item.nameAr : item.name}
                </h3>
                <p className="text-primary-600 font-bold">
                  {formatPrice(item.price, 'EGP')}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(slug, item.itemId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(slug, item.itemId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(slug, item.itemId)}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    {t('remove_from_cart')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Clear cart */}
        <button
          onClick={() => {
            clearCart(slug);
            router.push(`/r/${slug}`);
          }}
          className="w-full mt-4 text-center text-red-600 text-sm hover:text-red-700"
        >
          {t('clear_cart')}
        </button>
      </main>

      {/* Checkout bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between mb-4 text-lg">
            <span>{t('subtotal')}</span>
            <span className="font-bold">{formatPrice(cartTotal, 'EGP')}</span>
          </div>
          <Link
            href={`/r/${slug}/checkout`}
            className="btn btn-primary w-full btn-lg"
          >
            {t('checkout')}
          </Link>
        </div>
      </div>
    </div>
  );
}
