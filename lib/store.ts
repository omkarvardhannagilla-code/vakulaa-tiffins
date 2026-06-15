'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MenuItem, PlateItem, AuthSession, DeliveryLocation, DELIVERY_CHARGE } from '@/types';

// ── Plate (Cart) Store ───────────────────────────────────────────────────────
interface PlateState {
  items: PlateItem[];
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearPlate: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getFinalAmount: () => number;
}

export const usePlateStore = create<PlateState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem: MenuItem) => {
        set(state => {
          const existing = state.items.find(i => i.menuItem.id === menuItem.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.menuItem.id === menuItem.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { menuItem, quantity: 1 }] };
        });
      },

      removeItem: (menuItemId: string) => {
        set(state => ({
          items: state.items.filter(i => i.menuItem.id !== menuItemId),
        }));
      },

      updateQuantity: (menuItemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.menuItem.id === menuItemId ? { ...i, quantity } : i
          ),
        }));
      },

      clearPlate: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),

      getFinalAmount: () => {
        const subtotal = get().getSubtotal();
        return subtotal > 0 ? subtotal + DELIVERY_CHARGE : 0;
      },
    }),
    {
      name: 'vakulaa-plate',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// ── Auth Store ───────────────────────────────────────────────────────────────
interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isLoading: false,

      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        set({ session: null });
        // Clear plate on logout
        usePlateStore.getState().clearPlate();
      },
    }),
    {
      name: 'vakulaa-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ── Location Store ────────────────────────────────────────────────────────────
interface LocationState {
  location: DeliveryLocation | null;
  setLocation: (location: DeliveryLocation) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (location) => set({ location }),
      clearLocation: () => set({ location: null }),
    }),
    {
      name: 'vakulaa-location',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
