<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger Badge -->
    <button
      @click="toggleDropdown"
      :disabled="disabled"
      class="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 group"
      :class="[
        isOpen
          ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/30',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
    >
      <!-- Icon -->
      <div
        class="w-5 h-5 rounded-md bg-linear-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
          />
        </svg>
      </div>

      <!-- Current Context Text -->
      <div class="flex flex-col items-start text-left">
        <span
          class="text-[10px] uppercase tracking-wider text-slate-400 font-medium"
          >Studying</span
        >
        <span class="text-sm font-semibold text-white truncate max-w-[180px]">
          {{ displayText }}
        </span>
      </div>

      <!-- Chevron -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-slate-400 group-hover:text-cyan-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl border shadow-2xl z-50 backdrop-blur-xl"
        :class="dropUp ? 'bottom-full mb-2' : 'top-full'"
        :style="{
          background: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
        }"
      >
        <!-- Header -->
        <div
          class="sticky top-0 px-4 py-3 border-b border-white/10 bg-slate-900/90 backdrop-blur-sm"
        >
          <div class="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Switch Context
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">
            Select a different unit or subunit
          </div>
        </div>

        <!-- Units List -->
        <div class="p-2">
          <template v-for="unit in units" :key="unit.id || unit.unitNumber">
            <!-- Unit Header -->
            <button
              @click="selectUnit(unit)"
              class="w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 group/unit"
              :class="[
                isSelectedUnit(unit) && !selectedSubunit
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-white hover:bg-white/5',
              ]"
            >
              <div
                class="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 group-hover/unit:bg-cyan-600 group-hover/unit:text-white transition-colors"
              >
                {{ unit.unitNumber || "•" }}
              </div>
              <span class="font-medium text-sm truncate flex-1">{{
                unit.title
              }}</span>
              <svg
                v-if="hasSubunits(unit)"
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-slate-500"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            <!-- Subunits (Expandable) -->
            <div
              v-if="hasSubunits(unit)"
              class="ml-4 mt-1 mb-2 space-y-0.5 border-l-2 border-slate-700/50 pl-2"
            >
              <button
                v-for="sub in getSubunits(unit)"
                :key="sub.id"
                @click="selectSubunit(unit, sub)"
                class="w-full text-left px-3 py-1.5 rounded-lg transition-all text-sm"
                :class="[
                  isSelectedSubunit(sub)
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                ]"
              >
                <span class="truncate block">{{ sub.title }}</span>
              </button>
            </div>
          </template>

          <!-- Empty State -->
          <div
            v-if="!units || units.length === 0"
            class="text-center py-6 text-slate-500"
          >
            <div class="text-2xl mb-2">📚</div>
            <div class="text-xs">No units available</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps({
  units: { type: Array, default: () => [] },
  selectedUnit: { type: Object, default: null },
  selectedSubunit: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
  dropUp: { type: Boolean, default: false },
});

const emit = defineEmits(["context-change"]);

const isOpen = ref(false);
const containerRef = ref(null);

const displayText = computed(() => {
  if (props.selectedSubunit) {
    return props.selectedSubunit.title || "Subunit";
  }
  if (props.selectedUnit) {
    return props.selectedUnit.title || "Unit";
  }
  return "Select a topic";
});

function toggleDropdown() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
}

function hasSubunits(unit) {
  const subs = unit.subtitles || unit.subunits || [];
  return subs.length > 0;
}

function getSubunits(unit) {
  return unit.subtitles || unit.subunits || [];
}

function isSelectedUnit(unit) {
  if (!props.selectedUnit) return false;
  return (
    props.selectedUnit.id === unit.id ||
    props.selectedUnit.unitNumber === unit.unitNumber
  );
}

function isSelectedSubunit(sub) {
  if (!props.selectedSubunit) return false;
  return props.selectedSubunit.id === sub.id;
}

function selectUnit(unit) {
  emit("context-change", { unit, subunit: null });
  isOpen.value = false;
}

function selectSubunit(unit, subunit) {
  emit("context-change", { unit, subunit });
  isOpen.value = false;
}

// Click outside to close
function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

// Escape key to close
function handleKeydown(event) {
  if (event.key === "Escape") {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
/* Custom scrollbar for dropdown */
div::-webkit-scrollbar {
  width: 6px;
}

div::-webkit-scrollbar-track {
  background: transparent;
}

div::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

div::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.8);
}
</style>
