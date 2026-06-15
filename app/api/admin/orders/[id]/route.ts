import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { OrderStatus } from '@/types';

function verifyAdmin(req: NextRequest): boolean {
  const adminKey = req.headers.get('x-admin-key');
  return adminKey === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'vakulaa2024');
}

const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending:          ['accepted', 'rejected'],
  accepted:         ['preparing', 'rejected'],
  preparing:        ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status, rejectionReason } = await req.json() as {
      status: OrderStatus;
      rejectionReason?: string;
    };

    // Validate the new status
    const validStatuses: OrderStatus[] = [
      'pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'rejected',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch current order to validate transition
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', params.id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const allowedNext = VALID_TRANSITIONS[current.status as OrderStatus];
    if (allowedNext && !allowedNext.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from '${current.status}' to '${status}'` },
        { status: 400 }
      );
    }

    // Update the order
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'rejected' && rejectionReason) {
      updatePayload.rejection_reason = rejectionReason;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      orderId: params.id,
      status,
    });

  } catch (error) {
    console.error('Admin PATCH order error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
