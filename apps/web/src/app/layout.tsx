import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Serveo - Restaurant Orders via WhatsApp | سيرفيو',
  description: 'Create your digital menu, receive orders directly on WhatsApp. No commissions, no apps to install. Perfect for restaurants and cafes in Egypt.',
  keywords: 'restaurant ordering, WhatsApp orders, digital menu, QR code menu, Egypt restaurants, مينيو ديجيتال, طلبات واتساب',
  openGraph: {
    title: 'Serveo - Restaurant Orders via WhatsApp',
    description: 'Create your digital menu and receive orders on WhatsApp. Zero commission fees.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_EG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Serveo - Restaurant Orders via WhatsApp',
    description: 'Create your digital menu and receive orders on WhatsApp. Zero commission fees.',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '12px',
            },
            success: {
              style: {
                background: '#0d9488',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#0d9488',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
