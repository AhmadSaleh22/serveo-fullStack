'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useCartStore, useLanguageStore } from '@/lib/store';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { LoadingSpinner, LoadingPage } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatCurrencyAr, isRestaurantOpen, formatBusinessHours } from '@repo/shared';
import clsx from 'clsx';

interface ItemImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  imageUrl?: string;
  images?: ItemImage[];
  isAvailable: boolean;
}

interface Offer {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'BUNDLE';
  discountValue: number;
  targetType: 'GLOBAL' | 'CATEGORY' | 'ITEM';
  targetCategoryId?: string;
  targetItemId?: string;
}

interface Restaurant {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  phone: string;
  whatsappEnabled: boolean;
  logoUrl?: string;
  address: string;
  addressAr?: string;
  hoursJson: Record<string, { open: string; close: string; isOpen: boolean }>;
  minOrder: number;
  deliveryFee: number;
  currency: string;
  isOpen: boolean;
  categories: Category[];
  offers?: Offer[];
  tables?: { id: string; number: number; name?: string }[];
}

export default function RestaurantPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const tableNumber = searchParams.get('table');
  const { t, lang } = useLanguageStore();
  const { getCart, addItem, getCartCount, getCartTotal } = useCartStore();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showHours, setShowHours] = useState(false);

  const cart = getCart(slug);
  const cartCount = getCartCount(slug);
  const cartTotal = getCartTotal(slug);

  // Store table number in session storage for checkout
  useEffect(() => {
    if (tableNumber) {
      sessionStorage.setItem(`table_${slug}`, tableNumber);
    }
  }, [tableNumber, slug]);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await api.getPublicRestaurant(slug) as Restaurant;
        setRestaurant(data);
        if (data.categories.length > 0) {
          setActiveCategory(data.categories[0].id);
        }
      } catch (error) {
        setError('Restaurant not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [slug]);

  // Get applicable offer for an item
  const getItemOffer = (item: Item, categoryId: string) => {
    if (!restaurant?.offers) return null;

    // Check item-specific offer first
    const itemOffer = restaurant.offers.find(
      (o) => o.targetType === 'ITEM' && o.targetItemId === item.id
    );
    if (itemOffer) return itemOffer;

    // Check category offer
    const categoryOffer = restaurant.offers.find(
      (o) => o.targetType === 'CATEGORY' && o.targetCategoryId === categoryId
    );
    if (categoryOffer) return categoryOffer;

    // Check global offer
    const globalOffer = restaurant.offers.find((o) => o.targetType === 'GLOBAL');
    return globalOffer || null;
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discountType === 'PERCENTAGE') {
      return `${offer.discountValue}% OFF`;
    }
    return `${offer.discountValue} EGP OFF`;
  };

  const handleAddToCart = (item: Item) => {
    if (!item.isAvailable) {
      toast.error('This item is currently unavailable');
      return;
    }

    addItem(slug, {
      itemId: item.id,
      name: item.name,
      nameAr: item.nameAr,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl || null,
    });

    toast.success(lang === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to cart');
  };

  if (isLoading) return <LoadingPage />;

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h1>
          <p className="text-gray-600 mb-4">The restaurant you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = isRestaurantOpen(restaurant.hoursJson);
  const businessHours = formatBusinessHours(restaurant.hoursJson, lang);
  const formatPrice = lang === 'ar' ? formatCurrencyAr : formatCurrency;

  return (
    <div className={clsx('min-h-screen bg-gray-50', lang === 'ar' && 'rtl')} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {restaurant.logoUrl && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                  <Image src={restaurant.logoUrl} alt={restaurant.name} fill className="object-cover" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg">
                  {lang === 'ar' && restaurant.nameAr ? restaurant.nameAr : restaurant.name}
                </h1>
                <div className="flex items-center gap-2 text-sm">
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {isOpen ? t('open') : t('closed')}
                  </span>
                  <button
                    onClick={() => setShowHours(!showHours)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    🕐
                  </button>
                </div>
              </div>
            </div>
            <LanguageToggle />
          </div>

          {/* Hours dropdown */}
          {showHours && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
              <h3 className="font-medium mb-2">{t('working_hours')}</h3>
              <div className="space-y-1">
                {businessHours.map(({ day, hours }) => (
                  <div key={day} className="flex justify-between">
                    <span>{day}</span>
                    <span className="text-gray-600">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dine-in indicator */}
        {tableNumber && (
          <div className="max-w-4xl mx-auto px-4 pb-2">
            <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <span>🪑</span>
              <span>
                {lang === 'ar'
                  ? `طلب محلي - طاولة رقم ${tableNumber}`
                  : `Dine-In Order - Table ${tableNumber}`}
              </span>
            </div>
          </div>
        )}

        {/* Offers banner */}
        {restaurant.offers && restaurant.offers.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-lg">🎁</span>
                {restaurant.offers.slice(0, 3).map((offer, idx) => (
                  <span key={offer.id} className="whitespace-nowrap text-sm font-medium">
                    {idx > 0 && <span className="mx-2">•</span>}
                    {lang === 'ar' && offer.titleAr ? offer.titleAr : offer.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info bar */}
        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-4 text-sm text-gray-600">
          {!tableNumber && (
            <>
              <span>{t('min_order')}: {formatPrice(restaurant.minOrder, 'EGP')}</span>
              <span>{t('delivery_fee')}: {formatPrice(restaurant.deliveryFee, 'EGP')}</span>
            </>
          )}
          {tableNumber && (
            <span>{lang === 'ar' ? 'بدون حد أدنى للطلب المحلي' : 'No minimum for dine-in'}</span>
          )}
        </div>

        {/* Category tabs */}
        {restaurant.categories.length > 0 && (
          <div className="border-t overflow-x-auto">
            <div className="max-w-4xl mx-auto px-4 flex gap-1">
              {restaurant.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={clsx(
                    'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    activeCategory === cat.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  )}
                >
                  {lang === 'ar' && cat.nameAr ? cat.nameAr : cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Menu */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-32">
        {restaurant.categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No menu items yet.
          </div>
        ) : (
          restaurant.categories
            .filter((cat) => activeCategory === null || cat.id === activeCategory)
            .map((category) => (
              <div key={category.id} className="mb-8">
                <h2 className="text-xl font-bold mb-4">
                  {lang === 'ar' && category.nameAr ? category.nameAr : category.name}
                </h2>
                {category.items.length === 0 ? (
                  <p className="text-gray-500 text-sm">No items in this category.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.items.map((item) => {
                      const itemOffer = getItemOffer(item, category.id);
                      const primaryImage = item.images?.find((img) => img.isPrimary)?.url || item.imageUrl;

                      return (
                        <div
                          key={item.id}
                          className={clsx(
                            'card overflow-hidden flex relative',
                            !item.isAvailable && 'opacity-60'
                          )}
                        >
                          {/* Offer badge */}
                          {itemOffer && item.isAvailable && (
                            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              {formatDiscount(itemOffer)}
                            </div>
                          )}

                          {primaryImage && (
                            <div className="relative w-28 h-28 flex-shrink-0 bg-gray-100">
                              <Image
                                src={primaryImage}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="p-3 flex-1 flex flex-col">
                            <h3 className="font-medium">
                              {lang === 'ar' && item.nameAr ? item.nameAr : item.name}
                            </h3>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {lang === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                              </p>
                            )}
                            <div className="mt-auto flex items-center justify-between pt-2">
                              <span className="font-bold text-primary-600">
                                {formatPrice(item.price, 'EGP')}
                              </span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                disabled={!item.isAvailable}
                                className="btn btn-sm btn-primary"
                              >
                                {item.isAvailable ? '+' : t('unavailable')}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
        )}
      </main>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link
              href={`/r/${slug}/cart`}
              className="btn btn-primary w-full flex items-center justify-between"
            >
              <span className="bg-white/20 px-2 py-0.5 rounded">
                {cartCount} {lang === 'ar' ? 'عناصر' : 'items'}
              </span>
              <span>{t('cart')}</span>
              <span className="font-bold">{formatPrice(cartTotal, 'EGP')}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
