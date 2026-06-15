import { RESTAURANT_LOCATION } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return 'MRP';
  return `₹${amount}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate Indian mobile number
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.slice(2);
  }
  return cleaned;
}

// Validate email address
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Haversine distance calculation (km)
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Estimate delivery time in minutes
export function estimateDeliveryTime(customerLat?: number, customerLng?: number): number {
  const BASE_PREP_TIME = 15;    // Minutes to prepare food
  const SPEED_KMH = 20;         // Average speed in city traffic
  const BASE_MIN = 10;          // Minimum delivery time
  const BASE_MAX = 45;          // Maximum capped time

  if (!customerLat || !customerLng) return 30;

  const distanceKm = calculateDistance(
    RESTAURANT_LOCATION.lat,
    RESTAURANT_LOCATION.lng,
    customerLat,
    customerLng
  );

  const travelMinutes = (distanceKm / SPEED_KMH) * 60;
  const total = Math.round(BASE_PREP_TIME + travelMinutes);

  return Math.min(Math.max(total, BASE_MIN), BASE_MAX);
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Simple JWT-like token (for demo; use proper JWT in production)
export function createSessionToken(userId: string): string {
  const payload = { userId, timestamp: Date.now() };
  return btoa(JSON.stringify(payload));
}

export function parseSessionToken(token: string): { userId: string; timestamp: number } | null {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}
