'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useLanguageStore } from '@/lib/store';
import { FormInput } from '@/components/ui/FormInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import clsx from 'clsx';

interface Table {
  id: string;
  number: number;
  name?: string;
  capacity: number;
  isActive: boolean;
  qrCodeUrl?: string;
  createdAt: string;
}

const tableSchema = z.object({
  number: z.number().min(1, 'Table number is required'),
  name: z.string().optional(),
  capacity: z.number().min(1).default(4),
  isActive: z.boolean().default(true),
});

const bulkSchema = z.object({
  startNumber: z.number().min(1, 'Start number is required'),
  count: z.number().min(1).max(50, 'Max 50 tables at once'),
  capacity: z.number().min(1).default(4),
});

type TableForm = z.infer<typeof tableSchema>;
type BulkForm = z.infer<typeof bulkSchema>;

export default function TablesPage() {
  const { t } = useLanguageStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{
    tableNumber: number;
    menuUrl: string;
    qrCodeUrl: string;
  } | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TableForm>({
    resolver: zodResolver(tableSchema),
    defaultValues: { capacity: 4, isActive: true },
  });

  const bulkForm = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { startNumber: 1, count: 10, capacity: 4 },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.getTables();
      setTables(data as unknown as Table[]);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message?.includes('403') || err.message?.includes('PREMIUM')) {
        toast.error('This feature requires a PREMIUM plan');
      } else {
        toast.error('Failed to load tables');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      form.reset({
        number: table.number,
        name: table.name || '',
        capacity: table.capacity,
        isActive: table.isActive,
      });
    } else {
      setEditingTable(null);
      const nextNumber = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
      form.reset({
        number: nextNumber,
        name: '',
        capacity: 4,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async (data: TableForm) => {
    setIsSaving(true);
    try {
      if (editingTable) {
        await api.updateTable(editingTable.id, {
          name: data.name,
          capacity: data.capacity,
          isActive: data.isActive,
        });
        toast.success('Table updated');
      } else {
        await api.createTable(data);
        toast.success('Table created');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save table');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkCreate = async (data: BulkForm) => {
    setIsSaving(true);
    try {
      const result = (await api.createTablesBulk(data)) as { created: number; message: string };
      toast.success(result.message);
      setShowBulkModal(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create tables');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      await api.deleteTable(id);
      toast.success('Table deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete table');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleTable(id);
      fetchData();
    } catch (error) {
      toast.error('Failed to toggle table');
    }
  };

  const handleShowQR = async (id: string) => {
    try {
      const data = await api.getTableQR(id);
      setQrData(data);
      setShowQRModal(true);
    } catch (error) {
      toast.error('Failed to get QR code');
    }
  };

  const handlePrintQR = () => {
    if (!qrData) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Table ${qrData.tableNumber} QR Code</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif; }
              h1 { margin-bottom: 20px; }
              img { width: 300px; height: 300px; }
              p { margin-top: 20px; color: #666; }
            </style>
          </head>
          <body>
            <h1>Table ${qrData.tableNumber}</h1>
            <img src="${qrData.qrCodeUrl}" alt="QR Code" />
            <p>Scan to view menu</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage dine-in tables and generate QR codes
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary">
            + Bulk Add
          </button>
          <button onClick={() => openModal()} className="btn btn-primary">
            + Add Table
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🪑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tables yet</h3>
          <p className="text-gray-500 mb-4">
            Create tables for dine-in customers
          </p>
          <div className="flex justify-center gap-2">
            <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary">
              Create Multiple Tables
            </button>
            <button onClick={() => openModal()} className="btn btn-primary">
              Create Single Table
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={clsx(
                'card p-4',
                !table.isActive && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold">Table {table.number}</h3>
                  {table.name && (
                    <p className="text-sm text-gray-600">{table.name}</p>
                  )}
                </div>
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    table.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {table.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span>👥 Capacity: {table.capacity}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleShowQR(table.id)}
                  className="btn btn-sm btn-primary"
                >
                  📱 QR Code
                </button>
                <button
                  onClick={() => handleToggle(table.id)}
                  className="btn btn-sm btn-secondary"
                >
                  {table.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => openModal(table)}
                  className="btn btn-sm btn-secondary"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleDelete(table.id)}
                  className="btn btn-sm btn-danger"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingTable ? 'Edit Table' : 'Add Table'}
            </h2>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              {!editingTable && (
                <FormInput
                  label="Table Number"
                  type="number"
                  error={form.formState.errors.number?.message}
                  {...form.register('number', { valueAsNumber: true })}
                />
              )}
              <FormInput
                label="Name (Optional)"
                placeholder="e.g., Window Table, VIP"
                {...form.register('name')}
              />
              <FormInput
                label="Seating Capacity"
                type="number"
                error={form.formState.errors.capacity?.message}
                {...form.register('capacity', { valueAsNumber: true })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 rounded border-gray-300"
                  {...form.register('isActive')}
                />
                <label htmlFor="isActive" className="text-sm">
                  Active (table is available for orders)
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

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create Multiple Tables</h2>
            <form onSubmit={bulkForm.handleSubmit(handleBulkCreate)} className="space-y-4">
              <FormInput
                label="Starting Table Number"
                type="number"
                error={bulkForm.formState.errors.startNumber?.message}
                {...bulkForm.register('startNumber', { valueAsNumber: true })}
              />
              <FormInput
                label="Number of Tables"
                type="number"
                error={bulkForm.formState.errors.count?.message}
                {...bulkForm.register('count', { valueAsNumber: true })}
              />
              <FormInput
                label="Seating Capacity (for all)"
                type="number"
                error={bulkForm.formState.errors.capacity?.message}
                {...bulkForm.register('capacity', { valueAsNumber: true })}
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary flex-1"
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : 'Create Tables'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Table {qrData.tableNumber} QR Code</h2>
            <div className="relative w-64 h-64 mx-auto mb-4">
              <Image
                src={qrData.qrCodeUrl}
                alt={`Table ${qrData.tableNumber} QR Code`}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-gray-600 mb-2">Menu URL:</p>
            <a
              href={qrData.menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline text-sm break-all"
            >
              {qrData.menuUrl}
            </a>
            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setShowQRModal(false)}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
              <button onClick={handlePrintQR} className="btn btn-primary flex-1">
                🖨️ Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
