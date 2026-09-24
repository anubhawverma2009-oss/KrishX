/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Native Browser Speech Synthesis & Recognition Utility for KrishX
// Zero Paid API Dependency - 100% Client-Side Native Browser Support

class VoiceAssistantService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any | null = null;
  private isListeningState = false;
  private voices: SpeechSynthesisVoice[] = [];
  private activeSpeakingId: string | null = null;
  private listeners: Set<(activeId: string | null) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }

    // Initialize Web Speech Recognition if supported
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        this.recognition = new SpeechRecognitionAPI();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public subscribe(listener: (activeId: string | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.activeSpeakingId);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.activeSpeakingId);
      } catch (err) {
        console.error("Speech listener error:", err);
      }
    });
  }

  public getActiveSpeakingId(): string | null {
    return this.activeSpeakingId;
  }

  /**
   * Selects best matching voice:
   * - Hindi: Prioritize hi-IN (Hindi - India)
   * - English: Prioritize en-IN (English - India), fallback to en-US/en-GB
   */
  public getBestVoice(lang: 'hi' | 'en'): SpeechSynthesisVoice | null {
    const available = this.voices.length > 0 ? this.voices : (this.synth ? this.synth.getVoices() : []);
    if (!available || available.length === 0) return null;

    if (lang === 'hi') {
      // 1. hi-IN
      const hiIn = available.find(v => {
        const code = v.lang.toLowerCase();
        return code === 'hi-in' || code === 'hi_in';
      });
      if (hiIn) return hiIn;

      // 2. Any voice tagged 'hi' or named 'Hindi'
      const anyHi = available.find(v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (anyHi) return anyHi;
    } else {
      // English: Prefer Indian English (en-IN)
      const enIn = available.find(v => {
        const code = v.lang.toLowerCase();
        return code === 'en-in' || code === 'en_in' || (code.startsWith('en') && v.name.toLowerCase().includes('india'));
      });
      if (enIn) return enIn;

      // Fallback: any English voice
      const anyEn = available.find(v => v.lang.toLowerCase().startsWith('en'));
      if (anyEn) return anyEn;
    }

    return available[0] || null;
  }

  /**
   * Speak content for a specific post or element ID.
   * Cancels any currently active speech first to prevent overlapping.
   */
  public speakForId(
    id: string,
    text: string,
    lang: 'hi' | 'en' = 'hi',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
  ) {
    if (!this.synth) {
      console.warn("SpeechSynthesis not supported in this browser.");
      if (onError) onError();
      return;
    }

    // If already speaking this exact ID, stop it (toggle action)
    if (this.activeSpeakingId === id) {
      this.stop();
      return;
    }

    // Always stop any other ongoing speech (no overlapping audio)
    this.stop();

    if (!text || !text.trim()) return;

    // Clean text of markdown formatting and URLs for speech synthesis
    const cleanText = text
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/[*#_`\[\]()~>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoice = this.getBestVoice(lang);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Calm, respectful pace for farmers
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.activeSpeakingId = id;
      this.notifyListeners();
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (this.activeSpeakingId === id) {
        this.activeSpeakingId = null;
        this.notifyListeners();
      }
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = (e: any) => {
      // Speech cancellation or interruption is expected when stopping or switching audio
      const errorCode = e?.error || '';
      if (errorCode === 'canceled' || errorCode === 'interrupted') {
        if (this.activeSpeakingId === id) {
          this.activeSpeakingId = null;
          this.notifyListeners();
        }
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
        }
        return;
      }

      console.warn("SpeechSynthesis notification:", errorCode || 'interrupted');
      if (this.activeSpeakingId === id) {
        this.activeSpeakingId = null;
        this.notifyListeners();
      }
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      if (onError) onError();
    };

    this.currentUtterance = utterance;
    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn("SpeechSynthesis speak exception:", err);
      if (this.activeSpeakingId === id) {
        this.activeSpeakingId = null;
        this.notifyListeners();
      }
      this.currentUtterance = null;
      if (onError) onError();
    }
  }

  // --- TEXT TO SPEECH (GLOBAL / ASSISTANT) ---
  public speak(
    text: string, 
    lang: 'hi' | 'en' = 'hi', 
    onStart?: () => void, 
    onEnd?: () => void,
    onError?: () => void
  ) {
    this.speakForId('global', text, lang, onStart, onEnd, onError);
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.currentUtterance) {
      // Detach handlers before cancel to prevent spurious canceled onerror events
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
        if (this.synth.paused) {
          this.synth.resume();
        }
      } catch (err) {
        // ignore
      }
    }
    if (this.activeSpeakingId !== null) {
      this.activeSpeakingId = null;
      this.notifyListeners();
    }
  }

  public isSpeaking(): boolean {
    return !!this.synth && (this.synth.speaking || this.synth.paused);
  }

  // --- SPEECH RECOGNITION (VOICE ASSISTANT) ---
  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    lang: string = 'hi-IN'
  ) {
    if (!this.recognition) {
      onError("Speech recognition is not supported in your browser. Please type your command.");
      return;
    }

    try {
      this.recognition.lang = lang;
      this.isListeningState = true;

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        onResult(transcript.trim(), isFinal);
      };

      this.recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        this.isListeningState = false;
        if (event.error === 'not-allowed') {
          onError("Microphone permission denied. Please enable microphone access.");
        } else {
          onError(`Speech recognition error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListeningState = false;
        onEnd();
      };

      this.recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      this.isListeningState = false;
      onError("Could not start microphone listening.");
    }
  }

  public stopListening() {
    if (this.recognition && this.isListeningState) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListeningState = false;
    }
  }

  // --- INTENT CLASSIFICATION ENGINE (LEVEL 1 & LEVEL 2) ---
  public classifyIntent(transcript: string): {
    action: 'navigate' | 'open_modal' | 'read_content' | 'ai_query' | 'unknown';
    target?: string;
    displayText: string;
  } {
    const text = transcript.toLowerCase().trim();

    // Level 1: Local Navigation & App Actions
    if (
      text.includes('profile') || 
      text.includes('प्रोफाइल') || 
      text.includes('मेरी प्रोफाइल') ||
      text.includes('apni profile')
    ) {
      return { action: 'navigate', target: 'profile', displayText: 'Opening your Farmer Profile...' };
    }

    if (
      text.includes('home') || 
      text.includes('feed') || 
      text.includes('होम') || 
      text.includes('मुख्य पृष्ठ') ||
      text.includes('फीड')
    ) {
      return { action: 'navigate', target: 'home', displayText: 'Opening Home Feed...' };
    }

    if (
      text.includes('network') || 
      text.includes('discover') || 
      text.includes('connections') || 
      text.includes('किसान') || 
      text.includes('लोग') ||
      text.includes('कनेक्शन')
    ) {
      return { action: 'navigate', target: 'network', displayText: 'Opening Network & Farmer Directory...' };
    }

    if (
      text.includes('ai') || 
      text.includes('assistant') || 
      text.includes('एआई') || 
      text.includes('चैटबॉट') || 
      text.includes('सलाहकार') ||
      text.includes('madad') ||
      text.includes('मदद')
    ) {
      return { action: 'navigate', target: 'ai', displayText: 'Opening KrishX AI Agronomist Assistant...' };
    }

    if (
      text.includes('notification') || 
      text.includes('alerts') || 
      text.includes('सूचनाएं') || 
      text.includes('अलर्ट')
    ) {
      return { action: 'open_modal', target: 'notifications', displayText: 'Opening Notifications...' };
    }

    if (
      text.includes('opportunity') || 
      text.includes('scheme') || 
      text.includes('yojna') || 
      text.includes('योजना') || 
      text.includes('सब्सिडी') ||
      text.includes('अनुदान')
    ) {
      return { action: 'navigate', target: 'opportunities', displayText: 'Opening Agricultural Opportunities & Schemes...' };
    }

    if (
      text.includes('community') || 
      text.includes('समूह') || 
      text.includes('कम्युनिटी')
    ) {
      return { action: 'navigate', target: 'communities', displayText: 'Opening Farming Communities...' };
    }

    if (
      text.includes('read') || 
      text.includes('sunao') || 
      text.includes('पढ़ो') || 
      text.includes('सुनाओ') ||
      text.includes('listen')
    ) {
      return { action: 'read_content', displayText: 'Reading latest post aloud...' };
    }

    // Level 3: Complex Agricultural Question / General Query -> Route to AI
    if (
      text.includes('fasal') || 
      text.includes('bimari') || 
      text.includes('disease') || 
      text.includes('pest') || 
      text.includes('crop') || 
      text.includes('patt') || 
      text.includes('leaf') || 
      text.includes('pani') || 
      text.includes('fert') || 
      text.includes('उर्वरक') || 
      text.includes('कीट') || 
      text.includes('बीमारी') || 
      text.includes('फसल') || 
      text.includes('पत्ते') || 
      text.includes('खाद') ||
      text.includes('कैसे') ||
      text.includes('why') ||
      text.includes('what') ||
      text.includes('how')
    ) {
      return { action: 'ai_query', target: transcript, displayText: `Asking KrishX AI about: "${transcript}"...` };
    }

    // Default fallback to AI query for any unrecognized natural question
    return { action: 'ai_query', target: transcript, displayText: `Processing query with KrishX AI: "${transcript}"...` };
  }
}

export const voiceService = new VoiceAssistantService();
