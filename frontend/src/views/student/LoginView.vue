<template>
  <div
    class="min-h-screen flex items-center justify-center relative overflow-hidden"
    :style="{
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }"
  >
    <ParticlesBackground />
    <div
      class="p-8 rounded-xl shadow-2xl w-full max-w-md relative z-10"
      :style="{
        backgroundColor: 'var(--bg-surface-solid)',
        borderColor: 'var(--border-color)',
        border: '1px solid var(--border-color)',
      }"
    >
      <h2
        class="text-3xl font-bold mb-6 text-center bg-linear-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent"
      >
        Welcome Back
      </h2>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >Email</label
          >
          <input
            v-model="email"
            type="email"
            required
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >Password</label
          >
          <input
            v-model="password"
            type="password"
            required
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-linear-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-400">
        Don't have an account?
        <router-link
          to="/register"
          class="text-cyan-400 hover:text-cyan-300 font-medium"
          >Register</router-link
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../../composables/useAuth";
import ParticlesBackground from "../../components/ui/ParticlesBackground.vue";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const router = useRouter();
const { login } = useAuth();

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    const user = await login(email.value, password.value);

    // Route based on grade level
    if (user.gradeNumber && user.gradeNumber <= 5) {
      // Primary students (Grade 1-5)
      router.push("/primary");
    } else {
      // Secondary students (Grade 9-12)
      router.push("/");
    }
  } catch (err) {
    error.value = err.message || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>
