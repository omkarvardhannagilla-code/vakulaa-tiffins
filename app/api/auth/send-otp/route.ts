import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOTP, validatePhone, validateEmail } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email } = await req.json();

    // Validate inputs
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!phone || !validatePhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }
    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Rate limiting: max 3 OTP requests per phone per 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', tenMinsAgo);

    if ((count || 0) >= 3) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 10 minutes.' },
        { status: 429 }
      );
    }

    // Invalidate existing unused OTPs for this phone
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('phone', phone)
      .eq('used', false);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Save to database
    const { error: dbError } = await supabaseAdmin
      .from('otp_codes')
      .insert({ phone, code: otp, expires_at: expiresAt });

    if (dbError) throw dbError;

    // Upsert user record (create if new, keep if existing) — store email too
    await supabaseAdmin
      .from('users')
      .upsert(
        { phone, name: name.trim(), email: email.trim() },
        { onConflict: 'phone', ignoreDuplicates: false }
      );

    // ── Send OTP ──────────────────────────────────────────────────
    const otpMode = process.env.OTP_MODE || 'development';

    if (otpMode === 'email') {
      // Email delivery via Gmail (free). Needs GMAIL_USER + GMAIL_APP_PASSWORD.
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Vakulaa Tiffins" <${process.env.GMAIL_USER}>`,
        to: email.trim(),
        subject: `${otp} is your Vakulaa Tiffins OTP`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
            <h2 style="color:#0F4C25;margin:0 0 8px">Vakulaa Tiffins 🌿</h2>
            <p style="color:#555;margin:0 0 20px">Authentic South Indian Tiffins · Hyderabad</p>
            <p style="color:#333;font-size:15px">Hi ${name.trim()}, your one-time password is:</p>
            <div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#0F4C25;background:#F4F7F2;padding:16px;text-align:center;border-radius:10px;margin:12px 0">${otp}</div>
            <p style="color:#888;font-size:13px">This code is valid for 5 minutes. If you didn't request it, you can ignore this email.</p>
          </div>
        `,
      });

      return NextResponse.json({
        message: `OTP sent to ${email.trim()}`,
        success: true,
      });
    }

    // ── Development mode: return OTP in response ─────────────────
    console.log(`\n🔑 [DEV] OTP for ${phone} (${email}): ${otp}\n`);
    return NextResponse.json({
      message: `OTP sent to ${email.trim()} (dev mode)`,
      success: true,
      devOtp: otp, // REMOVE in production!
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
