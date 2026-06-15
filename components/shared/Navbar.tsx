'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Clock, User, Menu, X, LogOut } from 'lucide-react';
import { VakulaaLogo } from './Logo';
import { useAuthStore, usePlateStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface NavbarProps {
  onOpenChatbot?: () => void;
}

export function Navbar({ onOpenChatbot }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const { getTotalItems, getSubtotal } = usePlateStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  function handleLogout() {
    logout();
    toast('Logged out. See you soon! 👋', { icon: '🌿' });
    router.push('/');
  }

  const navLinks = [
    { href: '/menu', label: 'Menu', icon: '🍽️' },
    { href: '/orders', label: 'Orders', icon: '📋' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-brand-mist shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/menu" className="flex items-center">
              <VakulaaLogo size={36} />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
                    pathname === link.href
                      ? 'text-brand-forest bg-brand-mist'
                      : 'text-gray-600 hover:text-brand-forest hover:bg-brand-mist/50'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Plate button */}
              {totalItems > 0 && (
                <motion.button
                  onClick={onOpenChatbot}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:flex items-center gap-2 bg-brand-forest text-white rounded-xl px-4 py-2 text-sm font-semibold btn-plate plate-glow"
                >
                  <ShoppingBag size={16} />
                  <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                  <span className="bg-brand-gold text-brand-forest rounded-lg px-2 py-0.5 text-xs font-bold">
                    ₹{subtotal}
                  </span>
                </motion.button>
              )}

              {/* User info */}
              {session && (
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-brand-mist flex items-center justify-center">
                    <User size={16} className="text-brand-forest" />
                  </div>
                  <span className="font-medium">{session.user.name.split(' ')[0]}</span>
                </div>
              )}

              {/* Logout */}
              {session && (
                <button
                  onClick={handleLogout}
                  className="hidden md:flex p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-brand-mist transition-colors"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-brand-mist overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-brand-forest bg-brand-mist'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}

                <div className="border-t border-gray-100 pt-2 mt-2">
                  {session && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                      <User size={16} />
                      <span>{session.user.name}</span>
                      <span className="text-xs text-gray-400">· {session.user.phone}</span>
                    </div>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg w-full transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile plate bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="plate-bar md:hidden"
          >
            <button
              onClick={onOpenChatbot}
              className="w-full bg-brand-forest text-white rounded-xl py-3.5 flex items-center justify-between px-4 font-semibold text-sm btn-plate"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <span>{totalItems} item{totalItems !== 1 ? 's' : ''} in Plate</span>
              </div>
              <span className="bg-brand-gold text-brand-forest px-3 py-1 rounded-lg text-xs font-bold">
                ₹{subtotal} →
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
