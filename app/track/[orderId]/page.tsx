'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Phone, ChevronLeft, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  Order, OrderStatus,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_ICONS,
  DELIVERY_CHARGE, RESTAURANT_LOCATION,
} from '@/types';
import { formatDate, calculateDistance, estimateDeliveryTime } from '@/lib/utils';
import Link from 'next/link';

// Rider map is client-only (Leaflet needs `window`)
const DeliveryMap = dynamic(() => import('@/components/shared/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-brand-mist/40 text-sm text-brand-forest">
      Loading map…
    </div>
  ),
});

const RIDER_START_DELAY_MIN = 5; // rider departs 5 min after the order is placed

const STATUS_STEPS: OrderStatus[] = [
  'pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered',
];

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { session } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [now, setNow] = useState<number>(Date.now());

  // Tick every second so the rider position updates live
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!session) { router.replace('/'); return; }
    fetchOrder();
    const cleanup = setupRealtime();
    return cleanup;
  }, [session, orderId]);

  async function fetchOrder() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${session!.token}` },
      });
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data.order);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }

  function setupRealtime() {
    try {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        payload => {
          const updated = payload.new as any;
          setOrder(prev => prev ? {
            ...prev,
            status: updated.status,
            estimatedDeliveryMinutes: updated.estimated_delivery_minutes,
            rejectionReason: updated.rejection_reason,
            updatedAt: updated.updated_at,
          } : prev);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

      return () => { supabase.removeChannel(channel); };
    } catch (e) {
      console.warn('Realtime unavailable:', e);
      return () => {};
    }
  }

  if (!session) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-card shimmer h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-center p-8">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="font-display text-2xl text-brand-forest mb-2">Order Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            This order doesn't exist or you don't have access.
          </p>
          <Link href="/orders" className="bg-brand-forest text-white rounded-xl px-6 py-3 text-sm font-semibold">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const isRejected = order.status === 'rejected';
  const isDelivered = order.status === 'delivered';
  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

  // ── Live rider position (time-based) ───────────────────────────
  const hasCoords = order.deliveryLat != null && order.deliveryLng != null;
  const totalMin =
    order.estimatedDeliveryMinutes ||
    estimateDeliveryTime(order.deliveryLat ?? undefined, order.deliveryLng ?? undefined) ||
    30;
  const distanceKm = hasCoords
    ? calculateDistance(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, order.deliveryLat!, order.deliveryLng!)
    : null;
  const elapsedMin = (now - new Date(order.createdAt).getTime()) / 60000;
  const riderDeparted = elapsedMin > RIDER_START_DELAY_MIN && !isDelivered;
  const departsIn = Math.max(0, Math.ceil(RIDER_START_DELAY_MIN - elapsedMin));
  const minutesLeft = Math.max(0, Math.ceil(totalMin - elapsedMin));
  let riderProgress = 0;
  if (isDelivered) riderProgress = 1;
  else if (riderDeparted)
    riderProgress = Math.min(1, (elapsedMin - RIDER_START_DELAY_MIN) / Math.max(1, totalMin - RIDER_START_DELAY_MIN));

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-brand-leaf font-medium mb-5 hover:gap-2 transition-all"
        >
          <ChevronLeft size={16} />
          All Orders
        </Link>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-forest text-white rounded-2xl p-5 mb-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 kolam-pattern opacity-30" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-green-200 text-xs mb-1">Order #{order.id.slice(-8).toUpperCase()}</p>
                <div
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: ORDER_STATUS_COLORS[order.status] + '30',
                    color: '#fff',
                    border: `1px solid ${ORDER_STATUS_COLORS[order.status]}60`,
                  }}
                >
                  {ORDER_STATUS_ICONS[order.status]} {ORDER_STATUS_LABELS[order.status]}
                </div>
              </div>
              <button onClick={fetchOrder} className="p-2 bg-white/10 rounded-lg">
                <RefreshCw size={16} />
              </button>
            </div>

            {order.estimatedDeliveryMinutes && !isDelivered && !isRejected && (
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <Clock size={15} />
                Estimated delivery: ~{order.estimatedDeliveryMinutes} minutes
              </div>
            )}

            {isDelivered && (
              <div className="text-brand-gold text-sm font-medium flex items-center gap-1.5">
                🎉 Your tiffin has been delivered. Enjoy!
              </div>
            )}

            {isRejected && (
              <div className="text-red-300 text-sm">
                ❌ Order rejected: {order.rejectionReason || 'Please contact the restaurant'}
              </div>
            )}

            <p className="text-green-200/70 text-xs mt-2">
              Last updated: {formatDate(order.updatedAt)}
            </p>
          </div>
        </motion.div>

        {/* Live rider map */}
        {hasCoords && !isRejected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-4 mb-4 shadow-card"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-brand-charcoal text-sm">Live Delivery</h3>
              {distanceKm != null && (
                <span className="text-xs text-gray-500">
                  {distanceKm.toFixed(1)} km · ~{totalMin} min
                </span>
              )}
            </div>

            <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
              <DeliveryMap
                restaurant={{ lat: RESTAURANT_LOCATION.lat, lng: RESTAURANT_LOCATION.lng }}
                customer={{ lat: order.deliveryLat!, lng: order.deliveryLng! }}
                progress={riderProgress}
              />
            </div>

            <div className="mt-3">
              {isDelivered ? (
                <p className="text-sm text-green-700 font-medium">🎉 Delivered — enjoy your meal!</p>
              ) : !riderDeparted ? (
                <p className="text-sm text-brand-forest flex items-center gap-1.5">
                  <Clock size={14} /> Preparing your order — rider departs in {departsIn} min
                </p>
              ) : (
                <p className="text-sm text-brand-forest flex items-center gap-1.5">
                  🛵 On the way! Arriving in ~{minutesLeft} min
                </p>
              )}
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-forest transition-all duration-1000"
                  style={{ width: `${Math.round(riderProgress * 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {!hasCoords && !isRejected && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card text-sm text-gray-500">
            Live map isn't available for this order (no precise location was saved).
          </div>
        )}

        {/* Timeline */}
        {!isRejected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 mb-4 shadow-card"
          >
            <h3 className="font-semibold text-brand-charcoal mb-4 text-sm">Order Progress</h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />

              <div className="space-y-5">
                {STATUS_STEPS.map((status, idx) => {
                  const isCompleted = currentStepIdx > idx;
                  const isActive = currentStepIdx === idx;
                  const isPending = currentStepIdx < idx;

                  return (
                    <div
                      key={status}
                      className={`timeline-step flex items-center gap-4 relative ${
                        isCompleted ? 'completed' : isActive ? 'active' : 'pending'
                      }`}
                    >
                      <div
                        className={`timeline-dot w-8 h-8 rounded-full flex items-center justify-center z-10 text-sm flex-shrink-0 transition-all duration-500 ${
                          isCompleted
                            ? 'bg-brand-gold text-brand-forest'
                            : isActive
                            ? 'bg-brand-forest text-white shadow-lg'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {isCompleted ? '✓' : ORDER_STATUS_ICONS[status]}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isActive ? 'text-brand-forest' :
                            isCompleted ? 'text-gray-700' : 'text-gray-300'
                          }`}
                        >
                          {ORDER_STATUS_LABELS[status]}
                        </p>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-brand-leaf mt-0.5"
                          >
                            {status === 'pending' && 'Waiting for restaurant confirmation…'}
                            {status === 'accepted' && 'Restaurant accepted your order!'}
                            {status === 'preparing' && 'Chef is cooking your tiffin fresh…'}
                            {status === 'out_for_delivery' && 'Rider is on the way to you!'}
                            {status === 'delivered' && 'Enjoy your meal!'}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Order items */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 mb-4 shadow-card"
        >
          <h3 className="font-semibold text-brand-charcoal mb-3 text-sm">Order Items</h3>
          <div className="space-y-2 mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-brand-mist text-brand-forest text-xs font-bold rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <span className="text-gray-700">{item.menuItem.name}</span>
                </div>
                <span className="font-medium text-brand-charcoal">
                  ₹{item.menuItem.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-brand-mist/60 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>₹{order.deliveryCharge}</span>
            </div>
            <div className="flex justify-between font-bold text-brand-forest text-base pt-1 border-t border-brand-leaf/10">
              <span>Total Paid</span>
              <span>₹{order.finalAmount}</span>
            </div>
            <p className="text-xs text-center text-gray-400">Cash on Delivery</p>
          </div>
        </motion.div>

        {/* Delivery info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 mb-6 shadow-card"
        >
          <h3 className="font-semibold text-brand-charcoal mb-3 text-sm">Delivery Details</h3>
          <div className="flex items-start gap-2 text-sm mb-3">
            <MapPin size={16} className="text-brand-forest flex-shrink-0 mt-0.5" />
            <p className="text-gray-600">{order.deliveryAddress}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={13} />
            <span>Placed on {formatDate(order.createdAt)}</span>
          </div>
        </motion.div>

        {/* Re-order */}
        {(isDelivered || isRejected) && (
          <Link
            href="/menu"
            className="block w-full bg-brand-forest text-white text-center rounded-xl py-3.5 text-sm font-semibold btn-plate"
          >
            Order Again →
          </Link>
        )}
      </div>
    </div>
  );
}
