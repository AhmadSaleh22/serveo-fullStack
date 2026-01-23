import type { Metadata } from 'next';

interface Restaurant {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  phone: string;
  logoUrl?: string;
  address: string;
  addressAr?: string;
  currency: string;
  metaTitle?: string;
  metaTitleAr?: string;
  metaDescription?: string;
  metaDescriptionAr?: string;
  keywords?: string;
  keywordsAr?: string;
  categories: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
      price: number;
      imageUrl?: string;
      images?: { url: string; isPrimary: boolean }[];
    }[];
  }[];
}

async function getRestaurant(slug: string): Promise<Restaurant | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/public/restaurants/${slug}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const restaurant = await getRestaurant(params.slug);

  if (!restaurant) {
    return {
      title: 'Restaurant Not Found',
      description: 'The restaurant you are looking for does not exist.',
    };
  }

  // Use custom SEO fields if available, fallback to defaults
  const title = restaurant.metaTitle || `${restaurant.name} - Order Online`;
  const description =
    restaurant.metaDescription ||
    `Order delicious food from ${restaurant.name}. Browse our menu and place your order for delivery or dine-in.`;
  const keywords = restaurant.keywords || `${restaurant.name}, food delivery, restaurant, online ordering`;

  // Get primary image or first item image for Open Graph
  let ogImage = restaurant.logoUrl;
  if (!ogImage && restaurant.categories.length > 0) {
    for (const cat of restaurant.categories) {
      for (const item of cat.items) {
        const primaryImg = item.images?.find((img) => img.isPrimary)?.url || item.imageUrl;
        if (primaryImg) {
          ogImage = primaryImg;
          break;
        }
      }
      if (ogImage) break;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/r/${restaurant.slug}`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Serveo',
      type: 'website',
      locale: 'en_EG',
      alternateLocale: 'ar_EG',
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: restaurant.name,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function generateJsonLd(restaurant: Restaurant) {
  // Calculate price range from menu items
  let minPrice = Infinity;
  let maxPrice = 0;
  let menuItems: {
    '@type': 'MenuItem';
    name: string;
    offers: { '@type': 'Offer'; price: number; priceCurrency: string };
    image?: string;
  }[] = [];

  for (const category of restaurant.categories) {
    for (const item of category.items) {
      if (item.price < minPrice) minPrice = item.price;
      if (item.price > maxPrice) maxPrice = item.price;

      const itemImage = item.images?.find((img) => img.isPrimary)?.url || item.imageUrl;
      menuItems.push({
        '@type': 'MenuItem',
        name: item.name,
        offers: {
          '@type': 'Offer',
          price: item.price,
          priceCurrency: restaurant.currency,
        },
        ...(itemImage && { image: itemImage }),
      });
    }
  }

  const priceRange =
    minPrice === Infinity ? '$' : minPrice === maxPrice ? `${minPrice} EGP` : `${minPrice}-${maxPrice} EGP`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    url: `${baseUrl}/r/${restaurant.slug}`,
    telephone: restaurant.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address,
      addressCountry: 'EG',
    },
    ...(restaurant.logoUrl && { image: restaurant.logoUrl }),
    priceRange,
    servesCuisine: 'Egyptian',
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: restaurant.categories.map((cat) => ({
        '@type': 'MenuSection',
        name: cat.name,
        hasMenuItem: cat.items.map((item) => {
          const itemImage = item.images?.find((img) => img.isPrimary)?.url || item.imageUrl;
          return {
            '@type': 'MenuItem',
            name: item.name,
            offers: {
              '@type': 'Offer',
              price: item.price,
              priceCurrency: restaurant.currency,
            },
            ...(itemImage && { image: itemImage }),
          };
        }),
      })),
    },
    potentialAction: {
      '@type': 'OrderAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/r/${restaurant.slug}`,
        actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
      },
      deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeOwnFleet'],
    },
  };
}

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const restaurant = await getRestaurant(params.slug);

  return (
    <>
      {restaurant && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateJsonLd(restaurant)),
          }}
        />
      )}
      {children}
    </>
  );
}
