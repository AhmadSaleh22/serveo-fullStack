'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useLanguageStore } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@repo/shared';
import clsx from 'clsx';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  addressJson: {
    area: string;
    street: string;
    building: string;
    floor?: string;
    apartment?: string;
  };
  notes?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'NEW' | 'CONFIRMED' | 'DELIVERING' | 'COMPLETED' | 'CANCELED';
  createdAt: string;
  items: {
    id: string;
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
  }[];
}

const statuses = ['NEW', 'CONFIRMED', 'DELIVERING', 'COMPLETED', 'CANCELED'] as const;

export default function OrdersPage() {
  const { t, lang } = useLanguageStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders(1, 100);
      setOrders(data.data as unknown as Order[]);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.updateOrderStatus(orderId, status);
      toast.success('Status updated');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: status as Order['status'] } : null);
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenWhatsApp = async (orderId: string) => {
    try {
      const data = await api.getOrderWhatsApp(orderId, lang);
      window.open(data.whatsappUrl, '_blank');
    } catch (error) {
      toast.error('Failed to generate WhatsApp message');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-EG', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('orders')}</h1>
        <p className="text-gray-600 mt-1">Last 30 days</p>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold">#{order.orderNumber}</span>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        ORDER_STATUS_COLORS[order.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[lang][order.status]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">{order.customerName}</span> • {order.customerPhone}
                    </p>
                    <p>
                      {order.addressJson.area}, {order.addressJson.street}, {order.addressJson.building}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(order.total, 'EGP')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-sm btn-secondary"
                    >
                      {t('view_order')}
                    </button>
                    <button
                      onClick={() => handleOpenWhatsApp(order.id)}
                      className="btn btn-sm btn-primary"
                    >
                      📱 WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Order #{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="label">{t('order_status')}</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedOrder.id, status)}
                    disabled={isUpdatingStatus || selectedOrder.status === status}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      selectedOrder.status === status
                        ? ORDER_STATUS_COLORS[status]
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {ORDER_STATUS_LABELS[lang][status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer info */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Customer</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Name:</span> {selectedOrder.customerName}</p>
                <p><span className="text-gray-500">Phone:</span> {selectedOrder.customerPhone}</p>
                <p>
                  <span className="text-gray-500">Address:</span>{' '}
                  {selectedOrder.addressJson.area}, {selectedOrder.addressJson.street}, Building {selectedOrder.addressJson.building}
                  {selectedOrder.addressJson.floor && `, Floor ${selectedOrder.addressJson.floor}`}
                  {selectedOrder.addressJson.apartment && `, Apt ${selectedOrder.addressJson.apartment}`}
                </p>
                {selectedOrder.notes && (
                  <p><span className="text-gray-500">Notes:</span> {selectedOrder.notes}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.nameSnapshot} x{item.quantity}
                    </span>
                    <span>{formatCurrency(item.priceSnapshot * item.quantity, 'EGP')}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('subtotal')}</span>
                    <span>{formatCurrency(selectedOrder.subtotal, 'EGP')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('delivery_fee')}</span>
                    <span>{formatCurrency(selectedOrder.deliveryFee, 'EGP')}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span>{t('total')}</span>
                    <span>{formatCurrency(selectedOrder.total, 'EGP')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary flex-1"
              >
                {t('close')}
              </button>
              <button
                onClick={() => handleOpenWhatsApp(selectedOrder.id)}
                className="btn btn-primary flex-1"
              >
                📱 {t('send_whatsapp')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
