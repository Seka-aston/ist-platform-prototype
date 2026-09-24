<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps<{
  departments: {
    name: string;
    presentStaff: number;
    totalStaff: number;
    presentStudents: number;
    totalStudents: number;
  }[];
}>();

const chartData = computed(() => ({
  labels: props.departments.map((d) => d.name),
  datasets: [
    {
      label: "Present",
      data: props.departments.map((d) => d.presentStaff),
      backgroundColor: "#0d9488",
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    },
    {
      label: "Absent",
      data: props.departments.map((d) => d.totalStaff - d.presentStaff),
      backgroundColor: "#ef4444",
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    },
  ],
}));

const chartOptions = computed(() => ({
  indexAxis: "y" as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 20,
        font: { family: "Inter, sans-serif", size: 12 },
        color: "#64748b",
      },
    },
    tooltip: {
      backgroundColor: "#1e293b",
      titleFont: { family: "Inter, sans-serif", size: 13, weight: 600 },
      bodyFont: { family: "Inter, sans-serif", size: 12 },
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => {
          const dept = props.departments[ctx.dataIndex];
          if (ctx.dataset.label === "Present") {
            return ` Present: ${dept.presentStaff} of ${dept.totalStaff}`;
          }
          return ` Absent: ${dept.totalStaff - dept.presentStaff}`;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      ticks: {
        font: { family: "Inter, sans-serif", size: 11 },
        color: "#94a3b8",
        stepSize: 2,
      },
      border: { display: false },
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: {
        font: { family: "Inter, sans-serif", size: 12, weight: 500 },
        color: "#334155",
        padding: 8,
      },
      border: { display: false },
    },
  },
}));

const studentData = computed(() => ({
  labels: props.departments.map((d) => d.name),
  datasets: [
    {
      label: "Present",
      data: props.departments.map((d) => d.presentStudents),
      backgroundColor: "#3563E9",
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    },
    {
      label: "Absent",
      data: props.departments.map((d) => d.totalStudents - d.presentStudents),
      backgroundColor: "#f59e0b",
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    },
  ],
}));

const studentOptions = computed(() => ({
  indexAxis: "y" as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 20,
        font: { family: "Inter, sans-serif", size: 12 },
        color: "#64748b",
      },
    },
    tooltip: {
      backgroundColor: "#1e293b",
      titleFont: { family: "Inter, sans-serif", size: 13, weight: 600 },
      bodyFont: { family: "Inter, sans-serif", size: 12 },
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => {
          const dept = props.departments[ctx.dataIndex];
          if (ctx.dataset.label === "Present") {
            return ` Present: ${dept.presentStudents} of ${dept.totalStudents}`;
          }
          return ` Absent: ${dept.totalStudents - dept.presentStudents}`;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      ticks: {
        font: { family: "Inter, sans-serif", size: 11 },
        color: "#94a3b8",
      },
      border: { display: false },
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: {
        font: { family: "Inter, sans-serif", size: 12, weight: 500 },
        color: "#334155",
        padding: 8,
      },
      border: { display: false },
    },
  },
}));
</script>

<template>
  <div class="charts-row">
    <div class="chart-card">
      <div class="chart-header">
        <h3 class="chart-title">Staff Occupancy</h3>
        <span class="chart-subtitle">Present vs absent by department</span>
      </div>
      <div class="chart-body">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-header">
        <h3 class="chart-title">Student Attendance</h3>
        <span class="chart-subtitle">Present vs absent by department</span>
      </div>
      <div class="chart-body">
        <Bar :data="studentData" :options="studentOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-md);
}

.chart-card {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-lg);
}

.chart-header {
  margin-bottom: var(--ds-space-md);
}

.chart-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
  margin: 0;
}

.chart-subtitle {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.chart-body {
  height: 280px;
}
</style>
