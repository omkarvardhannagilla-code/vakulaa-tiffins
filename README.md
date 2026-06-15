# 🌿 Vakulaa Tiffins — AI-Powered Restaurant Platform

> Authentic South Indian Tiffins · Hyderabad · Full-Stack Next.js App

---

## 🗺 Table of Contents

1. [Project Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Feature List](#features)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [API Reference](#api-reference)
7. [Database Setup](#database-setup)
8. [GitHub Setup](#github-setup)
9. [Vercel Deployment](#vercel-deployment)
10. [WhatsApp Integration](#whatsapp)
11. [Free-Tier Summary](#free-tier)
12. [Troubleshooting](#troubleshooting)

---

## Overview

Vakulaa Tiffins is a complete, production-ready food ordering platform featuring:
- 📱 Mobile-first PWA experience
- 🤖 AI chatbot (Google Gemini — free tier) for natural ordering
- 🎤 Voice ordering (Web Speech API — browser-native, free)
- 📍 GPS location detection
- 📦 Live order tracking with Supabase Realtime
- 🛠 Admin dashboard for restaurant staff
- 💬 Optional WhatsApp notifications (Twilio)

---

## Tech Stack

| Layer       | Technology              | Cost     |
|-------------|-------------------------|----------|
| Frontend    | Next.js 14 + TypeScript | Free     |
| Styling     | Tailwind CSS            | Free     |
| Animation   | Framer Motion           | Free     |
| State       | Zustand                 | Free     |
| Database    | Supabase (PostgreSQL)   | Free tier|
| Realtime    | Supabase Realtime       | Free tier|
| AI Chat     | Google Gemini API       | Free     |
| Voice       | Web Speech API          | Free     |
| OTP (dev)   | Console log             | Free     |
| OTP (prod)  | MSG91 / Twilio          | ~₹0.25/SMS|
| Hosting     | Vercel                  | Free tier|

---

## Features

### Customer Features
- ✅ Phone number + OTP authentication
- ✅ GPS location detection (Nominatim reverse geocoding — free)
- ✅ Browse full menu with real food images
- ✅ Search menu items
- ✅ Filter by category (Breakfast / Dosa / Beverages)
- ✅ Add to Plate (cart) with quantity controls
- ✅ AI chatbot ordering assistant
- ✅ Voice ordering ("Give me two vadas and one plain dosa")
- ✅ Order summary with delivery charge (₹30 flat)
- ✅ Cash on Delivery (COD) payment
- ✅ Live order tracking
- ✅ Order history

### Admin Features
- ✅ Secure admin dashboard (password protected)
- ✅ Live order stream with Supabase Realtime
- ✅ Order status management (Accept → Prepare → Dispatch → Deliver)
- ✅ Customer contact info
- ✅ Order rejection with reason
- ✅ Daily delivery stats

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- A Supabase account (free)
- A Google Gemini API key (free, no card)

```bash
# 1. Clone / unzip the project
cd vakulaa-tiffins

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your keys (see below)

# 4. Set up database
# Go to Supabase → SQL Editor → paste database/schema.sql → Run

# 5. Start development server
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
# ── SUPABASE ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── GEMINI (free) ─────────────────────────────────────────
GEMINI_API_KEY=AIzaSy...

# ── OTP (set to "development" for testing) ────────────────
OTP_MODE=development
# OTP_MODE=msg91       → uses MSG91
# OTP_MODE=twilio      → uses Twilio

# MSG91 (if OTP_MODE=msg91)
MSG91_AUTH_KEY=your-msg91-authkey
MSG91_TEMPLATE_ID=your-template-id
MSG91_SENDER_ID=VKTFNS

# Twilio (if OTP_MODE=twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+12345678901

# ── ADMIN ─────────────────────────────────────────────────
NEXT_PUBLIC_ADMIN_PASSWORD=vakulaa2024  # Change this!

# ── WHATSAPP (optional) ───────────────────────────────────
WHATSAPP_ENABLED=false
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ── APP ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to get each key:

| Key | How to get |
|-----|-----------|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `GEMINI_API_KEY` | https://aistudio.google.com → Get API key |
| `MSG91_AUTH_KEY` | https://msg91.com → API → Auth Key |
| `TWILIO_ACCOUNT_SID` | https://console.twilio.com → Dashboard |

---

## API Reference

### Auth

#### `POST /api/auth/send-otp`
Send OTP to user's phone number.

**Request:**
```json
{ "name": "Ravi Kumar", "phone": "9876543210" }
```
**Response:**
```json
{ "success": true, "message": "OTP sent", "devOtp": "123456" }
```
> `devOtp` only returned when `OTP_MODE=development`

---

#### `POST /api/auth/verify-otp`
Verify OTP and create session.

**Request:**
```json
{ "phone": "9876543210", "code": "123456" }
```
**Response:**
```json
{
  "success": true,
  "session": {
    "user": { "id": "uuid", "name": "Ravi Kumar", "phone": "9876543210" },
    "token": "base64token"
  }
}
```

---

### Orders

#### `GET /api/orders`
Get user's order history.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{ "orders": [ { "id": "...", "status": "preparing", "items": [...] } ] }
```

---

#### `POST /api/orders`
Create a new order.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "userName": "Ravi",
  "userPhone": "9876543210",
  "items": [{ "menuItem": {...}, "quantity": 2 }],
  "totalAmount": 120,
  "deliveryCharge": 30,
  "finalAmount": 150,
  "deliveryAddress": "...",
  "deliveryLat": 17.49,
  "deliveryLng": 78.39
}
```

---

#### `GET /api/orders/:id`
Get single order details.

**Headers:** `Authorization: Bearer <token>`

---

### Chat

#### `POST /api/chat`
Send message to AI ordering assistant.

**Request:**
```json
{
  "message": "Give me two vadas and one masala dosa",
  "currentPlate": [],
  "conversationHistory": []
}
```
**Response:**
```json
{
  "reply": "Added 2 Vadas and 1 Masala Dosa to your plate! That's ₹190 before delivery.",
  "actions": [
    { "type": "add", "itemId": "vada-2pc", "quantity": 2 },
    { "type": "add", "itemId": "masala-dosa", "quantity": 1 }
  ]
}
```

---

### Admin

#### `GET /api/admin/orders`
Get all orders (admin only).

**Headers:** `x-admin-key: vakulaa2024`

---

#### `PATCH /api/admin/orders/:id`
Update order status.

**Headers:** `x-admin-key: vakulaa2024`

**Request:**
```json
{ "status": "preparing", "rejectionReason": null }
```

---

## Database Setup

1. Go to [supabase.com](https://supabase.com) → Create account → New project
2. Set a database password (save it)
3. Wait for project to provision (~2 min)
4. Go to **SQL Editor** → **New query**
5. Paste the contents of `database/schema.sql`
6. Click **Run**
7. Go to **Database → Replication** → Enable Realtime for the `orders` table

---

## GitHub Setup

```bash
# 1. Install Git (if not installed)
# Windows: https://git-scm.com/download/win
# Mac: brew install git

# 2. Configure Git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 3. Initialize repo in project folder
cd vakulaa-tiffins
git init
git add .
git commit -m "Initial commit: Vakulaa Tiffins v1.0"

# 4. Create repo on GitHub
# Go to github.com → New repository → Name: vakulaa-tiffins
# Do NOT initialize with README (we already have one)

# 5. Connect and push
git remote add origin https://github.com/YOUR_USERNAME/vakulaa-tiffins.git
git branch -M main
git push -u origin main
```

> ⚠️ **IMPORTANT:** Never commit `.env.local`. It's in `.gitignore` already.

---

## Vercel Deployment

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **Add New Project** → Import `vakulaa-tiffins`
3. Framework: **Next.js** (auto-detected)
4. Click **Environment Variables** → Add all variables from `.env.example`
   - Change `NEXT_PUBLIC_APP_URL` to your Vercel URL
   - Set `OTP_MODE=msg91` for production
5. Click **Deploy**
6. Your app is live at `https://vakulaa-tiffins.vercel.app`!

### Build settings
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

---

## WhatsApp Integration

Vakulaa Tiffins supports WhatsApp order notifications via **Twilio WhatsApp Sandbox** (free for testing).

### Setup:
1. Create a [Twilio account](https://twilio.com) (free trial gives $15 credit)
2. Go to **Messaging → Try it Out → WhatsApp Sandbox**
3. Note your **Sandbox number** (e.g., `+14155238886`)
4. Ask customers to send the join code to activate
5. Set in `.env.local`:
   ```
   WHATSAPP_ENABLED=true
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   TWILIO_ACCOUNT_SID=ACxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxx
   ```

### Limitations (Sandbox):
- Recipients must join the sandbox first (text the join code)
- For production: Apply for **WhatsApp Business API** ($0.005/message)

### Alternative (Free): 
Use **Telegram Bot** — fully free, no sandbox restrictions.
Replace `sendWhatsAppNotification` in the orders API with a Telegram Bot API call.

---

## Free-Tier Summary

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Vercel | ✅ Free | 100GB bandwidth/month |
| Supabase | ✅ Free | 500MB DB, 2GB bandwidth |
| Supabase Realtime | ✅ Free | 200 concurrent connections |
| Gemini API | ✅ Free tier | ₹0 (free tier limits) |
| Web Speech API | ✅ Free | Browser-native, unlimited |
| Nominatim Geocoding | ✅ Free | 1 req/second (sufficient) |
| MSG91 OTP | ₹0.25/SMS | International available |
| Twilio WhatsApp | Free trial | $15 credit (sandbox) |

**Estimated monthly cost for ~100 orders/day:**
- Hosting: ₹0 (Vercel free)
- Database: ₹0 (Supabase free)
- OTP: ~₹750 (3000 SMSes × ₹0.25)
- AI Chat: ~₹600 (10,000 messages)
- **Total: ~₹1,350/month**

---

## Troubleshooting

### OTP not received?
- In development, check your **terminal console** for the OTP
- In production, verify `MSG91_AUTH_KEY` is correct
- Check MSG91 template is approved for OTP

### Chatbot not responding?
- Verify `GEMINI_API_KEY` starts with `AIza`
- Check Google AI Studio dashboard for rate limits

### Realtime not working?
- Go to Supabase → Database → Replication → Enable `orders` table
- Check browser console for WebSocket errors

### Build errors on Vercel?
- Ensure all env variables are set in Vercel dashboard
- Check for TypeScript errors: `npm run build` locally first

### "Order not found" on tracking page?
- Ensure user is logged in (token valid for 30 days)
- Check if orderId in URL matches database

---

## Admin Access

Default admin URL: `https://yoursite.vercel.app/admin`

Default password: `vakulaa2024`

**Change the password** in `.env.local`:
```
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

---

*Built with ❤️ for Vakulaa Tiffins · Hyderabad*
