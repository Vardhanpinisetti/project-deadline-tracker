# Project Deadline Tracker

A minimal, production-grade full-stack project tracking application built for the EnvisionStudio assessment.

---

## 1. How to Run Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Environment Variables
Both backend and frontend come pre-configured with default fallbacks so the app runs out-of-the-box with no `.env` files required. Template files are provided:

- **Server (`server/.env.example` / `server/.env`)**:
  ```env
  PORT=4000
  DB_PATH=./data/projects.db
  CLIENT_ORIGIN=http://localhost:5173
  ```
- **Client (`client/.env.example` / `client/.env`)**:
  ```env
  VITE_API_URL=http://localhost:4000
  ```

### Installation & Launch

1. **Install dependencies** across root, server, and client:
   ```bash
   npm run install:all
   ```

2. **Start backend and frontend concurrently**:
   ```bash
   npm run dev
   ```
   - Server runs on: `http://localhost:4000`
   - Client runs on: `http://localhost:5173` (navigating to `/` redirects to `/projects`)

3. **Run automated test suites** (server Supertest + client Vitest):
   ```bash
   npm test
   ```

### How Seeding Works
- On initial launch, the server checks if the SQLite `projects` table is empty.
- If empty, it seeds the 5 assessment projects within an atomic transaction.
- Seeding is strictly **idempotent**: restarting the application will never duplicate or alter existing rows.
- To manually re-seed or reset the database at any time:
  ```bash
  npm run seed
  ```
  *(Or force a clean wipe and re-seed: `npm --prefix server run seed -- --force`).*

---

## 2. Stack Choice

- **Backend (Node.js + Express + TypeScript)**: Delivers a clean, layered REST architecture (routes -> controllers -> services -> validators) with type safety across API boundaries.
- **Database (SQLite via better-sqlite3 with zero-dependency fallback)**: Zero-setup persistent file database with high-performance WAL mode and strict table-level `CHECK` constraints.
- **Validation (Zod)**: Acts as the single source of truth for runtime validation, guaranteeing non-empty trimmed titles, calendar-accurate dates, non-negative numbers, and structured HTTP 400 error payloads.
- **Frontend (React + Vite + TypeScript + Tailwind CSS)**: Sub-millisecond HMR, clean hook architecture (`useProjects`), accessible modal interactions, and Solar Gold design system without bloated UI libraries.
- **Three.js (Optional Orbit Visual)**: Lightweight, lazy-loaded 3D visualization that renders as an optional decoration and never blocks or affects core app functionality.

Edit and delete were added beyond the three required endpoints, because a real tracker needs them.

---

## 3. Decision 1: Tasks Model

I choose Option B (a separate Task table with a `projectId` reference) because tasks will grow in volume and require independent querying, updating, and pagination without rewriting the whole project record and hitting document size limits.

---

## 4. Decision 2: Sort Order

I chose nearest deadline first with null deadlines last, because a deadline tracker should surface the most time-critical work first so teams can immediately prioritize urgent work.

---

## 5. Bug Hunt

Review of the buggy helper function:
```javascript
function isOverdue(project) {
  return new Date(project.deadline) < new Date();
}
```

- **Bug 1 (Timezone Handling)**: A date-only string like `"2026-12-15"` is parsed by ECMAScript as UTC midnight (`00:00:00Z`), while `new Date()` evaluates against current local time; consequently, the result shifts by timezone and a project due today can be wrongly flagged as overdue hours before the day ends. Date-only values must be compared in a consistent local timezone without UTC parsing.
- **Bug 2 (Missing Data Handling)**: `new Date(null)` evaluates to the Unix Epoch (`1970-01-01`), meaning an open project with a null deadline is wrongly flagged as overdue, whereas `undefined` or malformed strings produce `Invalid Date`, which silently returns `false` in comparison operators and hides corrupted data; an explicit null and validity check is required.
- **Exact-Budget Decision**: When `spentAmount === budget`, the project is considered within budget (budget fully used, not exceeded), displayed with a neutral badge rather than a red alert.

---

## 6. AI Usage

I used AI assistance (Antigravity with Gemini and Claude) for rapid monorepo scaffolding, boilerplate generation, and Three.js orbit scene geometry setups; I manually reviewed and verified all date-only timezone comparisons, budget limit edge cases, Zod schemas, SQL prepared statements, and test suites across all endpoints.

---

## 7. Cinematic Scroll Architecture

- **Scaling System (`--u`)**: Computes a dynamic viewport unit (`1u = clientWidth / 1440` on >820px, `clientWidth / 390` on <=820px) keeping design proportions consistent across desktop and mobile screens.
- **Fixed SceneStack**: 4 full-viewport background layers (Day plate with radial glow fallback, Ember gradient, Night plate with procedural stars, and WebGL Three.js Orbit canvas) seamlessly crossfading via scroll progress.
- **5-Pose Orbit Choreography**: Three.js planetary orbit glides between 5 key poses across sections (`hero`, `overview`, `projects`, `orbit`, `end`) using smooth `easeInOutCubic` interpolation, scroll velocity acceleration, and subtle pointer parallax.
- **Hero Ripple Lens**: WebGL 1 shader pipeline with chromatic aberration and pointer presence easing, with graceful fallback to day plate when media is omitted.
- **Accessibility & Performance**: Full support for `prefers-reduced-motion` and a persistent "Reduce effects" toggle that disables WebGL loops and snaps animations to static readable states. All core tracker functions (CRUD, validation, filters, optimistic updates) remain 100% accessible.

