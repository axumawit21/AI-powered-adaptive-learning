<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    @click.self="close"
  >
    <div
      class="bg-slate-900 border border-slate-700 rounded-2xl p-0 w-[600px] max-w-full shadow-2xl overflow-hidden scale-in-center flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-800 flex items-center justify-between"
      >
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span>📷</span> Take Photo
        </h3>
        <button
          @click="close"
          class="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- Camera View / Preview -->
      <div
        class="relative bg-black aspect-video flex items-center justify-center overflow-hidden"
      >
        <div v-if="error" class="text-red-400 text-center p-4">
          <p class="text-2xl mb-2">🚫</p>
          <p>{{ error }}</p>
          <button
            @click="startCamera"
            class="mt-4 px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-sm"
          >
            Retry Camera
          </button>
        </div>

        <video
          v-show="!capturedImage && !error"
          ref="video"
          autoplay
          playsinline
          class="w-full h-full object-contain transform -scale-x-100"
        ></video>

        <img
          v-if="capturedImage"
          :src="capturedImage"
          class="w-full h-full object-contain"
          alt="Captured photo"
        />

        <canvas ref="canvas" class="hidden"></canvas>
      </div>

      <!-- Controls -->
      <div
        class="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center gap-3"
      >
        <div v-if="!capturedImage" class="w-full flex justify-center">
          <button
            @click="capture"
            :disabled="!streamActive"
            class="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
            :class="{ 'opacity-50 cursor-not-allowed': !streamActive }"
          >
            <div class="w-12 h-12 bg-red-500 rounded-full"></div>
          </button>
        </div>

        <div v-else class="w-full flex justify-between items-center">
          <button
            @click="retake"
            class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
          >
            Retake
          </button>

          <button
            @click="confirm"
            class="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20 flex items-center gap-2"
          >
            <span>Use Photo</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from "vue";

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["close", "capture"]);

const video = ref(null);
const canvas = ref(null);
const stream = ref(null);
const error = ref(null);
const capturedImage = ref(null);
const streamActive = ref(false);

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      startCamera();
    } else {
      stopCamera();
    }
  }
);

async function startCamera() {
  error.value = null;
  capturedImage.value = null;

  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: "user",
      },
      audio: false,
    });

    if (video.value) {
      video.value.srcObject = stream.value;
      streamActive.value = true;
    }
  } catch (err) {
    console.error("Camera access error:", err);
    error.value =
      "Camera access denied or unavailable. Please check permissions.";
    streamActive.value = false;
  }
}

function stopCamera() {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }
  streamActive.value = false;
}

function capture() {
  if (!video.value || !canvas.value) return;

  const context = canvas.value.getContext("2d");
  const width = video.value.videoWidth;
  const height = video.value.videoHeight;

  canvas.value.width = width;
  canvas.value.height = height;

  // Flip context horizontally if we want to mirror the capture to match preview (optional)
  // usually preview is mirrored, but capture should be 'real'.
  // But users expect what they see. Let's mirror it.
  context.translate(width, 0);
  context.scale(-1, 1);

  context.drawImage(video.value, 0, 0, width, height);

  capturedImage.value = canvas.value.toDataURL("image/png");
  stopCamera(); // Pause stream to save battery
}

function retake() {
  capturedImage.value = null;
  startCamera();
}

function confirm() {
  // Convert DataURL to Blob/File
  canvas.value.toBlob((blob) => {
    const file = new File([blob], `photo_${Date.now()}.png`, {
      type: "image/png",
    });
    emit("capture", file);
    close();
  }, "image/png");
}

function close() {
  stopCamera();
  emit("close");
}

onUnmounted(() => {
  stopCamera();
});
</script>

<style scoped>
.scale-in-center {
  animation: scale-in-center 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes scale-in-center {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
