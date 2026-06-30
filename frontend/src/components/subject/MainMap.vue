<template>
  <div class="relative" :style="{ width: '100%', height: '100%' }">
    <!-- Background -->
    <div
      :style="currentBgStyle"
      class="absolute inset-0 transition-opacity duration-500 pointer-events-none"
    ></div>

    <!-- Particles -->
    <ParticlesBackground :variant="particleVariant" />

    <div class="relative w-full h-full flex items-center justify-center">
      <div class="w-full h-full">
        <!-- Subject planets and AI orb - hidden when chat is active -->
        <UniverseOrbit
          v-if="!inChat && !props.inAIChat"
          :subjects="visibleSubjects.length ? visibleSubjects : allSubjects"
          :activeSubject="selected"
          :inAIChat="props.inAIChat"
          :radius="radius"
          @planet-clicked="onSelectSubject"
          @lumi-clicked="startLumiChat"
        />

        <!-- Chat interface removed (handled by BottomComposer) -->
      </div>
      <!-- <pre>{{ { mapW, mapH } }}</pre> -->
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, nextTick } from "vue";
import UniverseOrbit from "./UniverseOrbit.vue";
import Planet from "./Planet.vue";
import ParticlesBackground from "../ui/ParticlesBackground.vue";
import axios from "axios";

import { useVModel } from "@vueuse/core";

const props = defineProps({
  bookId: String,
  subjects: { type: Array, default: () => [] },
  selectedSubject: { type: Object, default: null },
  activeMode: String,
  inAIChat: { type: Boolean, default: false },
  inChat: { type: Boolean, default: false },
  chatMessages: { type: Array, default: () => [] },
  width: { type: Number, default: 700 },
  height: { type: Number, default: 400 },
});

const emit = defineEmits([
  "subject-selected",
  "unit-selected",
  "subtitle-selected",
  "update:inChat",
]);

const centerX = computed(() => props.width / 2);
const centerY = computed(() => props.height / 2);
const radius = computed(() =>
  Math.max(300, Math.min(props.width, props.height) * 0.42)
);

const particleVariant = computed(() => {
  if (!props.selectedSubject) return "default";

  const title = (
    props.selectedSubject.name ||
    props.selectedSubject.title ||
    ""
  ).toLowerCase();

  // Strict matching for common subjects
  if (title.includes("math")) return "math";
  if (title.includes("physics")) return "physics";
  if (title.includes("chemistry")) return "chemistry";
  if (title.includes("biology") || title.includes("life")) return "biology";
  if (title.includes("geography") || title.includes("earth"))
    return "geography";
  if (title.includes("history")) return "history";
  if (
    title.includes("english") ||
    title.includes("literature") ||
    title.includes("language")
  )
    return "english";

  return "default";
});

/* --- Reactive state --- */
const allSubjects = ref(props.subjects || []);
const visibleSubjects = ref(allSubjects.value.slice(0, 6));
const positions = ref([]);

const selected = ref(null);
const selectedGrade = ref("Grade 10"); // default grade
const inUnitView = ref(false);
const inSubtitleView = ref(false);
const inChat = useVModel(props, "inChat", emit);
watch(
  () => props.inAIChat,
  (val) => {
    if (val) inChat.value = true;
  }
);
const orbitUnits = ref([]);
const orbitSubtitles = ref([]);
const activeUnit = ref(null);
const activeSubtitle = ref(null);

/* --- Compute positions --- */
function computePositions() {
  const n = visibleSubjects.value.length || 1;
  positions.value = visibleSubjects.value.map((s, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle) - 40;
    const y = centerY + radius * Math.sin(angle) - 40;
    return { x, y, angle };
  });
}

onMounted(() => computePositions());
watch(
  () => visibleSubjects.value,
  () => computePositions()
);
watch(
  () => props.subjects,
  (v) => {
    allSubjects.value = v || [];
    visibleSubjects.value = allSubjects.value.slice(0, 6);
    computePositions();
  },
  { immediate: true }
);

watch(
  () => props.selectedSubject,
  (s) => {
    if (!s) {
      resetViews();
      return;
    }

    // If we're already in AI chat mode or chat is active, don't reset it
    // This preserves chat state when loading from history
    if (props.inAIChat || inChat.value) {
      selected.value = s;
      // Don't change unit/chat states, just update the subject context
      return;
    }

    // Normal subject selection flow
    selected.value = s;
    orbitUnits.value = s.units || [];
    inUnitView.value = orbitUnits.value.length > 0;
    inSubtitleView.value = false;
    inChat.value = false;
    activeUnit.value = null;
    activeSubtitle.value = null;
  },
  { immediate: true }
);

/* --- Methods --- */
function resetViews() {
  selected.value = null;
  visibleSubjects.value = [];
  inUnitView.value = false;
  inSubtitleView.value = false;
  inChat.value = false;
  orbitUnits.value = [];
  orbitSubtitles.value = [];
  activeUnit.value = null;
  activeSubtitle.value = null;
}

function onSelectSubject(s) {
  selected.value = s;
  orbitUnits.value = s.units || [];
  inUnitView.value = orbitUnits.value.length > 0;
  inSubtitleView.value = false;
  inChat.value = false;
  activeUnit.value = null;
  activeSubtitle.value = null;
  emit("subject-selected", s);
}

function startLumiChat() {
  selected.value = { name: "Lumi AI", grade: null };
  orbitUnits.value = [];
  orbitSubtitles.value = [];
  inUnitView.value = false;
  inSubtitleView.value = false;
  inChat.value = true;
  activeUnit.value = null;
  activeSubtitle.value = null;
}

function unitStyle(idx) {
  const n =
    (inUnitView.value
      ? orbitUnits.value.length
      : orbitSubtitles.value.length) || 1;
  const r = 110;
  const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
  const x = centerX + r * Math.cos(angle) - 60;
  const y = centerY + r * Math.sin(angle) - 20;
  return { left: `${x}px`, top: `${y}px`, position: "absolute" };
}

function selectUnit(u) {
  activeUnit.value = u;
  inUnitView.value = false;
  inSubtitleView.value = true;
  orbitSubtitles.value = u.subtitles || [];
  emit("unit-selected", { subject: selected.value, unit: u });
}

function selectSubtitle(sub) {
  activeSubtitle.value = sub;
  inSubtitleView.value = false;
  orbitUnits.value = [];
  inChat.value = true;

  emit("subtitle-selected", {
    subject: selected.value,
    unit: activeUnit.value,
    subtitle: sub,
  });
}

const currentBgStyle = computed(() => {
  // Always return transparent to preserve the global space background
  return {
    background: "transparent",
    opacity: 0,
  };
});
</script>

<style scoped>
.unit-enter-from,
.unit-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.unit-enter-active,
.unit-leave-active {
  transition: all 0.35s cubic-bezier(0.2, 0.9, 0.2, 1);
}
</style>
