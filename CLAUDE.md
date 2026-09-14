# CLAUDE.md

Instructions for Claude Code when working on this project.

## Project Overview

This is the **IST Platform Product Vision Prototype** — an interactive demo of school absence management and substitute coverage, built with Vue 3 + TypeScript + Vite. It uses the **CUI (Common UI)** design system via `@ist/commonui-components`.

The prototype is **not** a production app. It uses mock data (no backend, no API calls). All state lives in `src/data/mock.ts` as mutable arrays that update reactively during the demo.

---

## Commands

```sh
npm run dev      # Dev server (Vite)
npm run build    # Type-check + build to ./dist/
npm run preview  # Preview production build
```

---

## Architecture Rules

### Routing

There are exactly 4 routes:
- `/` — Landing page (role selector)
- `/principal` — Principal dashboard (Margareta Hakansson)
- `/teacher` — Teacher dashboard (Anna Lindqvist)
- `/student` — Student view (Alma Wikstrom)

Each role view is a standalone page component in `src/views/`. They share components from `src/components/` but have no cross-dependencies between views.

### Data Flow

All mock data is in `src/data/mock.ts`. Views import what they need directly from this file. There is no Vuex/Pinia store — mutations happen directly on the exported arrays (e.g., `gap.status = 'approved'`). This is intentional for a prototype.

When adding new data, add it to `mock.ts` with a proper TypeScript interface. Keep the existing naming patterns (IDs like `t1`, `st1`, `ar1`, `s1`, `m1`).

### Component Hierarchy

```
CuiApp (shell)
├── CuiMainMenu (sidebar — via #menu slot)
├── CuiHeader (top bar — via #header slot)
│   └── HeaderActions (notifications + messages + theme toggle)
├── [View content] (default slot)
└── MessagingPanel (floating, outside shell flow)
```

Every role view follows this exact shell pattern. Do not deviate from it.

---

## Design System Rules

### CRITICAL: Use CUI Tokens, Never Raw Values

This is the most important rule. **Never use hardcoded colors, spacing, font sizes, or border radii.** Always use CUI design tokens.

**Colors — always use `--cui-*` tokens:**
```css
/* CORRECT */
color: var(--cui-text-header-body);
background: var(--cui-surface-default-white);
border-color: var(--cui-border-neutral-subtle);

/* WRONG — never do this */
color: #1e293b;
background: white;
border-color: #e2e8f0;
```

**Spacing — always use `--ds-space-*` tokens:**
```css
/* CORRECT */
padding: var(--ds-space-md);
gap: var(--ds-space-sm);
margin-bottom: var(--ds-space-xl);

/* WRONG */
padding: 16px;
gap: 8px;
margin-bottom: 24px;
```

**Border radius — always use `--ds-radius-*` tokens:**
```css
/* CORRECT */
border-radius: var(--ds-radius-xl);    /* cards, panels */
border-radius: var(--ds-radius-lg);    /* buttons, inputs, smaller elements */
border-radius: var(--ds-radius-full);  /* avatars, pills */

/* WRONG */
border-radius: 12px;
border-radius: 50%;
```

**Typography — always use `--font-size-*` and `--font-weight-*` tokens:**
```css
/* CORRECT */
font-size: var(--font-size-sm);
font-weight: var(--font-weight-semibold);

/* WRONG */
font-size: 14px;
font-weight: 600;
```

**Shadows — always use `--ds-shadow-*` tokens:**
```css
/* CORRECT */
box-shadow: var(--ds-shadow-md);

/* WRONG */
box-shadow: 0 4px 6px rgba(0,0,0,0.1);
```

### Allowed Exceptions

The only cases where raw values are acceptable:
- **Small pixel nudges** for optical alignment: `margin-top: 2px`, `gap: 4px`, `gap: 6px`
- **Chart.js config** — Chart.js doesn't read CSS custom properties, so chart colors are hardcoded hex values in `DepartmentChart.vue`
- **Fixed dimensions** for specific elements: avatar `width: 36px`, icon containers `width: 48px`

### Color Token Cheat Sheet

| Purpose | Token |
|---------|-------|
| Primary text (headings, body) | `--cui-text-header-body` |
| Secondary text (subtitles, captions) | `--cui-text-subtitle-caption` |
| White surfaces (cards, panels) | `--cui-surface-default-white` |
| Gray background (page bg) | `--cui-surface-default-gray` |
| Hover state | `--cui-surface-default-hover` |
| Neutral surface (message bubbles) | `--cui-surface-neutral` |
| Hero/accent (primary CTA) | `--cui-surface-hero-action` |
| IST blue | `--color-primary` |
| Borders | `--cui-border-neutral-subtle`, `--cui-border-neutral` |
| Focus ring | `--cui-border-focus` |
| Success | `--cui-text-success-large`, `--cui-text-success-small`, `--cui-surface-success-lighter` |
| Warning | `--cui-text-warn-large`, `--cui-text-warn-small`, `--cui-surface-warn-lighter` |
| Danger | `--cui-text-danger-large`, `--cui-text-danger-small`, `--cui-surface-danger`, `--cui-surface-danger-lighter` |
| Info | `--cui-text-info-small`, `--cui-surface-info-lighter` |
| Notification badge | `--cui-surface-notification-badge` |

### Spacing Token Scale

| Token | Approx value | Usage |
|-------|-------------|-------|
| `--ds-space-xs` | 4px | Tiny gaps within tight groups |
| `--ds-space-sm` | 8px | Between related items, inner padding |
| `--ds-space-md` | 16px | Card padding, section gaps |
| `--ds-space-lg` | 24px | Card padding (generous), page gutter |
| `--ds-space-xl` | 32px | Section separation |
| `--ds-space-2xl` | 48px | Large section breaks |

---

## CUI Component Usage

### CuiButton Variants

Use these variants consistently:
- `variant="hero"` — Primary actions (Submit, Assign, main CTAs). Purple/accent color.
- `variant="primary"` — Secondary important actions (Approve). Blue.
- `variant="secondary-outline"` — Cancel, Deny, less important actions. Outlined.

Always pass `icon` prop for action buttons. Always pass `size="small"` for buttons inside tables or cards.

### CuiTag Severities

- `severity="success"` — Approved, Covered, positive states
- `severity="warn"` — Pending, awaiting action
- `severity="danger"` — Denied, Uncovered, Needs Substitute
- `severity="neutral"` — Informational, no urgency

### CuiModal Pattern

```vue
<CuiModal v-model:visible="showModal" header="Modal Title" :style="{ width: '480px' }">
  <div class="modal-content-wrapper">
    <CuiMessage severity="info" :closable="false">Context message</CuiMessage>
    <!-- Form fields -->
    <div class="form-actions">
      <CuiButton variant="secondary-outline" @click="showModal = false">Cancel</CuiButton>
      <CuiButton variant="hero" icon="send" :disabled="!isValid" @click="submit">Submit</CuiButton>
    </div>
  </div>
</CuiModal>
```

### CuiApp Shell Pattern

Every role view must follow this structure:
```vue
<CuiApp :dashboard="true" :breadcrumb-items="breadcrumbs">
  <template #menu>
    <CuiMainMenu :items="menuItems" :active-item-id="activeMenuId" ... />
  </template>
  <template #header>
    <CuiHeader ... >
      <template #actions>
        <HeaderActions :role="role" :user-id="userId" />
      </template>
    </CuiHeader>
  </template>

  <!-- Page content in default slot -->
  <div class="view-wrapper">
    ...
  </div>

  <!-- Messaging panel — outside the main content flow -->
  <MessagingPanel :role="role" :user-id="userId" :user-name="userName" />
</CuiApp>
```

---

## Icons

Use **Google Material Symbols Rounded** via `<span class="material-symbols-rounded">icon_name</span>`.

- Default: outlined (FILL 0). Set `font-variation-settings: 'FILL' 1` for filled icons.
- Icon sizing: use `font-size` on the span (e.g., `style="font-size: 18px"`).
- Find icon names at https://fonts.google.com/icons?icon.set=Material+Symbols

---

## CSS Conventions

- **Scoped styles only.** Every component uses `<style scoped>`.
- **No Tailwind utility classes in templates.** All styling is done via scoped CSS classes using CUI tokens. Tailwind is installed but only used for its CSS engine / reset — not for class-based styling.
- **Class naming:** Flat BEM-ish (`.gap-card`, `.gap-header`, `.gap-name`). No deep nesting.
- **Card pattern:** Every card uses `background: var(--cui-surface-default-white)`, `border: 1px solid var(--cui-border-neutral-subtle)`, `border-radius: var(--ds-radius-xl)`, `padding: var(--ds-space-md)` or `var(--ds-space-lg)`.
- **Flexbox and Grid:** Use `display: flex` or `display: grid` for all layouts. Use `gap` with spacing tokens. No margin hacks.
- **Transitions:** Keep them subtle — `transition: all 0.15s ease` or `0.2s ease`. No animations longer than 0.3s.

---

## Adding New Features

### Adding a new view/role

1. Create `src/views/NewRoleView.vue` following the CuiApp shell pattern
2. Add the route in `src/router/index.ts` (lazy-loaded)
3. Add a role card to `src/views/LandingPage.vue`
4. Add mock data for the persona in `src/data/mock.ts`

### Adding new mock data

1. Define the TypeScript interface in `src/data/mock.ts`
2. Add the data array in the same file
3. Export it as a named export
4. Keep IDs consistent with existing patterns

### Adding a new component

1. Place it in `src/components/`
2. Use `<script setup lang="ts">` with `defineProps`
3. Use scoped styles with CUI tokens
4. Import and use in the relevant view(s)

---

## Do NOT

- Use PrimeVue components directly — always use the `Cui*` wrappers from `@ist/commonui-components`
- Install new CSS frameworks or UI libraries
- Add a state management library (Pinia/Vuex) — mock data mutations are fine for a prototype
- Add API calls, backend connections, or env variables — this is a static prototype
- Use inline styles except for dynamic values (`:style="{ color: iconColor }"`)
- Create new CSS files — keep styles scoped in components
- Use `!important` (exception: the existing one in ProgressBar.vue for Chart.js override)
