# Task deadline must fall within the project's date range

## Requirement

When a project has a start date and/or end date, any task deadline must fall inside
that range — never before the project start, never after the project end.

**Note:** Tasks only have ONE date field: `deadline` (no start date). So the rule is:

- `deadline >= project.startDate` (if project has a startDate)
- `deadline <= project.endDate` (if project has a endDate)
- Task with no deadline → always allowed
- Project date is null → no constraint on that side
- Comparison is by **calendar day, inclusive** (deadline on the project's start/end day is valid)
- Existing out-of-range tasks are left untouched — only new/edited deadlines are validated

**Confirmed with user:** inclusive boundaries (due ON project start/end day is valid), AND
also enforce `project.startDate <= project.endDate` on project create/edit.

## Research findings

| Surface | File | Submits to | Project dates in scope? |
|---|---|---|---|
| Create (board modal) | `src/components/tasks/TaskForm.tsx` | `POST /api/projects/[id]/tasks` | ❌ board page doesn't fetch project |
| Create (project page inline form) | `src/app/(dashboard)/projects/[projectId]/page.tsx:364` `handleCreateTask` | same POST | ✅ `project` state has dates (L110, L151) |
| Edit (task detail modal) | `src/components/tasks/TaskDetail.tsx:170` `handleSave` | `PUT /api/tasks/[id]` | ❌ props only include task/columns/members |

- POST validation today: only `title`/`columnId` required (`api/projects/[id]/tasks/route.ts:57`)
- PUT validation today: none for deadline (`api/tasks/[id]/route.ts:112-117`, task row already fetched at L53 → has `projectId`)
- `GET /api/projects/[id]` returns full project incl. `startDate`/`endDate`
- TaskForm / project page already surface server `data.error` via toast; **TaskDetail shows generic "Failed to update"** (L186) — needs fixing to show the server message
- Date inputs are plain `<input type="date">` — support native `min`/`max` attributes

## Changes

### 1. Server — `src/app/api/projects/[id]/tasks/route.ts` (POST)
- After auth/params, fetch project: `supabase.from("Project").select("startDate, endDate").eq("id", id).single()`
- 404 if project not found
- If `deadline` is set: validate against dates (date-only, inclusive) → `400` with clear message:
  - `"Task deadline must be on or after the project start date (YYYY-MM-DD)"`
  - `"Task deadline must be on or before the project end date (YYYY-MM-DD)"`

### 2. Server — `src/app/api/tasks/[id]/route.ts` (PUT)
- When `body.deadline !== undefined && body.deadline`: fetch project dates using
  `task.projectId` (already selected at L55), same validation → `400`
- Clearing the deadline (null) stays allowed

### 3. Client — `src/app/(dashboard)/projects/[projectId]/board/page.tsx`
- Add project fetch to `loadData` (`fetch(/api/projects/${projectId})` — 4th parallel request)
- Pass `projectStartDate` / `projectEndDate` props to both `<TaskForm>` (L224) and `<TaskDetail>` (L236)

### 4. Client — `src/components/tasks/TaskForm.tsx`
- New optional props `projectStartDate?: string | null`, `projectEndDate?: string | null`
- Deadline input (L234): `min` / `max` attributes (date part of ISO string) so the picker greys out invalid days
- `handleSubmit`: client-side range check → `toast.error(...)` before fetch
- Server 400 already surfaced (L125)

### 5. Client — `src/components/tasks/TaskDetail.tsx`
- Same optional props; `min`/`max` on deadline input (L406)
- `handleSave`: client-side range check → toast
- **Fix L186**: surface `data.error` from server instead of `"Failed to update"`

### 6. Client — `src/app/(dashboard)/projects/[projectId]/page.tsx` (inline create form)
- `project` state already has dates → `min`/`max` on deadline input (~L1035)
- `handleCreateTask`: client-side range check → toast (server error already surfaced L388)

### 7. Project-level guard — approved
- `POST /api/projects` + `PUT /api/projects/[id]`: `400` when `endDate < startDate`
- Client: `min`/`max` binding between the two date inputs on
  `projects/new/page.tsx`, `projects/[projectId]/page.tsx` (edit form), `projects/[projectId]/settings/page.tsx`

## Verification
1. `npx tsc --noEmit`, `npx next build`, lint changed files
2. Manual: create project (start 2026-10-01, end 2026-10-31)
   - Task deadline 2026-09-30 → blocked (toast + 400)
   - Task deadline 2026-11-01 → blocked
   - Task deadline 2026-10-01 / 2026-10-31 → allowed (inclusive)
   - No deadline → allowed
   - Edit an existing task's deadline outside range → blocked
   - Same project with dates cleared (null) → any deadline allowed

## Pending from previous task (do not forget)
- `get_projects` RPC still returns `42P13` (verified after user's first run) — user must re-run
  the fixed two-function SQL block in Supabase SQL Editor; project list pages are erroring
  (`List projects error` in dev logs). Feedback table is confirmed working (200).
