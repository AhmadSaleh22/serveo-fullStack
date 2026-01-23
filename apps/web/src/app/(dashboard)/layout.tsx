'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useAuthStore, useLanguageStore } from '@/lib/store';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'dashboard', icon: '📊' },
  { href: '/dashboard/menu', label: 'menu', icon: '📋' },
  { href: '/dashboard/orders', label: 'orders', icon: '📦' },
  { href: '/dashboard/offers', label: 'offers', icon: '🎁' },
  { href: '/dashboard/tables', label: 'tables', icon: '🪑' },
  { href: '/dashboard/seo', label: 'seo', icon: '🔍' },
  { href: '/dashboard/settings', label: 'settings', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, restaurant, clearAuth } = useAuthStore();
  const { t, lang } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    clearAuth();
    router.replace('/login');
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className={clsx('min-h-screen bg-gray-50', lang === 'ar' && 'rtl')} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 px-4 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold truncate">{restaurant?.name}</span>
        <LanguageToggle />
      </header>

      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300',
          lang === 'ar' ? 'right-0' : 'left-0',
          isSidebarOpen ? 'translate-x-0' : lang === 'ar' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Serveo" className="w-8 h-8" />
            <span className="font-bold text-gray-900">Serveo</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                pathname === item.href
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span>{item.icon}</span>
              <span>{t(item.label)}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="hidden lg:block">
              <LanguageToggle />
            </div>
          </div>

          {restaurant && (
            <Link
              href={`/r/${restaurant.slug}`}
              target="_blank"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-3"
            >
              <span>🌐</span>
              <span>{t('menu')}</span>
            </Link>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 truncate">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={clsx(
        'pt-16 lg:pt-0 min-h-screen',
        lang === 'ar' ? 'lg:mr-64' : 'lg:ml-64'
      )}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
