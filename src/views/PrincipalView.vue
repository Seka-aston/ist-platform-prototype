<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import DepartmentChart from "../components/DepartmentChart.vue";
import HeaderActions from "../components/HeaderActions.vue";
import KpiCard from "../components/KpiCard.vue";
import MessagingPanel from "../components/MessagingPanel.vue";
import {
  departments,
  absenceRequests,
  avatarMap,
  staff,
  substituteOptions,
  principal,
  type AbsenceRequest,
  type SubstituteOption,
} from "../data/mock";
import type { MenuEntry } from "@ist/commonui-components";

const router = useRouter();

// --- Avatar dropdown menu ---
const avatarMenu = [
  {
    label: "Account",
    items: [
      { label: "Margareta Håkansson", icon: "person", disabled: true },
      { label: "Settings", icon: "settings" },
      { separator: true },
      { label: "Switch Role", icon: "swap_horiz", command: () => router.push("/") },
      { label: "Log Out", icon: "logout" },
    ],
  },
];

// --- Menu ---
const activeMenuId = ref("dashboard");
const menuItems: MenuEntry[] = [
  { id: "dashboard", type: "item", label: "Dashboard", icon: "dashboard" },
  {
    id: "absences-group",
    type: "group",
    label: "Absences",
    icon: "event_busy",
    expanded: true,
    children: [
      { id: "teacher-absences", type: "item", label: "Teacher Absences", icon: "person_off", badge: "2", badgeType: "pill-small" },
      { id: "student-absences", type: "item", label: "Student Absences", icon: "school" },
    ],
  },
  { id: "staffing", type: "item", label: "Staffing", icon: "groups" },
  { id: "messages", type: "item", label: "Messages", icon: "chat", badge: "3", badgeType: "pill-small" },
  { id: "timetable", type: "item", label: "Timetable", icon: "calendar_month" },
];

function onMenuClick(item: any) {
  activeMenuId.value = item.id;
}

// --- Breadcrumbs ---
const breadcrumbs = [
  { label: "Björkbacken School", href: "/" },
  { label: "Dashboard" },
];

// --- KPI data ---
const totalStaff = computed(() => departments.reduce((sum, d) => sum + d.totalStaff, 0));
const presentStaff = computed(() => departments.reduce((sum, d) => sum + d.presentStaff, 0));
const absentStaff = computed(() => totalStaff.value - presentStaff.value);
const coverageRate = computed(() => {
  const teacherAbsences = absenceRequests.filter((a) => a.type === "teacher" && a.status === "approved");
  const covered = teacherAbsences.filter((a) => a.substituteId);
  return teacherAbsences.length > 0 ? Math.round((covered.length / teacherAbsences.length) * 100) : 100;
});



// --- Flagged gaps (teacher absences needing coverage) ---
const flaggedGaps = computed(() =>
  absenceRequests.filter(
    (a) => a.type === "teacher" && a.coverageNeeded && (a.status === "approved" || a.status === "pending"),
  ),
);

function gapStatus(gap: AbsenceRequest) {
  if (gap.substituteId) return "covered";
  if (gap.status === "pending") return "pending-approval";
  return "uncovered";
}

function gapSeverity(gap: AbsenceRequest): "success" | "warn" | "danger" {
  const s = gapStatus(gap);
  if (s === "covered") return "success";
  if (s === "pending-approval") return "warn";
  return "danger";
}

function gapStatusLabel(gap: AbsenceRequest) {
  const s = gapStatus(gap);
  if (s === "covered") {
    const sub = staff.find((st) => st.id === gap.substituteId);
    return `Covered — ${sub?.name ?? "Assigned"}`;
  }
  if (s === "pending-approval") return "Pending Approval";
  return "Needs Substitute";
}

// --- Substitute assignment modal ---
const showAssignModal = ref(false);
const selectedGap = ref<AbsenceRequest | null>(null);
const selectedSubstitute = ref<SubstituteOption | null>(null);

function openAssignModal(gap: AbsenceRequest) {
  selectedGap.value = gap;
  selectedSubstitute.value = null;
  showAssignModal.value = true;
}

function assignSubstitute() {
  if (selectedGap.value && selectedSubstitute.value) {
    selectedGap.value.substituteId = selectedSubstitute.value.id;
    selectedGap.value.status = "approved";
    showAssignModal.value = false;
  }
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (start === end) return s.toLocaleDateString("en-GB", opts);
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

// --- Relevant substitutes for a gap ---
function relevantSubstitutes(gap: AbsenceRequest) {
  const teacher = staff.find((s) => s.id === gap.requesterId);
  if (!teacher) return substituteOptions;
  return substituteOptions.filter((sub) => sub.subjects.some((s) => teacher.subjects.includes(s)));
}
</script>

<template>
  <CuiApp :dashboard="true" :breadcrumb-items="breadcrumbs">
    <template #menu>
      <CuiMainMenu
        :items="menuItems"
        :active-item-id="activeMenuId"
        logo="/ist-logo.svg"
        logo-alt="IST"
        title="IST Platform"
        subtitle="Björkbacken School"
        :show-menu-filter="false"
        @item-click="onMenuClick"
      />
    </template>

    <template #header>
      <CuiHeader
        :breadcrumb-items="breadcrumbs"
        :show-search="true"
        search-placeholder="Search staff, departments…"
        login-status="logged-in"
        avatar-src="/avatars/avatar-1.svg"
        avatar-alt="Margareta Håkansson"
        avatar-size="sm"
        :avatar-menu-items="avatarMenu"
      >
        <template #actions>
          <HeaderActions role="principal" :user-id="principal.id" />
        </template>
      </CuiHeader>
    </template>

    <!-- Main content -->
    <div class="dashboard">
      <!-- Page title -->
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Staffing Dashboard</h1>
          <p class="page-subtitle">Today, {{ new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) }}</p>
        </div>
      </div>

      <!-- KPI row -->
      <div class="kpi-row">
        <KpiCard
          icon="groups"
          :value="totalStaff"
          label="Total Staff"
          trend="+2.1%"
          trend-direction="up"
          icon-color="var(--color-primary)"
          icon-bg="var(--cui-surface-info-lighter)"
        />
        <KpiCard
          icon="check_circle"
          :value="presentStaff"
          label="Present Today"
          trend="+4.3%"
          trend-direction="up"
          icon-color="#0d9488"
          icon-bg="#f0fdfa"
        />
        <KpiCard
          icon="person_off"
          :value="absentStaff"
          label="On Leave"
          trend="-1.8%"
          trend-direction="down"
          icon-color="var(--cui-text-warn-large)"
          icon-bg="var(--cui-surface-warn-lighter)"
        />
        <KpiCard
          icon="shield"
          :value="`${coverageRate}%`"
          label="Coverage Rate"
          :trend="coverageRate === 100 ? 'All covered' : 'Gaps open'"
          :trend-direction="coverageRate === 100 ? 'up' : 'down'"
          icon-color="var(--cui-surface-hero-action)"
          icon-bg="#f5f3ff"
        />
      </div>

      <!-- Department overview charts -->
      <section class="section">
        <h2 class="section-title">Department Overview</h2>
        <DepartmentChart :departments="departments" />
      </section>

      <!-- Flagged staffing gaps -->
      <section class="section">
        <div class="section-title-row">
          <h2 class="section-title">Staffing Gaps</h2>
          <CuiTag
            v-if="flaggedGaps.filter(g => !g.substituteId).length > 0"
            severity="danger"
            :value="`${flaggedGaps.filter(g => !g.substituteId).length} open`"
          />
        </div>
        <p class="section-desc">Teacher absences requiring substitute coverage</p>

        <div class="gaps-grid">
          <div v-for="gap in flaggedGaps" :key="gap.id" class="gap-card">
            <div class="gap-header">
              <div class="gap-teacher">
                <img class="gap-avatar" :src="avatarMap[gap.requesterId]" :alt="gap.requesterName" />
                <div>
                  <div class="gap-name">{{ gap.requesterName }}</div>
                  <div class="gap-dept">{{ gap.department }}</div>
                </div>
              </div>
              <CuiTag :severity="gapSeverity(gap)" :value="gapStatusLabel(gap)" />
            </div>

            <div class="gap-details">
              <div class="gap-detail">
                <span class="material-symbols-rounded gap-detail-icon">calendar_today</span>
                {{ formatDateRange(gap.startDate, gap.endDate) }}
              </div>
              <div class="gap-detail">
                <span class="material-symbols-rounded gap-detail-icon">info</span>
                {{ gap.reason }}
              </div>
            </div>

            <div class="gap-actions">
              <CuiButton
                v-if="!gap.substituteId && gap.status === 'approved'"
                variant="primary"
                size="small"
                icon="person_add"
                @click="openAssignModal(gap)"
              >
                Assign Substitute
              </CuiButton>
              <CuiButton
                v-else-if="gap.status === 'pending'"
                variant="hero"
                size="small"
                icon="check"
                @click="gap.status = 'approved'"
              >
                Approve
              </CuiButton>
              <CuiButton
                v-if="gap.status === 'pending'"
                variant="secondary-outline"
                size="small"
                icon="close"
                @click="gap.status = 'denied'; gap.coverageNeeded = false;"
              >
                Deny
              </CuiButton>
            </div>
          </div>

          <div v-if="flaggedGaps.length === 0" class="empty-state">
            <span class="material-symbols-rounded" style="font-size: 48px; color: var(--cui-text-success-large)">check_circle</span>
            <p>All staffing gaps are covered</p>
          </div>
        </div>
      </section>
    </div>

    <MessagingPanel role="principal" :user-id="principal.id" :user-name="principal.name" />

    <!-- Substitute assignment modal -->
    <CuiModal v-model:visible="showAssignModal" header="Assign Substitute" :style="{ width: '500px' }">
      <div v-if="selectedGap" class="assign-modal">
        <CuiMessage severity="info" :closable="false">
          Covering for <strong>{{ selectedGap.requesterName }}</strong> —
          {{ formatDateRange(selectedGap.startDate, selectedGap.endDate) }}
        </CuiMessage>

        <div class="sub-list">
          <p class="sub-list-label">Qualified substitutes:</p>
          <div
            v-for="sub in relevantSubstitutes(selectedGap)"
            :key="sub.id"
            class="sub-option"
            :class="{ 'sub-selected': selectedSubstitute?.id === sub.id }"
            @click="selectedSubstitute = sub"
          >
            <img class="sub-avatar" :src="sub.avatar" :alt="sub.name" />
            <div class="sub-info">
              <div class="sub-name">{{ sub.name }}</div>
              <div class="sub-subjects">{{ sub.subjects.join(", ") }}</div>
              <div class="sub-hours">Available {{ sub.availableHours }}</div>
            </div>
            <span v-if="selectedSubstitute?.id === sub.id" class="material-symbols-rounded sub-check">check_circle</span>
          </div>
        </div>

        <div class="assign-actions">
          <CuiButton variant="secondary-outline" @click="showAssignModal = false">Cancel</CuiButton>
          <CuiButton variant="hero" :disabled="!selectedSubstitute" @click="assignSubstitute">
            Assign {{ selectedSubstitute?.name?.split(" ")[0] ?? "Substitute" }}
          </CuiButton>
        </div>
      </div>
    </CuiModal>
  </CuiApp>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.page-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--ds-space-lg);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--cui-text-header-body);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  margin: 2px 0 0;
}

/* KPI row */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-md);
  margin-bottom: var(--ds-space-xl);
}

/* Sections */
.section {
  margin-bottom: var(--ds-space-xl);
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  margin: 0 0 var(--ds-space-xs);
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  margin: 0 0 var(--ds-space-md);
}

/* Department table */
/* Gaps grid */
.gaps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--ds-space-md);
}

.gap-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-sm);
}

.gap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--ds-space-sm);
}

.gap-teacher {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
}

.gap-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.gap-dept {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.gap-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gap-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
}

.gap-detail-icon {
  font-size: 16px;
  color: var(--cui-text-subtitle-caption);
}

.gap-actions {
  display: flex;
  gap: var(--ds-space-sm);
  margin-top: var(--ds-space-xs);
}

.gap-avatar,
.sub-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--ds-radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-2xl);
  color: var(--cui-text-subtitle-caption);
}

/* Substitute assignment modal */
.assign-modal {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-md);
}

.sub-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-sm);
}

.sub-list-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--cui-text-header-body);
  margin: 0;
}

.sub-option {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-sm);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-lg);
  cursor: pointer;
  transition: all 0.15s ease;
}

.sub-option:hover {
  background: var(--cui-surface-default-hover);
}

.sub-selected {
  border-color: var(--cui-surface-hero-action);
  background: #f5f3ff;
}

.sub-info {
  flex: 1;
}

.sub-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.sub-subjects {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.sub-hours {
  font-size: var(--font-size-xs);
  color: var(--cui-text-info-small);
}

.sub-check {
  color: var(--cui-surface-hero-action);
  font-variation-settings: "FILL" 1;
  font-size: 22px;
}

.assign-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-sm);
  padding-top: var(--ds-space-sm);
  border-top: 1px solid var(--cui-border-neutral-subtle);
}
</style>
