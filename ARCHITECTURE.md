# Vakulaa Tiffins — Architecture & Notion Guide Analysis

## Notion Guide: AI Voice + WhatsApp Restaurant Ordering

Based on the guide at the provided URL, here is a detailed analysis of what was implemented,
what was adapted, and what alternatives were chosen for the Vakulaa Tiffins platform.

---

## Architecture Decisions

### 1. AI Ordering (Core Feature)

**Guide recommends:** OpenAI GPT + Webhook backend  
**We use:** Google Gemini (gemini-2.5-flash, free tier) via Next.js API Route

**Why Claude?**
- Better at understanding Indian food names and regional variations
- Superior JSON-structured output for actions (add/remove items)
- More natural conversational tone in Indian English
- Competitive pricing vs GPT-4

**Implementation:**
```
Customer message → /api/chat → Gemini 2.5 Flash → JSON {reply, actions} → Update Plate
```

**System prompt includes:**
- Full Vakulaa menu with IDs and prices
- Regional pronunciation aliases (kaapi=coffee, wada=vada, puri=poori)
- Strict JSON response format with action arrays
- South Indian restaurant personality

---

### 2. Voice Ordering

**Guide recommends:** Whisper API (paid) or Google Speech-to-Text  
**We use:** Web Speech API (browser-native — completely FREE)

**Why Web Speech API?**
- Zero cost (runs in the browser, no API call)
- Low latency (no network round-trip for speech recognition)
- Works offline for recognition
- Indian English supported (lang: 'en-IN')
- Available in Chrome, Edge, Safari

**Implementation:**
```typescript
const recognition = new window.SpeechRecognition();
recognition.lang = 'en-IN';  // Handles Indian accent
recognition.continuous = false;
recognition.interimResults = true;  // Shows live transcript
```

**Voice flow:**
1. User clicks mic → browser requests microphone permission
2. User speaks → browser transcribes in real-time
3. Final transcript → sent to Claude chat API
4. Claude parses → returns actions → plate updates

**Natural language examples handled:**
- "Give me two vadas and one masala dosa" → Vada×2, Masala Dosa×1
- "One idli and a coffee" → Idly×1, Coffee×1
- "Three plates of plain dosa" → Plain Dosa×3
- "Ek upma aur ek chai" → Upma×1, Tea×1 (mixed Hindi/English)

**Voice stops automatically when:**
- Chatbot is closed
- User navigates away
- Tab changes
- Final result received

---

### 3. WhatsApp Integration

**Guide recommends:** Meta WhatsApp Business API (complex setup, requires approval)  
**We implement:** Twilio WhatsApp Sandbox (free for testing)

#### Option A: Twilio WhatsApp Sandbox (Free for Development)
```
Free sandbox number: whatsapp:+14155238886
Customer must text "join <your-word>" once to activate
Then receives automatic notifications
```

**Notification triggers:**
- ✅ Order placed → customer gets summary
- ✅ Order accepted → confirmation  
- ✅ Preparing → kitchen started
- ✅ Out for delivery → rider dispatched
- ✅ Delivered → delivery confirmation
- ❌ Rejected → reason given

**Cost:** Free sandbox (development). Production: $0.005/message (~₹0.40)

#### Option B: Telegram Bot (Completely Free, No Approval)
Easier alternative — no sandbox restrictions.

```typescript
// Replace WhatsApp call with:
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const chatId = await getUserTelegramChatId(userPhone);
await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  body: JSON.stringify({ chat_id: chatId, text: message })
});
```

**Setup:** Create bot via @BotFather on Telegram → get token → done.

#### Option C: Direct WhatsApp (No API)
The guide suggests a "Click to Chat" approach:
```
https://wa.me/91XXXXXXXXXX?text=Order+Confirmation
```
This opens WhatsApp in browser — no API needed, but manual.

---

### 4. OTP Authentication

**Guide recommends:** Firebase Phone Auth or Twilio Verify  
**We implement:** Custom OTP with MSG91 (India-optimized)

**Why MSG91?**
- Indian company, optimized for Indian numbers
- Free tier available for testing
- ₹0.15–₹0.25 per OTP SMS
- Reliable delivery across all Indian carriers
- DLT registered templates (required by TRAI)

**Dev mode:** OTP logged to console + returned in API response  
**Prod mode:** Set `OTP_MODE=msg91` in env

**DLT Registration (Required for SMS in India):**
1. Register at msg91.com
2. Create OTP template: "Your Vakulaa Tiffins OTP is: {#var#}. Valid for 5 minutes."
3. Get Template ID from TRAI DLT portal
4. Add to `.env.local` as `MSG91_TEMPLATE_ID`

---

### 5. Real-Time Order Updates

**Guide recommends:** Firebase Realtime Database or Socket.io  
**We use:** Supabase Realtime (PostgreSQL change streams)

**Why Supabase Realtime?**
- Free tier includes 200 concurrent connections
- Already using Supabase for database — no extra service
- Built-in WebSocket with auto-reconnect
- Works out of the box with `supabase-js` SDK

**Implementation:**
```typescript
// Customer subscribes to their order
supabase
  .channel(`order-${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`,
  }, (payload) => {
    setOrder(prev => ({ ...prev, status: payload.new.status }));
  })
  .subscribe();

// Admin subscribes to ALL orders
supabase
  .channel('admin-orders')
  .on('postgres_changes', { event: '*', table: 'orders' }, () => {
    fetchOrders(); // Refresh list
  })
  .subscribe();
```

---

### 6. Location & Delivery Time

**Guide recommends:** Google Maps API (paid after free tier)  
**We use:** Browser Geolocation API + Nominatim (OpenStreetMap) — both FREE

```typescript
// Get GPS coordinates — free, browser-native
navigator.geolocation.getCurrentPosition(pos => {
  const { latitude, longitude } = pos.coords;
  
  // Reverse geocode to address — free (Nominatim/OpenStreetMap)
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
    .then(r => r.json())
    .then(data => {
      const address = data.display_name;
    });
});
```

**Delivery time estimation:**
- Haversine formula (distance between two GPS points)
- Restaurant location: Miyapur, Hyderabad (17.4908°N, 78.3917°E)
- Estimated at 20km/h average city speed + 15 min prep time
- Cap: 10–45 minutes

---

### 7. Payment

**Guide recommends:** Razorpay or Stripe  
**We implement:** Cash on Delivery (COD)

**Why COD for v1?**
- Zero payment gateway setup
- No PCI compliance requirements
- Most trusted by South Indian restaurant customers
- Can add Razorpay/PhonePe/UPI in v2

**QR Code option:** The delivery rider can show a UPI QR code from their own app.
No code changes needed — it's handled offline.

---

## Security Implementation

| Concern | Solution |
|---------|----------|
| API key exposure | All keys in `.env.local`, never exposed to client |
| Auth bypass | Server-side token validation on every protected route |
| OTP brute force | Rate limiting: max 3 OTPs per 10 minutes per phone |
| OTP replay | OTPs marked `used=true` after verification |
| Admin access | Separate password gate + `x-admin-key` header |
| SQL injection | Supabase parameterized queries (ORM-level protection) |
| Order tampering | Server recalculates totals (ignores client-side prices) |
| XSS | Next.js auto-escapes JSX content |

---

## What Was Modified from the Notion Guide

| Guide Suggestion | What We Did Instead | Reason |
|------------------|---------------------|--------|
| OpenAI for chat | Google Gemini (free) | Free tier, native JSON output |
| Whisper for voice | Web Speech API | Free, zero latency |
| Firebase Realtime | Supabase Realtime | Already using Supabase |
| Google Maps | Nominatim (OSM) | Free, no API key needed |
| Stripe/Razorpay | COD only (v1) | Simpler for restaurant launch |
| Express.js backend | Next.js API Routes | Unified codebase, Vercel-ready |
| React Native app | PWA (Next.js) | Faster launch, no App Store approval |

---

## Production Checklist

Before going live:

- [ ] Change `NEXT_PUBLIC_ADMIN_PASSWORD` from default
- [ ] Set `OTP_MODE=msg91` and configure MSG91
- [ ] Remove `devOtp` from send-otp response
- [ ] Set real `RESTAURANT_LAT`/`RESTAURANT_LNG`
- [ ] Test all payment flows end-to-end
- [ ] Set up Supabase database backups
- [ ] Configure custom domain on Vercel
- [ ] Add Google Analytics (optional)
- [ ] Set up error monitoring (Sentry — free tier)
- [ ] DLT register SMS template (required for India)
- [ ] Test voice ordering on Chrome Android/iOS

---

*This document was prepared alongside the Vakulaa Tiffins codebase.*  
*Notion guide: AI Voice + WhatsApp Restaurant Ordering Student Build Guide*


================================================================
