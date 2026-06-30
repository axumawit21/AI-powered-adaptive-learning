<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-900 text-white relative overflow-hidden"
  >
    <ParticlesBackground />
    <div
      class="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 relative z-10"
    >
      <h2
        class="text-3xl font-bold mb-6 text-center bg-linear-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent"
      >
        Create Account
      </h2>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >Full Name</label
          >
          <input
            v-model="name"
            type="text"
            required
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          />
        </div>

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

        <!-- Role Selector -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-2"
            >I am a</label
          >
          <div class="grid grid-cols-2 gap-3">
            <label
              :class="[
                'flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                role === 'student'
                  ? 'border-cyan-500 bg-cyan-600/20'
                  : 'border-slate-600 hover:border-slate-500',
              ]"
            >
              <input
                type="radio"
                v-model="role"
                value="student"
                class="hidden"
              />
              <span class="text-xl">📚</span>
              <span>Student</span>
            </label>
            <label
              :class="[
                'flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                role === 'teacher'
                  ? 'border-violet-500 bg-violet-600/20'
                  : 'border-slate-600 hover:border-slate-500',
              ]"
            >
              <input
                type="radio"
                v-model="role"
                value="teacher"
                class="hidden"
              />
              <span class="text-xl">👩‍🏫</span>
              <span>Teacher</span>
            </label>
          </div>
        </div>

        <!-- Grade Selector (for students only) -->
        <div v-if="role === 'student'">
          <label class="block text-sm font-medium text-slate-400 mb-2"
            >Select Your Grade</label
          >
          <select
            v-model="gradeNumber"
            required
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>Choose your grade...</option>
            <optgroup label="Primary (Grades 1-5)">
              <option :value="1">Grade 1</option>
              <option :value="2">Grade 2</option>
              <option :value="3">Grade 3</option>
              <option :value="4">Grade 4</option>
              <option :value="5">Grade 5</option>
            </optgroup>
            <optgroup label="Secondary (Grades 9-12)">
              <option :value="9">Grade 9</option>
              <option :value="10">Grade 10</option>
              <option :value="11">Grade 11</option>
              <option :value="12">Grade 12</option>
            </optgroup>
          </select>
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-linear-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Creating Account..." : "Register" }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-400">
        Already have an account?
        <router-link
          to="/login"
          class="text-cyan-400 hover:text-cyan-300 font-medium"
          >Login</router-link
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

const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("student");
const gradeNumber = ref("");
const error = ref("");
const loading = ref(false);
const router = useRouter();
const { register } = useAuth();

async function handleRegister() {
  loading.value = true;
  error.value = "";

  // Validate grade selection for students
  if (role.value === "student" && !gradeNumber.value) {
    error.value = "Please select your grade level";
    loading.value = false;
    return;
  }

  try {
    const user = await register(
      name.value,
      email.value,
      password.value,
      role.value,
      role.value === "student" ? Number(gradeNumber.value) : undefined,
    );

    // Redirect based on role and grade
    if (user.role === "teacher") {
      router.push("/teacher");
    } else if (user.gradeNumber && user.gradeNumber <= 5) {
      // Primary students (Grade 1-5)
      router.push("/primary");
    } else {
      // Secondary students (Grade 9-12)
      router.push("/");
    }
  } catch (err) {
    error.value = err.message || "Registration failed";
  } finally {
    loading.value = false;
  }
}
</script>
