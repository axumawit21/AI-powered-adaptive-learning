<template>
  <!-- Backdrop -->
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  >
    <!-- Modal -->
    <div
      class="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-700 overflow-hidden"
    >
      <!-- Header -->
      <div
        class="bg-linear-to-r from-amber-500/20 to-orange-500/20 px-6 py-4 border-b border-slate-700"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Get Your Free AI Key</h3>
            <p class="text-sm text-slate-400">Unlock unlimited AI features</p>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-4">
        <!-- Info message -->
        <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p class="text-sm text-amber-200">
            ⚠️
            {{
              message ||
              "AI quota exceeded. Get your own free API key to continue using AI features!"
            }}
          </p>
        </div>

        <!-- Steps -->
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span
              class="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold"
              >1</span
            >
            <div>
              <p class="text-sm text-slate-300">
                Click the button below to go to
                <strong class="text-emerald-400">Google AI Studio</strong>
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open Google AI Studio
              </a>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <span
              class="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold"
              >2</span
            >
            <p class="text-sm text-slate-300">
              Sign in with your Google account and click
              <strong class="text-emerald-400">"Create API Key"</strong>
            </p>
          </div>

          <div class="flex items-start gap-3">
            <span
              class="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold"
              >3</span
            >
            <p class="text-sm text-slate-300">
              Copy the key and paste it below
            </p>
          </div>
        </div>

        <!-- Input -->
        <div>
          <input
            v-model="apiKey"
            type="text"
            placeholder="Paste your API key here (starts with AIza...)"
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <!-- Error -->
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
        <!-- Success -->
        <p v-if="success" class="text-emerald-400 text-sm">✅ {{ success }}</p>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex gap-3"
      >
        <button
          @click="$emit('close')"
          class="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          @click="saveKey"
          :disabled="!apiKey || saving"
          class="flex-1 px-4 py-2.5 bg-linear-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-sm font-bold rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {{ saving ? "Saving..." : "Save Key" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const props = defineProps({
  show: { type: Boolean, default: false },
  message: { type: String, default: "" },
  role: { type: String, default: "student" }, // 'student' or 'teacher'
});

const emit = defineEmits(["close", "saved"]);

const apiKey = ref("");
const saving = ref(false);
const error = ref("");
const success = ref("");

async function saveKey() {
  if (!apiKey.value || !apiKey.value.trim()) {
    error.value = "Please paste your API key";
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    const endpoint =
      props.role === "teacher" ? "/teacher/api-key" : "/student/api-key";
    const tokenKey = props.role === "teacher" ? "teacherToken" : "token";
    const token = localStorage.getItem(tokenKey);

    await axios.patch(
      `http://localhost:3000${endpoint}`,
      { geminiApiKey: apiKey.value.trim() },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    success.value = "API key saved! AI features are now ready.";

    setTimeout(() => {
      emit("saved");
      emit("close");
    }, 1500);
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      "Failed to save API key. Please try again.";
  } finally {
    saving.value = false;
  }
}
</script>
