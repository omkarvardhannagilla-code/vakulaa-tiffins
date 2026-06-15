# 🚀 Vakulaa Tiffins — Complete Setup Guide for Beginners

Follow this guide exactly, step by step. No prior experience needed.

---

## STEP 1 — Install Required Tools

### Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS version** (green button)
3. Install it (click Next, Next, Next...)
4. Open a terminal (Windows: search "cmd", Mac: search "Terminal")
5. Type `node --version` → you should see something like `v20.x.x`

### Install Git
1. Go to https://git-scm.com/downloads
2. Download for your OS and install
3. In terminal: `git --version` → should show `git version 2.x.x`

### Install VS Code (code editor)
1. Go to https://code.visualstudio.com
2. Download and install
3. Open VS Code

---

## STEP 2 — Set Up Supabase (Free Database)

1. Go to https://supabase.com
2. Click **Start your project** → Sign up with GitHub (easiest)
3. Click **New Project**
   - Organization: your name
   - Project name: `vakulaa-tiffins`
   - Database password: create a strong one and **save it somewhere**
   - Region: **South Asia (ap-south-1)** ← important for India
4. Wait 2-3 minutes for setup
5. Once ready, go to **Settings → API**
6. Copy and save:
   - **Project URL** → looks like `https://abcdefgh.supabase.co`
   - **anon/public** key → long string starting with `eyJ...`
   - **service_role** key → another long string (keep this SECRET)

### Create the database tables:
1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `database/schema.sql` from the project folder
4. Copy ALL the content
5. Paste it into the Supabase SQL Editor
6. Click **Run** (the green button)
7. You should see "Success" for each statement

### Enable Realtime (for live order tracking):
1. In Supabase, click **Database** → **Replication**
2. Under "Supabase Realtime", click **0 tables**
3. Toggle ON the **orders** table
4. Click **Save**

---

## STEP 3 — Get Gemini API Key (for AI Chatbot) — FREE

1. Go to https://aistudio.google.com
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Name it: `vakulaa-tiffins`
5. Copy the key (starts with `sk-ant-api03-...`)
6. **Save it immediately** — you can't see it again!

✅ **Cost:** Free. Gemini's free tier needs no credit card.
For 100 chat messages per day, this costs about ₹150/month.

---

## STEP 4 — Set Up the Project

### Unzip and open the project:
1. Unzip `vakulaa-tiffins.zip` to a folder (e.g., `Desktop/vakulaa-tiffins`)
2. Open VS Code
3. File → Open Folder → select `vakulaa-tiffins`

### Create your environment file:
1. In VS Code, look at the file list on the left
2. Right-click the `.env.example` file → **Copy**
3. Right-click the `vakulaa-tiffins` folder → **Paste**
4. Rename the copy to `.env.local` (exactly this name)
5. Open `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your anon key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your service role key...
GEMINI_API_KEY=AIzaSy...your key...
OTP_MODE=development
NEXT_PUBLIC_ADMIN_PASSWORD=vakulaa2024
```

### Install project dependencies:
1. In VS Code, press **Ctrl + `** (backtick) to open a terminal
2. Make sure you're in the vakulaa-tiffins folder
3. Type: `npm install`
4. Wait for it to finish (2-3 minutes, many packages will download)

### Start the development server:
```
npm run dev
```
Open your browser and go to: **http://localhost:3000**

🎉 You should see the Vakulaa Tiffins login page!

---

## STEP 5 — Test the App Locally

### Test OTP Login (Development Mode):
1. Go to http://localhost:3000
2. Enter your name and phone number
3. Click **Get OTP**
4. Look at your VS Code terminal — you'll see:
   ```
   🔑 [DEV] OTP for 9876543210: 234567
   ```
5. Enter that OTP in the app
6. You're logged in! 🎉

OR — the OTP is also shown in the yellow box on screen (dev mode convenience).

### Test the Menu:
1. After login, allow location OR enter your address manually
2. Browse the menu items
3. Click **Add to Plate** on any item
4. Click the green plate bar at the bottom

### Test the AI Chatbot:
1. Add some items to your plate
2. Tap the plate/chatbot button
3. Type: "Add two vadas" → the AI should respond and update your plate
4. Type: "I want one masala dosa" → AI adds it

### Test Voice Ordering:
1. Open the chatbot
2. Click the 🎤 microphone button
3. Allow microphone in browser popup
4. Say: "Give me one idly and a coffee"
5. Watch it update your order!

### Test Admin Dashboard:
1. Go to http://localhost:3000/admin
2. Password: `vakulaa2024`
3. Place a test order first, then see it appear here
4. Try the Accept / Prepare / Deliver buttons

---

## STEP 6 — Push to GitHub (Version Control)

### First-time Git setup:
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Create a GitHub account:
1. Go to https://github.com
2. Sign up (free)

### Create a new repository:
1. Click the **+** button → **New repository**
2. Name: `vakulaa-tiffins`
3. Keep it **Private** (so your API keys are safe even if you accidentally add .env.local)
4. Do NOT tick "Add README" (we already have one)
5. Click **Create repository**

### Push your code:
In VS Code terminal (make sure you're in the project folder):
```bash
git init
git add .
git commit -m "Initial commit: Vakulaa Tiffins v1.0 🌿"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vakulaa-tiffins.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

> ⚠️ **IMPORTANT:** Your `.env.local` is in `.gitignore` so it will NOT be pushed. Your API keys are safe.

---

## STEP 7 — Deploy to Vercel (Make it Live!)

1. Go to https://vercel.com
2. Click **Sign Up** → **Continue with GitHub**
3. Authorize Vercel to access your GitHub
4. Click **Add New Project**
5. Find `vakulaa-tiffins` in your repos → click **Import**
6. Vercel detects it's a Next.js app automatically

### Add environment variables:
1. Scroll down to **Environment Variables**
2. Add each variable from your `.env.local` file:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `GEMINI_API_KEY` | your Gemini key |
| `OTP_MODE` | `development` (change to `msg91` for production) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | `vakulaa2024` (change this!) |

3. Click **Deploy**
4. Wait 2-3 minutes
5. 🎉 Your app is live at `https://vakulaa-tiffins-xxxx.vercel.app`!

---

## STEP 8 — Set Up Real OTP (Production Ready)

### Using MSG91 (Recommended for India):

1. Go to https://msg91.com → Sign Up
2. Go to **API** → copy your **Auth Key**
3. Go to **SMS** → **Templates** → Create OTP template:
   - Template: `Your Vakulaa Tiffins OTP is ##OTP##. Valid for 5 minutes.`
   - Type: OTP
4. Go to https://dlt.trai.gov.in → Register as PE (Principal Entity)
   - (Required by TRAI for all Indian SMS — takes 2-3 days)
5. Once approved, update Vercel environment variables:
   ```
   OTP_MODE=msg91
   MSG91_AUTH_KEY=your-key
   MSG91_TEMPLATE_ID=your-template-id
   ```
6. Redeploy from Vercel dashboard → **Deployments** → **Redeploy**

---

## Common Problems & Solutions

### "Cannot find module" error
```bash
npm install
```

### "Invalid API key" for Gemini
- Check that `GEMINI_API_KEY` in `.env.local` starts with `AIza`
- Make sure there are no spaces before/after the key

### OTP not appearing in terminal
- Make sure `OTP_MODE=development` in `.env.local`
- Restart the server: Ctrl+C → `npm run dev`

### Supabase connection error
- Double-check `NEXT_PUBLIC_SUPABASE_URL` has no trailing slash
- Make sure you ran the schema.sql in Supabase

### Voice not working
- Voice ordering requires **Google Chrome** or **Microsoft Edge**
- Allow microphone when the browser asks

### Admin dashboard shows no orders
- Place a test order first
- Check that Supabase Realtime is enabled for the orders table

---

## What to Do After Launch

### Week 1 — Monitoring
- Check Supabase dashboard for order activity
- Monitor Vercel logs for errors
- Collect customer feedback

### Week 2 — SMS OTP
- Complete MSG91 / DLT registration
- Switch `OTP_MODE` to `msg91`

### Week 3 — WhatsApp Notifications
- Set up Twilio WhatsApp sandbox
- Enable `WHATSAPP_ENABLED=true`

### Month 2 — Upgrades
- Add UPI/Razorpay payment gateway
- Add Google Maps for delivery tracking
- Build Android app with Capacitor (wraps your web app)

---

*You're building something real. Vakulaa Tiffins is a production business —*  
*every order placed through this app is real money for real people. Build with care! 🌿*
