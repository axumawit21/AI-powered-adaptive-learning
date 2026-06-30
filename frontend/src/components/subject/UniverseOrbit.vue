<template>
  <div
    class="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
  >
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center gap-3">
      <div
        class="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"
      ></div>
      <div class="text-cyan-400 font-medium tracking-wide animate-pulse">
        Scanning Universe...
      </div>
    </div>

    <!-- No subjects message -->
    <div
      v-else-if="!loading && planets.length === 0"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none"
    >
      <div
        class="glass-panel px-8 py-6 rounded-3xl flex flex-col items-center gap-3 border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)]"
      >
        <span class="text-4xl">🔭</span>
        <span class="text-lg font-medium text-slate-200"
          >No subjects found for this grade</span
        >
      </div>
    </div>

    <!-- Welcome Message - Top Positioned (Mobile Only) -->
    <div
      v-if="!activeSubject"
      class="absolute top-[15%] left-1/2 -translate-x-1/2 w-64 text-center z-20 pointer-events-none md:hidden"
    >
      <h3 class="text-xl font-medium text-slate-200 whitespace-nowrap">
        {{ `Welcome back, ${user?.name || "Student"}!` }}
      </h3>
      <p class="text-sm text-slate-400 mt-1">
        Select a subject to unlock Start
      </p>
    </div>

    <!-- Center Hub / Gravity Well -->
    <div
      v-if="!loading && planets.length > 0 && !selectedPlanet"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center pointer-events-none"
    >
      <div
        class="relative group pointer-events-auto"
        :class="
          activeSubject ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
        "
        @click="activeSubject ? handlePlanetClick(activeSubject) : null"
      >
        <!-- Pulse Effect (Active Only) -->
        <div
          v-if="activeSubject"
          class="absolute inset-0 bg-cyan-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"
        ></div>

        <!-- Core Circle -->
        <div
          class="w-20 h-20 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 shadow-xl"
          :class="
            activeSubject
              ? 'border border-cyan-500/30 bg-slate-900/50 group-hover:scale-110 group-hover:border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.1)]'
              : 'border border-slate-700 bg-slate-800/80'
          "
        >
          <!-- Icon Switcher -->
          <div
            class="mb-1 transition-colors duration-300"
            :class="activeSubject ? 'text-cyan-400' : 'text-slate-500'"
          >
            <!-- Resume Icon -->
            <span v-if="activeSubject" class="text-xl sm:text-3xl">▶️</span>
            <!-- Locked Icon -->
            <span v-else class="text-xl sm:text-3xl opacity-50">🔒</span>
          </div>
          <span
            class="text-[9px] sm:text-xs font-bold uppercase tracking-widest transition-colors duration-300"
            :class="activeSubject ? 'text-cyan-400' : 'text-slate-500'"
          >
            {{ activeSubject ? "Start" : "Locked" }}
          </span>
        </div>
      </div>
      <!-- Welcome Message - Below Center Hub -->
      <div
        v-if="!activeSubject"
        class="absolute top-full mt-8 w-64 text-center pointer-events-none opacity-0 animate-[fadeIn_0.5s_ease-out_0.5s_forwards] hidden md:block"
      >
        <h3 class="text-lg font-medium text-slate-200 whitespace-nowrap">
          {{ `Welcome back, ${user?.name || "Student"}!` }}
        </h3>
        <p class="text-xs text-slate-400 mt-1">
          Select a subject to unlock Start
        </p>
      </div>
    </div>

    <!-- Subject planets -->
    <div v-if="!loading && planets.length > 0" class="relative w-full h-full">
      <transition-group name="planet" tag="div" class="w-full h-full">
        <Planet
          v-for="(planet, i) in planets"
          :key="planet.id"
          :subject="planet"
          :style="planetStyle(i)"
          :class="{
            'z-30': selectedPlanet === planet,
            'opacity-30': selectedPlanet && selectedPlanet !== planet,
            'scale-90': selectedPlanet && selectedPlanet !== planet,
          }"
          @select="handlePlanetClick"
        />
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import Planet from "./Planet.vue";
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useAuth } from "../../composables/useAuth";

const { user } = useAuth();

const props = defineProps({
  subjects: {
    type: Array,
    default: () => [],
  },
  inAIChat: {
    type: Boolean,
    default: false,
  },
  radius: {
    type: Number,
    default: 300,
  },
  activeSubject: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["planet-clicked"]);

// Responsive screen width tracking
const screenWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1024
);

function handleResize() {
  screenWidth.value = window.innerWidth;
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// Color palette with 10 attractive color combinations
const colorPalette = [
  { bg: "bg-indigo-600", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-violet-600", text: "text-white" },
  { bg: "bg-lime-600", text: "text-white" },
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-cyan-600", text: "text-white" },
  { bg: "bg-purple-600", text: "text-white" },
];

const planets = ref([]);
const selectedPlanet = ref(null);
const loading = ref(false);
const isTransitioning = ref(false);

// Planet physics state: { [id]: { angle, radius, speed, layer } }
const planetPhysics = ref({});
const baseOrbitSpeed = 0.0005; // Slower base speed for elegance

// Assign colors to subjects
const assignColors = (subjects) => {
  if (!Array.isArray(subjects)) return [];
  return subjects.map((subject, index) => {
    // Deep clone to ensure we have plain object
    const plainSubject = JSON.parse(JSON.stringify(subject));
    return {
      ...plainSubject,
      colorClass: colorPalette[index % colorPalette.length].bg,
      textClass: colorPalette[index % colorPalette.length].text,
    };
  });
};

/* --- Orbit Distribution Logic --- */

const PLANET_DIAMETER = 140; // Approximate visual size including gap

function distributePlanets() {
  const visiblePlanets = selectedPlanet.value
    ? planets.value.filter((p) => p.id !== selectedPlanet.value.id)
    : planets.value;

  if (visiblePlanets.length === 0) return;

  const physics = {};

  // Base radius responsiveness
  let baseRadius = props.radius;
  if (screenWidth.value < 640)
    baseRadius = 135; // Mobile - Compact for small screens
  else if (screenWidth.value < 1024) baseRadius = 240; // Tablet - Increased for consistency

  // Layer configuration
  const layers = [];
  let remainingPlanets = [...visiblePlanets];
  let currentLayer = 0;

  // Determine planet diameter based on screen width
  const responsiveDiameter = screenWidth.value < 640 ? 100 : PLANET_DIAMETER;

  while (remainingPlanets.length > 0) {
    const layerRadius = baseRadius + currentLayer * (responsiveDiameter * 0.8);
    // Calculate circumference: C = 2 * PI * r
    const circumference = 2 * Math.PI * layerRadius;
    // Calculate capacity: how many planets fit with gap?
    const capacity = Math.max(
      1,
      Math.floor(circumference / responsiveDiameter)
    );

    // Take planets for this layer
    const count = Math.min(capacity, remainingPlanets.length);
    const layerPlanets = remainingPlanets.splice(0, count);

    layers.push({
      radius: layerRadius,
      planets: layerPlanets,
      direction: currentLayer % 2 === 0 ? 1 : -1, // Alternate directions
      speed: baseOrbitSpeed * (1 + layers.length * 0.2), // Outer layers slightly faster (linear velocity)
    });

    currentLayer++;
  }

  // Assign angles and physics props
  layers.forEach((layer) => {
    const angleStep = (2 * Math.PI) / layer.planets.length;

    // Use the first planet's existing angle as a phase anchor if available
    // to prevent the whole ring from snapping to 0 degrees on every update
    let basePhase = -Math.PI / 2;
    const firstPlanetId = layer.planets[0]?.id;
    if (firstPlanetId && planetPhysics.value[firstPlanetId]) {
      basePhase = planetPhysics.value[firstPlanetId].angle;
    }

    layer.planets.forEach((p, idx) => {
      // Force strictly equal spacing relative to the base phase
      const targetAngle = basePhase + idx * angleStep;

      physics[p.id] = {
        angle: targetAngle,
        radius: layer.radius,
        speed: layer.speed * layer.direction,
        layer: layers.indexOf(layer),
      };
    });
  });

  // Preserve existing physics for selected planet to avoid errors, though it won't use them for positioning
  if (selectedPlanet.value) {
    physics[selectedPlanet.value.id] = {
      angle: 0,
      radius: 0,
      speed: 0,
      layer: -1,
    };
  }

  planetPhysics.value = physics;
}

// Process subjects from props
function processSubjects(subjectsArray) {
  if (!subjectsArray || subjectsArray.length === 0) {
    planets.value = [];
    return;
  }

  // Map subjects to planet format with colors
  const validSubjects = subjectsArray.filter(
    (subject) => subject && (subject.id || subject._id) && subject.name
  );
  planets.value = assignColors(validSubjects);
  distributePlanets();
}

// Animate orbit rotation
const rotateOrbits = () => {
  if (isTransitioning.value) {
    requestAnimationFrame(rotateOrbits);
    return;
  }

  const newPhysics = { ...planetPhysics.value };

  // Update angles
  Object.keys(newPhysics).forEach((id) => {
    const p = newPhysics[id];
    if (p.layer !== -1) {
      // Don't rotate selected planet
      p.angle = (p.angle + p.speed) % (2 * Math.PI);
    }
  });

  planetPhysics.value = newPhysics;
  requestAnimationFrame(rotateOrbits);
};

// Start animation loop
onMounted(() => {
  requestAnimationFrame(rotateOrbits);
  processSubjects(props.subjects);
});

// Watch activeSubject prop
watch(
  () => props.activeSubject,
  (newSubject) => {
    if (!newSubject) {
      if (selectedPlanet.value) clearSelection();
      return;
    }
    const matchingPlanet = planets.value.find(
      (p) => (p.id || p._id) === (newSubject.id || newSubject._id)
    );
    if (matchingPlanet && selectedPlanet.value !== matchingPlanet) {
      handlePlanetClick(matchingPlanet);
    }
  },
  { deep: true, immediate: true }
);

// Watch for subjects/resize changes
watch(
  [() => props.subjects, screenWidth, () => props.radius],
  () => {
    processSubjects(props.subjects);
  },
  { deep: true }
);

// Compute planet style on orbit
function planetStyle(index) {
  const planet = planets.value[index];
  if (!planet) return {};

  const centerX = 50; // percentage
  const centerY = 50; // percentage

  if (selectedPlanet.value === planet) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) scale(1.2)",
      position: "absolute",
      zIndex: 40,
      transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  }

  const physics = planetPhysics.value[planet.id];
  if (!physics) return { opacity: 0 }; // Hide if not calculated yet

  const x = Math.cos(physics.angle) * physics.radius;
  const y = Math.sin(physics.angle) * physics.radius;

  return {
    left: `calc(${centerX}% + ${x}px)`,
    top: `calc(${centerY}% + ${y}px)`,
    position: "absolute",
    transform: "translate(-50%, -50%)",
    // Use a unified transition for all properties to ensure smoothness
    transition: "all 0.5s ease-out",
    zIndex: 20 - physics.layer, // Inner layers on top, though they shouldn't overlap
  };
}

// Handle subject planet click
function handlePlanetClick(planet) {
  if (isTransitioning.value) return;

  isTransitioning.value = true;
  selectedPlanet.value = planet;

  // Re-distribute remaining planets
  distributePlanets();

  emit("planet-clicked", planet);

  setTimeout(() => {
    isTransitioning.value = false;
  }, 600);
}

// Clear planet selection
function clearSelection() {
  selectedPlanet.value = null;
  distributePlanets();
}
</script>

<style scoped>
.planet-enter-active,
.planet-leave-active {
  transition: all 0.5s ease;
}
.planet-enter-from,
.planet-leave-to {
  opacity: 0;
  transform: scale(0.5) translate(-50%, -50%);
}
</style>
