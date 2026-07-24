import React, { useState } from 'react';
import { X, Copy, Check, Download, Share2, QrCode, Sprout } from 'lucide-react';
import { UserProfile } from '../../types';
import { safeString } from '../../lib/utils';

interface KrishXQRModalProps {
  activeProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

export const KrishXQRModal: React.FC<KrishXQRModalProps> = ({
  activeProfile,
  isOpen,
  onClose,
  triggerToast
}) => {
  if (!isOpen) return null;

  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const uidStr = safeString(activeProfile?.uid, '123456');
  const profileUrl = `${window.location.origin}/profile/${uidStr}`;
  const krishXId = safeString(activeProfile?.krishXId) || `KX-IN-${uidStr.slice(0, 6).toUpperCase()}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(krishXId);
    setCopiedId(true);
    triggerToast('KrishX ID copied!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    triggerToast('Profile link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden text-center p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* KrishX Brand & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200/80 mb-3">
          <Sprout className="w-3.5 h-3.5 text-emerald-700" />
          <span>KrishX Digital Identity</span>
        </div>

        <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
          {safeString(activeProfile?.name)}
        </h3>
        <p className="text-xs text-stone-500 font-medium mt-0.5">
          {safeString(activeProfile?.role) || 'Agriculture Professional'}
        </p>

        {/* QR Code Canvas Box */}
        <div className="my-5 p-5 bg-stone-50 rounded-2xl border border-stone-200 inline-block shadow-inner">
          <div className="relative p-2 bg-white rounded-xl shadow-sm border border-stone-200">
            {/* Render a styled SVG QR code pattern representing the user's KrishX profile */}
            <svg 
              className="w-48 h-48 mx-auto text-emerald-900" 
              viewBox="0 0 200 200" 
              fill="currentColor"
            >
              {/* Outer boundary position markers */}
              <rect x="10" y="10" width="50" height="50" rx="8" fill="#065f46" />
              <rect x="20" y="20" width="30" height="30" rx="4" fill="#ffffff" />
              <rect x="28" y="28" width="14" height="14" rx="2" fill="#065f46" />

              <rect x="140" y="10" width="50" height="50" rx="8" fill="#065f46" />
              <rect x="150" y="20" width="30" height="30" rx="4" fill="#ffffff" />
              <rect x="158" y="28" width="14" height="14" rx="2" fill="#065f46" />

              <rect x="10" y="140" width="50" height="50" rx="8" fill="#065f46" />
              <rect x="20" y="150" width="30" height="30" rx="4" fill="#ffffff" />
              <rect x="28" y="158" width="14" height="14" rx="2" fill="#065f46" />

              {/* Data module pattern */}
              <rect x="70" y="15" width="12" height="12" rx="2" />
              <rect x="90" y="15" width="12" height="12" rx="2" />
              <rect x="110" y="15" width="12" height="12" rx="2" />

              <rect x="70" y="35" width="12" height="12" rx="2" />
              <rect x="110" y="35" width="12" height="12" rx="2" />

              <rect x="15" y="70" width="12" height="12" rx="2" />
              <rect x="35" y="70" width="12" height="12" rx="2" />
              <rect x="70" y="70" width="12" height="12" rx="2" />
              <rect x="90" y="70" width="28" height="28" rx="6" fill="#047857" />
              <rect x="135" y="70" width="12" height="12" rx="2" />
              <rect x="155" y="70" width="12" height="12" rx="2" />
              <rect x="175" y="70" width="12" height="12" rx="2" />

              <rect x="15" y="90" width="12" height="12" rx="2" />
              <rect x="35" y="110" width="12" height="12" rx="2" />
              <rect x="70" y="110" width="12" height="12" rx="2" />
              <rect x="135" y="110" width="12" height="12" rx="2" />
              <rect x="155" y="110" width="12" height="12" rx="2" />
              <rect x="175" y="110" width="12" height="12" rx="2" />

              <rect x="70" y="140" width="12" height="12" rx="2" />
              <rect x="90" y="140" width="12" height="12" rx="2" />
              <rect x="110" y="140" width="12" height="12" rx="2" />
              <rect x="135" y="140" width="28" height="28" rx="4" fill="#065f46" />

              <rect x="70" y="165" width="12" height="12" rx="2" />
              <rect x="90" y="165" width="12" height="12" rx="2" />
              <rect x="175" y="165" width="12" height="12" rx="2" />
            </svg>

            {/* Center KrishX sprout badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white p-2 rounded-xl shadow-md border border-stone-200 text-emerald-800">
                <Sprout className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs font-mono font-bold text-stone-800 bg-white px-3 py-1 rounded-lg border border-stone-200">
              {krishXId}
            </span>
            <button
              onClick={handleCopyId}
              className="p-1.5 text-stone-500 hover:text-emerald-800 rounded-lg hover:bg-stone-200 transition-colors"
              title="Copy ID"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Profile Link'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
