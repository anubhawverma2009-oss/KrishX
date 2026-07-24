import React from 'react';
import { Sprout, ShieldCheck, Award, Edit3, Plus, Leaf, Droplets, Compass } from 'lucide-react';
import { UserProfile } from '../../types';
import { safeArrayOfStrings } from '../../lib/utils';

interface MyAgricultureProps {
  activeProfile: UserProfile;
  isMyOwnProfile: boolean;
  onEditProfile?: () => void;
}

export const MyAgriculture: React.FC<MyAgricultureProps> = ({
  activeProfile,
  isMyOwnProfile,
  onEditProfile
}) => {
  const currentCrops = safeArrayOfStrings(activeProfile?.currentCrops || activeProfile?.crops);
  
  const rawSkills = safeArrayOfStrings(activeProfile?.skills);
  const rawPractices = activeProfile?.farmingPractices 
    ? safeArrayOfStrings(activeProfile.farmingPractices)
    : rawSkills.filter(s => s.toLowerCase().includes('farming') || s.toLowerCase().includes('irrigation') || s.toLowerCase().includes('organic'));
  
  const rawExpertise = activeProfile?.expertise
    ? safeArrayOfStrings(activeProfile.expertise)
    : rawSkills.filter(s => !rawPractices.includes(s));

  const farmingPractices = rawPractices;
  const farmExpertise = rawExpertise;

  const hasAgricultureData = currentCrops.length > 0 || farmingPractices.length > 0 || farmExpertise.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
            <Sprout className="w-4.5 h-4.5 text-emerald-700" />
            My Agriculture
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Key crops, farming practices, & agricultural expertise
          </p>
        </div>

        {isMyOwnProfile && (
          <button
            onClick={onEditProfile}
            className="text-xs text-emerald-800 hover:text-emerald-900 font-medium flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {!hasAgricultureData ? (
        <div className="py-6 px-4 bg-emerald-50/40 rounded-xl border border-dashed border-emerald-200 text-center">
          <Leaf className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-stone-800">
            No agricultural details specified yet
          </p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Add your current crops, farming methods (e.g., Organic, Drip Irrigation), and farm expertise.
          </p>
          {isMyOwnProfile && (
            <button
              onClick={onEditProfile}
              className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Agriculture Details
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Group 1: Current Crops */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Current Crops</span>
            </div>
            {currentCrops.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {currentCrops.map((crop, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200/80"
                  >
                    <Leaf className="w-3 h-3 text-emerald-600" />
                    {crop}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-stone-400 italic">None specified</span>
            )}
          </div>

          {/* Group 2: Farming Practices */}
          <div className="pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Farming Practices</span>
            </div>
            {farmingPractices.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {farmingPractices.map((practice, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-medium border border-blue-200/80"
                  >
                    {practice}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-stone-400 italic">None specified</span>
            )}
          </div>

          {/* Group 3: Farm Expertise */}
          <div className="pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>Farm Expertise</span>
            </div>
            {farmExpertise.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {farmExpertise.map((exp, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200/80"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-stone-400 italic">None specified</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
