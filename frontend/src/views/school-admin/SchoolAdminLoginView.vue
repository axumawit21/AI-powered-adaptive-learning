<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-900 text-white"
  >
    <div
      class="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700"
    >
      <h2
        class="text-3xl font-bold mb-6 text-center bg-linear-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent"
      >
        School Admin Login
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
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
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
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-linear-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-400">
        <router-link
          to="/login"
          class="text-teal-400 hover:text-teal-300 font-medium"
          >← Back to Student Login</router-link
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { useToast } from "../../composables/useToast";

const toast = useToast();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const router = useRouter();
const route = useRoute();

// Check for session expiry notification
onMounted(() => {
  if (route.query.expired === "true") {
    toast.warning("Your session has expired. Please log in again.");
    // Clean up URL
    router.replace({ path: route.path, query: {} });
  }
});

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    // Use admin login endpoint - school_admin role will be validated
    const res = await axios.post("/admin/login", {
      email: email.value,
      password: password.value,
    });

    const admin = res.data.admin;

    // Verify this is a school_admin
    if (admin.role !== "school_admin") {
      error.value =
        "Access denied. This portal is for school administrators only.";
      return;
    }

    // Clear any conflicting admin tokens to prevent accessing wrong routes
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    // Store school admin token
    localStorage.setItem("schoolAdminToken", res.data.access_token);
    localStorage.setItem("schoolAdmin", JSON.stringify(admin));
    axios.defaults.headers.common["Authorization"] =
      `Bearer ${res.data.access_token}`;
    router.push("/school-admin");
  } catch (err) {
    error.value = err.response?.data?.message || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>
