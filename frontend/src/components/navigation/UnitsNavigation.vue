<template>
  <transition name="slide-right">
    <div
      v-if="subject && subject.units?.length"
      class="min-w-88 h-full grow-0 bg-linear-to-b from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-l-xl p-6 overflow-y-auto shadow-2xl border-l-2 border-indigo-500/30"
    >
      <div class="flex items-center justify-between mb-6">
        <h3
          class="text-xl font-bold bg-linear-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent"
        >
          Units of {{ subject.name || subject.title }}
        </h3>
        <div
          class="w-10 h-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"
        ></div>
      </div>

      <div class="space-y-3">
        <div
          v-for="(unit, index) in subject.units"
          :key="unit.id"
          class="flex flex-col gap-2"
        >
          <!-- Unit Header -->
          <div
            class="group relative bg-slate-800/60 text-white px-5 py-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-slate-700/80 hover:shadow-lg hover:shadow-indigo-500/20 border border-slate-700/50 hover:border-indigo-400/30"
            :class="{
              'border-indigo-500/50 bg-slate-700/80':
                activeUnit && activeUnit.id === unit.id,
            }"
            @click="selectUnit(unit)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div
                  class="w-8 h-8 flex items-center justify-center bg-indigo-500/20 rounded-lg mr-3 group-hover:bg-indigo-500/30 transition-colors"
                >
                  <span class="text-indigo-300 font-medium">{{
                    index + 1
                  }}</span>
                </div>
                <span
                  class="font-medium text-slate-200 group-hover:text-white"
                  >{{ unit.title }}</span
                >
              </div>
              <!-- Arrow Icon -->
              <svg
                v-if="unit.subtitles && unit.subtitles.length"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-indigo-300 transition-transform duration-300"
                :class="{
                  'rotate-90': activeUnit && activeUnit.id === unit.id,
                }"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <!-- Sub-units (Accordion Body) -->
          <div
            v-if="
              activeUnit &&
              activeUnit.id === unit.id &&
              unit.subtitles &&
              unit.subtitles.length
            "
            class="ml-4 pl-4 border-l-2 border-slate-700 space-y-2"
          >
            <RecursiveSubunitItem
              v-for="sub in unit.subtitles"
              :key="sub.id || sub.subunitNumber"
              :sub="sub"
              :active-subunit="activeSubunit"
              @select="(s) => selectSubUnit(unit, s)"
            />
          </div>
        </div>
      </div>

      <!-- Read Book Button at Bottom -->
      <button
        @click="$emit('read-book')"
        class="w-full mt-4 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
          />
          <path d="M8 7h6" />
          <path d="M8 11h8" />
        </svg>
        Read Book
      </button>
    </div>
  </transition>
</template>

<script setup>
import RecursiveSubunitItem from "./RecursiveSubunitItem.vue";

const props = defineProps({
  subject: Object,
  activeUnit: Object,
  activeSubunit: Object, // Added to track active subunit deep in the tree
});

const emit = defineEmits(["unit-selected", "subunit-selected", "read-book"]);

function selectUnit(unit) {
  emit("unit-selected", { subject: props.subject, unit });
}

function selectSubUnit(unit, sub) {
  // Enrich the subtitle with subunit identification info for useChatLogic
  const enrichedSub = {
    ...sub,
    subunitNumber:
      sub.subunitNumber || sub.id || `${unit.unitNumber}.${sub.index || 1}`,
    parentUnitTitle: unit.title,
    parentUnitNumber: unit.unitNumber,
  };
  emit("subunit-selected", {
    subject: props.subject,
    unit,
    subtitle: enrichedSub,
  });
}
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from {
  transform: translateX(100%) translateY(-50%);
  opacity: 0;
}
.slide-right-enter-to {
  transform: translateX(0) translateY(-50%);
  opacity: 1;
}
.slide-right-leave-from {
  transform: translateX(0) translateY(-50%);
  opacity: 1;
}
.slide-right-leave-to {
  transform: translateX(100%) translateY(-50%);
  opacity: 0;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin: 10px 0;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #818cf8, #a78bfa);
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #6366f1, #8b5cf6);
}

/* Fade effect at top and bottom */
div[class*="absolute"] {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  padding: 2rem 0;
}
</style>
