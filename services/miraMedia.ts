// Microphone capture and audio playback for Mira voice.
//
// Raw audio stays in memory only: it is sent to the Mira speech endpoint for
// transcription and then discarded. Only the transcript and Mira's reply text
// are persisted by the application.

export interface MiraRecordedClip {
  audioBase64: string;
  mimeType: string;
}

export interface MiraRecording {
  stop: () => Promise<MiraRecordedClip>;
  cancel: () => void;
}

export interface MiraAudioPlayback {
  done: Promise<void>;
  stop: () => void;
}

export function isMiraRecordingSupported(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const hasRecorder = typeof (globalThis as { MediaRecorder?: unknown }).MediaRecorder === 'function';
  const hasCapture = typeof navigator.mediaDevices?.getUserMedia === 'function';
  return hasRecorder && hasCapture;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error('The recording could not be read.'));
    reader.readAsDataURL(blob);
  });
}

export async function startMiraRecording(options: { maxSeconds?: number } = {}): Promise<MiraRecording> {
  if (!isMiraRecordingSupported()) {
    throw new Error('Voice recording is not supported in this browser. You can type instead.');
  }
  const maxSeconds = options.maxSeconds ?? 60;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  let released = false;
  const releaseStream = () => {
    if (released) return;
    released = true;
    stream.getTracks().forEach((track) => track.stop());
  };
  let cancelled = false;
  let resolveClip!: (clip: MiraRecordedClip) => void;
  let rejectClip!: (error: Error) => void;
  const completion = new Promise<MiraRecordedClip>((resolve, reject) => {
    resolveClip = resolve;
    rejectClip = reject;
  });
  let timeout: ReturnType<typeof setTimeout>;

  recorder.onstop = () => {
    clearTimeout(timeout);
    releaseStream();
    if (cancelled) return;
    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
    if (blob.size === 0) {
      rejectClip(new Error('No audio was recorded. Please try again.'));
      return;
    }
    void blobToBase64(blob).then(
      (audioBase64) => resolveClip({ audioBase64, mimeType: blob.type || 'audio/webm' }),
      (error) => rejectClip(error instanceof Error ? error : new Error('The recording could not be read.')),
    );
  };

  timeout = setTimeout(() => {
    if (recorder.state !== 'inactive') recorder.stop();
  }, maxSeconds * 1000);
  
  try {
    recorder.start();
  } catch (error) {
    clearTimeout(timeout);
    releaseStream();
    throw error instanceof Error ? error : new Error('Voice recording could not start.');
  }



  return {
    stop: () => {
      if (recorder.state !== 'inactive') recorder.stop();
      return completion;
    },
    cancel: () => {
      clearTimeout(timeout);
      cancelled = true;
      if (recorder.state !== 'inactive') recorder.stop();
      releaseStream();
    },
  };
}

export function playMiraAudio(source: string): MiraAudioPlayback {
  const audio = new Audio(source);
  const done = new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('The spoken reply could not be played.'));
    const started = audio.play();
    if (started && typeof started.catch === 'function') {
      started.catch(() => reject(new Error('The browser blocked audio playback.')));
    }
  });
  return {
    done,
    stop: () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Playback already finished.
      }
    },
  };
}
