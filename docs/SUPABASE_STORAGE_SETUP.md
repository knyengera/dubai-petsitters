# Supabase Storage Setup

This app uses Supabase Storage for profile photos, KYC documents, and all other image uploads.

## Required environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Client-side uploads (authenticated users) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin KYC document review (signed URLs) |

Add these to `.env.local`. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Buckets

| Bucket | Access | Used for |
|--------|--------|----------|
| `avatars` | Public read | Profile photos |
| `kyc-documents` | Private | National ID / passport uploads |
| `public-uploads` | Public read | Pets, hosts, vets, blog, lost pets, partners |

Path convention: `{userId}/{category}/{label}-{timestamp}.{ext}`

Examples:
- `9dba6543-.../avatar/avatar-1710000000.webp` → `avatars` bucket
- `9dba6543-.../id-document/id-document-1710000000.webp` → `kyc-documents` bucket
- `9dba6543-.../pets/my-pet-1710000000.webp` → `public-uploads` bucket

## WebP conversion

JPEG, PNG, and other raster images are converted to WebP in the browser before upload via [`src/lib/storage/convert-to-webp.ts`](../src/lib/storage/convert-to-webp.ts). This runs automatically inside `uploadAppFile`.

- **Converted:** JPEG, PNG, BMP, TIFF, HEIC/HEIF
- **Skipped:** WebP (already optimal), GIF (preserves animation), SVG, PDF
- **Defaults:** 85% quality, max 2048×2048 px (downscaled if larger)
- **Fallback:** If conversion fails, the original file is uploaded unchanged

## Apply migrations

Storage buckets and RLS policies are defined in:

- `supabase/migrations/20250612000001_storage_buckets.sql` — `avatars`, `kyc-documents`
- `supabase/migrations/20250615000000_public_uploads_bucket.sql` — `public-uploads`

**Local:**

```bash
supabase db push
```

**Remote:** Link your project (`supabase link`) then push, or run the SQL in the Supabase Dashboard → SQL Editor.

Verify buckets exist under **Storage** in the Supabase Dashboard.

## Upload flow (client)

All user-facing uploads go through [`src/lib/storage/upload.ts`](../src/lib/storage/upload.ts):

```typescript
import { uploadAppFile } from "@/lib/storage/upload";

const url = await uploadAppFile("public-uploads", file, userId, "pets", "photo");
```

The shared [`ImageUpload`](../src/components/common/ImageUpload.tsx) component wraps this for forms.

## Admin KYC review

KYC documents are private. Admins review them via a server action that uses the service role:

- [`src/lib/admin/kyc-actions.ts`](../src/lib/admin/kyc-actions.ts) — `getAdminKycSignedUrl()`
- [`src/components/pages/admin/AdminUsers.tsx`](../src/components/pages/admin/AdminUsers.tsx) — "View ID document" button

Signed URLs expire after 15 minutes.

## RLS summary

- **avatars / public-uploads:** Anyone can read; authenticated users can write only to their own `{userId}/` folder.
- **kyc-documents:** Users can read/write only their own folder. Admins access via service role (not client RLS).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Upload fails with RLS error | Ensure user is signed in; migration applied; path starts with their user ID |
| "Profile photo is required" after ID upload | Select a profile photo before submitting; OAuth avatars are pre-filled when available |
| Admin cannot view KYC doc | Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` |
| Images disappear after reload | Old blob URLs from the deprecated stub are not persistent — re-upload via Storage |
