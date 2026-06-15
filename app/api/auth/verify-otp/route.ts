import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSessionToken } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'OTP must be 6 digits' }, { status: 400 });
    }

    // Fetch the latest unused OTP for this phone
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 401 });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Fetch user record
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found. Please sign up.' }, { status: 404 });
    }

    // Create session token
    const token = createSessionToken(user.id);

    return NextResponse.json({
      success: true,
      session: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          createdAt: user.created_at,
        },
        token,
      },
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
