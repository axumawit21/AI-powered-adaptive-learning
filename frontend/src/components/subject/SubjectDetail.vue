<template>
  <div class="h-full flex flex-col">
    <!-- Header with back button and subject title -->
    <div
      class="backdrop-blur-sm p-4 border-b"
      :style="{
        background: 'var(--glass-bg)',
        borderColor: 'var(--border-color)',
      }"
    >
      <div class="container mx-auto flex items-center">
        <button
          @click="$emit('back')"
          class="mr-4 p-2 rounded-full hover:bg-slate-700/50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h1
          class="text-2xl font-bold"
          :style="{ color: 'var(--text-primary)' }"
        >
          {{ subject.name }}
        </h1>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden mb-56">
      <!-- Chapters Grid -->
      <div class="w-2/3 p-6 overflow-y-auto pb-32">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(chapter, index) in subject.units"
            :key="chapter.id"
            @click="selectChapter(chapter)"
            class="p-4 rounded-lg cursor-pointer transition-all border"
            :class="
              activeChapterId === chapter.id
                ? 'border-cyan-500 shadow-lg shadow-cyan-500/10'
                : ''
            "
            :style="{
              background: 'var(--bg-surface-solid)',
              borderColor:
                activeChapterId === chapter.id ? '' : 'var(--border-color)',
            }"
          >
            <div class="flex items-center">
              <div
                class="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center mr-3"
              >
                <span class="text-white font-bold">{{ index + 1 }}</span>
              </div>
              <div>
                <h3
                  class="font-medium"
                  :style="{ color: 'var(--text-primary)' }"
                >
                  {{ chapter.title }}
                </h3>
                <p class="text-sm text-cyan-500">
                  {{ chapter.subtitles.length }} sections
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subchapters Navigation -->
      <div
        class="w-1/3 border-l overflow-y-auto pb-32"
        :style="{
          borderColor: 'var(--border-color)',
          background: 'var(--glass-bg)',
        }"
      >
        <div class="p-6">
          <h2
            class="text-lg font-semibold mb-4 flex items-center"
            :style="{ color: 'var(--text-primary)' }"
          >
            <span
              >Subunits of {{ activeChapter?.title || "Selected Unit" }}</span
            >
            <!-- <button 
              v-if="activeChapterId"
              @click="startChat"
              class="ml-auto px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors"
            >
              Start Chat
            </button> -->
          </h2>

          <div v-if="activeChapter" class="space-y-2">
            <div
              v-for="subChapter in activeChapter.subtitles"
              :key="subChapter.id"
              class="pl-6 py-2 cursor-pointer rounded"
              :style="{
                color:
                  activeSubChapterId === subChapter.id
                    ? 'var(--accent-primary)'
                    : 'var(--text-secondary)',
              }"
              :class="{
                'font-medium border border-cyan-500':
                  activeSubChapterId === subChapter.id,
              }"
              @click="selectSubChapter(subChapter)"
            >
              {{ subChapter.title }}
            </div>
          </div>
          <div
            v-else
            class="text-center py-8"
            :style="{ color: 'var(--text-muted)' }"
          >
            Select a chapter to view its contents
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  subject: {
    type: Object,
    required: true,
  },
  activeUnit: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "back",
  "select-chapter",
  "select-subchapter",
  "start-chat",
]);

const activeChapterId = ref(props.activeUnit?.id || null);
const activeSubChapterId = ref(null);

watch(
  () => props.activeUnit,
  (newUnit) => {
    if (newUnit) {
      activeChapterId.value = newUnit.id;
    }
  },
  { immediate: true }
);

const activeChapter = computed(() => {
  return props.subject.units?.find((c) => c.id === activeChapterId.value);
});

function selectChapter(chapter) {
  activeChapterId.value = chapter.id;
  activeSubChapterId.value = null;
  emit("select-chapter", chapter);
}

function selectSubChapter(subChapter) {
  activeSubChapterId.value = subChapter.id;
  // Emit with 'subtitle' key to match DefaultLayout's onSubtitleSelected handler expectation
  emit("select-subchapter", {
    chapter: activeChapter.value,
    subtitle: subChapter,
  });
}

function startChat() {
  emit("start-chat", {
    chapter: activeChapter.value,
    subChapter: activeSubChapterId.value
      ? activeChapter.value.subtitles.find(
          (s) => s.id === activeSubChapterId.value
        )
      : null,
  });
}
</script>

<style scoped>
/* Smooth scrolling for the content */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #4f46e5 #1e293b;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #1e293b;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #4f46e5;
  border-radius: 4px;
}
</style>
