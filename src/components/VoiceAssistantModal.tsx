/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Volume2, Sparkles, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { voiceService } from '../lib/voiceAssistant';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  triggerToast: (msg: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  triggerToast
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('Tap the microphone and speak naturally (e.g. "प्रोफाइल खोलो", "गन्ने की बीमारी के बारे में बताओ").');
  const [statusType, setStatusType] = useState<'idle' | 'listening' | 'processing' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) {
      startVoiceSession();
    } else {
      voiceService.stopListening();
      setIsListening(false);
      setStatusType('idle');
      setTranscript('');
    }
    return () => {
      voiceService.stopListening();
    };
  }, [isOpen]);

  const startVoiceSession = () => {
    setTranscript('');
    setFeedbackMessage('Listening... Speak your command now.');
    setIsListening(true);
    setStatusType('listening');

    voiceService.startListening(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          processTranscript(text);
        }
      },
      (error) => {
        setIsListening(false);
        setStatusType('idle');
        setFeedbackMessage(error);
        voiceService.speak(error, 'en');
      },
      () => {
        setIsListening(false);
      },
      'hi-IN' // Default preferred for Indian farmers, supports Hinglish/Hindi/English
    );
  };

  const processTranscript = (text: string) => {
    if (!text.trim()) return;
    setStatusType('processing');
    setFeedbackMessage(`Processing: "${text}"...`);

    const classification = voiceService.classifyIntent(text);
    setFeedbackMessage(classification.displayText);
    voiceService.speak(classification.displayText, 'hi');

    setTimeout(() => {
      setStatusType('success');
      if (classification.action === 'navigate' && classification.target) {
        if (classification.target === 'opportunities') {
          setActiveTab('home'); // or home since opportunities is integrated
          triggerToast("Opened opportunities & schemes");
        } else if (classification.target === 'communities') {
          setActiveTab('home');
          triggerToast("Opened communities");
        } else {
          setActiveTab(classification.target);
        }
        onClose();
      } else if (classification.action === 'open_modal') {
        onClose();
        triggerToast("Opened notifications");
      } else if (classification.action === 'ai_query') {
        setActiveTab('ai');
        onClose();
        triggerToast("Forwarded query to KrishX AI Agronomist");
      } else {
        onClose();
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-krishx-dark-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-krishx-earth-200 overflow-hidden p-6 md:p-8 text-center relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-krishx-earth-50 text-krishx-dark-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-krishx-green-50 text-krishx-green-600 rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-display font-bold text-krishx-dark-900">
              KrishX Smart Voice Assistant
            </h3>
          </div>
          <p className="text-xs text-krishx-dark-700/70 font-medium mb-8">
            कृषएक्स वॉइस सहायक — बोलकर नेविगेट करें और कृषि सलाह पाएं
          </p>

          {/* Glowing Microphone Visualizer */}
          <div className="relative my-8 flex items-center justify-center">
            {isListening && (
              <>
                <div className="absolute w-28 h-28 bg-krishx-green-500/20 rounded-full animate-ping" />
                <div className="absolute w-36 h-36 bg-krishx-green-500/10 rounded-full animate-pulse" />
              </>
            )}

            <button
              onClick={() => {
                if (isListening) {
                  voiceService.stopListening();
                  setIsListening(false);
                } else {
                  startVoiceSession();
                }
              }}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
                isListening 
                  ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/40' 
                  : 'bg-gradient-to-br from-krishx-green-600 to-krishx-green-700 text-white shadow-krishx-green-600/40'
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10 animate-bounce" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          {/* Transcript / Feedback box */}
          <div className="bg-krishx-earth-50/60 border border-krishx-earth-200/50 rounded-2xl p-4 min-h-[80px] flex flex-col justify-center items-center mb-6">
            {transcript ? (
              <p className="text-sm font-bold text-krishx-dark-900 italic">
                "{transcript}"
              </p>
            ) : (
              <p className="text-xs font-semibold text-krishx-dark-700/60">
                {feedbackMessage}
              </p>
            )}
          </div>

          {/* Quick Command Suggestions */}
          <div className="space-y-2 text-left mb-6">
            <p className="text-[10px] font-black text-krishx-dark-700/50 uppercase tracking-widest px-1">
              Popular Voice Commands / बोलकर देखें:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '👤 "प्रोफाइल खोलो"', cmd: 'प्रोफाइल खोलो' },
                { label: '🤖 "AI सलाहकार से पूछें"', cmd: 'गन्ने की फसल में कीट नियंत्रण कैसे करें' },
                { label: '👥 "कम्युनिटी दिखाओ"', cmd: 'कम्युनिटी दिखाओ' },
                { label: '🔔 "नोटिफिकेशन्स"', cmd: 'नोटिफिकेशन्स दिखाओ' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(item.cmd);
                    processTranscript(item.cmd);
                  }}
                  className="p-2.5 bg-krishx-earth-50/50 hover:bg-krishx-green-50/50 border border-krishx-earth-200/40 rounded-xl text-left text-xs font-bold text-krishx-dark-800 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-krishx-green-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[10px] font-medium text-krishx-dark-700/50">
            Powered by Browser Native Speech API • Zero Additional Cost
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
