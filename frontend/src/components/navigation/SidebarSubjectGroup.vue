<template>
  <div class="mb-8">
    <!-- Group Header / Card -->
    <button
      @click="toggle"
      class="w-full flex items-center py-3 px-4 rounded-xl transition-all duration-200 group text-left"
      :style="{
        background: isOpen ? 'var(--bg-elevated)' : 'transparent',
        border: 'none',
        boxShadow: 'none',
        outline: 'none',
      }"
      @mouseenter="$event.target.style.background = 'var(--bg-elevated)'"
      @mouseleave="
        $event.target.style.background = isOpen
          ? 'var(--bg-elevated)'
          : 'transparent'
      "
    >
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h4
          class="font-semibold text-sm transition-colors"
          :style="{ color: 'var(--text-primary)' }"
        >
          {{ subject }}
        </h4>
        <span
          class="text-xs font-medium"
          :style="{ color: 'var(--text-secondary)' }"
          >{{ count }} Chats</span
        >
      </div>

      <!-- Chevron -->
      <div class="pl-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-90': isOpen }"
          :style="{ color: 'var(--text-secondary)' }"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </button>

    <!-- Expanded List -->
    <div
      v-if="isOpen"
      class="mt-2 ml-2 space-y-1 overflow-hidden transition-all duration-300"
    >
      <div
        v-for="chat in chats"
        :key="chat._id"
        @click="$emit('select-session', chat._id)"
        class="group/item flex items-center justify-between py-3.5 px-4 rounded-xl cursor-pointer transition-all border border-transparent"
        :style="{
          background:
            currentSessionId === chat._id
              ? 'var(--accent-primary-alpha)'
              : 'transparent',
          borderColor:
            currentSessionId === chat._id
              ? 'var(--accent-primary-alpha)'
              : 'transparent',
        }"
        @mouseenter="
          currentSessionId !== chat._id &&
            ($event.currentTarget.style.background = 'var(--bg-elevated)')
        "
        @mouseleave="
          currentSessionId !== chat._id &&
            ($event.currentTarget.style.background = 'transparent')
        "
      >
        <div class="min-w-0 flex-1">
          <div
            class="text-sm truncate font-medium transition-colors"
            :style="{ color: 'var(--text-primary)' }"
          >
            {{ chat.title }}
          </div>
          <div
            class="text-[10px] font-medium mt-0.5"
            :style="{ color: 'var(--text-secondary)' }"
          >
            {{ chat.time }}
          </div>
        </div>

        <button
          @click.stop="$emit('delete-session', chat._id)"
          class="opacity-0 group-hover/item:opacity-100 p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-3.5 h-3.5"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  subject: String,
  count: Number,
  icon: String,
  color: String,
  chats: Array,
  currentSessionId: String,
});

const emit = defineEmits(["select-session", "delete-session"]);
const isOpen = ref(false);

const toggle = () => {
  isOpen.value = !isOpen.value;
};
</script>
