<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import HeaderActions from "../components/HeaderActions.vue";
import MessagingPanel from "../components/MessagingPanel.vue";
import {
  absenceRequests,
  avatarMap,
  currentStudent,
  messages,
  type AbsenceRequest,
} from "../data/mock";
import type { MenuEntry } from "@ist/commonui-components";

const router = useRouter();

// --- Avatar dropdown menu ---
const avatarMenu = [
  {
    label: "Account",
    items: [
      { label: "Alma Wikström", icon: "person", disabled: true },
      { label: "Settings", icon: "settings" },
      { separator: true },
      { label: "Switch Role", icon: "swap_horiz", command: () => router.push("/") },
      { label: "Log Out", icon: "logout" },
    ],
  },
];

// --- Menu ---
const activeMenuId = ref("my-absences");
const menuItems: MenuEntry[] = [
  { id: "my-absences", type: "item", label: "My Absences", icon: "event_busy" },
  { id: "my-schedule", type: "item", label: "My Schedule", icon: "calendar_month" },
  { id: "messages", type: "item", label: "Messages", icon: "chat" },
];

function onMenuClick(item: any) {
  activeMenuId.value = item.id;
}

// --- Breadcrumbs ---
const breadcrumbs = [
  { label: "Björkbacken School", href: "/" },
  { label: "Student" },
];

// --- Student's absence requests ---
const myRequests = computed(() =>
  absenceRequests.filter((a) => a.type === "student" && a.requesterId === currentStudent.id),
);

// --- Messages for a request ---
function threadMessages(threadId: string) {
  return messages.filter((m) => m.threadId === threadId);
}

// --- New request ---
const showRequestModal = ref(false);
const newReason = ref("");
const newStartDate = ref<Date | null>(null);
const newEndDate = ref<Date | null>(null);

function submitRequest() {
  if (!newReason.value || !newStartDate.value || !newEndDate.value) return;

  const newReq: AbsenceRequest = {
    id: `ar-stu-${Date.now()}`,
    type: "student",
    requesterId: currentStudent.id,
    requesterName: currentStudent.name,
    reason: newReason.value,
    startDate: newStartDate.value.toISOString().split("T")[0],
    endDate: newEndDate.value.toISOString().split("T")[0],
    status: "pending",
    createdAt: new Date().toISOString(),
    className: currentStudent.className,
    department: currentStudent.department,
  };
  absenceRequests.push(newReq);

  newReason.value = "";
  newStartDate.value = null;
  newEndDate.value = null;
  showRequestModal.value = false;
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (start === end) return s.toLocaleDateString("en-GB", opts);
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

function statusIcon(status: string) {
  switch (status) {
    case "approved": return "check_circle";
    case "pending": return "schedule";
    case "denied": return "cancel";
    default: return "help";
  }
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
        subtitle="Alma Wikström"
        :show-menu-filter="false"
        @item-click="onMenuClick"
      />
    </template>

    <template #header>
      <CuiHeader
        :breadcrumb-items="breadcrumbs"
        :show-search="true"
        search-placeholder="Search…"
        login-status="logged-in"
        avatar-src="/avatars/avatar-3.svg"
        avatar-alt="Alma Wikström"
        avatar-size="sm"
        :avatar-menu-items="avatarMenu"
      >
        <template #actions>
          <HeaderActions role="student" :user-id="currentStudent.id" />
        </template>
      </CuiHeader>
    </template>

    <div class="student-view">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">My Absences</h1>
          <p class="page-subtitle">{{ currentStudent.name }} — Class {{ currentStudent.className }}</p>
        </div>
        <CuiButton variant="hero" icon="add" @click="showRequestModal = true">
          Request Absence
        </CuiButton>
      </div>

      <!-- Status summary -->
      <div class="status-summary">
        <div class="summary-item">
          <span class="material-symbols-rounded summary-icon" style="color: var(--cui-text-warn-large)">schedule</span>
          <div>
            <div class="summary-value">{{ myRequests.filter(r => r.status === 'pending').length }}</div>
            <div class="summary-label">Pending</div>
          </div>
        </div>
        <div class="summary-item">
          <span class="material-symbols-rounded summary-icon" style="color: var(--cui-text-success-large)">check_circle</span>
          <div>
            <div class="summary-value">{{ myRequests.filter(r => r.status === 'approved').length }}</div>
            <div class="summary-label">Approved</div>
          </div>
        </div>
        <div class="summary-item">
          <span class="material-symbols-rounded summary-icon" style="color: var(--cui-text-danger-large)">cancel</span>
          <div>
            <div class="summary-value">{{ myRequests.filter(r => r.status === 'denied').length }}</div>
            <div class="summary-label">Denied</div>
          </div>
        </div>
      </div>

      <!-- Requests list -->
      <div class="requests-list">
        <div v-for="req in myRequests" :key="req.id" class="request-card" :class="`request-${req.status}`">
          <div class="request-header">
            <div class="request-status-icon">
              <span class="material-symbols-rounded" :class="`status-${req.status}`" style="font-variation-settings: 'FILL' 1">
                {{ statusIcon(req.status) }}
              </span>
            </div>
            <div class="request-info">
              <div class="request-reason">{{ req.reason }}</div>
              <div class="request-dates">
                <span class="material-symbols-rounded" style="font-size: 14px">calendar_today</span>
                {{ formatDateRange(req.startDate, req.endDate) }}
                <span class="request-time">· Submitted {{ timeAgo(req.createdAt) }}</span>
              </div>
            </div>
            <CuiTag :severity="tagSeverity(req.status)" :value="statusLabel(req.status)" />
          </div>

          <!-- Message thread preview -->
          <div v-if="threadMessages(req.id).length" class="thread-section">
            <div class="thread-label">
              <span class="material-symbols-rounded" style="font-size: 16px">forum</span>
              Conversation
            </div>
            <div class="thread-messages">
              <div v-for="msg in threadMessages(req.id)" :key="msg.id" class="thread-msg" :class="{ 'msg-system': msg.senderRole === 'system' }">
                <div v-if="msg.senderRole !== 'system'" class="msg-header">
                  <img class="msg-avatar" :src="avatarMap[msg.senderId]" :alt="msg.senderName" />
                  <span class="msg-sender">{{ msg.senderName }}</span>
                  <span class="msg-time">{{ timeAgo(msg.timestamp) }}</span>
                </div>
                <div v-else class="msg-header msg-system-header">
                  <span class="material-symbols-rounded" style="font-size: 14px">info</span>
                  <span class="msg-sender">System</span>
                </div>
                <div class="msg-body">{{ msg.content }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="myRequests.length === 0" class="empty-state">
          <span class="material-symbols-rounded" style="font-size: 48px; color: var(--cui-text-subtitle-caption)">event_available</span>
          <p>No absence requests yet</p>
          <CuiButton variant="hero" icon="add" @click="showRequestModal = true">
            Request Absence
          </CuiButton>
        </div>
      </div>
    </div>

    <MessagingPanel role="student" :user-id="currentStudent.id" :user-name="currentStudent.name" />

    <!-- New request modal -->
    <CuiModal v-model:visible="showRequestModal" header="Request Absence" :style="{ width: '480px' }">
      <div class="request-form">
        <CuiMessage severity="info" :closable="false">
          Your request will be sent to your teacher for review.
        </CuiMessage>

        <CuiTextArea
          v-model="newReason"
          label="Reason for absence"
          placeholder="Explain why you need time off…"
          :required="true"
        />

        <div class="date-row">
          <CuiDatePicker
            v-model="newStartDate"
            label="Start Date"
            placeholder="Pick a date"
            :required="true"
          />
          <CuiDatePicker
            v-model="newEndDate"
            label="End Date"
            placeholder="Pick a date"
            :required="true"
          />
        </div>

        <div class="form-actions">
          <CuiButton variant="secondary-outline" @click="showRequestModal = false">Cancel</CuiButton>
          <CuiButton
            variant="hero"
            icon="send"
            :disabled="!newReason || !newStartDate || !newEndDate"
            @click="submitRequest"
          >
            Submit Request
          </CuiButton>
        </div>
      </div>
    </CuiModal>
  </CuiApp>
</template>

<style scoped>
.student-view {
  max-width: 800px;
  margin: 0 auto;
}

.page-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--ds-space-lg);
}

.page-title {
  font-family: var(--font-editorial);
  font-size: var(--font-size-3xl);
  font-weight: 400;
  color: var(--cui-text-header-body);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  margin: 2px 0 0;
}

/* Status summary */
.status-summary {
  display: flex;
  gap: var(--ds-space-md);
  margin-bottom: var(--ds-space-xl);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-md) var(--ds-space-lg);
  flex: 1;
}

.summary-icon {
  font-size: 28px;
  font-variation-settings: "FILL" 1;
}

.summary-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--cui-text-header-body);
  line-height: 1.1;
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

/* Requests list */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-md);
}

.request-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-sm);
}

.request-header {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-sm);
}

.request-status-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.status-approved {
  color: var(--cui-text-success-large);
}

.status-pending {
  color: var(--cui-text-warn-large);
}

.status-denied {
  color: var(--cui-text-danger-large);
}

.request-info {
  flex: 1;
}

.request-reason {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.request-dates {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
  margin-top: 2px;
}

.request-time {
  color: var(--cui-text-subtitle-caption);
  opacity: 0.7;
}

/* Thread section */
.thread-section {
  border-top: 1px solid var(--cui-border-neutral-subtle);
  padding-top: var(--ds-space-sm);
}

.thread-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-subtitle-caption);
  margin-bottom: var(--ds-space-sm);
}

.thread-messages {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-sm);
}

.thread-msg {
  padding: var(--ds-space-sm);
  border-radius: var(--ds-radius-lg);
  background: var(--cui-surface-neutral);
}

.msg-system {
  background: var(--cui-surface-info-lighter);
}

.msg-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.msg-system-header {
  color: var(--cui-text-info-small);
}

.msg-avatar {
  width: 22px;
  height: 22px;
  border-radius: var(--ds-radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.msg-sender {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.msg-time {
  font-size: 11px;
  color: var(--cui-text-subtitle-caption);
  opacity: 0.7;
}

.msg-body {
  font-size: var(--font-size-sm);
  color: var(--cui-text-header-body);
  line-height: var(--line-height-normal);
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
