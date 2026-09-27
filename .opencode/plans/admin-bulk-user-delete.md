# Multi-select user deletion for Super Admin

## Requirement
Admin (Super Admin) can select multiple users with checkboxes in the All Users tab and delete them in one action, instead of one-by-one.

## Current state (researched)
- `src/app/(dashboard)/admin/page.tsx` (687 lines)
  - Users tab: lines 384–474, table header lines 402–408 (5 columns, no checkbox)
  - Single delete: `handleDeleteUser(userId, userName)` lines 161–181 — `confirm()` + `DELETE /api/admin/users` with `{ userId }` + removes from state
  - Per-row delete button: lines 456–463 (disabled for self)
  - No selection/search/pagination state exists
- API `src/app/api/admin/users/route.ts` — `DELETE` lines 153–212:
  - `requireSuperAdmin()`; accepts only single `userId`
  - Guards: self-delete blocked, last SUPER_ADMIN blocked
  - Manual pre-deletes: `TimeEntry`, `FileAttachment`, `ActivityLog` (no cascade), then `User` (rest cascade)
- No checkbox/bulk pattern exists anywhere — built from scratch
- Confirm pattern = bare `confirm()` (17 sites); modal template = Add-User modal (admin/page.tsx:602–684)

## Plan

### 1. API — `src/app/api/admin/users/route.ts` (DELETE)
- Accept **either** `userIds: string[]` **or** legacy `userId: string` (normalize to array)
- Validate: non-empty array, all strings → else 400
- Per-user guards (return 400 listing skipped reasons):
  - skip own account → `"Cannot delete your own account"` (filter out silently + report in response message)
  - skip last SUPER_ADMIN (count admins among remaining, never allow removing the final one)
- Loop: pre-delete `TimeEntry`/`FileAttachment`/`ActivityLog` per id, then `User` delete
- Response: `{ deleted: number, skipped?: string[] }` → 200; partial failures reported

### 2. UI — `src/app/(dashboard)/admin/page.tsx`
- New state: `selectedUserIds: Set<string>`, `bulkDeleting: boolean`
- **Header checkbox** (new `<th>` before "User", line ~402): select-all for *currently listed* users (indeterminate when partial); respects exclusions (own account not selectable)
- **Row checkboxes** (new `<td>` before user cell, line ~416): per-user toggle; disabled for own account (`user.id === session.user.id`)
- **Bulk action bar**: appears above table when `selectedUserIds.size > 0`
  - "N users selected" + **Delete Selected** button (Trash2 icon) + Clear button
- `handleBulkDeleteUsers()`:
  - `confirm("Delete N selected users? This cannot be undone.")`
  - `DELETE /api/admin/users` with `{ userIds: [...] }`
  - success → `toast.success`, remove deleted from `users` state, clear selection
  - surface server `skipped` info via `toast.error`/`toast` message
  - errors → `toast.error(data.error)`
- Keep existing per-row delete button working (legacy `userId` still supported)
- Reset selection when switching tabs or when users list reloads

### 3. Edge cases
- Own account: checkbox disabled, excluded from select-all, API also blocks as defense-in-depth
- Last SUPER_ADMIN: excluded/never deletable — if selection contains the only remaining admin(s), API skips and reports
- Select-all only covers currently rendered users (no search/pagination exists yet)

## Verification
1. `npx tsc --noEmit`, `npx next build`, lint changed files
2. Manual: select 2+ users → bulk bar appears → confirm → both removed, toast shown
3. Guards: cannot select self; single delete still works; API returns 400 for empty array
