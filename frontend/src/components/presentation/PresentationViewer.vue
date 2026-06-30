<template>
  <div
    class="presentation-viewer border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] w-full max-w-5xl font-sans transition-colors duration-300"
    :class="[
      theme === 'dark'
        ? 'bg-slate-900 border-slate-700'
        : 'bg-[#FBF7F0] border-[#E2DCC8]',
    ]"
  >
    <!-- Header / Progress -->
    <!-- Header / Progress -->
    <div
      class="px-6 py-4 border-b flex items-center justify-between backdrop-blur-sm transition-colors duration-300"
      :class="[
        theme === 'dark'
          ? 'border-slate-700 bg-slate-800/50'
          : 'border-[#E2DCC8] bg-white/50',
      ]"
    >
      <div class="flex items-center gap-3">
        <span class="text-2xl drop-shadow-sm">📊</span>
        <div>
          <h3
            class="font-bold transition-colors duration-300"
            :class="theme === 'dark' ? 'text-white' : 'text-[#2D3436]'"
          >
            {{ presentation.unit }}
          </h3>
          <div
            class="text-xs font-medium transition-colors duration-300"
            :class="theme === 'dark' ? 'text-gray-400' : 'text-[#636E72]'"
          >
            Slide {{ currentSlideIndex + 1 }} of
            {{ presentation.slides.length }}
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          @click="prevSlide"
          :disabled="currentSlideIndex === 0"
          :class="[
            'p-2 rounded-xl border transition-all shadow-sm',
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white disabled:opacity-30'
              : 'bg-white border-[#E2DCC8] hover:bg-[#F0FDF4] hover:border-green-300 text-[#2D3436] disabled:opacity-50',
          ]"
        >
          ⬅️
        </button>
        <button
          @click="nextSlide"
          :disabled="currentSlideIndex === presentation.slides.length - 1"
          :class="[
            'p-2 rounded-xl border transition-all shadow-sm',
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white disabled:opacity-30'
              : 'bg-white border-[#E2DCC8] hover:bg-[#F0FDF4] hover:border-green-300 text-[#2D3436] disabled:opacity-50',
          ]"
        >
          ➡️
        </button>
      </div>
    </div>

    <!-- Slide Content -->
    <!-- Slide Content -->
    <div class="flex-1 relative p-8 overflow-y-auto">
      <transition name="slide-fade" mode="out-in">
        <SlideRenderers
          :key="currentSlideIndex"
          :slide="currentSlide"
          :theme="theme"
        />
      </transition>
    </div>

    <!-- Footer / Navigation Dots -->
    <div
      class="px-6 py-4 border-t flex justify-center gap-2 transition-colors duration-300"
      :class="
        theme === 'dark'
          ? 'bg-slate-900 border-slate-700'
          : 'bg-[#FBF7F0] border-[#E2DCC8]'
      "
    >
      <div
        v-for="(_, index) in presentation.slides"
        :key="index"
        @click="currentSlideIndex = index"
        :class="[
          'h-2 rounded-full cursor-pointer transition-all duration-300',
          currentSlideIndex === index
            ? theme === 'dark'
              ? 'bg-cyan-500 w-8'
              : 'bg-[#00B894] w-8'
            : theme === 'dark'
            ? 'bg-gray-700 w-2 hover:bg-gray-600'
            : 'bg-[#DFE6E9] w-2 hover:bg-[#B2BEC3]',
        ]"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useTheme } from "../../composables/useTheme";
import SlideRenderers from "./SlideRenderers.vue";

const { theme } = useTheme();

const props = defineProps({
  presentation: {
    type: Object,
    required: true,
  },
});

const currentSlideIndex = ref(0);

const currentSlide = computed(() => {
  return props.presentation.slides[currentSlideIndex.value];
});

function nextSlide() {
  if (currentSlideIndex.value < props.presentation.slides.length - 1) {
    currentSlideIndex.value++;
  }
}

function prevSlide() {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--;
  }
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
