<template>
  <div class="app" :class="{ light: isLight }">
    <!-- ══ MOBILE TOP BAR ══════════════════════════════════════════════════ -->
    <div class="mobile-bar">
      <button class="hamburger" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle menu">
        <span class="hb-line" :class="{ open: sidebarOpen }"></span>
        <span class="hb-line" :class="{ open: sidebarOpen }"></span>
        <span class="hb-line" :class="{ open: sidebarOpen }"></span>
      </button>
      <div class="mobile-brand">
        <span class="mb-logo">🎓</span>
        <span class="mb-name">EduLearn</span>
      </div>
      <div class="mobile-grade">G{{ gradeNumber }}</div>
    </div>

    <!-- ══ SIDEBAR OVERLAY (mobile) ════════════════════════════════════════ -->
    <transition name="fade">
      <div v-if="sidebarOpen" class="sb-overlay" @click="sidebarOpen = false"></div>
    </transition>

    <!-- ══ SIDEBAR ═══════════════════════════════════════════════════════ -->
    <aside class="sidebar" :class="{ 'sb-open': sidebarOpen }">
      <div class="brand">
        <div class="brand-logo">🎓</div>
        <div>
          <span class="brand-name">EduLearn</span>
          <span class="brand-sub">Grade {{ gradeNumber }} · Primary</span>
        </div>
      </div>

      <!-- User card with XP -->
      <div class="user-pill">
        <div class="user-avi">{{ avatarEmoji }}</div>
        <div class="user-text">
          <b>{{ firstName }}</b>
          <span class="user-rank">⭐ Explorer</span>
        </div>
        <div class="streak">🔥{{ streakDays }}</div>
      </div>

      <!-- XP Progress Bar -->
      <div class="xp-section">
        <div class="xp-label">
          <span>Level {{ playerLevel }}</span>
          <span class="xp-nums">{{ currentXP }}/{{ nextLevelXP }} XP</span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" :style="`width:${xpPercent}%`"></div>
          <div class="xp-bar-glow" :style="`width:${xpPercent}%`"></div>
        </div>
      </div>

      <p class="nav-hd">SUBJECTS</p>
      <nav>
        <button
          v-for="s in subjects"
          :key="s.id"
          class="nav-btn"
          :class="{ 'nav-btn--on': selectedSubject?.id === s.id }"
          :style="selectedSubject?.id === s.id ? `--a:${theme(s.id).a}` : ''"
          @click="pick(s); sidebarOpen = false"
        >
          <span class="nb-icon">{{ s.icon }}</span>
          <span class="nb-lbl">{{ s.name }}</span>
          <span class="nb-ct">{{ total(s) }}</span>
        </button>
      </nav>

      <!-- Daily Quest -->
      <div class="daily-quest">
        <div class="dq-header">
          <span class="dq-icon">🎯</span>
          <span class="dq-title">Daily Goal</span>
        </div>
        <div class="dq-progress">
          <div class="dq-bar-track">
            <div class="dq-bar-fill" :style="`width:${dailyProgress}%`"></div>
          </div>
          <span class="dq-text">{{ dailyDone }}/3 lessons</span>
        </div>
      </div>

      <div class="sb-foot">
        <button class="toggle-btn" @click="toggleTheme">
          <span class="trk" :class="{ on: isLight }">
            <span class="knob">{{ isLight ? "☀️" : "🌙" }}</span>
          </span>
          {{ isLight ? "Light" : "Dark" }} Mode
        </button>
        <button class="logout" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="ic">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- ══ MAIN ══════════════════════════════════════════════════════════ -->
    <main class="main">
      <!-- Stars bg (dark mode only) -->
      <div class="stars" aria-hidden="true">
        <span
          v-for="i in 60"
          :key="i"
          class="star"
          :style="`--x:${rnd()}%;--y:${rnd()}%;--d:${rnd(3)}s;--s:${0.5 + Math.random()}px`"
        ></span>
      </div>

      <!-- Floating shapes bg -->
      <div class="float-shapes" aria-hidden="true">
        <div v-for="i in 8" :key="'fs'+i" class="f-shape"
          :style="`--fx:${rnd()}%;--fy:${rnd()}%;--fd:${8+rnd(12)}s;--fs:${20+rnd(40)}px;--fr:${rnd(360)}deg;--fo:${0.03+Math.random()*0.06}`">
        </div>
      </div>

      <!-- Header -->
      <div class="hdr">
        <div class="hdr-left">
          <h1 class="hello">
            Hello, <span class="rainbow-txt">{{ firstName }}</span>! 👋
          </h1>
          <p class="phrase">{{ phrase }}</p>
          <div class="hdr-stats">
            <div class="hdr-stat">
              <span class="hs-icon">📚</span>
              <span class="hs-val">{{ totalLessons }}</span>
              <span class="hs-lbl">Lessons</span>
            </div>
            <div class="hdr-stat">
              <span class="hs-icon">🏆</span>
              <span class="hs-val">{{ subjects.length }}</span>
              <span class="hs-lbl">Subjects</span>
            </div>
            <div class="hdr-stat">
              <span class="hs-icon">🔥</span>
              <span class="hs-val">{{ streakDays }}</span>
              <span class="hs-lbl">Day Streak</span>
            </div>
          </div>
        </div>
        <div class="hdr-right">
          <div class="grade-tag">
            <div class="gt-badge">🏅</div>
            <div>
              <div class="gt-label">Grade</div>
              <div class="gt-num">{{ gradeNumber }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── SUBJECT PORTAL PICKER ──────────────────────────────────────── -->
      <div v-if="!selectedSubject" class="portals">
        <div
          v-for="(s, i) in subjects"
          :key="s.id"
          class="portal"
          :class="`portal-${s.id}`"
          :style="`animation-delay:${i * 0.12}s`"
          @click="pick(s)"
        >
          <!-- Animated inner orb -->
          <div class="p-orb"></div>
          <!-- dot grid -->
          <div class="p-dots"></div>
          <!-- Particle sparkles -->
          <div class="p-particles">
            <span v-for="j in 6" :key="j" class="p-particle"
              :style="`--px:${rnd()}%;--py:${rnd()}%;--pd:${2+rnd(3)}s;--pp:${rnd(2)}s`">
            </span>
          </div>

          <div class="p-icon-wrap">
            <span class="p-icon">{{ s.icon }}</span>
            <div class="p-ring r1"></div>
            <div class="p-ring r2"></div>
          </div>

          <h2 class="p-title">{{ s.name }}</h2>
          <p class="p-desc">{{ s.description }}</p>
          <p class="p-meta">
            {{ s.chapters?.length }} chapters &bull; {{ total(s) }} games
          </p>

          <!-- Progress ring -->
          <div class="p-progress">
            <svg class="p-prog-svg" viewBox="0 0 36 36">
              <circle class="p-prog-bg" cx="18" cy="18" r="15.9" />
              <circle class="p-prog-fill" cx="18" cy="18" r="15.9"
                :style="`stroke-dashoffset:${100 - (i * 15 + 10)}`" />
            </svg>
            <span class="p-prog-txt">{{ (i * 15 + 10) }}%</span>
          </div>

          <div class="p-cta">
            Play Now
            <svg viewBox="0 0 24 24" fill="currentColor" class="p-arrow">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>

      <!-- ── LESSON LEVELS ──────────────────────────────────────────────── -->
      <div v-else class="levels-view">
        <!-- Breadcrumb -->
        <div class="bc">
          <button class="bc-back" @click="selectedSubject = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" class="bc-arrow">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div class="bc-pill" :class="`bc-${selectedSubject.id}`">
            {{ selectedSubject.icon }} {{ selectedSubject.name }}
          </div>
          <div class="bc-count">{{ total(selectedSubject) }} activities</div>
        </div>

        <div
          v-for="(ch, ci) in selectedSubject.chapters"
          :key="ch.id"
          class="chapter"
          :style="`animation-delay:${ci * 0.1}s`"
        >
          <!-- Chapter header -->
          <div class="ch-bar">
            <div class="ch-accent" :class="`ch-accent-${selectedSubject.id}`"></div>
            <div class="ch-num" :class="`ch-num-${selectedSubject.id}`">{{ ci + 1 }}</div>
            <div class="ch-info">
              <div class="ch-title">{{ ch.title }}</div>
              <div class="ch-meta">
                <span class="ch-badge">{{ ch.lessons.length }} activities</span>
              </div>
            </div>
            <div class="ch-stars">
              <span v-for="star in 3" :key="star" class="ch-star"
                :class="{ earned: star <= Math.min(ci + 1, 3) }">⭐</span>
            </div>
          </div>

          <!-- Game-card grid -->
          <div class="lvl-grid">
            <button
              v-for="(lesson, li) in ch.lessons"
              :key="lesson.id"
              class="lvl-card"
              :style="`--gc1:${gc(selectedSubject.id, li, 0)};--gc2:${gc(selectedSubject.id, li, 1)};animation-delay:${li * 0.06}s`"
              @click="open(lesson)"
            >
              <!-- Gloss overlay -->
              <div class="lv-gloss"></div>
              <!-- Shimmer on hover -->
              <div class="lv-shimmer"></div>

              <div class="lv-num">{{ li + 1 }}</div>

              <div class="lv-icon-wrap">
                <span class="lv-icon">{{ lesson.icon }}</span>
              </div>

              <p class="lv-title">{{ lesson.title }}</p>

              <!-- Mini stars -->
              <div class="lv-stars">
                <span v-for="ms in 3" :key="ms" class="lv-mini-star"
                  :class="{ dimmed: ms > 1 }">★</span>
              </div>

              <div class="lv-play">
                <svg viewBox="0 0 24 24" fill="currentColor" class="ic-sm">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- ══ FULLSCREEN LESSON ══════════════════════════════════════════════ -->
    <transition name="zoom">
      <div v-if="activeLesson" class="overlay">
        <div class="ov-bar">
          <span class="ov-title">{{ activeLesson.icon }} {{ activeLesson.title }}</span>
          <button class="ov-close" @click="activeLesson = null">✕</button>
        </div>
        <iframe
          :src="activeLesson.htmlPath"
          class="ov-frame"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="lesson"
        ></iframe>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { getSubjectsForGrade } from "@/config/primaryContent.js";

const router = useRouter();
const user = ref(JSON.parse(localStorage.getItem("user") || "{}"));
const gradeNumber = computed(() => Number(user.value?.gradeNumber) || 1);
const firstName = computed(() => user.value?.name?.split(" ")[0] || "Friend");
const avatarArr = ["🐣", "🐥", "🐰", "🦊", "🐯"];
const avatarEmoji = computed(() => avatarArr[gradeNumber.value - 1] || "🌟");
const streakDays = ref(3);
const sidebarOpen = ref(false);

// XP / Level system (cosmetic)
const playerLevel = ref(4);
const currentXP = ref(320);
const nextLevelXP = ref(500);
const xpPercent = computed(() => Math.round((currentXP.value / nextLevelXP.value) * 100));

// Daily quest
const dailyDone = ref(1);
const dailyProgress = computed(() => Math.round((dailyDone.value / 3) * 100));

const phrases = [
  "Ready to explore today? 🚀",
  "Learning is your superpower! ⚡",
  "Every lesson makes you smarter! 🧠",
  "Discover something amazing! 🌟",
  "You are doing great! 💪",
];
const pi = ref(0);
const phrase = computed(() => phrases[pi.value]);
setInterval(() => {
  pi.value = (pi.value + 1) % phrases.length;
}, 5000);

const isLight = ref(localStorage.getItem("primaryTheme") === "light");
function toggleTheme() {
  isLight.value = !isLight.value;
  localStorage.setItem("primaryTheme", isLight.value ? "light" : "dark");
}

const subjects = computed(() => getSubjectsForGrade(gradeNumber.value));
const selectedSubject = ref(null);
const activeLesson = ref(null);

const totalLessons = computed(() =>
  subjects.value.reduce((acc, s) => acc + total(s), 0)
);

const themes = {
  math: { a: "#FF6B35" },
  english: { a: "#00C6FF" },
  science: { a: "#43E97B" },
  amharic: { a: "#F7971E" },
  storybooks: { a: "#A855F7" },
};
function theme(id) {
  return themes[id] ?? { a: "#7C3AED" };
}
function total(s) {
  return s.chapters?.reduce((a, c) => a + c.lessons.length, 0) ?? 0;
}
function pick(s) {
  selectedSubject.value = s;
}
function open(l) {
  activeLesson.value = l;
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
}
function rnd(max = 100) {
  return Math.random() * max;
}

// Per-subject cycling gradients for lesson cards
const gradientSets = {
  math: [
    ["#FF6B35", "#FF0F7B"],
    ["#F7971E", "#FFD200"],
    ["#FF0F7B", "#FF6B35"],
    ["#FF4E50", "#F9D423"],
    ["#C94B4B", "#4B134F"],
    ["#FF6B6B", "#FFC371"],
    ["#FF416C", "#FF4B2B"],
    ["#F09819", "#FF512F"],
  ],
  english: [
    ["#00C6FF", "#0072FF"],
    ["#4776E6", "#8E54E9"],
    ["#1CB5E0", "#000046"],
    ["#2196F3", "#4FC3F7"],
    ["#5C258D", "#4389A2"],
    ["#2980B9", "#6DD5FA"],
    ["#396AFC", "#2948FF"],
    ["#0575E6", "#021B79"],
  ],
  science: [
    ["#11998E", "#38EF7D"],
    ["#1D976C", "#93F9B9"],
    ["#00B09B", "#96C93D"],
    ["#43E97B", "#38F9D7"],
    ["#0BA360", "#3CBA92"],
    ["#56AB2F", "#A8E063"],
    ["#00F260", "#0575E6"],
    ["#11998E", "#38EF7D"],
  ],
  amharic: [
    ["#F7971E", "#FFD200"],
    ["#FF512F", "#DD2476"],
    ["#F09819", "#FF512F"],
    ["#C94B4B", "#4B134F"],
    ["#F7971E", "#FFD200"],
    ["#FF416C", "#FF4B2B"],
    ["#F45C43", "#EB3349"],
    ["#F7971E", "#FFD200"],
  ],
  storybooks: [
    ["#A855F7", "#EC4899"],
    ["#8B5CF6", "#D946EF"],
    ["#7C3AED", "#F472B6"],
    ["#9333EA", "#EC4899"],
    ["#A855F7", "#F97316"],
    ["#6D28D9", "#DB2777"],
    ["#8B5CF6", "#F43F5E"],
    ["#A855F7", "#F59E0B"],
  ],
};
function gc(id, i, which) {
  const set = gradientSets[id] ?? gradientSets.math;
  return set[i % set.length][which];
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap");

/* ══ TOKENS ═══════════════════════════════════════════════════════════════ */
.app {
  --bg: #0b1120;
  --sur: #131e33;
  --sur2: #1a2845;
  --sur3: #0e1829;
  --bdr: rgba(255, 255, 255, 0.08);
  --tp: #f1f5f9;
  --ts: #94a3b8;
  --tm: #475569;
  --accent: #6366f1;
  --accent-glow: rgba(99, 102, 241, 0.3);

  display: flex;
  min-height: 100vh;
  background: var(--bg);
  font-family: "Nunito", sans-serif;
  color: var(--tp);
}

.app.light {
  --bg: #f0f4ff;
  --sur: #ffffff;
  --sur2: #f1f5f9;
  --sur3: #e8edf5;
  --bdr: rgba(0, 0, 0, 0.08);
  --tp: #0f172a;
  --ts: #334155;
  --tm: #64748b;
  --accent: #6366f1;
  --accent-glow: rgba(99, 102, 241, 0.15);
}

* {
  box-sizing: border-box;
}

/* ══ MOBILE TOP BAR ══════════════════════════════════════════════════════ */
.mobile-bar {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 120;
  height: 56px;
  background: var(--sur);
  border-bottom: 1px solid var(--bdr);
  padding: 0 1rem;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(20px);
}
.hamburger {
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 6px;
}
.hb-line {
  display: block;
  width: 22px;
  height: 2.5px;
  background: var(--tp);
  border-radius: 3px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform-origin: center;
}
.hb-line.open:first-child { transform: rotate(45deg) translate(5px, 5px); }
.hb-line.open:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hb-line.open:last-child { transform: rotate(-45deg) translate(5px, -5px); }

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.mb-logo {
  font-size: 1.2rem;
}
.mb-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--tp);
}
.mobile-grade {
  font-size: 0.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
}

.sb-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 140;
}

/* ══ SIDEBAR ══════════════════════════════════════════════════════════════ */
.sidebar {
  width: 250px;
  flex-shrink: 0;
  background: var(--sur);
  border-right: 1px solid var(--bdr);
  display: flex;
  flex-direction: column;
  padding: 1.2rem 1rem;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  transition: background 0.3s, transform 0.3s;
  z-index: 150;
}
/* Scrollbar */
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--bdr);
}
.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}
.brand-name {
  display: block;
  font-size: 1rem;
  font-weight: 900;
  color: var(--tp);
  letter-spacing: -0.02em;
}
.brand-sub {
  display: block;
  font-size: 0.65rem;
  color: var(--tm);
  font-weight: 700;
}

/* User pill */
.user-pill {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.08));
  border: 1px solid rgba(99, 102, 241, 0.18);
  border-radius: 16px;
  padding: 0.65rem 0.8rem;
  margin-bottom: 0.75rem;
}
.user-avi {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #fbbf24);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  animation: aPulse 3s ease-in-out infinite;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.25);
}
@keyframes aPulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.4); }
}
.user-text {
  flex: 1;
  min-width: 0;
}
.user-text b {
  display: block;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--tp);
}
.user-rank {
  font-size: 0.65rem;
  color: #f97316;
  font-weight: 700;
}
.streak {
  font-size: 0.82rem;
  font-weight: 900;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 10px;
  padding: 0.25rem 0.5rem;
  flex-shrink: 0;
}

/* XP section */
.xp-section {
  margin-bottom: 1rem;
  padding: 0 0.1rem;
}
.xp-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--ts);
  margin-bottom: 0.35rem;
}
.xp-nums {
  color: #a78bfa;
}
.xp-bar-track {
  height: 8px;
  background: var(--sur2);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--bdr);
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
  border-radius: 999px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
.xp-bar-glow {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
  border-radius: 999px;
  filter: blur(6px);
  opacity: 0.5;
}

.nav-hd {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--tm);
  margin: 0.2rem 0 0.4rem 0.2rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--ts);
  font-size: 0.85rem;
  font-weight: 700;
  font-family: "Nunito", sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  margin-bottom: 0.15rem;
  position: relative;
  overflow: hidden;
}
.nav-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
  transform: translateX(-100%);
  transition: transform 0s;
}
.nav-btn:hover::before {
  transform: translateX(100%);
  transition: transform 0.5s;
}
.nav-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: var(--tp);
  transform: translateX(2px);
}
.nav-btn--on {
  background: rgba(99, 102, 241, 0.15);
  color: var(--tp);
  border-left: 3px solid var(--a, #6366f1);
  padding-left: calc(0.75rem - 3px);
}
.light .nav-btn:hover {
  background: #eff6ff;
}
.light .nav-btn--on {
  background: #eff6ff;
}
.nb-icon {
  font-size: 1.1rem;
}
.nb-lbl {
  flex: 1;
}
.nb-ct {
  font-size: 0.62rem;
  font-weight: 800;
  background: rgba(99, 102, 241, 0.18);
  color: #818cf8;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
}
.light .nb-ct {
  background: #e0e7ff;
  color: #6366f1;
}

/* Daily quest */
.daily-quest {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(249, 115, 22, 0.06));
  border: 1px solid rgba(251, 191, 36, 0.15);
  border-radius: 14px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}
.dq-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.dq-icon { font-size: 0.9rem; }
.dq-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #fbbf24;
}
.dq-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.dq-bar-track {
  flex: 1;
  height: 6px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 999px;
  overflow: hidden;
}
.dq-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f97316, #fbbf24);
  border-radius: 999px;
  transition: width 0.5s ease;
}
.dq-text {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--ts);
  white-space: nowrap;
}

.sb-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 0.5rem;
}
.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: transparent;
  border: 1px solid var(--bdr);
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  color: var(--ts);
  font-size: 0.78rem;
  font-weight: 700;
  font-family: "Nunito", sans-serif;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}
.toggle-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: var(--tp);
}
.trk {
  width: 34px;
  height: 18px;
  background: #334155;
  border-radius: 999px;
  position: relative;
  transition: background 0.3s;
  flex-shrink: 0;
}
.trk.on {
  background: #6366f1;
}
.knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.trk.on .knob {
  transform: translateX(16px);
}

.logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.55rem;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.06);
  color: #f87171;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: "Nunito", sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.logout:hover {
  background: rgba(239, 68, 68, 0.18);
  transform: translateY(-1px);
}
.light .logout {
  color: #dc2626;
}
.ic {
  width: 16px;
  height: 16px;
}
.ic-sm {
  width: 13px;
  height: 13px;
}

/* ══ MAIN ═════════════════════════════════════════════════════════════════ */
.main {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 2.5rem;
  position: relative;
  min-height: 100vh;
}

/* Twinkling stars ── dark mode only */
.stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.light .stars {
  display: none;
}
.star {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--s);
  height: var(--s);
  background: #fff;
  border-radius: 50%;
  animation: twinkle var(--d, 2s) ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.9; }
}

/* Floating shapes */
.float-shapes {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.light .float-shapes { opacity: 0.4; }
.f-shape {
  position: absolute;
  left: var(--fx);
  top: var(--fy);
  width: var(--fs);
  height: var(--fs);
  border: 2px solid rgba(99, 102, 241, var(--fo));
  border-radius: 30%;
  transform: rotate(var(--fr));
  animation: shapeFloat var(--fd) ease-in-out infinite;
}
@keyframes shapeFloat {
  0%, 100% { transform: rotate(var(--fr)) translateY(0) scale(1); }
  50% { transform: rotate(calc(var(--fr) + 180deg)) translateY(-30px) scale(1.1); }
}

/* Header */
.hdr {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 1;
  gap: 1.5rem;
}
.hdr-left { flex: 1; }
.hello {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 0.3rem;
  color: var(--tp);
  letter-spacing: -0.02em;
}
.rainbow-txt {
  background: linear-gradient(90deg, #ff6b35, #ec4899, #8b5cf6, #06b6d4, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 300% auto;
  animation: rainbowShift 4s linear infinite;
}
@keyframes rainbowShift {
  to { background-position: 300% center; }
}
.phrase {
  font-size: 0.9rem;
  color: var(--tm);
  margin: 0 0 1rem;
  min-height: 1.3em;
  font-weight: 600;
  transition: opacity 0.3s;
}

/* Header stats */
.hdr-stats {
  display: flex;
  gap: 0.75rem;
}
.hdr-stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--sur);
  border: 1px solid var(--bdr);
  border-radius: 14px;
  padding: 0.5rem 0.9rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.hdr-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}
.hs-icon { font-size: 1rem; }
.hs-val {
  font-size: 1rem;
  font-weight: 900;
  color: var(--tp);
}
.hs-lbl {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--tm);
}

/* Grade tag */
.hdr-right { flex-shrink: 0; }
.grade-tag {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--sur);
  border: 1px solid var(--bdr);
  border-radius: 18px;
  padding: 0.6rem 1.2rem 0.6rem 0.7rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.gt-badge {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
  border: 2px solid rgba(99,102,241,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  animation: badgePulse 3s ease-in-out infinite;
}
@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
.gt-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--tm);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.gt-num {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--tp);
  line-height: 1;
}
.light .grade-tag {
  background: #fff;
  box-shadow: 0 4px 20px rgba(99,102,241,0.1);
}

/* ══ PORTAL CARDS ═════════════════════════════════════════════════════════ */
.portals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.portal {
  position: relative;
  border-radius: 28px;
  padding: 2rem 1.75rem 1.75rem;
  cursor: pointer;
  overflow: hidden;
  border: none;
  animation: popIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.portal:hover {
  transform: translateY(-12px) scale(1.02);
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.portal-math {
  background: linear-gradient(145deg, #1a0533 0%, #ff0f7b 50%, #ff6b35 100%);
  box-shadow: 0 10px 50px rgba(255, 15, 123, 0.4);
}
.portal-math:hover {
  box-shadow: 0 20px 70px rgba(255, 15, 123, 0.6);
}

.portal-english {
  background: linear-gradient(145deg, #000428 0%, #0072ff 50%, #00c6ff 100%);
  box-shadow: 0 10px 50px rgba(0, 114, 255, 0.4);
}
.portal-english:hover {
  box-shadow: 0 20px 70px rgba(0, 198, 255, 0.6);
}

.portal-science {
  background: linear-gradient(145deg, #001f1a 0%, #11998e 50%, #38ef7d 100%);
  box-shadow: 0 10px 50px rgba(56, 239, 125, 0.35);
}
.portal-science:hover {
  box-shadow: 0 20px 70px rgba(56, 239, 125, 0.55);
}

.portal-amharic {
  background: linear-gradient(145deg, #1a0a00 0%, #f7971e 50%, #ffd200 100%);
  box-shadow: 0 10px 50px rgba(247, 151, 30, 0.4);
}
.portal-amharic:hover {
  box-shadow: 0 20px 70px rgba(255, 210, 0, 0.6);
}

.portal-storybooks {
  background: linear-gradient(145deg, #1a002e 0%, #a855f7 50%, #ec4899 100%);
  box-shadow: 0 10px 50px rgba(168, 85, 247, 0.4);
}
.portal-storybooks:hover {
  box-shadow: 0 20px 70px rgba(236, 72, 153, 0.6);
}

/* Animated orb */
.p-orb {
  position: absolute;
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  top: -50px;
  right: -50px;
  animation: orbFloat 5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes orbFloat {
  0%, 100% { transform: scale(1) translate(0, 0); }
  50% { transform: scale(1.2) translate(-10px, 10px); }
}

/* Dot grid */
.p-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.12) 1.5px,
    transparent 1.5px
  );
  background-size: 22px 22px;
  pointer-events: none;
}

/* Particle sparkles */
.p-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.p-particle {
  position: absolute;
  left: var(--px);
  top: var(--py);
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  animation: particleFloat var(--pd) var(--pp) ease-in-out infinite;
}
@keyframes particleFloat {
  0% { opacity: 0; transform: translateY(0) scale(0.5); }
  50% { opacity: 0.8; transform: translateY(-20px) scale(1); }
  100% { opacity: 0; transform: translateY(-40px) scale(0.5); }
}

/* Icon */
.p-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  z-index: 1;
}
.p-icon {
  font-size: 4.5rem;
  display: block;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.35));
  animation: iconFloat 4s ease-in-out infinite;
  position: relative;
  z-index: 2;
}
.portal:nth-child(2) .p-icon { animation-delay: -1.5s; }
.portal:nth-child(3) .p-icon { animation-delay: -3s; }
.portal:nth-child(4) .p-icon { animation-delay: -0.75s; }

@keyframes iconFloat {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
}

.p-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  animation: ringPulse 2.5s ease-in-out infinite;
}
.r1 { inset: -12px; animation-delay: 0s; }
.r2 { inset: -24px; animation-delay: 0.5s; opacity: 0.4; }

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.1); opacity: 0.9; }
}

.p-title {
  font-size: 1.6rem;
  font-weight: 900;
  color: #fff;
  margin: 0 0 0.2rem;
  z-index: 1;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
.p-desc {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.25rem;
  z-index: 1;
  font-weight: 600;
  line-height: 1.4;
}
.p-meta {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1rem;
  z-index: 1;
  font-weight: 700;
}

/* Progress ring on portal */
.p-progress {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  z-index: 2;
}
.p-prog-svg {
  width: 48px;
  height: 48px;
  transform: rotate(-90deg);
}
.p-prog-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 3;
}
.p-prog-fill {
  fill: none;
  stroke: rgba(255, 255, 255, 0.85);
  stroke-width: 3;
  stroke-dasharray: 100;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.8s ease;
}
.p-prog-txt {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.p-dots-row {
  display: flex;
  gap: 5px;
  margin-bottom: 1.4rem;
  flex-wrap: wrap;
  z-index: 1;
}
.pdot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
}
.portal:hover .pdot {
  background: rgba(255, 255, 255, 0.9);
  transition: background 0.2s;
}

.p-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 1;
  background: rgba(255, 255, 255, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 900;
  padding: 0.55rem 1.3rem;
  border-radius: 999px;
  backdrop-filter: blur(8px);
  transition: background 0.2s, transform 0.2s;
  margin-top: auto;
}
.portal:hover .p-cta {
  background: rgba(255, 255, 255, 0.32);
  transform: scale(1.05);
}
.p-arrow {
  width: 14px;
  height: 14px;
}

/* Light mode portals keep vibrant bg, just soften shadows */
.light .portal-math { box-shadow: 0 6px 30px rgba(255, 15, 123, 0.25); }
.light .portal-english { box-shadow: 0 6px 30px rgba(0, 114, 255, 0.25); }
.light .portal-science { box-shadow: 0 6px 30px rgba(56, 239, 125, 0.25); }
.light .portal-amharic { box-shadow: 0 6px 30px rgba(247, 151, 30, 0.25); }
.light .portal-storybooks { box-shadow: 0 6px 30px rgba(168, 85, 247, 0.25); }

/* ══ LEVELS VIEW ══════════════════════════════════════════════════════════ */
.levels-view {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  position: relative;
  z-index: 1;
}

.bc {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.bc-back {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--sur);
  border: 1px solid var(--bdr);
  color: var(--ts);
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0.4rem 1rem 0.4rem 0.7rem;
  border-radius: 999px;
  font-family: "Nunito", sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.bc-arrow {
  width: 16px;
  height: 16px;
}
.bc-back:hover {
  color: var(--tp);
  background: var(--sur2);
  transform: translateX(-2px);
}
.bc-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
  padding: 0.38rem 1rem;
  border-radius: 999px;
}
.bc-math { background: linear-gradient(90deg, #ff6b35, #ff0f7b); }
.bc-english { background: linear-gradient(90deg, #0072ff, #00c6ff); }
.bc-science { background: linear-gradient(90deg, #11998e, #38ef7d); }
.bc-amharic { background: linear-gradient(90deg, #f7971e, #ffd200); }
.bc-storybooks { background: linear-gradient(90deg, #a855f7, #ec4899); }

.bc-count {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--tm);
  margin-left: auto;
}

/* Chapter section */
.chapter {
  animation: chapterSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes chapterSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Chapter bar — glass card with left accent stripe */
.ch-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: 16px;
  padding: 0.9rem 1.25rem;
  position: relative;
  overflow: hidden;
  background: var(--sur);
  border: 1px solid var(--bdr);
  margin-bottom: 1.25rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.ch-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}
.light .ch-bar {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.light .ch-bar:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}

/* Left accent stripe */
.ch-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 4px 0 0 4px;
}
.ch-accent-math { background: linear-gradient(180deg, #ff6b35, #ff0f7b); }
.ch-accent-english { background: linear-gradient(180deg, #0072ff, #00c6ff); }
.ch-accent-science { background: linear-gradient(180deg, #11998e, #38ef7d); }
.ch-accent-amharic { background: linear-gradient(180deg, #f7971e, #ffd200); }
.ch-accent-storybooks { background: linear-gradient(180deg, #a855f7, #ec4899); }

.ch-num {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 900;
  color: #fff;
  flex-shrink: 0;
}
.ch-num-math { background: linear-gradient(135deg, #ff6b35, #ff0f7b); }
.ch-num-english { background: linear-gradient(135deg, #0072ff, #00c6ff); }
.ch-num-science { background: linear-gradient(135deg, #11998e, #38ef7d); }
.ch-num-amharic { background: linear-gradient(135deg, #f7971e, #ffd200); }
.ch-num-storybooks { background: linear-gradient(135deg, #a855f7, #ec4899); }

.ch-info { flex: 1; min-width: 0; }
.ch-title {
  font-size: 0.92rem;
  font-weight: 900;
  color: var(--tp);
  margin: 0 0 0.2rem;
}
.ch-meta {
  margin: 0;
}
.ch-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--tm);
  background: var(--sur2);
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
}
.light .ch-badge {
  background: #f1f5f9;
  color: #64748b;
}
.ch-stars {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}
.ch-star {
  font-size: 0.9rem;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
  transition: transform 0.2s;
}
.ch-star:not(.earned) {
  opacity: 0.2;
  filter: grayscale(1);
}
.ch-star.earned:hover {
  transform: scale(1.3) rotate(15deg);
}

/* ══ GAME LEVEL CARDS ═════════════════════════════════════════════════════ */
.lvl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: 1.15rem;
}

.lvl-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(145deg, var(--gc1), var(--gc2));
  border: none;
  border-radius: 24px;
  padding: 1.25rem 0.75rem 1rem;
  cursor: pointer;
  overflow: hidden;
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s;
  font-family: "Nunito", sans-serif;
  text-align: center;
  box-shadow:
    0 6px 0 rgba(0, 0, 0, 0.2),
    0 10px 30px rgba(0, 0, 0, 0.15);
  min-height: 190px;
}
.lvl-card:hover {
  transform: translateY(-10px) scale(1.04);
  box-shadow:
    0 16px 0 rgba(0, 0, 0, 0.15),
    0 20px 50px rgba(0, 0, 0, 0.2);
}
.lvl-card:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}

/* Gloss (top white sheen) */
.lv-gloss {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  pointer-events: none;
  border-radius: 24px 24px 0 0;
}

/* Shimmer sweep on hover */
.lv-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.25) 50%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: transform 0s;
  pointer-events: none;
}
.lvl-card:hover .lv-shimmer {
  transform: translateX(100%);
  transition: transform 0.5s ease;
}

/* Lesson number badge */
.lv-num {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 0.62rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.2);
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  backdrop-filter: blur(4px);
}

/* Icon */
.lv-icon-wrap {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.65rem;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}
.lvl-card:hover .lv-icon-wrap {
  transform: scale(1.15) rotate(-8deg);
}

.lv-icon {
  font-size: 2.2rem;
  display: block;
}

.lv-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
  margin: 0 0 0.4rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2em;
}

/* Mini stars */
.lv-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 0.5rem;
}
.lv-mini-star {
  font-size: 0.7rem;
  color: #fbbf24;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}
.lv-mini-star.dimmed {
  opacity: 0.35;
}
.lvl-card:hover .lv-mini-star {
  animation: starBounce 0.4s ease;
}
.lvl-card:hover .lv-mini-star:nth-child(2) { animation-delay: 0.1s; }
.lvl-card:hover .lv-mini-star:nth-child(3) { animation-delay: 0.2s; }
@keyframes starBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.4); }
}

.lv-play {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: transform 0.2s, background 0.2s;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}
.lvl-card:hover .lv-play {
  background: rgba(255, 255, 255, 0.45);
  transform: scale(1.15);
}

/* ══ OVERLAY ══════════════════════════════════════════════════════════════ */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #0b1120;
  display: flex;
  flex-direction: column;
}
.ov-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1.25rem;
  background: #131e33;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}
.ov-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: #f1f5f9;
}
.ov-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  transition: all 0.2s;
}
.ov-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  transform: rotate(90deg);
}
.ov-frame {
  flex: 1;
  width: 100%;
  border: none;
  display: block;
}

/* ══ TRANSITIONS ══════════════════════════════════════════════════════════ */
.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.28s ease;
}
.zoom-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.zoom-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ══ RESPONSIVE ═══════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .mobile-bar {
    display: flex;
  }
  .sb-overlay {
    display: block;
  }
  .app {
    flex-direction: column;
    padding-top: 56px;
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 30px rgba(0, 0, 0, 0.3);
  }
  .sidebar.sb-open {
    transform: translateX(0);
  }
  .main {
    padding: 1.25rem 1rem;
  }
  .hello {
    font-size: 1.5rem;
  }
  .hdr {
    flex-direction: column;
    gap: 1rem;
  }
  .hdr-stats {
    flex-wrap: wrap;
  }
  .hdr-stat {
    padding: 0.4rem 0.7rem;
  }
  .portals {
    grid-template-columns: 1fr;
  }
  .portal {
    min-height: 260px;
  }
  .lvl-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bc-count {
    display: none;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 1rem 0.75rem;
  }
  .hdr-stats {
    gap: 0.5rem;
  }
  .hdr-stat {
    padding: 0.35rem 0.55rem;
  }
  .hs-lbl {
    display: none;
  }
  .grade-tag {
    padding: 0.45rem 0.8rem 0.45rem 0.5rem;
  }
  .gt-badge {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  .gt-num {
    font-size: 1.2rem;
  }
}

@media (min-width: 1400px) {
  .portals {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
  .lvl-grid {
    grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  }
}
</style>
