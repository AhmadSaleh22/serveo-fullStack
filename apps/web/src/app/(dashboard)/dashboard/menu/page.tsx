'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
  sortOrder: number;
  _count?: { items: number };
}

interface Item {
  id: string;
  categoryId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  category?: { id: string; name: string; nameAr?: string };
}

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
});

const itemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;
type ItemForm = z.infer<typeof itemSchema>;

export default function MenuPage() {
  const { t, lang } = useLanguageStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const categoryForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { sortOrder: 0 },
  });

  const itemForm = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { isAvailable: true, price: 0 },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        api.getCategories(),
        api.getItems(),
      ]);
      setCategories(categoriesData as unknown as Category[]);
      setItems(itemsData as unknown as Item[]);
    } catch (error) {
      toast.error('Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  // Category handlers
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        nameAr: category.nameAr || '',
        sortOrder: category.sortOrder,
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset({ name: '', nameAr: '', sortOrder: categories.length });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (data: CategoryForm) => {
    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, data);
        toast.success('Category updated');
      } else {
        await api.createCategory(data);
        toast.success('Category created');
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure? This will delete all items in this category.')) return;

    try {
      await api.deleteCategory(id);
      toast.success('Category deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  // Item handlers
  const openItemModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      itemForm.reset({
        categoryId: item.categoryId,
        name: item.name,
        nameAr: item.nameAr || '',
        description: item.description || '',
        descriptionAr: item.descriptionAr || '',
        price: item.price,
        imageUrl: item.imageUrl || '',
        isAvailable: item.isAvailable,
      });
    } else {
      setEditingItem(null);
      itemForm.reset({
        categoryId: categories[0]?.id || '',
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        price: 0,
        imageUrl: '',
        isAvailable: true,
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (data: ItemForm) => {
    setIsSavingItem(true);
    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, data);
        toast.success('Item updated');
      } else {
        await api.createItem(data);
        toast.success('Item created');
      }
      setShowItemModal(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save item');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.deleteItem(id);
      toast.success('Item deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await api.toggleItemAvailability(id);
      fetchData();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { url } = await api.uploadImage(file);
      itemForm.setValue('imageUrl', url);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('menu')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'categories'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {t('categories')} ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'items'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {t('items')} ({items.length})
          </button>
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => openCategoryModal()} className="btn btn-primary">
              + {t('add_category')}
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-500">No categories yet. Create your first category!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{lang === 'ar' && category.nameAr ? category.nameAr : category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {category._count?.items || 0} items
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCategoryModal(category)}
                      className="btn btn-sm btn-secondary"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="btn btn-sm btn-danger"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => openItemModal()}
              disabled={categories.length === 0}
              className="btn btn-primary"
            >
              + {t('add_item')}
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-500">Create a category first before adding items.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-500">No items yet. Add your first menu item!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="card overflow-hidden">
                  {item.imageUrl && (
                    <div className="relative h-40 bg-gray-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">
                          {lang === 'ar' && item.nameAr ? item.nameAr : item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.category?.name}
                        </p>
                      </div>
                      <span className="font-bold text-primary-600">
                        {formatCurrency(item.price, 'EGP')}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {lang === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={clsx(
                          'text-sm font-medium',
                          item.isAvailable ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {item.isAvailable ? t('available') : t('unavailable')}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openItemModal(item)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={categoryForm.handleSubmit(handleSaveCategory)} className="space-y-4">
              <FormInput
                label="Name (English)"
                error={categoryForm.formState.errors.name?.message}
                {...categoryForm.register('name')}
              />
              <FormInput
                label="Name (Arabic)"
                dir="rtl"
                {...categoryForm.register('nameAr')}
              />
              <FormInput
                label="Sort Order"
                type="number"
                {...categoryForm.register('sortOrder', { valueAsNumber: true })}
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="btn btn-primary flex-1"
                >
                  {isSavingCategory ? <LoadingSpinner size="sm" /> : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h2>
            <form onSubmit={itemForm.handleSubmit(handleSaveItem)} className="space-y-4">
              <FormSelect
                label="Category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                error={itemForm.formState.errors.categoryId?.message}
                {...itemForm.register('categoryId')}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Name (English)"
                  error={itemForm.formState.errors.name?.message}
                  {...itemForm.register('name')}
                />
                <FormInput
                  label="Name (Arabic)"
                  dir="rtl"
                  {...itemForm.register('nameAr')}
                />
              </div>

              <FormTextarea
                label="Description (English)"
                {...itemForm.register('description')}
              />
              <FormTextarea
                label="Description (Arabic)"
                dir="rtl"
                {...itemForm.register('descriptionAr')}
              />

              <FormInput
                label="Price (EGP)"
                type="number"
                step="0.01"
                error={itemForm.formState.errors.price?.message}
                {...itemForm.register('price', { valueAsNumber: true })}
              />

              <div>
                <label className="label">Image</label>
                <div className="flex items-center gap-4">
                  {itemForm.watch('imageUrl') && (
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={itemForm.watch('imageUrl') || ''}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <label className="btn btn-secondary cursor-pointer">
                    {isUploadingImage ? <LoadingSpinner size="sm" /> : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  className="w-4 h-4 rounded border-gray-300"
                  {...itemForm.register('isAvailable')}
                />
                <label htmlFor="isAvailable" className="text-sm">
                  {t('available')}
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem}
                  className="btn btn-primary flex-1"
                >
                  {isSavingItem ? <LoadingSpinner size="sm" /> : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
