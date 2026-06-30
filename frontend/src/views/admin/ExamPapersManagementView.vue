<template>
  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Sidebar -->
    <!-- Sidebar -->
    <UnifiedDashboardSidebar />

    <!-- Main Content -->
    <main class="ml-64">
      <div class="exam-papers-management">
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1>Exam Papers Management</h1>
            <p class="subtitle">
              Upload, process, and approve Ethiopian exam papers
            </p>
          </div>
          <button class="btn-primary" @click="showUploadModal = true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Exam
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid" v-if="stats">
          <div class="stat-card processing">
            <div class="stat-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                />
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.processing }}</span>
              <span class="stat-label">Processing</span>
            </div>
          </div>
          <div class="stat-card pending">
            <div class="stat-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.pendingReview }}</span>
              <span class="stat-label">Pending Review</span>
            </div>
          </div>
          <div class="stat-card approved">
            <div class="stat-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.approved }}</span>
              <span class="stat-label">Approved</span>
            </div>
          </div>
          <div class="stat-card questions">
            <div class="stat-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.totalQuestions }}</span>
              <span class="stat-label">Total Questions</span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <select
            v-model="filters.gradeId"
            @change="fetchExamPapers"
            class="filter-select"
          >
            <option value="">All Grades</option>
            <option v-for="grade in grades" :key="grade._id" :value="grade._id">
              {{ grade.title }}
            </option>
          </select>
          <select
            v-model="filters.status"
            @change="fetchExamPapers"
            class="filter-select"
          >
            <option value="">All Status</option>
            <option value="processing">Processing</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading exam papers...</p>
        </div>

        <!-- Exam Papers List -->
        <div v-else class="papers-list">
          <div v-if="papers.length === 0" class="empty-state">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>No exam papers uploaded yet</p>
            <button class="btn-primary" @click="showUploadModal = true">
              Upload First Exam
            </button>
          </div>

          <div
            v-else
            class="paper-card"
            v-for="paper in papers"
            :key="paper._id"
          >
            <div class="paper-header" @click="togglePaper(paper._id)">
              <div class="paper-info">
                <h3>{{ paper.subjectTitle }} - {{ paper.examYear }}</h3>
                <span class="paper-grade">{{ paper.gradeTitle }}</span>
                <span class="paper-file">{{ paper.fileName }}</span>
              </div>
              <div class="paper-status">
                <span :class="['status-badge', paper.status]">{{
                  formatStatus(paper.status)
                }}</span>
                <span class="questions-count"
                  >{{ paper.approvedQuestionsCount }}/{{
                    paper.questionsCount
                  }}
                  questions</span
                >
              </div>
              <div class="paper-actions">
                <button
                  v-if="paper.status === 'pending_review'"
                  class="btn-approve-all"
                  @click.stop="approveAllQuestions(paper._id)"
                >
                  Approve All
                </button>
                <button
                  class="btn-icon"
                  @click.stop="reprocessPaper(paper._id)"
                  title="Reprocess"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
                <button
                  class="btn-icon danger"
                  @click.stop="deletePaper(paper._id)"
                  title="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Expanded Questions -->
            <div v-if="expandedPaper === paper._id" class="paper-questions">
              <div v-if="loadingQuestions" class="loading-questions">
                <div class="spinner small"></div>
                Loading questions...
              </div>
              <div v-else-if="questions.length === 0" class="no-questions">
                <p v-if="paper.processingError">
                  Error: {{ paper.processingError }}
                </p>
                <div v-else class="empty-state">
                  <p>No questions extracted yet</p>
                  <button
                    class="btn-primary mt-4"
                    @click="addManualQuestion(paper._id)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="mr-2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Question Manually
                  </button>
                </div>
              </div>
              <div v-else class="questions-list">
                <div class="questions-actions mb-4 flex justify-end">
                  <button
                    class="btn-sm btn-secondary flex items-center gap-2"
                    @click="addManualQuestion(paper._id)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Missing Question
                  </button>
                </div>
                <div
                  v-for="q in questions"
                  :key="q._id"
                  :class="['question-item', q.approvalStatus]"
                >
                  <div class="question-header">
                    <span class="question-number">Q{{ q.questionNumber }}</span>
                    <span :class="['approval-badge', q.approvalStatus]">{{
                      q.approvalStatus
                    }}</span>
                  </div>
                  <div class="question-content">
                    <p class="question-text">{{ q.question }}</p>
                    <ul class="options-list">
                      <li
                        v-for="(opt, idx) in q.options"
                        :key="idx"
                        :class="{ correct: opt.startsWith(q.answer) }"
                      >
                        {{ opt }}
                      </li>
                    </ul>
                    <div class="question-meta">
                      <div class="hint">
                        <strong>Hint:</strong> {{ q.hint }}
                      </div>
                      <div class="explanation">
                        <strong>Explanation:</strong> {{ q.explanation }}
                      </div>
                      <div v-if="q.hasImage" class="image-info">
                        <span class="image-badge">📷 Has Image</span>
                        <span v-if="q.imageDescription" class="image-desc"
                          >{{ q.imageDescription.substring(0, 100)
                          }}{{
                            q.imageDescription.length > 100 ? "..." : ""
                          }}</span
                        >
                      </div>
                    </div>
                  </div>
                  <div class="question-actions">
                    <button
                      v-if="q.approvalStatus !== 'approved'"
                      class="btn-sm approve"
                      @click="approveQuestion(paper._id, q._id)"
                    >
                      Approve
                    </button>
                    <button
                      v-if="q.approvalStatus !== 'rejected'"
                      class="btn-sm reject"
                      @click="rejectQuestion(paper._id, q._id)"
                    >
                      Reject
                    </button>
                    <button class="btn-sm edit" @click="openEditModal(q)">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Modal -->
        <div
          v-if="showUploadModal"
          class="modal-overlay"
          @click.self="showUploadModal = false"
        >
          <div class="modal-content">
            <div class="modal-header">
              <h2>Upload Exam Paper</h2>
              <button class="close-btn" @click="showUploadModal = false">
                &times;
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Grade</label>
                <select v-model="uploadForm.gradeId" required>
                  <option value="">Select Grade</option>
                  <option
                    v-for="grade in grades"
                    :key="grade._id"
                    :value="grade._id"
                  >
                    {{ grade.title }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Subject</label>
                <select v-model="uploadForm.subjectId" required>
                  <option value="">Select Subject</option>
                  <option
                    v-for="subject in subjects"
                    :key="subject._id"
                    :value="subject._id"
                  >
                    {{ subject.title }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Exam Year</label>
                <input
                  type="number"
                  v-model.number="uploadForm.examYear"
                  min="2000"
                  max="2100"
                  required
                />
              </div>
              <div class="form-group">
                <label>Exam File (PDF, DOCX, PNG, JPG)</label>
                <div
                  class="file-upload"
                  @click="$refs.fileInput.click()"
                  @dragover.prevent
                  @drop.prevent="handleFileDrop"
                >
                  <input
                    type="file"
                    ref="fileInput"
                    @change="handleFileSelect"
                    accept=".pdf,.docx,.png,.jpg,.jpeg"
                    hidden
                  />
                  <div v-if="uploadForm.file">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{{ uploadForm.file.name }}</span>
                  </div>
                  <div v-else>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Click or drag file here</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="showUploadModal = false">
                Cancel
              </button>
              <button
                class="btn-primary"
                @click="uploadExam"
                :disabled="uploading || !isUploadFormValid"
              >
                {{ uploading ? "Uploading..." : "Upload & Process" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Question Modal -->
        <div
          v-if="editingQuestion"
          class="modal-overlay"
          @click.self="editingQuestion = null"
        >
          <div class="modal-content wide">
            <div class="modal-header">
              <h2>Edit Question #{{ editingQuestion.questionNumber }}</h2>
              <button class="close-btn" @click="editingQuestion = null">
                &times;
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Question Text</label>
                <textarea v-model="editForm.question" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Options</label>
                <div
                  v-for="(opt, idx) in editForm.options"
                  :key="idx"
                  class="option-input-row"
                >
                  <div class="option-text-input">
                    <span class="option-label"
                      >{{ ["A", "B", "C", "D"][idx] }}.</span
                    >
                    <input type="text" v-model="editForm.options[idx]" />
                  </div>
                  <div class="option-image-section">
                    <!-- Option Image Preview -->
                    <div
                      v-if="
                        editForm.optionImageUrls &&
                        editForm.optionImageUrls[idx]
                      "
                      class="option-image-preview"
                    >
                      <img
                        :src="getFullImageUrl(editForm.optionImageUrls[idx])"
                        :alt="
                          editForm.optionImageDescriptions?.[idx] ||
                          'Option image'
                        "
                        class="option-img-thumb"
                      />
                      <button
                        class="btn-remove-option-image"
                        @click="removeOptionImage(idx)"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                    <!-- Upload Button -->
                    <input
                      type="file"
                      :ref="(el) => (optionImageInputs[idx] = el)"
                      @change="(e) => handleOptionImageUpload(idx, e)"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      hidden
                    />
                    <button
                      class="btn-upload-option-image"
                      @click="optionImageInputs[idx]?.click()"
                      :disabled="analyzingOptionImage === idx"
                      v-if="!editForm.optionImageUrls?.[idx]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      {{
                        analyzingOptionImage === idx
                          ? "Analyzing..."
                          : "Add Image"
                      }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Correct Answer (A, B, C, or D)</label>
                <input type="text" v-model="editForm.answer" maxlength="1" />
              </div>
              <div class="form-group">
                <label>Hint</label>
                <textarea v-model="editForm.hint" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>Explanation</label>
                <textarea v-model="editForm.explanation" rows="3"></textarea>
              </div>

              <!-- Image Fields -->
              <div class="form-group image-section">
                <label class="section-label">Question Image</label>

                <!-- Image Preview (if exists) -->
                <div v-if="editForm.imageUrl" class="image-preview">
                  <img
                    :src="getFullImageUrl(editForm.imageUrl)"
                    :alt="editForm.imageDescription || 'Question image'"
                  />
                  <button
                    class="btn-remove-image"
                    @click="removeImage"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>

                <!-- Upload Button -->
                <div class="image-upload-area">
                  <input
                    type="file"
                    ref="imageInput"
                    @change="handleImageUpload"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    hidden
                  />
                  <button
                    class="btn-upload-image"
                    @click="$refs.imageInput.click()"
                    :disabled="analyzingImage"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    {{
                      analyzingImage ? "Analyzing..." : "Upload & Analyze Image"
                    }}
                  </button>
                  <small class="field-hint"
                    >Upload an image and AI will analyze it to generate
                    description, hint, and explanation</small
                  >
                </div>

                <!-- Show analysis results -->
                <div
                  v-if="editForm.hasImage && editForm.imageDescription"
                  class="analysis-result"
                >
                  <label>AI-Generated Description</label>
                  <textarea
                    v-model="editForm.imageDescription"
                    rows="2"
                  ></textarea>
                  <small class="field-hint success-text"
                    >✓ AI analyzed the image. You can edit the description
                    above.</small
                  >
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="editingQuestion = null">
                Cancel
              </button>
              <button
                class="btn-primary"
                @click="saveQuestion"
                :disabled="
                  saving || (editForm.hasImage && !editForm.imageDescription)
                "
              >
                {{ saving ? "Saving..." : "Save Changes" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { examPaperService } from "../../services/examPaperService";
import api from "../../services/api";
import { useToast } from "../../composables/useToast";
import UnifiedDashboardSidebar from "../../components/shared/UnifiedDashboardSidebar.vue";

const { success, error: toastError } = useToast();

// State
const stats = ref(null);
const papers = ref([]);
const questions = ref([]);
const grades = ref([]);
const subjects = ref([]);
const loading = ref(true);
const loadingQuestions = ref(false);
const uploading = ref(false);
const saving = ref(false);
const showUploadModal = ref(false);
const expandedPaper = ref(null);
const editingQuestion = ref(null);
const analyzingImage = ref(false);
const analyzingOptionImage = ref(null); // Track which option is being analyzed (0, 1, 2, or 3)
const optionImageInputs = ref([]); // Refs for file inputs

const filters = ref({
  gradeId: "",
  status: "",
});

const uploadForm = ref({
  gradeId: "",
  subjectId: "",
  examYear: new Date().getFullYear(),
  file: null,
});

const editForm = ref({
  question: "",
  options: [],
  answer: "",
  hint: "",
  explanation: "",
  hasImage: false,
  imageUrl: "",
  imageDescription: "",
  optionImageUrls: [null, null, null, null],
  optionImageDescriptions: [null, null, null, null],
});

// Computed
const filteredSubjects = computed(() => {
  if (!uploadForm.value.gradeId) return [];
  const selectedGradeId = uploadForm.value.gradeId;
  return subjects.value.filter((s) => {
    // Handle different possible field names and ObjectId vs string comparison
    const subjectGradeId = s.gradeId || s.grade;
    if (!subjectGradeId) return false;
    // Convert to string for comparison (handles ObjectId)
    const gradeIdStr =
      typeof subjectGradeId === "object"
        ? subjectGradeId.toString()
        : subjectGradeId;
    return (
      gradeIdStr === selectedGradeId ||
      gradeIdStr === selectedGradeId.toString()
    );
  });
});

const isUploadFormValid = computed(() => {
  return (
    uploadForm.value.gradeId &&
    uploadForm.value.subjectId &&
    uploadForm.value.examYear &&
    uploadForm.value.file
  );
});

// Methods
async function addManualQuestion(paperId) {
  // Find the highest question number to suggest the next one
  const maxNum = questions.value.reduce(
    (max, q) => Math.max(max, q.questionNumber || 0),
    0,
  );
  const nextNum = maxNum + 1;

  const questionNumber = prompt(
    `Enter Question Number (e.g., ${nextNum}):`,
    nextNum,
  );
  if (!questionNumber) return;

  try {
    const num = parseInt(questionNumber);
    if (isNaN(num)) throw new Error("Invalid number");

    const toasts = useToast();
    toasts.info("Creating question...", 2000);

    const newQuestion = await examPaperService.createQuestion(paperId, {
      questionNumber: num,
    });

    toasts.success(`Question ${num} created!`);

    // Refresh list then open edit modal
    await loadQuestions(paperId);

    // Find the new question and open edit modal
    const createdQ = questions.value.find((q) => q._id === newQuestion._id);
    if (createdQ) {
      openEditModal(createdQ);
      // Show hint about image upload
      setTimeout(() => {
        toasts.info("You can now upload the question image in the edit modal", {
          timeout: 5000,
        });
      }, 500);
    }
  } catch (error) {
    console.error("Failed to create question:", error);
    useToast().error(`Failed to create question: ${error.message}`);
  }
}

async function fetchStats() {
  try {
    stats.value = await examPaperService.getDashboardStats();
  } catch (err) {
    console.error("Failed to fetch stats:", err);
  }
}

async function fetchExamPapers() {
  loading.value = true;
  try {
    const result = await examPaperService.listExamPapers(filters.value);
    papers.value = result.papers || [];
  } catch (err) {
    console.error("Failed to fetch exam papers:", err);
    toastError("Failed to load exam papers");
  } finally {
    loading.value = false;
  }
}

async function fetchGradesAndSubjects() {
  try {
    const [gradesRes, subjectsRes] = await Promise.all([
      api.get("/grades"),
      api.get("/subjects"),
    ]);
    grades.value = gradesRes.data || [];
    subjects.value = subjectsRes.data || [];
  } catch (err) {
    console.error("Failed to fetch grades/subjects:", err);
  }
}

async function togglePaper(paperId) {
  if (expandedPaper.value === paperId) {
    expandedPaper.value = null;
    questions.value = [];
  } else {
    expandedPaper.value = paperId;
    await fetchQuestions(paperId);
  }
}

async function fetchQuestions(paperId) {
  loadingQuestions.value = true;
  try {
    questions.value = await examPaperService.getQuestionsForReview(paperId);
  } catch (err) {
    console.error("Failed to fetch questions:", err);
    questions.value = [];
  } finally {
    loadingQuestions.value = false;
  }
}

function handleFileSelect(event) {
  uploadForm.value.file = event.target.files[0];
}

function handleFileDrop(event) {
  uploadForm.value.file = event.dataTransfer.files[0];
}

async function uploadExam() {
  if (!isUploadFormValid.value) return;

  uploading.value = true;
  try {
    await examPaperService.uploadExamPaper(uploadForm.value.file, {
      gradeId: uploadForm.value.gradeId,
      subjectId: uploadForm.value.subjectId,
      examYear: uploadForm.value.examYear,
    });
    success("Exam uploaded! Processing started...");
    showUploadModal.value = false;
    uploadForm.value = {
      gradeId: "",
      subjectId: "",
      examYear: new Date().getFullYear(),
      file: null,
    };
    await fetchExamPapers();
    await fetchStats();
  } catch (err) {
    console.error("Upload failed:", err);
    toastError(
      "Failed to upload exam: " + (err.response?.data?.message || err.message),
    );
  } finally {
    uploading.value = false;
  }
}

async function approveQuestion(paperId, questionId) {
  try {
    await examPaperService.setQuestionStatus(paperId, questionId, "approved");
    success("Question approved");
    await fetchQuestions(paperId);
    await fetchExamPapers();
    await fetchStats();
  } catch (err) {
    toastError("Failed to approve question");
  }
}

async function rejectQuestion(paperId, questionId) {
  try {
    await examPaperService.setQuestionStatus(paperId, questionId, "rejected");
    success("Question rejected");
    await fetchQuestions(paperId);
    await fetchExamPapers();
    await fetchStats();
  } catch (err) {
    toastError("Failed to reject question");
  }
}

async function approveAllQuestions(paperId) {
  try {
    await examPaperService.approveAllQuestions(paperId);
    success("All questions approved!");
    await fetchExamPapers();
    await fetchStats();
    if (expandedPaper.value === paperId) {
      await fetchQuestions(paperId);
    }
  } catch (err) {
    toastError("Failed to approve all questions");
  }
}

async function reprocessPaper(paperId) {
  if (
    !confirm(
      "This will delete existing questions and re-extract from the file. Continue?",
    )
  )
    return;
  try {
    await examPaperService.reprocessExamPaper(paperId);
    success("Reprocessing started");
    await fetchExamPapers();
    await fetchStats();
  } catch (err) {
    toastError("Failed to reprocess");
  }
}

async function deletePaper(paperId) {
  if (!confirm("Delete this exam paper and all its questions?")) return;
  try {
    await examPaperService.deleteExamPaper(paperId);
    success("Exam paper deleted");
    await fetchExamPapers();
    await fetchStats();
  } catch (err) {
    toastError("Failed to delete");
  }
}

function openEditModal(question) {
  editingQuestion.value = question;
  editForm.value = {
    question: question.question,
    options: [...question.options],
    answer: question.answer,
    hint: question.hint,
    explanation: question.explanation,
    hasImage: question.hasImage || false,
    imageUrl: question.imageUrl || "",
    imageDescription: question.imageDescription || "",
    optionImageUrls: question.optionImageUrls || [null, null, null, null],
    optionImageDescriptions: question.optionImageDescriptions || [
      null,
      null,
      null,
      null,
    ],
  };
}

async function saveQuestion() {
  saving.value = true;
  try {
    const paperId = expandedPaper.value;
    await examPaperService.updateQuestion(
      paperId,
      editingQuestion.value._id,
      editForm.value,
    );
    success("Question updated");
    editingQuestion.value = null;
    await fetchQuestions(paperId);
  } catch (err) {
    toastError("Failed to save question");
  } finally {
    saving.value = false;
  }
}

// Image handling functions
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  analyzingImage.value = true;
  try {
    const paperId = expandedPaper.value;
    const questionId = editingQuestion.value._id;

    // Call API to upload and analyze image
    const result = await examPaperService.analyzeQuestionImage(
      paperId,
      questionId,
      file,
    );

    // Update form with AI-generated data
    editForm.value.hasImage = true;
    editForm.value.imageUrl = result.imageUrl;
    editForm.value.imageDescription = result.imageDescription || "";
    if (result.hint) editForm.value.hint = result.hint;
    if (result.explanation) editForm.value.explanation = result.explanation;
    if (result.answer) editForm.value.answer = result.answer;

    success("Image analyzed successfully! Review the generated content.");
  } catch (err) {
    console.error("Image analysis failed:", err);
    toastError(
      "Failed to analyze image: " +
        (err.response?.data?.message || err.message),
    );
  } finally {
    analyzingImage.value = false;
    event.target.value = ""; // Reset file input
  }
}

function removeImage() {
  editForm.value.hasImage = false;
  editForm.value.imageUrl = "";
  editForm.value.imageDescription = "";
}

// Option image handling functions
async function handleOptionImageUpload(optionIndex, event) {
  const file = event.target.files[0];
  if (!file) return;

  analyzingOptionImage.value = optionIndex;
  try {
    const paperId = expandedPaper.value;
    const questionId = editingQuestion.value._id;

    // Call API to upload and analyze option image
    const result = await examPaperService.analyzeOptionImage(
      paperId,
      questionId,
      optionIndex,
      file,
    );

    // Update form with the new option image data
    editForm.value.optionImageUrls[optionIndex] =
      result.optionImageUrls[optionIndex];
    editForm.value.optionImageDescriptions[optionIndex] =
      result.optionImageDescriptions[optionIndex];

    const optionLabels = ["A", "B", "C", "D"];
    success(`Option ${optionLabels[optionIndex]} image analyzed successfully!`);
  } catch (err) {
    console.error("Option image analysis failed:", err);
    toastError(
      "Failed to analyze option image: " +
        (err.response?.data?.message || err.message),
    );
  } finally {
    analyzingOptionImage.value = null;
    event.target.value = ""; // Reset file input
  }
}

function removeOptionImage(optionIndex) {
  editForm.value.optionImageUrls[optionIndex] = null;
  editForm.value.optionImageDescriptions[optionIndex] = null;
}

function getFullImageUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${baseUrl}${relativePath}`;
}

function formatStatus(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

onMounted(async () => {
  await Promise.all([fetchGradesAndSubjects(), fetchStats()]);
  await fetchExamPapers();
});
</script>

<style scoped>
.exam-papers-management {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}

.subtitle {
  color: #94a3b8;
  margin: 0.25rem 0 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #1e293b;
  border-radius: 12px;
  border: 1px solid #334155;
}

.stat-icon {
  padding: 0.75rem;
  border-radius: 10px;
  display: flex;
}

.stat-card.processing .stat-icon {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}
.stat-card.pending .stat-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
.stat-card.approved .stat-icon {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}
.stat-card.questions .stat-icon {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
}

.stat-label {
  font-size: 0.875rem;
  color: #94a3b8;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-select {
  padding: 0.625rem 1rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  min-width: 150px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin: 0;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.paper-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.paper-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.paper-header:hover {
  background: #273549;
}

.paper-info {
  flex: 1;
}

.paper-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 0.25rem;
}

.paper-grade,
.paper-file {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-right: 1rem;
}

.paper-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-right: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.processing {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}
.status-badge.pending_review {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
.status-badge.approved {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}
.status-badge.rejected {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.questions-count {
  font-size: 0.85rem;
  color: #94a3b8;
}

.paper-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-approve-all {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-approve-all:hover {
  background: #059669;
}

.btn-icon {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #334155;
  color: #f1f5f9;
}

.btn-icon.danger:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #ef4444;
}

.paper-questions {
  border-top: 1px solid #334155;
  padding: 1rem 1.25rem;
  background: #0f172a;
}

.loading-questions,
.no-questions {
  padding: 1rem;
  text-align: center;
  color: #94a3b8;
}

.question-item {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.question-item.approved {
  border-left: 3px solid #10b981;
}
.question-item.pending {
  border-left: 3px solid #fbbf24;
}
.question-item.needs_review {
  border-left: 3px solid #f97316;
}
.question-item.rejected {
  border-left: 3px solid #ef4444;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.question-number {
  font-weight: 700;
  color: #3b82f6;
}

.approval-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.approval-badge.approved {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}
.approval-badge.pending {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}
.approval-badge.needs_review {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}
.approval-badge.rejected {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.question-text {
  color: #f1f5f9;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
}

.options-list li {
  padding: 0.375rem 0.75rem;
  margin-bottom: 0.25rem;
  background: #0f172a;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.options-list li.correct {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid #10b981;
}

.question-meta {
  font-size: 0.85rem;
  color: #94a3b8;
}

.hint,
.explanation {
  margin-bottom: 0.375rem;
}

.question-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #334155;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-sm.approve {
  background: #10b981;
  color: white;
}
.btn-sm.reject {
  background: #ef4444;
  color: white;
}
.btn-sm.edit {
  background: #3b82f6;
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1e293b;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.wide {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #334155;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #f1f5f9;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e2e8f0;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.option-input {
  margin-bottom: 0.5rem;
}

.file-upload {
  border: 2px dashed #475569;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #94a3b8;
}

.file-upload:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #334155;
}

.btn-secondary {
  padding: 0.75rem 1.25rem;
  background: #334155;
  color: #e2e8f0;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #475569;
}

/* Image-related styles */
.image-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #e2e8f0;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.image-fields {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid #334155;
  border-radius: 8px;
}

.field-hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.required {
  color: #ef4444;
}

.form-group textarea.error,
.form-group input.error {
  border-color: #ef4444;
}

.error-text {
  color: #ef4444 !important;
}

.image-info {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.image-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.image-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  font-style: italic;
}

/* Image Upload Styles */
.section-label {
  display: block;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 0.75rem;
}

.image-preview {
  position: relative;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #334155;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  display: block;
}

.btn-remove-image {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-area {
  margin-bottom: 1rem;
}

.btn-upload-image {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upload-image:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-upload-image:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.analysis-result {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid #10b981;
  border-radius: 8px;
}

.analysis-result label {
  font-weight: 600;
  color: #10b981;
  margin-bottom: 0.5rem;
}

.success-text {
  color: #10b981 !important;
}

/* Option Image Styles */
.option-input-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
}

.option-text-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-label {
  font-weight: 600;
  color: #94a3b8;
  min-width: 24px;
}

.option-text-input input {
  flex: 1;
}

.option-image-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-image-preview {
  position: relative;
  display: inline-block;
}

.option-img-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid #3b82f6;
}

.btn-remove-option-image {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-upload-option-image {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: #334155;
  color: #94a3b8;
  border: 1px solid #475569;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-upload-option-image:hover:not(:disabled) {
  background: #475569;
  color: #e2e8f0;
  border-color: #3b82f6;
}

.btn-upload-option-image:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
