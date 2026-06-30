<template>
  <transition name="slide-up">
    <div v-if="subject && subject.units?.length" class="absolute bottom-0 w-full p-4 bg-slate-900/80 backdrop-blur-md flex gap-4 overflow-x-auto">
      <div
        v-for="unit in subject.units"
        :key="unit.id"
        class="shrink-0 bg-slate-800/70 text-white px-4 py-3 rounded-xl cursor-pointer shadow-md hover:scale-105 transition"
        @click="selectUnit(unit)"
      >
        {{ unit.title }}
      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  subject: Object
})

const emit = defineEmits(['unit-selected'])

function selectUnit(unit) {
  // emit the full subject + unit so parent can set activeUnit & start chat
  emit('unit-selected', { subject: props.subject, unit })
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.35s ease;
}
.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-enter-to {
  transform: translateY(0%);
  opacity: 1;
}
.slide-up-leave-from {
  transform: translateY(0%);
  opacity: 1;
}
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
