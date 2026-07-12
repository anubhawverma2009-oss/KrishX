/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Heart, 
  MessageSquare, 
  UserCheck, 
  UserPlus, 
  Sparkles, 
  Clock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose,
  setActiveTab
}) => {
  const { 
    notifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    language 
  } = useAuth();

  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

  // Localization dict
  const isEn = language === 'en';
  const labels = {
    title: isEn ? 'Notifications' : 'सूचनाएं',
    markAll: isEn ? 'Mark all as read' : 'सभी को पढ़ा हुआ चिह्नित करें',
    empty: isEn ? 'No notifications yet' : 'अभी कोई सूचना नहीं है',
    subEmpty: isEn ? 'We will notify you about important updates.' : 'हम आपको महत्वपूर्ण अपडेट के बारे में सूचित करेंगे।',
    close: isEn ? 'Close' : 'बंद करें',
    viewAction: isEn ? 'View Action' : 'कार्रवाई देखें',
    readStatus: isEn ? 'Read' : 'पढ़ा हुआ',
    unreadStatus: isEn ? 'Unread' : 'अपठित',
    backToFeed: isEn ? 'Go to Feed' : 'फ़ीड पर जाएं',
    goNetwork: isEn ? 'Go to Network Hub' : 'नेटवर्क हब पर जाएं',
    detailsTitle: isEn ? 'Notification Details' : 'सूचना विवरण',
  };

  const getNotifIconAndColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'like':
        return {
          icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />,
          bgColor: 'bg-rose-50 border-rose-100',
          textColor: 'text-rose-700'
        };
      case 'comment':
        return {
          icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
          bgColor: 'bg-blue-50 border-blue-100',
          textColor: 'text-blue-700'
        };
      case 'connection':
        return {
          icon: <UserCheck className="w-4 h-4 text-emerald-500" />,
          bgColor: 'bg-emerald-50 border-emerald-100',
          textColor: 'text-emerald-700'
        };
      case 'alert':
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-500" />,
          bgColor: 'bg-amber-50 border-amber-100',
          textColor: 'text-amber-700'
        };
      case 'system':
      default:
        return {
          icon: <Bell className="w-4 h-4 text-krishx-green-600" />,
          bgColor: 'bg-krishx-green-50 border-krishx-green-100',
          textColor: 'text-krishx-green-700'
        };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return isEn ? 'Just now' : 'अभी-अभी';
      if (diffMins < 60) return isEn ? `${diffMins}m ago` : `${diffMins} मिनट पहले`;
      if (diffHours < 24) return isEn ? `${diffHours}h ago` : `${diffHours} घंटे पहले`;
      if (diffDays === 1) return isEn ? 'Yesterday' : 'कल';
      return isEn ? `${diffDays}d ago` : `${diffDays} दिन पहले`;
    } catch {
      return '';
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    setSelectedNotif(notif);
  };

  const handleActionClick = (notif: AppNotification) => {
    setSelectedNotif(null);
    onClose();

    if (notif.postId && setActiveTab) {
      setActiveTab('home');
      // Scroll to post if exists
      setTimeout(() => {
        const postElement = document.getElementById(`post-${notif.postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          postElement.classList.add('ring-4', 'ring-krishx-green-500/20', 'transition-all');
          setTimeout(() => {
            postElement.classList.remove('ring-4', 'ring-krishx-green-500/20');
          }, 3000);
        }
      }, 300);
    } else if (notif.type === 'connection' && setActiveTab) {
      setActiveTab('network');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Back Drop and Container */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Click outside shield */}
        <div className="absolute inset-0 pointer-events-auto bg-transparent" onClick={onClose} />
        
        {/* Dropdown Container */}
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute top-20 right-4 md:right-12 w-80 md:w-[420px] bg-white border border-krishx-earth-200/60 rounded-[28px] shadow-2xl p-4 pointer-events-auto max-h-[80vh] flex flex-col z-[100]"
          id="notification-dropdown-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-krishx-earth-100/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-krishx-dark-900 tracking-tight uppercase flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-krishx-green-600" />
                {labels.title}
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="bg-krishx-green-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>
            
            {unreadNotificationsCount > 0 && (
              <button 
                onClick={markAllNotificationsAsRead}
                className="text-[11px] font-black tracking-wide text-krishx-green-700 hover:text-krishx-green-800 transition-colors cursor-pointer"
              >
                {labels.markAll}
              </button>
            )}
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto py-2 divide-y divide-krishx-earth-50 max-h-[450px] scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="p-4 bg-krishx-earth-50 rounded-full mb-3">
                  <Inbox className="w-8 h-8 text-krishx-dark-700/30" strokeWidth={1.5} />
                </div>
                <h4 className="text-xs font-bold text-krishx-dark-800">{labels.empty}</h4>
                <p className="text-[10px] text-krishx-dark-700/50 mt-1">{labels.subEmpty}</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const style = getNotifIconAndColor(notif.type);
                return (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex gap-3 p-3.5 transition-all duration-200 cursor-pointer text-left hover:bg-krishx-earth-50/50 relative group ${
                      !notif.read ? 'bg-krishx-green-50/20' : ''
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.read && (
                      <span className="absolute top-1/2 left-1.5 -translate-y-1/2 w-1.5 h-1.5 bg-krishx-green-600 rounded-full" />
                    )}

                    {/* Sender Image or Type Icon */}
                    <div className="shrink-0 relative">
                      {notif.senderPhoto ? (
                        <img 
                          src={notif.senderPhoto} 
                          alt={notif.senderName || 'Sender'} 
                          className="w-10 h-10 rounded-2xl object-cover border border-krishx-earth-100"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${style.bgColor}`}>
                          {style.icon}
                        </div>
                      )}
                      
                      {/* overlay mini icon if sender photo is present */}
                      {notif.senderPhoto && (
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-white ${style.bgColor}`}>
                          {React.cloneElement(style.icon, { className: "w-2.5 h-2.5" })}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1.5">
                        <span className="text-[11px] font-black text-krishx-dark-900 leading-tight block truncate">
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-krishx-dark-700/40 shrink-0 flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${!notif.read ? 'text-krishx-dark-900 font-bold' : 'text-krishx-dark-700/70'}`}>
                        {notif.body}
                      </p>
                    </div>

                    {/* Action Arrow indicator */}
                    <div className="shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-krishx-dark-700/40" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Dynamic Detail Modal for Viewing Notification Detail */}
      <AnimatePresence>
        {selectedNotif && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotif(null)}
              className="fixed inset-0 bg-krishx-dark-900/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-[32px] border border-krishx-earth-200/50 shadow-2xl p-6 w-full max-w-md relative z-[120] text-center space-y-5 overflow-hidden"
            >
              {/* Top Graphic Background */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-krishx-green-500 via-emerald-500 to-amber-500" />
              
              <button 
                onClick={() => setSelectedNotif(null)}
                className="absolute top-4 right-4 p-2 text-krishx-dark-700/40 hover:text-krishx-dark-900 hover:bg-krishx-earth-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large Iconic Visual representation */}
              <div className="pt-2 flex justify-center">
                {selectedNotif.senderPhoto ? (
                  <div className="relative">
                    <img 
                      src={selectedNotif.senderPhoto} 
                      alt={selectedNotif.senderName} 
                      className="w-20 h-20 rounded-[28px] object-cover border-2 border-krishx-green-100 shadow-lg ring-4 ring-krishx-green-50/50"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md ${getNotifIconAndColor(selectedNotif.type).bgColor}`}>
                      {React.cloneElement(getNotifIconAndColor(selectedNotif.type).icon, { className: "w-3.5 h-3.5" })}
                    </div>
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border-2 shadow-inner ${getNotifIconAndColor(selectedNotif.type).bgColor}`}>
                    {React.cloneElement(getNotifIconAndColor(selectedNotif.type).icon, { className: "w-6 h-6" })}
                  </div>
                )}
              </div>

              {/* Text Information */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-krishx-green-700 font-mono inline-block bg-krishx-green-50 px-2.5 py-1 rounded-full">
                  {selectedNotif.type} notification
                </span>
                <h3 className="text-lg font-black text-krishx-dark-900 leading-snug">
                  {selectedNotif.title}
                </h3>
                <p className="text-xs text-krishx-dark-700/45 flex items-center justify-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeTime(selectedNotif.createdAt)}
                </p>
                <div className="p-4 bg-krishx-earth-50/50 rounded-2xl border border-krishx-earth-100/50 text-left text-xs text-krishx-dark-800 leading-relaxed font-medium">
                  {selectedNotif.body}
                </div>
              </div>

              {/* CTA & Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="flex-1 py-3 bg-krishx-earth-50 hover:bg-krishx-earth-100 text-krishx-dark-800 font-bold rounded-2xl text-[12px] transition-colors"
                >
                  {labels.close}
                </button>
                
                {(selectedNotif.postId || selectedNotif.type === 'connection') && (
                  <button 
                    onClick={() => handleActionClick(selectedNotif)}
                    className="flex-1 py-3 bg-gradient-to-r from-krishx-green-600 to-krishx-green-700 hover:from-krishx-green-700 hover:to-krishx-green-800 text-white font-bold rounded-2xl text-[12px] shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>{selectedNotif.postId ? labels.backToFeed : labels.goNetwork}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
