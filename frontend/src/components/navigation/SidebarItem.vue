<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    class="relative w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden"
    :class="[active ? '' : 'hover:bg-white/5']"
    :style="
      active
        ? {
            backgroundColor: 'rgba(34, 211, 238, 0.1)', // Light Cyan fixed
            borderColor: 'rgba(34, 211, 238, 0.3)',
          }
        : { border: '1px solid transparent' }
    "
    @click="$emit('click')"
  >
    <!-- Active State: Gradient Splash -->
    <div
      v-if="active"
      class="absolute inset-0 opacity-5 pointer-events-none transition-opacity duration-300"
      :style="{ background: `linear-gradient(90deg, ${color}, transparent)` }"
    ></div>

    <!-- Active State: Left Accent Bar -->
    <div
      class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-lg transition-all duration-300"
      :class="active ? 'opacity-100' : 'opacity-0'"
      :style="{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }"
    ></div>

    <!-- Icon Container -->
    <div
      class="relative z-10 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300"
      :style="{
        color: active ? color : 'var(--text-secondary)',
        backgroundColor: active ? `${color}20` : 'rgba(255,255,255,0.05)',
        boxShadow: active ? `0 0 15px ${color}40` : '',
      }"
    >
      <span
        v-if="!isSvg"
        class="text-lg group-hover:scale-110 transition-transform duration-300"
        >{{ icon }}</span
      >
      <div
        v-else
        v-html="icon"
        class="w-5 h-5 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center"
      ></div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 z-10 flex flex-col justify-center">
      <span
        class="font-medium text-sm tracking-wide transition-colors duration-300"
        :class="active ? 'font-bold' : ''"
        :style="{
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        }"
      >
        {{ title }}
      </span>
    </div>

    <!-- Hover Glow (Subtle) -->
    <div
      class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
      :style="{ boxShadow: `inset 0 0 20px rgba(255,255,255,0.03)` }"
    ></div>
  </component>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: String,
  icon: String,
  active: Boolean,
  to: String,
  color: {
    type: String,
    default: "#38bdf8",
  },
});

const isSvg = computed(() => props.icon && props.icon.includes("<svg"));

defineEmits(["click"]);
</script>
