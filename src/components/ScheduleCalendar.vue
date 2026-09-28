<script setup lang="ts">
import { computed, ref } from "vue";
import type { AbsenceRequest, Lesson, StaffMember, SubstituteOption } from "../data/mock";

const props = defineProps<{
  lessons: Lesson[];
  teachers: StaffMember[];
  classNames: string[];
  absenceRequests: AbsenceRequest[];
  substituteOptions: SubstituteOption[];
  avatarMap: Record<string, string>;
}>();

// --- Week + hour grid geometry ---
// Lessons recur every school week (see Lesson.dayOfWeek); navigating weeks
// only changes which real dates absence coverage is checked against.
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const GRID_START_MIN = 9 * 60 + 30; // 09:30
const GRID_END_MIN = 16 * 60; // 16:00
const PX_PER_HOUR = 140;
const GRID_TOTAL_MIN = GRID_END_MIN - GRID_START_MIN;
const GRID_HEIGHT_PX = (GRID_TOTAL_MIN / 60) * PX_PER_HOUR;
const CARD_GAP_PX = 3; // clearance between a lesson card and its surrounding gridlines, equal on all sides

// Whole-hour gridlines that fall within the (possibly non-hour-aligned) range.
const hourMarks = computed(() => {
  const marks = [];
  for (let h = Math.ceil(GRID_START_MIN / 60); h * 60 <= GRID_END_MIN; h++) {
    marks.push({
      label: `${String(h).padStart(2, "0")}:00`,
      topPct: ((h * 60 - GRID_START_MIN) / GRID_TOTAL_MIN) * 100,
    });
  }
  return marks;
});

// Half-hour gridlines (the :30 marks in between) — drawn lighter/thinner than
// the whole-hour lines above so the hour structure still reads clearly.
// Skips the grid's own top edge (which is already a boundary) and every
// whole hour (already covered by hourMarks).
const halfHourMarks = computed(() => {
  const marks = [];
  for (let m = GRID_START_MIN + 30; m < GRID_END_MIN; m += 30) {
    if (m % 60 === 0) continue;
    marks.push({ key: m, topPct: ((m - GRID_START_MIN) / GRID_TOTAL_MIN) * 100 });
  }
  return marks;
});

function toIsoLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayOf(d: Date) {
  const monday = new Date(d);
  const dow = monday.getDay(); // 0 = Sun … 6 = Sat
  monday.setDate(monday.getDate() + (dow === 0 ? -6 : 1 - dow));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const today = new Date();
const todayIso = toIsoLocal(today);
const thisMonday = mondayOf(today);

const weekOffset = ref(0);

const weekDays = computed(() => {
  const monday = new Date(thisMonday);
  monday.setDate(monday.getDate() + weekOffset.value * 7);
  return DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const date = toIsoLocal(d);
    return {
      date,
      label,
      dateLabel: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      isToday: date === todayIso,
    };
  });
});

const weekRangeLabel = computed(() => {
  const days = weekDays.value;
  const first = new Date(days[0].date);
  const last = new Date(days[4].date);
  const sameMonth = first.getMonth() === last.getMonth();
  const firstLabel = first.toLocaleDateString("en-GB", { day: "numeric", month: sameMonth ? undefined : "short" });
  const lastLabel = last.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${firstLabel} – ${lastLabel}`;
});

function prevWeek() {
  weekOffset.value -= 1;
}
function nextWeek() {
  weekOffset.value += 1;
}

const nowLine = computed(() => {
  const todayIndex = weekDays.value.findIndex((d) => d.isToday);
  if (todayIndex === -1) return null;
  const minutes = today.getHours() * 60 + today.getMinutes();
  if (minutes < GRID_START_MIN || minutes > GRID_END_MIN) return null;
  return {
    dayIndex: todayIndex,
    topPct: ((minutes - GRID_START_MIN) / (GRID_END_MIN - GRID_START_MIN)) * 100,
  };
});

// --- Mode + selection ---
// CuiTabs' modelValue is a plain tab id (number), so the toggle is keyed
// 0/1 here and exposed as a readable "teachers" | "classes" string below.
const modeTabId = ref(0);
const modeTabs = [
  { id: 0, label: "Teachers", wcagLabel: "View teachers' schedules" },
  { id: 1, label: "Classes", wcagLabel: "View classes' schedules" },
];
const mode = computed(() => (modeTabId.value === 0 ? "teachers" : "classes"));

const teacherOptions = computed(() =>
  props.teachers.map((t) => ({ value: t.id, label: t.name })),
);
const classOptions = computed(() =>
  props.classNames.map((c) => ({ value: c, label: c })),
);

const selectedTeacherId = ref(props.teachers[0]?.id ?? "");
const selectedClassName = ref(props.classNames[0] ?? "");

function selectTeacher(teacherId: string) {
  selectedTeacherId.value = teacherId;
  modeTabId.value = 0;
}

// --- Lessons for the active selection ---
const activeLessons = computed(() => {
  if (mode.value === "teachers") {
    return props.lessons.filter((l) => l.teacherId === selectedTeacherId.value);
  }
  return props.lessons.filter((l) => l.className === selectedClassName.value);
});

function teacherName(teacherId: string) {
  return props.teachers.find((t) => t.id === teacherId)?.name ?? "Unknown";
}

// --- Absence / substitute cross-reference ---
function absenceInfo(teacherId: string, date: string) {
  const req = props.absenceRequests.find(
    (a) =>
      a.type === "teacher" &&
      a.requesterId === teacherId &&
      (a.status === "approved" || a.status === "pending") &&
      date >= a.startDate &&
      date <= a.endDate,
  );
  if (!req) return null;
  if (req.substituteId) {
    const sub =
      props.teachers.find((t) => t.id === req.substituteId) ??
      props.substituteOptions.find((s) => s.id === req.substituteId);
    return { covered: true as const, substituteName: sub?.name ?? "Substitute", reason: req.reason };
  }
  return { covered: false as const, substituteName: null, reason: req.reason };
}

// --- Subject color category ---
const STEM = new Set(["Mathematics", "Physics", "Chemistry", "Biology"]);
const LANGUAGES = new Set(["Swedish", "English", "French", "Spanish"]);
const HUMANITIES = new Set(["History", "Geography", "Civics", "Social Studies"]);

function subjectCategory(subject: string) {
  if (STEM.has(subject)) return "stem";
  if (LANGUAGES.has(subject)) return "languages";
  if (HUMANITIES.has(subject)) return "humanities";
  return "arts";
}

// --- Positioned cards ---
const positionedLessons = computed(() =>
  activeLessons.value
    .filter((lesson) => lesson.dayOfWeek >= 0 && lesson.dayOfWeek < 5)
    .map((lesson) => {
      const dayIndex = lesson.dayOfWeek;
      const lessonDate = weekDays.value[dayIndex].date;
      const [sh, sm] = lesson.startTime.split(":").map(Number);
      const [eh, em] = lesson.endTime.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const totalMin = GRID_END_MIN - GRID_START_MIN;

      const absence = absenceInfo(lesson.teacherId, lessonDate);

      // Every card sits inset by exactly CARD_GAP_PX from the time
      // boundaries above/below it and the day-column edges beside it —
      // equal clearance on all four sides, so the card never touches
      // (let alone covers) a gridline.
      return {
        lesson,
        dayIndex,
        absence,
        category: subjectCategory(lesson.subject),
        style: {
          top: `calc(${((startMin - GRID_START_MIN) / totalMin) * 100}% + ${CARD_GAP_PX}px)`,
          height: `calc(${((endMin - startMin) / totalMin) * 100}% - ${CARD_GAP_PX * 2}px)`,
          left: `calc(${(dayIndex / 5) * 100}% + ${CARD_GAP_PX}px)`,
          width: `calc(${100 / 5}% - ${CARD_GAP_PX * 2}px)`,
        },
      };
    }),
);

const gridBodyStyle = { height: `${GRID_HEIGHT_PX}px` };
const gridHourLabelsStyle = { height: `${GRID_HEIGHT_PX}px` };
</script>

<template>
  <div class="schedule">
    <div class="schedule-toolbar">
      <CuiTabs
        v-model="modeTabId"
        :tabs="modeTabs"
        wcag-label="Schedule view"
        class="mode-tabs"
      />
      <CuiSelect
        v-if="mode === 'teachers'"
        :options="teacherOptions"
        option-label="label"
        option-value="value"
        v-model="selectedTeacherId"
        placeholder="Select a teacher"
        class="entity-select"
      />
      <CuiSelect
        v-else
        :options="classOptions"
        option-label="label"
        option-value="value"
        v-model="selectedClassName"
        placeholder="Select a class"
        class="entity-select"
      />
    </div>

    <div class="week-nav">
      <button type="button" class="week-nav-arrow" aria-label="Previous week" @click="prevWeek">
        <span class="material-symbols-rounded">chevron_left</span>
      </button>
      <span class="week-nav-label">{{ weekRangeLabel }}</span>
      <button type="button" class="week-nav-arrow" aria-label="Next week" @click="nextWeek">
        <span class="material-symbols-rounded">chevron_right</span>
      </button>
    </div>

    <div class="schedule-grid">
      <div class="grid-header-row">
        <div class="grid-corner" />
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="grid-day-header"
          :class="{ 'is-today': day.isToday }"
        >
          <span class="day-name">{{ day.label }}</span>
          <span class="day-date">{{ day.dateLabel }}</span>
        </div>
      </div>

      <div class="grid-body-row">
        <div class="grid-hour-labels" :style="gridHourLabelsStyle">
          <div
            v-for="mark in hourMarks"
            :key="mark.label"
            class="grid-hour-label"
            :style="{ top: mark.topPct + '%' }"
          >
            {{ mark.label }}
          </div>
        </div>

        <div class="grid-body" :style="gridBodyStyle">
          <div class="grid-lines">
            <div
              v-for="mark in halfHourMarks"
              :key="mark.key"
              class="grid-line-row grid-line-row-half"
              :style="{ top: mark.topPct + '%' }"
            />
            <div
              v-for="mark in hourMarks"
              :key="mark.label"
              class="grid-line-row"
              :style="{ top: mark.topPct + '%' }"
            />
          </div>
          <div class="grid-columns">
            <div v-for="day in weekDays" :key="day.date" class="grid-line-col" :class="{ 'is-today': day.isToday }" />
          </div>

          <div
            v-if="nowLine"
            class="now-line"
            :style="{ top: nowLine.topPct + '%' }"
          >
            <span class="now-line-dot" :style="{ left: `calc(${(nowLine.dayIndex / 5) * 100}% + 6px)` }" />
          </div>

          <div
            v-for="p in positionedLessons"
            :key="p.lesson.id"
            class="lesson-card"
            :class="[
              `category-${p.category}`,
              { 'is-uncovered': p.absence && !p.absence.covered, 'is-covered': p.absence && p.absence.covered },
            ]"
            :style="p.style"
          >
            <div class="lesson-card-top">
              <div class="lesson-subject">{{ p.lesson.subject }}</div>
              <div class="lesson-time">{{ p.lesson.startTime }}–{{ p.lesson.endTime }}</div>
            </div>

            <div class="lesson-card-bottom">
              <div v-if="mode === 'teachers'" class="lesson-meta">
                <span class="material-symbols-rounded" style="font-size: 13px">school</span>
                {{ p.lesson.className }}
              </div>
              <button
                v-else
                type="button"
                class="lesson-teacher-link"
                @click="selectTeacher(p.lesson.teacherId)"
              >
                <img class="lesson-teacher-avatar" :src="avatarMap[p.lesson.teacherId]" :alt="teacherName(p.lesson.teacherId)" />
                {{ teacherName(p.lesson.teacherId) }}
              </button>

              <div v-if="p.absence && !p.absence.covered" class="lesson-absence-tag lesson-absence-danger">
                <span class="material-symbols-rounded" style="font-size: 13px">warning</span>
                Needs substitute
              </div>
              <div v-else-if="p.absence && p.absence.covered" class="lesson-absence-tag lesson-absence-covered">
                <span class="material-symbols-rounded" style="font-size: 13px">swap_horiz</span>
                Covered by {{ p.absence.substituteName }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-md);
}

.schedule-toolbar {
  display: flex;
  align-items: center;
  gap: var(--ds-space-md);
  flex-wrap: wrap;
}

.mode-tabs {
  flex: 0 0 auto;
  width: fit-content;
  min-width: max-content;
}

/* CuiTabs is built on PrimeVue's scrollable Tabs, which shows prev/next
   scroll chevrons whenever it measures its tab strip as wider than the
   space available to it — this can still fire in edge cases even with
   the min-width fix above (e.g. a narrower viewport, or a brief layout
   pass before it settles). We never want tab-scrolling here (there are
   only two short tabs), so hide the buttons outright rather than
   chasing every width edge case. */
:global(.mode-tabs [data-pc-section="prevbutton"]),
:global(.mode-tabs [data-pc-section="nextbutton"]) {
  display: none !important;
}

.entity-select {
  flex: 0 0 auto;
}

/* The CuiSelect root isn't tagged with this component's scope attribute,
   so scoped selectors never match it — target it globally instead.

   Sized to fit-content/min-width:max-content rather than a fixed px
   value: a fixed width has to guess how wide the longest name will
   render, and depending on exact font metrics some names came out a
   few pixels wider than that guess — since the label's text is
   genuinely solid-colored (not a fade/opacity effect), the box's edge
   sliced straight through the last glyph or two, which reads as
   "faded" even though it's fully opaque, just cut off mid-letter. */
:global(.entity-select) {
  width: fit-content !important;
  min-width: max-content !important;
}

:global(.entity-select .cui-select) {
  width: fit-content !important;
  min-width: max-content !important;
}

.week-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-xs);
}

.week-nav-arrow {
  width: 32px;
  height: 32px;
  border-radius: var(--ds-radius-full);
  border: 1px solid var(--cui-border-neutral-subtle);
  background: var(--cui-surface-default-white);
  color: var(--cui-text-subtitle-caption);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.week-nav-arrow:hover {
  background: var(--cui-surface-default-hover);
  color: var(--cui-text-header-body);
}

.week-nav-arrow .material-symbols-rounded {
  font-size: 20px;
}

.week-nav-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--cui-text-header-body);
  white-space: nowrap;
  min-width: 140px;
  text-align: center;
}

.schedule-grid {
  background: var(--cui-surface-default-white);
  border: 1px solid var(--cui-border-neutral-subtle);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
}

.grid-header-row {
  display: grid;
  grid-template-columns: 64px repeat(5, 1fr);
  border-bottom: 1px solid var(--cui-border-neutral-subtle);
}

.grid-corner {
  border-right: 1px solid var(--cui-border-neutral-subtle);
}

.grid-day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: var(--ds-space-sm) var(--ds-space-xs);
  border-right: 1px solid var(--cui-border-neutral-subtle);
}

.grid-day-header:last-child {
  border-right: none;
}

.grid-day-header.is-today {
  background: var(--cui-surface-info-lighter);
}

.day-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--cui-text-header-body);
}

.day-date {
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.grid-body-row {
  display: grid;
  grid-template-columns: 64px 1fr;
}

.grid-hour-labels {
  position: relative;
  border-right: 1px solid var(--cui-border-neutral-subtle);
}

.grid-hour-label {
  position: absolute;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  text-align: center;
  padding: 2px 4px;
  font-size: var(--font-size-xs);
  color: var(--cui-text-subtitle-caption);
}

.grid-body {
  position: relative;
}

.grid-lines {
  position: absolute;
  inset: 0;
}

.grid-line-row {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid var(--cui-border-neutral-subtle);
}

/* Half-hour lines use the same color at reduced opacity, rather than a
   thinner border (sub-pixel borders don't render reliably across
   browsers) — visually lighter/lower-weight than the whole-hour lines. */
.grid-line-row-half {
  opacity: 0.5;
}

.grid-columns {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.grid-line-col {
  border-right: 1px solid var(--cui-border-neutral-subtle);
}

.grid-line-col:last-child {
  border-right: none;
}

.grid-line-col.is-today {
  background: var(--cui-surface-info-lighter);
  opacity: 0.35;
}

.now-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 2px dashed var(--cui-surface-danger);
  z-index: 3;
}

.now-line-dot {
  position: absolute;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: var(--ds-radius-full);
  background: var(--cui-surface-danger);
}

.lesson-card {
  position: absolute;
  z-index: 2;
  border-radius: var(--ds-radius-xl);
  padding: var(--ds-space-sm);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid transparent;
}

/* The card's content is exactly two blocks — primary info up top,
   secondary/contextual info at the bottom — pinned apart by the card's
   own justify-content: space-between, each never shrinking below its
   own natural height. */
.lesson-card-top,
.lesson-card-bottom {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.category-stem {
  background: var(--cui-surface-info-light);
}

.category-languages {
  background: var(--cui-surface-success-light);
}

.category-humanities {
  background: var(--cui-surface-warn-light);
}

.category-arts {
  background: #ddd6fe;
}

[data-theme="dark"] .category-arts {
  background: var(--cui-brand-dark-variant);
}

.lesson-card.is-uncovered {
  background: var(--cui-surface-danger-light);
  border: 1px dashed var(--cui-text-danger-large);
}

.lesson-card.is-covered {
  background: #ccfbf1;
}

[data-theme="dark"] .lesson-card.is-covered {
  background: var(--cui-surface-success-lighter);
}

.lesson-subject {
  flex-shrink: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--cui-text-header-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-time {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: var(--font-weight-regular, 400);
  color: var(--cui-text-subtitle-caption);
}

.lesson-meta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: var(--font-weight-regular, 400);
  color: var(--cui-text-subtitle-caption);
  margin-top: auto;
}

.lesson-teacher-link {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--cui-text-link, var(--color-primary));
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  text-decoration: underline;
  margin-top: auto;
}

.lesson-teacher-avatar {
  width: 14px;
  height: 14px;
  border-radius: var(--ds-radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.lesson-absence-tag {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  margin-top: 2px;
}

.lesson-absence-danger {
  color: var(--cui-text-danger-large);
}

.lesson-absence-covered {
  color: #0d9488;
}

[data-theme="dark"] .lesson-absence-covered {
  color: var(--cui-text-success-large);
}
</style>
