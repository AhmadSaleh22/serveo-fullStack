'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore, useLanguageStore } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@repo/shared';

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

export default function DashboardPage() {
  const { restaurant } = useAuthStore();
  const { t } = useLanguageStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your restaurant.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('total_orders')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.totalOrders || 0}
                </p>
                <p className="text-xs text-gray-400">Last 30 days</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('total_revenue')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.totalRevenue || 0, 'EGP')}
                </p>
                <p className="text-xs text-gray-400">Last 30 days</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('today_orders')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.todayOrders || 0}
                </p>
                <p className="text-xs text-gray-400">Today</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/dashboard/menu"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">📋</span>
              <div>
                <p className="font-medium">{t('menu')}</p>
                <p className="text-sm text-gray-500">Manage categories and items</p>
              </div>
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">📦</span>
              <div>
                <p className="font-medium">{t('orders')}</p>
                <p className="text-sm text-gray-500">View and manage orders</p>
              </div>
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">⚙️</span>
              <div>
                <p className="font-medium">{t('settings')}</p>
                <p className="text-sm text-gray-500">Restaurant settings</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Public Menu</h3>
          {restaurant && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Share this link with your customers to receive orders:
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700 truncate flex-1">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/r/{restaurant.slug}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/r/${restaurant.slug}`);
                  }}
                  className="btn btn-sm btn-secondary"
                >
                  Copy
                </button>
              </div>
              <Link
                href={`/r/${restaurant.slug}`}
                target="_blank"
                className="btn btn-primary w-full"
              >
                View Menu
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
