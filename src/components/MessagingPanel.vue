<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { messages, absenceRequests, avatarMap, type Message } from "../data/mock";

const props = defineProps<{
  role: "principal" | "teacher" | "student";
  userId: string;
  userName: string;
}>();

const isOpen = ref(false);
const activeThreadId = ref<string | null>(null);
const newMessage = ref("");
const messagesEnd = ref<HTMLElement | null>(null);

// Group messages into threads (by threadId = absenceRequest id)
interface Thread {
  id: string;
  title: string;
  subtitle: string;
  lastMessage: Message;
  unread: boolean;
  messages: Message[];
  status: string;
  requesterId: string;
}

const threads = computed<Thread[]>(() => {
  const threadMap = new Map<string, Message[]>();
  for (const msg of messages) {
    const arr = threadMap.get(msg.threadId) || [];
    arr.push(msg);
    threadMap.set(msg.threadId, arr);
  }

  const result: Thread[] = [];
  for (const [threadId, msgs] of threadMap) {
    const request = absenceRequests.find((a) => a.id === threadId);
    if (!request) continue;

    // Filter based on role visibility
    if (props.role === "student" && request.requesterId !== props.userId) continue;
    if (props.role === "teacher" && request.type === "teacher" && request.requesterId !== props.userId) continue;
    if (props.role === "teacher" && request.type !== "student" && request.requesterId !== props.userId) continue;

    const sorted = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const last = sorted[sorted.length - 1];

    result.push({
      id: threadId,
      title: request.requesterName,
      requesterId: request.requesterId,
      subtitle: request.type === "student"
        ? `${request.className} — ${request.reason}`
        : request.reason,
      lastMessage: last,
      unread: last.senderRole !== props.role && last.senderRole !== "system",
      messages: sorted,
      status: request.status,
    });
  }

  return result.sort(
    (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime(),
  );
});

const activeThread = computed(() => threads.value.find((t) => t.id === activeThreadId.value) ?? null);

const unreadCount = computed(() => threads.value.filter((t) => t.unread).length);

function openThread(threadId: string) {
  activeThreadId.value = threadId;
  nextTick(() => scrollToBottom());
}

function goBack() {
  activeThreadId.value = null;
}

function togglePanel() {
  isOpen.value = !isOpen.value;
  if (!isOpen.value) activeThreadId.value = null;
}

function sendMessage() {
  if (!newMessage.value.trim() || !activeThreadId.value) return;

  const msg: Message = {
    id: `msg-${Date.now()}`,
    threadId: activeThreadId.value,
    senderId: props.userId,
    senderName: props.userName,
    senderRole: props.role,
    content: newMessage.value.trim(),
    timestamp: new Date().toISOString(),
  };
  messages.push(msg);
  newMessage.value = "";
  nextTick(() => scrollToBottom());
}

function scrollToBottom() {
  messagesEnd.value?.scrollIntoView({ behavior: "smooth" });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function statusColor(status: string) {
  switch (status) {
    case "approved": return "var(--cui-text-success-small)";
    case "pending": return "var(--cui-text-warn-small)";
    case "denied": return "var(--cui-text-danger-small)";
    default: return "var(--cui-text-subtitle-caption)";
  }
}

watch(isOpen, (val) => {
  if (val && activeThreadId.value) {
    nextTick(() => scrollToBottom());
  }
});
</script>

<template>
  <!-- Floating trigger button -->
  <button class="msg-trigger" @click="togglePanel" :class="{ 'trigger-active': isOpen }">
    <span class="material-symbols-rounded" style="font-size: 24px; font-variation-settings: 'FILL' 1">
      {{ isOpen ? 'close' : 'chat' }}
    </span>
    <span v-if="unreadCount > 0 && !isOpen" class="trigger-badge">{{ unreadCount }}</span>
  </button>

  <!-- Panel overlay -->
  <Transition name="panel">
    <div v-if="isOpen" class="msg-panel">
      <!-- Thread list view -->
      <div v-if="!activeThread" class="panel-view">
        <div class="panel-header">
          <h3 class="panel-title">Messages</h3>
          <span class="panel-count">{{ threads.length }} conversations</span>
        </div>

        <div class="thread-list">
          <button
            v-for="thread in threads"
            :key="thread.id"
            class="thread-item"
            :class="{ 'thread-unread': thread.unread }"
            @click="openThread(thread.id)"
          >
            <img class="thread-avatar" :src="avatarMap[thread.requesterId] || '/avatars/avatar-1.svg'" :alt="thread.title" />
            <div class="thread-content">
              <div class="thread-top">
                <span class="thread-name">{{ thread.title }}</span>
                <span class="thread-time">{{ timeAgo(thread.lastMessage.timestamp) }}</span>
              </div>
              <div class="thread-subtitle">{{ thread.subtitle }}</div>
              <div class="thread-preview">{{ thread.lastMessage.content.slice(0, 60) }}{{ thread.lastMessage.content.length > 60 ? '…' : '' }}</div>
            </div>
            <div class="thread-status-dot" :style="{ background: statusColor(thread.status) }" />
          </button>

          <div v-if="threads.length === 0" class="panel-empty">
            <span class="material-symbols-rounded" style="font-size: 36px; color: var(--cui-text-subtitle-caption)">forum</span>
            <p>No conversations yet</p>
          </div>
        </div>
      </div>

      <!-- Active thread view -->
      <div v-else class="panel-view">
        <div class="panel-header">
          <button class="back-btn" @click="goBack">
            <span class="material-symbols-rounded" style="font-size: 20px">arrow_back</span>
          </button>
          <div class="panel-header-info">
            <h3 class="panel-title">{{ activeThread.title }}</h3>
            <span class="panel-count">{{ activeThread.subtitle }}</span>
          </div>
        </div>

        <div class="messages-scroll">
          <div
            v-for="msg in activeThread.messages"
            :key="msg.id"
            class="message"
            :class="{
              'msg-own': msg.senderId === userId,
              'msg-system': msg.senderRole === 'system',
            }"
          >
            <div v-if="msg.senderRole === 'system'" class="msg-system-content">
              <span class="material-symbols-rounded" style="font-size: 14px">info</span>
              {{ msg.content }}
            </div>
            <template v-else>
              <div class="msg-meta">
                <span class="msg-sender-name">{{ msg.senderId === userId ? 'You' : msg.senderName }}</span>
                <span class="msg-timestamp">{{ timeAgo(msg.timestamp) }}</span>
              </div>
              <div class="msg-bubble" :class="{ 'bubble-own': msg.senderId === userId }">
                {{ msg.content }}
              </div>
            </template>
          </div>
          <div ref="messagesEnd" />
        </div>

        <div class="compose">
          <input
            v-model="newMessage"
            class="compose-input"
            placeholder="Type a message…"
            @keydown.enter.prevent="sendMessage"
          />
          <button class="compose-send" :disabled="!newMessage.trim()" @click="sendMessage">
            <span class="material-symbols-rounded" style="font-size: 20px">send</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Floating trigger */
.msg-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  width: 52px;
  height: 52px;
  border-radius: var(--ds-radius-full);
  background: var(--cui-surface-hero-action);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ds-shadow-lg);
  transition: all 0.2s ease;
}

.msg-trigger:hover {
  transform: scale(1.05);
  box-shadow: var(--ds-shadow-xl);
}

.trigger-active {
  background: var(--cui-text-subtitle-caption);
}

.trigger-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  border-radius: var(--ds-radius-full);
  background: var(--cui-surface-notification-badge);
  color: white;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

/* Panel */
.msg-panel {
  position: fixed;
  bottom: 88px;
  right: 24px;
  z-index: 99;
  width: 380px;
  height: 520px;
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.25s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}

/* Panel views */
.panel-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-md);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
  flex-shrink: 0;
}

.panel-header-info {
  flex: 1;
  min-width: 0;
}

.panel-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  margin: 0;
}

.panel-count {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--ds-radius-lg);
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cui-text-header-body);
  flex-shrink: 0;
}

.back-btn:hover {
  background: var(--cui-surface-default-hover);
}

/* Thread list */
.thread-list {
  flex: 1;
  overflow-y: auto;
}

.thread-item {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-sm) var(--ds-space-md);
  border: none;
  background: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
  transition: background 0.1s ease;
}

.thread-item:hover {
  background: var(--cui-surface-default-hover);
}

.thread-unread {
  background: var(--cui-surface-info-lighter);
}

.thread-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--ds-radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.thread-content {
  flex: 1;
  min-width: 0;
}

.thread-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.thread-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.thread-time {
  font-size: 11px;
  color: var(--cui-text-subtitle-caption);
  flex-shrink: 0;
}

.thread-subtitle {
  font-size: 11px;
  color: var(--cui-text-subtitle-caption);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-preview {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--ds-radius-full);
  flex-shrink: 0;
  margin-top: 6px;
}

/* Messages view */
.messages-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--ds-space-sm) var(--ds-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-sm);
}

.message {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.msg-own {
  align-items: flex-end;
}

.msg-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.msg-own .msg-meta {
  flex-direction: row-reverse;
}

.msg-sender-name {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.msg-timestamp {
  font-size: 10px;
  color: var(--cui-text-subtitle-caption);
  opacity: 0.7;
}

.msg-bubble {
  max-width: 85%;
  padding: var(--ds-space-sm) var(--ds-space-sm);
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

.msg-system-content {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: var(--ds-space-xs) var(--ds-space-sm);
  border-radius: var(--ds-radius-lg);
  background: var(--cui-surface-info-lighter);
  font-size: var(--font-size-xs);
  color: var(--cui-text-info-small);
  line-height: var(--line-height-normal);
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-2xl);
  color: var(--cui-text-subtitle-caption);
  font-size: var(--font-size-sm);
}

/* Compose bar */
.compose {
  display: flex;
  align-items: center;
  gap: var(--ds-space-xs);
  padding: var(--ds-space-sm) var(--ds-space-md);
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

.compose-send {
  width: 36px;
  height: 36px;
  border-radius: var(--ds-radius-lg);
  border: none;
  background: var(--cui-surface-hero-action);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s ease;
}

.compose-send:disabled {
  opacity: 0.4;
  cursor: default;
}

.compose-send:not(:disabled):hover {
  opacity: 0.9;
}
</style>
