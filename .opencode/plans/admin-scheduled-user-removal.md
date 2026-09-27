# Admin: Scheduled User Removal with Notification

## Goal
Admin can remove users **instantly** or **schedule** removal for a future date. Scheduled users get an in-app notification ("your account will be removed on X"), keep full access until then, can be restored by admin, and are blocked + purged once the date passes (lazy purge).

## Decisions (confirmed)
- Scheduled user keeps **full access** until removal date.
- Date = presets (1/3/7/14/30 days) **+** custom date picker.
- **In-app notification only** (no email — RESEND_API_KEY unconfigured).
- Admin can **cancel** scheduled removal + **Purge now** shortcut.
- **Lazy purge + access block**: auth rejects past-due users; purge runs when admin loads users list (plus optional cron route later).

## Key constraint discovered
- `Notification.userId` is `ON DELETE CASCADE` → an instant delete wipes the notification in the same transaction. So **instant = no notification** (nothing to see); only scheduled removal produces a visible notification.
- `Task.assigneeId`, `Notification.senderId`, `TimeEntry`, `FileAttachment`, `ActivityLog` have **non-cascading** FKs to `User` → they block hard deletes today (latent bug). Purge must null/delete them first.

---

## 1. Migration `migrations/019_scheduled_user_removal.sql`
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "removalScheduledAt" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "removalRequestedBy" TEXT;
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'USER_REMOVAL_SCHEDULED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'USER_REMOVAL_CANCELLED';
```
- Note: if `ALTER TYPE` errors inside the batch, run those two statements separately (PG enum-in-transaction quirk).
- User runs it in Supabase SQL Editor (manual, per repo convention).

## 2. Shared purge library `src/lib/admin-user-removal.ts` (new)
- `purgeUsers(userIds, actorId)` → `{ deleted: string[], skipped: {userId, reason}[] }`
  - Guards: skip self; skip last SUPER_ADMIN (reuse logic from current DELETE handler).
  - Null/delete non-cascading refs: `Task.assigneeId=NULL`, `Notification.senderId=NULL`, delete `TimeEntry`/`FileAttachment`/`ActivityLog` rows, then delete `User` row.
- `purgePastDueUsers()` → queries `User` where `removalScheduledAt <= now()`, calls `purgeUsers`.
- Refactor `DELETE /api/admin/users` to use `purgeUsers` (removes duplicated loop).

## 3. API `src/app/api/admin/users/removal/route.ts` (new)
- **POST — schedule**: body `{ userIds: string[], scheduledFor: ISOstring }`
  - Guards: auth (SUPER_ADMIN), not self, not last SUPER_ADMIN, date must be future; rescheduling an already-scheduled user just overwrites + re-notifies.
  - Sets `removalScheduledAt` + `removalRequestedBy`; creates one `USER_REMOVAL_SCHEDULED` notification per user: *"Your account is scheduled for removal — all data will be permanently deleted on {date}. Contact an administrator if this is a mistake."*
  - Returns `{ scheduled, skipped }`.
- **DELETE — cancel**: body `{ userIds: string[] }`
  - Clears `removalScheduledAt`/`removalRequestedBy`; sends `USER_REMOVAL_CANCELLED` notification ("removal cancelled — your account is active again").
- **Purge now** reuses existing `DELETE /api/admin/users` (instant path).
- Keep existing CORS/OPTIONS pattern from other admin routes.

## 4. Notifications plumbing
- `src/lib/notifications.ts`: add both new types to the local `NotificationType` union + `notifyRemovalScheduled()` / `notifyRemovalCancelled()` helpers.
- `src/types/index.ts`: add types to `NotificationType` union (line ~162); add `removalScheduledAt: string | null` to `User` (line ~20).
- `src/app/(dashboard)/notifications/page.tsx`: add icons to `typeIcons` map (line 18–28), e.g. `USER_REMOVAL_SCHEDULED: "🗑️"`, `USER_REMOVAL_CANCELLED: "↩️"`.

## 5. Auth block + lazy purge — `src/lib/auth.ts`
- `authorize()`: reject login if user row missing **or** `removalScheduledAt <= now()` (return null).
- `jwt` callback: add throttled re-validation — stamp `token.userCheckedAt`; every ≤5 min fetch `{ role, removalScheduledAt }`:
  - row missing or past-due → return `null` (invalidates session → signed out).
  - Verify NextAuth v5 signs out on null token during implementation; fallback = flag + middleware redirect.
- `GET /api/admin/users`: call `purgePastDueUsers()` first (lazy purge trigger), then select users **including `removalScheduledAt`**.

## 6. Admin UI — `src/app/(dashboard)/admin/page.tsx`
- Replace `window.confirm()` in `handleDeleteUser`/`handleBulkDeleteUsers` with a **Remove Users modal** (copy "Add User" overlay pattern, lines ~719–801):
  - Lists affected names/count.
  - Mode toggle: **Remove now** (destructive) vs **Schedule removal**.
  - Schedule mode: preset chips (1/3/7/14/30 days) + custom `<input type="date" min={tomorrow}>`.
  - Confirm → POST `/api/admin/users/removal` (scheduled) or DELETE `/api/admin/users` (instant); toasts for success/skipped.
- Users table:
  - Show amber "Removes {date}" badge when `removalScheduledAt` set.
  - Row action: "Cancel scheduled removal" (trash button swaps to restore icon) + keep Trash for instant.
- Bulk bar "Delete Selected" opens the same modal.

## 7. Optional (include): `src/app/api/cron/purge-users/route.ts`
- GET, guarded by `x-cron-secret: CRON_SECRET` env; calls `purgePastDueUsers()`. Not scheduled — available for Vercel cron later.

## Verification
1. User runs migration 019 in Supabase SQL Editor.
2. `npx tsc --noEmit` → `npx next build` → `npm run lint` (baseline ~109 pre-existing issues; zero new).
3. Manual tests:
   - Schedule user for tomorrow → notification row appears for them; badge increments ≤30s; user still has full access.
   - Cancel → badge/notification flips to "cancelled"; user active.
   - Schedule with a past date (set via SQL) → user blocked on next request; loading admin Users tab purges them.
   - Instant delete of user with assigned tasks → succeeds (assigneeId nulled).
   - Guards: can't remove self; last SUPER_ADMIN skipped (reported in toast).
