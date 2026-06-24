# DrOnline - Complete Project Documentation
**Last Updated:** June 23, 2026

---

## TABLE OF CONTENTS
1. Project Overview
2. Technology Stack
3. Backend Architecture & Endpoints
4. Frontend Architecture & Screens
5. Database Models
6. External Services Integration
7. Authentication Flow
8. Booking Flow
9. Payment Flow
10. Video Consultation Flow

---

## 1. PROJECT OVERVIEW

**DrOnline** is a telemedicine platform where patients can book video consultations with doctors. The system handles appointments, payments (via Stripe), video calls (via Daily.co), and email notifications.

### Key Features:
- Patient registration & booking appointments
- Doctor management & scheduling
- Stripe payment processing with webhook handling
- Daily.co video consultations
- Email confirmation & notifications
- Admin dashboard for management
- Guest patient checkout (no registration required)

---

## 2. TECHNOLOGY STACK

### Backend Stack:
- **Runtime:** Node.js v18+
- **Framework:** Express.js (REST API)
- **Database:** MongoDB Atlas (Cloud)
- **Authentication:** JWT (JSON Web Tokens)
- **Payment:** Stripe API
- **Video:** Daily.co API
- **Email:** Nodemailer (Gmail SMTP)
- **File Upload:** Cloudinary
- **Middleware:** Helmet (security), CORS, Morgan (logging)

### Frontend Stack:
- **Framework:** Expo with React Native (Mobile App)
- **Router:** Expo Router (File-based routing)
- **State Management:** Zustand (lightweight)
- **Styling:** NativeWind + Tailwind CSS
- **HTTP Client:** Axios
- **Payment UI:** Stripe React Native
- **Date/Time:** React Native DateTimePicker
- **Query Management:** React Query (@tanstack/react-query)
- **Secure Storage:** Expo SecureStore (token storage)

---

## 3. BACKEND ARCHITECTURE & ENDPOINTS

### Directory Structure:
```
backend/
├── src/
│   ├── index.js                 # Main app entry, Express setup
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── models/                  # Database schemas
│   │   ├── User.js             # Users (patient, doctor, admin)
│   │   ├── Appointment.js       # Appointments
│   │   ├── Service.js           # Medical services
│   │   └── Country.js           # Countries & timezones
│   ├── controllers/             # Business logic
│   │   ├── authController.js    # Auth endpoints
│   │   ├── appointmentController.js  # Appointment CRUD
│   │   ├── doctorController.js       # Doctor CRUD
│   │   └── paymentController.js      # Stripe & payment flow
│   ├── routes/
│   │   └── index.js             # All API routes
│   ├── middleware/
│   │   └── auth.js              # JWT + roleGuard middleware
│   └── services/                # External integrations
│       ├── emailService.js      # Email templates & sending
│       ├── stripeService.js     # Stripe API wrapper
│       └── dailyService.js      # Daily.co API wrapper
├── .env                         # Environment variables
└── package.json
```

### Backend Endpoints

#### **AUTHENTICATION ENDPOINTS** (`/api/auth/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user with email + password |
| POST | `/auth/send-otp` | ❌ | Send OTP to email (registration or guest checkout) |
| POST | `/auth/verify-otp` | ❌ | Verify OTP & get JWT token |
| POST | `/auth/login` | ❌ | Login with email + password |
| POST | `/auth/forgot-password` | ❌ | Request password reset |
| POST | `/auth/set-password` | ✅ | Guest user sets password to create account |
| GET | `/auth/me` | ✅ | Get current user profile |

**Auth Middleware:** `protect` (verifies JWT), `roleGuard('role')` (checks user role)

---

#### **COUNTRIES ENDPOINTS** (`/api/countries/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/countries` | ❌ | Get all active countries |
| POST | `/countries` | ✅ Admin | Create new country |
| PUT | `/countries/:id` | ✅ Admin | Update country |
| DELETE | `/countries/:id` | ✅ Admin | Delete country |

**Used for:** Patient location selection, doctor assignment by location, timezone management

---

#### **SERVICES ENDPOINTS** (`/api/services/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/services` | ❌ | Get enabled services (can filter by country) |
| GET | `/services/all` | ✅ Admin | Get all services (including disabled) |
| POST | `/services` | ✅ Admin | Create service |
| PUT | `/services/:id` | ✅ Admin | Update service |
| DELETE | `/services/:id` | ✅ Admin | Delete service |

**Used for:** Patient selects service → sets consultation fee

---

#### **DOCTORS ENDPOINTS** (`/api/doctors/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctors` | ❌ | List all active doctors (can filter by country/service) |
| GET | `/doctors/:id` | ❌ | Get single doctor profile |
| GET | `/doctors/:id/slots?date=2026-06-20` | ❌ | Get available time slots for a date |
| PUT | `/doctors/availability` | ✅ Doctor | Doctor updates their availability |
| PUT | `/doctors/profile` | ✅ Doctor | Doctor updates profile (name, bio, etc) |

**Doctor Availability Format:**
```javascript
availability: [
  { dayOfWeek: 'Mon', timeRanges: ['09:00-12:00', '14:00-18:00'] },
  { dayOfWeek: 'Tue', timeRanges: ['09:00-12:00', '14:00-18:00'] },
  // ... etc
]
```

---

#### **APPOINTMENTS ENDPOINTS** (`/api/appointments/*`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/appointments/mine` | ✅ | Patient | Get my appointments |
| GET | `/appointments/doctor/mine` | ✅ | Doctor | Get my patient appointments |
| GET | `/appointments` | ✅ | Admin | Get all appointments (with filters) |
| GET | `/appointments/:id` | ✅ | - | Get appointment details |
| PUT | `/appointments/:id/assign` | ✅ | Admin | Manually assign doctor to appointment |
| POST | `/appointments/:id/documents` | ✅ | Doctor | Send prescription/certificate/etc to patient |
| GET | `/appointments/:id/meeting-token` | ✅ | - | Get Daily.co token for video call |

**Query Filters (on GET /appointments):**
- `status` - Filter by status (Pending, Active, Completed, Cancelled)
- `country` - Filter by patient country
- `page` - Pagination (default 1)
- `limit` - Items per page (default 20)

---

#### **PAYMENTS ENDPOINTS** (`/api/payments/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-intent` | ❌ | Create Stripe PaymentIntent for checkout |
| POST | `/payments/create-appointment-pending` | ❌ | Create pending appointment before payment |
| POST | `/payments/webhook` | ❌ | Stripe webhook (handles payment success/failure) |

**Payment Flow:**
1. Frontend calls `POST /payments/create-intent` → gets `clientSecret`
2. Frontend calls `POST /payments/create-appointment-pending` → gets `appointmentId`
3. Stripe payment sheet opens
4. On success, Stripe calls webhook `POST /payments/webhook`
5. Webhook:
   - Updates appointment status to 'Active'
   - Sets `paymentStatus = 'Paid'`
   - Creates Daily.co meeting room
   - Sends confirmation emails to patient & doctor

---

#### **ADMIN ENDPOINTS** (`/api/admin/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/doctors` | ✅ Admin | Get all doctors |
| GET | `/admin/doctors/:id` | ✅ Admin | Get doctor details |
| POST | `/admin/doctors/create` | ✅ Admin | Create doctor |
| PUT | `/admin/doctors/:id` | ✅ Admin | Update doctor |
| DELETE | `/admin/doctors/:id` | ✅ Admin | Delete doctor |
| PUT | `/admin/doctors/:id/toggle` | ✅ Admin | Enable/disable doctor |
| GET | `/admin/services/:id` | ✅ Admin | Get service details |
| GET | `/admin/countries/:id` | ✅ Admin | Get country details |

---

### Backend File Explanations

#### **`src/index.js`** - Main Application Entry
**What it does:**
- Initializes Express server
- Connects to MongoDB
- Sets up middleware (Helmet, CORS, Morgan, bodyParser)
- Registers routes
- **CRITICAL:** Stripe webhook route must be registered BEFORE JSON parser (requires raw body)
- Starts server on port 5000

**Key Code:**
```javascript
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);
```

---

#### **`src/config/db.js`** - Database Connection
**What it does:**
- Connects to MongoDB Atlas using Mongoose
- Reads `MONGODB_URI` from `.env`
- Logs connection status
- Exits if connection fails

---

#### **`src/models/User.js`** - User Schema (Patient, Doctor, Admin)
**What it does:**
- Defines MongoDB schema for all users
- Single collection with `role` field to distinguish user types

**Fields:**
- **Common:** email, password hash, isActive, profilePhoto, OTP fields
- **Patient:** firstName, lastName, DOB, phone, address, medical history
- **Doctor:** specialization, IMC number, availability, services, education, bio
- **Both:** Timestamps, JWT fields

**Pre-save Hook:** Automatically hashes password using bcrypt

---

#### **`src/models/Appointment.js`** - Appointment Schema
**What it does:**
- Stores appointment data from booking to completion

**Key Fields:**
- `status` - Pending → Active → Completed/Cancelled
- `paymentStatus` - Unpaid → Paid → Failed
- `payment.paymentIntentId` - Link to Stripe PaymentIntent
- `meetingLink` - Daily.co video call URL
- `consultationDocuments` - Prescriptions, certificates, etc
- `patientUserId` - Links to User (optional for guests)

---

#### **`src/models/Service.js`** - Medical Service Schema
**What it does:**
- Stores available medical services (e.g., "Consultation", "Follow-up")
- Price, description, available countries

---

#### **`src/models/Country.js`** - Country Schema
**What it does:**
- Stores countries & timezones for location-based features

---

#### **`src/controllers/authController.js`** - Authentication Logic
**Key Functions:**

1. **`register()`** - Register new user
   - Validates email/password
   - Generates OTP
   - Sends OTP email
   - If email exists as guest, upgrades to registered user

2. **`sendOTP()`** - Send OTP for registration or guest checkout
   - Creates new user OR updates existing guest
   - Generates 6-digit OTP
   - Sends via email
   - Returns accountStatus (new/guest/existing)

3. **`verifyOTP()`** - Verify OTP & return JWT
   - Validates OTP & expiry
   - Marks email as verified
   - Returns JWT token
   - Returns `isGuest` flag

4. **`login()`** - Login with password
   - Verifies email + password
   - Returns JWT token

5. **`forgotPassword()`** - Password reset
   - Generates reset token
   - Sends reset link via email

---

#### **`src/controllers/appointmentController.js`** - Appointment Management
**Key Functions:**

1. **`getMyAppointments()`** - Patient views their appointments
   - Filters by patient email
   - Returns sorted by creation date

2. **`getDoctorAppointments()`** - Doctor views their patients
   - Filters by doctorId
   - Returns sorted by appointment date

3. **`getAllAppointments()`** - Admin views all appointments
   - Supports filtering by status, country, pagination

4. **`assignDoctor()`** - Admin manually assigns doctor to appointment
   - Marks as manually assigned
   - Updates doctor info

5. **`sendDocument()`** - Doctor sends prescription/certificate to patient
   - Validates document type
   - Sends email to patient with download link

6. **`getMeetingToken()`** - Get Daily.co token for joining video call
   - Generates unique token for participant
   - Doctor gets `isOwner: true` (can manage call)
   - Patient gets `isOwner: false`

---

#### **`src/controllers/doctorController.js`** - Doctor Management
**Key Functions:**

1. **`getDoctors()`** - List doctors (for patient browsing)
   - Can filter by country, service
   - Returns only public fields

2. **`getDoctorSlots()`** - Get available time slots for a date
   - Reads doctor's availability schedule
   - Generates 5-minute slots based on slot duration
   - Example: If available 09:00-12:00 with 30-min slots → [09:00, 09:30, 10:00, ...]

3. **`updateAvailability()`** - Doctor sets their schedule
   - Updates availability array & slot duration

4. **`updateProfile()`** - Doctor updates profile (bio, specialization, etc)

5. **Admin functions:**
   - `getAllDoctors()` - List all doctors for admin
   - `getDoctorById()` - View doctor details
   - `createDoctor()` - Admin creates new doctor
   - `updateDoctor()` - Admin updates doctor
   - `deleteDoctor()` - Admin deletes doctor
   - `toggleDoctorActive()` - Admin enable/disable doctor

---

#### **`src/controllers/paymentController.js`** - Stripe Payment Handling
**Key Functions:**

1. **`createPaymentIntent()`**
   - Called before showing payment sheet
   - Sends amount in cents (multiply by 100)
   - Returns `clientSecret` for Stripe SDK
   - Includes metadata (patient email, service ID)

2. **`createPendingAppointment()`**
   - Called after patient fills booking details
   - Creates appointment with status = 'Pending'
   - Auto-assigns doctor by country OR uses doctor selected by patient
   - Returns `appointmentId`

3. **`stripeWebhook()`** - **MOST IMPORTANT**
   - Called by Stripe after payment
   - Verifies webhook signature (validates it's from Stripe)
   - On `payment_intent.succeeded`:
     ✅ Updates appointment status → 'Active'
     ✅ Sets `paymentStatus` → 'Paid'
     ✅ Links patient user if exists
     ✅ Creates Daily.co meeting room
     ✅ Sends confirmation email to patient
     ✅ Sends notification email to doctor
   - On `payment_intent.payment_failed`:
     ❌ Updates appointment status → 'Cancelled'
     ❌ Sets `paymentStatus` → 'Failed'

**Critical:** This webhook MUST succeed for appointment to be confirmed!

---

#### **`src/middleware/auth.js`** - Authentication & Authorization
**Key Functions:**

1. **`protect`** - Verify JWT token
   - Extracts token from Authorization header
   - Verifies JWT signature
   - Loads full user object
   - Attaches to `req.user`

2. **`roleGuard(...roles)`** - Check user role
   - Example: `roleGuard('admin')` - only admins pass
   - Example: `roleGuard('doctor', 'admin')` - doctors and admins pass
   - Usage: `app.put('/route', protect, roleGuard('admin'), handler)`

---

#### **`src/services/emailService.js`** - Email Templates & Sending
**What it does:**
- Sends HTML emails using Nodemailer (Gmail SMTP)

**Key Functions:**

1. **`sendOTP({ email, otp, name })`**
   - OTP verification email
   - Shows 6-digit code
   - Expires in 10 minutes

2. **`sendAppointmentConfirmationPatient({ appointment })`**
   - Sent after successful payment
   - Shows appointment details (date, time, doctor, service)
   - Includes "Join Video Consultation" button with `meetingLink`
   - If no meeting link yet, shows warning

3. **`sendAppointmentNotificationDoctor({ appointment, doctorEmail })`**
   - Notifies doctor of new patient appointment
   - Shows patient details & symptoms
   - Includes "Join Video Call" button
   - Shows urgency level

4. **`sendDocumentEmail({ patientEmail, docType, fileUrl })`**
   - Sends prescription/certificate/etc to patient
   - Includes download link

5. **`sendPasswordResetEmail()`** - Password reset link

---

#### **`src/services/stripeService.js`** - Stripe API Wrapper
**What it does:**
- Wrapper around Stripe SDK

**Key Functions:**

1. **`createPaymentIntent({ amount, currency, metadata })`**
   - Creates Stripe PaymentIntent
   - Amount must be in cents (€20 = 2000)
   - Returns `clientSecret` for frontend

2. **`constructWebhookEvent(rawBody, signature)`**
   - Verifies webhook came from Stripe
   - Protects against spoofed webhooks
   - Returns verified event object

---

#### **`src/services/dailyService.js`** - Daily.co Video API Wrapper
**What it does:**
- Integrates with Daily.co for video consultations

**Key Functions:**

1. **`createMeetingRoom(appointmentId)`**
   - Creates a video room for appointment
   - Room name: `dronline-{appointmentId}`
   - Privacy: private (only invited can join)
   - Max participants: 2 (doctor + patient)
   - Returns: `{ meetingId, meetingCode, meetingLink }`
   - Example link: `https://dronline-test.daily.co/dronline-507f1f77bcf86cd799439011`

2. **`createMeetingToken({ roomName, participantName, isOwner })`**
   - Generates unique token for joining video
   - Token expires in 24 hours
   - Doctor gets `isOwner: true` (can manage call)
   - Patient gets `isOwner: false`

3. **`deleteRoom(roomName)`** - Delete room after consultation ends

---

#### **`src/routes/index.js`** - All API Routes
**What it does:**
- Centralized route definitions
- Groups endpoints by feature
- Applies authentication & authorization middleware

**Route Organization:**
```
AUTH → /api/auth/*
COUNTRIES → /api/countries/*
SERVICES → /api/services/*
DOCTORS → /api/doctors/* & /api/admin/doctors/*
APPOINTMENTS → /api/appointments/* & /api/admin/appointments/*
PAYMENTS → /api/payments/*
```

---

## 4. FRONTEND ARCHITECTURE & SCREENS

### Directory Structure:
```
frontend/
├── app/                         # Expo Router file-based routing
│   ├── _layout.jsx             # Root layout, auth guard, Stripe setup
│   ├── (auth)/                  # Auth screens (shared across roles)
│   │   ├── login.jsx           # Login screen
│   │   ├── register.jsx        # Registration screen
│   │   └── forgot-password.jsx # Password reset screen
│   ├── (booking)/               # Multi-step booking flow (6 steps)
│   │   ├── step1-patient-details.jsx
│   │   ├── step2-medical-info.jsx
│   │   ├── step3-booking-selection.jsx
│   │   ├── step4-consent.jsx
│   │   ├── step5-otp.jsx
│   │   ├── step6-payment.jsx
│   │   └── success.jsx
│   ├── (patient)/               # Patient screens
│   │   ├── home.jsx            # Patient home (my appointments)
│   │   └── video/[id].jsx      # Join video call
│   ├── (doctor)/                # Doctor screens
│   │   ├── dashboard.jsx       # Doctor dashboard
│   │   ├── consultation/[id].jsx  # View consultation
│   │   └── video/[id].jsx      # Join video call
│   └── (admin)/                 # Admin screens
│       ├── dashboard.jsx       # Admin dashboard (stats)
│       ├── appointments.jsx    # Manage appointments
│       ├── doctors.jsx         # Manage doctors
│       ├── services.jsx        # Manage services
│       └── countries.jsx       # Manage countries
├── components/                  # Reusable components
│   ├── common/
│   │   └── BookingProgress.jsx # Step indicator (steps 1-6)
│   ├── patient/, doctor/, admin/ # Role-specific components
├── store/                       # Zustand state management
│   ├── authStore.js            # Auth state (user, token, isGuest)
│   └── bookingStore.js         # Booking state (all 6 steps)
├── services/
│   └── api.js                  # Axios HTTP client + interceptors
├── tailwind.config.js          # Tailwind CSS config
├── global.css                  # Global styles
└── app.json, babel.config.js, metro.config.js, package.json
```

---

### Frontend Navigation Structure (Expo Router)

Expo Router uses **file-based routing** - file path = URL structure.

```
(auth)          → /login, /register, /forgot-password
(booking)       → /step1-patient-details, /step2-medical-info, ..., /success
(patient)       → /home, /video/[appointmentId]
(doctor)        → /dashboard, /consultation/[appointmentId], /video/[appointmentId]
(admin)         → /dashboard, /appointments, /doctors, /services, /countries
```

**Route Protection:**
- `_layout.jsx` has `<AuthGuard>` that enforces:
  - Unauthenticated users → redirected to `/login`
  - Logged-in users in auth screens → redirected to their role dashboard
  - Booking flow is accessible to unauthenticated users (guests)

---

### Frontend Screen Explanations

#### **`_layout.jsx`** - Root Layout & Auth Guard
**What it does:**
- Root component for entire app
- Sets up providers: `QueryClientProvider`, `StripeProvider`, `AuthGuard`
- Enforces authentication rules
- Initializes auth state on app startup

**Auth Guard Logic:**
```
On app load:
  1. Check if token exists in SecureStore
  2. If yes → call /auth/me to verify
  3. If no → set isLoading: false
  
On route change:
  - If NOT authenticated + NOT in (auth) or (booking) → redirect to /login
  - If authenticated + in (auth) → redirect to role-based dashboard
  - Admins → /(admin)/dashboard
  - Doctors → /(doctor)/dashboard
  - Patients → /(patient)/home
```

---

#### **Auth Screens** - `(auth)/*`

**`login.jsx`** - Login with email + password
- Form: email, password
- Calls `authStore.login()`
- On success: redirects to role dashboard
- On error: shows toast message

**`register.jsx`** - Register new account
- Form: email, password, confirm password
- Calls `authAPI.register()`
- Sends OTP to email
- Redirects to OTP verification

**`forgot-password.jsx`** - Password reset flow
- Email input
- Calls `authAPI.forgotPassword()`
- Backend sends reset link
- User clicks link → redirects to reset page

---

#### **Booking Screens** - `(booking)/*`

**Booking Flow:** Multi-step process to create appointment & pay

**Step 1: `step1-patient-details.jsx`** - Collect patient info
- Form fields:
  - First name, Last name, DOB (date picker)
  - Gender (dropdown)
  - Phone, Email, National ID
  - Address: line1, line2, city, state, postal code, country (dropdown)
- Saves to `bookingStore.patientDetails`
- Next button → Step 2

**Step 2: `step2-medical-info.jsx`** - Collect medical history
- Form fields:
  - Allergies (multi-select)
  - Chronic conditions (multi-select)
  - Current medications (multi-select)
  - Pharmacy name
  - Current symptoms (text)
  - Symptom duration (dropdown)
  - Urgency (Routine / Soon / Urgent)
- Saves to `bookingStore.medicalInfo`
- Next button → Step 3

**Step 3: `step3-booking-selection.jsx`** - Select service & doctor
- Dropdowns/lists:
  - Country (fetches from backend)
  - Service (fetches by country)
  - Doctor (fetches by country/service)
  - Preferred mode (video/phone/other)
  - Appointment date (date picker)
  - Available time slots (fetches from `/doctors/:id/slots?date=X`)
- Shows doctor profile & availability
- Optional: referral code
- Saves to `bookingStore.bookingSelection`
- Next button → Step 4

**Step 4: `step4-consent.jsx`** - Collect consent
- Checkboxes:
  - ☐ GDPR data privacy consent
  - ☐ Medical treatment consent
  - ☐ Share FHIR medical records with doctor
  - ☐ Marketing emails
- Saves to `bookingStore.consent`
- Next button → Step 5

**Step 5: `step5-otp.jsx`** - Verify email with OTP
- If user NOT authenticated:
  - Shows email input
  - Calls `authAPI.sendOTP()` → sends OTP
  - Shows OTP input field (6 digits)
  - Calls `authAPI.verifyOTP()` → gets JWT token
  - Stores token in SecureStore
  - Option to "Set Password" to create full account (optional for guests)
- If user IS authenticated:
  - Skips OTP step
  - Directly proceeds to payment
- Saves `userId` to bookingStore
- Next button → Step 6

**Step 6: `step6-payment.jsx`** - Stripe payment
- Shows appointment summary (service, doctor, amount)
- Calls `POST /payments/create-intent` → gets `clientSecret`
- Calls `POST /payments/create-appointment-pending` → creates appointment
- Opens Stripe payment sheet
- On payment success:
  - Webhook (backend) creates Daily.co room & sends emails
  - Frontend redirects to `/success`

**`success.jsx`** - Booking complete
- Shows confirmation message
- Appointment ID & meeting link
- Button to join consultation or go home

---

#### **Patient Screens** - `(patient)/*`

**`home.jsx`** - Patient dashboard
- Calls `/appointments/mine`
- Lists patient's appointments
- Shows status, date, time, doctor name
- Can tap to view details or join video call

**`video/[id].jsx`** - Join video consultation
- Route parameter: appointmentId
- Calls `/appointments/:id/meeting-token` → gets Daily.co token
- Initializes Daily.co iframe with token
- Patient can:
  - Join video call
  - Chat with doctor
  - Share screen (if supported)

---

#### **Doctor Screens** - `(doctor)/*`

**`dashboard.jsx`** - Doctor dashboard
- Calls `/appointments/doctor/mine`
- Lists all patient appointments assigned to this doctor
- Shows patient name, date, time, status
- Can tap to view consultation

**`consultation/[id].jsx`** - View consultation details
- Shows full appointment details:
  - Patient info (name, contact, DOB)
  - Medical history (allergies, conditions, symptoms)
  - Appointment details (date, time, mode)
- Doctor can:
  - Send documents (prescription, medical certificate, etc)
  - Join video call
  - Update appointment status

**`video/[id].jsx`** - Join video call (doctor version)
- Same as patient but with `isOwner: true`
- Doctor can:
  - Manage call (mute participants, etc)
  - Record consultation
  - End call

---

#### **Admin Screens** - `(admin)/*`

**`dashboard.jsx`** - Admin dashboard
- Shows statistics:
  - Total appointments
  - Completed appointments
  - Revenue
  - Active doctors
- Quick actions: manage doctors, services, countries

**`appointments.jsx`** - Manage all appointments
- Fetches `/appointments?status=...&country=...`
- List view with filtering (status, country, pagination)
- Can tap appointment to:
  - View full details
  - Assign doctor manually
  - Cancel appointment

**`doctors.jsx`** - Manage doctors
- Fetches `/admin/doctors`
- List view with options:
  - View doctor profile
  - Edit doctor (name, specialization, availability, etc)
  - Enable/disable doctor
  - Delete doctor
- Create new doctor form

**`services.jsx`** - Manage medical services
- Fetches `/services/all`
- Can:
  - Create service (title, price, description, countries)
  - Edit service
  - Delete service
  - Enable/disable service

**`countries.jsx`** - Manage countries
- Fetches `/countries`
- Can:
  - Create country (name, timezone)
  - Edit country
  - Delete country

---

### Frontend File Explanations

#### **`store/authStore.js`** - Authentication State (Zustand)
**What it does:**
- Centralized auth state
- Persists token to SecureStore
- Manages login/logout/OTP flow

**State:**
```javascript
{
  user: null,           // { _id, email, role, ... }
  token: null,          // JWT token
  isLoading: true,      // While checking auth on app startup
  isGuest: false,       // true if logged in without password
}
```

**Methods:**
- `init()` - Called on app startup, loads token from SecureStore
- `login(email, password)` - Traditional login
- `setAuthFromOTP(token, user, isGuest)` - Called after OTP verification
- `setPassword(password)` - Guest converts to full account
- `logout()` - Clears token & user

---

#### **`store/bookingStore.js`** - Booking State (Zustand)
**What it does:**
- Manages multi-step booking form state
- Persists across navigation

**State Structure:**
```javascript
{
  // Step 1
  patientDetails: {
    firstName, lastName, dob, gender, phone, email,
    nationalId, address: { line1, line2, city, state, postalCode, country }
  },
  // Step 2
  medicalInfo: {
    allergies, conditions, medications, pharmacy,
    symptoms, symptomDuration, urgency
  },
  // Step 3
  bookingSelection: {
    country, service, doctor, preferredMode, date, time, referralCode
  },
  // Step 4
  consent: { gdpr, treatment, shareFHIR, marketing },
  // Step 5-6
  otpVerified, userId, appointmentId, paymentIntentId, currentStep
}
```

**Methods:**
- `setPatientDetails(data)` - Update step 1
- `setMedicalInfo(data)` - Update step 2
- `setBookingSelection(data)` - Update step 3
- `setConsent(data)` - Update step 4
- `setOtpVerified(userId)` - Mark OTP verified
- `buildAppointmentPayload()` - Construct data for API
- `nextStep()` / `prevStep()` / `setStep(n)` - Navigate
- `reset()` - Clear all data

---

#### **`services/api.js`** - HTTP Client & API Wrapper
**What it does:**
- Axios instance with interceptors
- Auto-attaches JWT token to requests
- Handles 401 responses (clears token)
- Organized API methods by feature

**Key Setup:**
```javascript
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000/api';
// Must set EXPO_PUBLIC_API_URL to your backend IP for mobile to work!

// Request interceptor adds: Authorization: Bearer {token}
// Response interceptor handles 401 → logs out user
```

**API Objects:**
- `authAPI` - login, register, sendOTP, verifyOTP, forgotPassword, getMe
- `countriesAPI` - getAll, create, update, delete
- `servicesAPI` - getEnabled, getAll, create, update, delete
- `doctorsAPI` - getAll, getById, getSlots, updateAvailability, updateProfile
- `appointmentsAPI` - getMine, getDoctorMine, getAll, getById, assignDoctor, sendDocument, getMeetingToken
- `paymentsAPI` - createIntent, createPendingAppointment
- `adminAPI` - doctor CRUD, service CRUD, country CRUD, stats

---

#### **`components/common/BookingProgress.jsx`** - Step Indicator
**What it does:**
- Shows which step user is on (1/6)
- Visual progress bar
- Shows step titles

---

## 5. DATABASE MODELS

### User Model
```javascript
{
  _id: ObjectId,
  role: 'patient' | 'doctor' | 'admin',
  email: String (unique),
  passwordHash: String,
  isEmailVerified: Boolean,
  isActive: Boolean,
  
  // Patient fields
  patient: {
    firstName, lastName, dob, gender, phone,
    nationalId,
    address: { line1, line2, city, state, postalCode, country },
    allergies: [String],
    conditions: [String],
    medications: [String],
    pharmacy: String,
  },
  
  // Doctor fields
  specialization: String,
  imcNumber: String,
  licenseAuthority: String,
  education: [String],
  bio: String,
  dateOfBirth: Date,
  yearsOfExperience: Number,
  availability: [{ dayOfWeek: String, timeRanges: [String] }],
  slotDuration: Number,
  services: [{ serviceId: ObjectId (ref: Service), fee: Number }],
  
  createdAt, updatedAt
}
```

### Appointment Model
```javascript
{
  _id: ObjectId,
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled',
  paymentStatus: 'Unpaid' | 'Paid' | 'Failed',
  
  patient: {
    firstName, lastName, dob, gender, email, phone,
    nationalId, address: { ... }, mrn
  },
  
  medical: {
    allergies, conditions, medications,
    symptoms, symptomDuration,
    urgency: 'Routine' | 'Soon' | 'Urgent',
    pharmacy
  },
  
  appointment: {
    preferredMode: 'video' | 'phone' | 'other',
    date: String,        // "2026-06-20"
    time: String,        // "14:30"
    referralCode: String
  },
  
  service: { id, name, amount, currency },
  
  payment: {
    provider: 'stripe',
    paymentIntentId: String,
    amount: Number,
    currency: String,
    status: 'pending' | 'succeeded' | 'failed'
  },
  
  doctorId: ObjectId (ref: User),
  doctorName, doctorEmail, doctorCountry,
  assignedBy: 'auto' | 'admin',
  assignedAt: Date,
  
  meetingId, meetingCode, meetingLink,  // Daily.co
  
  consultationDocuments: {
    prescription: { sent, sentAt, fileUrl },
    medicalCertificate: { sent, sentAt, fileUrl },
    medicalLeave: { sent, sentAt, fileUrl },
    referralLetter: { sent, sentAt, fileUrl }
  },
  
  patientUserId: ObjectId (ref: User),
  isGuest: Boolean,
  
  createdAt, updatedAt
}
```

### Service Model
```javascript
{
  _id: ObjectId,
  title: String,          // "Video Consultation"
  description: String,
  price: Number,          // in EUR
  currency: String,       // "EUR"
  category: String,
  countries: [String],    // Which countries offer this service
  isEnabled: Boolean,
  isComingSoon: Boolean,
  isTemporarilyClosed: Boolean,
  imageUrl: String,
  imagePublicId: String,  // Cloudinary ID
  
  createdAt, updatedAt
}
```

### Country Model
```javascript
{
  _id: ObjectId,
  name: String (unique),  // "Portugal"
  timezone: String,       // "Europe/Lisbon"
  isActive: Boolean,
  
  createdAt, updatedAt
}
```

---

## 6. EXTERNAL SERVICES INTEGRATION

### A. Stripe (Payment Processing)

**Configuration:**
```
STRIPE_SECRET_KEY=sk_test_...        # Backend only
STRIPE_PUBLISHABLE_KEY=pk_test_...   # Frontend only
STRIPE_WEBHOOK_SECRET=whsec_...      # Backend only
```

**Flow:**
1. Frontend calls `stripeService.createPaymentIntent()` → returns `clientSecret`
2. Frontend opens Stripe payment sheet with `clientSecret`
3. User enters card details
4. Stripe processes payment
5. Stripe calls webhook: `POST /api/payments/webhook` with signed payload
6. Backend verifies signature, updates appointment, sends emails
7. Frontend receives success → redirects to `/success`

**Key Files:**
- `src/services/stripeService.js` - API wrapper
- `src/controllers/paymentController.js` - Payment logic
- `src/index.js` - Webhook registration

---

### B. Daily.co (Video Consultations)

**Configuration:**
```
DAILY_API_KEY=...          # API key
DAILY_DOMAIN=dronline-test # Your domain name
```

**Flow:**
1. Appointment payment succeeds (webhook)
2. Backend calls `dailyService.createMeetingRoom()` → creates room
3. Returns `meetingLink` (e.g., `https://dronline-test.daily.co/dronline-507f1f...`)
4. Email sent to patient & doctor with link
5. On consultation time, participant calls `/appointments/:id/meeting-token`
6. Gets unique token for that participant
7. Participant joins video room with token

**Key Files:**
- `src/services/dailyService.js` - API wrapper
- `src/controllers/appointmentController.js` - Meeting token generation

**Features:**
- Private rooms (only invited can join)
- Max 2 participants (doctor + patient)
- Chat enabled
- Expires 24 hours after creation

---

### C. Nodemailer (Email Sending)

**Configuration:**
```
EMAIL_HOST=smtp.gmail.com        # Gmail SMTP
EMAIL_PORT=587                   # TLS port
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-password          # Gmail app-specific password
```

**Emails Sent:**
1. OTP verification
2. Appointment confirmation (patient)
3. Appointment notification (doctor)
4. Document delivery (prescription, certificate, etc)
5. Password reset

**Key File:** `src/services/emailService.js`

---

### D. Cloudinary (Image Upload)

**Configuration:**
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Used for:**
- Doctor profile photos
- Service images
- Patient documents

---

### E. MongoDB Atlas (Database)

**Configuration:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dronline
```

**Collections:**
- `users` - Patients, doctors, admins
- `appointments` - All appointments
- `services` - Available services
- `countries` - Countries & timezones

---

## 7. AUTHENTICATION FLOW

### Registration with OTP

```
1. User enters email on login/register screen
2. Frontend calls: POST /auth/send-otp { email }
3. Backend:
   - Creates user or updates existing guest
   - Generates 6-digit OTP
   - Sends OTP to email
   - Returns: { success, userId, accountStatus }
4. Frontend shows OTP input screen
5. User enters OTP
6. Frontend calls: POST /auth/verify-otp { userId, otp }
7. Backend:
   - Validates OTP & expiry
   - Marks email as verified
   - Generates JWT token
   - Returns: { token, user, isGuest }
8. Frontend:
   - Stores token in SecureStore
   - Sets authStore state
   - If guest: shows "Set Password" option (optional)
   - If registered: redirects to dashboard
```

### Traditional Login

```
1. User enters email + password
2. Frontend calls: POST /auth/login { email, password }
3. Backend:
   - Finds user by email
   - Compares password hash
   - Generates JWT token
   - Returns: { token, user }
4. Frontend:
   - Stores token
   - Redirects to dashboard
```

### Guest to Full Account Conversion

```
1. Guest creates appointment via booking flow
2. After OTP verification, guest logged in
3. Guest can opt to: POST /auth/set-password { password }
4. Backend:
   - Hashes password
   - Saves to user
   - isGuest flag cleared
5. User now has full account with password
```

### Protected Routes

```javascript
// Example: Only doctors can update availability
router.put(
  '/doctors/availability',
  protect,                    // Verify JWT
  roleGuard('doctor'),        // Check role
  doctorController.updateAvailability
);
```

---

## 8. BOOKING FLOW

### Complete Patient Journey

```
STEP 1: Patient Details
  - Form: name, DOB, gender, phone, email, address
  - Next → STEP 2

STEP 2: Medical Info
  - Form: allergies, conditions, symptoms, urgency
  - Next → STEP 3

STEP 3: Booking Selection
  - Select: country → service → doctor
  - Select: date → time slot
  - Next → STEP 4

STEP 4: Consent
  - Checkboxes: GDPR, treatment, FHIR, marketing
  - Next → STEP 5

STEP 5: OTP Verification
  - If guest: Enter email → verify OTP
  - If registered: Skip
  - Option to set password
  - Next → STEP 6

STEP 6: Payment (Stripe)
  - Show summary
  - Click "Pay Now"
  - Stripe payment sheet
  - On success → /success page

AFTER PAYMENT:
  - Backend webhook:
    ✓ Creates Daily.co video room
    ✓ Sends confirmation to patient
    ✓ Sends notification to doctor
    ✓ Appointment status = Active
  - Patient & doctor receive emails with meeting link
```

---

## 9. PAYMENT FLOW

### Step-by-Step

```
FRONTEND:
  1. POST /payments/create-intent
     → { amount, currency, appointmentData }
     ← { clientSecret, paymentIntentId }

  2. POST /payments/create-appointment-pending
     → { appointmentData, paymentIntentId }
     ← { appointmentId }
     
  3. Open Stripe payment sheet
     - User enters card
     - Stripe processes payment
     
STRIPE BACKEND:
  4. Stripe calls: POST /api/payments/webhook
     - Payload includes: paymentIntentId, status
     - Backend webhook processes:
       ✓ Verifies signature
       ✓ Finds appointment by paymentIntentId
       ✓ Updates status → Active
       ✓ Creates Daily.co room
       ✓ Sends emails
       
FRONTEND:
  5. Receives payment.succeeded event
  6. Redirects to /success page
  7. Shows confirmation + meeting link
```

### Payment States

```
BEFORE PAYMENT:
  appointment.paymentStatus = 'Unpaid'
  appointment.status = 'Pending'

DURING PAYMENT:
  payment.paymentIntentId = 'pi_...'
  payment.status = 'processing'

PAYMENT SUCCESS:
  appointment.paymentStatus = 'Paid'
  appointment.status = 'Active'
  appointment.meetingLink = 'https://...'

PAYMENT FAILED:
  appointment.paymentStatus = 'Failed'
  appointment.status = 'Cancelled'
```

---

## 10. VIDEO CONSULTATION FLOW

### Before Consultation

```
1. Appointment created + paid
2. Backend creates Daily.co room
3. Emails sent with meeting link
4. Doctor & patient receive link in email
5. Either can click link to join anytime
```

### During Consultation

```
PARTICIPANT REQUESTS TOKEN:
  1. Frontend calls: GET /appointments/:id/meeting-token
  2. Backend:
     - Identifies user (doctor vs patient)
     - Creates Daily.co token with:
       - room_name: meetingCode
       - user_name: doctor or patient name
       - is_owner: true if doctor, false if patient
       - exp: 24 hours from now
     - Returns token
  3. Frontend initializes Daily.co iframe with token
  
IN VIDEO ROOM:
  - Doctor (is_owner: true) can:
    • Manage participants
    • Record consultation
    • Control settings
  - Patient can:
    • See & hear doctor
    • Chat
    • Screen share (if enabled)
```

### After Consultation

```
1. Doctor sends prescription/documents
   - Frontend: POST /appointments/:id/documents
   - Backend: sends email to patient
   - Patient receives document link
2. Doctor can mark appointment as completed
3. Consultation history saved in appointment
```

---

## ENVIRONMENT VARIABLES (.env)

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dronline

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Daily.co
DAILY_API_KEY=...
DAILY_DOMAIN=dronline-test

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-specific-password

# Frontend
FRONTEND_URL=http://localhost:8081

# OTP
OTP_EXPIRES_MINUTES=10

# Mobile Frontend
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## KEY CONCEPTS

### Guest Checkout
- User doesn't need account to book appointment
- Email verified via OTP
- After payment, user can optionally set password
- Converts to full account

### Doctor Auto-Assignment
- On payment, if no doctor specified → auto-assign by country
- Admin can manually reassign via API

### Role-Based Access
- **Patient** - View own appointments, join video calls
- **Doctor** - View assigned patients, join calls, send documents
- **Admin** - Full CRUD on all resources

### Timezone Support
- Countries have timezones
- Doctor slots calculated in their timezone
- Display times adjusted for patient location

### Webhook Security
- Stripe webhook must verify signature
- Protects against spoofed payments
- Only valid webhooks processed

---

## COMMON ISSUES & FIXES

### Email Not Sending
- Check Gmail 2FA enabled
- Use app-specific password (not account password)
- Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
- Verify email service running

### Daily.co Room Not Created
- Check DAILY_API_KEY & DAILY_DOMAIN valid
- Check API key has correct permissions
- Verify network connectivity
- Check error logs in webhook

### Meeting Link Not in Email
- Check appointment reloaded after save
- Check meetingLink field populated
- Check email template includes link
- Verify email sent successfully

### Payment Webhook Not Triggering
- Verify webhook registered on port 5000
- Check STRIPE_WEBHOOK_SECRET correct
- Verify Stripe dashboard webhook endpoint set
- Use `stripe listen` for local testing

### Doctor Slots Not Showing
- Verify doctor availability set
- Check day of week format (Mon, Tue, etc)
- Verify time range format (HH:MM-HH:MM)
- Check slotDuration is set

---

## TESTING CHECKLIST

### Backend Testing
- [ ] Can register user → OTP sent
- [ ] Can verify OTP → JWT returned
- [ ] Can login with password
- [ ] Can create appointment (pending)
- [ ] Can create payment intent
- [ ] Can receive webhook → appointment updated
- [ ] Emails sent on appointment confirmation
- [ ] Daily.co room created
- [ ] Doctor can update availability
- [ ] Admin can assign doctor
- [ ] Doctor can send documents

### Frontend Testing
- [ ] App initializes, loads token on startup
- [ ] Login screen works
- [ ] Can register & verify OTP
- [ ] All 6 booking steps work
- [ ] Can select country → service → doctor → time
- [ ] Payment sheet opens
- [ ] After payment, redirected to success
- [ ] Patient sees appointments
- [ ] Doctor sees patient list
- [ ] Video call can join
- [ ] Admin can manage doctors/services

---

END OF DOCUMENTATION
