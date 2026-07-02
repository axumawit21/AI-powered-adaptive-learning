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
        Teacher Registration
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
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="Enter your full name"
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
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="teacher@example.com"
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
            minlength="6"
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="Min 6 characters"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >School</label
          >
          <select
            v-model="schoolId"
            required
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            <option value="">Select School</option>
            <option
              v-for="school in schools"
              :key="school._id"
              :value="school._id"
            >
              {{ school.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >Grade (Optional)</label
          >
          <select
            v-model="gradeId"
            @change="fetchSubjects"
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            <option value="">Select Grade</option>
            <option v-for="grade in grades" :key="grade._id" :value="grade._id">
              {{ grade.title }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1"
            >Subject (Optional)</label
          >
          <select
            v-model="subjectId"
            :disabled="!gradeId"
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
          >
            <option value="">Select Subject</option>
            <option
              v-for="subject in subjects"
              :key="subject._id"
              :value="subject._id"
            >
              {{ subject.title }}
            </option>
          </select>
          <p v-if="!gradeId" class="text-xs text-slate-500 mt-1">
            Select a grade first
          </p>
        </div>

        <!-- BYOK API Key Section -->
        <div class="border border-slate-600 rounded-lg overflow-hidden">
          <button
            type="button"
            @click="showApiKeySection = !showApiKeySection"
            class="w-full flex items-center justify-between px-4 py-3 bg-slate-700/50 hover:bg-slate-700 transition-colors text-left"
          >
            <div class="flex items-center gap-2">
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
              <span class="text-sm font-medium text-slate-300"
                >🔑 Add Your AI Key (Optional)</span
              >
            </div>
            <svg
              :class="[
                'w-4 h-4 text-slate-400 transition-transform',
                showApiKeySection ? 'rotate-180' : '',
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            v-if="showApiKeySection"
            class="px-4 py-4 space-y-3 bg-slate-800/50"
          >
            <p class="text-xs text-slate-400">
              Get a free API key for unlimited AI features. You can also add
              this later.
            </p>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
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
              Get API Key from Google AI Studio
            </a>

            <input
              v-model="geminiApiKey"
              type="text"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="Paste your API key here (starts with AIza...)"
            />

            <p v-if="geminiApiKey" class="text-xs text-emerald-400">
              ✅ Key will be saved with your account
            </p>
          </div>
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-linear-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Registering..." : "Register" }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-400">
        Already have an account?
        <router-link
          to="/teacher/login"
          class="text-emerald-400 hover:text-emerald-300 font-medium"
          >Login here</router-link
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
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const name = ref("");
const email = ref("");
const password = ref("");
const schoolId = ref("");
const gradeId = ref("");
const subjectId = ref("");
const geminiApiKey = ref("");
const showApiKeySection = ref(false);
const error = ref("");
const loading = ref(false);
const router = useRouter();

const schools = ref([]);
const grades = ref([]);
const subjects = ref([]);

async function fetchSchools() {
  try {
    // Use public endpoint for registration form
    const res = await axios.get("/schools/list");
    schools.value = res.data || [];
  } catch (err) {
    console.error("Error fetching schools:", err);
  }
}

async function fetchGrades() {
  try {
    const res = await axios.get("/grades");
    grades.value = res.data || [];
  } catch (err) {
    console.error("Error fetching grades:", err);
  }
}

async function fetchSubjects() {
  subjectId.value = ""; // Reset subject when grade changes
  if (!gradeId.value) {
    subjects.value = [];
    return;
  }
  try {
    // Subjects are not tied to specific grades, so fetch all
    const res = await axios.get("/subjects");
    subjects.value = res.data || [];
  } catch (err) {
    console.error("Error fetching subjects:", err);
  }
}

async function handleRegister() {
  loading.value = true;
  error.value = "";
  try {
    const payload = {
      name: name.value,
      email: email.value,
      password: password.value,
      schoolId: schoolId.value,
    };

    if (gradeId.value) payload.gradeId = gradeId.value;
    if (subjectId.value) payload.subjectId = subjectId.value;
    if (geminiApiKey.value) payload.geminiApiKey = geminiApiKey.value;

    const res = await axios.post(
      "/auth/teacher/register",
      payload,
    );

    const user = res.data.user;

    // Store teacher token FIRST
    localStorage.setItem("teacherToken", res.data.access_token);
    localStorage.setItem("teacher", JSON.stringify(user));

    // Update axios default header
    axios.defaults.headers.common["Authorization"] =
      `Bearer ${res.data.access_token}`;

    // Wait for next tick to ensure localStorage is persisted before navigation
    await nextTick();

    // Navigate to teacher dashboard
    router.push("/teacher");
  } catch (err) {
    error.value =
      err.response?.data?.message || "Registration failed. Please try again.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchSchools();
  fetchGrades();
});
</script>
