import React from 'react';
import { User, MapPin, Clock, Globe, Heart, Edit3, Plus, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';
import { safeString, safeArrayOfStrings } from '../../lib/utils';

interface AboutFarmerProps {
  activeProfile: UserProfile;
  isMyOwnProfile: boolean;
  onEditProfile?: () => void;
}

export const AboutFarmer: React.FC<AboutFarmerProps> = ({
  activeProfile,
  isMyOwnProfile,
  onEditProfile
}) => {
  const bioText = safeString(activeProfile?.bio || activeProfile?.summary);
  const languages = safeArrayOfStrings(activeProfile?.languages);
  const rawInterests = activeProfile?.interests || activeProfile?.skills;
  const interests = safeArrayOfStrings(rawInterests);
  const location = safeString(activeProfile?.location);
  const years = Number(activeProfile?.experienceYears) || 0;

  const hasAnyInfo = Boolean(
    bioText || 
    location || 
    years > 0 || 
    languages.length > 0 || 
    interests.length > 0
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-700" />
          About Farmer
        </h3>
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

      {!hasAnyInfo ? (
        <div className="py-6 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-center">
          <p className="text-sm text-stone-600 font-medium">
            Tell the KrishX community about your farming journey.
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Share your location, bio, farming practices, and languages spoken.
          </p>
          {isMyOwnProfile && (
            <button
              onClick={onEditProfile}
              className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add details
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          {/* Bio paragraph */}
          {bioText ? (
            <p className="text-stone-700 leading-relaxed font-normal whitespace-pre-line">
              {bioText}
            </p>
          ) : isMyOwnProfile && (
            <p className="text-stone-400 italic text-xs">
              No bio added yet.{' '}
              <button onClick={onEditProfile} className="text-emerald-800 font-medium hover:underline">
                Add a bio
              </button>
            </p>
          )}

          {/* Quick Details List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
            {location && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Location</span>
                  <span className="text-stone-800 font-medium">{location}</span>
                </div>
              </div>
            )}

            {years > 0 && (
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Farming Experience</span>
                  <span className="text-stone-800 font-medium">{years} Years</span>
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <Globe className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Languages</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {languages.map((lang, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-xs font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {interests.length > 0 && (
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <Heart className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Agri Interests</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {interests.map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-emerald-50/80 text-emerald-800 text-xs font-medium border border-emerald-200/60">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
