'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Phone, MapPin, Clock,
  CheckCircle, XCircle, ChefHat, Truck, Package, Eye
} from 'lucide-react';
import { VakulaaLogo } from '@/components/shared/Logo';
import { supabase } from '@/lib/supabase';
import {
  Order, OrderStatus,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_ICONS,
} from '@/types';
import { formatDate, estimateDeliveryTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'vakulaa2024';

type AdminTab = 'live' | 'all';

const STATUS_ACTIONS: {
  from: OrderStatus[];
  to: OrderStatus;
  label: string;
  icon: React.ReactNode;
  className: string;
}[] = [
  {
    from: ['pending'],
    to: 'accepted',
    label: 'Accept',
    icon: <CheckCircle size={14} />,
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  {
    from: ['accepted'],
    to: 'preparing',
    label: 'Mark Preparing',
    icon: <ChefHat size={14} />,
    className: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
  {
    from: ['preparing'],
    to: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: <Truck size={14} />,
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  {
    from: ['out_for_delivery'],
    to: 'delivered',
    label: 'Mark Delivered',
    icon: <Package size={14} />,
    className: 'bg-green-500 hover:bg-green-600 text-white',
  },
  {
    from: ['pending', 'accepted'],
    to: 'rejected',
    label: 'Reject',
    icon: <XCircle size={14} />,
    className: 'bg-red-500 hover:bg-red-600 text-white',
  },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>('live');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Check admin session
  useEffect(() => {
    const saved = sessionStorage.getItem('admin-auth');
    if (saved === 'true') setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
    const cleanup = setupRealtime();
    return cleanup;
  }, [isAuthenticated]);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin-auth', 'true');
      toast.success('Welcome, Admin! 👋');
    } else {
      toast.error('Incorrect password');
    }
  }

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'x-admin-key': ADMIN_PASSWORD },
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }

  function setupRealtime() {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => { fetchOrders(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  async function updateStatus(orderId: string, status: OrderStatus, reason?: string) {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_PASSWORD,
        },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Order ${ORDER_STATUS_LABELS[status].toLowerCase()}!`);
      fetchOrders();
    } catch {
      toast.error('Failed to update order');
    } finally {
      setUpdatingOrder(null);
    }
  }

  async function handleReject(orderId: string) {
    const reason = window.prompt('Rejection reason (optional):') || 'Item unavailable';
    await updateStatus(orderId, 'rejected', reason);
  }

  // ── Login screen ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-forest flex items-center justify-center px-4 kolam-pattern">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <VakulaaLogo size={48} />
          </div>
          <h2 className="font-display text-2xl text-center text-brand-forest mb-1">
            Admin Dashboard
          </h2>
          <p className="text-xs text-center text-gray-400 mb-6">
            Vakulaa Tiffins Operations
          </p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin password"
            className="vakulaa-input mb-4"
            autoFocus
          />
          <button
            onClick={handleLogin}
            className="w-full bg-brand-forest text-white rounded-xl py-3 font-semibold btn-plate"
          >
            Login →
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Filter orders ─────────────────────────────────────────────────
  const liveOrders = orders.filter(o =>
    !['delivered', 'rejected'].includes(o.status)
  );
  const displayOrders = tab === 'live' ? liveOrders : orders;

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    outForDelivery: orders.filter(o => o.status === 'out_for_delivery').length,
    deliveredToday: orders.filter(o => {
      const today = new Date().toDateString();
      return o.status === 'delivered' && new Date(o.createdAt).toDateString() === today;
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-brand-forest text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VakulaaLogo size={32} textColor="white" />
            <div className="hidden sm:block">
              <p className="text-xs text-green-300">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin-auth');
                setIsAuthenticated(false);
              }}
              className="text-xs text-green-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', value: stats.pending, color: '#F59E0B', icon: '🕐' },
            { label: 'Preparing', value: stats.preparing, color: '#8B5CF6', icon: '👨‍🍳' },
            { label: 'On the Way', value: stats.outForDelivery, color: '#F97316', icon: '🛵' },
            { label: "Today's Deliveries", value: stats.deliveredToday, color: '#10B981', icon: '✅' },
          ].map(stat => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{stat.icon}</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: 'live', label: `🔴 Live Orders (${liveOrders.length})` },
            { id: 'all', label: `📋 All Orders (${orders.length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as AdminTab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-brand-forest text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {isLoading && orders.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-card h-48 shimmer" />
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">
              {tab === 'live' ? '🎉' : '📦'}
            </div>
            <p className="font-medium">
              {tab === 'live' ? 'No active orders right now' : 'No orders yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {displayOrders.map(order => {
                const isExpanded = expandedOrder === order.id;
                const availableActions = STATUS_ACTIONS.filter(a =>
                  a.from.includes(order.status)
                );

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="bg-white rounded-2xl shadow-card overflow-hidden"
                  >
                    {/* Status stripe */}
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] }}
                    />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: ORDER_STATUS_COLORS[order.status] + '20',
                                color: ORDER_STATUS_COLORS[order.status],
                              }}
                            >
                              {ORDER_STATUS_ICONS[order.status]} {ORDER_STATUS_LABELS[order.status]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            #{order.id.slice(-8).toUpperCase()} · {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <span className="font-bold text-brand-forest text-lg">
                          ₹{order.finalAmount}
                        </span>
                      </div>

                      {/* Customer */}
                      <div className="bg-gray-50 rounded-xl p-3 mb-3">
                        <p className="font-semibold text-sm text-brand-charcoal mb-1">
                          {order.userName}
                        </p>
                        <a
                          href={`tel:${order.userPhone}`}
                          className="flex items-center gap-1.5 text-xs text-brand-leaf hover:underline"
                        >
                          <Phone size={11} />
                          {order.userPhone}
                        </a>
                        <div className="flex items-start gap-1.5 mt-1.5 text-xs text-gray-400">
                          <MapPin size={11} className="mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{order.deliveryAddress}</span>
                        </div>
                      </div>

                      {/* Items summary */}
                      <div className="mb-3">
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="flex items-center gap-1.5 text-xs text-brand-leaf font-medium"
                        >
                          <Eye size={12} />
                          {isExpanded ? 'Hide' : 'View'} items ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-2">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex justify-between text-xs">
                                    <span className="text-gray-600">
                                      {item.menuItem.name} × {item.quantity}
                                    </span>
                                    <span className="font-medium">
                                      ₹{item.menuItem.price * item.quantity}
                                    </span>
                                  </div>
                                ))}
                                <div className="border-t pt-1.5 flex justify-between text-xs font-bold text-brand-forest">
                                  <span>Total (incl. delivery)</span>
                                  <span>₹{order.finalAmount}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Action buttons */}
                      {availableActions.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {availableActions.map(action => (
                            action.to === 'rejected' ? (
                              <button
                                key={action.to}
                                onClick={() => handleReject(order.id)}
                                disabled={updatingOrder === order.id}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${action.className}`}
                              >
                                {action.icon}
                                {action.label}
                              </button>
                            ) : (
                              <button
                                key={action.to}
                                onClick={() => updateStatus(order.id, action.to)}
                                disabled={updatingOrder === order.id}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${action.className}`}
                              >
                                {updatingOrder === order.id
                                  ? <div className="spinner w-3 h-3" />
                                  : action.icon}
                                {action.label}
                              </button>
                            )
                          ))}
                        </div>
                      )}

                      {order.status === 'rejected' && order.rejectionReason && (
                        <p className="text-xs text-red-500 mt-2">
                          Reason: {order.rejectionReason}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
