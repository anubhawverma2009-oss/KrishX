import React from 'react';
import { Award, Sprout, TrendingUp, Info, Clock, MessageSquare } from 'lucide-react';
import { UserProfile } from '../../types';
import { safeNumber, safeArrayOfStrings } from '../../lib/utils';

interface FarmSnapshotProps {
  activeProfile: UserProfile;
  postCount?: number;
  onKrishScoreClick?: () => void;
}

export const FarmSnapshot: React.FC<FarmSnapshotProps> = React.memo(({
  activeProfile,
  postCount = 0,
  onKrishScoreClick
}) => {
  const years = safeNumber(activeProfile?.experienceYears, 0);
  const crops = safeArrayOfStrings(activeProfile?.currentCrops || activeProfile?.crops);
  const cropsCount = crops.length;
  const krishScore = safeNumber(activeProfile?.krishScore, 850);
  const safePostCount = safeNumber(postCount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between mb-3.5 px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <Sprout className="w-4 h-4 text-emerald-700" />
          Farm Snapshot
        </h2>
        <button
          onClick={onKrishScoreClick}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-800 transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span>What is Krish Score?</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Experience */}
        <div className="bg-stone-50/80 rounded-xl p-3.5 sm:p-4 border border-stone-100 flex flex-col justify-between hover:bg-stone-100/80 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium text-stone-600">Experience</span>
            <Clock className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {years} <span className="text-sm font-normal text-stone-500">Yrs</span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">Farming Practice</p>
          </div>
        </div>

        {/* Metric 2: Crops Growing */}
        <div className="bg-stone-50/80 rounded-xl p-3.5 sm:p-4 border border-stone-100 flex flex-col justify-between hover:bg-stone-100/80 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium text-stone-600">Active Crops</span>
            <Sprout className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {cropsCount}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">Currently Sown</p>
          </div>
        </div>

        {/* Metric 3: Krish Score */}
        <div 
          onClick={onKrishScoreClick}
          className="bg-emerald-50/60 rounded-xl p-3.5 sm:p-4 border border-emerald-100/80 flex flex-col justify-between cursor-pointer hover:bg-emerald-100/60 transition-colors group"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-semibold text-emerald-900">Krish Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900 tracking-tight">
              {krishScore}
            </div>
            <p className="text-xs text-emerald-800/80 mt-0.5 flex items-center gap-1">
              <span>Verified Contribution</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Contributions */}
        <div className="bg-stone-50/80 rounded-xl p-3.5 sm:p-4 border border-stone-100 flex flex-col justify-between hover:bg-stone-100/80 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium text-stone-600">Contributions</span>
            <MessageSquare className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {safePostCount}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">Posts & Discussions</p>
          </div>
        </div>
      </div>
    </div>
  );
});
