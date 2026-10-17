/**
 * GramPay (BharatVoice Shield) - Resilient 16kHz Mono 16-bit PCM WAV Recorder
 * 
 * Specifically designed for mobile browsers (iOS Safari & Android Chrome)
 * to feed voice biometric and anti-spoofing verification engines (16,000 Hz, 1 channel, 16-bit linear PCM).
 */

export interface RecorderOptions {
  sampleRate?: number; // target sample rate, defaults to 16000
  timeLimitMs?: number; // max recording duration (e.g. 5000ms)
  onVolumeChange?: (volume: number) => void; // 0.0 to 1.0 for live mic feedback
}

export interface AudioRecordResult {
  wavBlob: Blob;
  wavBuffer: ArrayBuffer;
  durationMs: number;
  sampleRate: number;
  channels: number;
}

export class BharatVoiceRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private analyserNode: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private startTime: number = 0;
  private isRecording: boolean = false;
  private targetSampleRate: number = 16000;

  constructor(options?: RecorderOptions) {
    if (options?.sampleRate) {
      this.targetSampleRate = options.sampleRate;
    }
  }

  /**
   * Request microphone permission and prepare AudioContext.
   * Must be called during or after user gesture.
   */
  public async init(): Promise<void> {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.audioContext) {
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Start recording audio with live volume analysis for elderly visual feedback.
   */
  public async startRecording(options?: RecorderOptions): Promise<void> {
    await this.init();
    if (!this.audioContext) throw new Error("AudioContext not initialized");

    this.audioChunks = [];
    this.isRecording = true;
    this.startTime = Date.now();

    // Request high-quality speech constraints optimized for rural noisy environments
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    // Setup AnalyserNode for volume visualization
    if (options?.onVolumeChange) {
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      source.connect(this.analyserNode);

      const bufferLength = this.analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.isRecording || !this.analyserNode) return;
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1.0, average / 128.0);
        options.onVolumeChange!(normalized);
        this.animFrameId = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    }

    // Use MediaRecorder for robust chunk capture across mobile browsers
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      '' // browser default
    ];

    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (!mime || MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    this.mediaRecorder = selectedMime
      ? new MediaRecorder(this.mediaStream, { mimeType: selectedMime })
      : new MediaRecorder(this.mediaStream);

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // collect 100ms chunks

    // Optional auto-stop timer
    if (options?.timeLimitMs) {
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, options.timeLimitMs);
    }
  }

  /**
   * Stop recording, resample to 16,000 Hz mono, and encode to 16-bit PCM WAV.
   */
  public async stopRecording(): Promise<AudioRecordResult> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error("Recording is not in progress");
    }

    this.isRecording = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const durationMs = Date.now() - this.startTime;

    const rawBlob = await new Promise<Blob>((resolve) => {
      if (!this.mediaRecorder) return resolve(new Blob([]));
      this.mediaRecorder.onstop = () => {
        const fullBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });
        resolve(fullBlob);
      };
      this.mediaRecorder.stop();
    });

    // Release microphone hardware
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Step 2: Decode raw audio data to an AudioBuffer at native sample rate
    const arrayBuffer = await rawBlob.arrayBuffer();
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }

    const decodedBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Step 3: Resample to exact 16,000 Hz Mono using OfflineAudioContext (Polyphase high-fidelity sinc resampler)
    const resampledMonoBuffer = await this.resampleTo16kMono(decodedBuffer, this.targetSampleRate);

    // Step 4: Encode Float32 AudioBuffer to Standard 16-bit Linear PCM WAV
    const wavBuffer = this.encodeWAV(resampledMonoBuffer, this.targetSampleRate);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    return {
      wavBlob,
      wavBuffer,
      durationMs,
      sampleRate: this.targetSampleRate,
      channels: 1,
    };
  }

  /**
   * High-accuracy resampler using browser native OfflineAudioContext.
   */
  private async resampleTo16kMono(
    sourceBuffer: AudioBuffer,
    targetSampleRate: number = 16000
  ): Promise<Float32Array> {
    const numChannels = 1; // force mono
    const targetLength = Math.ceil(sourceBuffer.duration * targetSampleRate);

    const offlineCtx = new OfflineAudioContext(
      numChannels,
      targetLength,
      targetSampleRate
    );

    // Mix down all channels to mono if multi-channel
    const monoBuffer = offlineCtx.createBuffer(
      1,
      sourceBuffer.length,
      sourceBuffer.sampleRate
    );
    const monoChannelData = monoBuffer.getChannelData(0);

    if (sourceBuffer.numberOfChannels === 1) {
      monoChannelData.set(sourceBuffer.getChannelData(0));
    } else {
      const ch0 = sourceBuffer.getChannelData(0);
      const ch1 = sourceBuffer.getChannelData(1);
      for (let i = 0; i < sourceBuffer.length; i++) {
        monoChannelData[i] = (ch0[i] + ch1[i]) / 2;
      }
    }

    const bufferSource = offlineCtx.createBufferSource();
    bufferSource.buffer = monoBuffer;
    bufferSource.connect(offlineCtx.destination);
    bufferSource.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer.getChannelData(0);
  }

  /**
   * Encode 32-bit float samples (-1.0 to +1.0) into 16-bit PCM Little-Endian WAV.
   */
  private encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // 1. RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // ChunkSize
    this.writeString(view, 8, 'WAVE');

    // 2. "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = Linear PCM)
    view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate (16000)
    view.setUint32(28, byteRate, true); // ByteRate (16000 * 1 * 2 = 32000)
    view.setUint16(32, blockAlign, true); // BlockAlign (2 bytes)
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // 3. "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true); // Subchunk2Size

    // 4. Write PCM 16-bit samples (Float32 to Int16 with clamping)
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      // Clamp between -1.0 and 1.0 to avoid overflow distortion
      const s = Math.max(-1, Math.min(1, samples[i]));
      // Map to 16-bit signed integer [-32768, 32767]
      const int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, int16, true);
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Helper to inspect current state
   */
  public get recordingStatus(): boolean {
    return this.isRecording;
  }
}
