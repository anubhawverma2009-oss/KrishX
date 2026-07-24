import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, 
  ShieldCheck, 
  Share2, 
  Edit3, 
  MoreVertical, 
  QrCode, 
  FileDown, 
  Copy, 
  Check, 
  UserPlus, 
  UserCheck, 
  Clock, 
  Sprout,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../../types';
import { safeString, safeArrayOfStrings } from '../../lib/utils';

interface ProfileHeroProps {
  activeProfile: UserProfile;
  isMyOwnProfile: boolean;
  connectionStatus?: 'connected' | 'pending_sent' | 'pending_received' | 'none';
  onConnect?: () => void;
  onEditProfile?: () => void;
  onOpenQr?: () => void;
  onShare?: () => void;
  onDownloadProfile?: () => void;
  onCopyLink?: () => void;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  activeProfile,
  isMyOwnProfile,
  connectionStatus = 'none',
  onConnect,
  onEditProfile,
  onOpenQr,
  onShare,
  onDownloadProfile,
  onCopyLink
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Derive crops safely or fallback to default chips
  const rawCrops = activeProfile?.currentCrops || activeProfile?.crops || [];
  const cropsList = safeArrayOfStrings(rawCrops);
  const displayCrops = cropsList.slice(0, 3);
  const extraCropsCount = cropsList.length > 3 ? cropsList.length - 3 : 0;

  // Derive agricultural role/tagline
  const roleTagline = safeString(activeProfile?.role) || 
    (cropsList.length > 0 
      ? `Progressive Farmer • ${cropsList.slice(0, 2).join(' & ')}`
      : 'Agriculture Professional');

  // Fallback cover image
  const defaultCover = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80';
  const coverUrl = safeString(activeProfile?.coverImage) || defaultCover;

  // Fallback avatar
  const profileNameStr = safeString(activeProfile?.name, 'Farmer');
  const avatarUrl = safeString(activeProfile?.photoURL) || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileNameStr)}`;

  const krishXIdStr = safeString(activeProfile?.krishXId);

  const handleCopyId = () => {
    if (krishXIdStr) {
      navigator.clipboard.writeText(krishXIdStr);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden mb-6">
      {/* Cover Image Header */}
      <div className="relative h-44 sm:h-56 lg:h-[240px] w-full bg-stone-900 overflow-hidden">
        <img 
          src={coverUrl} 
          alt="Farm Cover" 
          className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        
        {/* Top-right menu trigger on cover */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Three-dot overflow menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              title="More Actions"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => { setShowMenu(false); onOpenQr?.(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    View KrishX QR
                  </button>

                  <button
                    onClick={() => { setShowMenu(false); onDownloadProfile?.(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-emerald-600" />
                    Download Farm Profile
                  </button>

                  <button
                    onClick={() => { setShowMenu(false); onCopyLink?.(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 font-medium transition-colors border-t border-stone-100"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                    Copy Profile Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Identity Content Area */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-0">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-stone-100/80">
          
          {/* Avatar + Identity Information */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 lg:gap-6 flex-1 min-w-0">
            {/* Avatar - specifically has negative top margin to overlap cover image by ~50% */}
            <div className="-mt-12 sm:-mt-16 lg:-mt-20 flex-shrink-0 relative group z-10">
              <img 
                src={avatarUrl} 
                alt={activeProfile.name} 
                className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white shadow-md bg-stone-100 ring-2 ring-stone-200/50"
              />
              {activeProfile.isVerified && (
                <div 
                  className="absolute bottom-1 right-1 bg-emerald-600 text-white p-1.5 rounded-full ring-2 ring-white shadow"
                  title="Verified Farmer"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Farmer Identity Details (positioned cleanly in white space below cover) */}
            <div className="pt-1 sm:pt-2 lg:pt-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight truncate max-w-full">
                  {safeString(activeProfile.name) || 'KrishX Farmer'}
                </h1>
                {activeProfile.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex-shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>

              {/* Agriculture Tagline / Role */}
              <p className="text-stone-600 font-medium text-sm sm:text-base lg:text-lg mt-1 flex items-center gap-1.5 truncate">
                <Sprout className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{roleTagline}</span>
              </p>

              {/* Location + KrishX ID */}
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-stone-500 mt-2 flex-wrap">
                {safeString(activeProfile.location) && (
                  <span className="flex items-center gap-1 text-stone-600 font-medium">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{safeString(activeProfile.location)}</span>
                  </span>
                )}

                {krishXIdStr && (
                  <button 
                    onClick={handleCopyId}
                    className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs px-2.5 py-1 rounded-md transition-colors"
                    title="Click to copy KrishX ID"
                  >
                    <span>{krishXIdStr}</span>
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto lg:self-end flex-shrink-0 pt-2 lg:pt-0">
            {isMyOwnProfile ? (
              <>
                <button
                  onClick={onEditProfile}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
                <button
                  onClick={onShare}
                  className="inline-flex items-center justify-center p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-sm transition-all"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {connectionStatus === 'connected' ? (
                  <button
                    disabled
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 text-stone-600 font-medium text-sm cursor-default"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Connected
                  </button>
                ) : connectionStatus === 'pending_sent' ? (
                  <button
                    disabled
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-medium text-sm cursor-default"
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    Request Sent
                  </button>
                ) : connectionStatus === 'pending_received' ? (
                  <button
                    onClick={onConnect}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    Accept Connection
                  </button>
                ) : (
                  <button
                    onClick={onConnect}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-all shadow-sm active:scale-[0.98]"
                  >
                    <UserPlus className="w-4 h-4" />
                    Connect
                  </button>
                )}

                <button
                  onClick={onShare}
                  className="inline-flex items-center justify-center p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-sm transition-all"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Short Crop & Specialization Chips */}
        {displayCrops.length > 0 && (
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 mr-1 flex-shrink-0">
              Crops:
            </span>
            {displayCrops.map((crop, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80"
              >
                <Sprout className="w-3 h-3 text-emerald-600" />
                {crop}
              </span>
            ))}

            {extraCropsCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                +{extraCropsCount} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
