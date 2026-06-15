import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vakulaa Tiffins – Authentic South Indian Tiffins, Hyderabad',
  description:
    'Order fresh, authentic South Indian tiffins from Vakulaa Tiffins, Hyderabad. Crispy dosas, soft idlis, vadas, pongal and more — delivered to your doorstep with AI-powered ordering.',
  keywords: [
    'Vakulaa Tiffins',
    'South Indian food Hyderabad',
    'Dosa delivery',
    'Idly delivery',
    'Tiffin center Hyderabad',
    'Online tiffin order',
  ],
  authors: [{ name: 'Vakulaa Tiffins' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'Vakulaa Tiffins – Authentic South Indian Tiffins',
    description: 'Fresh, authentic South Indian tiffins delivered to your door.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Vakulaa Tiffins',
  },
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F4C25',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-brand-cream text-brand-charcoal antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0F4C25',
              color: '#fff',
              fontFamily: 'var(--font-dm-sans)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#F2C84B', secondary: '#0F4C25' },
            },
            error: {
              style: { background: '#DC2626', color: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
