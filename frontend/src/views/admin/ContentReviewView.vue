<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar (same as ContentModerationView) -->
    <aside
      class="fixed left-0 top-0 w-64 h-screen bg-slate-800 border-r border-slate-700 p-4"
    >
      <div class="flex items-center gap-3 mb-8">
        <div
          class="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-500"
        ></div>
        <h1 class="text-xl font-bold">Admin Panel</h1>
      </div>

      <nav class="space-y-2">
        <router-link
          to="/admin"
          class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-5 h-5 text-cyan-400"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          Dashboard
        </router-link>
        <router-link
          to="/admin/content-moderation"
          class="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-5 h-5 text-emerald-400"
          >
            <path d="M9 11l3 3L22 4" />
            <path
              d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
            />
          </svg>
          Content Moderation
        </router-link>
      </nav>

      <button
        @click="logout"
        class="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        Logout
      </button>
    </aside>

    <!-- Main Content -->
    <main class="ml-64 p-8">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <button
          @click="goBack"
          class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-5 h-5"
          >
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to List
        </button>
        <h1 class="text-3xl font-bold">Review Content</h1>
        <span :class="getStatusBadgeClass(content.status)" class="ml-4">
          {{ content.status || "pending" }}
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="flex items-center gap-3">
          <div
            class="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"
          ></div>
          Loading content...
        </div>
      </div>

      <!-- Content Review Form -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content Editor -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Question Content (for questions) -->
          <div
            v-if="contentType === 'question'"
            class="bg-slate-800 p-6 rounded-xl border border-slate-700"
          >
            <h3 class="text-lg font-bold mb-4 text-cyan-400">
              Question Content
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-slate-400 mb-2"
                  >Question Text</label
                >
                <textarea
                  v-model="content.question"
                  rows="4"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
                ></textarea>
              </div>

              <div v-if="content.options && content.options.length > 0">
                <label class="block text-sm font-bold text-slate-400 mb-2"
                  >Options</label
                >
                <div class="space-y-2">
                  <div
                    v-for="(option, index) in content.options"
                    :key="index"
                    class="flex items-center gap-3"
                  >
                    <span
                      class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-600 text-sm font-bold"
                    >
                      {{ String.fromCharCode(65 + index) }}
                    </span>
                    <input
                      v-model="content.options[index]"
                      class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <span
                      v-if="isCorrectOption(option)"
                      class="text-emerald-400 font-bold text-sm"
                    >
                      ✓ Correct
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-2"
                  >Correct Answer</label
                >
                <input
                  v-model="content.answer"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-2"
                  >Hint</label
                >
                <textarea
                  v-model="content.hint"
                  rows="2"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-2"
                  >Explanation</label
                >
                <textarea
                  v-model="content.explanation"
                  rows="3"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Summary Content -->
          <div
            v-if="contentType === 'summary'"
            class="bg-slate-800 p-6 rounded-xl border border-slate-700"
          >
            <h3 class="text-lg font-bold mb-4 text-cyan-400">
              Summary Content
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-slate-400 mb-2"
                  >General Summary</label
                >
                <textarea
                  v-model="content.generalSummary"
                  rows="6"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-2"
                  >Detailed Summary</label
                >
                <textarea
                  v-model="content.detailedSummary"
                  rows="10"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-2"
                  >Key Concepts</label
                >
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="(concept, index) in content.keyConcepts"
                    :key="index"
                    class="px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-full text-sm flex items-center gap-2"
                  >
                    {{ concept }}
                    <button
                      @click="removeKeyConcept(index)"
                      class="hover:text-red-400"
                    >
                      ✕
                    </button>
                  </span>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newKeyConcept"
                    @keypress.enter="addKeyConcept"
                    placeholder="Add key concept..."
                    class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                  <button
                    @click="addKeyConcept"
                    class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <!-- Teacher Audio Script -->
              <div
                v-if="content.teacherAudioScript"
                class="border-t border-slate-600 pt-4 mt-4"
              >
                <h4 class="text-md font-bold mb-3 text-orange-400">
                  🎙️ Teacher Audio Script
                </h4>

                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-bold text-slate-400 mb-1"
                      >Introduction</label
                    >
                    <textarea
                      v-model="content.teacherAudioScript.introduction"
                      rows="4"
                      class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                    ></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-slate-400 mb-1"
                      >Explanation</label
                    >
                    <textarea
                      v-model="content.teacherAudioScript.explanation"
                      rows="6"
                      class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                    ></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-slate-400 mb-1"
                      >Examples</label
                    >
                    <textarea
                      v-model="content.teacherAudioScript.examples"
                      rows="4"
                      class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                    ></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-slate-400 mb-1"
                      >Recap</label
                    >
                    <textarea
                      v-model="content.teacherAudioScript.recap"
                      rows="3"
                      class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Dialogue Script -->
              <div
                v-if="
                  content.dialogueScript && content.dialogueScript.length > 0
                "
                class="border-t border-slate-600 pt-4 mt-4"
              >
                <h4 class="text-md font-bold mb-3 text-purple-400">
                  🎭 Dialogue Script
                </h4>

                <div class="space-y-2 max-h-96 overflow-y-auto">
                  <div
                    v-for="(entry, index) in content.dialogueScript"
                    :key="index"
                    class="flex items-start gap-2"
                  >
                    <span
                      :class="
                        entry.speaker === 'female'
                          ? 'bg-pink-600/20 text-pink-400'
                          : 'bg-blue-600/20 text-blue-400'
                      "
                      class="px-2 py-1 rounded text-xs font-bold shrink-0 w-16 text-center"
                    >
                      {{ entry.speaker }}
                    </span>
                    <input
                      v-model="entry.text"
                      class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <button
                      @click="removeDialogueEntry(index)"
                      class="text-red-400 hover:text-red-300 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Presentation Content -->
          <div
            v-if="contentType === 'presentation'"
            class="bg-slate-800 p-6 rounded-xl border border-slate-700"
          >
            <h3 class="text-lg font-bold mb-4 text-cyan-400">
              Presentation Slides
            </h3>

            <div class="space-y-6">
              <div
                v-for="(slide, index) in content.slides"
                :key="index"
                class="bg-slate-750 p-4 rounded-lg border border-slate-600"
              >
                <div class="flex items-center gap-3 mb-3">
                  <span
                    class="w-8 h-8 flex items-center justify-center rounded-full bg-cyan-600 text-sm font-bold"
                  >
                    {{ slide.slideNumber }}
                  </span>
                  <input
                    v-model="slide.title"
                    class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                    placeholder="Slide Title"
                  />
                </div>
                <div class="space-y-2">
                  <div
                    v-for="(bullet, bIndex) in slide.bulletPoints"
                    :key="bIndex"
                    class="flex items-center gap-2"
                  >
                    <span class="text-cyan-400">•</span>
                    <input
                      v-model="slide.bulletPoints[bIndex]"
                      class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <button
                      @click="removeBulletPoint(index, bIndex)"
                      class="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    @click="addBulletPoint(index)"
                    class="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    + Add bullet point
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Quiz Content -->
          <div
            v-if="contentType === 'quiz'"
            class="bg-slate-800 p-6 rounded-xl border border-slate-700"
          >
            <h3 class="text-lg font-bold mb-4 text-cyan-400">Quiz Questions</h3>

            <div class="space-y-4">
              <div class="text-slate-400 mb-4">
                This quiz contains
                {{ content.questions?.length || 0 }} questions. To edit
                individual questions, please use the Question Bank management.
              </div>
              <div
                v-for="(question, index) in content.questions"
                :key="index"
                class="bg-slate-750 p-4 rounded-lg border border-slate-600"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="w-8 h-8 flex items-center justify-center rounded-full bg-cyan-600 text-sm font-bold shrink-0"
                  >
                    {{ index + 1 }}
                  </span>
                  <div class="flex-1">
                    <p class="font-medium">{{ question.question }}</p>
                    <p class="text-sm text-emerald-400 mt-1">
                      Answer: {{ question.answer }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar - Metadata & Actions -->
        <div class="space-y-6">
          <!-- Metadata -->
          <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 class="text-lg font-bold mb-4 text-cyan-400">Metadata</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Content Type</label
                >
                <div class="text-white capitalize">{{ contentType }}</div>
              </div>

              <div v-if="contentType === 'question'">
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Question Type</label
                >
                <div class="text-white">{{ content.type }}</div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Subject</label
                >
                <div class="text-white">
                  {{ content.subjectTitle || content.subject || "-" }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Unit</label
                >
                <div class="text-white">
                  {{ content.unitTitle || content.unit || "-" }}
                </div>
              </div>

              <div v-if="contentType === 'question'">
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Difficulty</label
                >
                <select
                  v-model="content.difficulty"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Source</label
                >
                <div class="text-white">
                  {{ content.source || "llm-generated" }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Created</label
                >
                <div class="text-white text-sm">
                  {{ formatDate(content.createdAt) }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Last Updated</label
                >
                <div class="text-white text-sm">
                  {{ formatDate(content.updatedAt) }}
                </div>
              </div>

              <div v-if="content.reviewedBy">
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Reviewed By</label
                >
                <div class="text-white">{{ content.reviewedBy }}</div>
              </div>

              <div v-if="content.reviewerComment">
                <label class="block text-sm font-bold text-slate-400 mb-1"
                  >Reviewer Comment</label
                >
                <div class="text-white text-sm bg-slate-700 p-3 rounded-lg">
                  {{ content.reviewerComment }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 class="text-lg font-bold mb-4 text-cyan-400">Actions</h3>

            <div class="space-y-3">
              <button
                @click="saveChanges"
                :disabled="saving"
                class="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span v-if="saving">Saving...</span>
                <span v-else>💾 Save Changes</span>
              </button>

              <button
                @click="showApproveModal = true"
                :disabled="content.status === 'approved'"
                class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                ✓ Approve Content
              </button>

              <button
                @click="showSuspendModal = true"
                :disabled="content.status === 'suspended'"
                class="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                ✕ Suspend Content
              </button>
            </div>
          </div>

          <!-- Audio Generation (for summaries) -->
          <div
            v-if="contentType === 'summary'"
            class="bg-slate-800 p-6 rounded-xl border border-slate-700"
          >
            <h3 class="text-lg font-bold mb-4 text-orange-400">
              🎙️ Audio Generation
            </h3>

            <!-- Audio Player (if audio exists) -->
            <div v-if="content.audioFilePath" class="mb-4">
              <label class="block text-sm font-bold text-slate-400 mb-2"
                >Generated Audio</label
              >
              <audio
                controls
                :src="getAudioUrl(content.audioFilePath)"
                class="w-full"
              ></audio>
              <div class="text-xs text-slate-500 mt-1">
                Generated: {{ formatDate(content.audioGeneratedAt) }}
              </div>
            </div>

            <!-- Loading State -->
            <div
              v-if="generatingAudio"
              class="mb-4 p-4 bg-slate-700 rounded-lg text-center"
            >
              <div
                class="animate-spin inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mb-2"
              ></div>
              <p class="text-cyan-400 font-bold">{{ audioStatusMessage }}</p>
              <p class="text-sm text-slate-400">
                This may take 30-60 seconds...
              </p>
            </div>

            <!-- Error Message -->
            <div
              v-if="audioError"
              class="mb-4 p-3 bg-red-900/30 border border-red-600 rounded-lg"
            >
              <p class="text-red-400 text-sm">{{ audioError }}</p>
            </div>

            <!-- Generate Audio Buttons -->
            <div class="space-y-2">
              <button
                @click="generateDialogueAudio"
                :disabled="generatingAudio || !hasDialogueScript"
                class="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-bold"
              >
                <span v-if="generatingAudio && audioType === 'dialogue'">
                  <span class="animate-pulse">🔄 Generating Dialogue...</span>
                </span>
                <span v-else>🎭 Generate Dialogue Audio</span>
              </button>
              <button
                @click="generateTeacherAudio"
                :disabled="generatingAudio || !hasTeacherScript"
                class="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-bold"
              >
                <span v-if="generatingAudio && audioType === 'teacher'">
                  <span class="animate-pulse"
                    >🔄 Generating Teacher Audio...</span
                  >
                </span>
                <span v-else>👩‍🏫 Generate Teacher Audio</span>
              </button>
              <p
                v-if="!hasDialogueScript && !hasTeacherScript"
                class="text-sm text-amber-400 text-center"
              >
                ⚠️ No audio script available. Generate a new summary with audio
                scripts.
              </p>
              <p
                v-else-if="hasTeacherScript && !hasDialogueScript"
                class="text-xs text-slate-500 text-center"
              >
                ℹ️ Only teacher script available
              </p>
              <p
                v-else-if="hasDialogueScript"
                class="text-xs text-slate-500 text-center"
              >
                ℹ️ Both dialogue and teacher scripts available
              </p>
            </div>
          </div>

          <!-- Reviewer Comment -->
          <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 class="text-lg font-bold mb-4 text-cyan-400">
              Add Review Note
            </h3>
            <textarea
              v-model="reviewerComment"
              rows="4"
              placeholder="Add a note about this content..."
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Approve Modal -->
      <div
        v-if="showApproveModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <div
          class="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl"
        >
          <h2 class="text-2xl font-bold mb-4 text-emerald-400">
            Approve Content
          </h2>
          <p class="text-slate-300 mb-6">
            Are you sure you want to approve this content? It will become
            visible to students.
          </p>
          <div class="mb-6">
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Comment (optional)</label
            >
            <textarea
              v-model="approveComment"
              rows="3"
              placeholder="Add a reviewer comment..."
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            ></textarea>
          </div>
          <div class="flex gap-4">
            <button
              @click="showApproveModal = false"
              class="flex-1 bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="approveContent"
              class="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </div>

      <!-- Suspend Modal -->
      <div
        v-if="showSuspendModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <div
          class="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl"
        >
          <h2 class="text-2xl font-bold mb-4 text-red-400">Suspend Content</h2>
          <p class="text-slate-300 mb-6">
            Are you sure you want to suspend this content? It will be hidden
            from students.
          </p>
          <div class="mb-6">
            <label class="block text-sm font-bold text-slate-400 mb-1"
              >Reason (optional)</label
            >
            <textarea
              v-model="suspendComment"
              rows="3"
              placeholder="Explain why this content is being suspended..."
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
            ></textarea>
          </div>
          <div class="flex gap-4">
            <button
              @click="showSuspendModal = false"
              class="flex-1 bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="suspendContent"
              class="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Confirm Suspension
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import contentModerationService from "../../services/contentModeration";
import ttsService from "../../services/ttsService";

const router = useRouter();
const route = useRoute();

// Props from route
const contentType = computed(() => route.params.type);
const contentId = computed(() => route.params.id);

// State
const loading = ref(true);
const saving = ref(false);
const content = ref({});
const reviewerComment = ref("");
const newKeyConcept = ref("");
const generatingAudio = ref(false);
const audioStatusMessage = ref("");
const audioError = ref("");
const audioType = ref("");

// Computed properties for audio scripts
const hasDialogueScript = computed(() => {
  return (
    content.value.dialogueScript && content.value.dialogueScript.length > 0
  );
});

const hasTeacherScript = computed(() => {
  return (
    content.value.teacherAudioScript &&
    (content.value.teacherAudioScript.introduction ||
      content.value.teacherAudioScript.explanation ||
      content.value.teacherAudioScript.examples ||
      content.value.teacherAudioScript.recap)
  );
});

// Modals
const showApproveModal = ref(false);
const showSuspendModal = ref(false);
const approveComment = ref("");
const suspendComment = ref("");

// Fetch content
async function fetchContent() {
  loading.value = true;
  try {
    const res = await contentModerationService.getContentById(
      contentType.value,
      contentId.value
    );
    content.value = res.data;
  } catch (err) {
    console.error("Failed to fetch content:", err);
    router.push("/admin/content-moderation");
  } finally {
    loading.value = false;
  }
}

// Actions
async function saveChanges() {
  saving.value = true;
  try {
    let updateData = {};

    if (contentType.value === "question") {
      updateData = {
        question: content.value.question,
        options: content.value.options,
        answer: content.value.answer,
        hint: content.value.hint,
        explanation: content.value.explanation,
        difficulty: content.value.difficulty,
      };
      await contentModerationService.updateQuestion(
        contentId.value,
        updateData
      );
    } else if (contentType.value === "summary") {
      updateData = {
        generalSummary: content.value.generalSummary,
        detailedSummary: content.value.detailedSummary,
        keyConcepts: content.value.keyConcepts,
        teacherAudioScript: content.value.teacherAudioScript,
        dialogueScript: content.value.dialogueScript,
      };
      await contentModerationService.updateSummary(contentId.value, updateData);
    } else if (contentType.value === "presentation") {
      updateData = {
        slides: content.value.slides,
      };
      await contentModerationService.updatePresentation(
        contentId.value,
        updateData
      );
    }

    // Refresh content
    await fetchContent();
  } catch (err) {
    console.error("Failed to save changes:", err);
  } finally {
    saving.value = false;
  }
}

async function approveContent() {
  try {
    await contentModerationService.approveContent(
      contentType.value,
      contentId.value,
      approveComment.value || reviewerComment.value
    );
    showApproveModal.value = false;
    approveComment.value = "";
    await fetchContent();
  } catch (err) {
    console.error("Failed to approve content:", err);
  }
}

async function suspendContent() {
  try {
    await contentModerationService.suspendContent(
      contentType.value,
      contentId.value,
      suspendComment.value
    );
    showSuspendModal.value = false;
    suspendComment.value = "";
    await fetchContent();
  } catch (err) {
    console.error("Failed to suspend content:", err);
  }
}

// Helper functions for summary
function addKeyConcept() {
  if (newKeyConcept.value.trim()) {
    if (!content.value.keyConcepts) {
      content.value.keyConcepts = [];
    }
    content.value.keyConcepts.push(newKeyConcept.value.trim());
    newKeyConcept.value = "";
  }
}

function removeKeyConcept(index) {
  content.value.keyConcepts.splice(index, 1);
}

function removeDialogueEntry(index) {
  if (content.value.dialogueScript) {
    content.value.dialogueScript.splice(index, 1);
  }
}

// Audio generation functions
async function generateDialogueAudio() {
  console.log("Starting dialogue audio generation for:", contentId.value);
  audioError.value = "";
  audioType.value = "dialogue";
  audioStatusMessage.value =
    "Generating dialogue audio with male and female voices...";
  generatingAudio.value = true;

  try {
    const response = await ttsService.generateDialogueAudio(contentId.value);
    console.log("Dialogue audio response:", response);
    audioStatusMessage.value = "Audio generated! Refreshing...";
    await fetchContent(); // Refresh to get audio path
  } catch (err) {
    console.error("Failed to generate dialogue audio:", err);
    audioError.value = `Failed to generate dialogue audio: ${
      err.response?.data?.message || err.message
    }`;
  } finally {
    generatingAudio.value = false;
    audioStatusMessage.value = "";
    audioType.value = "";
  }
}

async function generateTeacherAudio() {
  console.log("Starting teacher audio generation for:", contentId.value);
  audioError.value = "";
  audioType.value = "teacher";
  audioStatusMessage.value = "Generating teacher-style audio...";
  generatingAudio.value = true;

  try {
    const response = await ttsService.generateTeacherAudio(contentId.value);
    console.log("Teacher audio response:", response);
    audioStatusMessage.value = "Audio generated! Refreshing...";
    await fetchContent(); // Refresh to get audio path
  } catch (err) {
    console.error("Failed to generate teacher audio:", err);
    audioError.value = `Failed to generate teacher audio: ${
      err.response?.data?.message || err.message
    }`;
  } finally {
    generatingAudio.value = false;
    audioStatusMessage.value = "";
    audioType.value = "";
  }
}

function getAudioUrl(filename) {
  return ttsService.getAudioUrl(filename);
}

// Helper functions for presentation
function addBulletPoint(slideIndex) {
  content.value.slides[slideIndex].bulletPoints.push("");
}

function removeBulletPoint(slideIndex, bulletIndex) {
  content.value.slides[slideIndex].bulletPoints.splice(bulletIndex, 1);
}

// Check if option is correct answer
function isCorrectOption(option) {
  if (!content.value.answer) return false;
  const answerLetter = content.value.answer.charAt(0).toUpperCase();
  const optionLetter = option.charAt(0).toUpperCase();
  return answerLetter === optionLetter;
}

// UI helpers
function getStatusBadgeClass(status) {
  const classes = {
    pending:
      "px-3 py-1 rounded-full text-sm font-bold bg-amber-600/20 text-amber-400",
    approved:
      "px-3 py-1 rounded-full text-sm font-bold bg-emerald-600/20 text-emerald-400",
    suspended:
      "px-3 py-1 rounded-full text-sm font-bold bg-red-600/20 text-red-400",
  };
  return (
    classes[status] ||
    "px-3 py-1 rounded-full text-sm font-bold bg-slate-600/20 text-slate-400"
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function goBack() {
  router.push("/admin/content-moderation");
}

function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
  delete axios.defaults.headers.common["Authorization"];
  router.push("/admin/login");
}

// Lifecycle
onMounted(() => {
  fetchContent();
});
</script>

<style scoped>
.bg-slate-750 {
  background-color: rgb(41, 48, 66);
}
</style>
