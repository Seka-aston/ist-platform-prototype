<script setup lang="ts">
import { Column } from "@ist/commonui-components";
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
  students,
  substituteOptions,
  principal,
  messages,
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
const breadcrumbs = computed(() => {
  const base = [{ label: "Björkbacken School", href: "/" }];
  switch (activeMenuId.value) {
    case "dashboard": return [...base, { label: "Dashboard" }];
    case "teacher-absences": return [...base, { label: "Absences" }, { label: "Teacher Absences" }];
    case "student-absences": return [...base, { label: "Absences" }, { label: "Student Absences" }];
    case "staffing": return [...base, { label: "Staffing" }];
    case "messages": return [...base, { label: "Messages" }];
    case "timetable": return [...base, { label: "Timetable" }];
    default: return [...base, { label: "Dashboard" }];
  }
});

// =====================
// DASHBOARD DATA
// =====================
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

// =====================
// SUBSTITUTE ASSIGNMENT MODAL
// =====================
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

function relevantSubstitutes(gap: AbsenceRequest) {
  const teacher = staff.find((s) => s.id === gap.requesterId);
  if (!teacher) return substituteOptions;
  return substituteOptions.filter((sub) => sub.subjects.some((s) => teacher.subjects.includes(s)));
}

// =====================
// TEACHER ABSENCES PAGE
// =====================
const teacherAbsences = computed(() =>
  absenceRequests.filter((a) => a.type === "teacher"),
);

function getSubstituteName(subId?: string) {
  if (!subId) return "—";
  const sub = staff.find((s) => s.id === subId) ?? substituteOptions.find((s) => s.id === subId);
  return sub?.name ?? "Assigned";
}

// =====================
// STUDENT ABSENCES PAGE
// =====================
const studentAbsences = computed(() =>
  absenceRequests.filter((a) => a.type === "student"),
);

function approveRequest(req: AbsenceRequest) {
  req.status = "approved";
}

function denyRequest(req: AbsenceRequest) {
  req.status = "denied";
}

// =====================
// STAFFING PAGE
// =====================
const staffByDepartment = computed(() => {
  const grouped: { deptName: string; deptId: string; members: typeof staff; presentCount: number; totalCount: number }[] = [];
  for (const dept of departments) {
    const members = staff.filter((s) => s.department === dept.id);
    grouped.push({
      deptName: dept.name,
      deptId: dept.id,
      members,
      presentCount: dept.presentStaff,
      totalCount: dept.totalStaff,
    });
  }
  return grouped;
});

function isStaffAbsent(staffId: string) {
  return absenceRequests.some(
    (a) => a.type === "teacher" && a.requesterId === staffId && (a.status === "approved" || a.status === "pending") &&
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

    const sorted = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const last = sorted[sorted.length - 1];

    result.push({
      id: threadId,
      title: request.requesterName,
      subtitle: request.type === "student"
        ? `Student — ${request.className} — ${request.reason}`
        : `Teacher — ${request.reason}`,
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
    senderId: principal.id,
    senderName: principal.name,
    senderRole: "principal",
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

    <!-- ==================== -->
    <!-- DASHBOARD            -->
    <!-- ==================== -->
    <div v-if="activeMenuId === 'dashboard'" class="page-content">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Staffing Dashboard</h1>
          <p class="page-subtitle">Today, {{ new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) }}</p>
        </div>
      </div>

      <div class="kpi-row">
        <KpiCard icon="groups" :value="totalStaff" label="Total Staff" trend="+2.1%" trend-direction="up" icon-color="var(--color-primary)" icon-bg="var(--cui-surface-info-lighter)" />
        <KpiCard icon="check_circle" :value="presentStaff" label="Present Today" trend="+4.3%" trend-direction="up" icon-color="#0d9488" icon-bg="#f0fdfa" />
        <KpiCard icon="person_off" :value="absentStaff" label="On Leave" trend="-1.8%" trend-direction="down" icon-color="var(--cui-text-warn-large)" icon-bg="var(--cui-surface-warn-lighter)" />
        <KpiCard icon="shield" :value="`${coverageRate}%`" label="Coverage Rate" :trend="coverageRate === 100 ? 'All covered' : 'Gaps open'" :trend-direction="coverageRate === 100 ? 'up' : 'down'" icon-color="var(--cui-surface-hero-action)" icon-bg="#f5f3ff" />
      </div>

      <section class="dashboard-section-card">
        <div class="dashboard-section-header">
          <h2 class="section-title">Department Overview</h2>
        </div>
        <div class="dashboard-section-body">
          <DepartmentChart :departments="departments" />
        </div>
      </section>

      <section class="dashboard-section-card">
        <div class="dashboard-section-header">
          <div class="section-title-row">
            <h2 class="section-title">Staffing Gaps</h2>
            <CuiTag v-if="flaggedGaps.filter(g => !g.substituteId).length > 0" severity="danger" :value="`${flaggedGaps.filter(g => !g.substituteId).length} open`" />
          </div>
          <p class="section-desc">Teacher absences requiring substitute coverage</p>
        </div>
        <div class="dashboard-section-body">
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
                <CuiButton v-if="!gap.substituteId && gap.status === 'approved'" variant="primary" size="small" icon="person_add" @click="openAssignModal(gap)">
                  Assign Substitute
                </CuiButton>
                <CuiButton v-else-if="gap.status === 'pending'" variant="hero" size="small" icon="check" @click="gap.status = 'approved'">
                  Approve
                </CuiButton>
                <CuiButton v-if="gap.status === 'pending'" variant="secondary-outline" size="small" icon="close" @click="gap.status = 'denied'; gap.coverageNeeded = false;">
                  Deny
                </CuiButton>
              </div>
            </div>

            <div v-if="flaggedGaps.length === 0" class="empty-state">
              <span class="material-symbols-rounded" style="font-size: 48px; color: var(--cui-text-success-large)">check_circle</span>
              <p>All staffing gaps are covered</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ==================== -->
    <!-- TEACHER ABSENCES     -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'teacher-absences'" class="page-content">
      <div class="table-card">
        <div class="table-card-header">
          <h1 class="page-title">Teacher Absences</h1>
          <p class="page-subtitle">Manage teacher leave requests and substitute coverage</p>
        </div>
        <CuiDataTable :value="teacherAbsences" :rows="10" striped-rows>
          <Column header="Teacher" sortable field="requesterName">
            <template #body="{ data }">
              <div class="cell-person">
                <img class="cell-avatar" :src="avatarMap[data.requesterId]" :alt="data.requesterName" />
                <div>
                  <div class="cell-primary">{{ data.requesterName }}</div>
                  <div class="cell-secondary">{{ data.department }}</div>
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
          <Column header="Substitute" field="substituteId">
            <template #body="{ data }">
              <div v-if="data.substituteId" class="cell-person">
                <img class="cell-avatar cell-avatar-sm" :src="avatarMap[data.substituteId]" :alt="getSubstituteName(data.substituteId)" />
                <span class="cell-primary">{{ getSubstituteName(data.substituteId) }}</span>
              </div>
              <span v-else-if="data.coverageNeeded && data.status === 'approved'" class="cell-danger">Unassigned</span>
              <span v-else class="cell-secondary">—</span>
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <div class="action-buttons">
                <CuiButton v-if="data.status === 'pending'" variant="hero" size="small" icon="check" @click="data.status = 'approved'">
                  Approve
                </CuiButton>
                <CuiButton v-if="data.status === 'pending'" variant="secondary-outline" size="small" icon="close" @click="data.status = 'denied'; data.coverageNeeded = false;">
                  Deny
                </CuiButton>
                <CuiButton v-if="data.coverageNeeded && data.status === 'approved' && !data.substituteId" variant="primary" size="small" icon="person_add" @click="openAssignModal(data)">
                  Assign
                </CuiButton>
                <span v-if="data.status !== 'pending' && !(data.coverageNeeded && data.status === 'approved' && !data.substituteId)" class="cell-secondary">—</span>
              </div>
            </template>
          </Column>
        </CuiDataTable>
      </div>
    </div>

    <!-- ==================== -->
    <!-- STUDENT ABSENCES     -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'student-absences'" class="page-content">
      <div class="table-card">
        <div class="table-card-header">
          <h1 class="page-title">Student Absences</h1>
          <p class="page-subtitle">Review and manage student absence requests across all classes</p>
        </div>
        <CuiDataTable :value="studentAbsences" :rows="10" striped-rows>
          <Column header="Student" sortable field="requesterName">
            <template #body="{ data }">
              <div class="cell-person">
                <img class="cell-avatar" :src="avatarMap[data.requesterId]" :alt="data.requesterName" />
                <div>
                  <div class="cell-primary">{{ data.requesterName }}</div>
                  <div class="cell-secondary">Class {{ data.className }}</div>
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
          <Column header="Submitted" sortable field="createdAt">
            <template #body="{ data }">
              <span class="cell-secondary">{{ timeAgo(data.createdAt) }}</span>
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <div v-if="data.status === 'pending'" class="action-buttons">
                <CuiButton variant="hero" size="small" icon="check" @click="approveRequest(data)">
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
    <!-- STAFFING             -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'staffing'" class="page-content">
      <div class="page-header-card">
        <h1 class="page-title">Staffing</h1>
        <p class="page-subtitle">Staff directory and department overview</p>
      </div>

      <div class="staff-stats">
        <div class="stat-card">
          <div class="stat-value">{{ staff.filter(s => s.role === 'teacher').length }}</div>
          <div class="stat-label">Teachers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ staff.filter(s => s.role === 'substitute').length }}</div>
          <div class="stat-label">Substitutes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ departments.length }}</div>
          <div class="stat-label">Departments</div>
        </div>
      </div>

      <div class="dept-sections">
        <div v-for="dept in staffByDepartment" :key="dept.deptId" class="dept-section">
          <div class="dept-header">
            <div class="dept-title-group">
              <h3 class="dept-name">{{ dept.deptName }}</h3>
              <span class="dept-count">{{ dept.presentCount }}/{{ dept.totalCount }} present</span>
            </div>
            <CuiTag
              :severity="dept.presentCount === dept.totalCount ? 'success' : dept.presentCount >= dept.totalCount - 1 ? 'warn' : 'danger'"
              :value="dept.presentCount === dept.totalCount ? 'Full' : `${dept.totalCount - dept.presentCount} absent`"
            />
          </div>

          <div v-if="dept.members.length > 0" class="staff-list">
            <div v-for="member in dept.members" :key="member.id" class="staff-row">
              <div class="cell-person">
                <img class="cell-avatar" :src="member.avatar ?? '/avatars/avatar-1.svg'" :alt="member.name" />
                <div>
                  <div class="cell-primary">{{ member.name }}</div>
                  <div class="cell-secondary">{{ member.subjects.join(", ") }}</div>
                </div>
              </div>
              <div class="staff-row-right">
                <CuiTag
                  v-if="member.role === 'substitute'"
                  severity="neutral"
                  value="Substitute"
                />
                <CuiTag
                  v-else-if="isStaffAbsent(member.id)"
                  severity="warn"
                  value="On Leave"
                />
                <CuiTag
                  v-else
                  severity="success"
                  value="Present"
                />
              </div>
            </div>
          </div>
          <div v-else class="dept-empty">
            <span class="cell-secondary">No staff assigned</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== -->
    <!-- MESSAGES             -->
    <!-- ==================== -->
    <div v-else-if="activeMenuId === 'messages'" class="page-content">
      <div class="messages-layout">
        <div class="messages-card-header">
          <h1 class="page-title">Messages</h1>
          <p class="page-subtitle">All conversations related to absence requests</p>
        </div>
        <!-- Thread list -->
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
          </div>
        </div>

        <!-- Thread detail -->
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
                :class="{ 'msg-row-own': msg.senderId === principal.id, 'msg-row-system': msg.senderRole === 'system' }"
              >
                <div v-if="msg.senderRole === 'system'" class="msg-system-bubble">
                  <span class="material-symbols-rounded" style="font-size: 14px">info</span>
                  {{ msg.content }}
                </div>
                <template v-else>
                  <img v-if="msg.senderId !== principal.id" class="msg-row-avatar" :src="avatarMap[msg.senderId] || '/avatars/avatar-1.svg'" :alt="msg.senderName" />
                  <div class="msg-row-body">
                    <div class="msg-row-meta">
                      <span class="cell-primary" style="font-weight: var(--font-weight-semibold)">{{ msg.senderId === principal.id ? 'You' : msg.senderName }}</span>
                      <span class="cell-secondary">{{ timeAgo(msg.timestamp) }}</span>
                    </div>
                    <div class="msg-row-bubble" :class="{ 'bubble-own': msg.senderId === principal.id }">
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

          <div v-else class="empty-state messages-empty-state">
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
      <div class="timetable-card">
        <div class="table-card-header">
          <h1 class="page-title">Timetable</h1>
          <p class="page-subtitle">School schedule and class assignments</p>
        </div>
        <div class="empty-state-large">
          <div class="empty-icon-circle">
            <span class="material-symbols-rounded" style="font-size: 40px; color: var(--cui-text-subtitle-caption)">calendar_month</span>
          </div>
          <h3 class="empty-heading">Timetable coming soon</h3>
          <p class="empty-desc">The timetable view will show weekly class schedules, room assignments, and how absences affect the daily roster.</p>
          <CuiButton variant="secondary-outline" icon="arrow_back" @click="activeMenuId = 'dashboard'">
            Back to Dashboard
          </CuiButton>
        </div>
      </div>
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
.page-content {
  max-width: 1200px;
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

/* KPI row */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-md);
  margin-bottom: var(--ds-space-xl);
}

/* Sections */
.section-title-row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  margin: 0;
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  margin: var(--ds-space-xs) 0 0;
}

.dashboard-section-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
  margin-bottom: var(--ds-space-xl);
}

.dashboard-section-header {
  padding: var(--ds-space-lg);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
}

.dashboard-section-body {
  padding: var(--ds-space-lg);
}

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

/* Table shared styles */
.table-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
}

.table-card-header {
  padding: var(--ds-space-lg);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
}

.timetable-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
}

.page-header-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-lg);
  margin-bottom: var(--ds-space-md);
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

.cell-avatar-sm {
  width: 24px;
  height: 24px;
}

.cell-primary {
  font-size: var(--font-size-sm);
  color: var(--cui-text-header-body);
}

.cell-secondary {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.cell-danger {
  font-size: var(--font-size-xs);
  color: var(--cui-text-danger-small);
  font-weight: var(--font-weight-medium);
}

.action-buttons {
  display: flex;
  gap: var(--ds-space-xs);
}

/* Staffing page */
.staff-stats {
  display: flex;
  gap: var(--ds-space-md);
  margin-bottom: var(--ds-space-xl);
}

.stat-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-md) var(--ds-space-lg);
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--cui-text-header-body);
  line-height: 1.1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  margin-top: 2px;
}

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

.dept-empty {
  padding: var(--ds-space-md) var(--ds-space-lg);
}

/* Messages page */
.messages-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  grid-template-rows: auto 1fr;
  gap: 0;
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
  height: 700px;
}

.messages-card-header {
  grid-column: 1 / -1;
  padding: var(--ds-space-lg);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
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
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-2xl);
  color: var(--cui-text-subtitle-caption);
}

.messages-empty-state {
  flex: 1;
  justify-content: center;
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
