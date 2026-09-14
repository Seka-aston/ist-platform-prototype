<script setup lang="ts">
import { Column } from "@ist/commonui-components";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import HeaderActions from "../components/HeaderActions.vue";
import MessagingPanel from "../components/MessagingPanel.vue";
import {
  absenceRequests,
  avatarMap,
  currentTeacher,
  messages,
  principal,
  type AbsenceRequest,
} from "../data/mock";
import type { MenuEntry } from "@ist/commonui-components";

const router = useRouter();

// --- Avatar dropdown menu ---
const avatarMenu = [
  {
    label: "Account",
    items: [
      { label: "Anna Lindqvist", icon: "person", disabled: true },
      { label: "Settings", icon: "settings" },
      { separator: true },
      { label: "Switch Role", icon: "swap_horiz", command: () => router.push("/") },
      { label: "Log Out", icon: "logout" },
    ],
  },
];

// --- Menu ---
const activeMenuId = ref("student-requests");
const menuItems: MenuEntry[] = [
  { id: "student-requests", type: "item", label: "Student Requests", icon: "assignment", badge: String(absenceRequests.filter(a => a.type === "student" && a.status === "pending").length), badgeType: "pill-small" },
  { id: "my-absences", type: "item", label: "My Absences", icon: "event_busy" },
  { id: "my-classes", type: "item", label: "My Classes", icon: "school" },
  { id: "messages", type: "item", label: "Messages", icon: "chat", badge: "2", badgeType: "pill-small" },
  { id: "timetable", type: "item", label: "Timetable", icon: "calendar_month" },
];

function onMenuClick(item: any) {
  activeMenuId.value = item.id;
}

// --- Breadcrumbs ---
const breadcrumbs = [
  { label: "Björkbacken School", href: "/" },
  { label: "Teacher" },
];

// --- Tabs ---
const activeTab = ref(0);
const pendingStudentCount = computed(
  () => absenceRequests.filter((a) => a.type === "student" && a.status === "pending").length,
);
const tabs = computed(() => [
  { id: 0, label: "Student Requests", notifications: pendingStudentCount.value, wcagLabel: "Student absence requests" },
  { id: 1, label: "My Absences", notifications: 0, wcagLabel: "Your absence requests" },
]);

// --- Student absence requests ---
const studentRequests = computed(() =>
  absenceRequests.filter((a) => a.type === "student"),
);

function approveRequest(req: AbsenceRequest) {
  req.status = "approved";
}

function denyRequest(req: AbsenceRequest) {
  req.status = "denied";
}

function tagSeverity(status: string): "success" | "warn" | "danger" | "neutral" {
  switch (status) {
    case "approved": return "success";
    case "pending": return "warn";
    case "denied": return "danger";
    default: return "neutral";
  }
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// --- Teacher's own absences ---
const myAbsences = computed(() =>
  absenceRequests.filter((a) => a.type === "teacher" && a.requesterId === currentTeacher.id),
);

// --- New absence request ---
const showRequestModal = ref(false);
const newReason = ref("");
const newStartDate = ref<Date | null>(null);
const newEndDate = ref<Date | null>(null);

function submitOwnAbsence() {
  if (!newReason.value || !newStartDate.value || !newEndDate.value) return;

  const newRequest: AbsenceRequest = {
    id: `ar-new-${Date.now()}`,
    type: "teacher",
    requesterId: currentTeacher.id,
    requesterName: currentTeacher.name,
    reason: newReason.value,
    startDate: newStartDate.value.toISOString().split("T")[0],
    endDate: newEndDate.value.toISOString().split("T")[0],
    status: "pending",
    createdAt: new Date().toISOString(),
    department: currentTeacher.department,
    coverageNeeded: true,
  };
  absenceRequests.push(newRequest);

  newReason.value = "";
  newStartDate.value = null;
  newEndDate.value = null;
  showRequestModal.value = false;
  activeTab.value = 1;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (start === end) return s.toLocaleDateString("en-GB", opts);
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

// --- Messages for a given request ---
function threadMessages(threadId: string) {
  return messages.filter((m) => m.threadId === threadId);
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
        subtitle="Anna Lindqvist"
        :show-menu-filter="false"
        @item-click="onMenuClick"
      />
    </template>

    <template #header>
      <CuiHeader
        :breadcrumb-items="breadcrumbs"
        :show-search="true"
        search-placeholder="Search students, classes…"
        login-status="logged-in"
        avatar-src="/avatars/avatar-2.svg"
        avatar-alt="Anna Lindqvist"
        avatar-size="sm"
        :avatar-menu-items="avatarMenu"
      >
        <template #actions>
          <HeaderActions role="teacher" :user-id="currentTeacher.id" />
        </template>
      </CuiHeader>
    </template>

    <div class="teacher-view">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Teacher Dashboard</h1>
          <p class="page-subtitle">{{ currentTeacher.name }} — {{ currentTeacher.subjects.join(", ") }}</p>
        </div>
        <CuiButton variant="hero" icon="add" @click="showRequestModal = true">
          Request Absence
        </CuiButton>
      </div>

      <CuiTabs v-model="activeTab" :tabs="tabs" wcag-label="Teacher view tabs" :show-panels="true">
        <!-- Student Requests tab -->
        <template #panel-0>
          <div class="tab-content">
            <div class="table-card">
              <CuiDataTable :value="studentRequests" :rows="10" striped-rows>
                <Column header="Student" sortable field="requesterName">
                  <template #body="{ data }">
                    <div class="student-cell">
                      <img class="cell-avatar" :src="avatarMap[data.requesterId]" :alt="data.requesterName" />
                      <div>
                        <div class="cell-primary">{{ data.requesterName }}</div>
                        <div class="cell-secondary">{{ data.className }}</div>
                      </div>
                    </div>
                  </template>
                </Column>
                <Column header="Reason" field="reason">
                  <template #body="{ data }">
                    <span class="cell-primary">{{ data.reason }}</span>
                  </template>
                </Column>
                <Column header="Dates" sortable field="startDate">
                  <template #body="{ data }">
                    <span class="cell-secondary">{{ formatDateRange(data.startDate, data.endDate) }}</span>
                  </template>
                </Column>
                <Column header="Status" sortable field="status">
                  <template #body="{ data }">
                    <CuiTag :severity="tagSeverity(data.status)" :value="statusLabel(data.status)" />
                  </template>
                </Column>
                <Column header="Actions">
                  <template #body="{ data }">
                    <div v-if="data.status === 'pending'" class="action-buttons">
                      <CuiButton variant="primary" size="small" icon="check" @click="approveRequest(data)">
                        Approve
                      </CuiButton>
                      <CuiButton variant="secondary-outline" size="small" icon="close" @click="denyRequest(data)">
                        Deny
                      </CuiButton>
                    </div>
                    <span v-else class="cell-secondary">—</span>
                  </template>
                </Column>
              </CuiDataTable>
            </div>
          </div>
        </template>

        <!-- My Absences tab -->
        <template #panel-1>
          <div class="tab-content">
            <div v-if="myAbsences.length === 0" class="empty-state">
              <span class="material-symbols-rounded" style="font-size: 48px; color: var(--cui-text-subtitle-caption)">event_available</span>
              <p>No absence requests yet</p>
              <CuiButton variant="hero" icon="add" @click="showRequestModal = true">
                Request Absence
              </CuiButton>
            </div>

            <div v-else class="absence-cards">
              <div v-for="absence in myAbsences" :key="absence.id" class="absence-card">
                <div class="absence-card-header">
                  <div>
                    <div class="cell-primary" style="font-weight: 600">{{ absence.reason }}</div>
                    <div class="cell-secondary">{{ formatDateRange(absence.startDate, absence.endDate) }}</div>
                  </div>
                  <CuiTag :severity="tagSeverity(absence.status)" :value="statusLabel(absence.status)" />
                </div>

                <div v-if="absence.coverageNeeded" class="absence-coverage">
                  <span class="material-symbols-rounded" style="font-size: 16px">swap_horiz</span>
                  <span v-if="absence.substituteId" class="cell-secondary">Substitute assigned</span>
                  <span v-else class="cell-secondary">Awaiting substitute assignment</span>
                </div>

                <!-- Inline message thread -->
                <div v-if="threadMessages(absence.id).length" class="thread-preview">
                  <div v-for="msg in threadMessages(absence.id).slice(-2)" :key="msg.id" class="thread-msg">
                    <span class="thread-sender">{{ msg.senderName }}:</span>
                    {{ msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </CuiTabs>
    </div>

    <MessagingPanel role="teacher" :user-id="currentTeacher.id" :user-name="currentTeacher.name" />

    <!-- New absence request modal -->
    <CuiModal v-model:visible="showRequestModal" header="Request Absence" :style="{ width: '480px' }">
      <div class="request-form">
        <CuiMessage severity="info" :closable="false">
          Your request will be sent to <strong>{{ principal.name }}</strong> for approval.
          A substitute will be assigned once approved.
        </CuiMessage>

        <CuiTextArea
          v-model="newReason"
          label="Reason"
          placeholder="Why do you need time off?"
          :required="true"
        />

        <div class="date-row">
          <CuiDatePicker
            v-model="newStartDate"
            label="Start Date"
            placeholder="Select start date"
            :required="true"
          />
          <CuiDatePicker
            v-model="newEndDate"
            label="End Date"
            placeholder="Select end date"
            :required="true"
          />
        </div>

        <div class="form-actions">
          <CuiButton variant="secondary-outline" @click="showRequestModal = false">Cancel</CuiButton>
          <CuiButton
            variant="hero"
            icon="send"
            :disabled="!newReason || !newStartDate || !newEndDate"
            @click="submitOwnAbsence"
          >
            Submit Request
          </CuiButton>
        </div>
      </div>
    </CuiModal>
  </CuiApp>
</template>

<style scoped>
.teacher-view {
  max-width: 1100px;
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

.tab-content {
  padding-top: var(--ds-space-md);
}

.table-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
}

.student-cell {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
}

.cell-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--ds-radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.cell-primary {
  font-size: var(--font-size-sm);
  color: var(--cui-text-header-body);
}

.cell-secondary {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.action-buttons {
  display: flex;
  gap: var(--ds-space-xs);
}

/* My Absences cards */
.absence-cards {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-md);
}

.absence-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-sm);
}

.absence-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.absence-coverage {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.thread-preview {
  border-top: 1px solid var(--cui-border-neutral-subtle);
  padding-top: var(--ds-space-sm);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.thread-msg {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
  line-height: var(--line-height-normal);
}

.thread-sender {
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-2xl);
  color: var(--cui-text-subtitle-caption);
}

/* Request form */
.request-form {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-md);
}

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-md);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-sm);
  padding-top: var(--ds-space-sm);
  border-top: 1px solid var(--cui-border-neutral-subtle);
}
</style>
