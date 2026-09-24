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
import type { MenuEntry } from "@ist-group/commonui-components-vue";

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
const breadcrumbs = computed(() => {
  const base = [{ label: "Björkbacken School", href: "/" }];
  switch (activeMenuId.value) {
    case "my-absences": return [...base, { label: "My Absences" }];
    case "my-schedule": return [...base, { label: "My Schedule" }];
    case "messages": return [...base, { label: "Messages" }];
    default: return [...base, { label: "My Absences" }];
  }
});

// =====================
// MY ABSENCES PAGE
// =====================
const myRequests = computed(() =>
  absenceRequests.filter((a) => a.type === "student" && a.requesterId === currentStudent.id),
);

function threadMessages(threadId: string) {
  return messages.filter((m) => m.threadId === threadId);
}

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

function statusIcon(status: string) {
  switch (status) {
    case "approved": return "check_circle";
    case "pending": return "schedule";
    case "denied": return "cancel";
    default: return "help";
  }
}

// =====================
// MESSAGES PAGE
// =====================
interface Thread {
  id: string;
  title: string;
  subtitle: string;
  lastMessage: typeof messages[0];
  messageCount: number;
  status: string;
  requesterId: string;
}

const messageThreads = computed<Thread[]>(() => {
  const threadMap = new Map<string, typeof messages>();
  for (const msg of messages) {
    const arr = threadMap.get(msg.threadId) || [];
    arr.push(msg);
    threadMap.set(msg.threadId, arr);
  }

  const result: Thread[] = [];
  for (const [threadId, msgs] of threadMap) {
    const request = absenceRequests.find((a) => a.id === threadId);
    if (!request || request.requesterId !== currentStudent.id) continue;

    const sorted = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const last = sorted[sorted.length - 1];

    result.push({
      id: threadId,
      title: request.reason,
      subtitle: `Class ${request.className} — ${formatDateRange(request.startDate, request.endDate)}`,
      lastMessage: last,
      messageCount: sorted.length,
      status: request.status,
      requesterId: request.requesterId,
    });
  }

  return result.sort(
    (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime(),
  );
});

const selectedThreadId = ref<string | null>(null);
const selectedThread = computed(() => {
  if (!selectedThreadId.value) return null;
  return messageThreads.value.find((t) => t.id === selectedThreadId.value) ?? null;
});
const selectedThreadMessages = computed(() => {
  if (!selectedThreadId.value) return [];
  return [...messages.filter((m) => m.threadId === selectedThreadId.value)]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
});

const newMessageText = ref("");
function sendThreadMessage() {
  if (!newMessageText.value.trim() || !selectedThreadId.value) return;
  messages.push({
    id: `msg-${Date.now()}`,
    threadId: selectedThreadId.value,
    senderId: currentStudent.id,
    senderName: currentStudent.name,
    senderRole: "student",
    content: newMessageText.value.trim(),
    timestamp: new Date().toISOString(),
  });
  newMessageText.value = "";
}

// =====================
// SHARED UTILITIES
// =====================
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

    <!-- ==================== -->
    <!-- MY ABSENCES          -->
    <!-- ==================== -->
    <div v-if="activeMenuId === 'my-absences'" class="page-content">
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

    <!-- ==================== -->
    <!-- MY SCHEDULE          -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'my-schedule'" class="page-content">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">My Schedule</h1>
          <p class="page-subtitle">Class {{ currentStudent.className }} weekly timetable</p>
        </div>
      </div>

      <div class="empty-state-large">
        <div class="empty-icon-circle">
          <span class="material-symbols-rounded" style="font-size: 40px; color: var(--cui-text-subtitle-caption)">calendar_month</span>
        </div>
        <h3 class="empty-heading">Schedule coming soon</h3>
        <p class="empty-desc">Your weekly class schedule will show subjects, rooms, and any changes caused by teacher absences.</p>
        <CuiButton variant="secondary-outline" icon="arrow_back" @click="activeMenuId = 'my-absences'">
          Back to My Absences
        </CuiButton>
      </div>
    </div>

    <!-- ==================== -->
    <!-- MESSAGES             -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'messages'" class="page-content">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Messages</h1>
          <p class="page-subtitle">Conversations about your absence requests</p>
        </div>
      </div>

      <div class="messages-layout">
        <div class="thread-list-panel">
          <div class="thread-list-header">
            <span class="cell-primary">{{ messageThreads.length }} conversations</span>
          </div>
          <div class="thread-list-scroll">
            <button
              v-for="thread in messageThreads"
              :key="thread.id"
              class="thread-row"
              :class="{ 'thread-row-active': selectedThreadId === thread.id }"
              @click="selectedThreadId = thread.id"
            >
              <div class="thread-row-content">
                <div class="thread-row-top">
                  <span class="cell-primary">{{ thread.title }}</span>
                  <span class="thread-row-time">{{ timeAgo(thread.lastMessage.timestamp) }}</span>
                </div>
                <div class="cell-secondary thread-row-subtitle">{{ thread.subtitle }}</div>
                <div class="cell-secondary thread-row-preview">{{ thread.lastMessage.content.slice(0, 50) }}{{ thread.lastMessage.content.length > 50 ? '…' : '' }}</div>
              </div>
              <div class="thread-row-status" :style="{ background: thread.status === 'approved' ? 'var(--cui-text-success-small)' : thread.status === 'pending' ? 'var(--cui-text-warn-small)' : 'var(--cui-text-danger-small)' }" />
            </button>

            <div v-if="messageThreads.length === 0" class="dropdown-empty">No conversations yet</div>
          </div>
        </div>

        <div class="thread-detail-panel">
          <template v-if="selectedThread">
            <div class="thread-detail-header">
              <div>
                <div class="cell-primary" style="font-weight: var(--font-weight-semibold)">{{ selectedThread.title }}</div>
                <div class="cell-secondary">{{ selectedThread.subtitle }}</div>
              </div>
              <CuiTag :severity="tagSeverity(selectedThread.status)" :value="statusLabel(selectedThread.status)" />
            </div>

            <div class="thread-detail-messages">
              <div
                v-for="msg in selectedThreadMessages"
                :key="msg.id"
                class="msg-row"
                :class="{ 'msg-row-own': msg.senderId === currentStudent.id, 'msg-row-system': msg.senderRole === 'system' }"
              >
                <div v-if="msg.senderRole === 'system'" class="msg-system-bubble">
                  <span class="material-symbols-rounded" style="font-size: 14px">info</span>
                  {{ msg.content }}
                </div>
                <template v-else>
                  <img v-if="msg.senderId !== currentStudent.id" class="msg-row-avatar" :src="avatarMap[msg.senderId] || '/avatars/avatar-1.svg'" :alt="msg.senderName" />
                  <div class="msg-row-body">
                    <div class="msg-row-meta">
                      <span class="cell-primary" style="font-weight: var(--font-weight-semibold)">{{ msg.senderId === currentStudent.id ? 'You' : msg.senderName }}</span>
                      <span class="cell-secondary">{{ timeAgo(msg.timestamp) }}</span>
                    </div>
                    <div class="msg-row-bubble" :class="{ 'bubble-own': msg.senderId === currentStudent.id }">
                      {{ msg.content }}
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <div class="thread-detail-compose">
              <input
                v-model="newMessageText"
                class="compose-input"
                placeholder="Type a reply…"
                @keydown.enter.prevent="sendThreadMessage"
              />
              <CuiButton variant="hero" icon="send" :disabled="!newMessageText.trim()" @click="sendThreadMessage">
                Send
              </CuiButton>
            </div>
          </template>

          <div v-else class="empty-state">
            <span class="material-symbols-rounded" style="font-size: 48px; color: var(--cui-text-subtitle-caption)">chat</span>
            <p>Select a conversation to view messages</p>
          </div>
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
            wcag-label="Absence start date"
            placeholder="Pick a date"
            :required="true"
          />
          <CuiDatePicker
            v-model="newEndDate"
            label="End Date"
            wcag-label="Absence end date"
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
.page-content {
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

/* Thread section (My Absences inline preview) */
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

.dropdown-empty {
  padding: var(--ds-space-xl);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
}

/* Coming-soon empty state (My Schedule) */
.empty-state-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--ds-space-md);
  padding: var(--ds-space-2xl) var(--ds-space-xl);
  margin-top: var(--ds-space-2xl);
}

.empty-icon-circle {
  width: 80px;
  height: 80px;
  border-radius: var(--ds-radius-full);
  background: var(--cui-surface-neutral);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  margin: 0;
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  max-width: 420px;
  line-height: var(--line-height-relaxed);
  margin: 0;
}

/* Messages page */
.messages-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
  height: 600px;
}

.thread-list-panel {
  border-right: 1px solid var(--cui-border-neutral-subtle);
  display: flex;
  flex-direction: column;
}

.thread-list-header {
  padding: var(--ds-space-md) var(--ds-space-lg);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
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

.thread-list-scroll {
  flex: 1;
  overflow-y: auto;
}

.thread-row {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-sm) var(--ds-space-lg);
  border: none;
  background: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
  transition: background 0.1s ease;
}

.thread-row:hover {
  background: var(--cui-surface-default-hover);
}

.thread-row-active {
  background: var(--cui-surface-info-lighter);
}

.thread-row-content {
  flex: 1;
  min-width: 0;
}

.thread-row-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.thread-row-time {
  font-size: 11px;
  color: var(--cui-text-subtitle-caption);
  flex-shrink: 0;
}

.thread-row-subtitle,
.thread-row-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.thread-row-status {
  width: 8px;
  height: 8px;
  border-radius: var(--ds-radius-full);
  flex-shrink: 0;
  margin-top: 6px;
}

.thread-detail-panel {
  display: flex;
  flex-direction: column;
}

.thread-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--ds-space-md) var(--ds-space-lg);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
  flex-shrink: 0;
}

.thread-detail-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--ds-space-md) var(--ds-space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-md);
}

.msg-row {
  display: flex;
  gap: var(--ds-space-sm);
}

.msg-row-own {
  justify-content: flex-end;
}

.msg-row-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--ds-radius-full);
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 2px;
}

.msg-row-body {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.msg-row-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.msg-row-own .msg-row-meta {
  justify-content: flex-end;
}

.msg-row-bubble {
  padding: var(--ds-space-sm);
  border-radius: var(--ds-radius-lg);
  background: var(--cui-surface-neutral);
  font-size: var(--font-size-sm);
  color: var(--cui-text-header-body);
  line-height: var(--line-height-normal);
}

.bubble-own {
  background: var(--cui-surface-hero-action);
  color: white;
}

.msg-system-bubble {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: var(--ds-space-xs) var(--ds-space-sm);
  border-radius: var(--ds-radius-lg);
  background: var(--cui-surface-info-lighter);
  font-size: var(--font-size-xs);
  color: var(--cui-text-info-small);
  line-height: var(--line-height-normal);
  width: 100%;
}

.thread-detail-compose {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-sm) var(--ds-space-lg);
  border-top: 1px solid var(--cui-border-neutral-subtle);
  flex-shrink: 0;
}

.compose-input {
  flex: 1;
  padding: var(--ds-space-sm);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-lg);
  font-family: inherit;
  font-size: var(--font-size-sm);
  color: var(--cui-text-header-body);
  background: var(--cui-surface-default-white);
  outline: none;
  transition: border-color 0.15s ease;
}

.compose-input:focus {
  border-color: var(--cui-border-focus);
}

.compose-input::placeholder {
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
