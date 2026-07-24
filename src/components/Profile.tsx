/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  Sprout, 
  X, 
  ChevronRight, 
  Edit3, 
  Check, 
  Share2, 
  QrCode, 
  Copy, 
  Bookmark,
  Plus
} from 'lucide-react';
import { 
  db, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove 
} from '../lib/firebase';
import { UserProfile, Post, ExperienceItem, AchievementItem } from '../types';
import { safeString, safeArrayOfStrings, getSafeTimestamp } from '../lib/utils';
import { ErrorBoundary } from './ErrorBoundary';

// Subcomponents for Modular Profile
import { ProfileHero } from './profile/ProfileHero';
import { FarmSnapshot } from './profile/FarmSnapshot';
import { AboutFarmer } from './profile/AboutFarmer';
import { MyAgriculture } from './profile/MyAgriculture';
import { ProfileTabs, ProfileTabType } from './profile/ProfileTabs';
import { ProfilePosts } from './profile/ProfilePosts';
import { ExperienceSection } from './profile/ExperienceSection';
import { AchievementsSection } from './profile/AchievementsSection';
import { EditProfileModal } from './profile/EditProfileModal';
import { KrishXQRModal } from './profile/KrishXQRModal';
import { KrishScoreModal } from './profile/KrishScoreModal';

interface ProfileProps {
  viewedProfileId?: string | null;
  setViewedProfileId?: (uid: string | null) => void;
  setActiveTab?: (tab: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  viewedProfileId, 
  setViewedProfileId, 
  setActiveTab: setGlobalActiveTab 
}) => {
  const { userProfile, updateProfile, toggleSavePost, language, addNotification } = useAuth();
  const t = getTranslation(language);

  // States
  const [visitedProfile, setVisitedProfile] = useState<UserProfile | null>(null);
  const [visitedPosts, setVisitedPosts] = useState<Post[]>([]);
  const [savedPostsData, setSavedPostsData] = useState<Post[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // UI Modals & Active Tab
  const [activeTab, setActiveTab] = useState<ProfileTabType>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isKrishScoreModalOpen, setIsKrishScoreModalOpen] = useState(false);
  const [imageZoomUrl, setImageZoomUrl] = useState<string | null>(null);

  // Experiences & Achievements State
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);

  // Active Profile Resolver
  const activeProfile = (viewedProfileId && viewedProfileId !== userProfile?.uid) 
    ? visitedProfile 
    : userProfile;

  const isMyOwnProfile = !viewedProfileId || viewedProfileId === userProfile?.uid;

  // Trigger Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync / seed experiences & achievements for activeProfile
  useEffect(() => {
    if (activeProfile) {
      // Load or fallback experiences
      if (activeProfile.experiences && activeProfile.experiences.length > 0) {
        setExperiences(activeProfile.experiences);
      } else {
        const savedExp = localStorage.getItem(`krishx_profile_exp_${activeProfile.uid}`);
        if (savedExp) {
          setExperiences(JSON.parse(savedExp));
        } else {
          setExperiences([]);
        }
      }

      // Load or fallback achievements
      if (activeProfile.structuredAchievements && activeProfile.structuredAchievements.length > 0) {
        setAchievements(activeProfile.structuredAchievements);
      } else {
        const savedAch = localStorage.getItem(`krishx_profile_ach_${activeProfile.uid}`);
        if (savedAch) {
          setAchievements(JSON.parse(savedAch));
        } else {
          setAchievements([]);
        }
      }
    }
  }, [activeProfile]);

  // Real-time subscription to user's posts
  useEffect(() => {
    const targetUid = activeProfile?.uid;
    if (!targetUid) {
      setVisitedPosts([]);
      return;
    }

    const postsQuery = query(
      collection(db, 'posts'), 
      where('authorId', '==', targetUid)
    );
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      const loadedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      loadedPosts.sort((a, b) => getSafeTimestamp(b.createdAt) - getSafeTimestamp(a.createdAt));
      setVisitedPosts(loadedPosts);
    }, (error) => {
      console.error("Error listening to user posts:", error);
    });

    return () => unsubPosts();
  }, [activeProfile?.uid]);

  // Real-time subscription to saved posts
  useEffect(() => {
    const savedIds = userProfile?.savedPosts || [];
    if (isMyOwnProfile && savedIds.length > 0) {
      const q = query(collection(db, 'posts'));
      const unsub = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Post)
          .filter(p => savedIds.includes(p.id))
          .sort((a, b) => getSafeTimestamp(b.createdAt) - getSafeTimestamp(a.createdAt));
        setSavedPostsData(posts);
      }, (err) => {
        console.error("Error subscribing to saved posts:", err);
      });
      return () => unsub();
    } else {
      setSavedPostsData([]);
    }
  }, [isMyOwnProfile, (userProfile?.savedPosts || []).join(',')]);

  // Fetch visited profile and subscribe to global connections
  useEffect(() => {
    const connectionsQuery = query(collection(db, 'connections'));
    const unsubConnections = onSnapshot(connectionsQuery, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConnections(loaded);
    });

    if (!viewedProfileId || viewedProfileId === userProfile?.uid) {
      setVisitedProfile(null);
      return () => unsubConnections();
    }

    setLoadingProfile(true);
    const userDocRef = doc(db, 'users', viewedProfileId);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        setVisitedProfile(docSnap.data() as UserProfile);
      }
      setLoadingProfile(false);
    }).catch((err) => {
      console.error("Error fetching visited profile:", err);
      setLoadingProfile(false);
    });

    return () => unsubConnections();
  }, [viewedProfileId, userProfile?.uid]);

  // Resolve Connection status for visited profile
  const connection = connections.find(c => 
    userProfile && activeProfile && (
      (c.fromId === userProfile.uid && c.toId === activeProfile.uid) || 
      (c.fromId === activeProfile.uid && c.toId === userProfile.uid)
    )
  );

  let connectionStatus: 'connected' | 'pending_sent' | 'pending_received' | 'none' = 'none';
  if (connection) {
    if (connection.status === 'connected') {
      connectionStatus = 'connected';
    } else if (connection.status === 'pending') {
      if (connection.fromId === userProfile?.uid) {
        connectionStatus = 'pending_sent';
      } else {
        connectionStatus = 'pending_received';
      }
    }
  }

  // Connection Handler
  const handleConnect = async () => {
    if (!userProfile || !activeProfile || isMyOwnProfile) return;
    try {
      if (connection) {
        if (connection.status === 'pending' && connection.toId === userProfile.uid) {
          const connRef = doc(db, 'connections', connection.id);
          await updateDoc(connRef, { status: 'connected' });
          triggerToast("Connection Established!");

          await addNotification({
            userId: activeProfile.uid,
            senderId: userProfile.uid,
            senderName: userProfile.name,
            senderPhoto: userProfile.photoURL || '',
            type: 'connection',
            title: language === 'en' ? 'Connection Request Accepted' : 'कनेक्शन अनुरोध स्वीकार किया गया',
            body: `${userProfile.name} accepted your connection request.`
          });
        }
        return;
      }

      await addDoc(collection(db, 'connections'), {
        fromId: userProfile.uid,
        toId: activeProfile.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      triggerToast("Connection Request Sent!");

      await addNotification({
        userId: activeProfile.uid,
        senderId: userProfile.uid,
        senderName: userProfile.name,
        senderPhoto: userProfile.photoURL || '',
        type: 'connection',
        title: language === 'en' ? 'Connection Request' : 'कनेक्शन अनुरोध',
        body: `${userProfile.name} sent you a connection request.`
      });
    } catch (err) {
      console.error("Error updating connection:", err);
    }
  };

  // Toggle Save Post
  const handleToggleSave = async (postId: string) => {
    if (!userProfile) return;
    try {
      const nowSaved = await toggleSavePost(postId);
      if (nowSaved) {
        triggerToast("Post saved successfully!");
      } else {
        triggerToast("Post removed from saved.");
      }
    } catch (e) {
      console.error("Error toggling save post in Profile:", e);
      triggerToast("Failed to update saved post.");
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!userProfile) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      triggerToast("Post deleted successfully.");
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // Create Post
  const handleCreatePost = async (content: string, category: string, topic: string, imageUrl?: string) => {
    if (!userProfile) return;
    try {
      const uidStr = safeString(userProfile.uid);
      await addDoc(collection(db, 'posts'), {
        authorId: uidStr,
        authorName: safeString(userProfile.name, 'KrishX Farmer'),
        authorPhotoURL: safeString(userProfile.photoURL),
        authorKrishXId: safeString(userProfile.krishXId) || `KX-IN-${uidStr.slice(0, 6).toUpperCase()}`,
        authorRole: safeString(userProfile.role, 'Progressive Farmer'),
        authorLocation: safeString(userProfile.location),
        content,
        category,
        topic,
        imageUrl: imageUrl || null,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      });
      triggerToast('Post published successfully!');
    } catch (err) {
      console.error('Error creating post:', err);
      triggerToast('Failed to publish post.');
    }
  };

  // Save profile edits
  const handleSaveProfileEdits = async (updatedData: Partial<UserProfile>) => {
    if (!userProfile) return;
    await updateProfile(updatedData);
  };

  // Save Experiences list
  const handleSaveExperiences = async (updatedExp: ExperienceItem[]) => {
    setExperiences(updatedExp);
    if (userProfile) {
      localStorage.setItem(`krishx_profile_exp_${userProfile.uid}`, JSON.stringify(updatedExp));
      try {
        await updateProfile({ experiences: updatedExp });
      } catch (err) {
        console.error('Error persisting experiences to Firestore:', err);
      }
    }
  };

  // Save Achievements list
  const handleSaveAchievements = async (updatedAch: AchievementItem[]) => {
    setAchievements(updatedAch);
    if (userProfile) {
      localStorage.setItem(`krishx_profile_ach_${userProfile.uid}`, JSON.stringify(updatedAch));
      try {
        await updateProfile({ structuredAchievements: updatedAch });
      } catch (err) {
        console.error('Error persisting achievements to Firestore:', err);
      }
    }
  };

  // Share profile
  const handleShareProfile = () => {
    if (!activeProfile) return;
    const url = `${window.location.origin}/profile/${activeProfile.uid}`;
    if (navigator.share) {
      navigator.share({
        title: `${activeProfile.name} - KrishX Farm Profile`,
        text: `Check out ${activeProfile.name}'s agricultural profile on KrishX!`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      triggerToast('Profile link copied to clipboard!');
    }
  };

  // Download Farm Profile (creates a formatted text summary file)
  const handleDownloadProfilePDF = () => {
    if (!activeProfile) return;
    const uidStr = safeString(activeProfile.uid, '123456');
    const nameStr = safeString(activeProfile.name, 'Farmer');
    const krishXIdStr = safeString(activeProfile.krishXId) || `KX-IN-${uidStr.slice(0, 6).toUpperCase()}`;
    const locationStr = safeString(activeProfile.location, 'N/A');
    const roleStr = safeString(activeProfile.role, 'Agriculture Professional');
    const bioStr = safeString(activeProfile.bio || activeProfile.summary, 'N/A');

    const cropsList = safeArrayOfStrings(activeProfile.currentCrops || activeProfile.crops);
    const practicesList = safeArrayOfStrings(activeProfile.farmingPractices);
    const expertiseList = safeArrayOfStrings(activeProfile.expertise || activeProfile.skills);

    const summaryText = `
==================================================
KRISHX AGRICULTURAL PROFILE & FARM IDENTITY
==================================================
Farmer Name: ${nameStr}
KrishX ID: ${krishXIdStr}
Location: ${locationStr}
Role: ${roleStr}
Farming Experience: ${activeProfile.experienceYears || 0} Years
Krish Score: ${activeProfile.krishScore || 850}

CURRENT CROPS SOWN:
${cropsList.map(c => `- ${c}`).join('\n') || '- None listed'}

FARMING PRACTICES:
${practicesList.map(p => `- ${p}`).join('\n') || '- None listed'}

FARM EXPERTISE:
${expertiseList.map(e => `- ${e}`).join('\n') || '- None listed'}

ABOUT FARMER:
${bioStr}
==================================================
Verified by KrishX Agricultural Network
    `.trim();

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `KrishX_Farm_Profile_${nameStr.replace(/\s+/g, '_')}.txt`;
    link.click();
    triggerToast('Farm profile summary downloaded!');
  };

  // Profile completion score calculator
  const completionPercentage = (() => {
    if (!userProfile) return 0;
    let score = 0;
    const total = 6;
    if (userProfile.name) score++;
    if (userProfile.photoURL) score++;
    if (userProfile.bio || userProfile.summary) score++;
    if (userProfile.location) score++;
    if ((userProfile.currentCrops || userProfile.crops || []).length > 0) score++;
    if ((userProfile.farmingPractices || userProfile.skills || []).length > 0) score++;
    return Math.round((score / total) * 100);
  })();

  if (loadingProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-stone-500">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading farmer profile...</p>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <Sprout className="w-12 h-12 text-stone-300 mb-3" />
        <h3 className="text-lg font-bold text-stone-800">Profile Not Found</h3>
        <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
          The requested farmer profile does not exist or has been removed.
        </p>
        {setViewedProfileId && (
          <button
            onClick={() => setViewedProfileId(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Profile
          </button>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Farmer Profile Experience">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-stone-700"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visited Profile Back Header */}
        {!isMyOwnProfile && setViewedProfileId && (
          <div className="mb-4">
            <button
              onClick={() => setViewedProfileId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-emerald-900 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Profile
            </button>
          </div>
        )}

        {/* 1. Profile Hero Section */}
        <ProfileHero
          activeProfile={activeProfile}
          isMyOwnProfile={isMyOwnProfile}
          connectionStatus={connectionStatus}
          onConnect={handleConnect}
          onEditProfile={() => setIsEditModalOpen(true)}
          onOpenQr={() => setIsQrModalOpen(true)}
          onShare={handleShareProfile}
          onDownloadProfile={handleDownloadProfilePDF}
          onCopyLink={handleShareProfile}
        />

        {/* 2. Farm Snapshot Section */}
        <FarmSnapshot
          activeProfile={activeProfile}
          postCount={visitedPosts.length}
          onKrishScoreClick={() => setIsKrishScoreModalOpen(true)}
        />

        {/* 3. Responsive Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: About Farmer & My Agriculture */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Completion Indicator (Own profile only if incomplete) */}
            {isMyOwnProfile && completionPercentage < 100 && (
              <div className="bg-emerald-50/90 rounded-2xl p-4 border border-emerald-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-700" />
                    Farm Profile — {completionPercentage}% Complete
                  </span>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-800 hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden mb-2">
                  <div 
                    className="bg-emerald-700 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-emerald-800/90 font-medium flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  <span>Suggested: Add current crops & farming practices.</span>
                </p>
              </div>
            )}

            {/* About Farmer Card */}
            <AboutFarmer
              activeProfile={activeProfile}
              isMyOwnProfile={isMyOwnProfile}
              onEditProfile={() => setIsEditModalOpen(true)}
            />

            {/* My Agriculture Differentiator Card */}
            <MyAgriculture
              activeProfile={activeProfile}
              isMyOwnProfile={isMyOwnProfile}
              onEditProfile={() => setIsEditModalOpen(true)}
            />
          </div>

          {/* Right Column: Profile Content Tabs & Feed */}
          <div className="lg:col-span-8">
            {/* Tabs Control */}
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isMyOwnProfile={isMyOwnProfile}
              postsCount={visitedPosts.length}
              experienceCount={experiences.length}
              achievementsCount={achievements.length}
              savedCount={savedPostsData.length}
            />

            {/* Tab 1: Posts & Saved */}
            {(activeTab === 'posts' || activeTab === 'saved') && (
              <ProfilePosts
                posts={activeTab === 'saved' ? savedPostsData : visitedPosts}
                userProfile={userProfile}
                connections={connections}
                savedPosts={userProfile?.savedPosts || []}
                isMyOwnProfile={isMyOwnProfile}
                isSavedTab={activeTab === 'saved'}
                onToggleSave={handleToggleSave}
                onProfileClick={(authorId) => setViewedProfileId?.(authorId)}
                onGrowTogether={(authorId) => setViewedProfileId?.(authorId)}
                onEditPost={() => {}}
                onDeletePost={handleDeletePost}
                onPreviewImage={(url) => setImageZoomUrl(url)}
                triggerToast={triggerToast}
                onCreatePost={handleCreatePost}
              />
            )}

            {/* Tab 2: Experience */}
            {activeTab === 'experience' && (
              <ExperienceSection
                items={experiences}
                isMyOwnProfile={isMyOwnProfile}
                onSaveItems={handleSaveExperiences}
              />
            )}

            {/* Tab 3: Achievements */}
            {activeTab === 'achievements' && (
              <AchievementsSection
                items={achievements}
                isMyOwnProfile={isMyOwnProfile}
                onSaveItems={handleSaveAchievements}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        {isMyOwnProfile && userProfile && (
          <EditProfileModal
            userProfile={userProfile}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveProfileEdits}
            triggerToast={triggerToast}
          />
        )}

        <KrishXQRModal
          activeProfile={activeProfile}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          triggerToast={triggerToast}
        />

        <KrishScoreModal
          score={activeProfile.krishScore || 850}
          isOpen={isKrishScoreModalOpen}
          onClose={() => setIsKrishScoreModalOpen(false)}
        />

        {/* Image Preview Modal */}
        <AnimatePresence>
          {imageZoomUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setImageZoomUrl(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
            >
              <button
                onClick={() => setImageZoomUrl(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-black/40"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={imageZoomUrl} 
                alt="Zoomed attachment" 
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default Profile;
