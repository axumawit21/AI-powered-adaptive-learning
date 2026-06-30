<template>
  <div class="bg-slate-750 rounded-lg p-3 border border-slate-600 mb-3">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Sub-unit #</label>
        <input
          v-model="sub.subunitNumber"
          class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
          placeholder="1.1"
        />
      </div>
      <div class="md:col-span-2">
        <label class="block text-xs text-slate-400 mb-1">Title</label>
        <input
          v-model="sub.title"
          class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
          placeholder="e.g., Cell Structure"
        />
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Page Start</label>
        <input
          v-model.number="sub.pageStart"
          type="number"
          min="1"
          class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
          placeholder="1"
        />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block text-xs text-slate-400 mb-1">Page End</label>
          <input
            v-model.number="sub.pageEnd"
            type="number"
            min="1"
            class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
            placeholder="5"
          />
        </div>
        <button
          @click="$emit('remove')"
          class="text-red-400 hover:text-red-300 mt-5"
          title="Remove sub-chapter"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Generation Actions Row -->
    <div class="flex items-center gap-3 mt-3 pt-3 border-t border-slate-600">
      <button
        @click="$emit('generate-summary', sub)"
        :disabled="generatingSummary"
        class="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1"
      >
        <span v-if="generatingSummary">⏳ Generating...</span>
        <span v-else>✨ Generate Summary</span>
      </button>
    </div>

    <!-- Recursive Children -->
    <div class="ml-4 mt-3 border-l-2 border-slate-600 pl-4">
      <div v-for="(child, index) in sub.subChapters" :key="index">
        <SubUnitItem
          :sub="child"
          :generatingSummary="generatingSummaryMap?.[child.subunitNumber]"
          :generatingQuiz="generatingQuizMap?.[child.subunitNumber]"
          @remove="removeChild(index)"
          @generate-summary="(s) => $emit('generate-summary', s)"
          @generate-quiz="(s) => $emit('generate-quiz', s)"
        />
      </div>

      <button
        @click="addChild"
        class="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 mt-2"
      >
        <span>+</span> Add Nested Sub-unit ({{ sub.subunitNumber }}.x)
      </button>
    </div>
  </div>
</template>

<script setup>
// defineProps/Emits are compiler macros

const props = defineProps({
  sub: {
    type: Object,
    required: true,
  },
  generatingSummary: {
    type: Boolean,
    default: false,
  },
  generatingQuiz: {
    type: Boolean,
    default: false,
  },
  generatingSummaryMap: {
    type: Object,
    default: () => ({}),
  },
  generatingQuizMap: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["remove", "generate-summary", "generate-quiz"]);

function removeChild(index) {
  props.sub.subChapters.splice(index, 1);
}

function addChild() {
  if (!props.sub.subChapters) {
    props.sub.subChapters = [];
  }

  const nextNum = props.sub.subChapters.length + 1;
  props.sub.subChapters.push({
    subunitNumber: `${props.sub.subunitNumber}.${nextNum}`,
    title: "",
    pageStart: null,
    pageEnd: null,
    subChapters: [],
  });
}
</script>

<style scoped>
.bg-slate-750 {
  background-color: rgb(40, 45, 60);
}
</style>
