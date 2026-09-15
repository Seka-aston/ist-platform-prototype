<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const roles = [
  {
    key: "principal",
    label: "Principal",
    icon: "admin_panel_settings",
    description: "Staffing dashboard, department overview, substitute assignment",
    person: "Margareta Håkansson",
    route: "/principal",
    color: "var(--cui-surface-hero-action)",
    bgLight: "#f5f3ff",
  },
  {
    key: "teacher",
    label: "Teacher",
    icon: "menu_book",
    description: "Review student absences, request your own leave",
    person: "Anna Lindqvist",
    route: "/teacher",
    color: "var(--color-primary)",
    bgLight: "#ebf8ff",
  },
  {
    key: "student",
    label: "Student",
    icon: "school",
    description: "Request absence, track approval status",
    person: "Alma Wikström",
    route: "/student",
    color: "#0d9488",
    bgLight: "#f0fdfa",
  },
];

function enterRole(route: string) {
  router.push(route);
}
</script>

<template>
  <div class="landing">
    <div class="landing-inner">
      <header class="landing-header">
        <div class="logo-area">
          <img src="/ist-logo.svg" alt="IST" class="logo-img" />
          <div>
            <h1 class="product-name">IST Platform</h1>
            <p class="product-sub">Product Vision Demo</p>
          </div>
        </div>
        <p class="landing-tagline">
          One connected workflow — from absence request to substitute coverage.
          <br />
          Choose a role to begin the walkthrough.
        </p>
      </header>

      <div class="role-cards">
        <button
          v-for="role in roles"
          :key="role.key"
          class="role-card"
          @click="enterRole(role.route)"
        >
          <div class="role-icon" :style="{ backgroundColor: role.bgLight, color: role.color }">
            <span class="material-symbols-rounded">{{ role.icon }}</span>
          </div>
          <h2 class="role-label">{{ role.label }}</h2>
          <p class="role-person">{{ role.person }}</p>
          <p class="role-description">{{ role.description }}</p>
          <div class="role-enter">
            <span>Enter view</span>
            <span class="material-symbols-rounded" style="font-size: 18px">arrow_forward</span>
          </div>
        </button>
      </div>

      <footer class="landing-footer">
        <p>Björkbacken School — Prototype data, not connected to any live system</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cui-surface-default-gray);
  font-family: var(--font-primary);
  padding: var(--ds-space-lg);
}

.landing-inner {
  max-width: 960px;
  width: 100%;
}

.landing-header {
  text-align: center;
  margin-bottom: var(--ds-space-2xl);
}

.logo-area {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-sm);
  margin-bottom: var(--ds-space-md);
}

.logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.product-name {
  font-family: var(--font-editorial);
  font-size: var(--font-size-3xl);
  font-weight: 400;
  color: var(--cui-text-header-body);
  line-height: 1.1;
  text-align: left;
}

.product-sub {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  text-align: left;
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.02em;
}

.landing-tagline {
  font-size: var(--font-size-base);
  color: var(--cui-text-subtitle-caption);
  line-height: var(--line-height-relaxed);
  max-width: 520px;
  margin: 0 auto;
}

.role-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ds-space-lg);
  margin-bottom: var(--ds-space-2xl);
}

.role-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-lg);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-xs);
  font-family: inherit;
  box-shadow: var(--ds-shadow-sm);
}

.role-card:hover {
  border-color: var(--cui-border-neutral);
  box-shadow: var(--ds-shadow-md);
  transform: translateY(-2px);
}

.role-card:active {
  transform: translateY(0);
}

.role-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--ds-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--ds-space-xs);
}

.role-icon .material-symbols-rounded {
  font-size: 26px;
  font-variation-settings: "FILL" 1;
}

.role-label {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  margin: 0;
}

.role-person {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  margin: 0;
}

.role-description {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  line-height: var(--line-height-normal);
  flex: 1;
  margin: 0;
}

.role-enter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--cui-surface-hero-action);
  margin-top: var(--ds-space-sm);
}

.role-card:hover .role-enter {
  gap: 10px;
}

.landing-footer {
  text-align: center;
}

.landing-footer p {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
  opacity: 0.7;
}
</style>
