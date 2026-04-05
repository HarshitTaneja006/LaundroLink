# LaundroLink — Laundry Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.0-green)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

A comprehensive full-stack laundry management platform for academic environments with AI-powered lost-and-found matching using Google Gemini Vision.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Google Gemini API key ([Get one](https://aistudio.google.com/app/apikeys))

### Installation

```bash
# Clone and install
git clone https://github.com/yourusername/laundrolink.git
cd laundrolink
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
#   SESSION_SECRET=<generate: openssl rand -hex 32>
#   GEMINI_API_KEY=<from aistudio.google.com>
#   DATABASE_URL=postgresql://user:password@localhost/laundrolink

# Initialize database
npm run db:push

# Start development server
npm run dev
```

Server runs on `http://localhost:5000` (Vite proxies `/api` to Express)

## ✨ Features

### Student Portal
- 📅 Calendar-based laundry schedule (auto-assigned by username hash)
- 🔄 Real-time session tracking with progress steps
- 🧥 Lost & Found with AI-powered matching (≥60% confidence)
- 📦 Session management (start, track, cancel)
- 🔔 Real-time notifications
- 👤 Profile management

### Staff Dashboard (Dhobi Terminal)
- 🔍 QR code scanner for workflow management
- 📊 Live queue monitoring
- 👥 Student lookup and management
- 📍 Bag tracking with IDs
- 📋 Workflow status updates

### Admin Panel
- 👥 Student Management — searchable table + detail panel
- 📊 Queue Monitor — live stats + real-time workflow table (8s polling)
- 📦 Lost & Found — tabbed view with matching details
- 📬 Communications — notification history + broadcasts
- 📅 Schedule Management — calendar view + time slots
- 🔍 Cycle Audit — search + audit trail with timeline

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: Wouter
- **State**: TanStack Query (React Query)
- **Backend**: Express 5 + TypeScript
- **Authentication**: Passport.js (local strategy) + express-session
- **Database**: PostgreSQL 16 + Drizzle ORM
- **AI Integration**: Google Gemini 2.5 Flash
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

### Project Structure

```
laundrolink/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/            # Student portal
│   │   │   │   ├── index.tsx       # Main portal with sidebar + header
│   │   │   │   ├── Sidebar.tsx     # Dark (#111828) sidebar with 7 nav items
│   │   │   │   ├── Header.tsx      # White header with search, bell, settings
│   │   │   │   └── views/
│   │   │   │       ├── LaundryDay.tsx      # Calendar-based schedule
│   │   │   │       ├── TrackOrder.tsx      # Real-time tracking
│   │   │   │       ├── LostItem.tsx        # Report lost items
│   │   │   │       ├── FoundItems.tsx      # View AI-matched items
│   │   │   │       ├── ReportItem.tsx      # Report found items
│   │   │   │       ├── Notifications.tsx   # Notification list
│   │   │   │       ├── Profile.tsx         # User profile
│   │   │   │       └── QRCode.tsx          # Student QR code
│   │   │   ├── admin/              # Admin dashboard
│   │   │   │   ├── index.tsx       # Layout (dark sidebar + white content)
│   │   │   │   ├── AdminSidebar.tsx # Logo + 6 nav items
│   │   │   │   ├── AdminTopbar.tsx  # Search + bell + avatar
│   │   │   │   └── pages/
│   │   │   │       ├── Queue.tsx    # Live queue monitor
│   │   │   │       ├── Students.tsx # Student management
│   │   │   │       ├── Audit.tsx    # Cycle audit trail
│   │   │   │       ├── LostFound.tsx # Lost & found management
│   │   │   │       ├── Comms.tsx    # Communications
│   │   │   │       └── Schedule.tsx  # Schedule management
│   │   │   ├── Dashboard.tsx         # Router (student/staff/admin)
│   │   │   └── WebsiteLogin.tsx      # Login/register form
│   │   ├── components/ui/           # Reusable UI components (shadcn)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility functions
│   │   ├── App.tsx                  # Main React component
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Tailwind styles
│   ├── index.html                   # HTML template
│   └── public/                      # Static assets
├── server/                          # Express backend
│   ├── index.ts                     # Server entry + security headers
│   ├── routes.ts                    # API routes + middleware
│   ├── storage.ts                   # Database operations (Drizzle)
│   ├── auth.ts                      # Password hashing + verification
│   ├── gemini.ts                    # AI matching service
│   ├── db.ts                        # Database connection
│   ├── matching.ts                  # AI matching orchestration
│   ├── static.ts                    # Static file serving
│   └── types.d.ts                   # TypeScript declarations
├── shared/                          # Shared code
│   └── schema.ts                    # Database schema + Zod validation
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite build config
├── drizzle.config.ts                # Drizzle ORM config
└── README.md                        # This file
```

### Database Schema

#### Users Table
```typescript
users {
  id: UUID (primary key, auto-generated)
  username: string (required, unique)
  password: string (hashed with crypto.scrypt)
  role: enum ('student' | 'staff' | 'admin')
  displayName: string
  email: string
  createdAt: timestamp
}
```

#### Machines Table
```typescript
machines {
  id: UUID (primary key)
  name: string (required)
  type: enum ('washer' | 'dryer') (required)
  location: string (required)
  status: enum ('available' | 'in_use' | 'maintenance')
  cycleTimeMinutes: integer (default: 30 washer, 45 dryer)
}
```

#### Laundry Sessions Table
```typescript
laundrySessions {
  id: UUID (primary key)
  userId: UUID (foreign key → users)
  machineId: UUID (foreign key → machines)
  status: enum ('active' | 'completed' | 'cancelled')
  startedAt: timestamp
  endsAt: timestamp
  completedAt: timestamp
  createdAt: timestamp
}
```

#### Lost Items Table
```typescript
lostItems {
  id: UUID (primary key)
  userId: UUID (foreign key → users)
  clothingType: string
  color: string
  description: string (max 1000 chars)
  status: enum ('searching' | 'matched' | 'resolved')
  createdAt: timestamp
}
```

#### Found Items Table
```typescript
foundItems {
  id: UUID (primary key)
  reportedByUserId: UUID (foreign key → users)
  clothingType: string
  color: string
  description: string (max 1000 chars)
  location: string
  imageUrl: string (secure random filename)
  status: enum ('unclaimed' | 'claimed' | 'resolved')
  claimedByUserId: UUID (foreign key → users)
  createdAt: timestamp
}
```

#### Notifications Table
```typescript
notifications {
  id: UUID (primary key)
  userId: UUID (foreign key → users)
  title: string
  message: string
  type: enum ('info' | 'success' | 'warning' | 'match')
  read: boolean (default: false)
  createdAt: timestamp
}
```

#### Laundry Workflow Table
```typescript
laundry_workflow {
  id: UUID (primary key)
  user_id: UUID (unique, foreign key → users)
  status: enum ('hand_in' | 'washing' | 'ready_for_pickup' | 'delivered')
  bag_id: string
  created_at: timestamp
  updated_at: timestamp
}
```

#### Item Matches Table (AI Matching)
```typescript
item_matches {
  id: UUID (primary key)
  lost_item_id: UUID (foreign key → lost_items)
  found_item_id: UUID (foreign key → found_items)
  match_percentage: integer (0-100)
  reasoning: string (AI explanation)
  notified: boolean
  created_at: timestamp
}
```

### Design Tokens

**Student Portal Color Scheme**
- Primary Blue: `#2962ff`
- Dark Accent: `#0b2b8c`
- Sidebar: `#111828`
- Background: `#f3f6f9`
- Info Background: `#f0f4ff` / `#f8faff`

**Typography**
- Student Portal: Inter font
- Staff/Admin: Manrope font

**UI Color Palette**
- Success: Green
- Warning: Orange
- Error: Red
- Info: Blue

**Admin Portal**
- Admin Sidebar: #0f1420 (width: 200px)
- Admin Content: white with rounded corners

## 📡 API Endpoints

### Authentication (Public, Rate Limited)
- `POST /api/auth/register` — Register new account (5 attempts per 15 min)
- `POST /api/auth/login` — Login (5 attempts per 15 min)
- `POST /api/auth/logout` — Logout (requires auth)
- `GET /api/auth/me` — Get current user info (requires auth)

### Profile (Authenticated)
- `PUT /api/profile` — Update display name and email

### Machines
- `GET /api/machines` — Get all available machines
- `PATCH /api/machines/:id/status` — Update status (staff/admin only)

### Laundry Sessions
- `GET /api/sessions` — User's session history
- `GET /api/sessions/active` — Currently active sessions
- `POST /api/sessions` — Start new laundry session
- `PATCH /api/sessions/:id/complete` — Mark session complete
- `PATCH /api/sessions/:id/cancel` — Cancel active session

### Lost & Found Items
- `GET /api/lost-items` — Get user's lost item reports
- `POST /api/lost-items` — Report a new lost item
- `GET /api/found-items` — Get AI-matched found items (or all if staff/admin)
- `POST /api/found-items` — Report a found item with image
- `POST /api/found-items/:id/claim` — Claim a found item

### Staff Scanner (Dhobi Terminal)
- `GET /api/staff/student/:username` — Lookup student (staff/admin only)
- `PUT /api/staff/student/:username/status` — Update workflow status (staff/admin only)
- `GET /api/student/workflow` — Get own workflow status
- `GET /api/student/queue-position` — Get position in processing queue

### Notifications (Authenticated)
- `GET /api/notifications` — Get user's notifications (ordered by newest)
- `PATCH /api/notifications/:id/read` — Mark single notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read

### Admin Endpoints (Admin only)
- `GET /api/admin/students` — Get all students with workflow status
- `GET /api/admin/workflows` — Get all laundry workflows
- `GET /api/admin/notifications` — Get all notifications (last 100)
- `GET /api/admin/lost-items` — Get all lost item reports (last 500)
- `GET /api/admin/found-items` — Get all found items (last 500)

### File Upload (Authenticated)
- `POST /api/upload` — Upload image (PNG/JPG/WebP, max 5MB)
- `GET /uploads/:filename` — Access uploaded file (authenticated only)

## 🔐 Security

## 🔐 Security

- ✅ Session-based authentication with secure cookies
- ✅ CSRF protection on all state-changing requests
- ✅ Rate limiting (5 login attempts per 15 min)
- ✅ Strong password validation (8+ chars, mixed case, numbers)
- ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Path traversal prevention
- ✅ Prompt injection mitigation
- ✅ Secure file uploads with random names
- ✅ Parameterized database queries (no SQL injection)
- ✅ TypeScript strict mode
- ✅ Database SSL with certificate validation (production)
- ✅ Timing-safe password comparison (prevents timing attacks)
- ✅ 24-hour session timeout
- ✅ httpOnly, SameSite=strict cookies

**Security Audit Grade: A+** — See security audit for details

## 📊 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI framework |
| **Language** | TypeScript | Type safety |
| **Build** | Vite | Fast development & bundling |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Components** | shadcn/ui | Pre-built accessible components |
| **Routing** | Wouter | Light-weight client router |
| **State** | TanStack Query | Server state management |
| **Forms** | React Hook Form + Zod | Form validation |
| **Icons** | Lucide React | SVG icon library |
| **Backend** | Express 5 | REST API framework |
| **Auth** | Passport.js | Authentication middleware |
| **Sessions** | express-session | Session management |
| **Database** | PostgreSQL 16 | Relational database |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Validation** | Zod | Runtime type checking |
| **AI** | Google Gemini 2.5 Flash | Image analysis for matching |
| **Security** | crypto | Hashing and encryption |

## 📚 Development

### Code Structure
- **Monorepo**: Client, server, and shared code in one repo
- **Shared Code**: `shared/schema.ts` — Database schema + Zod types
- **Type Safety**: TypeScript strict mode throughout
- **Validation**: Zod schemas for all inputs

### Database Migrations
```bash
# Push schema changes to database
npm run db:push

# Generate migration files (if not using auto-push)
npm run db:generate
```

### Running Locally
```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npm run check
```

### Key Directories
- `client/src/pages/` — Page components and routing
- `client/src/components/ui/` — Reusable UI components
- `server/` — Express routes and middleware
- `shared/` — Database schema and types

## 📖 Documentation

- **Setup & Installation**: See Installation section above
- **API Documentation**: See "📡 API Endpoints" section
- **Code Guidelines**: See `CONTRIBUTING.md`
- **Configuration**: See `.env.example`
- **Database Schema**: See "Database Schema" section above

## 🛠️ Available Scripts

```bash
npm run dev         # Start dev server with hot reload
npm run build       # Build for production
npm start           # Run production build
npm run check       # TypeScript type checking
npm run db:push     # Sync database schema to PostgreSQL
```

## 📝 Environment Variables

**Required:**
```bash
SESSION_SECRET=<generate: openssl rand -hex 32>
GEMINI_API_KEY=<from aistudio.google.com>
DATABASE_URL=postgresql://user:password@localhost/laundrolink
```

**Optional:**
```bash
NODE_ENV=production        # Enable security headers
PORT=5000                  # Server port (default 5000)
```

Generate `SESSION_SECRET`:
```bash
openssl rand -hex 32
```

## 🤝 Contributing

See `CONTRIBUTING.md` for:
- Code style and conventions
- Commit message format
- Pull request process
- Security considerations
- Testing guidelines

**Quick Tips:**
1. Use TypeScript for new code
2. Validate inputs with Zod
3. Write parameterized database queries
4. Test locally before submitting PR
5. Document breaking changes

## 🚀 Deployment

### Development
```bash
npm run dev
```
Runs on `http://localhost:5000` with hot reload.

### Production
```bash
npm run build
NODE_ENV=production npm start
```

**Required Production Environment:**
```bash
SESSION_SECRET=<long random string>
GEMINI_API_KEY=<your key>
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=5000
```

**Security Checklist:**
- [ ] Set `SESSION_SECRET` to random value
- [ ] Enable `NODE_ENV=production`
- [ ] Use production PostgreSQL instance
- [ ] Enable HTTPS on server
- [ ] Use firewall rules
- [ ] Monitor logs for errors
- [ ] Regular security updates

## 📄 License

MIT License — See [LICENSE](LICENSE) file

## 🔗 Useful Links

- [Google Gemini API](https://aistudio.google.com/app/apikeys)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TanStack Query](https://tanstack.com/query/)
- [shadcn/ui](https://ui.shadcn.com/)

## 📞 Support & Bug Reports

- **Issues**: [GitHub Issues](https://github.com/yourusername/laundrolink/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/laundrolink/discussions)
- **Security**: Report privately, don't create public issues

---

**Version**: 1.0.0
**Last Updated**: 2026-04-05
**Security Grade**: A+ ✅
**Status**: Production Ready
