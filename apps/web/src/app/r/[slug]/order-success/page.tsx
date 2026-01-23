'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguageStore } from '@/lib/store';
import { formatCurrency, formatCurrencyAr } from '@repo/shared';
import clsx from 'clsx';

interface OrderInfo {
  orderNumber: string;
  whatsappUrl: string;
  total: number;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { t, lang } = useLanguageStore();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);

  const formatPrice = lang === 'ar' ? formatCurrencyAr : formatCurrency;

  useEffect(() => {
    const storedOrder = sessionStorage.getItem(`order_${slug}`);
    if (storedOrder) {
      setOrderInfo(JSON.parse(storedOrder));
      // Clear after reading
      sessionStorage.removeItem(`order_${slug}`);
    } else {
      // No order info, redirect to menu
      router.replace(`/r/${slug}`);
    }
  }, [slug, router]);

  if (!orderInfo) {
    return null;
  }

  return (
    <div className={clsx('min-h-screen bg-gray-50', lang === 'ar' && 'rtl')} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="card p-8 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('order_created')}!
          </h1>

          <p className="text-gray-600 mb-6">
            {lang === 'ar'
              ? 'شكراً لطلبك! أرسل الطلب عبر واتساب لتأكيده.'
              : 'Thank you for your order! Send it via WhatsApp to confirm.'}
          </p>

          {/* Order details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500 mb-1">
              {t('order_number')}
            </div>
            <div className="text-xl font-bold text-gray-900">
              #{orderInfo.orderNumber}
            </div>
            <div className="text-lg font-semibold text-primary-600 mt-2">
              {t('total')}: {formatPrice(orderInfo.total, 'EGP')}
            </div>
          </div>

          {/* WhatsApp button */}
          <a
            href={orderInfo.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full btn-lg mb-4 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t('send_whatsapp')}
          </a>

          <p className="text-sm text-gray-500 mb-6">
            {lang === 'ar'
              ? 'سيتم تحويلك إلى واتساب لإرسال تفاصيل الطلب للمطعم'
              : 'You will be redirected to WhatsApp to send order details to the restaurant'}
          </p>

          {/* Back to menu */}
          <Link
            href={`/r/${slug}`}
            className="btn btn-secondary w-full"
          >
            {t('back')} {lang === 'ar' ? 'إلى القائمة' : 'to Menu'}
          </Link>
        </div>

        {/* Thank you message */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          {lang === 'ar'
            ? 'شكراً لاختيارك لنا!'
            : 'Thank you for choosing us!'}
        </div>
      </div>
    </div>
  );
}
