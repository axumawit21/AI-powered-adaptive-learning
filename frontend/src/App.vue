<script setup>
import { onMounted, watch } from "vue";
import ToastContainer from "./components/ui/ToastContainer.vue";
import ReminderModal from "./components/notes/ReminderModal.vue";
import { useNotifications } from "./composables/useNotifications";
import { useAuth } from "./composables/useAuth";

const {
  connect,
  disconnect,
  notifications,
  isRinging,
  stopNotificationSound,
  clearNotification,
} = useNotifications();
const { token } = useAuth();

function handleConnection() {
  if (token.value) {
    try {
      const payload = JSON.parse(atob(token.value.split(".")[1]));
      const userId = payload.userId || payload.sub;
      if (userId) {
        connect(userId);
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  } else {
    disconnect();
  }
}

onMounted(() => {
  handleConnection();
});

watch(token, () => {
  handleConnection();
});

function handleSnooze(minutes) {
  if (notifications.value.length > 0) {
    const noteId = notifications.value[0].noteId;
    clearNotification(noteId);
    // Logic to actually snooze on backend would go here if implemented
    // For now it just clears the current alert
    // If the backend resends it, it will pop up again.
    // Ideally we assume backend handles recurring.
  }
}
</script>

<template>
  <div id="app" class="min-h-screen">
    <ToastContainer />
    <router-view :key="$route.fullPath" />
    <ReminderModal
      :show="isRinging"
      :notification="notifications[0]"
      @turnOff="stopNotificationSound"
      @snooze="
        (mins) => {
          stopNotificationSound();
          handleSnooze(mins);
        }
      "
    />
  </div>
</template>

<style>
/* Optional global font setup or transitions */
#app {
  font-family: "Outfit", system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", Arial;
}

button {
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 2px 10px;
}
</style>
