<template>
  <div class="recursive-subunit">
    <div
      class="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors"
      :class="[
        isActive
          ? 'bg-indigo-500/20 text-indigo-300'
          : 'hover:bg-slate-700/50 text-slate-300 hover:text-white',
      ]"
      @click.stop="handleClick"
    >
      <span class="text-sm truncate">{{ sub.title }}</span>

      <!-- Expand/Collapse Chevron -->
      <button
        v-if="hasChildren"
        @click.stop="toggleExpand"
        class="p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded }"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <!-- Recursive Children -->
    <transition name="slide-down">
      <div
        v-if="isExpanded && hasChildren"
        class="ml-3 pl-3 border-l border-slate-700 space-y-1 mt-1"
      >
        <RecursiveSubunitItem
          v-for="child in sub.subChapters"
          :key="child.id || child.subunitNumber"
          :sub="child"
          :active-subunit="activeSubunit"
          @select="$emit('select', $event)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  sub: {
    type: Object,
    required: true,
  },
  activeSubunit: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["select"]);

const isExpanded = ref(false);

const hasChildren = computed(
  () => props.sub.subChapters && props.sub.subChapters.length > 0
);

const isActive = computed(() => {
  // Compare IDs or subunitNumbers to determine active state
  if (!props.activeSubunit) return false;
  return (
    props.activeSubunit.id === props.sub.id ||
    props.activeSubunit.subunitNumber === props.sub.subunitNumber
  );
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function handleClick() {
  // If it has children, just toggle expand (optional UI choice, but user asked for "expand on click")
  // User request: "if the subunit have nested appear it after clicking the subunit"
  // So clicking should primarily toggle. But if it's a leaf node, it should select content.
  // Actually, usually headers can also be content.
  // Let's support both: Clicking selects it AND toggles if children exist.

  emit("select", props.sub);
  if (hasChildren.value) {
    toggleExpand();
  }
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
  max-height: 500px;
  overflow: hidden;
  opacity: 1;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
