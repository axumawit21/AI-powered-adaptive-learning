<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div
      class="bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-700"
    >
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">Settings</h2>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4">
        <!-- Account Section -->
        <div>
          <h3
            class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
          >
            Account
          </h3>
          <div class="space-y-2">
            <router-link
              to="/change-password"
              class="flex items-center justify-between w-full p-3 bg-slate-900/50 rounded-xl hover:bg-slate-700 transition-colors group"
              @click="$emit('close')"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl group-hover:scale-110 transition-transform"
                  >🔐</span
                >
                <span class="text-slate-200 group-hover:text-white font-medium"
                  >Change Password</span
                >
              </div>
              <span class="text-slate-500 group-hover:text-white">→</span>
            </router-link>
          </div>
        </div>

        <!-- Preferences Section (Placeholder) -->
        <div>
          <h3
            class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-4"
          >
            Preferences
          </h3>
          <div class="text-slate-500 text-sm italic p-2">
            More settings coming soon...
          </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(["close"]);
</script>
