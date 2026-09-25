<script setup lang="ts">
import { Column } from "@ist-group/commonui-components-vue";
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
  students,
  type AbsenceRequest,
} from "../data/mock";
import type { MenuEntry } from "@ist-group/commonui-components-vue";

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
const pendingStudentCount = computed(
  () => absenceRequests.filter((a) => a.type === "student" && a.status === "pending").length,
);
const menuItems = computed<MenuEntry[]>(() => [
  { id: "student-requests", type: "item", label: "Student Requests", icon: "assignment", badge: String(pendingStudentCount.value), badgeType: "pill-small" },
  { id: "my-absences", type: "item", label: "My Absences", icon: "event_busy" },
  { id: "my-classes", type: "item", label: "My Classes", icon: "school" },
  { id: "messages", type: "item", label: "Messages", icon: "chat", badge: "2", badgeType: "pill-small" },
  { id: "timetable", type: "item", label: "Timetable", icon: "calendar_month" },
]);

function onMenuClick(item: any) {
  activeMenuId.value = item.id;
}

// --- Breadcrumbs ---
const breadcrumbs = computed(() => {
  const base = [{ label: "Björkbacken School", href: "/" }];
  switch (activeMenuId.value) {
    case "student-requests": return [...base, { label: "Student Requests" }];
    case "my-absences": return [...base, { label: "My Absences" }];
    case "my-classes": return [...base, { label: "My Classes" }];
    case "messages": return [...base, { label: "Messages" }];
    case "timetable": return [...base, { label: "Timetable" }];
    default: return [...base, { label: "Student Requests" }];
  }
});

// =====================
// STUDENT REQUESTS PAGE
// =====================
const studentRequests = computed(() =>
  absenceRequests.filter((a) => a.type === "student"),
);

function approveRequest(req: AbsenceRequest) {
  req.status = "approved";
}

function denyRequest(req: AbsenceRequest) {
  req.status = "denied";
}

// =====================
// MY ABSENCES PAGE
// =====================
const myAbsences = computed(() =>
  absenceRequests.filter((a) => a.type === "teacher" && a.requesterId === currentTeacher.id),
);

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
  activeMenuId.value = "my-absences";
}

// =====================
// MY CLASSES PAGE
// =====================
const myClasses = computed(() => {
  const deptStudents = students.filter((s) => s.department === currentTeacher.department);
  const grouped = new Map<string, typeof students>();
  for (const s of deptStudents) {
    const arr = grouped.get(s.className) ?? [];
    arr.push(s);
    grouped.set(s.className, arr);
  }
  return [...grouped.entries()]
    .map(([className, roster]) => ({ className, roster }))
    .sort((a, b) => a.className.localeCompare(b.className));
});

function isStudentAbsent(studentId: string) {
  return absenceRequests.some(
    (a) => a.type === "student" && a.requesterId === studentId && (a.status === "approved" || a.status === "pending") &&
      new Date(a.startDate) <= new Date() && new Date(a.endDate) >= new Date(),
  );
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
    if (!request) continue;
    if (!(request.type === "student" || request.requesterId === currentTeacher.id)) continue;

    const sorted = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const last = sorted[sorted.length - 1];

    result.push({
      id: threadId,
      title: request.requesterName,
      subtitle: request.type === "student"
        ? `Student — ${request.className} — ${request.reason}`
        : `Your request — ${request.reason}`,
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
    senderId: currentTeacher.id,
    senderName: currentTeacher.name,
    senderRole: "teacher",
    content: newMessageText.value.trim(),
    timestamp: new Date().toISOString(),
  });
  newMessageText.value = "";
}

// =====================
// SHARED UTILITIES
// =====================
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

// --- Messages for a given request (My Absences thread preview) ---
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

    <!-- ==================== -->
    <!-- STUDENT REQUESTS     -->
    <!-- ==================== -->
    <div v-if="activeMenuId === 'student-requests'" class="page-content">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Student Requests</h1>
          <p class="page-subtitle">Review and manage absence requests from your students</p>
        </div>
      </div>

      <div class="table-card">
        <CuiDataTable :value="studentRequests" :rows="10" striped-rows>
          <Column header="Student" sortable field="requesterName">
            <template #body="{ data }">
              <div class="cell-person">
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

    <!-- ==================== -->
    <!-- MY ABSENCES          -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'my-absences'" class="page-content">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">My Absences</h1>
          <p class="page-subtitle">{{ currentTeacher.name }} — {{ currentTeacher.subjects.join(", ") }}</p>
        </div>
        <CuiButton variant="hero" icon="add" @click="showRequestModal = true">
          Request Absence
        </CuiButton>
      </div>

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

          <div v-if="threadMessages(absence.id).length" class="thread-preview">
            <div v-for="msg in threadMessages(absence.id).slice(-2)" :key="msg.id" class="thread-msg">
              <span class="thread-sender">{{ msg.senderName }}:</span>
              {{ msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== -->
    <!-- MY CLASSES           -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'my-classes'" class="page-content">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">My Classes</h1>
          <p class="page-subtitle">Students taught in {{ currentTeacher.subjects.join(", ") }}</p>
        </div>
      </div>

      <div class="dept-sections">
        <div v-for="cls in myClasses" :key="cls.className" class="dept-section">
          <div class="dept-header">
            <div class="dept-title-group">
              <h3 class="dept-name">Class {{ cls.className }}</h3>
              <span class="dept-count">{{ cls.roster.length }} students</span>
            </div>
          </div>

          <div class="staff-list">
            <div v-for="student in cls.roster" :key="student.id" class="staff-row">
              <div class="cell-person">
                <img class="cell-avatar" :src="avatarMap[student.id]" :alt="student.name" />
                <div>
                  <div class="cell-primary">{{ student.name }}</div>
                  <div class="cell-secondary">Guardian: {{ student.guardianName }}</div>
                </div>
              </div>
              <div class="staff-row-right">
                <CuiTag v-if="isStudentAbsent(student.id)" severity="warn" value="Absent" />
                <CuiTag v-else severity="success" value="Present" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="myClasses.length === 0" class="empty-state">
          <span class="material-symbols-rounded" style="font-size: 48px; color: var(--cui-text-subtitle-caption)">school</span>
          <p>No classes assigned yet</p>
        </div>
      </div>
    </div>

    <!-- ==================== -->
    <!-- MESSAGES             -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'messages'" class="page-content">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Messages</h1>
          <p class="page-subtitle">Conversations with students and the principal</p>
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
              <img class="cell-avatar" :src="avatarMap[thread.requesterId] || '/avatars/avatar-1.svg'" :alt="thread.title" />
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
                :class="{ 'msg-row-own': msg.senderId === currentTeacher.id, 'msg-row-system': msg.senderRole === 'system' }"
              >
                <div v-if="msg.senderRole === 'system'" class="msg-system-bubble">
                  <span class="material-symbols-rounded" style="font-size: 14px">info</span>
                  {{ msg.content }}
                </div>
                <template v-else>
                  <img v-if="msg.senderId !== currentTeacher.id" class="msg-row-avatar" :src="avatarMap[msg.senderId] || '/avatars/avatar-1.svg'" :alt="msg.senderName" />
                  <div class="msg-row-body">
                    <div class="msg-row-meta">
                      <span class="cell-primary" style="font-weight: var(--font-weight-semibold)">{{ msg.senderId === currentTeacher.id ? 'You' : msg.senderName }}</span>
                      <span class="cell-secondary">{{ timeAgo(msg.timestamp) }}</span>
                    </div>
                    <div class="msg-row-bubble" :class="{ 'bubble-own': msg.senderId === currentTeacher.id }">
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

    <!-- ==================== -->
    <!-- TIMETABLE            -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'timetable'" class="page-content">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Timetable</h1>
          <p class="page-subtitle">Your weekly teaching schedule</p>
        </div>
      </div>

      <div class="empty-state-large">
        <div class="empty-icon-circle">
          <span class="material-symbols-rounded" style="font-size: 40px; color: var(--cui-text-subtitle-caption)">calendar_month</span>
        </div>
        <h3 class="empty-heading">Timetable coming soon</h3>
        <p class="empty-desc">The timetable view will show your weekly class schedule, room assignments, and how your absences affect the daily roster.</p>
        <CuiButton variant="secondary-outline" icon="arrow_back" @click="activeMenuId = 'student-requests'">
          Back to Student Requests
        </CuiButton>
      </div>
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
            wcag-label="Absence start date"
            placeholder="Select start date"
            :required="true"
          />
          <CuiDatePicker
            v-model="newEndDate"
            label="End Date"
            wcag-label="Absence end date"
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
.page-content {
  max-width: 1100px;
  margin: 0 auto;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
  margin-bottom: var(--ds-space-lg);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  margin: 2px 0 0;
}

.table-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
}

.cell-person {
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

/* My Classes */
.dept-sections {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-md);
}

.dept-section {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
}

.dept-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--ds-space-md) var(--ds-space-lg);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
}

.dept-title-group {
  display: flex;
  align-items: baseline;
  gap: var(--ds-space-sm);
}

.dept-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  margin: 0;
}

.dept-count {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.staff-list {
  display: flex;
  flex-direction: column;
}

.staff-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--ds-space-sm) var(--ds-space-lg);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
}

.staff-row:last-child {
  border-bottom: none;
}

.staff-row-right {
  flex-shrink: 0;
}

/* Messages page */
.messages-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
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

/* Empty states */
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
