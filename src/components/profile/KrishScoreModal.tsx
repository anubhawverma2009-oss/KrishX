import React from 'react';
import { X, TrendingUp, ShieldCheck, Sprout, MessageSquare, Award, Info } from 'lucide-react';
import { safeNumber } from '../../lib/utils';

interface KrishScoreModalProps {
  score: number;
  isOpen: boolean;
  onClose: () => void;
}

export const KrishScoreModal: React.FC<KrishScoreModalProps> = ({
  score,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-100/80 text-emerald-800 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">What is Krish Score?</h3>
            <p className="text-xs text-stone-500 font-medium">Digital trust & agricultural contribution index</p>
          </div>
        </div>

        {/* Big Score Display */}
        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100 text-center mb-4">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
            Current Score
          </span>
          <span className="text-4xl font-extrabold text-emerald-900 tracking-tight block my-1">
            {safeNumber(score, 850)}
          </span>
          <p className="text-xs text-emerald-800/80">
            High Peer Trust & Active Community Contributor
          </p>
        </div>

        {/* Score Factors */}
        <div className="space-y-3 text-xs text-stone-600">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
            <MessageSquare className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-stone-800 block">Knowledge Sharing & Discussions</span>
              <span>Earn points when you post verified crop solutions, answer peer questions, and contribute learnings.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
            <Award className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-stone-800 block">Verified Achievements & Experience</span>
              <span>Score grows with documented farming experience, completed ICAR/KVK trainings, and verified yields.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-stone-800 block">Community Trust Signals</span>
              <span>Positive reactions and connections from fellow farmers strengthen your score.</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400 italic text-center">
          * Note: Krish Score is an internal KrishX community index and does not imply government or regulatory certification.
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
