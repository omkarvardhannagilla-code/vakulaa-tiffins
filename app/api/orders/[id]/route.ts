import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSessionToken } from '@/lib/utils';

function verifyToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const payload = parseSessionToken(auth.slice(7));
  if (!payload) return null;
  if (Date.now() - payload.timestamp > 30 * 24 * 60 * 60 * 1000) return null;
  return payload.userId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = verifyToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId) // Security: user can only see their own orders
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        userId: order.user_id,
        userName: order.user_name,
        userPhone: order.user_phone,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        totalAmount: order.total_amount,
        deliveryCharge: order.delivery_charge,
        finalAmount: order.final_amount,
        deliveryAddress: order.delivery_address,
        deliveryLat: order.delivery_lat,
        deliveryLng: order.delivery_lng,
        status: order.status,
        estimatedDeliveryMinutes: order.estimated_delivery_minutes,
        rejectionReason: order.rejection_reason,
        paymentMethod: 'cod',
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });
  } catch (error) {
    console.error('GET order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
