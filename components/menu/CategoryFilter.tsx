'use client';

import { motion } from 'framer-motion';
import { MenuCategory } from '@/types';
import { CATEGORIES } from '@/lib/menu-data';

interface CategoryFilterProps {
  active: MenuCategory | 'all';
  onChange: (category: MenuCategory | 'all') => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map(cat => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id as MenuCategory | 'all')}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? 'text-white shadow-md'
                : 'text-gray-500 bg-white border border-gray-100 hover:border-brand-mist hover:text-brand-forest'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="category-pill"
                className="absolute inset-0 bg-brand-forest rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{cat.emoji}</span>
            <span className="relative z-10">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
