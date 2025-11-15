// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceRecognitionHook {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const createVoiceRecognition = (
  onResult: (result: VoiceRecognitionResult) => void,
  onError?: (error: string) => void
) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();

  // Enhanced configuration for better continuous speech recognition
  recognition.continuous = true; // Keep listening
  recognition.interimResults = true; // Get results while speaking
  recognition.lang = "en-US";

  let finalTranscript = "";
  let silenceTimer: NodeJS.Timeout | null = null;
  let isManualStop = false;

  // Clear silence timer
  const clearSilenceTimer = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  };

  // Start silence timer (3 seconds of no speech)
  const startSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimer = setTimeout(() => {
      console.log("3 seconds of silence detected, finalizing...");
      if (finalTranscript.trim()) {
        onResult({
          transcript: finalTranscript.trim(),
          confidence: 1.0,
          isFinal: true,
        });
      }
      recognition.stop();
    }, 1000);
  };

  recognition.onstart = () => {
    console.log("Voice recognition started");
    finalTranscript = "";
    isManualStop = false;
    clearSilenceTimer();
  };

  recognition.onresult = (event: any) => {
    clearSilenceTimer(); // Reset timer on new speech

    let interimTranscript = "";

    // Process all results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
        console.log("Final transcript segment:", transcript);
      } else {
        interimTranscript += transcript;
      }
    }

    // Send current combined transcript (interim or accumulated)
    const currentTranscript = (finalTranscript + interimTranscript).trim();
    if (currentTranscript) {
      onResult({
        transcript: currentTranscript,
        confidence:
          event.results[event.results.length - 1][0].confidence || 0.5,
        isFinal: false,
      });
    }

    // Start silence timer after receiving speech
    startSilenceTimer();
  };

  recognition.onerror = (event: any) => {
    clearSilenceTimer();
    console.error("Speech recognition error:", event.error);

    // Don't report "no-speech" as an error if we already have transcript
    if (event.error === "no-speech" && finalTranscript.trim()) {
      onResult({
        transcript: finalTranscript.trim(),
        confidence: 1.0,
        isFinal: true,
      });
      return;
    }

    // Ignore aborted error on manual stop
    if (event.error === "aborted" && isManualStop) {
      return;
    }

    if (onError) {
      const errorMessages: { [key: string]: string } = {
        "no-speech": "No speech detected. Please try again.",
        "audio-capture": "Microphone not found. Please check your device.",
        "not-allowed":
          "Microphone access denied. Please allow microphone access.",
        network: "Network error. Please check your connection.",
      };

      onError(
        errorMessages[event.error] || `Speech recognition error: ${event.error}`
      );
    }
  };

  recognition.onend = () => {
    clearSilenceTimer();
    console.log("Voice recognition ended");

    // If there's accumulated transcript and it wasn't a manual stop, send final result
    if (finalTranscript.trim() && !isManualStop) {
      onResult({
        transcript: finalTranscript.trim(),
        confidence: 1.0,
        isFinal: true,
      });
    }
  };

  // Return recognition object with enhanced methods
  return {
    ...recognition,
    start: () => {
      isManualStop = false;
      recognition.start();
    },
    stop: () => {
      isManualStop = true;
      clearSilenceTimer();
      recognition.stop();
    },
    abort: () => {
      isManualStop = true;
      clearSilenceTimer();
      recognition.abort();
    },
  };
};
