<template>
  <div
    :class="[
      'absolute flex flex-col items-center justify-center cursor-pointer transition-all duration-300',
      active ? 'scale-110 z-30' : 'opacity-70 hover:opacity-100',
      textClass,
    ]"
    :style="style"
    @click="clickPlanet"
    @dblclick="clickPlanet(autoSelectUnit)"
  >
    <div
      :class="[
        'w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center text-center px-2 shadow-lg transition-all duration-300',
        gradientClass,
        active
          ? 'scale-110 shadow-[0_0_40px_rgba(56,189,248,0.6)]'
          : 'hover:scale-110 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:brightness-110 hover:-rotate-3',
        textClass,
      ]"
    >
      <span class="font-bold leading-tight text-xs sm:text-sm md:text-base">{{
        subject.name
      }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  subject: {
    type: Object,
    required: true,
    default: () => ({
      name: "Subject",
      colorClass: "from-gray-500 to-gray-600",
      textClass: "text-white",
    }),
  },
  // x and y are typically 0 in current usage (positioned by parent style)
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const gradientClass = computed(() => props.subject.colorClass || "bg-gray-600");

const textClass = computed(() => props.subject.textClass || "text-white");

// Wrapper style only handles positioning if props are passed (which they aren't usually)
const style = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
  position: "absolute",
}));

function clickPlanet(autoSelectUnit) {
  emit("select", props.subject, autoSelectUnit);
}
</script>

<style scoped>
/* No scoped styles needed, utilizing Tailwind */
</style>
