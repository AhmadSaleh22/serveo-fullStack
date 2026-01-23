'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore, useLanguageStore } from '@/lib/store';
import { FormInput, FormTextarea } from '@/components/ui/FormInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_KEYS } from '@repo/shared';

interface RestaurantData {
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
}

export default function SettingsPage() {
  const { t, lang } = useLanguageStore();
  const { restaurant, setAuth, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<RestaurantData>();

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const data = await api.getMyRestaurant() as RestaurantData;
      setRestaurantData(data);
      reset(data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlugChange = async (slug: string) => {
    setValue('slug', slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    setSlugError(null);

    if (slug.length >= 3) {
      try {
        const { available } = await api.checkSlug(slug);
        if (!available) {
          setSlugError('This URL is already taken');
        }
      } catch {
        // Ignore errors
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const { url } = await api.uploadImage(file);
      setValue('logoUrl', url);
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleHoursChange = (
    day: string,
    field: 'open' | 'close' | 'isOpen',
    value: string | boolean
  ) => {
    const current = watch('hoursJson') || {};
    setValue('hoursJson', {
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    });
  };

  const onSubmit = async (data: RestaurantData) => {
    if (slugError) {
      toast.error('Please fix the URL before saving');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await api.updateRestaurant({
        name: data.name,
        nameAr: data.nameAr,
        slug: data.slug,
        phone: data.phone,
        whatsappEnabled: data.whatsappEnabled,
        logoUrl: data.logoUrl,
        address: data.address,
        addressAr: data.addressAr,
        hoursJson: data.hoursJson,
        minOrder: data.minOrder,
        deliveryFee: data.deliveryFee,
      }) as RestaurantData;

      setRestaurantData(updated);
      setAuth(user, { id: updated.id, name: updated.name, slug: updated.slug });
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
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

  const hoursJson = watch('hoursJson') || {};
  const days = DAYS_OF_WEEK[lang];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
        <p className="text-gray-600 mt-1">Configure your restaurant settings</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Restaurant Name (English)"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
              />
              <FormInput
                label="Restaurant Name (Arabic)"
                dir="rtl"
                {...register('nameAr')}
              />
            </div>

            <div>
              <label className="label">Public URL</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">/r/</span>
                <input
                  className={`input flex-1 ${slugError ? 'input-error' : ''}`}
                  {...register('slug')}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
              </div>
              {slugError && <p className="text-sm text-red-500 mt-1">{slugError}</p>}
              {!slugError && restaurant && (
                <p className="text-sm text-gray-500 mt-1">
                  Your menu will be available at: {typeof window !== 'undefined' ? window.location.origin : ''}/r/{watch('slug')}
                </p>
              )}
            </div>

            {/* Logo */}
            <div>
              <label className="label">Logo</label>
              <div className="flex items-center gap-4">
                {watch('logoUrl') && (
                  <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={watch('logoUrl') || ''}
                      alt="Logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <label className="btn btn-secondary cursor-pointer">
                  {isUploadingLogo ? <LoadingSpinner size="sm" /> : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Delivery */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Contact & Delivery</h2>
          <div className="space-y-4">
            <FormInput
              label="Phone Number (for orders)"
              placeholder="01012345678"
              {...register('phone', {
                required: 'Phone is required',
                pattern: {
                  value: /^01[0125][0-9]{8}$/,
                  message: 'Invalid Egyptian phone number',
                },
              })}
              error={errors.phone?.message}
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="whatsappEnabled"
                className="w-4 h-4 rounded border-gray-300"
                {...register('whatsappEnabled')}
              />
              <label htmlFor="whatsappEnabled">
                Enable WhatsApp orders (customers will be redirected to WhatsApp)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextarea
                label="Address (English)"
                {...register('address')}
              />
              <FormTextarea
                label="Address (Arabic)"
                dir="rtl"
                {...register('addressAr')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Minimum Order (EGP)"
                type="number"
                min="0"
                step="1"
                {...register('minOrder', { valueAsNumber: true })}
              />
              <FormInput
                label="Delivery Fee (EGP)"
                type="number"
                min="0"
                step="1"
                {...register('deliveryFee', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('working_hours')}</h2>
          <div className="space-y-3">
            {DAYS_OF_WEEK_KEYS.map((dayKey, index) => {
              const dayHours = hoursJson[dayKey] || { open: '10:00', close: '22:00', isOpen: true };
              return (
                <div key={dayKey} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-24 font-medium">{days[index]}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dayHours.isOpen}
                      onChange={(e) => handleHoursChange(dayKey, 'isOpen', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-500">Open</span>
                  </div>
                  {dayHours.isOpen && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={dayHours.open}
                        onChange={(e) => handleHoursChange(dayKey, 'open', e.target.value)}
                        className="input w-auto"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={dayHours.close}
                        onChange={(e) => handleHoursChange(dayKey, 'close', e.target.value)}
                        className="input w-auto"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary btn-lg"
          >
            {isSaving ? <LoadingSpinner size="sm" /> : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
