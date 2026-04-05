# LaundroLink — Laundry Management Platform

## Overview
LaundroLink is a full-stack laundry management platform for academic environments, built with React + Express + PostgreSQL + Drizzle ORM.

## Architecture

### Frontend (`client/src/`)
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Fonts**: Inter (student portal), Manrope (staff/admin)
- **Routing**: Wouter
- **State**: TanStack Query

#### Student Portal (`client/src/pages/student/`)
Implements the LaundroFlow Student Portal reference design exactly:
- `index.tsx` — Main portal wrapper with sidebar + header + view routing
- `Sidebar.tsx` — Dark (#111828) sidebar with 7 nav items + logout
- `Header.tsx` — White header with search, bell, settings, user info
- `views/LaundryDay.tsx` — Calendar-based laundry schedule (auto-assigned by username hash)
- `views/TrackOrder.tsx` — Real-time session tracking with progress steps
- `views/LostItem.tsx` — Report lost clothing item form
- `views/FoundItems.tsx` — Display matched found items
- `views/ReportItem.tsx` — Report a found item form
- `views/Notifications.tsx` — Notification list
- `views/Profile.tsx` — User profile and preferences

#### Admin Portal (`client/src/pages/admin/`)
Full management dashboard for admin role, matching DhobiTrack admin ZIP design:
- `index.tsx` — Layout: dark sidebar (#0f1420, 200px) + white content area with rounded corners
- `AdminSidebar.tsx` — LaundroLink logo, 6 nav items, sign-out button
- `AdminTopbar.tsx` — Search bar + bell icon + user avatar
- `pages/Queue.tsx` — Live Queue Monitor: stat cards + real-time workflow table (8s polling)
- `pages/Students.tsx` — Student Management: searchable table + detail panel (real data)
- `pages/Audit.tsx` — Cycle Audit: cycle search + audit trail with step-by-step timeline
- `pages/LostFound.tsx` — Lost & Found: tabbed view for lost reports + found items
- `pages/Comms.tsx` — Communications: notification history + broadcast message panel
- `pages/Schedule.tsx` — Laundry Schedule: calendar view + weekly time slots table

#### Other Pages
- `client/src/pages/Dashboard.tsx` — Routes: student → StudentPortal, staff → StaffScanner (Dhobi Terminal), admin → AdminPortal
- `client/src/pages/WebsiteLogin.tsx` — Login/register form with role selector

### Backend (`server/`)
- **Framework**: Express + TypeScript
- **Auth**: Passport.js (local strategy) + express-session
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Replit managed)

#### Key Files
- `server/index.ts` — Express app entry
- `server/routes.ts` — Auth, machines, sessions API routes
- `server/storage.ts` — DrizzleStorage PostgreSQL implementation
- `server/auth.ts` — Password hashing (scrypt)
- `server/types.d.ts` — Express namespace extension

### Schema (`shared/schema.ts`)
- `users` — id, username, password, role (student/staff/admin), displayName, email
- `machines` — id, name, type (washer/dryer), location, status, cycleTimeMinutes
- `laundry_sessions` — id, userId, machineId, status, startedAt, endsAt, completedAt

## Running
```bash
npm run dev
```
Server on port 5000. Vite proxies `/api` to Express.

## Design Tokens (Student Portal)
- Primary blue: `#2962ff`
- Dark accent: `#0b2b8c`
- Sidebar: `#111828`
- Background: `#f3f6f9`
- Info bg: `#f0f4ff` / `#f8faff`
