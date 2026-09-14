# AGENTS.md

Instructions for AI agents (Claude Code, Copilot, Cursor, etc.) working on this codebase.

Read `CLAUDE.md` first — it has the full design system rules, component patterns, and architecture. This file covers high-level principles and workflow rules that agents must follow.

---

## Project Identity

This is the **IST Platform Product Vision Prototype**. It demonstrates a school absence management workflow across three roles (Principal, Teacher, Student) at a fictional Swedish school called Bjorkbacken School.

It is a **prototype for stakeholder demos**, not a production application. Treat it accordingly:
- Prioritize visual polish and demo flow over engineering robustness
- Mock data is acceptable and expected — no backend needed
- Every interaction should "feel right" when clicking through the demo

---

## Golden Rules

### 1. CUI Design System First

The **Common UI (CUI)** design system is non-negotiable. Every visual element must use CUI tokens and components.

- **Colors:** `--cui-*` custom properties only. Never hardcode hex/rgb values in CSS.
- **Spacing:** `--ds-space-*` tokens only. Never use raw pixel values for padding/margin/gap.
- **Components:** Use `Cui*` components from `@ist/commonui-components`. Never use PrimeVue directly. Never install other UI libraries.
- **Typography:** `--font-size-*` and `--font-weight-*` tokens only.

See the full token reference and cheat sheet in `CLAUDE.md`.

### 2. Preserve the Demo Flow

The prototype tells a story. The flow is:

```
Landing (pick role) → Role Dashboard → Interact with features
```

Every role view has:
- `CuiApp` shell with sidebar (`CuiMainMenu`) and header (`CuiHeader`)
- `HeaderActions` component in the header (notifications + messages + theme toggle)
- `MessagingPanel` floating chat (bottom-right)
- Page content with a title row and contextual features

**Do not break this structure.** New features should slot into existing views, not restructure them.

### 3. Mock Data Is the Single Source of Truth

All data lives in `src/data/mock.ts`. It is mutable — the demo modifies it directly (e.g., approving a request changes `status` in-place).

When adding data:
- Add TypeScript interfaces alongside the data
- Follow existing ID conventions (`t1`–`t10` for teachers, `st1`–`st8` for students, `ar1`–`ar7` for absence requests, etc.)
- Export new entities as named exports
- Update `avatarMap` if adding people

### 4. Scoped CSS with CUI Tokens

- Every component uses `<style scoped>`
- No global CSS changes (except `src/app.css` which only imports CUI styles)
- No Tailwind utility classes in templates — write CSS classes with token values
- Card pattern: white surface + subtle border + xl radius + md/lg padding

### 5. Material Symbols for Icons

Use Google Material Symbols Rounded:
```html
<span class="material-symbols-rounded">icon_name</span>
```
For filled icons add `font-variation-settings: 'FILL' 1`. Find names at fonts.google.com/icons.

---

## Architecture Reference

```
src/
├── main.ts              # Registers CommonUI plugin + Vue Router
├── App.vue              # Just <RouterView />
├── app.css              # CUI style import + Material Symbols defaults
├── router/index.ts      # 4 routes: /, /principal, /teacher, /student
├── data/mock.ts         # ALL mock data + interfaces (single file)
├── views/               # One file per role + landing page
│   ├── LandingPage.vue
│   ├── PrincipalView.vue
│   ├── TeacherView.vue
│   └── StudentView.vue
└── components/          # Shared across views
    ├── HeaderActions.vue
    ├── MessagingPanel.vue
    ├── KpiCard.vue
    ├── DepartmentChart.vue
    └── ProgressBar.vue
```

---

## Role-Specific Behavior

### Principal (Margareta Hakansson)

- Sees **all** absence requests (teacher + student)
- Manages **staffing gaps** — teacher absences that need substitute coverage
- Can **approve/deny** teacher requests and **assign substitutes**
- Dashboard shows school-wide KPIs and department charts
- Notifications include: pending requests, uncovered staffing gaps

### Teacher (Anna Lindqvist, id: `t1`)

- Sees **student** absence requests in a data table
- Can **approve/deny** student requests
- Can **request own absence** (goes to principal for approval)
- Sees own absence status + whether a substitute has been assigned
- Notifications include: pending student requests, own request status updates

### Student (Alma Wikstrom, id: `st1`)

- Sees **only their own** absence requests
- Can **submit** new absence requests (go to teacher for review)
- Sees conversation threads attached to each request
- Notifications include: own request status updates (approved/denied)

### Messaging Visibility Rules

The `MessagingPanel` and `HeaderActions` components filter content by role:
- **Principal:** sees all threads
- **Teacher:** sees student threads + their own teacher threads
- **Student:** sees only threads for their own requests

---

## CUI Component Quick Reference

| Component | Usage |
|-----------|-------|
| `CuiApp` | Page shell (sidebar + header + content). Always pass `:dashboard="true"` |
| `CuiMainMenu` | Sidebar nav. Pass `items` (MenuEntry[]), `active-item-id`, logo, title, subtitle |
| `CuiHeader` | Top bar. Pass breadcrumbs, search config, avatar config. Use `#actions` slot |
| `CuiButton` | `variant`: hero (CTA), primary (action), secondary-outline (cancel). `size`: small for inline |
| `CuiTag` | `severity`: success/warn/danger/neutral. `value`: display text |
| `CuiModal` | `v-model:visible`, `header`, `:style="{ width }"` |
| `CuiMessage` | `severity`: info/warn/success/danger. `:closable="false"` for static banners |
| `CuiTabs` | `v-model` for active index. `tabs` array with `label`, `notifications`, `wcagLabel` |
| `CuiDataTable` | Wrap `Column` components. Pass `:value` data array, `striped-rows`, `:rows` |
| `CuiDatePicker` | `v-model`, `label`, `placeholder`, `:required` |
| `CuiTextArea` | `v-model`, `label`, `placeholder`, `:required` |
| `CuiThemeToggle` | `:icon-only="true"` `variant="secondary-text"` |

---

## Common Patterns to Follow

### Page Title Row
```vue
<div class="page-title-row">
  <div>
    <h1 class="page-title">Page Title</h1>
    <p class="page-subtitle">Contextual subtitle</p>
  </div>
  <CuiButton variant="hero" icon="add" @click="...">Action</CuiButton>
</div>
```

### Card
```css
.card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-sm);
}
```

### Avatar with Text
```vue
<div class="person-cell">
  <img class="avatar" :src="avatarMap[person.id]" :alt="person.name" />
  <div>
    <div class="name">{{ person.name }}</div>
    <div class="subtitle">{{ person.department }}</div>
  </div>
</div>
```
```css
.avatar { width: 36px; height: 36px; border-radius: var(--ds-radius-full); object-fit: cover; }
```

### Empty State
```vue
<div class="empty-state">
  <span class="material-symbols-rounded" style="font-size: 48px; color: var(--cui-text-subtitle-caption)">icon_name</span>
  <p>Empty state message</p>
  <CuiButton variant="hero" icon="add" @click="...">Action</CuiButton>
</div>
```

---

## What NOT to Do

- **Don't add a backend, API layer, or state management library** — this is a self-contained prototype
- **Don't use PrimeVue components directly** — always use `Cui*` wrappers
- **Don't install new CSS or UI frameworks** — CUI + Tailwind (engine only) is the stack
- **Don't hardcode colors, spacing, or font sizes** — use CUI tokens (see CLAUDE.md for the full list)
- **Don't restructure the CuiApp shell** — all views follow the same sidebar + header + content pattern
- **Don't break role scoping** — each role should only see data relevant to them
- **Don't add routing complexity** — 4 flat routes, no nested routing, no auth guards
- **Don't use Tailwind utility classes in templates** — write scoped CSS
- **Don't create global styles** — everything is scoped per component
