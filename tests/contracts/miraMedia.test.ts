import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startMiraRecording } from '../../services/miraMedia';

class FakeMediaRecorder {
  state: RecordingState = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_stream: MediaStream) {}
  start() { this.state = 'recording'; }
  stop() {
    if (this.state === 'inactive') throw new Error('already stopped');
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['recorded'], { type: this.mimeType }) });
    this.onstop?.();
  }
}

describe('Mira media recording completion', () => {
  const trackStop = vi.fn();
  beforeEach(() => {
    trackStop.mockClear();
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: trackStop }] })) },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('completes manual stop and releases tracks once', async () => {
    const recording = await startMiraRecording();
    await expect(recording.stop()).resolves.toMatchObject({ mimeType: 'audio/webm' });
    expect(trackStop).toHaveBeenCalledTimes(1);
  });

  it('returns the completed clip when Finish is called after auto-timeout', async () => {
    vi.useFakeTimers();
    const recording = await startMiraRecording({ maxSeconds: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    const completed = recording.stop();
    await vi.runAllTimersAsync();
    await expect(completed).resolves.toMatchObject({ mimeType: 'audio/webm' });
    expect(trackStop).toHaveBeenCalledTimes(1);
  });
});
