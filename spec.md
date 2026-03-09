# Styloria

## Current State
Full-stack salon booking app with Motoko backend and React/TypeScript frontend. The app has authentication (Internet Identity + owner admin login), services listing, booking flow, gallery, admin panel with Dashboard/Services/Bookings/Gallery/Users tabs.

Services are stored in a non-stable backend Map that resets on each deployment. The frontend relies on the backend having services present. There are currently no default services seeded.

Gallery photos and service images are stored as base64 DataURLs directly in canister state. Large images (> ~500KB) exceed ICP message size limits causing upload failures.

## Requested Changes (Diff)

### Add
- Default services list seeded in the Admin Panel: when no services exist and user is owner admin, show a "Seed Default Services" button that creates all 19 services across 4 categories (Hair, Makeup, Nails, Skin)
- Image compression utility: before any image is stored as a data URL (gallery upload, service image upload), resize and compress it to max 400x400px at 0.6 JPEG quality using canvas, keeping it under ~150KB

### Modify
- Services list (Hair: Haircut ₹499, Hair Spa ₹1,299, Hair Smoothening ₹4,999, Hair Coloring ₹2,499, Keratin Treatment ₹5,999 | Makeup: Party Makeup ₹2,999, Engagement Makeup ₹4,999, Bridal HD Makeup ₹9,999, Airbrush Bridal ₹12,999 | Nails: Manicure ₹799, Pedicure ₹999, Nail Extensions ₹1,999, Gel Polish ₹699 | Skin: Cleanup ₹899, Fruit Facial ₹1,299, Gold Facial ₹1,999, Hydra Facial ₹3,999) — seeded via owner admin button
- Admin Services tab: the "Edit Service" dialog already exists with an Upload Image button. Ensure it works by compressing images before setting the imageUrl
- Admin Gallery tab: "Add Photo" and "Edit Photo" dialogs already have Upload Image buttons. Ensure uploads work by compressing images before storing

### Remove
- Nothing removed

## Implementation Plan
1. Add `compressImage(file: File, maxSize?: number, quality?: number): Promise<string>` utility in `src/utils/` that uses HTML Canvas to resize + compress before converting to base64
2. Replace all direct `FileReader.readAsDataURL` calls (in Admin services add/edit image upload, Admin gallery add/edit upload, Gallery screen add photo upload) with the compress utility
3. Add a `SEED_SERVICES` constant array with all 19 services and their data (name, category, price, durationMinutes, description)
4. In the Admin > Services tab, when `isOwnerAdmin` is true and `services.length === 0`, show a "Seed Default Services" button that loops through SEED_SERVICES and calls `ownerCreateService` for each
5. Validate and build
