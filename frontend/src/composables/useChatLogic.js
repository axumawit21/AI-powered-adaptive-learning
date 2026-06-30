import { ref } from "vue";
import api from "../services/api";
import chatService from "../services/chatService";
import { enhancedQuizApi } from "../services/enhancedQuizService";
import MarkdownIt from "markdown-it";
import { useToast } from "./useToast";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

export function useChatLogic() {
  const { error: toastError, warning } = useToast();

  const loading = ref(false);
  const isGenerating = ref(false);
  const showApiKeyModal = ref(false);

  // ── Helpers ──────────────────────────────────────────────────────
  function isQuotaError(err) {
    const status = err?.response?.status;
    const msg = (err?.response?.data?.message || err?.message || "").toLowerCase();
    return (
      status === 429 ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("resource exhausted")
    );
  }

  function renderMarkdown(content) {
    if (!content) return "";
    return md.render(content);
  }

  /**
   * Split an assistant message body from suggested follow-up questions.
   * The backend may return a "🔮 Follow-up Questions" marker.
   */
  function parseMessage(rawText) {
    if (!rawText) return { body: "", questions: [] };

    const markerRegex = /#{0,3}\s*🔮\s*Follow-up Questions/i;
    const match = rawText.match(markerRegex);

    if (!match) {
      return { body: rawText, questions: [] };
    }

    const body = rawText.substring(0, match.index).trim();
    const questionsPart = rawText.substring(match.index + match[0].length);
    const questions = [];

    // Strategy 1: numbered list
    const numbered = questionsPart.match(/^\d+\.\s+(.+)$/gm);
    if (numbered) questions.push(...numbered.map((m) => m.replace(/^\d+\.\s+/, "").trim()));

    // Strategy 2: bullet list
    const bullets = questionsPart.match(/^[-*•]\s+(.+)$/gm);
    if (bullets) questions.push(...bullets.map((m) => m.replace(/^[-*•]\s+/, "").trim()));

    // Strategy 3: plain lines with "?"
    if (questions.length === 0) {
      questionsPart
        .split("\n")
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length > 10 &&
            !l.toLowerCase().startsWith("here are") &&
            !l.toLowerCase().startsWith("here's") &&
            !l.match(/^#{1,6}\s/) &&
            l.includes("?")
        )
        .forEach((l) => questions.push(l));
    }

    const cleaned = questions
      .map((q) => q.replace(/\*\*/g, "").replace(/\*/g, "").trim())
      .filter((q) => q.length > 5);

    return { body, questions: cleaned };
  }

  // ── Extract scope from a unit object ─────────────────────────────
  /**
   * Given a unit object (from the unit/subunit selector in the UI), extract:
   *   - selectedUnit   : numeric unit number
   *   - selectedSubunit: subunit string like "2.3"
   *   - unitTitle      : the parent unit's title
   *   - subunitTitle   : the subunit's own title (when a subunit is selected)
   *
   * The UI passes these two different shapes:
   *   Unit selected  → { unitNumber, title, subunitNumber: null }
   *   Subunit selected → { unitNumber, title (subunit title), parentUnitTitle, subunitNumber }
   */
  function extractScopeFromUnit(unit) {
    if (!unit) {
      return { selectedUnit: undefined, selectedSubunit: undefined, unitTitle: null, subunitTitle: null };
    }

    const selectedUnit = unit.unitNumber ?? unit.parentUnitNumber ?? unit.number ?? undefined;
    const selectedSubunit = unit.subunitNumber ?? unit.subunit ?? undefined;
    const isSubunitSelected = !!selectedSubunit;

    let unitTitle, subunitTitle;
    if (isSubunitSelected) {
      // unit.title is the SUBUNIT title; parent unit title is stored separately
      subunitTitle = unit.title ?? unit.subUnitTitle ?? null;
      unitTitle = unit.parentUnitTitle ?? unit.unitTitle ?? null;
    } else {
      unitTitle = unit.title ?? unit.unitTitle ?? unit.name ?? null;
      subunitTitle = null;
    }

    return { selectedUnit, selectedSubunit, unitTitle, subunitTitle };
  }

  // ── Main sendMessage function ─────────────────────────────────────
  /**
   * @param {Object} params
   * @param {string}        params.text           - User input text
   * @param {Object|null}   params.unit           - Selected unit/subunit object from UI
   * @param {string|null}   params.activeMode     - 'chat' | 'summarize' | 'quiz' | 'presentation' | null
   * @param {Object|null}   params.grade          - Grade object { _id, title }
   * @param {Object|null}   params.subject        - Subject object { _id, title }
   * @param {string|null}   params.sessionId      - Current session ID
   * @param {Ref<Array>}    params.chatMessagesRef - Reactive array of messages for this chat
   * @param {Function}      [params.onSessionCreated] - Called with new sessionId when session is created
   * @param {Object}        [params.quizConfig]   - { difficulty, questionType }
   */
  async function sendMessage({
    text = "",
    unit = null,
    activeMode = null,
    grade = null,
    subject = null,
    sessionId = null,
    chatMessagesRef,
    onSessionCreated = () => {},
    quizConfig = { difficulty: "mixed", questionType: null },
  }) {
    let questionText = text.trim();

    // If no text but we have a unit + active mode, use unit title as the topic
    if (!questionText && unit && activeMode) {
      questionText = unit.title || String(unit.unitNumber || "");
    }
    if (!questionText) return;

    // Push placeholder message for immediate UI feedback
    chatMessagesRef.value.push({ question: questionText, answer: null });
    loading.value = true;

    let answer = "";
    let quizQuestions = null;
    let isQuiz = false;
    let summaryData = null;
    let presentationData = null;

    const gradeTitle = grade?.title ?? (typeof grade === "string" ? grade : "Unknown Grade");
    const subjectTitle =
      subject?.title ?? subject?.name ?? (subject?._id ? "Subject " + subject._id : "Unknown Subject");

    try {
      if (activeMode && activeMode !== "chat") {
        // ── Generative Mode (summarize / presentation / quiz) ─────
        if (!unit && !questionText) {
          warning("Please select a unit or enter a topic.");
          chatMessagesRef.value.pop();
          loading.value = false;
          return;
        }

        if (activeMode === "summarize") {
          const isSubunit = !!(unit?.subunitNumber);
          const unitName = unit ? unit.title || String(unit.unitNumber) : questionText;

          try {
            const params = {
              grade: gradeTitle,
              subject: subjectTitle,
              unit: isSubunit
                ? unit.parentUnitTitle || String(unit.unitNumber?.toString().split(".")[0])
                : unitName,
            };
            if (isSubunit) params.subunit = unit.subunitNumber;

            const res = await api.get("summary", { params });
            if (res.data.ok && res.data.data) {
              summaryData = {
                unit: res.data.data.unit,
                subunit: res.data.data.subunit,
                general: res.data.data.generalSummary,
                detailed: res.data.data.detailedSummary,
                keywords: res.data.data.keyConcepts || [],
                audioFilePath: res.data.data.audioFilePath,
                customAudioUrl: res.data.data.customAudioUrl,
                view: "general",
              };
              answer = null;
            } else {
              const targetName = isSubunit ? `subunit ${unit.subunitNumber}` : "this unit";
              answer = `No summary available for ${targetName}. Please ask your teacher to generate it.`;
              warning(answer);
            }
          } catch (e) {
            console.error("Summary fetch failed", e);
            answer = "No summary found for this unit.";
            warning(answer);
          }

        } else if (activeMode === "presentation") {
          const unitName = unit ? unit.title || String(unit.unitNumber) : questionText;
          try {
            const res = await api.get("presentation", {
              params: { grade: gradeTitle, subject: subjectTitle, unit: unitName },
            });
            if (res.data.ok && res.data.data) {
              presentationData = res.data.data;
              answer = null;
            } else {
              answer = "No generated PPT for specified unit. Please ask your teacher to generate it.";
              warning(answer);
            }
          } catch (e) {
            console.error("Presentation fetch failed", e);
            answer = "No generated PPT found for this unit.";
            warning(answer);
          }

        } else if (activeMode === "quiz") {
          isQuiz = true;
          const { difficulty, questionType } = quizConfig;
          const topicToUse = text.trim() || (unit ? unit.title || String(unit.unitNumber) : "");

          let finalSubjectId = subject?._id || subject?.id;
          let finalGradeId = typeof grade === "string" ? grade : grade?._id;

          // Legacy biology fix
          if (subjectTitle?.toLowerCase().includes("biology")) {
            finalSubjectId = "6932e7f267eb0ae78befc8b7";
            finalGradeId = "6932d444c809fa0ba44756df";
          }

          try {
            const quizSession = await enhancedQuizApi.startQuiz({
              subjectId: finalSubjectId || "unknown",
              gradeId: finalGradeId,
              unitNumber: unit?.unitNumber ?? undefined,
              unitTitle: unit?.title ?? topicToUse,
              questionCount: 10,
              difficulty,
              questionTypes: !questionType || questionType === "mixed" ? undefined : [questionType],
            });
            quizQuestions = {
              sessionId: quizSession.sessionId,
              currentQuestion: quizSession.question,
              totalQuestions: quizSession.totalQuestions,
              currentIndex: 0,
              score: 0,
            };
            answer = `Quiz started! ${quizSession.totalQuestions} questions ready. Good luck! 🎉`;
          } catch (e) {
            console.error("Quiz start failed", e);
            isQuiz = false;
            if (isQuotaError(e)) {
              showApiKeyModal.value = true;
              answer = "⚠️ AI quota exceeded. Please add your own API key to continue.";
            } else {
              answer = e.response?.data?.message || "Failed to start quiz.";
            }
            toastError(answer);
          }
        }

      } else {
        // ── Normal Chat Mode ──────────────────────────────────────
        const { selectedUnit, selectedSubunit, unitTitle, subunitTitle } = extractScopeFromUnit(unit);

        console.log("[useChatLogic] Chat scope:", {
          selectedUnit,
          selectedSubunit,
          unitTitle,
          subunitTitle,
        });

        // Create session if needed
        let currentSession = sessionId;
        if (!currentSession) {
          try {
            const sessionData = await chatService.createSession({
              firstMessage: questionText,
              grade: gradeTitle,
              subject: subjectTitle,
            });
            currentSession = sessionData._id;
            onSessionCreated(currentSession);
          } catch (e) {
            console.error("Failed to create session", e);
          }
        }

        // Call /chat/ask with full scoped context
        const payload = {
          grade: gradeTitle,
          subject: subjectTitle,
          question: questionText,
          sessionId: currentSession,
          selectedUnit,       // numeric unit number → enables unit-scoped semantic search
          selectedSubunit,    // subunit string → enables subunit-scoped semantic search  
          unitTitle,          // title fallback when no numeric unit number
          subunitTitle,       // subunit title for title-based scope
        };

        try {
          const data = await chatService.askQuestion(payload);
          answer = data?.answer || data?.message || "No answer received.";

          // Attach suggested questions to the message if returned
          if (data?.suggestedQuestions?.length) {
            const lastMsg = chatMessagesRef.value[chatMessagesRef.value.length - 1];
            if (lastMsg) lastMsg.suggestedQuestions = data.suggestedQuestions;
          }
        } catch (e) {
          console.error("Chat error:", e);
          if (isQuotaError(e)) {
            showApiKeyModal.value = true;
            answer = "⚠️ AI quota exceeded. Please add your own API key to continue using AI features.";
            toastError("AI quota exceeded");
          } else if (e.response?.status === 401) {
            answer = "❌ Session expired. Please log in again.";
            toastError("Session expired — please log in again");
          } else if (e.response?.data?.message) {
            answer = `❌ Error: ${e.response.data.message}`;
            toastError(e.response.data.message);
          } else {
            answer = "❌ Error connecting to backend. Please check your connection.";
            toastError("Message delivery failed");
          }
        }
      }

      // ── Update the message in the chat list ────────────────────
      const lastMsg = chatMessagesRef.value[chatMessagesRef.value.length - 1];
      if (lastMsg) {
        if (isQuiz) {
          lastMsg.quiz = quizQuestions;
          lastMsg.answer = answer;
        } else if (summaryData) {
          lastMsg.summaryData = summaryData;
          lastMsg.answer = null;
        } else if (presentationData) {
          lastMsg.presentationData = presentationData;
          lastMsg.answer = null;
        } else {
          lastMsg.answer = answer;
        }
      }
    } catch (err) {
      console.error("Critical sendMessage Error:", err);
      const lastMsg = chatMessagesRef.value[chatMessagesRef.value.length - 1];
      if (lastMsg) lastMsg.answer = "An unexpected error occurred. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    isGenerating,
    showApiKeyModal,
    sendMessage,
    renderMarkdown,
    parseMessage,
    extractScopeFromUnit,
  };
}
