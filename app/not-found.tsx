import Link from 'next/link';
import { VakulaaLogo } from '@/components/shared/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 text-center">
      <VakulaaLogo size={56} className="mb-6" />

      <div className="text-7xl mb-4">🍽️</div>
      <h1 className="font-display text-4xl text-brand-forest mb-2">
        Page Not Found
      </h1>
      <p className="text-gray-500 text-sm mb-8 max-w-xs">
        Looks like this page went out for delivery and never came back!
      </p>

      <Link
        href="/menu"
        className="inline-flex items-center gap-2 bg-brand-forest text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-brand-leaf transition-colors"
      >
        🌿 Back to Menu
      </Link>

      <p className="text-xs text-gray-400 mt-8">
        Vakulaa Tiffins · Authentic South Indian Tiffins · Hyderabad
      </p>
    </div>
  );
}
