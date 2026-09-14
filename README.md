# IST Platform — Product Vision Prototype

A clickable prototype demonstrating one connected workflow for **school absence management and substitute coverage** at a fictional Swedish school (Bjorkbacken School). Built to communicate the product vision for the IST Platform to stakeholders.

> **This is a prototype.** All data is mock — nothing connects to a live system.

---

## What This Demonstrates

A student requests time off. Their teacher reviews and approves it. If a teacher themselves needs leave, the principal sees the staffing gap and assigns a qualified substitute — all within one platform, with messaging threaded to each request.

The prototype walks through three roles:

| Role | Persona | Route | What they see |
|------|---------|-------|---------------|
| **Principal** | Margareta Hakansson | `/principal` | Staffing dashboard, department charts, staffing gaps, substitute assignment |
| **Teacher** | Anna Lindqvist | `/teacher` | Student absence requests table, own absences, leave request form |
| **Student** | Alma Wikstrom | `/student` | Own absence requests with status tracking, conversation threads |

A **landing page** (`/`) lets you pick which role to enter.

---

## The Workflow

```
Student submits absence request
        |
        v
Teacher reviews (approve / deny)
        |
        v
Teacher requests own leave
        |
        v
Principal reviews teacher absence
        |
        v
Principal assigns qualified substitute from pool
        |
        v
All parties see status + threaded messages throughout
```

Each step is interactive in the prototype — you can approve, deny, assign substitutes, and send messages.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript |
| Build | Vite 8 |
| CSS | Tailwind CSS v4 (PostCSS-based, no config file) |
| Design System | **CUI (Common UI)** — IST's design system, built on PrimeVue |
| Components | `@ist/commonui-components` (local package) |
| Charts | Chart.js + vue-chartjs |
| Routing | Vue Router 4 |
| Icons | Google Material Symbols Rounded (loaded via Google Fonts CDN) |
| Fonts | Inter (Google Fonts CDN) |

---

## Project Structure

```
IST Product Prototype/
├── index.html                  # App entry point (loads Inter + Material Symbols)
├── package.json
├── vite.config.ts              # Vite + Vue + Tailwind plugins
├── tsconfig.json
│
├── public/
│   ├── ist-logo.svg            # IST logo used in sidebar + landing
│   ├── favicon.svg
│   ├── icons.svg
│   └── avatars/                # avatar-1.svg through avatar-8.svg
│       └── ...
│
└── src/
    ├── main.ts                 # App bootstrap — registers CommonUI + Router
    ├── App.vue                 # Root component (just <RouterView />)
    ├── app.css                 # Imports CUI styles + Material Symbols config
    │
    ├── router/
    │   └── index.ts            # 4 routes: /, /principal, /teacher, /student
    │
    ├── data/
    │   └── mock.ts             # All mock data + TypeScript interfaces
    │                            # (departments, staff, students, absences,
    │                            #  messages, substitutes, avatarMap)
    │
    ├── views/
    │   ├── LandingPage.vue     # Role selector cards
    │   ├── PrincipalView.vue   # Staffing dashboard + gaps + assign modal
    │   ├── TeacherView.vue     # Student requests table + own absences + request modal
    │   └── StudentView.vue     # Absence cards + status summary + request modal
    │
    └── components/
        ├── HeaderActions.vue   # Notification bell + messages dropdown + theme toggle
        ├── MessagingPanel.vue  # Floating chat panel (threads + compose)
        ├── KpiCard.vue         # Dashboard stat card (icon, value, trend)
        ├── DepartmentChart.vue # Stacked bar charts (staff + student attendance)
        └── ProgressBar.vue     # Reusable progress bar
```

---

## Key Views in Detail

### Landing Page (`/`)

Three role cards with persona names, descriptions, and Material Symbols icons. Clicking a card navigates to that role's dashboard.

### Principal View (`/principal`)

- **KPI row** — 4 cards: Total Staff, Present Today, On Leave, Coverage Rate (computed from mock data)
- **Department Overview** — Two side-by-side horizontal stacked bar charts (Chart.js): Staff Occupancy and Student Attendance, broken down by department
- **Staffing Gaps** — Cards for teacher absences that need substitute coverage. Each shows:
  - Teacher avatar, name, department
  - Date range and reason
  - Status tag (Covered / Pending Approval / Needs Substitute)
  - Action buttons: Approve, Deny, or "Assign Substitute"
- **Assign Substitute modal** — Filters substitutes by matching subjects, shows availability and rating, lets you select and confirm
- Uses `CuiApp` shell with `CuiMainMenu` sidebar (Dashboard, Absences group, Staffing, Messages, Timetable)

### Teacher View (`/teacher`)

- **Tabbed layout** (CuiTabs):
  - **Student Requests** — `CuiDataTable` with columns: Student (avatar + name + class), Reason, Dates, Status tag, Actions (Approve/Deny for pending)
  - **My Absences** — Cards showing own leave requests with status, substitute assignment info, and inline message thread previews
- **Request Absence modal** — Textarea for reason + two date pickers, submits to principal for approval
- Notification badge on Student Requests tab shows pending count

### Student View (`/student`)

- **Status summary** — Three summary cards (Pending / Approved / Denied counts)
- **Request cards** — Each shows a status icon, reason, dates, time-ago, and the full conversation thread (messages from student, teacher, principal, and system)
- **Request Absence modal** — Same pattern as teacher's but submits to teacher

### Shared: Header Actions

Appears in every role's header. Contains:
- **Notifications dropdown** — Role-filtered (principal sees pending requests + uncovered gaps; teacher sees student requests + own request status updates; student sees own status updates)
- **Messages dropdown** — Recent messages from relevant threads
- **Theme toggle** — CUI dark/light mode switch

### Shared: Messaging Panel

Floating chat button (bottom-right corner) that opens a panel with:
- **Thread list** — Grouped by absence request, filtered by role visibility
- **Thread view** — Full message history with compose input
- Messages are role-scoped (students only see their own threads, teachers see student threads + their own, principal sees all)

---

## Mock Data (src/data/mock.ts)

All data is defined as reactive TypeScript arrays/objects so mutations during the demo are reflected immediately.

| Entity | Count | Key fields |
|--------|-------|-----------|
| Departments | 6 | Languages, Mathematics, Natural Sciences, Social Sciences, Arts & Music, Physical Education |
| Staff | 14 | 10 teachers + 4 substitutes, each with subjects, department, avatar |
| Students | 8 | Name, class (7A–9B), department, guardian |
| Absence Requests | 7 | 4 student + 3 teacher, mixed statuses (pending/approved/denied) |
| Messages | 11 | Threaded by absence request ID, from students/teachers/principal/system |
| Substitute Options | 4 | Subjects, availability hours, rating |

Helper exports: `principal`, `currentTeacher` (Anna Lindqvist, id `t1`), `currentStudent` (Alma Wikstrom, id `st1`), `avatarMap` (ID-to-avatar lookup).

---

## Getting Started

### Prerequisites

- Node.js 20+
- The `@ist/commonui-components` package must be available at `../Documents/builderio-components/components/vue` (see `package.json` file dependency)

### Install & Run

```bash
cd "IST Product Prototype"
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you'll see the role selector landing page.

### Build

```bash
npm run build    # outputs to ./dist/
npm run preview  # preview the production build
```

---

## CUI Components Used

The prototype uses these components from `@ist/commonui-components`:

| Component | Where used |
|-----------|-----------|
| `CuiApp` | Page shell in all three role views (sidebar + header + content layout) |
| `CuiMainMenu` | Sidebar navigation with icons, badges, and expandable groups |
| `CuiHeader` | Top bar with breadcrumbs, search, avatar dropdown |
| `CuiButton` | All interactive buttons (hero, primary, secondary-outline variants) |
| `CuiTag` | Status badges (success/warn/danger/neutral severities) |
| `CuiModal` | Substitute assignment + absence request dialogs |
| `CuiMessage` | Info banners inside modals |
| `CuiTabs` | Teacher view tab switching |
| `CuiDataTable` | Student requests table (with Column) |
| `CuiDatePicker` | Date selection in absence request forms |
| `CuiTextArea` | Reason input in absence request forms |
| `CuiThemeToggle` | Dark/light mode switcher in header |

---

## Design Tokens

All styling uses CUI design tokens — never raw colors or hardcoded spacing:

- **Colors:** `--cui-text-header-body`, `--cui-text-subtitle-caption`, `--cui-surface-default-white`, `--cui-surface-hero-action`, `--cui-border-neutral-subtle`, `--cui-surface-danger`, etc.
- **Spacing:** `--ds-space-{xs|sm|md|lg|xl|2xl}` (4px grid)
- **Radius:** `--ds-radius-{lg|xl|full}`
- **Shadows:** `--ds-shadow-{sm|md|lg|xl}`
- **Typography:** `--font-size-{xs|sm|base|md|lg|xl|2xl|3xl}`, `--font-weight-{medium|semibold|bold}`
- **Brand color:** `--color-primary` (IST blue), `--cui-surface-hero-action` (hero purple)
