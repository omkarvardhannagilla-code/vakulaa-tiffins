'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { MenuCard } from '@/components/menu/MenuCard';
import { CategoryFilter } from '@/components/menu/CategoryFilter';
import { Chatbot } from '@/components/chatbot/Chatbot';
import { AddressModal } from '@/components/shared/AddressModal';
import { useAuthStore, useLocationStore } from '@/lib/store';
import { MENU_ITEMS, getMenuByCategory } from '@/lib/menu-data';
import { MenuCategory } from '@/types';

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthStore();
  const { location, setLocation } = useLocationStore();

  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!session) router.replace('/');
  }, [session, router]);

  // Check if we need to set address
  useEffect(() => {
    if (searchParams.get('setAddress') === '1') {
      setAddressModalOpen(true);
    }
  }, [searchParams]);

  // Load location from sessionStorage on mount
  useEffect(() => {
    if (!location) {
      try {
        const stored = sessionStorage.getItem('deliveryLocation');
        if (stored) {
          const parsed = JSON.parse(stored);
          setLocation(parsed);
        } else {
          setAddressModalOpen(true);
        }
      } catch {}
    }
  }, []);

  // Filter items
  const categoryItems = getMenuByCategory(activeCategory);
  const filteredItems = searchQuery
    ? MENU_ITEMS.filter(
        item =>
          item.isAvailable &&
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryItems;

  if (!session) return null;

  const firstName = session.user.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar onOpenChatbot={() => setChatbotOpen(true)} />

      {/* Hero */}
      <div className="bg-brand-forest text-white relative overflow-hidden kolam-pattern">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-forest to-brand-leaf opacity-95" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-brand-gold text-xs uppercase tracking-widest mb-1">
              Fresh & Authentic
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Good morning, {firstName}! ☀️
            </h1>
            <p className="text-green-200 text-sm">
              {location?.address
                ? `Delivering to: ${location.address.split(',')[0]}`
                : 'What would you like for tiffin today?'}
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 relative"
          >
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search idly, dosa, vada…"
              className="w-full bg-white rounded-xl py-3 pl-10 pr-4 text-sm text-brand-charcoal outline-none shadow-md placeholder-gray-400"
            />
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Notice banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 text-xs text-amber-700">
          <span>📌</span>
          <span>
            <strong>Note:</strong> RS.5 extra for parcel · No Sambar · We Undertake Catering
          </span>
        </div>

        {/* Category filter */}
        {!searchQuery && (
          <div className="mb-5">
            <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
          </div>
        )}

        {/* Category heading */}
        {!searchQuery && (
          <div className="mb-4">
            <h2 className="font-display text-2xl text-brand-forest">
              {activeCategory === 'all' ? 'All Items' :
               activeCategory === 'breakfast' ? 'Breakfast Classics' :
               activeCategory === 'dosa' ? 'Dosa Varieties' : 'Beverages'}
            </h2>
            <div className="leaf-divider mt-1.5" style={{ margin: '6px 0 0' }} />
          </div>
        )}

        {searchQuery && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredItems.length} results for "<strong>{searchQuery}</strong>"
          </p>
        )}

        {/* Menu grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-28 md:pb-8">
            {filteredItems.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500">No items found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Chatbot */}
      <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />

      {/* Address modal */}
      {addressModalOpen && (
        <AddressModal
          autoDetect={searchParams.get('detect') === '1'}
          onClose={() => setAddressModalOpen(false)}
          onSave={addr => {
            setLocation(addr);
            sessionStorage.setItem('deliveryLocation', JSON.stringify(addr));
            setAddressModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense>
      <MenuContent />
    </Suspense>
  );
}
