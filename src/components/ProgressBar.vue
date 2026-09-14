<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  severity?: "default" | "success" | "warn" | "danger";
  size?: "sm" | "md";
}>();

const percent = computed(() => {
  const max = props.max ?? 100;
  return Math.min(100, Math.round((props.value / max) * 100));
});

const barColor = computed(() => {
  switch (props.severity) {
    case "success": return "var(--cui-text-success-large)";
    case "warn": return "var(--cui-text-warn-large)";
    case "danger": return "var(--cui-text-danger-large)";
    default: return "var(--color-primary)";
  }
});
</script>

<template>
  <div class="progress-wrapper">
    <div v-if="label || showPercent" class="progress-meta">
      <span v-if="label" class="progress-label">{{ label }}</span>
      <span v-if="showPercent" class="progress-percent">{{ percent }}%</span>
    </div>
    <div class="progress-track" :class="size === 'sm' ? 'track-sm' : 'track-md'">
      <div class="progress-fill" :style="{ width: `${percent}%`, backgroundColor: barColor }" />
    </div>
  </div>
</template>

<style scoped>
.progress-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.progress-label {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.progress-percent {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.progress-track {
  width: 100%;
  background: var(--cui-surface-neutral);
  border-radius: var(--ds-radius-full);
  overflow: hidden;
}

.track-sm {
  height: 6px;
}

.track-md {
  height: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: var(--ds-radius-full);
  transition: width 0.4s ease;
}
</style>
