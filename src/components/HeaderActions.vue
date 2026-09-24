<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { messages, absenceRequests, avatarMap } from "../data/mock";

const props = defineProps<{
  role: "principal" | "teacher" | "student";
  userId: string;
}>();

const showNotifications = ref(false);
const showMessages = ref(false);
const notifRef = ref<HTMLElement | null>(null);
const msgRef = ref<HTMLElement | null>(null);

function handleClickOutside(e: MouseEvent) {
  if (notifRef.value && !notifRef.value.contains(e.target as Node)) {
    showNotifications.value = false;
  }
  if (msgRef.value && !msgRef.value.contains(e.target as Node)) {
    showMessages.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside));

function toggleNotifications() {
  showNotifications.value = !showNotifications.value;
  showMessages.value = false;
}

function toggleMessages() {
  showMessages.value = !showMessages.value;
  showNotifications.value = false;
}

// --- Notifications ---
const notifications = computed(() => {
  const items: { id: string; icon: string; iconType: string; title: string; body: string; time: string; read: boolean }[] = [];

  for (const req of absenceRequests) {
    if (props.role === "principal") {
      if (req.status === "pending") {
        items.push({
          id: req.id,
          icon: req.type === "teacher" ? "person_off" : "school",
          iconType: "warn",
          title: `New ${req.type} absence request`,
          body: `${req.requesterName} — ${req.reason}`,
          time: timeAgo(req.createdAt),
          read: false,
        });
      }
      if (req.type === "teacher" && req.coverageNeeded && !req.substituteId && req.status === "approved") {
        items.push({
          id: `${req.id}-gap`,
          icon: "warning",
          iconType: "danger",
          title: "Staffing gap needs coverage",
          body: `${req.requesterName} — no substitute assigned`,
          time: timeAgo(req.createdAt),
          read: false,
        });
      }
    } else if (props.role === "teacher") {
      if (req.type === "student" && req.status === "pending") {
        items.push({
          id: req.id,
          icon: "assignment",
          iconType: "info",
          title: "Student absence request",
          body: `${req.requesterName} — ${req.reason}`,
          time: timeAgo(req.createdAt),
          read: false,
        });
      }
      if (req.type === "teacher" && req.requesterId === props.userId && req.status !== "pending") {
        items.push({
          id: req.id,
          icon: req.status === "approved" ? "check_circle" : "cancel",
          iconType: req.status === "approved" ? "success" : "danger",
          title: `Your request was ${req.status}`,
          body: req.reason,
          time: timeAgo(req.createdAt),
          read: true,
        });
      }
    } else if (props.role === "student") {
      if (req.requesterId === props.userId && req.status !== "pending") {
        items.push({
          id: req.id,
          icon: req.status === "approved" ? "check_circle" : "cancel",
          iconType: req.status === "approved" ? "success" : "danger",
          title: `Absence ${req.status}`,
          body: req.reason,
          time: timeAgo(req.createdAt),
          read: true,
        });
      }
    }
  }
  return items.slice(0, 5);
});

// --- Messages: group by thread, show last message per thread ---
interface ThreadPreview {
  threadId: string;
  senderName: string;
  senderAvatar: string;
  preview: string;
  time: string;
  isOwn: boolean;
  status: string;
}

const recentThreads = computed<ThreadPreview[]>(() => {
  const threadMap = new Map<string, typeof messages[0][]>();
  for (const msg of messages) {
    const arr = threadMap.get(msg.threadId) || [];
    arr.push(msg);
    threadMap.set(msg.threadId, arr);
  }

  const threads: ThreadPreview[] = [];
  for (const [threadId, msgs] of threadMap) {
    const req = absenceRequests.find((a) => a.id === threadId);
    if (!req) continue;

    // Filter by role visibility
    if (props.role === "student" && req.requesterId !== props.userId) continue;
    if (props.role === "teacher" && req.type === "teacher" && req.requesterId !== props.userId) continue;
    if (props.role === "teacher" && req.type !== "student" && req.requesterId !== props.userId) continue;

    const sorted = [...msgs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const last = sorted[0];
    if (last.senderRole === "system") continue;

    threads.push({
      threadId,
      senderName: last.senderName,
      senderAvatar: resolveAvatar(last.senderId),
      preview: last.content.length > 55 ? last.content.slice(0, 55) + "…" : last.content,
      time: timeAgo(last.timestamp),
      isOwn: last.senderId === props.userId,
      status: req.status,
    });
  }

  return threads
    .sort((a, b) => {
      const aMsg = messages.find((m) => m.threadId === a.threadId && m.senderName === a.senderName);
      const bMsg = messages.find((m) => m.threadId === b.threadId && m.senderName === b.senderName);
      return new Date(bMsg?.timestamp ?? 0).getTime() - new Date(aMsg?.timestamp ?? 0).getTime();
    })
    .slice(0, 5);
});

const unreadNotifCount = computed(() => notifications.value.filter((n) => !n.read).length);
const unreadMsgCount = computed(() => recentThreads.value.filter((t) => !t.isOwn).length);

function resolveAvatar(senderId: string): string {
  return avatarMap[senderId] || "/avatars/avatar-1.svg";
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
  <div class="header-actions">
    <!-- Notifications -->
    <div ref="notifRef" class="action-wrapper">
      <button class="action-icon" aria-label="Notifications" @click.stop="toggleNotifications">
        <span class="material-symbols-rounded">notifications</span>
        <span v-if="unreadNotifCount > 0" class="action-badge">{{ unreadNotifCount }}</span>
      </button>

      <Transition name="dropdown">
        <div v-if="showNotifications" class="dropdown-panel">
          <div class="dropdown-header">
            <span class="dropdown-title">Notifications</span>
            <span v-if="unreadNotifCount > 0" class="dropdown-badge">{{ unreadNotifCount }} new</span>
          </div>
          <div class="dropdown-list">
            <div
              v-for="notif in notifications"
              :key="notif.id"
              class="dropdown-item"
              :class="{ 'item-unread': !notif.read }"
            >
              <div class="notif-icon" :class="`notif-icon-${notif.iconType}`">
                <span class="material-symbols-rounded" style="font-size: 14px; font-variation-settings: 'FILL' 1">{{ notif.icon }}</span>
              </div>
              <div class="item-content">
                <div class="item-title">{{ notif.title }}</div>
                <div class="item-body">{{ notif.body }}</div>
              </div>
              <div class="item-time">{{ notif.time }}</div>
            </div>
            <div v-if="notifications.length === 0" class="dropdown-empty">
              <span class="material-symbols-rounded" style="font-size: 32px; color: var(--cui-text-subtitle-caption)">notifications_off</span>
              <span>No notifications</span>
            </div>
          </div>
          <div v-if="notifications.length > 0" class="dropdown-footer">
            <span>View all notifications</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Messages -->
    <div ref="msgRef" class="action-wrapper">
      <button class="action-icon" aria-label="Messages" @click.stop="toggleMessages">
        <span class="material-symbols-rounded">chat</span>
        <span v-if="unreadMsgCount > 0" class="action-badge">{{ unreadMsgCount }}</span>
      </button>

      <Transition name="dropdown">
        <div v-if="showMessages" class="dropdown-panel">
          <div class="dropdown-header">
            <span class="dropdown-title">Messages</span>
            <span v-if="unreadMsgCount > 0" class="dropdown-badge">{{ unreadMsgCount }} unread</span>
          </div>
          <div class="dropdown-list">
            <div
              v-for="thread in recentThreads"
              :key="thread.threadId"
              class="dropdown-item"
              :class="{ 'item-unread': !thread.isOwn }"
            >
              <img class="item-avatar" :src="thread.senderAvatar" :alt="thread.senderName" />
              <div class="item-content">
                <div class="item-title">{{ thread.senderName }}</div>
                <div class="item-body">{{ thread.preview }}</div>
              </div>
              <div class="item-time">{{ thread.time }}</div>
            </div>
            <div v-if="recentThreads.length === 0" class="dropdown-empty">
              <span class="material-symbols-rounded" style="font-size: 32px; color: var(--cui-text-subtitle-caption)">forum</span>
              <span>No messages</span>
            </div>
          </div>
          <div v-if="recentThreads.length > 0" class="dropdown-footer">
            <span>View all messages</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Theme toggle -->
    <CuiThemeToggle :icon-only="true" variant="secondary-text" />
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-wrapper {
  position: relative;
}

.action-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--ds-radius-full);
  border: none;
  background: transparent;
  color: var(--cui-text-subtitle-caption);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: color 0.15s, background 0.15s;
}

.action-icon:hover {
  color: var(--cui-text-header-body);
  background: var(--cui-surface-neutral);
}

.action-icon .material-symbols-rounded {
  font-size: 22px;
}

.action-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--cui-surface-danger);
  color: white;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

/* Dropdown panel */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.1));
  z-index: 50;
  overflow: hidden;
  line-height: normal;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--ds-space-xs) var(--ds-space-sm);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
}

.dropdown-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.dropdown-badge {
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  color: var(--cui-text-subtitle-caption);
}

.dropdown-list {
  max-height: 360px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-xs);
  padding: var(--ds-space-sm);
  cursor: pointer;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: var(--cui-surface-default-hover);
}

.item-unread {
  background: var(--cui-surface-info-lighter);
}

.item-unread:hover {
  background: var(--cui-surface-info-lighter);
  filter: brightness(0.97);
}

/* Notification icons */
.notif-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--ds-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-icon-warn {
  background: var(--cui-surface-warn-lighter);
  color: var(--cui-text-warn-large);
}

.notif-icon-danger {
  background: var(--cui-surface-danger-lighter, #fef2f2);
  color: var(--cui-text-danger-large);
}

.notif-icon-success {
  background: var(--cui-surface-success-lighter, #f0fdf4);
  color: var(--cui-text-success-large);
}

.notif-icon-info {
  background: var(--cui-surface-info-lighter);
  color: var(--color-primary);
}

/* Message avatars */
.item-avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--ds-radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  line-height: 1.4;
}

.item-body {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-time {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
  opacity: 0.7;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Footer */
.dropdown-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-xs) var(--ds-space-sm);
  border-top: 1px solid var(--cui-border-neutral-subtle);
  cursor: pointer;
  transition: background 0.1s;
}

.dropdown-footer span {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--cui-surface-hero-action);
}

.dropdown-footer:hover {
  background: var(--cui-surface-default-hover);
}

/* Empty state */
.dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-xs);
  padding: var(--ds-space-xl) var(--ds-space-lg);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
