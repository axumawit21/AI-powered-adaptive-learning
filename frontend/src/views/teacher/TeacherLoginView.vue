<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-900 text-white"
  >
    <div
      class="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700"
    >
      <h2
        class="text-3xl font-bold mb-6 text-center bg-linear-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent"
      >
        Teacher Login
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
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-linear-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-400">
        Don't have an account?
        <router-link
          to="/teacher/register"
          class="text-emerald-400 hover:text-emerald-300 font-medium"
          >Register here</router-link
        >
      </div>

      <div class="mt-2 text-center text-sm text-slate-400">
        <router-link
          to="/login"
          class="text-emerald-400 hover:text-emerald-300 font-medium"
          >← Back to Student Login</router-link
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const router = useRouter();

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.post("/auth/teacher/login", {
      email: email.value,
      password: password.value,
    });

    const user = res.data.user;

    // Check if user is actually a teacher or admin
    if (user.role !== "teacher" && user.role !== "admin") {
      throw new Error("Access denied. This portal is for teachers only.");
    }

    // Store teacher token (no clearing of other role tokens - they coexist)
    localStorage.setItem("teacherToken", res.data.access_token);
    localStorage.setItem("teacher", JSON.stringify(user));

    // Update axios default header
    axios.defaults.headers.common["Authorization"] =
      `Bearer ${res.data.access_token}`;

    router.push("/teacher");
  } catch (err) {
    if (err.message === "Access denied. This portal is for teachers only.") {
      error.value = err.message;
    } else {
      error.value = err.response?.data?.message || "Login failed";
    }
  } finally {
    loading.value = false;
  }
}
</script>
