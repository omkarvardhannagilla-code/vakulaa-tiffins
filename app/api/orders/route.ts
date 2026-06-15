import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSessionToken, estimateDeliveryTime } from '@/lib/utils';
import { isWithinDeliveryZone } from '@/lib/delivery-zone';
import { PlateItem } from '@/types';

// ── Helper: verify auth token ─────────────────────────────────────
function verifyToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const payload = parseSessionToken(token);
  if (!payload) return null;
  // Token valid for 30 days
  if (Date.now() - payload.timestamp > 30 * 24 * 60 * 60 * 1000) return null;
  return payload.userId;
}

// ── GET /api/orders — fetch user's order history ─────────────────
export async function GET(req: NextRequest) {
  const userId = verifyToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Parse items JSON for each order
    const parsedOrders = (orders || []).map(o => ({
      ...o,
      id: o.id,
      userId: o.user_id,
      userName: o.user_name,
      userPhone: o.user_phone,
      totalAmount: o.total_amount,
      deliveryCharge: o.delivery_charge,
      finalAmount: o.final_amount,
      deliveryAddress: o.delivery_address,
      deliveryLat: o.delivery_lat,
      deliveryLng: o.delivery_lng,
      estimatedDeliveryMinutes: o.estimated_delivery_minutes,
      rejectionReason: o.rejection_reason,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
      paymentMethod: 'cod' as const,
    }));

    return NextResponse.json({ orders: parsedOrders });
  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// ── POST /api/orders — create a new order ────────────────────────
export async function POST(req: NextRequest) {
  const userId = verifyToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      userName,
      userPhone,
      items,
      totalAmount,
      deliveryCharge,
      finalAmount,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
    } = body;

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 });
    }
    if (!deliveryAddress) {
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 });
    }
    // Delivery area guard (inside ORR Hyderabad + Chevella only)
    if (deliveryLat != null && deliveryLng != null && !isWithinDeliveryZone(deliveryLat, deliveryLng)) {
      return NextResponse.json(
        { error: "Sorry, we can't deliver here! We currently serve inside Hyderabad (ORR) and Chevella only." },
        { status: 400 }
      );
    }

    // Recalculate totals on server side (security)
    const serverSubtotal = items.reduce(
      (sum: number, item: PlateItem) => sum + item.menuItem.price * item.quantity, 0
    );
    const serverFinalAmount = serverSubtotal + 30; // DELIVERY_CHARGE = 30

    // Estimate delivery time
    const estimatedMins = estimateDeliveryTime(deliveryLat, deliveryLng);

    // Insert order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        user_name: userName,
        user_phone: userPhone,
        items: JSON.stringify(items),
        total_amount: serverSubtotal,
        delivery_charge: 30,
        final_amount: serverFinalAmount,
        delivery_address: deliveryAddress,
        delivery_lat: deliveryLat || null,
        delivery_lng: deliveryLng || null,
        status: 'pending',
        estimated_delivery_minutes: estimatedMins,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      estimatedDeliveryMinutes: estimatedMins,
    });

  } catch (error) {
    console.error('POST order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
