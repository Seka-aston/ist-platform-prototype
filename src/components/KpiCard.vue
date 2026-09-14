<script setup lang="ts">
defineProps<{
  icon: string;
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  iconColor?: string;
  iconBg?: string;
}>();
</script>

<template>
  <div class="kpi-card">
    <div class="kpi-top">
      <div class="kpi-label">{{ label }}</div>
      <div class="kpi-icon" :style="{ backgroundColor: iconBg, color: iconColor }">
        <span class="material-symbols-rounded">{{ icon }}</span>
      </div>
    </div>
    <div class="kpi-value">{{ value }}</div>
    <div v-if="trend" class="kpi-trend" :class="`trend-${trendDirection ?? 'neutral'}`">
      <span class="material-symbols-rounded trend-icon">
        {{ trendDirection === 'up' ? 'trending_up' : trendDirection === 'down' ? 'trending_down' : 'trending_flat' }}
      </span>
      {{ trend }}
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-lg);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--ds-space-sm);
}

.kpi-label {
  font-size: var(--font-size-sm);
  color: var(--cui-text-subtitle-caption);
  font-weight: var(--font-weight-medium);
  padding-top: 6px;
}

.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--ds-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon .material-symbols-rounded {
  font-size: 22px;
  font-variation-settings: "FILL" 1;
}

.kpi-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--cui-text-header-body);
  line-height: 1.1;
}

.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  margin-top: var(--ds-space-xs);
}

.trend-icon {
  font-size: 16px !important;
}

.trend-up {
  color: var(--cui-text-success-small);
}

.trend-down {
  color: var(--cui-text-danger-small);
}

.trend-neutral {
  color: var(--cui-text-subtitle-caption);
}
</style>
