import React from 'react';
import { MessageSquare, Briefcase, Award, Bookmark } from 'lucide-react';

export type ProfileTabType = 'posts' | 'experience' | 'achievements' | 'saved';

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  isMyOwnProfile: boolean;
  postsCount?: number;
  experienceCount?: number;
  achievementsCount?: number;
  savedCount?: number;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = React.memo(({
  activeTab,
  onTabChange,
  isMyOwnProfile,
  postsCount = 0,
  experienceCount = 0,
  achievementsCount = 0,
  savedCount = 0
}) => {
  const tabs = [
    {
      id: 'posts' as ProfileTabType,
      label: 'Posts',
      icon: MessageSquare,
      count: postsCount
    },
    {
      id: 'experience' as ProfileTabType,
      label: 'Experience',
      icon: Briefcase,
      count: experienceCount
    },
    {
      id: 'achievements' as ProfileTabType,
      label: 'Achievements',
      icon: Award,
      count: achievementsCount
    },
    ...(isMyOwnProfile ? [
      {
        id: 'saved' as ProfileTabType,
        label: 'Saved',
        icon: Bookmark,
        count: savedCount
      }
    ] : [])
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 mb-6 p-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-[85px] sm:min-w-0 py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
              isActive
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span 
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive 
                    ? 'bg-emerald-700 text-emerald-100' 
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
