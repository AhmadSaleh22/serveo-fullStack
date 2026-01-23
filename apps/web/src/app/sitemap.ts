import type { MetadataRoute } from 'next';

interface RestaurantSlug {
  slug: string;
  updatedAt: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Fetch all restaurant slugs
  try {
    const res = await fetch(`${apiUrl}/public/sitemap.xml`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!res.ok) {
      return staticPages;
    }

    // Parse XML to extract slugs
    const xmlText = await res.text();
    const slugMatches = Array.from(xmlText.matchAll(/<loc>[^<]*\/r\/([^<]+)<\/loc>/g));
    const restaurants: MetadataRoute.Sitemap = slugMatches.map((match) => ({
      url: `${baseUrl}/r/${match[1]}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...restaurants];
  } catch {
    return staticPages;
  }
}
