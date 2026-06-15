'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Package, ChevronRight, RefreshCw, Clock } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { useAuthStore } from '@/lib/store';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_ICONS } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) { router.replace('/'); return; }
    fetchOrders();
  }, [session]);

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${session!.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error('Could not load orders');
    } finally {
      setIsLoading(false);
    }
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-brand-forest">My Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your order history</p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl hover:bg-brand-mist text-brand-forest transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="font-display text-xl text-brand-forest mb-2">No orders yet</h3>
            <p className="text-sm text-gray-400 mb-6">
              You haven't placed any orders yet. Let's change that!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-brand-forest text-white rounded-xl px-6 py-3 text-sm font-semibold"
            >
              Browse Menu →
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const itemCount = order.items.reduce((s, item) => s + item.quantity, 0);
              const statusColor = ORDER_STATUS_COLORS[order.status];
              const statusIcon = ORDER_STATUS_ICONS[order.status];

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link href={`/track/${order.id}`}>
                    <div className="bg-white rounded-2xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span
                            className="status-badge text-xs"
                            style={{
                              backgroundColor: statusColor + '20',
                              color: statusColor,
                            }}
                          >
                            {statusIcon} {ORDER_STATUS_LABELS[order.status]}
                          </span>
                          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-forest">₹{order.finalAmount}</p>
                          <p className="text-xs text-gray-400">COD</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-50 pt-3">
                        <p className="text-sm text-gray-700 line-clamp-1">
                          {order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {itemCount} item{itemCount !== 1 ? 's' : ''} · {order.deliveryAddress.split(',')[0]}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                        <span className="text-xs text-brand-leaf font-medium">
                          View Details & Track →
                        </span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
