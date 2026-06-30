<template>
  <div class="w-full h-full flex flex-col">
    <!-- STANDARD LAYOUT -->
    <div
      v-if="layout === 'standard'"
      class="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full animate-in fade-in duration-500"
    >
      <h2
        class="text-4xl font-bold mb-8 font-display tracking-tight transition-colors duration-300"
        :class="theme === 'dark' ? 'text-white' : 'text-[#2D3436]'"
      >
        {{ slide.title }}
      </h2>
      <ul class="space-y-4">
        <li
          v-for="(point, idx) in slide.bulletPoints"
          :key="idx"
          class="flex items-start gap-4 text-xl leading-relaxed transition-colors duration-300"
          :class="theme === 'dark' ? 'text-gray-300' : 'text-[#636E72]'"
        >
          <span
            class="mt-1.5 text-2xl"
            :class="theme === 'dark' ? 'text-cyan-400' : 'text-[#00B894]'"
            >•</span
          >
          <span>{{ point }}</span>
        </li>
      </ul>
    </div>

    <!-- DASHBOARD LAYOUT -->
    <div
      v-else-if="layout === 'dashboard'"
      class="flex-1 grid grid-cols-12 gap-6 p-4 animate-in zoom-in duration-500"
    >
      <div class="col-span-12 mb-4 text-center">
        <h2
          class="text-3xl font-bold font-display transition-colors duration-300"
          :class="theme === 'dark' ? 'text-white' : 'text-[#2D3436]'"
        >
          {{ slide.title }}
        </h2>
      </div>

      <!-- Key Concept Card -->
      <div
        class="col-span-7 rounded-3xl p-6 shadow-sm border flex flex-col transition-colors duration-300"
        :class="
          theme === 'dark'
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-slate-100'
        "
      >
        <h3
          class="font-bold text-sm uppercase tracking-wider mb-3 transition-colors duration-300"
          :class="theme === 'dark' ? 'text-cyan-400' : 'text-[#6C5CE7]'"
        >
          Key Concepts
        </h3>
        <p
          class="text-lg leading-relaxed transition-colors duration-300"
          :class="theme === 'dark' ? 'text-gray-200' : 'text-[#2D3436]'"
          v-if="slide.content?.keyConcept"
        >
          {{ slide.content.keyConcept }}
        </p>
        <ul
          class="mt-4 space-y-2"
          v-if="slide.bulletPoints && slide.bulletPoints.length"
        >
          <li
            v-for="p in slide.bulletPoints.slice(0, 3)"
            :key="p"
            class="flex gap-2"
            :class="theme === 'dark' ? 'text-gray-400' : 'text-slate-600'"
          >
            <span :class="theme === 'dark' ? 'text-cyan-400' : 'text-[#6C5CE7]'"
              >•</span
            >
            {{ p }}
          </li>
        </ul>
      </div>

      <!-- Formula / Highlight Card -->
      <div class="col-span-5 flex flex-col gap-6">
        <div
          v-if="slide.content?.formula"
          class="rounded-3xl p-6 border flex-1 flex flex-col justify-center items-center relative overflow-hidden transition-colors duration-300"
          :class="
            theme === 'dark'
              ? 'bg-green-900/20 border-green-800'
              : 'bg-[#F0FDF4] border-[#BBF7D0]'
          "
        >
          <div
            class="absolute top-0 right-0 p-4 opacity-10 text-6xl text-green-500"
          >
            ∑
          </div>
          <h4 class="text-green-600 font-bold mb-2">Formula</h4>
          <div
            class="text-2xl font-mono font-bold text-center"
            :class="theme === 'dark' ? 'text-green-300' : 'text-[#2D3436]'"
          >
            {{ slide.content.formula }}
          </div>
        </div>

        <div
          v-if="slide.content?.chartData"
          class="rounded-3xl p-6 border flex-1 relative transition-colors duration-300"
          :class="
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-100'
          "
        >
          <h4
            class="text-xs uppercase font-bold mb-4"
            :class="theme === 'dark' ? 'text-gray-500' : 'text-slate-400'"
          >
            Data Visual
          </h4>
          <div class="flex items-end justify-around h-32 gap-2">
            <div
              v-for="bar in slide.content.chartData"
              :key="bar.label"
              class="flex flex-col items-center gap-2 group flex-1"
            >
              <div
                class="w-full rounded-t-lg transition-all group-hover:opacity-80"
                :class="
                  theme === 'dark'
                    ? 'bg-cyan-600'
                    : 'bg-[#FAB1A0] group-hover:bg-[#E17055]'
                "
                :style="{ height: `${Math.min(bar.value, 100)}%` }"
              ></div>
              <span
                class="text-xs font-medium"
                :class="theme === 'dark' ? 'text-gray-500' : 'text-slate-500'"
                >{{ bar.label }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- COMPARISON LAYOUT -->
    <div
      v-else-if="layout === 'comparison'"
      class="flex-1 flex flex-col p-4 animate-in slide-in-from-bottom duration-500"
    >
      <h2
        class="text-3xl font-bold font-display text-center mb-10 transition-colors duration-300"
        :class="theme === 'dark' ? 'text-white' : 'text-[#2D3436]'"
      >
        {{ slide.title }}
      </h2>

      <div class="grid grid-cols-2 gap-8 h-full">
        <!-- Left Side -->
        <div
          class="rounded-3xl p-6 shadow-sm border-t-4 relative transition-colors duration-300"
          :class="
            theme === 'dark'
              ? 'bg-slate-800 border-[#00B894] shadow-none'
              : 'bg-white border-[#00B894]'
          "
        >
          <h3 class="text-xl font-bold text-[#00B894] mb-6 text-center">
            {{ slide.content?.leftTitle || "Option A" }}
          </h3>
          <ul class="space-y-4">
            <li
              v-for="(item, i) in slide.content?.comparisonItems"
              :key="i"
              class="flex justify-between items-center py-2 border-b border-dashed last:border-0"
              :class="theme === 'dark' ? 'border-gray-700' : 'border-slate-100'"
            >
              <span
                class="text-xs font-bold w-1/3"
                :class="theme === 'dark' ? 'text-gray-500' : 'text-slate-400'"
                >{{ item.feature }}</span
              >
              <span
                class="text-sm w-2/3 text-right"
                :class="theme === 'dark' ? 'text-gray-300' : 'text-[#2D3436]'"
                >{{ item.left }}</span
              >
            </li>
          </ul>
        </div>

        <!-- Right Side -->
        <div
          class="rounded-3xl p-6 shadow-sm border-t-4 transition-colors duration-300"
          :class="
            theme === 'dark'
              ? 'bg-slate-800 border-[#FF7675] shadow-none'
              : 'bg-white border-[#FF7675]'
          "
        >
          <h3 class="text-xl font-bold text-[#FF7675] mb-6 text-center">
            {{ slide.content?.rightTitle || "Option B" }}
          </h3>
          <ul class="space-y-4">
            <li
              v-for="(item, i) in slide.content?.comparisonItems"
              :key="i"
              class="flex justify-between items-center py-2 border-b border-dashed last:border-0"
              :class="theme === 'dark' ? 'border-gray-700' : 'border-slate-100'"
            >
              <span
                class="text-xs font-bold w-1/3 text-left"
                :class="theme === 'dark' ? 'text-gray-500' : 'text-slate-400'"
                >{{ item.feature }}</span
              >
              <span
                class="text-sm w-2/3 text-right"
                :class="theme === 'dark' ? 'text-gray-300' : 'text-[#2D3436]'"
                >{{ item.right }}</span
              >
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- GRID LAYOUT -->
    <div
      v-else-if="layout === 'grid'"
      class="flex-1 flex flex-col p-4 animate-in fade-in duration-500"
    >
      <h2
        class="text-3xl font-bold font-display text-center mb-8 transition-colors duration-300"
        :class="theme === 'dark' ? 'text-white' : 'text-[#2D3436]'"
      >
        {{ slide.title }}
      </h2>

      <div class="grid grid-cols-2 gap-6 h-full">
        <div
          v-for="(item, i) in slide.content?.gridItems || slide.bulletPoints"
          :key="i"
          class="p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all flex flex-col items-start gap-3"
          :class="
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              : 'bg-white border-slate-100'
          "
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-300"
            :class="
              theme === 'dark'
                ? 'bg-orange-900/40 text-orange-400'
                : 'bg-[#FFF4E6] text-[#FD9644]'
            "
          >
            {{ i + 1 }}
          </div>
          <div>
            <h4
              class="font-bold text-lg mb-1 transition-colors duration-300"
              :class="theme === 'dark' ? 'text-gray-200' : 'text-[#2D3436]'"
            >
              {{ item.title || item }}
            </h4>
            <p
              class="text-sm leading-relaxed transition-colors duration-300"
              :class="theme === 'dark' ? 'text-gray-400' : 'text-[#636E72]'"
              v-if="item.description"
            >
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- FALLBACK -->
    <div v-else class="text-center text-red-500">Unknown Layout</div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  slide: { type: Object, required: true },
  theme: { type: String, default: "light" },
});

const layout = computed(() => props.slide.layout || "standard");
</script>

<style scoped>
.font-display {
  font-family: "Outfit", "Inter", sans-serif; /* Setup fallback to Inter */
}
</style>
