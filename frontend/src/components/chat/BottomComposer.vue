<template>
  <footer class="sticky bottom-0 bg-linear-to-t from-transparent px-50 py-4">
    <div class="mx-auto flex flex-col justify-between gap-3 h-full">
      <!-- Context Switcher at top left when chat is active -->
      <div
        v-if="chatMessages.length > 0 && props.units.length > 0"
        class="mb-3"
      >
        <ChatContextSwitcher
          :units="props.units"
          :selected-unit="internalSelectedUnit || props.selectedUnit"
          :selected-subunit="getSelectedSubunit()"
          :disabled="loading"
          @context-change="handleContextChange"
        />
      </div>

      <!-- Chat messages -->
      <div ref="chatContainer">
        <div
          v-for="(msg, i) in chatMessages"
          :key="i"
          class="flex flex-col gap-1"
        >
          <div
            class="max-w-[75%] min-w-[120px] rounded-2xl rounded-tr-none py-3 px-4 self-end shadow-md mb-2"
            :style="{ background: 'var(--accent-primary)', color: '#fff' }"
          >
            <div
              class="text-xs text-cyan-400 font-bold mb-1 uppercase tracking-wide"
            >
              You
            </div>
            <p class="text-sm leading-relaxed">{{ msg.question }}</p>
          </div>

          <!-- Markdown Answer -->
          <div
            v-if="!msg.quiz && msg.answer"
            class="max-w-[85%] min-w-[200px] backdrop-blur-sm border rounded-2xl rounded-tl-none py-4 px-5 self-start shadow-md mb-6"
            :style="{
              background: 'var(--glass-bg)',
              borderColor: 'var(--border-color)',
            }"
          >
            <div class="flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-cyan-400"
              >
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16" />
                <line x1="16" y1="16" x2="16" y2="16" />
              </svg>
              <span
                class="text-xs text-cyan-400 font-bold uppercase tracking-wide"
                >Lumi AI</span
              >

              <!-- Response Mode Badge -->
              <span
                v-if="msg.responseMode === 'curriculum'"
                class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1"
                title="Answered using official textbook content"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Curriculum
              </span>
              <span
                v-else-if="msg.responseMode === 'general'"
                class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30"
                title="Answered using general knowledge (no curriculum found)"
              >
                General Knowledge
              </span>
              <!-- Audio Control -->
              <button
                @click="toggleAudio(msg.answer, i)"
                class="ml-auto p-1.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                :title="playingIndex === i ? 'Stop Reading' : 'Read Aloud'"
                :disabled="isGenerating && playingIndex !== i"
              >
                <span
                  v-if="isGenerating && playingIndex === i"
                  class="animate-spin text-xs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </span>
                <span
                  v-else-if="playingIndex === i"
                  class="text-xs font-bold animate-pulse text-cyan-400 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                  Playing</span
                >
                <span v-else class="text-xs flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  </svg>
                  Listen</span
                >
              </button>
            </div>

            <!-- Source Verification Banners -->
            <div
              v-if="msg.responseMode === 'curriculum'"
              class="mb-3 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs flex items-center gap-2"
            >
              <span class="text-lg">📚</span>
              <span class="font-medium">Verified from your textbooks</span>
            </div>
            <div
              v-if="msg.responseMode === 'general'"
              class="mb-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs flex items-center gap-2"
            >
              <span class="text-lg">⚠️</span>
              <span class="font-medium"
                >No verified curriculum found. Answering with general
                knowledge.</span
              >
            </div>

            <div
              class="prose prose-sm max-w-none leading-relaxed chat-response-content"
              :class="{ 'prose-invert': theme === 'dark' }"
              v-html="renderMarkdown(parseMessage(msg.answer).body)"
            ></div>

            <!-- Follow-up Questions -->
            <div
              v-if="parseMessage(msg.answer).questions.length"
              class="mt-4 pt-3 border-t border-slate-700/50 flex flex-col gap-2"
            >
              <div
                class="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                Suggested Questions
              </div>
              <button
                v-for="(q, qIdx) in parseMessage(msg.answer).questions"
                :key="qIdx"
                @click="
                  text = q;
                  send();
                "
                class="text-left text-sm hover:text-white py-2 px-3 rounded-lg border hover:border-cyan-500/50 transition-all duration-200 flex items-start gap-2 group"
                :style="{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                }"
              >
                <span
                  class="text-emerald-500 group-hover:text-emerald-400 mt-0.5"
                  >↳</span
                >
                <span>{{ q }}</span>
              </button>
            </div>
          </div>

          <!-- Quiz Answer -->
          <div
            v-else-if="msg.quiz"
            class="w-full max-w-3xl self-start flex flex-col gap-4 mb-6 pl-2"
          >
            <!-- Use UploadQuizPlayer for uploaded content quizzes -->
            <UploadQuizPlayer
              v-if="msg.quiz.source === 'uploaded-content'"
              :quiz-data="msg.quiz"
              @close="removeMessage(i)"
            />
            <!-- Use InlineQuizPlayer for regular session-based quizzes -->
            <InlineQuizPlayer
              v-else
              :quiz-data="msg.quiz"
              @close="removeMessage(i)"
            />
          </div>

          <!-- Summary Answer -->
          <div
            v-else-if="msg.summaryData"
            class="max-w-[95%] min-w-[300px] border rounded-2xl p-5 self-start shadow-md mb-6"
            :style="{
              background: 'var(--bg-surface-solid)',
              borderColor: 'var(--border-color)',
            }"
          >
            <div class="flex items-center gap-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-indigo-400"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div class="flex-1">
                <h3 class="font-bold text-white text-lg">Unit Summary</h3>
                <div class="text-xs text-slate-400">Select detail level</div>
              </div>
              <button
                @click="removeMessage(i)"
                class="text-slate-500 hover:text-red-400 p-2 transition-colors"
                title="Close Summary"
              >
                ✕
              </button>
            </div>

            <!-- Audio Player Section (Top) -->
            <!-- Audio Player Section (Top) -->
            <div
              v-if="
                msg.summaryData.audioFilePath || msg.summaryData.customAudioUrl
              "
              class="mb-4"
            >
              <!-- Collapsed: Button -->
              <button
                v-if="!msg.summaryData.showAudio"
                @click="msg.summaryData.showAudio = true"
                class="w-full flex items-center justify-between p-3 bg-linear-to-r from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-900/50 transition-all group"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform"
                  >
                    <span class="text-lg">🎧</span>
                  </div>
                  <div class="text-left">
                    <h4
                      class="text-purple-300 font-bold text-xs uppercase tracking-wider"
                    >
                      Audio Overview
                      {{ msg.summaryData.customAudioUrl ? "(Custom)" : "" }}
                    </h4>
                    <p class="text-[10px] text-purple-400/60">
                      Click to listen to
                      {{
                        msg.summaryData.customAudioUrl
                          ? "uploaded audio"
                          : "teacher discussion"
                      }}
                    </p>
                  </div>
                </div>
                <span
                  class="text-purple-400 text-xs font-bold group-hover:translate-x-1 transition-transform"
                  >Play ▶</span
                >
              </button>

              <!-- Expanded: Player -->
              <div
                v-else
                class="p-3 bg-purple-900/40 rounded-xl border border-purple-500/30 flex flex-col gap-2 animate-in fade-in zoom-in duration-200"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🎙️</span>
                    <h4
                      class="text-purple-300 font-bold text-xs uppercase tracking-wider"
                    >
                      Audio Overview
                      {{ msg.summaryData.customAudioUrl ? "(Custom)" : "" }}
                    </h4>
                  </div>
                  <button
                    @click="msg.summaryData.showAudio = false"
                    class="text-slate-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
                  >
                    Hide
                  </button>
                </div>
                <audio
                  controls
                  :src="
                    msg.summaryData.customAudioUrl
                      ? getCustomAudioUrl(msg.summaryData.customAudioUrl)
                      : getAudioUrl(msg.summaryData.audioFilePath)
                  "
                  class="w-full h-8"
                  autoplay
                ></audio>
              </div>
            </div>

            <!-- Toggle -->
            <div class="flex bg-slate-900 p-1 rounded-lg mb-4 w-full max-w-md">
              <button
                @click="msg.summaryData.view = 'general'"
                :class="[
                  'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                  msg.summaryData.view === 'general'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                ]"
              >
                General Overview
              </button>
              <button
                @click="msg.summaryData.view = 'detailed'"
                :class="[
                  'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                  msg.summaryData.view === 'detailed'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                ]"
              >
                Detailed Analysis
              </button>
            </div>

            <!-- Content -->
            <div
              class="prose prose-invert prose-sm max-w-none bg-slate-900/50 p-4 rounded-xl border border-slate-700/50"
            >
              <div
                v-if="msg.summaryData.view === 'general'"
                class="animate-in fade-in duration-300"
              >
                <h4 class="text-indigo-400 font-bold mb-2">General Summary</h4>
                <div
                  class="leading-relaxed"
                  v-html="renderMarkdown(msg.summaryData.general)"
                ></div>
              </div>
              <div v-else class="animate-in fade-in duration-300">
                <h4 class="text-indigo-400 font-bold mb-2">Detailed Summary</h4>
                <div
                  class="leading-relaxed"
                  v-html="renderMarkdown(msg.summaryData.detailed)"
                ></div>

                <div
                  v-if="
                    msg.summaryData.keyConcepts &&
                    msg.summaryData.keyConcepts.length > 0
                  "
                  class="mt-4 pt-4 border-t border-slate-700"
                >
                  <h4 class="text-emerald-400 font-bold mb-2 text-sm uppercase">
                    Key Concepts
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="c in msg.summaryData.keyConcepts"
                      :key="c"
                      class="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20"
                    >
                      {{ c }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Presentation Answer -->
          <div
            v-else-if="msg.presentationData"
            class="w-full max-w-4xl self-start flex flex-col gap-4 mb-6 pl-2 mt-4 relative group"
          >
            <button
              @click="removeMessage(i)"
              class="absolute -top-2 -right-2 z-10 border text-slate-400 hover:text-red-400 w-8 h-8 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              :style="{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
              }"
              title="Close Presentation"
            >
              ✕
            </button>
            <PresentationViewer :presentation="msg.presentationData" />
          </div>
        </div>

        <div v-if="loading" class="text-white italic">Lumi is thinking...</div>
      </div>

      <div class="grow-0 space-y-3 pt-2">
        <!-- Unit Selector: Shows before chat starts -->
        <div
          v-if="props.units.length > 0 && chatMessages.length === 0"
          class="flex items-center gap-2 px-1"
        >
          <span
            class="text-xs uppercase tracking-wider font-bold"
            :style="{ color: 'var(--text-secondary)' }"
            >Target Unit:</span
          >
          <select
            v-model="internalSelectedUnit"
            class="text-sm border rounded-lg py-1 px-2 focus:ring-2 focus:ring-cyan-500 outline-none max-w-xs transition-colors"
            :style="{
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              borderColor: 'var(--input-border)',
            }"
          >
            <option :value="null">-- Manual Input --</option>
            <option
              v-for="u in flatUnits"
              :key="u.id || u.unitNumber"
              :value="u"
            >
              {{ u.indentedTitle }}
            </option>
          </select>
        </div>

        <!-- Quiz Configuration: Show only in quiz mode -->
        <div
          v-if="activeMode === 'quiz'"
          class="flex items-center gap-3 px-1 flex-wrap"
        >
          <div class="flex items-center gap-2">
            <span
              class="text-xs uppercase tracking-wider font-bold"
              :style="{ color: 'var(--text-secondary)' }"
              >Difficulty:</span
            >
            <select
              v-model="quizDifficulty"
              class="text-sm border rounded-lg py-1 px-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                borderColor: 'var(--input-border)',
              }"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="text-xs uppercase tracking-wider font-bold"
              :style="{ color: 'var(--text-secondary)' }"
              >Type:</span
            >
            <select
              v-model="quizQuestionType"
              class="text-sm border rounded-lg py-1 px-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                borderColor: 'var(--input-border)',
              }"
            >
              <option :value="null">Default (MCQ)</option>
              <option value="mcq">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="short-answer">Short Answer</option>
              <option value="fill-blank">Fill in the Blank</option>
              <option value="matching">Matching</option>
              <option value="mixed">Mixed (All Types)</option>
            </select>
          </div>
        </div>

        <!-- Input -->
        <div class="flex items-start gap-3 mt-2">
          <!-- Upload/Camera Dropdown Container -->
          <div class="relative" ref="uploadMenuContainer">
            <button
              @click="showUploadMenu = !showUploadMenu"
              class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors border group relative shadow-sm"
              :style="{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
              }"
              :disabled="uploading"
              title="Upload or Capture"
            >
              <span
                v-if="!uploading"
                class="text-xl text-slate-400 group-hover:text-cyan-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </span>
              <span v-else class="animate-spin text-cyan-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </span>
              <!-- Upload Count Badge -->
              <span
                v-if="uploadedFileCount > 0"
                class="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {{ uploadedFileCount }}
              </span>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="showUploadMenu"
              class="absolute bottom-full left-0 mb-2 w-48 rounded-xl shadow-lg border overflow-hidden z-50"
              :style="{
                background: 'var(--bg-surface-solid)',
                borderColor: 'var(--border-color)',
              }"
            >
              <!-- Choose File Option -->
              <button
                @click="triggerFileUpload"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-cyan-500/10 transition-colors"
                :style="{ color: 'var(--text-primary)' }"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-cyan-400"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                Choose File
              </button>

              <!-- Take Photo Option -->
              <button
                @click="triggerCameraCapture"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-cyan-500/10 transition-colors border-t"
                :style="{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-color)',
                }"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-emerald-400"
                >
                  <path
                    d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Take Photo
              </button>
            </div>
          </div>

          <!-- Hidden File Input -->
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,image/*"
            multiple
            class="hidden"
            @change="handleFileUpload"
          />

          <textarea
            v-model="text"
            rows="1"
            @keydown.enter.exact.prevent="send"
            @focus="$emit('focused')"
            @blur="$emit('blurred')"
            class="flex-1 resize-none rounded-xl p-3 outline-none transition-all border"
            :style="{
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              borderColor: 'var(--input-border)',
            }"
            :placeholder="
              uploadedFileCount > 0
                ? 'Ask about your uploaded content...'
                : placeholder
            "
          ></textarea>

          <button
            @click="send"
            class="w-12 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 flex items-center justify-center transition-colors shadow-lg shadow-cyan-500/20"
            :disabled="loading"
          >
            <span v-if="!loading">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-white"
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            </span>
            <span v-else class="animate-spin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-white"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </span>
          </button>
        </div>

        <!-- Feature Buttons (Regular - show when no uploads) -->
        <div
          v-if="uploadedFileCount === 0"
          class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700"
        >
          <div
            v-for="f in features"
            :key="f.id"
            @click="toggleFeature(f.id)"
            :class="featureClass(f.id)"
            class="min-w-[140px] p-3 rounded-2xl cursor-pointer shadow-md border hover:border-cyan-500/50 transition-all duration-200 select-none"
          >
            <div
              class="text-sm font-semibold"
              :style="{
                color:
                  f.id === props.activeMode ? '#fff' : 'var(--text-primary)',
              }"
            >
              {{ f.label }}
            </div>
            <div
              class="text-xs mt-1"
              :style="{
                color:
                  f.id === props.activeMode
                    ? 'rgba(255,255,255,0.7)'
                    : 'var(--text-secondary)',
              }"
            >
              {{ f.desc }}
            </div>
          </div>
        </div>

        <!-- Upload-Specific Feature Buttons (show when files uploaded) -->
        <div
          v-if="uploadedFileCount > 0"
          class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700"
        >
          <div
            @click="generateUploadQuiz"
            class="min-w-[140px] p-3 rounded-2xl cursor-pointer shadow-md border border-transparent transition-all duration-200 select-none bg-emerald-600 hover:bg-emerald-500"
            :class="{ 'opacity-50 pointer-events-none': generatingUploadQuiz }"
          >
            <div
              class="text-sm font-semibold text-white flex items-center gap-2"
            >
              <span
                v-if="!generatingUploadQuiz"
                class="flex items-center gap-1"
              >
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
                  <path
                    d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
                  />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="m9 15 2 2 4-4" />
                </svg>
                Quiz
              </span>
              <span v-else class="animate-spin">
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
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </span>
              <span v-if="generatingUploadQuiz">Generating...</span>
            </div>
            <div class="text-xs text-emerald-200 mt-1">From your upload</div>
          </div>

          <div
            @click="generateUploadSummary"
            class="min-w-[140px] p-3 rounded-2xl cursor-pointer shadow-md border border-transparent transition-all duration-200 select-none bg-indigo-600 hover:bg-indigo-500"
            :class="{
              'opacity-50 pointer-events-none': generatingUploadSummary,
            }"
          >
            <div
              class="text-sm font-semibold text-white flex items-center gap-2"
            >
              <span
                v-if="!generatingUploadSummary"
                class="flex items-center gap-1"
              >
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
                  <path
                    d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
                  />
                  <path d="M8 7h6" />
                  <path d="M8 11h8" />
                </svg>
                Summary
              </span>
              <span v-else class="animate-spin">
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
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </span>
              <span v-if="generatingUploadSummary">Generating...</span>
            </div>
            <div class="text-xs text-indigo-200 mt-1">From your upload</div>
          </div>

          <div
            @click="clearUploadSession"
            class="min-w-[120px] p-3 rounded-2xl cursor-pointer shadow-md border border-slate-600 transition-all duration-200 select-none bg-slate-800 hover:bg-red-900/50 hover:border-red-500/50"
          >
            <div
              class="text-sm font-semibold text-white flex items-center gap-2"
            >
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
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Clear
            </div>
            <div class="text-xs text-slate-400 mt-1">Remove uploads</div>
          </div>
        </div>
      </div>
    </div>
    <CameraCaptureModal
      :show="showCameraModal"
      @close="showCameraModal = false"
      @capture="handleCameraCapture"
    />
    <!-- BYOK API Key Modal - shown when AI quota is exceeded -->
    <ApiKeyModal
      :show="showApiKeyModal"
      role="student"
      message="AI quota exceeded. Get your own free API key to continue using quizzes, chat, and other AI features!"
      @close="showApiKeyModal = false"
      @saved="showApiKeyModal = false"
    />
  </footer>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from "vue";
import { useTheme } from "../../composables/useTheme";
import { useChatLogic } from "../../composables/useChatLogic";
import InlineQuizPlayer from "../quiz/InlineQuizPlayer.vue";
import ApiKeyModal from "../shared/ApiKeyModal.vue";
import UploadQuizPlayer from "../quiz/UploadQuizPlayer.vue";
import PresentationViewer from "../presentation/PresentationViewer.vue";
import CameraCaptureModal from "../common/CameraCaptureModal.vue";
import ChatContextSwitcher from "./ChatContextSwitcher.vue";
import { useToast } from "../../composables/useToast";
import { useAudio } from "../../composables/useAudio";
import ttsService from "../../services/ttsService";
import api from "../../services/api";

const props = defineProps({
  activeMode: { type: String, default: null },
  selectedSubject: Object,
  grade: [String, Object], // Can be string ID or object
  chatMessages: { type: Array, default: () => [] },
  inChat: Boolean,
  numQuestions: { type: Number, default: 5 },
  selectedUnit: { type: Object, default: null },
  units: { type: Array, default: () => [] }, // List of units for selection
  sessionId: { type: String, default: null },
});

const emit = defineEmits([
  "set-mode",
  "send", // Still emitted for upward compatibility if needed, but we handle logic here locally or via global state wrapper
  "session-created",
  "focused",
  "blurred",
  "context-change", // Emitted when user switches unit/subunit mid-chat
]);

const removeMessage = (index) => {
  props.chatMessages.splice(index, 1);
};

// Flatten units for dropdown
const flatUnits = computed(() => {
  const result = [];
  const traverse = (list, depth = 0) => {
    for (const u of list) {
      const indent = "\u00A0\u00A0".repeat(depth); // 2 spaces per level
      const title = u.title || u.unitNumber || "Untitled Unit";
      result.push({
        ...u,
        indentedTitle: `${indent}${
          u.unitNumber ? u.unitNumber + ". " : ""
        }${title}`,
      });

      if (u.subunits && u.subunits.length > 0) {
        traverse(u.subunits, depth + 1);
      }
    }
  };
  traverse(props.units);
  return result;
});

// Get the currently selected subunit for ChatContextSwitcher
function getSelectedSubunit() {
  // Check if selectedUnit has subunitNumber (meaning it's a subunit)
  if (props.selectedUnit && props.selectedUnit.subunitNumber) {
    return props.selectedUnit;
  }
  // Check internalSelectedUnit
  if (internalSelectedUnit.value && internalSelectedUnit.value.subunitNumber) {
    return internalSelectedUnit.value;
  }
  return null;
}

// Handle context switch from ChatContextSwitcher
function handleContextChange({ unit, subunit }) {
  // IMPORTANT: Enrich subunit with parent unit info for proper scoped retrieval
  if (subunit) {
    // Create enriched subunit with parent unit context
    internalSelectedUnit.value = {
      ...subunit,
      parentUnitNumber: unit?.unitNumber,
      parentUnitTitle: unit?.title,
      unitNumber: unit?.unitNumber, // Pass parent unit number for backend filtering
      subunitNumber: subunit.subunitNumber || subunit.id || subunit.title, // Pass subunit identifier
    };
  } else {
    internalSelectedUnit.value = unit;
  }
  // Emit to parent to update global state and clear chat
  emit("context-change", { unit, subunit });
}

const text = ref("");
const chatContainer = ref(null);
const internalSelectedUnit = ref(null); // Local selection state
const quizDifficulty = ref("mixed");
const quizQuestionType = ref(null);

// Track session ID locally to prevent race conditions with prop updates
const localSessionId = ref(null);

// Sync local session with prop ONLY for initial load or when selecting an existing session
// Once we have a local session, don't overwrite it (prevents race condition issues)
watch(
  () => props.sessionId,
  (newId, oldId) => {
    // Only sync from prop if:
    // 1. We don't have a local session yet AND prop has a value (loading existing session)
    // 2. OR parent cleared session (new chat started)
    if (newId && !localSessionId.value) {
      localSessionId.value = newId;
      console.log("[Session] Synced from prop (initial load):", newId);
    } else if (!newId && oldId) {
      // Parent cleared session (new chat started)
      localSessionId.value = null;
      console.log("[Session] Cleared (new chat)");
    }
    // If we already have a local session, don't overwrite it
    // This prevents the emit -> prop update -> watch cycle from resetting our session
  },
  { immediate: true },
);

// Helper to get current session (prefer local, fall back to prop)
const currentSessionId = computed(
  () => localSessionId.value || props.sessionId,
);

// Handler to update local session and emit to parent
function handleSessionCreated(id) {
  console.log("[Session] Storing locally:", id);
  localSessionId.value = id;
  emit("session-created", id);
}

// Upload feature state
const fileInput = ref(null);
const cameraInput = ref(null);
const uploading = ref(false);
const uploadedFileCount = ref(0);
const generatingUploadQuiz = ref(false);
const generatingUploadSummary = ref(false);
const showUploadMenu = ref(false);
const showCameraModal = ref(false);
const uploadMenuContainer = ref(null);

// Close menu when clicking outside
function handleClickOutside(event) {
  // If menu is open and click is outside the container
  if (
    showUploadMenu.value &&
    uploadMenuContainer.value &&
    !uploadMenuContainer.value.contains(event.target)
  ) {
    showUploadMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Trigger file upload dialog
function triggerFileUpload() {
  showUploadMenu.value = false;
  if (fileInput.value) {
    fileInput.value.click();
  }
}

// Trigger camera capture
function triggerCameraCapture() {
  showUploadMenu.value = false;
  showCameraModal.value = true;
}

function handleCameraCapture(file) {
  processFiles([file]);
  showCameraModal.value = false;
}

import mermaid from "mermaid";

const { theme } = useTheme();
const {
  loading,
  isGenerating,
  showApiKeyModal,
  sendMessage,
  parseMessage,
  renderMarkdown,
} = useChatLogic();

// --- MERMAID INTEGRATION ---
onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme.value === "dark" ? "dark" : "default",
    securityLevel: "loose",
    suppressErrorRendering: true,
  });
});

watch(theme, (newTheme) => {
  mermaid.initialize({
    theme: newTheme === "dark" ? "dark" : "default",
    suppressErrorRendering: true,
  });
});

const processMermaidDiagrams = async () => {
  await nextTick();
  const diagrams = document.querySelectorAll(".language-mermaid");

  diagrams.forEach(async (el, index) => {
    if (el.getAttribute("data-processed")) return;

    // Create container
    const id = `mermaid-${Date.now()}-${index}`;
    const graphDefinition = el.textContent;
    const container = document.createElement("div");
    container.id = id;
    container.className =
      "mermaid-diagram overflow-x-auto my-4 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50 flex justify-center";

    // Insert container after the pre block (which holds the code)
    // markdown-it usually wraps code in <pre><code>
    const preElement = el.parentElement;

    try {
      const { svg } = await mermaid.render(id, graphDefinition);
      container.innerHTML = svg;
      el.setAttribute("data-processed", "true");

      // Hide the original code block
      preElement.style.display = "none";
      preElement.parentNode.insertBefore(container, preElement);
    } catch (err) {
      console.warn("Mermaid render skipped:", err?.message || err);
      // Fallback: Show code block if render fails (don't hide preElement)
      el.setAttribute("data-processed", "error");

      // Clean up error elements Mermaid creates in the DOM
      const errorEl = document.getElementById(id);
      if (errorEl) errorEl.remove();
      // Clean up any orphaned mermaid error SVGs
      document.querySelectorAll(`svg[id^="mermaid"]`).forEach((svg) => {
        if (svg.textContent?.toLowerCase().includes("error")) {
          svg.remove();
        }
      });
    }
  });
};

// Watch for chat messages to update (new answers) and trigger render
watch(
  () => props.chatMessages,
  () => {
    processMermaidDiagrams();
  },
  { deep: true, immediate: true },
);

const { error: toastError } = useToast();
const { play, stop, isPlaying } = useAudio();
const playingIndex = ref(-1);

// Watch for global stop or end
watch(isPlaying, (val) => {
  if (!val) {
    playingIndex.value = -1;
  }
});

function toggleAudio(text, index) {
  if (playingIndex.value === index) {
    stop();
    playingIndex.value = -1;
  } else {
    const cleanText = text.replace(/[*#_`]/g, "");
    playingIndex.value = index;
    play(cleanText);
  }
}

// Get audio URL for TTS playback
function getAudioUrl(filename) {
  return ttsService.getAudioUrl(filename);
}

// Get custom audio URL
function getCustomAudioUrl(url) {
  const baseUrl = api.defaults.baseURL || "http://localhost:3000";
  return `${baseUrl}${url}`;
}

// Handle file upload
const { success: toastSuccess } = useToast();

async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  await processFiles(files);
}

async function processFiles(files) {
  uploading.value = true;

  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/student-upload/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        uploadedFileCount.value++;
        toastSuccess(
          `📎 Uploaded: ${file.name} (${response.data.chunksAdded} chunks)`,
        );
      } else {
        toastError(`Failed to upload ${file.name}: ${response.data.message}`);
      }
    }

    // Add system message to chat
    if (uploadedFileCount.value > 0) {
      props.chatMessages.push({
        question: `📎 Uploaded ${files.length} file(s) for in-session analysis`,
        answer: `Great! I've processed your uploaded content. You can now:\n\n• **Ask questions** about the material\n• **Generate quizzes** from your content\n• **Get summaries** of key topics\n\nJust type your question below!`,
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    toastError(
      `Upload failed: ${error.response?.data?.message || error.message}`,
    );
  } finally {
    uploading.value = false;
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
}

// Generate quiz from uploaded content
async function generateUploadQuiz() {
  if (uploadedFileCount.value === 0) return;

  generatingUploadQuiz.value = true;

  // Add generating message
  props.chatMessages.push({
    question: "📝 Generate quiz from my uploaded content",
    answer: null,
    quiz: null,
  });

  try {
    // Pass grade/subject for chat history persistence
    const gradeId =
      typeof props.grade === "object" ? props.grade?._id : props.grade;
    const subjectId = props.selectedSubject?._id;

    const response = await api.post("/student-upload/quiz", {
      numQuestions: 5,
      grade: gradeId,
      subject: subjectId,
      sessionId: props.sessionId,
    });

    // Update the last message with quiz data
    const lastMsg = props.chatMessages[props.chatMessages.length - 1];
    lastMsg.quiz = {
      questions: response.data.questions,
      source: "uploaded-content",
    };
    lastMsg.answer = null; // Clear answer since we have quiz

    toastSuccess(
      `📝 Generated ${response.data.questions.length} questions from your content!`,
    );
  } catch (error) {
    const lastMsg = props.chatMessages[props.chatMessages.length - 1];
    lastMsg.answer = `❌ Quiz generation failed: ${
      error.response?.data?.message || error.message
    }`;
    toastError(
      `Quiz generation failed: ${
        error.response?.data?.message || error.message
      }`,
    );
  } finally {
    generatingUploadQuiz.value = false;
  }
}

// Generate summary from uploaded content
async function generateUploadSummary() {
  if (uploadedFileCount.value === 0) return;

  generatingUploadSummary.value = true;

  // Add generating message
  props.chatMessages.push({
    question: "📖 Summarize my uploaded content",
    answer: null,
  });

  loading.value = true;

  try {
    // Pass grade/subject for chat history persistence
    const gradeId =
      typeof props.grade === "object" ? props.grade?._id : props.grade;
    const subjectId = props.selectedSubject?._id;

    const response = await api.post("/student-upload/ask", {
      question:
        "Please provide a comprehensive summary of the key topics, main concepts, and important points from my uploaded content.",
      grade: gradeId,
      subject: subjectId,
      sessionId: props.sessionId,
    });

    // Update the last message with summary
    const lastMsg = props.chatMessages[props.chatMessages.length - 1];
    lastMsg.answer = response.data.answer;

    if (response.data.sources?.length > 0) {
      lastMsg.answer += `\n\n📎 *Sources: ${response.data.sources.join(", ")}*`;
    }

    toastSuccess("📖 Summary generated!");
  } catch (error) {
    const lastMsg = props.chatMessages[props.chatMessages.length - 1];
    lastMsg.answer = `❌ Summary failed: ${
      error.response?.data?.message || error.message
    }`;
    toastError(
      `Summary generation failed: ${
        error.response?.data?.message || error.message
      }`,
    );
  } finally {
    generatingUploadSummary.value = false;
    loading.value = false;
  }
}

// Clear uploaded session
async function clearUploadSession() {
  try {
    await api.delete("/student-upload/clear");
    uploadedFileCount.value = 0;
    toastSuccess("🗑️ Upload session cleared");

    // Add system message
    props.chatMessages.push({
      question: "🗑️ Cleared uploaded content",
      answer:
        "Your uploaded files have been removed from this session. You can now upload new files or continue with the textbook content.",
    });
  } catch (error) {
    toastError(`Failed to clear session: ${error.message}`);
  }
}

// Initialize internal selection from prop
watch(
  () => props.selectedUnit,
  (newVal) => {
    internalSelectedUnit.value = newVal;
  },
  { immediate: true },
);

// Populate textarea / Auto send
watch(internalSelectedUnit, (newVal) => {
  if (newVal && props.activeMode) {
    if (props.activeMode === "quiz") {
      const unitTitle = newVal.title || newVal.unitNumber || "selected unit";
      text.value = unitTitle;
      nextTick(() => {
        const textarea = document.querySelector("textarea");
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(text.value.length, text.value.length);
        }
      });
    } else if (props.activeMode === "summarize") {
      send();
    }
  }
});

const features = [
  { id: "summarize", label: "Summarize", desc: "Summarize selected text" },
  { id: "quiz", label: "Quiz", desc: "Generate multiple-choice quiz" },
  { id: "presentation", label: "Presentation", desc: "Generate PPT Slides" },
];

function toggleFeature(id) {
  const next = props.activeMode === id ? null : id;
  emit("set-mode", next);

  if (next && next === "summarize" && internalSelectedUnit.value) {
    setTimeout(() => {
      if (props.activeMode === next) {
        send();
      }
    }, 100);
  }
}

function featureClass(id) {
  return props.activeMode === id
    ? "bg-cyan-600 ring-2 ring-cyan-400 scale-105 shadow-lg shadow-cyan-500/20"
    : "transition-colors"; // We handle the rest in :style
}

const placeholder = computed(() => {
  if (props.activeMode) {
    if (internalSelectedUnit.value) {
      return `Generate ${props.activeMode} for ${
        internalSelectedUnit.value.title || "selected unit"
      }...`;
    }
    return `Enter topic or select unit above to ${props.activeMode}...`;
  }
  return "Ask Lumi anything about this chapter...";
});

async function send() {
  // Allow empty text when activeMode is set with a selected unit
  if (!text.value.trim() && !props.activeMode) return;
  if (!text.value.trim() && props.activeMode && !internalSelectedUnit.value)
    return;

  // If student has uploaded files, use the student-upload ask endpoint
  if (uploadedFileCount.value > 0) {
    const question = text.value;
    text.value = "";

    // Add user message immediately
    props.chatMessages.push({
      question: question,
      answer: null,
    });

    loading.value = true;

    try {
      // Use Chat Logic: Send Titles instead of IDs to match Qdrant collection naming
      const gradeTitle =
        typeof props.grade === "object" ? props.grade?.title : props.grade;
      const subjectTitle =
        props.selectedSubject?.title || props.selectedSubject?.name;

      const response = await api.post("/student-upload/ask", {
        question,
        grade: gradeTitle,
        subject: subjectTitle,
        sessionId: currentSessionId.value,
      });

      // Update the last message with the answer
      const lastMsg = props.chatMessages[props.chatMessages.length - 1];
      lastMsg.answer = response.data.answer;
      lastMsg.responseMode = response.data.responseMode; // Capture mode

      if (response.data.sources?.length > 0) {
        lastMsg.answer += `\n\n📎 *Sources: ${response.data.sources.join(
          ", ",
        )}*`;
      }

      // Store new session ID if created
      if (response.data.sessionId && !currentSessionId.value) {
        handleSessionCreated(response.data.sessionId);
      }
    } catch (error) {
      const lastMsg = props.chatMessages[props.chatMessages.length - 1];
      lastMsg.answer = `❌ Error: ${
        error.response?.data?.message || error.message
      }`;
    } finally {
      loading.value = false;
    }

    await nextTick();
    if (chatContainer.value)
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    return;
  }

  // Regular chat flow (no uploaded files)
  const messagesRef = computed(() => props.chatMessages);

  await sendMessage({
    text: text.value,
    unit: internalSelectedUnit.value,
    activeMode: props.activeMode,
    grade: props.grade,
    subject: props.selectedSubject,
    sessionId: currentSessionId.value,
    chatMessagesRef: messagesRef,
    onSessionCreated: handleSessionCreated,
    quizConfig: {
      difficulty: quizDifficulty.value,
      questionType: quizQuestionType.value,
    },
  });

  text.value = "";

  await nextTick();
  if (chatContainer.value)
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
}

watch(
  () => props.chatMessages.length,
  async () => {
    await nextTick();
    if (chatContainer.value)
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  },
);
</script>

<style scoped>
/* ChatGPT-like "Clean & Crisp" Markdown Styling */
:deep(.prose h3) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff; /* White title */
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  letter-spacing: -0.01em;
}

:deep(.prose h4) {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0; /* slater-200 */
  margin-top: 1.25em;
  margin-bottom: 0.5em;
}

:deep(.prose p) {
  margin-bottom: 1em;
  line-height: 1.7; /* Relaxed reading */
  color: #cbd5e1; /* slate-300 */
}

:deep(.prose strong) {
  font-weight: 700;
  color: #fff; /* Pop out bold text */
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

:deep(.prose ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin-bottom: 1em;
  color: #cbd5e1;
}

:deep(.prose ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin-bottom: 1em;
  color: #cbd5e1;
}

:deep(.prose li) {
  margin-bottom: 0.5em;
  padding-left: 0.25em;
  color: #cbd5e1 !important;
}

:deep(.prose li::before) {
  content: none !important; /* Remove the global colored dot */
  display: none !important;
}

:deep(.prose blockquote) {
  border-left: 4px solid #475569; /* slate-600 */
  padding-left: 1em;
  font-style: italic;
  color: #94a3b8; /* slate-400 */
  margin: 1.5em 0;
}

:deep(.prose code) {
  background-color: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  border: none !important;
  font-family: inherit !important;
  font-weight: 700 !important;
  color: #38bdf8 !important; /* sky-400 */
}

:deep(.prose pre) {
  background-color: #0f172a; /* slate-900 */
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 1.5em 0;
  border: 1px solid #334155; /* slate-700 */
}

:deep(.prose pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.9em;
}

/* Elegant Tables */
:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.95em;
}

:deep(.prose th) {
  border-bottom: 2px solid #334155; /* slate-700 */
  padding: 0.75em 1em;
  text-align: left;
  font-weight: 600;
  color: #f8fafc; /* slate-50 */
}

:deep(.prose td) {
  border-bottom: 1px solid #1e293b; /* slate-800 */
  padding: 0.75em 1em;
  color: #cbd5e1; /* slate-300 */
}

:deep(.prose tr:last-child td) {
  border-bottom: none;
}

/* Mermaid Scroll Container */
:deep(.mermaid-diagram) {
  overflow-x: auto;
  background: #0f172a;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}
</style>
