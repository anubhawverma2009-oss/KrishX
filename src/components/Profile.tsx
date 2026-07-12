/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Sprout, 
  Check, 
  Plus, 
  X, 
  Edit3, 
  Save, 
  TrendingUp, 
  ShieldCheck,
  User as UserIcon,
  Globe,
  Settings,
  FileText,
  QrCode,
  Download,
  Users2,
  Users,
  LayoutGrid,
  ChevronRight,
  ArrowLeft,
  UserPlus,
  UserCheck,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Trash2,
  Calendar,
  FileDown,
  Eye,
  Filter,
  Link,
  BookOpen,
  Sparkles,
  Info
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
import { UserProfile, Post } from '../types';
import { PostCard } from './PostCard';

interface ProfileProps {
  viewedProfileId?: string | null;
  setViewedProfileId?: (uid: string | null) => void;
  setActiveTab?: (tab: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  viewedProfileId, 
  setViewedProfileId, 
  setActiveTab 
}) => {
  const { userProfile, updateProfile, language, logout, addNotification } = useAuth();
  const t = getTranslation(language);
  
  // Visited profile states
  const [visitedProfile, setVisitedProfile] = useState<UserProfile | null>(null);
  const [visitedPosts, setVisitedPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Redesign States
  const [activeTab, setActivityTab] = useState<'posts' | 'saved'>('posts');
  const [showQrCard, setShowQrCard] = useState(false);
  const [imageZoomUrl, setImageZoomUrl] = useState<string | null>(null);

  // Inline editing switches (Section-by-section)
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [isEditingAchievements, setIsEditingAchievements] = useState(false);

  // Edit fields for Section 2 (About & Meta)
  const [editSummary, setEditSummary] = useState('');
  const [editExperienceYears, setEditExperienceYears] = useState(0);
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editGoals, setEditGoals] = useState('');

  // Active Profile Resolver
  const activeProfile = (viewedProfileId && viewedProfileId !== userProfile?.uid) 
    ? visitedProfile 
    : userProfile;

  const isMyOwnProfile = !viewedProfileId || viewedProfileId === userProfile?.uid;

  // Timeline list state (Experiences, education, certs, crops, languages)
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);

  // Timeline form fields
  const [timelineType, setTimelineType] = useState<'experience' | 'education' | 'certification' | 'language' | 'skill' | 'crop'>('experience');
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineSubtitle, setTimelineSubtitle] = useState('');
  const [timelineDate, setTimelineDate] = useState('');
  const [timelineDescription, setTimelineDescription] = useState('');

  // Achievements list state (Awards, completed training, recognition)
  const [achievementItems, setAchievementItems] = useState<any[]>([]);
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);

  // Achievement form fields
  const [achTitle, setAchTitle] = useState('');
  const [achOrg, setAchOrg] = useState('');
  const [achYear, setAchYear] = useState('');
  const [achType, setAchType] = useState<'award' | 'training' | 'recognition' | 'badge'>('award');

  // Network metrics state
  const [networkStats, setNetworkStats] = useState({
    connections: 42,
    communities: 6,
    followers: 184,
    following: 128
  });

  // Saved posts fallback state
  const [savedPostsData, setSavedPostsData] = useState<Post[]>([]);

  useEffect(() => {
    if (userProfile?.savedPosts && userProfile.savedPosts.length > 0) {
      const q = query(collection(db, 'posts'));
      const unsub = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Post)
          .filter(p => userProfile.savedPosts!.includes(p.id))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSavedPostsData(posts);
      });
      return () => unsub();
    } else {
      setSavedPostsData([]);
    }
  }, [userProfile?.savedPosts]);

  // Toast feedback trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync state for edit form & seed initial timeline data
  useEffect(() => {
    if (activeProfile) {
      setEditSummary(activeProfile.summary || '');
      setEditExperienceYears(activeProfile.experienceYears || 0);
      setEditSpecialization(activeProfile.education || 'जैविक कृषि विशेषज्ञ (Organic Farming Specialist)');
      
      // Load or seed goals
      const localGoals = localStorage.getItem(`krishx_goals_${activeProfile.uid}`);
      setEditGoals(localGoals || 'प्राकृतिक शून्य बजट खेती का विस्तार करना तथा स्थानीय किसानों को ड्रिप सिंचाई पद्धति के प्रति जागरूक करना।');

      // Load or seed timeline
      const savedTimeline = localStorage.getItem(`krishx_profile_timeline_${activeProfile.uid}`);
      if (savedTimeline) {
        setTimelineItems(JSON.parse(savedTimeline));
      } else {
        const seeded = [
          {
            id: 't-1',
            type: 'experience',
            title: 'Lead Agronomist & Farm Manager',
            subtitle: 'Green Valley Organics • Full-time',
            date: 'Jan 2022 - Present',
            description: 'Specializing in organic soil enrichment and pest management for large-scale wheat and mustard crops. Reduced pesticide usage by 40% over two years.'
          },
          {
            id: 't-2',
            type: 'education',
            title: activeProfile.education || 'B.Sc Agriculture',
            subtitle: 'Banaras Hindu University (BHU)',
            date: '2015 - 2019',
            description: 'Completed comprehensive honors program focusing on sustainable cropping systems and soil biochemistry.'
          },
          {
            id: 't-3',
            type: 'certification',
            title: 'Organic Compost Production Specialist',
            subtitle: 'ICAR - National Research Center',
            date: 'May 2021',
            description: 'Certified in vermicompost setups, bio-fertilizer production, and soil nutrient balancing.'
          },
          {
            id: 't-4',
            type: 'skill',
            title: 'Zero-Budget Natural Farming (ZBNF)',
            subtitle: 'Practical Expert',
            date: 'Active since 2020',
            description: 'Implementing Jeevamrutha and Beejamrutha formulations to completely eliminate synthetic chemical dependencies.'
          },
          {
            id: 't-5',
            type: 'crop',
            title: 'Active Crops Sown',
            subtitle: `${(activeProfile.crops || []).join(', ') || 'Wheat, Sugarcane'}`,
            date: 'Seasonal',
            description: 'Using high quality HD-3226 wheat seed and modern trench-sowing for sugarcane.'
          }
        ];
        setTimelineItems(seeded);
        localStorage.setItem(`krishx_profile_timeline_${activeProfile.uid}`, JSON.stringify(seeded));
      }

      // Load or seed achievements
      const savedAchievements = localStorage.getItem(`krishx_ach_list_${activeProfile.uid}`);
      if (savedAchievements) {
        setAchievementItems(JSON.parse(savedAchievements));
      } else {
        const seededAch = [
          {
            id: 'a-1',
            title: 'जिला सर्वोत्तम किसान सम्मान (Best Farmer Award)',
            organization: 'Agriculture Development Board, Uttar Pradesh',
            year: '2024',
            type: 'award'
          },
          {
            id: 'a-2',
            title: 'Climate-Resilient Agriculture Training',
            organization: 'Indian Agricultural Research Institute (IARI)',
            year: '2023',
            type: 'training'
          },
          {
            id: 'a-3',
            title: 'Soil Health Card Scheme Pioneer',
            organization: 'Ministry of Agriculture & Farmers Welfare',
            year: '2022',
            type: 'recognition'
          }
        ];
        setAchievementItems(seededAch);
        localStorage.setItem(`krishx_ach_list_${activeProfile.uid}`, JSON.stringify(seededAch));
      }
    }
  }, [activeProfile]);

  // Real-time subscription for active profile's posts (either logged-in user or visited profile)
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
      loadedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVisitedPosts(loadedPosts);
    }, (error) => {
      console.error("Error listening to user posts:", error);
    });

    return () => {
      unsubPosts();
    };
  }, [activeProfile?.uid]);

  // Fetch visited profile and subscribe to connections
  useEffect(() => {
    // Connections subscription is global and should always be active
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
      return () => {
        unsubConnections();
      };
    }

    setLoadingProfile(true);

    const userDocRef = doc(db, 'users', viewedProfileId);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        setVisitedProfile(docSnap.data() as UserProfile);
      } else {
        console.warn("Visited profile document not found!");
      }
      setLoadingProfile(false);
    }).catch((err) => {
      console.error("Error fetching visited profile:", err);
      setLoadingProfile(false);
    });

    return () => {
      unsubConnections();
    };
  }, [viewedProfileId, userProfile]);

  // Connection status resolver
  const connection = connections.find(c => 
    userProfile && activeProfile && (
      (c.fromId === userProfile.uid && c.toId === activeProfile.uid) || 
      (c.fromId === activeProfile.uid && c.toId === userProfile.uid)
    )
  );

  const handleGrowTogether = async (targetUserId?: any) => {
    const target = (targetUserId && typeof targetUserId === 'string' ? targetUserId : null) || activeProfile?.uid;
    if (!userProfile || !target) return;
    try {
      const conn = connections.find(c => 
        (c.fromId === userProfile.uid && c.toId === target) || 
        (c.fromId === target && c.toId === userProfile.uid)
      );
      if (conn) {
        if (conn.status === 'pending' && conn.toId === userProfile.uid) {
          const connRef = doc(db, 'connections', conn.id);
          await updateDoc(connRef, { status: 'connected' });
          triggerToast("Connection Established!");

          // Add notification for approved request
          await addNotification({
            userId: target,
            senderId: userProfile.uid,
            senderName: userProfile.name,
            senderPhoto: userProfile.photoURL || '',
            type: 'connection',
            title: language === 'en' ? 'Connection Request Accepted' : 'कनेक्शन अनुरोध स्वीकार किया गया',
            body: language === 'en'
              ? `${userProfile.name} accepted your connection request. You are now connected.`
              : `${userProfile.name} ने आपका कनेक्शन अनुरोध स्वीकार कर लिया है। अब आप जुड़े हुए हैं।`
          });
        } else {
          triggerToast("Already pending or connected.");
        }
        return;
      }
      await addDoc(collection(db, 'connections'), {
        fromId: userProfile.uid,
        toId: target,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      triggerToast("Connection Request Sent!");

      // Add notification for new request
      await addNotification({
        userId: target,
        senderId: userProfile.uid,
        senderName: userProfile.name,
        senderPhoto: userProfile.photoURL || '',
        type: 'connection',
        title: language === 'en' ? 'Connection Request' : 'कनेक्शन अनुरोध',
        body: language === 'en'
          ? `${userProfile.name} sent you a professional connection request.`
          : `${userProfile.name} ने आपको एक पेशेवर कनेक्शन अनुरोध भेजा है।`
      });
    } catch (err) {
      console.error("Error updating connection:", err);
    }
  };

  const toggleSavePost = async (postId: string) => {
    if (!userProfile) return;
    const isSaved = (userProfile.savedPosts || []).includes(postId);
    const userRef = doc(db, 'users', userProfile.uid);
    try {
      if (isSaved) {
        await updateDoc(userRef, { savedPosts: arrayRemove(postId) });
        triggerToast("Post removed from saved.");
      } else {
        await updateDoc(userRef, { savedPosts: arrayUnion(postId) });
        triggerToast("Post saved successfully!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!userProfile) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      triggerToast("Post deleted successfully.");
    } catch (err) {
      console.error("Error deleting post:", err);
      triggerToast("Failed to delete post.");
    }
  };

  // 1. SECTION 2: Save About Info (Inline)
  const handleSaveAbout = async () => {
    if (!userProfile) return;
    try {
      await updateProfile({
        summary: editSummary,
        experienceYears: Number(editExperienceYears),
        education: editSpecialization
      });
      localStorage.setItem(`krishx_goals_${userProfile.uid}`, editGoals);
      setIsEditingAbout(false);
      triggerToast("परिचय सफलतापूर्वक अपडेट किया गया (About Info Saved)!");
    } catch (err) {
      console.error(err);
      triggerToast("अपडेट विफल।");
    }
  };

  // 2. SECTION 3: Timeline Inline Operations (Add, Edit, Delete)
  const handleSaveTimelineItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !timelineTitle.trim()) return;

    let updatedList = [...timelineItems];
    if (editingTimelineId) {
      // Edit
      updatedList = updatedList.map(item => 
        item.id === editingTimelineId 
          ? { ...item, type: timelineType, title: timelineTitle, subtitle: timelineSubtitle, date: timelineDate, description: timelineDescription }
          : item
      );
      triggerToast("अनुभव संशोधित किया गया (Timeline updated)!");
    } else {
      // Add
      const newItem = {
        id: 't-' + Math.random().toString(36).substring(4),
        type: timelineType,
        title: timelineTitle,
        subtitle: timelineSubtitle,
        date: timelineDate,
        description: timelineDescription
      };
      updatedList = [newItem, ...updatedList];
      triggerToast("नया अनुभव जोड़ा गया (Timeline item added)!");
    }

    setTimelineItems(updatedList);
    localStorage.setItem(`krishx_profile_timeline_${userProfile.uid}`, JSON.stringify(updatedList));
    resetTimelineForm();
  };

  const handleStartEditTimeline = (item: any) => {
    setEditingTimelineId(item.id);
    setTimelineType(item.type);
    setTimelineTitle(item.title);
    setTimelineSubtitle(item.subtitle);
    setTimelineDate(item.date);
    setTimelineDescription(item.description || '');
    setIsAddingTimeline(true);
  };

  const handleDeleteTimeline = (id: string) => {
    if (!userProfile) return;
    const updated = timelineItems.filter(x => x.id !== id);
    setTimelineItems(updated);
    localStorage.setItem(`krishx_profile_timeline_${userProfile.uid}`, JSON.stringify(updated));
    triggerToast("अनुभव हटाया गया (Timeline item removed)!");
  };

  const resetTimelineForm = () => {
    setEditingTimelineId(null);
    setIsAddingTimeline(false);
    setTimelineTitle('');
    setTimelineSubtitle('');
    setTimelineDate('');
    setTimelineDescription('');
  };

  // 3. SECTION 4: Achievements Inline Operations (Add, Edit, Delete)
  const handleSaveAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !achTitle.trim()) return;

    let updatedList = [...achievementItems];
    if (editingAchievementId) {
      // Edit
      updatedList = updatedList.map(item => 
        item.id === editingAchievementId 
          ? { ...item, title: achTitle, organization: achOrg, year: achYear, type: achType }
          : item
      );
      triggerToast("सम्मान विवरण संशोधित (Achievement updated)!");
    } else {
      // Add
      const newItem = {
        id: 'a-' + Math.random().toString(36).substring(4),
        title: achTitle,
        organization: achOrg,
        year: achYear,
        type: achType
      };
      updatedList = [newItem, ...updatedList];
      triggerToast("नया सम्मान जोड़ा गया (Achievement added)!");
    }

    setAchievementItems(updatedList);
    localStorage.setItem(`krishx_ach_list_${userProfile.uid}`, JSON.stringify(updatedList));
    resetAchievementForm();
  };

  const handleStartEditAchievement = (item: any) => {
    setEditingAchievementId(item.id);
    setAchTitle(item.title);
    setAchOrg(item.organization);
    setAchYear(item.year);
    setAchType(item.type);
    setIsAddingAchievement(true);
  };

  const handleDeleteAchievement = (id: string) => {
    if (!userProfile) return;
    const updated = achievementItems.filter(x => x.id !== id);
    setAchievementItems(updated);
    localStorage.setItem(`krishx_ach_list_${userProfile.uid}`, JSON.stringify(updated));
    triggerToast("सम्मान सूची से हटाया गया (Achievement removed)!");
  };

  const resetAchievementForm = () => {
    setEditingAchievementId(null);
    setIsAddingAchievement(false);
    setAchTitle('');
    setAchOrg('');
    setAchYear('');
  };

  // Action: Share Profile
  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile?uid=${activeProfile.uid}`;
    navigator.clipboard.writeText(url);
    triggerToast("प्रोफ़ाइल लिंक कॉपी किया गया (Link Copied to Clipboard)!");
  };

  // Action: Download Resume PDF & Digital Printable Mode
  const handleDownloadResume = () => {
    triggerToast("Generating Printable Farmer Digital Resume...");
    
    // Create print overlay element
    const printContent = document.createElement('div');
    printContent.className = "print-only-container p-12 bg-white text-slate-900 font-sans space-y-8";
    printContent.id = "krishx-print-resume";
    printContent.innerHTML = `
      <div style="border-bottom: 4px solid #064e3b; padding-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="font-size: 32px; font-weight: 900; color: #064e3b; margin: 0;">${activeProfile.name}</h1>
          <p style="font-size: 14px; font-weight: bold; color: #047857; margin: 4px 0 0 0;">${activeProfile.education || 'Agricultural Professional'}</p>
          <p style="font-size: 12px; color: #475569; margin: 8px 0 0 0;">📍 ${activeProfile.location} | ID: ${activeProfile.krishXId || 'KX-IN-912239'}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 900; color: #064e3b;">Krish Score: ${activeProfile.krishScore || 850}</div>
          <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">VERIFIED FARMER CERTIFICATION</p>
        </div>
      </div>

      <div>
        <h2 style="font-size: 16px; font-weight: 900; text-transform: uppercase; color: #064e3b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Professional Summary</h2>
        <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 8px 0 0 0;">${activeProfile.summary || 'Expert organic farmer dedicated to eco-friendly practices.'}</p>
      </div>

      <div>
        <h2 style="font-size: 16px; font-weight: 900; text-transform: uppercase; color: #064e3b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Professional Timeline</h2>
        <div style="margin-top: 12px;">
          ${timelineItems.map(item => `
            <div style="margin-bottom: 16px; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
                <span style="color: #0f172a;">${item.title}</span>
                <span style="color: #047857;">${item.date}</span>
              </div>
              <div style="font-size: 11px; color: #475569; margin: 2px 0;">${item.subtitle} <span style="font-size: 9px; background: #f0fdf4; color: #166534; padding: 1px 6px; border-radius: 4px; font-weight: 900; text-transform: uppercase; margin-left: 8px;">${item.type}</span></div>
              <p style="font-size: 12px; color: #334155; margin: 4px 0 0 0; line-height: 1.5;">${item.description || ''}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <h2 style="font-size: 16px; font-weight: 900; text-transform: uppercase; color: #064e3b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Achievements & Recognition</h2>
        <div style="margin-top: 12px; display: grid; grid-template-cols: 1fr; gap: 8px;">
          ${achievementItems.map(item => `
            <div style="background: #f8fafc; border-left: 3px solid #b45309; padding: 10px; border-radius: 4px; page-break-inside: avoid;">
              <div style="font-size: 12px; font-weight: bold; color: #0f172a;">${item.title}</div>
              <div style="font-size: 11px; color: #475569;">${item.organization} (${item.year})</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
        <span>Generated via KrishX - Digital Farm Network</span>
        <span>Scan-to-Verify ID: ${activeProfile.krishXId || 'KX-IN-912239'}</span>
      </div>
    `;

    document.body.appendChild(printContent);

    // Dynamic Print Style Injection
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body > *:not(#krishx-print-resume) {
          display: none !important;
        }
        #krishx-print-resume {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
      #krishx-print-resume {
        display: none;
      }
    `;
    document.head.appendChild(style);

    // Call browser printer
    setTimeout(() => {
      window.print();
      // Clean up after print window closes
      document.body.removeChild(printContent);
      document.head.removeChild(style);
    }, 500);
  };

  const getTimelineTypeBadge = (type: string) => {
    switch (type) {
      case 'experience': return { label: 'Experience', color: 'bg-krishx-earth-50 text-krishx-green-700 border-krishx-earth-200' };
      case 'education': return { label: 'Education', color: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'certification': return { label: 'Certification', color: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'language': return { label: 'Language', color: 'bg-purple-50 text-purple-700 border-purple-100' };
      case 'skill': return { label: 'Expertise', color: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'crop': return { label: 'Crop Sowing', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      default: return { label: 'Milestone', color: 'bg-gray-50 text-gray-700 border-gray-100' };
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-krishx-dark-900/30 border-t-krishx-green-600 rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-wider text-krishx-dark-800/40">Loading Professional Profile...</p>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <p className="text-xs font-black uppercase tracking-wider text-krishx-dark-800/40">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-6xl mx-auto px-2 sm:px-4 pb-24 select-none relative">
      
      {/* Toast Feedback Popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100] bg-krishx-dark-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-krishx-dark-700 flex items-center gap-3 text-xs font-semibold tracking-wide"
          >
            <div className="w-2 h-2 bg-krishx-green-400 rounded-full animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image zoom modal overlay */}
      <AnimatePresence>
        {imageZoomUrl && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setImageZoomUrl(null)}
          >
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={imageZoomUrl} 
              className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" 
              alt="Media preview"
            />
          </div>
        )}
      </AnimatePresence>

      {/* Back link for visitors */}
      {!isMyOwnProfile && (
        <button 
          onClick={() => {
            if (setViewedProfileId) setViewedProfileId(null);
            if (setActiveTab) setActiveTab('home');
          }}
          className="inline-flex items-center gap-2.5 px-5 py-3 bg-white hover:bg-krishx-earth-50/80 text-krishx-dark-900 border border-krishx-earth-200/80 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm group hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4 text-krishx-green-655 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Feed</span>
        </button>
      )}

      {/* ==================================================== */}
      {/* SECTION 1: PROFILE HEADER                           */}
      {/* ==================================================== */}
      <div className="bg-white/75 backdrop-blur-xl border border-krishx-earth-200/50 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden relative transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)]">
        
        {/* Large Premium Cover Banner */}
        <div className="h-72 md:h-96 relative overflow-hidden bg-krishx-dark-900">
          <img 
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200" 
            alt="Farming banner" 
            className="w-full h-full object-cover opacity-60 scale-102 hover:scale-105 transition-transform duration-[4000ms] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/15" />
          
          {/* Cover decorative badges */}
          <div className="absolute top-6 right-6 flex gap-2">
            <span className="text-[10px] font-black tracking-widest bg-krishx-green-600 text-white border border-krishx-green-400/45 backdrop-blur-md px-3.5 py-2 rounded-xl uppercase flex items-center gap-2 shadow-lg hover:bg-krishx-green-700 transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-300 animate-pulse" strokeWidth={2.5} />
              Verified Farmer
            </span>
          </div>
        </div>

        {/* Info Layout Grid (Profile Photo overlapping the banner) */}
        <div className="px-6 md:px-12 pb-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 -mt-24 md:-mt-28 mb-8">
            
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
              {/* Profile Picture Frame */}
              <div className="relative shrink-0 select-none group">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] p-2 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border-4 border-white group-hover:scale-102 transition-transform duration-500 overflow-hidden">
                  <img 
                    src={activeProfile.photoURL || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} 
                    alt={activeProfile.name} 
                    className="w-full h-full rounded-[1.85rem] object-cover"
                  />
                </div>
                <span className="absolute bottom-2.5 right-2.5 w-7.5 h-7.5 bg-krishx-green-550 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
                </span>
              </div>

              {/* Name and Slogan details */}
              <div className="space-y-3.5 pt-4">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl md:text-5xl font-display font-black text-krishx-dark-900 tracking-tight leading-none">
                    {activeProfile.name}
                  </h1>
                  
                  {activeProfile.badges?.includes('expert') && (
                    <span className="bg-krishx-green-50 text-krishx-green-700 text-[9px] font-black px-2.5 py-1 rounded-full border border-krishx-green-200 uppercase tracking-widest flex items-center gap-1.5 shadow-xs">
                      <Award className="w-3.5 h-3.5" /> expert
                    </span>
                  )}
                </div>

                <p className="text-[12px] md:text-[14px] font-black text-krishx-green-700 uppercase tracking-[0.22em] leading-none">
                  {editSpecialization || 'प्रगतिशील कृषक (Progressive Farmer)'}
                </p>

                <p className="text-[15px] md:text-[16px] text-krishx-dark-700/85 font-semibold leading-relaxed max-w-xl">
                  {editSummary || 'Dedicated to premium zero-chemical farming practices.'}
                </p>

                {/* Sub Metadata rows (Location, KrishX ID) */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2.5 text-[10px] font-bold text-krishx-dark-700/60 uppercase tracking-[0.15em] pt-1">
                  <span className="flex items-center gap-1.5 bg-krishx-earth-50/50 px-3.5 py-2 rounded-full border border-krishx-earth-200/40"><MapPin className="w-4 h-4 text-krishx-green-655" /> {activeProfile.location}</span>
                  <span className="hidden md:inline text-krishx-earth-300">•</span>
                  <span className="flex items-center gap-1.5 font-mono tracking-normal text-[11px] bg-krishx-green-50 text-krishx-green-850 px-3.5 py-2 rounded-full border border-krishx-green-100">ID: {activeProfile.krishXId || 'KX-PB-449120'}</span>
                </div>
              </div>
            </div>

            {/* Score Showcase Bubble */}
            <div className="bg-gradient-to-br from-krishx-green-50/30 to-krishx-earth-50/30 backdrop-blur-md border border-krishx-green-100/50 rounded-[2.25rem] p-6 shrink-0 flex items-center gap-5 shadow-[0_12px_30px_rgba(0,0,0,0.03)] max-w-xs mx-auto lg:mx-0 transition-transform duration-300 hover:scale-[1.02]">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-krishx-earth-100" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray="175.9" 
                    strokeDashoffset={175.9 * (1 - (activeProfile.krishScore || 450) / 1000)} 
                    strokeLinecap="round" 
                    className="text-krishx-green-550 transition-all duration-1000" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-krishx-dark-900">
                  {activeProfile.krishScore || 450}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-krishx-dark-700/50">Krish Score</p>
                <p className="text-[14px] font-black text-krishx-dark-900 mt-1">Professional Trust</p>
                <p className="text-[11px] text-krishx-green-650 font-bold mt-0.5">Top 15% Verified</p>
              </div>
            </div>

          </div>

          <hr className="border-krishx-earth-200/40 mb-8" />

          {/* Primary Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              {isMyOwnProfile ? (
                <>
                  <button 
                    onClick={() => {
                      setIsEditingAbout(!isEditingAbout);
                      setIsEditingTimeline(false);
                      setIsEditingAchievements(false);
                      triggerToast(isEditingAbout ? "Cancelled edits" : "Inline edit fields activated!");
                    }} 
                    className={`px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      isEditingAbout 
                        ? 'bg-krishx-earth-100 text-krishx-dark-900' 
                        : 'premium-btn shadow-md hover:scale-[1.01]'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditingAbout ? 'Cancel Edit' : 'Edit Profile'}
                  </button>

                  <button 
                    onClick={handleShareProfile}
                    className="px-5 py-3 bg-white text-krishx-dark-900 border border-krishx-earth-200/50 hover:border-krishx-earth-300 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-krishx-earth-50/50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Share2 className="w-4 h-4 text-krishx-dark-700/60" />
                    Share Profile
                  </button>

                  <button 
                    onClick={handleDownloadResume}
                    className="px-5 py-3 bg-white text-krishx-dark-900 border border-krishx-earth-200/50 hover:border-krishx-earth-300 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-krishx-earth-50/50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <FileDown className="w-4 h-4 text-krishx-dark-700/60" />
                    Print Resume PDF
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleGrowTogether}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                    connection?.status === 'connected'
                      ? 'bg-krishx-earth-50 text-krishx-dark-800 border-krishx-earth-300'
                      : connection?.status === 'pending'
                        ? connection.toId === userProfile?.uid
                          ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                          : 'bg-krishx-earth-50 text-krishx-dark-800/50 border-krishx-earth-200 cursor-not-allowed'
                        : 'bg-krishx-dark-900 hover:bg-krishx-dark-800 text-white border-krishx-dark-900'
                  }`}
                >
                  {connection?.status === 'connected' ? (
                    <>
                      <UserCheck className="w-4 h-4 text-krishx-green-600" />
                      <span>Connected</span>
                    </>
                  ) : connection?.status === 'pending' ? (
                    connection.toId === userProfile?.uid ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Accept Request</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-krishx-green-500" />
                        <span>Request Pending</span>
                      </>
                    )
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Connect with Farmer</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* QR Code trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowQrCard(!showQrCard)}
                className="p-3 bg-krishx-earth-50/50 hover:bg-krishx-earth-200/50 border border-krishx-earth-200 rounded-xl text-krishx-dark-900 transition-all flex items-center gap-1.5 shadow-sm"
                title="Scan to Verify Credentials"
              >
                <QrCode className="w-4 h-4 text-krishx-green-705" />
                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Verification QR</span>
              </button>

              {/* QR Code drop bubble */}
              <AnimatePresence>
                {showQrCard && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 bg-white border border-krishx-earth-200 p-5 rounded-[2rem] shadow-2xl z-20 w-64 text-center space-y-3.5"
                  >
                    <div className="bg-[#FAF9F5] p-4 rounded-2xl inline-block border border-krishx-earth-50 shadow-inner">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.origin + '/profile?uid=' + activeProfile.uid)}&color=064e3b`} 
                        alt="Verification QR" 
                        className="w-32 h-32 mx-auto"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-krishx-dark-900 uppercase">Scan to Verify Profile</p>
                      <p className="text-[8px] text-krishx-dark-700/60 font-semibold mt-1">KrishX Cryptographic Signature</p>
                    </div>
                    <button 
                      onClick={() => setShowQrCard(false)}
                      className="w-full py-2 bg-krishx-earth-50 hover:bg-krishx-earth-200 text-krishx-dark-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* ==================================================== */}
      {/* TWO-COLUMN CONTENT GRID                              */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================================================== */}
        {/* LEFT COLUMN (BENTO METRICS, ABOUT, ACHIEVEMENTS, NET) */}
        {/* ==================================================== */}
        <div className="lg:col-span-5 space-y-10">
          
          {/* ========================================== */}
          {/* SECTION 2: ABOUT / SUMMARY CARD            */}
          {/* ========================================== */}
          <div className="bg-white/70 backdrop-blur-md border border-krishx-earth-200/40 p-8 rounded-[2rem] shadow-[0_12px_40px_-15px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.06)] hover:border-krishx-green-200/40 transition-all duration-300 space-y-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 bg-krishx-earth-50 border border-krishx-earth-200/40 rounded-xl shrink-0"><UserIcon className="w-4.5 h-4.5 text-krishx-dark-700" /></span>
                <h3 className="text-[11px] md:text-[12px] font-black text-krishx-dark-900 uppercase tracking-[0.2em]">About Professional</h3>
              </div>
              {isMyOwnProfile && (
                <button 
                  onClick={() => setIsEditingAbout(!isEditingAbout)}
                  className="p-2 hover:bg-krishx-earth-50 text-krishx-dark-700/60 hover:text-krishx-dark-900 rounded-xl transition-all"
                >
                  {isEditingAbout ? <X className="w-5 h-5 text-rose-500" /> : <Edit3 className="w-5 h-5" />}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!isEditingAbout ? (
                /* Static view mode */
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="space-y-7"
                >
                  <p className="text-[15px] md:text-[16px] text-krishx-dark-700/90 font-medium leading-relaxed tracking-wide whitespace-pre-wrap">
                    {editSummary || 'मैं एक प्रगतिशील भारतीय किसान हूँ जो पर्यावरण-अनुकूल और आधुनिक कृषि विधियों से फसल उत्पादन बढ़ाता हूँ।'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-5 border-t border-krishx-earth-200/30">
                    <div className="bg-gradient-to-br from-white/90 to-[#FAF9F5]/90 border border-krishx-earth-200/40 p-4.5 rounded-[1.5rem] shadow-xs hover:border-krishx-green-200/60 transition-colors">
                      <span className="text-[9px] font-bold text-krishx-dark-700/50 uppercase tracking-[0.15em] block">Years Experience</span>
                      <span className="text-lg font-black text-krishx-dark-900 mt-1 block">{editExperienceYears || 0} Years Active</span>
                    </div>
                    <div className="bg-gradient-to-br from-white/90 to-[#FAF9F5]/90 border border-krishx-earth-200/40 p-4.5 rounded-[1.5rem] shadow-xs hover:border-krishx-green-200/60 transition-colors">
                      <span className="text-[9px] font-bold text-krishx-dark-700/50 uppercase tracking-[0.15em] block">Specialization</span>
                      <span className="text-sm font-black text-krishx-dark-900 truncate block mt-2">{editSpecialization || 'Organic Farming'}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white/90 to-[#FAF9F5]/40 p-5 rounded-[1.5rem] border border-krishx-earth-200/40">
                    <span className="text-[9px] font-bold text-krishx-dark-700/50 uppercase tracking-[0.15em] block mb-2">Career & Sowing Goals</span>
                    <p className="text-[14px] text-krishx-dark-700 leading-relaxed tracking-wide font-medium">
                      {editGoals}
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Inline edit fields (no popups) */
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="space-y-4 pt-1"
                >
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-krishx-dark-800/40 uppercase tracking-widest px-1">About Summary</label>
                    <textarea 
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      rows={4}
                      className="w-full p-3.5 bg-[#FAF9F5] border border-krishx-earth-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-krishx-green-700 focus:bg-white text-krishx-dark-900 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-krishx-dark-700/60 uppercase tracking-[0.1em] px-1">Farming Experience (Yrs)</label>
                      <input 
                        type="number"
                        value={editExperienceYears}
                        onChange={(e) => setEditExperienceYears(Number(e.target.value))}
                        className="w-full p-3.5 premium-input transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-krishx-dark-700/60 uppercase tracking-[0.1em] px-1">Specialization</label>
                      <input 
                        type="text"
                        value={editSpecialization}
                        onChange={(e) => setEditSpecialization(e.target.value)}
                        className="w-full p-3.5 premium-input transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-krishx-dark-700/60 uppercase tracking-[0.1em] px-1">Future Agricultural Goals</label>
                    <input 
                      type="text"
                      value={editGoals}
                      onChange={(e) => setEditGoals(e.target.value)}
                      className="w-full p-3.5 premium-input transition-all"
                    />
                  </div>

                  {/* Inline controls */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveAbout}
                      className="flex-1 py-3 bg-krishx-dark-900 hover:bg-krishx-dark-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Save About Info
                    </button>
                    <button
                      onClick={() => setIsEditingAbout(false)}
                      className="px-4 py-3 bg-krishx-earth-50 text-krishx-dark-900 hover:bg-krishx-earth-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ==================================================== */}
          {/* SECTION 4: ACHIEVEMENTS                              */}
          {/* ==================================================== */}
          <div className="bg-white/70 backdrop-blur-md border border-krishx-earth-200/40 p-8 rounded-[2rem] shadow-[0_12px_40px_-15px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.06)] hover:border-krishx-green-200/40 transition-all duration-300 space-y-7">
            <div className="flex items-center justify-between border-b border-krishx-earth-200/30 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 bg-amber-50 text-amber-600 rounded-xl shrink-0"><Award className="w-5 h-5" /></span>
                <h3 className="text-[11px] md:text-[12px] font-black text-krishx-dark-900 uppercase tracking-[0.2em]">Achievements & Awards</h3>
              </div>
              {isMyOwnProfile && (
                <button 
                  onClick={() => {
                    setIsAddingAchievement(!isAddingAchievement);
                    setEditingAchievementId(null);
                    if (!isAddingAchievement) {
                      setAchTitle('');
                      setAchOrg('');
                      setAchYear('');
                    }
                  }}
                  className="p-1.5 hover:bg-krishx-earth-50 text-krishx-dark-700 rounded-xl transition-all"
                >
                  {isAddingAchievement ? <X className="w-4 h-4 text-rose-600" /> : <Plus className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Achievements Add/Edit Inline Form (Section 7 rule) */}
            <AnimatePresence>
              {isAddingAchievement && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveAchievement}
                  className="bg-[#FAF9F5]/80 border border-amber-100 p-4 rounded-2xl space-y-3.5 overflow-hidden"
                >
                  <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider">
                    {editingAchievementId ? 'Edit Achievement Inline' : 'Add New Achievement Inline'}
                  </p>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Title (सम्मान/अवार्ड)</label>
                    <input 
                      type="text" required placeholder="e.g. जिला सर्वोत्तम किसान सम्मान"
                      value={achTitle} onChange={(e) => setAchTitle(e.target.value)}
                      className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Organization</label>
                      <input 
                        type="text" placeholder="e.g. State Board"
                        value={achOrg} onChange={(e) => setAchOrg(e.target.value)}
                        className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Year</label>
                      <input 
                        type="text" placeholder="e.g. 2024"
                        value={achYear} onChange={(e) => setAchYear(e.target.value)}
                        className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Type Category</label>
                    <select
                      value={achType} onChange={(e: any) => setAchType(e.target.value)}
                      className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none"
                    >
                      <option value="award">Award (पुरस्कार)</option>
                      <option value="training">Training Completed (प्रशिक्षण)</option>
                      <option value="recognition">Govt Recognition (सरकारी मान्यता)</option>
                      <option value="badge">Badge Earned (बैज)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    <button 
                      type="submit"
                      className="flex-1 py-2.5 bg-krishx-dark-900 hover:bg-krishx-dark-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Save Achievement
                    </button>
                    <button 
                      type="button" onClick={resetAchievementForm}
                      className="px-4 py-2.5 bg-white text-krishx-dark-900 border border-krishx-earth-200/50 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-krishx-earth-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Achievements List Display */}
            <div className="space-y-3.5">
              {achievementItems.map((item) => (
                <div 
                  key={item.id}
                  className="group flex gap-4 items-center bg-gradient-to-br from-white to-[#FAF9F5]/40 border border-krishx-earth-200/45 p-4 rounded-2xl hover:border-krishx-green-200 hover:bg-white hover:shadow-premium-soft transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                      <span className="text-[10px] font-mono text-krishx-dark-700/50 font-bold">{item.year}</span>
                    </div>
                    <h4 className="text-[12px] font-bold text-krishx-dark-900 truncate mt-1">{item.title}</h4>
                    <p className="text-[10px] text-krishx-dark-700/60 font-semibold truncate">{item.organization}</p>
                  </div>

                  {/* Edit/Delete inline operations */}
                  {isMyOwnProfile && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleStartEditAchievement(item)}
                        className="p-1.5 text-krishx-dark-700 hover:bg-krishx-earth-100 rounded-lg"
                        title="Edit inline"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAchievement(item.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete inline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {achievementItems.length === 0 && (
                <p className="text-center py-6 text-[10px] font-bold text-krishx-dark-700/40 uppercase tracking-[0.2em]">
                  No achievements configured.
                </p>
              )}
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 6: NETWORK METRICS                           */}
          {/* ==================================================== */}
          <div className="bg-white/70 backdrop-blur-md border border-krishx-earth-200/40 p-8 rounded-[2rem] shadow-[0_12px_40px_-15px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.06)] hover:border-krishx-green-200/40 transition-all duration-300 space-y-6">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 bg-krishx-earth-50 text-krishx-dark-700 border border-krishx-earth-200/40 rounded-xl shrink-0"><Users2 className="w-4.5 h-4.5" /></span>
              <h3 className="text-[11px] md:text-[12px] font-black text-krishx-dark-900 uppercase tracking-[0.15em]">Farmer Network</h3>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-gradient-to-br from-white to-[#FAF9F5]/40 hover:from-white hover:to-white border border-krishx-earth-200/40 hover:border-krishx-green-200 p-4.5 rounded-2xl text-center shadow-xs transition-all duration-300 hover:scale-[1.02]">
                <span className="text-2.5xl font-extrabold text-krishx-dark-900 tabular-nums">{networkStats.connections}</span>
                <span className="text-[9px] font-bold text-krishx-dark-700/50 uppercase tracking-[0.15em] block mt-1">Connections</span>
              </div>
              <div className="bg-gradient-to-br from-white to-[#FAF9F5]/40 hover:from-white hover:to-white border border-krishx-earth-200/40 hover:border-krishx-green-200 p-4.5 rounded-2xl text-center shadow-xs transition-all duration-300 hover:scale-[1.02]">
                <span className="text-2.5xl font-extrabold text-krishx-dark-900 tabular-nums">{networkStats.communities}</span>
                <span className="text-[9px] font-bold text-krishx-dark-700/50 uppercase tracking-[0.15em] block mt-1">Communities</span>
              </div>
              <div className="bg-gradient-to-br from-white to-[#FAF9F5]/40 hover:from-white hover:to-white border border-krishx-earth-200/40 hover:border-krishx-green-200 p-4.5 rounded-2xl text-center shadow-xs transition-all duration-300 hover:scale-[1.02]">
                <span className="text-2.5xl font-extrabold text-krishx-dark-900 tabular-nums">{networkStats.followers}</span>
                <span className="text-[9px] font-bold text-krishx-dark-700/50 uppercase tracking-[0.15em] block mt-1">Followers</span>
              </div>
              <div className="bg-gradient-to-br from-white to-[#FAF9F5]/40 hover:from-white hover:to-white border border-krishx-earth-200/40 hover:border-krishx-green-200 p-4.5 rounded-2xl text-center shadow-xs transition-all duration-300 hover:scale-[1.02]">
                <span className="text-2.5xl font-extrabold text-krishx-dark-900 tabular-nums">{networkStats.following}</span>
                <span className="text-[9px] font-bold text-krishx-dark-700/50 uppercase tracking-[0.15em] block mt-1">Following</span>
              </div>
            </div>

            {/* Micro avatars row */}
            <div className="pt-4 border-t border-krishx-earth-200/40 flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                <img className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=50" alt="Avatar" />
                <img className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=50" alt="Avatar" />
                <img className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=50" alt="Avatar" />
                <span className="flex items-center justify-center h-6.5 w-6.5 rounded-full ring-2 ring-white bg-krishx-dark-900 text-[8.5px] font-extrabold text-white">+39</span>
              </div>
              <span className="text-[10px] font-black text-krishx-green-700 uppercase tracking-[0.12em]">Growing together</span>
            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN (TIMELINE, ACTIVITY TABS)               */}
        {/* ==================================================== */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* ==================================================== */}
          {/* SECTION 3: PROFESSIONAL INFORMATION (SINGLE TIMELINE) */}
          {/* ==================================================== */}
          <div className="bg-white/70 backdrop-blur-md border border-krishx-earth-200/40 p-8 rounded-[2rem] shadow-[0_12px_40px_-15px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.06)] hover:border-krishx-green-200/40 transition-all duration-300 space-y-7">
            <div className="flex items-center justify-between border-b border-krishx-earth-200/30 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 bg-krishx-earth-50 text-krishx-dark-700 border border-krishx-earth-200/40 rounded-xl shrink-0"><Sprout className="w-4.5 h-4.5" /></span>
                <div>
                  <h3 className="text-[11px] md:text-[12px] font-black text-krishx-dark-900 uppercase tracking-[0.2em]">Professional Timeline</h3>
                  <p className="text-[9px] text-krishx-dark-700/50 font-bold uppercase tracking-[0.1em] mt-1">Experience • Education • Certifications • Languages</p>
                </div>
              </div>

              {isMyOwnProfile && (
                <button 
                  onClick={() => {
                    setIsAddingTimeline(!isAddingTimeline);
                    setEditingTimelineId(null);
                    if (!isAddingTimeline) {
                      setTimelineTitle('');
                      setTimelineSubtitle('');
                      setTimelineDate('');
                      setTimelineDescription('');
                    }
                  }}
                  className="p-2 hover:bg-krishx-earth-50 text-krishx-dark-700/60 hover:text-krishx-dark-900 rounded-xl transition-all"
                  title="Add timeline record inline"
                >
                  {isAddingTimeline ? <X className="w-5 h-5 text-rose-500" /> : <Plus className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Timeline Add/Edit Inline Form (Section 7 rule) */}
            <AnimatePresence>
              {isAddingTimeline && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveTimelineItem}
                  className="bg-[#FAF9F5] border border-krishx-earth-200 p-5 rounded-2xl space-y-3.5 overflow-hidden"
                >
                  <p className="text-[9px] font-black text-krishx-dark-900 uppercase tracking-widest">
                    {editingTimelineId ? 'Edit Timeline Record Inline' : 'Add New Timeline Record Inline'}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Record Type</label>
                      <select 
                        value={timelineType} onChange={(e: any) => setTimelineType(e.target.value)}
                        className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        <option value="experience">Experience (कार्य अनुभव)</option>
                        <option value="education">Education (शिक्षा)</option>
                        <option value="certification">Certification (प्रमाणपत्र)</option>
                        <option value="skill">Key Expertise (कौशल)</option>
                        <option value="crop">Crop Specialization (फसल बोना)</option>
                        <option value="language">Language Proficiency (भाषा)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Date / Duration</label>
                      <input 
                        type="text" required placeholder="e.g. 2022 - Present, 2021"
                        value={timelineDate} onChange={(e) => setTimelineDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Headline (शीर्षक)</label>
                    <input 
                      type="text" required placeholder="e.g. Senior Field Specialist"
                      value={timelineTitle} onChange={(e) => setTimelineTitle(e.target.value)}
                      className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Sub-Headline / Organization</label>
                    <input 
                      type="text" placeholder="e.g. Green Valley Farms Inc."
                      value={timelineSubtitle} onChange={(e) => setTimelineSubtitle(e.target.value)}
                      className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-krishx-dark-900/40 uppercase tracking-widest">Description / Specific Actions</label>
                    <textarea 
                      rows={2} placeholder="Briefly write notes about this milestone..."
                      value={timelineDescription} onChange={(e) => setTimelineDescription(e.target.value)}
                      className="w-full p-2.5 bg-white border border-krishx-earth-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    <button 
                      type="submit"
                      className="flex-1 py-2.5 premium-btn text-[10px] uppercase"
                    >
                      Apply Timeline Record
                    </button>
                    <button 
                      type="button" onClick={resetTimelineForm}
                      className="px-4 py-2.5 bg-white text-krishx-dark-900 border border-krishx-earth-200/50 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-krishx-earth-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Continuous Vertical Timeline Track */}
            <div className="relative border-l border-krishx-earth-200/60 ml-5 pl-8 space-y-8 pt-2">
              {timelineItems.map((item) => {
                const badge = getTimelineTypeBadge(item.type);
                return (
                  <div key={item.id} className="relative group select-none">
                    
                    {/* Circle Bullet marker */}
                    <span className="absolute -left-[41px] top-4 bg-white border-2 border-krishx-green-600/80 rounded-full w-5 h-5 flex items-center justify-center shadow-md ring-4 ring-krishx-green-50/55">
                      <span className="bg-krishx-green-600 rounded-full w-1.5 h-1.5" />
                    </span>

                    {/* Content Block */}
                    <div className="bg-gradient-to-br from-white to-[#FAF9F5]/40 hover:from-white hover:to-white border border-krishx-earth-200/50 p-5.5 rounded-[1.5rem] shadow-xs hover:shadow-premium-soft hover:border-krishx-green-200/60 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`px-2.5 py-1 rounded-full border text-[8.5px] font-black uppercase tracking-wider ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-krishx-dark-700/50 uppercase">
                              {item.date}
                            </span>
                          </div>

                          <h4 className="text-[14px] font-bold text-krishx-dark-900 tracking-tight">
                            {item.title}
                          </h4>

                          <p className="text-[11px] text-krishx-dark-700/70 font-semibold uppercase tracking-wider mt-1">
                            {item.subtitle}
                          </p>
                        </div>

                        {/* Inline Actions (Section 7 Edit/Delete) */}
                        {isMyOwnProfile && (
                          <div className="flex gap-1.5 self-start sm:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleStartEditTimeline(item)}
                              className="p-1.5 hover:bg-krishx-earth-100 text-krishx-dark-700 rounded-lg"
                              title="Edit record inline"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteTimeline(item.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg"
                              title="Delete record inline"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-[13px] text-krishx-dark-700/90 mt-3 font-medium leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                  </div>
                );
              })}

              {timelineItems.length === 0 && (
                <p className="text-center py-6 text-[11px] font-bold text-krishx-dark-700/40 uppercase tracking-[0.2em]">
                  Timeline empty. Add professional records inline!
                </p>
              )}
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 5: ACTIVITY TABS (POSTS, SAVED, MEDIA)      */}
          {/* ==================================================== */}
          <div className="space-y-6">
            
            {/* Tabs Header Navigation */}
            <div className="flex p-1.5 bg-krishx-earth-50/50 backdrop-blur-md rounded-2xl border border-krishx-earth-200/40 shadow-xs">
              <button
                onClick={() => setActivityTab('posts')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                  activeTab === 'posts'
                    ? 'bg-krishx-dark-900 text-white shadow-md shadow-krishx-dark-900/10'
                    : 'text-krishx-dark-700/60 hover:text-krishx-dark-900 hover:bg-white/80'
                }`}
              >
                <FileText className="w-4 h-4" />
                Farmer Posts ({visitedPosts.length})
              </button>

              <button
                onClick={() => setActivityTab('saved')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                  activeTab === 'saved'
                    ? 'bg-krishx-dark-900 text-white shadow-md shadow-krishx-dark-900/10'
                    : 'text-krishx-dark-700/60 hover:text-krishx-dark-900 hover:bg-white/80'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Saved Guides ({(userProfile?.savedPosts || []).length})
              </button>
            </div>

            {/* Display according to active tab */}
            <div className="space-y-6">
              
              {/* TAB 1: POSTS */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {visitedPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white/70 backdrop-blur-md border border-krishx-earth-200/40 p-10 rounded-[2rem] shadow-[0_12px_40px_-15px_rgba(0,0,0,0.04)]">
                      <p className="text-[11px] font-bold text-krishx-dark-700/40 uppercase tracking-[0.2em]">No activities recorded.</p>
                    </div>
                  ) : (
                    visitedPosts.map((post) => (
                      <PostCard 
                        key={post.id}
                        post={post}
                        userProfile={userProfile}
                        connections={connections}
                        savedPosts={userProfile?.savedPosts || []}
                        onToggleSave={toggleSavePost}
                        onProfileClick={() => {}}
                        onGrowTogether={handleGrowTogether}
                        onEdit={() => {}}
                        onDelete={handleDeletePost}
                        onPreviewImage={() => {}}
                        triggerToast={triggerToast}
                      />
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: SAVED GUIDES */}
              {activeTab === 'saved' && (
                <div className="space-y-6">
                  {savedPostsData.length === 0 ? (
                    <div className="text-center py-16 bg-white/70 backdrop-blur-md border border-krishx-earth-200/40 p-10 rounded-[2rem] shadow-[0_12px_40px_-15px_rgba(0,0,0,0.04)]">
                      <p className="text-[11px] font-bold text-krishx-dark-700/40 uppercase tracking-[0.2em]">No saved posts.</p>
                    </div>
                  ) : (
                    savedPostsData.map((post) => (
                      <PostCard 
                        key={post.id}
                        post={post}
                        userProfile={userProfile}
                        connections={connections}
                        savedPosts={userProfile?.savedPosts || []}
                        onToggleSave={toggleSavePost}
                        onProfileClick={() => {}}
                        onGrowTogether={handleGrowTogether}
                        onEdit={() => {}}
                        onDelete={handleDeletePost}
                        onPreviewImage={() => {}}
                        triggerToast={triggerToast}
                      />
                    ))
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
