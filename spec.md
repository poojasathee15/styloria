# Styloria Beauty Salon App

## Current State
The project has only the base Caffeine scaffold — no backend Motoko code and no application UI exists yet. The previous build attempt failed.

## Requested Changes (Diff)

### Add
- **User Authentication**: Email/password registration and login (stored in backend), plus Internet Identity (ICP) login. User fields: name, phone, email, password (hashed).
- **Services catalog**: Backend stores salon services with name, category, price, duration, description, imageUrl. Pre-seeded with Haircut, Hair Spa, Facial, Party Makeup, Bridal Makeup, Nail Art categories (Hair, Makeup, Facial, Nails, Bridal).
- **Appointment booking**: User selects service, date, time slot, adds notes. Backend creates booking with status (Pending, Confirmed, Completed, Cancelled). Generates unique booking ID.
- **My Bookings**: View upcoming and past bookings with status.
- **Profile**: View/edit profile name, phone. View booking history. Logout.
- **Admin panel**: Admin login (separate role), manage services (CRUD), view all bookings, update booking status, basic revenue stats.
- **Payment simulation**: Stripe-style payment flow (Razorpay not available on ICP; simulate payment and record payment record with booking).

### Modify
- main.tsx: wire up routing and auth context

### Remove
- Nothing (fresh build)

## Implementation Plan
1. Select `authorization` component for role-based access (user/admin roles).
2. Generate Motoko backend with:
   - User registration/login (email+password, storing hashed password, role: user/admin)
   - Services CRUD (admin only for create/update/delete, public read)
   - Appointments: create, list by user, list all (admin), update status
   - Payment records: create on booking confirmation
   - Time slots: generate available slots for a given date/service
3. Build frontend:
   - Auth screens: Login, Register, Forgot Password (UI only)
   - Home screen: welcome banner, featured services, categories filter, CTA button, bottom nav
   - Services screen: grid of services with image, price, duration
   - Booking flow: service selector → date picker → time slot grid → notes → summary → confirm
   - Payment screen: order summary → pay button → success screen with booking ID
   - My Bookings screen: upcoming/past tabs, booking cards with status badge
   - Profile screen: view/edit form, booking history, logout
   - Admin screens: login, dashboard, services management, bookings management
   - Bottom navigation bar: Home, Bookings, Services, Profile
