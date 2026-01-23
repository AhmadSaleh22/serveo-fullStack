'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useLanguageStore } from '@/lib/store';
import { FormInput, FormTextarea } from '@/components/ui/FormInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  metaTitle?: string;
  metaTitleAr?: string;
  metaDescription?: string;
  metaDescriptionAr?: string;
  keywords?: string;
  keywordsAr?: string;
}

const seoSchema = z.object({
  metaTitle: z.string().max(70, 'Max 70 characters').optional(),
  metaTitleAr: z.string().max(70, 'Max 70 characters').optional(),
  metaDescription: z.string().max(160, 'Max 160 characters').optional(),
  metaDescriptionAr: z.string().max(160, 'Max 160 characters').optional(),
  keywords: z.string().max(200, 'Max 200 characters').optional(),
  keywordsAr: z.string().max(200, 'Max 200 characters').optional(),
});

type SeoForm = z.infer<typeof seoSchema>;

export default function SeoPage() {
  const { t } = useLanguageStore();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SeoForm>({
    resolver: zodResolver(seoSchema),
  });

  const watchMetaTitle = form.watch('metaTitle');
  const watchMetaDescription = form.watch('metaDescription');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = (await api.getMyRestaurant()) as Restaurant;
      setRestaurant(data);
      form.reset({
        metaTitle: data.metaTitle || '',
        metaTitleAr: data.metaTitleAr || '',
        metaDescription: data.metaDescription || '',
        metaDescriptionAr: data.metaDescriptionAr || '',
        keywords: data.keywords || '',
        keywordsAr: data.keywordsAr || '',
      });
    } catch (error) {
      toast.error('Failed to load restaurant data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: SeoForm) => {
    setIsSaving(true);
    try {
      await api.updateRestaurant(data);
      toast.success('SEO settings saved');
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const siteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${restaurant?.slug}`
    : '';

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Optimize your restaurant page for search engines
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-8">
        {/* Preview Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Google Preview</h2>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-blue-700 text-lg font-medium hover:underline cursor-pointer truncate">
              {watchMetaTitle || restaurant?.name || 'Your Restaurant Name'}
            </div>
            <div className="text-green-700 text-sm truncate">{siteUrl}</div>
            <div className="text-gray-600 text-sm mt-1 line-clamp-2">
              {watchMetaDescription ||
                `Order delicious food from ${restaurant?.name}. Fast delivery and great prices.`}
            </div>
          </div>
        </div>

        {/* English SEO */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">English SEO</h2>
          <div className="space-y-4">
            <div>
              <FormInput
                label={`Meta Title (${(watchMetaTitle?.length || 0)}/70)`}
                placeholder="e.g., Best Restaurant in Cairo | Delicious Food Delivery"
                error={form.formState.errors.metaTitle?.message}
                {...form.register('metaTitle')}
              />
              <p className="text-xs text-gray-500 mt-1">
                Appears as the clickable headline in search results
              </p>
            </div>

            <div>
              <FormTextarea
                label={`Meta Description (${(watchMetaDescription?.length || 0)}/160)`}
                placeholder="e.g., Order delicious Egyptian food from our restaurant. Fast delivery, fresh ingredients, and amazing taste. Try our famous Koshari and Shawarma!"
                error={form.formState.errors.metaDescription?.message}
                {...form.register('metaDescription')}
              />
              <p className="text-xs text-gray-500 mt-1">
                The snippet shown under the title in search results
              </p>
            </div>

            <div>
              <FormInput
                label="Keywords"
                placeholder="e.g., restaurant, food, delivery, cairo, egypt, shawarma"
                error={form.formState.errors.keywords?.message}
                {...form.register('keywords')}
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated keywords related to your restaurant
              </p>
            </div>
          </div>
        </div>

        {/* Arabic SEO */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Arabic SEO (العربية)</h2>
          <div className="space-y-4">
            <div>
              <FormInput
                label="Meta Title (العنوان)"
                dir="rtl"
                placeholder="مثال: أفضل مطعم في القاهرة | توصيل طعام لذيذ"
                error={form.formState.errors.metaTitleAr?.message}
                {...form.register('metaTitleAr')}
              />
            </div>

            <div>
              <FormTextarea
                label="Meta Description (الوصف)"
                dir="rtl"
                placeholder="مثال: اطلب أشهى الأكلات المصرية من مطعمنا. توصيل سريع ومكونات طازجة. جرب الكشري والشاورما الشهيرة!"
                error={form.formState.errors.metaDescriptionAr?.message}
                {...form.register('metaDescriptionAr')}
              />
            </div>

            <div>
              <FormInput
                label="Keywords (الكلمات المفتاحية)"
                dir="rtl"
                placeholder="مثال: مطعم، طعام، توصيل، القاهرة، مصر، شاورما"
                error={form.formState.errors.keywordsAr?.message}
                {...form.register('keywordsAr')}
              />
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-3 text-blue-900">SEO Tips</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Keep meta titles under 60 characters for best display</li>
            <li>• Meta descriptions should be 120-160 characters</li>
            <li>• Include your location (e.g., Cairo, Egypt) in titles</li>
            <li>• Use relevant keywords naturally, avoid keyword stuffing</li>
            <li>• Write unique descriptions that encourage clicks</li>
            <li>• Include your best-selling dishes or specialties</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary px-8"
          >
            {isSaving ? <LoadingSpinner size="sm" /> : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
