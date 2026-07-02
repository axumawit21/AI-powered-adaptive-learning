<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-900 text-white"
  >
    <div
      class="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700"
    >
      <h2
        class="text-3xl font-bold mb-6 text-center bg-linear-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent"
      >
        Change Password
      </h2>

      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >Current Password</label
          >
          <input
            v-model="currentPassword"
            type="password"
            required
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >New Password</label
          >
          <input
            v-model="newPassword"
            type="password"
            required
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >Confirm New Password</label
          >
          <input
            v-model="confirmPassword"
            type="password"
            required
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>
        <div v-if="success" class="text-green-400 text-sm text-center">
          {{ success }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-linear-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Changing..." : "Change Password" }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <router-link
          to="/"
          class="text-cyan-400 hover:text-cyan-300 font-medium"
          >← Back to Dashboard</router-link
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useAuth } from "../../composables/useAuth";

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const error = ref("");
const success = ref("");
const loading = ref(false);

const { token } = useAuth();

async function handleChangePassword() {
  error.value = "";
  success.value = "";

  if (newPassword.value !== confirmPassword.value) {
    error.value = "New passwords do not match";
    return;
  }

  if (newPassword.value.length < 6) {
    error.value = "Password must be at least 6 characters";
    return;
  }

  loading.value = true;
  try {
    await axios.patch(
      "/auth/change-password",
      {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
      {
        headers: { Authorization: `Bearer ${token.value}` },
      }
    );

    success.value = "Password changed successfully!";
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to change password";
  } finally {
    loading.value = false;
  }
}
</script>
