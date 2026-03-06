# Styloria

## Current State

Full-stack beauty salon booking app with:
- Internet Identity auth + admin local login (styloria/Styloria@1996)
- Services, bookings, gallery screens with bottom nav
- Admin panel (dashboard, services, bookings, gallery tabs) accessible via Profile > Admin Panel (admin users only) or via admin-login screen
- Profile screen with edit, principal ID display, admin badge
- Backend: services, appointments, payments, userProfiles, galleryPhotos stored in Maps

## Requested Changes (Diff)

### Add

1. **Registered users list in Admin** - Admin > Users tab showing all registered users (name, email, phone, role) and ability to assign/revoke admin role
2. **Service image upload** - Admin can upload an image (base64 from device) for each service instead of icon placeholder; services display actual images when available
3. **Profile picture upload** - Users can upload a profile picture (base64) on their Profile screen; replaces initials avatar
4. **Dashboard today's bookings & upcoming bookings** - Admin dashboard shows today's count and upcoming count as separate stat cards alongside existing stats
5. **Notification bell in header** - All logged-in screens show a bell icon in the header that displays a badge count of pending/confirmed upcoming bookings; tapping shows a popover/sheet listing upcoming appointments
6. **Remove "Access Admin Panel" info card from non-admin profiles** - Non-admin users should not see the Principal ID admin instructions card
7. **Separate admin route** - Admin panel accessible at dedicated `/admin` path via Owner Admin Login (already exists); make the admin link on login screen more prominent; also add a "Users" tab to admin panel

### Modify

- Profile screen: Remove the "Admin Access" instructional card shown to non-admin users (the one explaining how to call `assignCallerUserRole`)
- Admin dashboard: Add "Today" and "Upcoming" booking stat cards
- Admin panel: Add "Users" tab listing all profiles with role management
- Service cards: Show actual service image if `imageUrl` is set; admin service form includes image upload via file picker (converted to data URL)
- Profile avatar: Support uploading a profile picture; store as `profilePictureUrl` field (save via `saveCallerUserProfile` extended or a new field in profile — use existing `saveCallerUserProfile` with new field approach via backend update)

### Remove

- Non-admin "Admin Access" instructional card (with principal ID copy and `assignCallerUserRole` instructions) from ProfileScreen

## Implementation Plan

### Backend changes
1. Add `profilePictureUrl` field to `UserProfile` type
2. Update `saveCallerUserProfile` to accept `profilePictureUrl` parameter
3. Add `listAllUserProfiles` query (admin only) returning all registered profiles
4. Add `todayBookingsCount` and `upcomingBookingsCount` to `AdminStats`
5. Update `getAdminStats` to compute today/upcoming counts

### Frontend changes
1. Update `backend.d.ts` to reflect new backend API (new profile fields, new admin functions)
2. **Profile screen**: Replace initials avatar with uploaded image if available; add camera/upload button overlay; remove admin instructions card for non-admins
3. **HomeScreen / all main screens**: Add notification bell icon in the gradient header; show badge with count of user's pending+confirmed upcoming appointments; clicking opens a bottom sheet listing appointments
4. **Admin dashboard**: Add Today and Upcoming stat cards using new `AdminStats` fields
5. **Admin Services tab**: Add image upload button in Add/Edit service dialogs; display actual image in service cards
6. **Admin panel**: Add "Users" tab listing all user profiles with role badge; each row has "Make Admin" / "Remove Admin" button (using existing `assignCallerUserRole`)
7. Keep all existing functionality intact
