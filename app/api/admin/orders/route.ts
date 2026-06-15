import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function verifyAdmin(req: NextRequest): boolean {
  const adminKey = req.headers.get('x-admin-key');
  return adminKey === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'vakulaa2024');
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    const parsedOrders = (orders || []).map(o => ({
      id: o.id,
      userId: o.user_id,
      userName: o.user_name,
      userPhone: o.user_phone,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
      totalAmount: o.total_amount,
      deliveryCharge: o.delivery_charge,
      finalAmount: o.final_amount,
      deliveryAddress: o.delivery_address,
      deliveryLat: o.delivery_lat,
      deliveryLng: o.delivery_lng,
      status: o.status,
      estimatedDeliveryMinutes: o.estimated_delivery_minutes,
      rejectionReason: o.rejection_reason,
      paymentMethod: 'cod',
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return NextResponse.json({ orders: parsedOrders });
  } catch (error) {
    console.error('Admin GET orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
