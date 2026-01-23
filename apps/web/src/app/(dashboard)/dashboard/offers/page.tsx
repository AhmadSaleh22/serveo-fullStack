'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useLanguageStore } from '@/lib/store';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/FormInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@repo/shared';
import clsx from 'clsx';

interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

interface Item {
  id: string;
  name: string;
  nameAr?: string;
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
  targetCategory?: { id: string; name: string; nameAr?: string };
  targetItem?: { id: string; name: string; nameAr?: string };
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

const offerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'BUNDLE']),
  discountValue: z.number().min(0, 'Value must be positive'),
  targetType: z.enum(['GLOBAL', 'CATEGORY', 'ITEM']),
  targetCategoryId: z.string().optional(),
  targetItemId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true),
});

type OfferForm = z.infer<typeof offerSchema>;

export default function OffersPage() {
  const { t, lang } = useLanguageStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<OfferForm>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      discountType: 'PERCENTAGE',
      targetType: 'GLOBAL',
      isActive: true,
    },
  });

  const watchTargetType = form.watch('targetType');
  const watchDiscountType = form.watch('discountType');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [offersData, categoriesData, itemsData] = await Promise.all([
        api.getOffers(),
        api.getCategories(),
        api.getItems(),
      ]);
      setOffers(offersData as unknown as Offer[]);
      setCategories(categoriesData as unknown as Category[]);
      setItems(itemsData as unknown as Item[]);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message?.includes('403') || err.message?.includes('PRO')) {
        toast.error('This feature requires a PRO plan');
      } else {
        toast.error('Failed to load offers');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      form.reset({
        title: offer.title,
        titleAr: offer.titleAr || '',
        description: offer.description || '',
        descriptionAr: offer.descriptionAr || '',
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        targetType: offer.targetType,
        targetCategoryId: offer.targetCategoryId || '',
        targetItemId: offer.targetItemId || '',
        startDate: offer.startDate.slice(0, 16),
        endDate: offer.endDate.slice(0, 16),
        isActive: offer.isActive,
      });
    } else {
      setEditingOffer(null);
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      form.reset({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        targetType: 'GLOBAL',
        targetCategoryId: '',
        targetItemId: '',
        startDate: now.toISOString().slice(0, 16),
        endDate: nextWeek.toISOString().slice(0, 16),
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async (data: OfferForm) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        targetCategoryId: data.targetType === 'CATEGORY' ? data.targetCategoryId : undefined,
        targetItemId: data.targetType === 'ITEM' ? data.targetItemId : undefined,
      };

      if (editingOffer) {
        await api.updateOffer(editingOffer.id, payload);
        toast.success('Offer updated');
      } else {
        await api.createOffer(payload);
        toast.success('Offer created');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      await api.deleteOffer(id);
      toast.success('Offer deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleOffer(id);
      fetchData();
    } catch (error) {
      toast.error('Failed to toggle offer');
    }
  };

  const formatDiscountValue = (offer: Offer) => {
    if (offer.discountType === 'PERCENTAGE') {
      return `${offer.discountValue}%`;
    }
    return formatCurrency(offer.discountValue, 'EGP');
  };

  const isOfferActive = (offer: Offer) => {
    const now = new Date();
    return offer.isActive && new Date(offer.startDate) <= now && new Date(offer.endDate) >= now;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers & Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create discounts and special offers for your customers
          </p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          + Add Offer
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🎁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first offer to attract more customers
          </p>
          <button onClick={() => openModal()} className="btn btn-primary">
            Create Offer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={clsx(
                'card p-4',
                !isOfferActive(offer) && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-lg">
                      {lang === 'ar' && offer.titleAr ? offer.titleAr : offer.title}
                    </h3>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        isOfferActive(offer)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {isOfferActive(offer) ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {offer.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {lang === 'ar' && offer.descriptionAr
                        ? offer.descriptionAr
                        : offer.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                    <span className="font-bold text-primary-600">
                      {offer.discountType === 'PERCENTAGE' ? '🏷️' : '💰'}{' '}
                      {formatDiscountValue(offer)} OFF
                    </span>
                    <span className="text-gray-500">
                      📍{' '}
                      {offer.targetType === 'GLOBAL'
                        ? 'All Items'
                        : offer.targetType === 'CATEGORY'
                        ? `Category: ${offer.targetCategory?.name || 'N/A'}`
                        : `Item: ${offer.targetItem?.name || 'N/A'}`}
                    </span>
                    <span className="text-gray-500">
                      📅 {new Date(offer.startDate).toLocaleDateString()} -{' '}
                      {new Date(offer.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(offer.id)}
                    className={clsx(
                      'btn btn-sm',
                      offer.isActive ? 'btn-secondary' : 'btn-primary'
                    )}
                  >
                    {offer.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openModal(offer)}
                    className="btn btn-sm btn-secondary"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="btn btn-sm btn-danger"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingOffer ? 'Edit Offer' : 'Create Offer'}
            </h2>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Title (English)"
                  error={form.formState.errors.title?.message}
                  {...form.register('title')}
                />
                <FormInput
                  label="Title (Arabic)"
                  dir="rtl"
                  {...form.register('titleAr')}
                />
              </div>

              <FormTextarea
                label="Description (English)"
                {...form.register('description')}
              />
              <FormTextarea
                label="Description (Arabic)"
                dir="rtl"
                {...form.register('descriptionAr')}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Discount Type"
                  options={[
                    { value: 'PERCENTAGE', label: 'Percentage (%)' },
                    { value: 'FIXED', label: 'Fixed Amount (EGP)' },
                  ]}
                  {...form.register('discountType')}
                />
                <FormInput
                  label={
                    watchDiscountType === 'PERCENTAGE'
                      ? 'Discount (%)'
                      : 'Discount (EGP)'
                  }
                  type="number"
                  step="0.01"
                  error={form.formState.errors.discountValue?.message}
                  {...form.register('discountValue', { valueAsNumber: true })}
                />
              </div>

              <FormSelect
                label="Apply To"
                options={[
                  { value: 'GLOBAL', label: 'All Items' },
                  { value: 'CATEGORY', label: 'Specific Category' },
                  { value: 'ITEM', label: 'Specific Item' },
                ]}
                {...form.register('targetType')}
              />

              {watchTargetType === 'CATEGORY' && (
                <FormSelect
                  label="Select Category"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  {...form.register('targetCategoryId')}
                />
              )}

              {watchTargetType === 'ITEM' && (
                <FormSelect
                  label="Select Item"
                  options={items.map((i) => ({ value: i.id, label: i.name }))}
                  {...form.register('targetItemId')}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Start Date"
                  type="datetime-local"
                  error={form.formState.errors.startDate?.message}
                  {...form.register('startDate')}
                />
                <FormInput
                  label="End Date"
                  type="datetime-local"
                  error={form.formState.errors.endDate?.message}
                  {...form.register('endDate')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 rounded border-gray-300"
                  {...form.register('isActive')}
                />
                <label htmlFor="isActive" className="text-sm">
                  Active (offer is live when dates are valid)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary flex-1"
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
