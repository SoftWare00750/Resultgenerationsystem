# Result Generation System (RGS)

A web application for Nigerian schools to record student scores, generate printable report sheets as PDFs, and share published results with parents.

Schools get a private workspace with three everyday roles:

- **Admin / School Owner / School Proprietor** sets up the school, sessions, classes, users and students.
- **Teachers** enter scores for their own classes and publish them.
- **Parents** register their children and read published results.

A fourth role, **Central Admin**, is for the platform operator who manages all schools.

This repository contains the **frontend** (Next.js). The REST API it talks to (Node/Express + PostgreSQL) is a separate service. See [Backend](#backend).

---

## Contents

- [Features](#features)
- [Using the app](#using-the-app)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Backend](#backend)
- [Deployment](#deployment)
- [Known issues and housekeeping](#known-issues-and-housekeeping)

---

## Features

**Result creation**
- Four result types: CAT 1, CAT 2, Examination and Midterm.
- Automatic totals, averages, grades and remarks as scores are typed, with per-field maximums enforced.
- Report-sheet layouts matched to class level: Pre-School, Nursery, Primary, standard JSS/SS and Midterm.
- Pre-School skills checklist (E / S / N) and Nursery rated domains (4-3-2-1).
- Affective Domain and Psychomotor ratings, attendance, house, club, and bio fields.
- Selectable grading scale for JSS/SS reports: Standard (A–F) or Genius (A1–F9). Midterm has its own 9-point scale.
- Draft and Publish workflow so parents only see finished results.

**PDF report sheets**
- Generated in the browser with `@react-pdf/renderer` and `jsPDF`.
- Carry the school logo, name, address and motto, plus the principal's and class teacher's signatures.
- Include class statistics, subject positions and previous-term columns where available.

**School administration**
- Academic sessions with a single active session.
- Classes with a default subject list per level, and teacher assignment.
- Single-use, role-specific, 7-day **auth codes** to onboard teachers and parents.
- User and student management, with unique admission numbers.

**Accounts and billing**
- Admin sign-up with emailed 6-digit email verification.
- Plans (School Starter, Standard, Premium) with a card verified through Paystack and a free trial.
- Password reset by emailed 6-digit code.

**Platform operations (Central Admin)**
- Onboard, suspend, reactivate and remove schools (removal is recoverable).
- Cross-school user list, storage usage breakdown and platform settings.

**Resilience and privacy**
- Reads are network-first with an encrypted on-device cache as an offline fallback.
- If the primary database is full, the backend can write records to an overflow store and the UI flags it.

---

## Using the app

A step-by-step **User Guide** is built into the application at **`/guide`**:

- Signed-out visitors can open it from the landing page (Resources), the sign-in page, or the admin sign-in page.
- Signed-in users find **User Guide** at the bottom of the left-hand menu. It opens on the tab for their role.
- `/guide?tab=teacher` (or `admin`, `parent`, `grading`, `faq`) links straight to a section.

### Quick tour

| Role | Sign in at | First steps |
|------|------------|-------------|
| Admin | `/auth/admin` | Register your school → School Settings → create and activate a Session → create Classes and assign teachers → generate Auth Codes → add Students |
| Teacher | `/auth/login` | Register with your auth code → upload your signature in My Profile → My Students → Create Results → Publish → Download PDF |
| Parent | `/auth/login` | Register with your auth code → check My Wards (register a ward if needed) → View Results |
| Central Admin | `/auth/admin` | Schools → onboard a school with its first admin |

### Result scoring at a glance

| Class level / type | Per-subject fields | Total |
|--------------------|--------------------|-------|
| CAT 1 or CAT 2 | Notes (5) + Assignment (5) + Test (10) | 20 |
| Examination, JSS/SS | CAT 1 (20) + CAT 2 (20) + Exam (60) | 100 |
| Examination, Nursery/Primary | C.A. (40) + Exam (60) | 100 |
| Midterm | 1st C.A. (10) + 2nd C.A. (10), graded as a percentage | 20 |
| Pre-School / Kindergarten | Skills checklist (E / S / N), no numeric scores | n/a |

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS 3, Radix UI primitives, shadcn-style components, `lucide-react` icons, `sonner` toasts |
| State | Zustand (auth store, result store) |
| Validation | Zod |
| PDF | `@react-pdf/renderer`, `jspdf` |
| Payments | Paystack Inline (card verification at admin sign-up) |
| API client | `fetch` wrapper in `src/lib/api.ts` (JWT bearer token, 20 s timeout) |
| Backend | Node/Express + PostgreSQL (separate service) |

---

## Getting started

### Prerequisites

- **Node.js 20.9 or newer** (required by Next.js 16) and npm
- A running RGS backend API, local or hosted (see [Backend](#backend))

### Install and run

```bash
git clone https://github.com/SoftWare00750/Resultgenerationsystem.git
cd Resultgenerationsystem/result-generation-system

npm install
cp .env.example .env.local      # then edit the values you need
npm run dev
```

Open <http://localhost:3000>.

`./start.sh` does the same in one step: installs dependencies if `node_modules` is missing, then starts the dev server.

### How the frontend finds the API

`src/lib/api.ts` picks its base URL in this order:

1. `NEXT_PUBLIC_API_URL`, if set. Use this in production.
2. Otherwise `window.location.origin + "/api"`. In development, `next.config.js` rewrites `/api/*` to `BACKEND_URL` (default `http://localhost:4000`), so you normally only need the backend running on port 4000.

---

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `BACKEND_URL` | Local dev, optional | Where the dev-server rewrite forwards `/api/*`. Default `http://localhost:4000`. |
| `NEXT_PUBLIC_API_URL` | Production | Full URL of the deployed API including `/api`, for example `https://your-backend.example.com/api`. Leave unset locally. |
| `NEXT_PUBLIC_APPWRITE_*` | No | Legacy. Listed in `.env.example` but no current source file uses them. See [Known issues](#known-issues-and-housekeeping). |

Server-side secrets such as the Paystack secret key, database credentials and email settings belong to the backend, not this repository.

---

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run Next.js linting |
| `npx tsc --noEmit` | Type-check the whole project |

---

## Project structure

```
result-generation-system/
├── public/                  Images, logos, partner logos, Gilroy fonts
├── docs/                    Design notes (result-sheet redesign)
├── src/
│   ├── app/                 Routes (Next.js App Router)
│   │   ├── page.tsx           Landing page
│   │   ├── pricing/           Plans and pricing
│   │   ├── guide/             In-app User Guide
│   │   ├── auth/              login, admin, register, forgot-password
│   │   ├── admin/             dashboard, users, auth-codes, classes, students,
│   │   │                      results, sessions, settings
│   │   ├── teacher/           dashboard, students, classes, results, profile
│   │   ├── parent/            dashboard, wards, results
│   │   └── central_admin/     dashboard, schools, users, storage, settings
│   ├── components/
│   │   ├── layout/            DashboardLayout (role-aware sidebar)
│   │   ├── shared/            ProtectedRoute, SignatureUpload, ErrorBoundary, ...
│   │   └── ui/                Button, Card, Dialog, Select, Table, Tabs, ...
│   ├── lib/
│   │   ├── api.ts             Fetch wrapper and token helpers
│   │   ├── services/          auth, students, results, classes, sessions,
│   │   │                      school, payments, centralAdmin, pdf-generator,
│   │   │                      result-stats
│   │   ├── store/             Zustand stores
│   │   ├── types/index.ts     Types, grading scales, class and subject lists
│   │   ├── secureCache.ts     Encrypted offline cache
│   │   └── paystack.ts        Paystack Inline loader
│   ├── db/pool.js           Postgres pool (backend code)
│   └── server.js            Backend entry placeholder (see Backend)
├── .env.example
├── next.config.js
└── start.sh
```

Routes are protected by `ProtectedRoute` and each dashboard is wrapped in `DashboardLayout`, which builds the sidebar from the signed-in role.

---

## Backend

The frontend expects a JSON REST API under `/api`, authenticated with a JWT sent as `Authorization: Bearer <token>`. The endpoints it calls are:

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Admin sign-up | `POST /admin-signup/request-code`, `POST /admin-signup/verify-code` |
| Password reset | `POST /password-reset/request-code`, `POST /password-reset/reset` |
| Payments | `POST /payments/initialize`, `GET /payments/verify/:reference` |
| Auth codes | `GET`, `POST /auth-codes`, `DELETE /auth-codes/:id` |
| Users | `GET /users`, `PATCH`, `DELETE /users/:id` |
| Students | `GET /students` (filters `class`, `parentId`), `GET /students/check-admission/:number`, `POST`, `PATCH`, `DELETE` |
| Classes | `GET`, `POST /classes`, `PATCH`, `DELETE /classes/:id` |
| Sessions | `GET /sessions`, `GET /sessions/active`, `POST /sessions`, `PATCH /sessions/:id/activate`, `DELETE /sessions/:id` |
| Results | `GET /results` (filter `studentId`), `POST`, `PATCH`, `DELETE /results/:id` |
| School | `GET`, `PUT /school` |
| Central Admin | `/central/overview`, `/central/schools`, `/central/users`, `/central/students`, `/central/results`, `/central/storage`, `/central/settings`, `/central/central-admins` |

`src/db/pool.js` shows the database configuration the backend uses: a PostgreSQL pool built from `DATABASE_URL`, or from `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` and `PGPASSWORD`. In this repository `src/server.js` is only a placeholder, so the working API lives in its own codebase.

---

## Deployment

**Frontend (for example on Vercel)**

1. Import the repository and set the project root to `result-generation-system`.
2. Set `NEXT_PUBLIC_API_URL` to the public HTTPS URL of your backend, ending in `/api`.
3. Deploy. The build command is `npm run build`.

**Self-hosted**

```bash
npm run build
npm start        # serves on port 3000
```

**Backend**: deploy separately (a hosted Node service with a PostgreSQL database), and allow your frontend's origin for CORS.

After the first deploy, create the first Admin through **Create an account**, complete School Settings, and follow the checklist in the in-app guide.

---

## Known issues and housekeeping

These were found while reviewing the repository. None block local development.

1. **Outdated docs.** `SETUP_GUIDE.md` and `DEPLOYMENT.md` describe an earlier Appwrite-based version (Appwrite collections, Next.js 14). The app now uses the REST API described above. Treat those two files as historical or rewrite them.
2. **Legacy Appwrite code.** `src/lib/appwrite.ts` and the `NEXT_PUBLIC_APPWRITE_*` entries in `.env.example` are not imported by any current source file and can be removed.
3. **`node_modules` is committed.** 86 files under `result-generation-system/node_modules` are tracked even though `.gitignore` lists it. Remove them from the index with `git rm -r --cached node_modules`.
4. **Fonts.** `globals.css` declares Gilroy Bold and Extra Bold, but only the Extra Bold files are in `public/fonts`. Bold falls back to Inter until the licensed Bold files are added.
5. **Overall grade badge.** The server calculates it on a fixed A–F scale regardless of the grading scale chosen for a result. Only per-subject grades and the printed grade key follow the chosen scale. See `docs/RESULT_SHEET_REDESIGN_NOTES.md`.
6. **Backend not included.** `src/server.js` is a placeholder; you need the separate API to run the app end to end.

---

## Further reading

- [`docs/RESULT_SHEET_REDESIGN_NOTES.md`](docs/RESULT_SHEET_REDESIGN_NOTES.md): how the nine report-sheet layouts map to the result form and PDF generator.
- In the app: **User Guide** at `/guide`.
