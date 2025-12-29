# FormSuite - Enterprise Form Management System

A production-ready full-stack form management platform with role-based access control, Google Sheets integration via MongoDB Atlas Triggers, and comprehensive error handling.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running](#running)
- [Deployment](#deployment)
- [MongoDB Atlas Trigger Implementation](#mongodb-atlas-trigger-implementation)
- [Functional Overview](#functional-overview)
- [Security](#security)
- [Observability & Logging](#observability--logging)
- [ADRs](#adrs)
- [Breaking Changes Policy](#breaking-changes-policy)
- [Appendix](#appendix)

---

## Overview

- **Purpose**: Enterprise-grade form builder and response management system
- **Primary Users**: Administrators (form creators) and end-users (form respondents)
- **Responsibilities**:
  - Form creation with multiple question types
  - Response collection and management
  - Automatic Google Sheets synchronization via MongoDB Atlas Triggers
  - Role-based access control with module-level permissions

---

## Architecture

### System Components

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │◄───────►│   Express    │◄───────►│  MongoDB    │
│  (React)    │  HTTPS │   Server     │         │   Atlas     │
└─────────────┘         └──────────────┘         └─────────────┘
                              │                          │
                              │                          │
                              ▼                          ▼
                        ┌──────────────┐         ┌─────────────┐
                        │ Google Sheets│         │ Atlas       │
                        │     API      │         │  Triggers   │
                        └──────────────┘         └─────────────┘
```

### Component Flow

1. **Client Layer**: React SPA with Vite, Tailwind CSS v4
2. **API Layer**: Express.js with TypeScript, JWT authentication
3. **Data Layer**: MongoDB Atlas with Mongoose ODM
4. **Integration Layer**: MongoDB Atlas Triggers for async Google Sheets sync
5. **Logging Layer**: Winston logger with MongoDB transport

---

## Tech Stack

### Frontend

- React 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- Tailwind CSS 4.1.17
- React Router 7.10.1
- Axios 1.13.2

### Backend

- Node.js 18+
- Express 4.21.2
- TypeScript 5.9.3
- Mongoose 8.9.3
- Winston 3.17.0 (logging)
- Google APIs 144.0.0

### Infrastructure

- MongoDB Atlas (database)
- MongoDB Atlas App Services (triggers)
- Render (deployment)

---

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (M0 cluster minimum)
- Google Cloud Service Account with Sheets API enabled
- Git

**Minimal setup commands:**

```bash
node --version  # v18+
npm --version   # 9+
```

---

## Getting Started

### Clone and Install

```bash
git clone <REPO_URL>
cd <REPO_DIR>

# Install shared package
cd shared && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install
```

### Basic Commands

```bash
# Development
cd server && npm run dev      # Start backend (port 5000)
cd client && npm run dev       # Start frontend (port 3000)

# Production build
cd server && npm run build     # Compile TypeScript
cd client && npm run build     # Build static assets
```

---

## Configuration

Create `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/<DB_NAME>?retryWrites=true&w=majority

# Authentication
JWT_SECRET=<GENERATE_SECURE_RANDOM_STRING>
JWT_REFRESH_SECRET=<GENERATE_SECURE_RANDOM_STRING>

# CORS
CLIENT_URL=http://localhost:3000

# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_JSON=`{<google-service-accounts.json - credentials>}`

# Admin Seed (optional)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<SECURE_PASSWORD>
ADMIN_NAME=Administrator
```

**⚠️ Do not commit `.env` files to version control.**

---

## Running

### Development Mode

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- API: `http://localhost:5000/api`

### Production Mode

```bash
# Build both
cd server && npm run build && cd ..
cd client && npm run build && cd ..

# Start server
cd server && npm start
```

---

## Deployment

Deployed on Render (frontend as static site and backend as web service). Database deployed as a MongoDB Atlas cluster.

**Render Configuration:**

- Backend: Web Service (Node.js)
- Frontend: Static Site (Vite build output)
- Environment variables configured in Render dashboard

**MongoDB Atlas:**

- Cluster: M0 or higher
- Database: `form-suite`
- App Services: Enabled for triggers

---

## MongoDB Atlas Trigger Implementation

### Overview

Form responses are automatically synchronized to Google Sheets via MongoDB Atlas Database Triggers, eliminating blocking operations in the API layer.

### Architecture

1. **Trigger Setup**: Database trigger on `formresponses` collection
2. **Event Types**: `insert` and `update` operations
3. **Function**: Custom Atlas Function that calls Google Sheets API
4. **Credentials**: Google Service Account JSON stored as Atlas Secret

### Pseudocode Flow

```
1. FormResponse document inserted/updated in MongoDB
2. Atlas Trigger fires (insert/update event)
3. Trigger function executes:
   a. Fetch Form document to get googleSheetUrl
   b. Fetch User document for user metadata (if userId exists)
   c. Authenticate with Google using service account credentials
   d. Extract spreadsheet ID from URL
   e. Get current headers from Sheet
   f. Add new question headers if needed
   g. Map answers to columns using question titles
   h. Append new row OR update existing row (based on googleSheetRowNumber)
   i. Update FormResponse document with row number and sync status
4. Log success/failure to ErrorLog collection
```

### Required Credentials

1. **MongoDB Atlas App Services**:

   - Create App Service linked to your cluster
   - Database: `form-suite` (or your DB name)
   - Collection: `formresponses`

2. **Atlas Secrets**:

   - Secret Name: `GOOGLE_SERVICE_ACCOUNT_JSON_SECRET`
   - Value: Complete Google Service Account JSON

3. **Atlas Values**:

   - Value Name: `googleCredentials`
   - Type: Linked to `GOOGLE_SERVICE_ACCOUNT_JSON_SECRET`

4. **Google Service Account**:

   - Enable Google Sheets API
   - Create service account with Editor role
   - Share target Google Sheets with service account email
   - Download JSON credentials

5. **Atlas Function Dependencies**:
   - None (uses built-in `context.http` for REST API calls)
   - No external npm packages required (uses internal crypto package)

### Benefits

- **Non-blocking**: API responses return immediately
- **Resilient**: Retry logic can be implemented in trigger
- **Scalable**: Triggers scale independently of API server
- **Decoupled**: Sheet sync logic separated from business logic

---

## Functional Overview

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user

  - Body: `{ email, password, name, role? }`
  - Response: `{ message, success }`

- `POST /api/auth/login` - Login user

  - Body: `{ email, password }`
  - Response: `{ _id, email, name, role }` (sets HttpOnly cookies)

- `POST /api/auth/logout` - Logout user

  - Response: `{ message }` (clears cookies)

- `GET /api/auth/refresh` - Refresh access token

  - Response: `{ message, user }` (uses refresh_token cookie)

- `GET /api/auth/csrf-token` - Get CSRF token
  - Response: `{ csrfToken }`

### Forms (`/api/forms`)

- `GET /api/forms` - Get all forms (paginated, filtered by role)

  - Query: `?page=1&limit=9`
  - Response: `{ data: Form[], pagination: {...} }`

- `GET /api/forms/:id` - Get form by ID

  - Response: `Form` object

- `POST /api/forms` - Create form (Admin only)

  - Body: `{ title, description, questions, googleSheetUrl?, ... }`
  - Middleware: `validateSheetAccess` (validates Google Sheet)
  - Response: `Form` object

- `PUT /api/forms/:id` - Update form (Admin only)

  - Body: `{ title?, description?, questions?, ... }`
  - Response: `Form` object

- `DELETE /api/forms/:id` - Soft delete form (Admin only)

  - Response: `{ message }`

- `GET /api/forms/:id/stats` - Get form statistics (Admin only)
  - Response: `{ responseCount, ... }`

### Responses (`/api/responses`)

- `POST /api/responses` - Submit form response

  - Body: `{ formId, answers }`
  - Response: `FormResponse` (Atlas Trigger handles sheet sync)

- `PUT /api/responses/:id` - Update response

  - Body: `{ answers }`
  - Response: `FormResponse` (Atlas Trigger handles sheet sync)

- `GET /api/responses/my` - Get current user's responses (paginated)

  - Query: `?page=1&limit=10&search=...`
  - Response: `{ data: FormGroup[], pagination: {...} }`

- `GET /api/responses/:id` - Get response by ID

  - Response: `FormResponse` with populated form

- `GET /api/responses/my/count` - Get submission count

  - Response: `{ count }`

- `GET /api/responses/form/:formId` - Get all responses for form (Admin only)
  - Response: `FormResponse[]`

### Users (`/api/users`)

- `GET /api/users` - Get all users (Admin only, paginated)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### System Settings (`/api/system-settings`)

- `GET /api/system-settings` - Get system settings
- `PUT /api/system-settings` - Update system settings (SuperAdmin only)

---

## Security

Security controls implemented:

- ✅ **Authentication**: JWT-based (access + refresh tokens in HttpOnly cookies)
- ✅ **Authorization**: Role-based (SUPERADMIN, ADMIN, USER) with module-level permissions
- ✅ **CSRF Protection**: Token-based CSRF validation for state-changing requests
- ✅ **Secrets management**: Environment variables (`.env` files, not committed)
- ✅ **Input validation**: Mongoose schema validation + custom validators
- ✅ **Transport**: HTTPS enforced (Helmet.js security headers)
- ✅ **Rate Limiting**: Express-rate-limit (20 auth attempts/15min, 100 API requests/15min in production)
- ✅ **CORS**: Whitelist-based origin validation

**Search tradeoff**

Some list endpoints support `search` using MongoDB `$regex` (case-insensitive) for flexible matching (including regex patterns). This is intentionally kept for functionality, but it can increase CPU usage at scale and often prevents efficient index usage. If you need more robust and scalable search later, consider MongoDB text indexes or Atlas Search.

---

## Observability & Logging

**Logger**: Winston 3.19.0

**Configuration:**

- **Production**: Console + MongoDB transport (error, warn levels only)
- **Development**: Console + File transport + MongoDB transport (all levels)

**Persistence**: Error and warning logs are persisted to MongoDB via a MongoDB transport.

**Log Levels:**

- `error` (0): Unexpected errors, system failures → MongoDB + Console
- `warn` (1): Operational errors, validation failures → MongoDB + Console
- `info` (2): System events, startup messages → Console only (dev), File (dev)
- `http` (3): HTTP request logs → File only (dev)
- `debug` (4): Detailed debugging → File only (dev)

**ErrorLog Collection:**

- Auto-cleanup: 30-day TTL index
- Fields: `level`, `message`, `stack`, `context`, `timestamp`

**Log Locations:**

- Console: Always active (colorized)
- Files: `server/logs/error.log`, `server/logs/combined.log` (dev only)
- MongoDB: `errorlogs` collection

---

## ADRs

### ADR-001: MongoDB Atlas Triggers for Google Sheets Sync

- **Decision**: Use Atlas Database Triggers instead of synchronous API calls
- **Reason**: Eliminates blocking operations, improves API response times, enables retry logic
- **Trade-off**: Eventual consistency (row number updated asynchronously), requires Atlas App Services setup

### ADR-002: Winston Logger with MongoDB Transport

- **Decision**: Centralized logging with MongoDB persistence for errors/warnings
- **Reason**: Enables log querying, aggregation, and long-term storage without file system dependencies
- **Trade-off**: Additional database writes, but only for error/warn levels to minimize impact

### ADR-003: JWT with HttpOnly Cookies

- **Decision**: Store JWT tokens in HttpOnly cookies instead of localStorage
- **Reason**: Prevents XSS attacks from accessing tokens, automatic cookie handling
- **Trade-off**: Slightly more complex CSRF protection required

---

## Breaking Changes Policy

Breaking changes to API endpoints will be versioned via URL path (`/api/v2/...`). Database schema changes will be handled via migration scripts. Client-side breaking changes will be communicated via release notes. No breaking changes will be introduced in patch versions.

---

## Appendix

### Useful Commands

```bash
# Development
cd server && npm run dev
cd client && npm run dev

# Build
cd server && npm run build
cd client && npm run build

# Type checking
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```

### Key Files

```
<REPO_DIR>/
├── server/
│   ├── src/
│   │   ├── server.ts              # Express app entry point
│   │   ├── database/connection.ts # MongoDB connection
│   │   ├── lib/logger/            # Winston logger config
│   │   ├── models/                # Mongoose models
│   │   ├── controllers/           # Route handlers
│   │   ├── routes/                 # Express routes
│   │   ├── middlewares/           # Auth, error, rate limit
│   │   └── services/              # Google Sheets service
│   └── package.json
├── client/
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── routes/AppRoutes.tsx   # Route definitions
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API service functions
│   │   └── components/            # Reusable UI components
│   └── package.json
└── shared/
    └── src/                        # Shared types, enums, interfaces
```

### Default Admin Credentials

User accounts are created through the user management API (`POST /api/users`). Set up your first admin user by making a direct database insert or through the registration endpoint with appropriate role assignment.

⚠️ **In production, change default credentials immediately!**

---

**Last Updated**: December 29, 2025
