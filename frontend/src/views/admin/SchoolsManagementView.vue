<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <UnifiedDashboardSidebar />

    <main class="ml-64 p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Schools Management</h1>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
        >
          + Create School
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"
        ></div>
      </div>

      <!-- Schools Grid -->
      <div
        v-else-if="schools.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="school in schools"
          :key="school._id"
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-orange-500 transition-colors"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold text-orange-400">
                {{ school.name }}
              </h3>
              <p class="text-slate-400 text-sm">{{ school.code }}</p>
            </div>
            <span
              :class="[
                'px-2 py-1 rounded text-xs',
                school.isActive
                  ? 'bg-emerald-600/30 text-emerald-300'
                  : 'bg-red-600/30 text-red-300',
              ]"
            >
              {{ school.isActive ? "Active" : "Inactive" }}
            </span>
          </div>

          <div class="text-slate-400 text-sm space-y-1 mb-4">
            <p v-if="school.address">📍 {{ school.address }}</p>
            <p v-if="school.city">🏙️ {{ school.city }}</p>
            <p v-if="school.phone">📞 {{ school.phone }}</p>
          </div>

          <div class="flex gap-2">
            <button
              @click="openCreateAdminModal(school)"
              class="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm transition-colors"
            >
              + Admin
            </button>
            <button
              @click="deleteSchool(school._id)"
              class="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="bg-slate-800 p-12 rounded-xl border border-slate-700 text-center"
      >
        <p class="text-slate-400 mb-4">No schools created yet.</p>
        <button
          @click="showCreateModal = true"
          class="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
        >
          Create Your First School
        </button>
      </div>

      <!-- Create School Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showCreateModal = false"
      >
        <div
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md"
        >
          <h2 class="text-xl font-bold mb-4">Create School</h2>
          <form @submit.prevent="createSchool" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >School Name *</label
              >
              <input
                v-model="newSchool.name"
                type="text"
                required
                placeholder="ABC High School"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >School Code *</label
              >
              <input
                v-model="newSchool.code"
                type="text"
                required
                placeholder="ABC-001"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >City</label
              >
              <input
                v-model="newSchool.city"
                type="text"
                placeholder="Addis Ababa"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >Address</label
              >
              <input
                v-model="newSchool.address"
                type="text"
                placeholder="Street address"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >Phone</label
              >
              <input
                v-model="newSchool.phone"
                type="text"
                placeholder="+251..."
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="showCreateModal = false"
                class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
              >
                {{ creating ? "Creating..." : "Create" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create School Admin Modal -->
      <div
        v-if="showAdminModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showAdminModal = false"
      >
        <div
          class="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md"
        >
          <h2 class="text-xl font-bold mb-2">Create School Admin</h2>
          <p class="text-slate-400 text-sm mb-4">
            For: {{ selectedSchool?.name }}
          </p>
          <form @submit.prevent="createSchoolAdmin" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >Admin Name *</label
              >
              <input
                v-model="newAdmin.name"
                type="text"
                required
                placeholder="John Doe"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >Email *</label
              >
              <input
                v-model="newAdmin.email"
                type="email"
                required
                placeholder="admin@school.com"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1"
                >Password *</label
              >
              <input
                v-model="newAdmin.password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="showAdminModal = false"
                class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="creatingAdmin"
                class="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
              >
                {{ creatingAdmin ? "Creating..." : "Create Admin" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useToast } from "../../composables/useToast";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const toast = useToast();
const loading = ref(true);
const schools = ref([]);
const showCreateModal = ref(false);
const showAdminModal = ref(false);
const creating = ref(false);
const creatingAdmin = ref(false);
const selectedSchool = ref(null);

const newSchool = ref({
  name: "",
  code: "",
  city: "",
  address: "",
  phone: "",
});

const newAdmin = ref({
  name: "",
  email: "",
  password: "",
});

const token = () => localStorage.getItem("adminToken");

async function fetchSchools() {
  const adminToken = token();
  console.log("Admin token:", adminToken ? "Present" : "Missing");

  if (!adminToken) {
    toast.error("Not logged in. Please login as admin first.");
    loading.value = false;
    return;
  }

  try {
    const res = await axios.get("http://localhost:3000/schools", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    schools.value = res.data;
  } catch (err) {
    console.error("Failed to fetch schools:", err);
    if (err.response?.status === 401) {
      toast.error("Session expired. Please re-login as admin.");
    } else {
      toast.error("Failed to load schools");
    }
  } finally {
    loading.value = false;
  }
}

async function createSchool() {
  creating.value = true;
  try {
    await axios.post("http://localhost:3000/schools", newSchool.value, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    toast.success("School created successfully");
    showCreateModal.value = false;
    newSchool.value = { name: "", code: "", city: "", address: "", phone: "" };
    fetchSchools();
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to create school");
  } finally {
    creating.value = false;
  }
}

async function deleteSchool(id) {
  if (
    !confirm(
      "Are you sure you want to delete this school? This will affect all associated students and teachers.",
    )
  ) {
    return;
  }
  try {
    await axios.delete(`http://localhost:3000/schools/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    toast.success("School deleted");
    fetchSchools();
  } catch (err) {
    toast.error("Failed to delete school");
  }
}

function openCreateAdminModal(school) {
  selectedSchool.value = school;
  newAdmin.value = { name: "", email: "", password: "" };
  showAdminModal.value = true;
}

async function createSchoolAdmin() {
  if (!selectedSchool.value) return;
  creatingAdmin.value = true;
  try {
    // Register admin with school_admin role
    await axios.post(
      "http://localhost:3000/admin/register",
      {
        ...newAdmin.value,
        role: "school_admin",
        schoolId: selectedSchool.value._id,
      },
      { headers: { Authorization: `Bearer ${token()}` } },
    );
    toast.success(`School admin created for ${selectedSchool.value.name}`);
    showAdminModal.value = false;
    selectedSchool.value = null;
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to create school admin");
  } finally {
    creatingAdmin.value = false;
  }
}

onMounted(fetchSchools);
</script>
