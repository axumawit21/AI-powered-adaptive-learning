import { ref } from 'vue';
import { useToast } from '../../composables/useToast';

export function useExamSpeech() {
  const { info, error: toastError } = useToast();
  
  const isSpeechSupported = ref(false);
  const isRecording = ref(false);
  const interimTranscript = ref("");
  let recognition = null;
  let onTranscriptCallback = null;

  function initializeSpeechRecognition(onTranscript) {
    onTranscriptCallback = onTranscript;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
      
    if (!SpeechRecognition) {
      isSpeechSupported.value = false;
      console.warn("Speech recognition not supported in this browser");
      return;
    }
    
    isSpeechSupported.value = true;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript + " ";
          if (onTranscriptCallback) onTranscriptCallback(text);
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      interimTranscript.value = interim;
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      if (e.error === "not-allowed") {
        toastError("Microphone access denied. Please allow microphone permissions.");
        stopRecording();
      } else if (e.error === "no-speech") {
        console.log("No speech detected");
      } else if (e.error === "aborted") {
        isRecording.value = false;
      } else {
        toastError(`Speech recognition error: ${e.error}`);
        stopRecording();
      }
    };

    recognition.onend = () => {
      if (isRecording.value) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to restart recognition:", e);
          isRecording.value = false;
          interimTranscript.value = "";
        }
      }
    };

    recognition.onstart = () => {
      console.log("Speech recognition started");
      isRecording.value = true;
    };
  }

  function startRecording() {
    if (!recognition) {
      toastError("Speech recognition not available");
      return;
    }
    try {
      if (isRecording.value) recognition.stop();
      
      setTimeout(() => {
        try {
          recognition.start();
          info("🎤 Listening...");
        } catch (e) {
          if (e.name === "InvalidStateError") {
            isRecording.value = true;
          } else {
            console.error("Failed to start recognition:", e);
            toastError("Failed to start microphone");
            isRecording.value = false;
          }
        }
      }, 100);
    } catch (e) {
      console.error("Start recording error:", e);
      toastError("Failed to start dictation");
      isRecording.value = false;
    }
  }

  function stopRecording() {
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.error("Stop recording error:", e);
      }
    }
    isRecording.value = false;
    interimTranscript.value = "";
    info("Dictation stopped");
  }

  function toggleRecording() {
    if (isRecording.value) stopRecording();
    else startRecording();
  }

  return {
    isSpeechSupported,
    isRecording,
    interimTranscript,
    initializeSpeechRecognition,
    startRecording,
    stopRecording,
    toggleRecording
  };
}
