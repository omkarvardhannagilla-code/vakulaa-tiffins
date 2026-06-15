// =============================================
// VAKULAA TIFFINS - Core Type Definitions
// =============================================

export type MenuCategory = 'breakfast' | 'dosa' | 'beverages' | 'specials';

export interface MenuItem {
  id: string;
  name: string;
  price: number;           // In INR
  category: MenuCategory;
  description: string;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
  isPopular?: boolean;
}

export interface PlateItem {
  menuItem: MenuItem;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'rejected';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: PlateItem[];
  totalAmount: number;
  deliveryCharge: number;
  finalAmount: number;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  status: OrderStatus;
  estimatedDeliveryMinutes?: number;
  paymentMethod: 'cod';
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  message: string;
  updatedAt: string;
}

// Plate (Cart) Store
export interface PlateStore {
  items: PlateItem[];
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearPlate: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getFinalAmount: () => number;
}

// Auth Store
export interface AuthStore {
  session: AuthSession | null;
  isLoading: boolean;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// Location
export interface DeliveryLocation {
  address: string;
  lat?: number;
  lng?: number;
  isDetected: boolean;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  accepted: 'Order Accepted',
  preparing: 'Preparing Your Food',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  rejected: 'Order Rejected',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  preparing: '#8B5CF6',
  out_for_delivery: '#F97316',
  delivered: '#10B981',
  rejected: '#EF4444',
};

export const ORDER_STATUS_ICONS: Record<OrderStatus, string> = {
  pending: '🕐',
  accepted: '✅',
  preparing: '👨‍🍳',
  out_for_delivery: '🛵',
  delivered: '🎉',
  rejected: '❌',
};

export const DELIVERY_CHARGE = 30; // INR
export const RESTAURANT_LOCATION = {
  lat: 17.4858,
  lng: 78.2855,
  address: 'K Food Court, opp. Bonsai Homes, Tellapur, Hyderabad, Serilingampalle (M), Telangana 502034',
};
