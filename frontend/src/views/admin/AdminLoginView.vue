<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-900 text-white"
  >
    <div
      class="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700"
    >
      <h2
        class="text-3xl font-bold mb-6 text-center bg-linear-to-r from-orange-400 to-red-500 bg-clip-text text-transparent"
      >
        Admin Login
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
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
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
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-400">
        <router-link
          to="/login"
          class="text-orange-400 hover:text-orange-300 font-medium"
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
    const res = await axios.post("http://localhost:3000/admin/login", {
      email: email.value,
      password: password.value,
    });

    const admin = res.data.admin;

    // Redirect school admins to their portal
    if (admin.role === "school_admin") {
      error.value = "School admins should use the School Admin Login portal.";
      return;
    }

    // Clear any conflicting school admin tokens
    localStorage.removeItem("schoolAdminToken");
    localStorage.removeItem("schoolAdmin");

    // Store admin token
    localStorage.setItem("adminToken", res.data.access_token);
    localStorage.setItem("admin", JSON.stringify(admin));
    axios.defaults.headers.common["Authorization"] =
      `Bearer ${res.data.access_token}`;
    router.push("/admin");
  } catch (err) {
    error.value = err.response?.data?.message || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>
