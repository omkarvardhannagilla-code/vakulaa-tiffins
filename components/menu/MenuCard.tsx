'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Leaf } from 'lucide-react';
import { MenuItem } from '@/types';
import { usePlateStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MenuCardProps {
  item: MenuItem;
  index?: number;
}

export function MenuCard({ item, index = 0 }: MenuCardProps) {
  const { items, addItem, removeItem, updateQuantity } = usePlateStore();
  const [imgError, setImgError] = useState(false);

  const plateItem = items.find(i => i.menuItem.id === item.id);
  const quantity = plateItem?.quantity ?? 0;

  function handleAdd() {
    addItem(item);
    toast.success(`Added ${item.name} to your Plate!`, {
      icon: '🌿',
      duration: 1500,
    });
  }

  function handleIncrease() { addItem(item); }
  function handleDecrease() {
    if (quantity === 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, quantity - 1);
    }
  }

  const isWater = item.id === 'water';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="menu-card bg-white rounded-2xl overflow-hidden shadow-card"
    >
      {/* Image */}
      <div className="relative w-full h-44 bg-brand-mist">
        {!imgError ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {item.category === 'dosa' ? '🫓' : item.category === 'beverages' ? '☕' : '🍽️'}
          </div>
        )}

        {/* Veg badge */}
        <div className="absolute top-2 left-2 w-5 h-5 border-2 border-green-600 rounded-sm flex items-center justify-center bg-white">
          <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
        </div>

        {/* Popular badge */}
        {item.isPopular && (
          <div className="absolute top-2 right-2 bg-brand-gold text-brand-forest text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
            Popular
          </div>
        )}

        {/* Quantity overlay on image if in plate */}
        {quantity > 0 && (
          <div className="absolute inset-0 bg-brand-forest/10 flex items-center justify-center">
            <div className="bg-brand-forest text-white text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
              {quantity}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-brand-charcoal text-sm leading-tight mb-1 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed min-h-[32px]">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          {/* Price */}
          <span className="text-brand-forest font-bold text-base">
            {isWater ? 'MRP' : `₹${item.price}`}
          </span>

          {/* Add / Qty controls */}
          {isWater ? (
            <span className="text-xs text-gray-400 italic">Ask staff</span>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 bg-brand-forest text-white rounded-xl px-3 py-1.5 text-xs font-semibold btn-plate hover:bg-brand-leaf transition-colors"
            >
              <Plus size={12} />
              Add to Plate
            </button>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-brand-mist rounded-xl px-1 py-1"
              >
                <button
                  onClick={handleDecrease}
                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <Minus size={12} className="text-brand-forest" />
                </button>
                <span className="text-brand-forest font-bold text-sm min-w-[18px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  className="w-7 h-7 rounded-lg bg-brand-forest shadow-sm flex items-center justify-center hover:bg-brand-leaf transition-colors"
                >
                  <Plus size={12} className="text-white" />
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}
