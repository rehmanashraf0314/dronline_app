# DrOnline — Complete Setup Guide

## Prerequisites
Install these on your machine before starting:
- Node.js v18+ → https://nodejs.org
- Git → https://git-scm.com
- Expo CLI → `npm install -g expo-cli`
- Stripe CLI → https://stripe.com/docs/stripe-cli (for webhook testing)
- MongoDB Compass (optional, for viewing DB) → https://www.mongodb.com/compass

---

## STEP 1 — Create All Accounts & Collect API Keys

### 1A. MongoDB Atlas
1. Go to https://mongodb.com/atlas → Sign In
2. Your client should share access OR give you the connection string
3. Format: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/dronline`
4. In Atlas → Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0) for dev

### 1B. Stripe
1. Go to https://stripe.com → Create account
2. Stay in TEST MODE (toggle top left)
3. Dashboard → Developers → API Keys
4. Copy: `Publishable key` (pk_test_...) and `Secret key` (sk_test_...)
5. Install Stripe CLI: https://stripe.com/docs/stripe-cli#install
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Windows: Download from the link above
6. Login: `stripe login` (opens browser)

### 1C. Nodemailer (Email / SMTP)
1. Use your email provider's SMTP settings (e.g., Gmail, Outlook, AWS SES, SendGrid)
2. For **Gmail**:
   - Enable 2-factor authentication
   - Create an [App Password](https://support.google.com/accounts/answer/185833)
   - Use the generated app password as `EMAIL_PASS`
   - Set `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`
3. For other providers, consult their SMTP documentation
4. Set these in `.env`:
   - `EMAIL_HOST`: Your SMTP server (e.g., `smtp.gmail.com`)
   - `EMAIL_PORT`: SMTP port (usually 587 or 465)
   - `EMAIL_USER`: Your email address
   - `EMAIL_PASS`: Your password or app-specific password

### 1D. Daily.co (Video Calls)
1. Go to https://daily.co → Create free account
2. Dashboard → Developers → API Key → Copy it
3. Note your domain name (shown in dashboard, e.g. "myapp" from "myapp.daily.co")
4. Free tier: up to 1,000 minutes/month

### 1E. Cloudinary (File Storage)
1. Go to https://cloudinary.com → Create free account
2. Dashboard shows: Cloud Name, API Key, API Secret
3. Copy all three

---

## STEP 2 — Backend Setup

```bash
# Navigate to backend folder
cd dronline/backend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
```

Now open `.env` and fill in ALL the values from Step 1.

```bash
# Start development server
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running on port 5000
```

Test it: Open browser → http://localhost:5000/health
Should return: `{"status":"ok","env":"development"}`

---

## STEP 3 — Set Up Stripe Webhook (IMPORTANT)

The webhook is how Stripe tells your backend "payment succeeded".
Without this, appointments will never be confirmed after payment.

**Open a NEW terminal window** (keep the server running in the first one):

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxx (^C to quit)
```

Copy that `whsec_...` value → paste it into your `.env` as `STRIPE_WEBHOOK_SECRET`

**Restart your backend server** after updating .env.

---

## STEP 4 — Frontend Setup

```bash
# Navigate to frontend folder
cd dronline/frontend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
```

Open `.env` and fill in:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx
```

**IMPORTANT:** Use your machine's local IP (not localhost) so the phone can reach the server.
- Mac: `ifconfig | grep inet` → look for 192.168.x.x
- Windows: `ipconfig` → look for IPv4 Address

So it becomes: `EXPO_PUBLIC_API_URL=http://192.168.1.5:5000/api`

```bash
# Start Expo
npx expo start
```

Scan the QR code with Expo Go app on your phone.

---

## STEP 5 — Test the Full Booking Flow

### Test Cards (Stripe)
Use these fake card numbers — they NEVER charge real money:
| Card Number | Result |
|---|---|
| 4242 4242 4242 4242 | Always succeeds |
| 4000 0000 0000 9995 | Always declines |

Expiry: any future date (e.g. 12/28)
CVC: any 3 digits (e.g. 123)
ZIP: any 5 digits (e.g. 12345)

### Test Email
- Emails are sent directly through your SMTP provider
- Check your email's "Sent" folder or your SMTP provider's logs
- Gmail: Check Gmail's [Activity Log](https://myaccount.google.com/security)

### Test Video Call
- Daily.co creates real rooms immediately
- Open the meeting link in browser to test
- Free tier works fine for development

---

## STEP 6 — Create First Admin User

Since admins can't self-register, create one directly in MongoDB:

1. Open MongoDB Compass → connect with your URI
2. Find the `users` collection
3. Insert a document:

```json
{
  "email": "admin@dronline.com",
  "passwordHash": "$2b$12$PASTE_BCRYPT_HASH_HERE",
  "role": "admin",
  "fullName": "Admin User",
  "isEmailVerified": true,
  "isActive": true
}
```

To generate a bcrypt hash for your password, run this in your backend folder:
```bash
node -e "const b=require('bcryptjs'); b.hash('YourPassword123',12).then(h=>console.log(h))"
```

Copy the output hash → paste as `passwordHash` in MongoDB.

---

## STEP 7 — Create First Doctor

Same way — insert into `users` collection with `role: "doctor"`:

```json
{
  "fullName": "Dr. Jane Smith",
  "email": "doctor@dronline.com",
  "passwordHash": "$2b$12$...",
  "role": "doctor",
  "specialization": "General Practice",
  "isEmailVerified": true,
  "isActive": true,
  "contact": { "address": { "country": "Portugal" } },
  "availability": [
    { "dayOfWeek": "Mon", "timeRanges": ["09:00-17:00"] },
    { "dayOfWeek": "Tue", "timeRanges": ["09:00-17:00"] }
  ],
  "slotDuration": 30,
  "services": [{ "serviceId": "PASTE_SERVICE_ID_HERE", "fee": 40 }]
}
```

---

## STEP 8 — Production Deployment Checklist

When you're ready to go live:

### Backend (Render / Railway / VPS)
- [ ] Set all env variables on the hosting platform
- [ ] Change `NODE_ENV=production`
- [ ] Set up real Stripe webhook (not CLI) — in Stripe Dashboard → Webhooks → Add endpoint
- [ ] Webhook URL: `https://your-api-domain.com/api/payments/webhook`
- [ ] Copy new `whsec_...` from Stripe dashboard into env

### Email (Nodemailer SMTP)
- [ ] Verify your email provider's SMTP credentials are correct
- [ ] Test sending an email to confirm delivery works
- [ ] Set production-grade SMTP credentials (e.g., SendGrid, AWS SES) in env variables

### Frontend (Expo / EAS Build)
- [ ] Update `EXPO_PUBLIC_API_URL` to your production backend URL
- [ ] Switch Stripe keys from `pk_test_` to `pk_live_`
- [ ] Run `eas build` for production APK/IPA

---

## Common Errors & Fixes

| Error | Fix |
|---|---|
| `MongoServerError: bad auth` | Wrong username/password in MONGODB_URI |
| `Cannot connect to server` | Check your LOCAL IP in frontend .env — not localhost |
| `Stripe webhook error: No signatures found` | Make sure `stripe listen` is running; check STRIPE_WEBHOOK_SECRET |
| `Email send failed: SMTP auth error` | Verify EMAIL_USER and EMAIL_PASS are correct; for Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) |
| `Daily.co 401 Unauthorized` | Check DAILY_API_KEY is correct |
| `Expo: Unable to resolve module` | Run `npx expo install` to fix dependencies |

---

## Project Folder Structure (Final)

```
dronline/
├── backend/
│   ├── src/
│   │   ├── config/       db.js
│   │   ├── models/       User.js, Country.js, Service.js, Appointment.js
│   │   ├── middleware/   auth.js
│   │   ├── routes/       index.js
│   │   ├── controllers/  authController.js, appointmentController.js,
│   │   │                 paymentController.js, doctorController.js
│   │   ├── services/     emailService.js, stripeService.js, dailyService.js
│   │   └── index.js      (entry point)
│   ├── .env              (your real keys — never commit this)
│   ├── .env.example      (template — safe to commit)
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── _layout.jsx             (root, auth guard)
    │   ├── (auth)/                 login, register
    │   ├── (booking)/              step1 → step6 + success
    │   ├── (patient)/              home, video
    │   ├── (doctor)/               dashboard, consultation, video
    │   └── (admin)/                dashboard, countries, appointments
    ├── components/common/          BookingProgress
    ├── store/                      authStore, bookingStore
    ├── services/                   api.js
    ├── .env                        (your real keys)
    └── package.json
```
