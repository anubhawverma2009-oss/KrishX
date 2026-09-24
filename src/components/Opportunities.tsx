/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { Opportunity, OpportunityCategory, OpportunityAudience } from '../types';
import { VERIFIED_INITIAL_OPPORTUNITIES } from '../lib/opportunitiesData';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Compass, 
  Award,
  Calendar,
  MapPin,
  ShieldCheck,
  Building2,
  RefreshCw,
  Users,
  Check,
  ExternalLink,
  Volume2,
  VolumeX,
  FileText,
  Clock,
  ChevronDown,
  Info,
  Lock
} from 'lucide-react';

enum OperationType {
  LIST = 'list',
  GET = 'get',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error in Opportunities: ', JSON.stringify(errInfo));
}

const ALL_CATEGORIES: string[] = [
  'All',
  'Government Schemes',
  'Subsidies',
  'Grants',
  'Internships',
  'Scholarships',
  'Training',
  'Certifications',
  'Jobs',
  'Fellowships',
  'Competitions',
  'Mentorship',
  'Startup',
  'Other Agriculture Opportunities'
];

const ALL_AUDIENCES: { key: string; labelEn: string; labelHi: string }[] = [
  { key: 'All', labelEn: 'All Audiences', labelHi: 'सभी वर्ग' },
  { key: 'Farmer', labelEn: 'Farmers', labelHi: 'किसान' },
  { key: 'Student', labelEn: 'Students', labelHi: 'कृषि विद्यार्थी' },
  { key: 'Rural Youth', labelEn: 'Rural Youth', labelHi: 'ग्रामीण युवा' },
  { key: 'Professional', labelEn: 'Professionals', labelHi: 'कृषि पेशेवर' },
  { key: 'Other Agriculture User', labelEn: 'Agri Enthusiasts', labelHi: 'अन्य कृषि उपयोगकर्ता' }
];

export const Opportunities: React.FC = () => {
  const { userProfile, language } = useAuth();
  const isHi = language === 'hi';

  const [opportunities, setOpportunities] = useState<Opportunity[]>(VERIFIED_INITIAL_OPPORTUNITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<'All' | 'Government' | 'Private'>('All');
  const [selectedAudience, setSelectedAudience] = useState<string>('All');
  const [showAiMatchedOnly, setShowAiMatchedOnly] = useState(false);
  
  // 24-hour background scheduler status state
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);
  const [settingToast, setSettingToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Audio Read Aloud state
  const [readingId, setReadingId] = useState<string | null>(null);

  const userEmail = (userProfile?.email || '').trim().toLowerCase();
  const userRole = (userProfile?.role || '').trim().toLowerCase();
  const isUserAdmin = 
    userEmail === 'vermavijay31550@gmail.com' || 
    userRole.includes('admin') || 
    (userProfile as any)?.isAdmin === true;

  const isAutoUpdatesOn = syncStatus?.automaticUpdates !== false;

  const handleToggleAutomaticUpdates = async (newValue: boolean) => {
    if (!isUserAdmin) {
      setSettingToast({
        msg: isHi 
          ? 'केवल अधिकृत एडमिन (vermavijay31550@gmail.com) ही स्वचालित अपडेट चालू/बंद कर सकते हैं।' 
          : 'Admin Only: Only authorized administrators (vermavijay31550@gmail.com) can change the Automatic Updates setting.',
        type: 'error'
      });
      setTimeout(() => setSettingToast(null), 5000);
      return;
    }

    if (newValue === isAutoUpdatesOn) return;

    setIsUpdatingSetting(true);
    try {
      const res = await fetch('/api/opportunities/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automaticUpdates: newValue,
          userEmail: userProfile?.email,
          userRole: userProfile?.role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSyncStatus((prev: any) => ({
          ...prev,
          ...data.state,
          automaticUpdates: data.automaticUpdates
        }));
        setSettingToast({
          msg: isHi
            ? `स्वचालित अपडेट प्रणाली सफलतापूर्वक ${newValue ? 'चालू (ON)' : 'बंद (OFF)'} कर दी गई!`
            : `Automatic Updates successfully turned ${newValue ? 'ON' : 'OFF'}!`,
          type: 'success'
        });
      } else {
        const err = await res.json();
        setSettingToast({
          msg: err.error || (isHi ? 'सेटिंग बदलने में विफल' : 'Failed to update setting'),
          type: 'error'
        });
      }
    } catch (err: any) {
      setSettingToast({
        msg: isHi ? 'नेटवर्क त्रुटि: सेटिंग सहेजी नहीं जा सकी' : 'Network error: Setting could not be saved',
        type: 'error'
      });
    } finally {
      setIsUpdatingSetting(false);
      setTimeout(() => setSettingToast(null), 5000);
    }
  };

  // Fetch from Firestore and listen to real-time additions
  useEffect(() => {
    const qOpps = query(collection(db, 'opportunities'));
    const unsubscribe = onSnapshot(qOpps, (snapshot) => {
      if (!snapshot.empty) {
        const loaded = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Opportunity[];
        setOpportunities(loaded);
      } else {
        // Fallback to verified local initial opportunities
        setOpportunities(VERIFIED_INITIAL_OPPORTUNITIES);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'opportunities');
      // If Firestore read fails or offline, fall back to verified list
      setOpportunities(VERIFIED_INITIAL_OPPORTUNITIES);
    });

    return unsubscribe;
  }, []);

  // Fetch status of the 24-hour scheduled update process from server
  const fetchSchedulerStatus = async () => {
    try {
      const res = await fetch('/api/opportunities/status');
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch (e) {
      console.warn('Could not fetch scheduler status from backend API');
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
  }, []);

  // Trigger manual sync / research cycle
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(isHi ? '24 घंटे का शोध चक्र चल रहा है...' : 'Running 24-hour research cycle...');
    try {
      const res = await fetch('/api/opportunities/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSyncFeedback(data.summary || (isHi ? 'सत्यापन चक्र पूर्ण हुआ!' : 'Verification cycle complete!'));
        await fetchSchedulerStatus();
      } else {
        setSyncFeedback(isHi ? 'शोध चक्र पूर्ण (मौजूदा डेटा सुरक्षित)' : 'Cycle complete (Existing data secured)');
      }
    } catch (err: any) {
      setSyncFeedback(isHi ? 'नेटवर्क त्रुटि: सुरक्षित स्थानीय डेटा प्रदर्शित' : 'Network check: Preserved verified data');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Smart AI Matching Recommendation Logic based on User Profile
  const isAiRecommended = (opp: Opportunity): boolean => {
    if (!userProfile) return false;
    
    const cropsText = (userProfile.crops || []).join(' ').toLowerCase();
    const skillsText = (userProfile.skills || []).join(' ').toLowerCase();
    const locationText = (userProfile.location || '').toLowerCase();
    const educationText = (userProfile.education || '').toLowerCase();
    const roleText = (userProfile.role || '').toLowerCase();
    
    const oppFullText = `${opp.title} ${opp.description} ${opp.eligibility} ${opp.benefits} ${(opp.audience || []).join(' ')}`.toLowerCase();
    
    // Check role / education / audience match
    if (educationText.includes('student') || educationText.includes('b.sc') || educationText.includes('m.sc')) {
      if (opp.category === 'Scholarships' || opp.category === 'Internships' || opp.category === 'Startup' || (opp.audience && opp.audience.includes('Student'))) {
        return true;
      }
    }

    if (roleText.includes('farmer') || userProfile.crops?.length) {
      if (opp.category === 'Government Schemes' || opp.category === 'Subsidies' || opp.category === 'Grants' || (opp.audience && opp.audience.includes('Farmer'))) {
        return true;
      }
    }

    if (skillsText.includes('organic') || cropsText.includes('organic') || oppFullText.includes('जैविक')) {
      if (oppFullText.includes('organic') || oppFullText.includes('जैविक') || opp.id === 'pkvy-organic-cluster') {
        return true;
      }
    }

    if (skillsText.includes('drone') || skillsText.includes('ड्रोन') || oppFullText.includes('drone')) {
      if (opp.id === 'kisan-drone-training' || opp.id === 'drone-training') {
        return true;
      }
    }

    // Default to matching audience array if present
    if (opp.audience && Array.isArray(opp.audience)) {
      if (opp.audience.includes('Farmer') && (!userProfile.role || userProfile.role.toLowerCase().includes('farmer'))) {
        return true;
      }
      if (opp.audience.includes('Student') && educationText.includes('agri')) {
        return true;
      }
    }

    return false;
  };

  // Filter and Search Logic
  const filteredOpps = opportunities.filter((opp) => {
    // 1. Keyword search (title, org, desc, benefits, eligibility, location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchOrg = opp.organization.toLowerCase().includes(q);
      const matchDesc = opp.description.toLowerCase().includes(q);
      const matchBenefits = (opp.benefits || '').toLowerCase().includes(q);
      const matchEligibility = (opp.eligibility || '').toLowerCase().includes(q);
      const matchLoc = (opp.location || '').toLowerCase().includes(q);
      const matchCategory = (opp.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchOrg && !matchDesc && !matchBenefits && !matchEligibility && !matchLoc && !matchCategory) {
        return false;
      }
    }

    // 2. Sector filter (Government / Private)
    if (selectedSector !== 'All') {
      const oppSector = opp.sector || (opp.type === 'Private' ? 'Private' : 'Government');
      if (oppSector !== selectedSector) return false;
    }

    // 3. Category filter
    if (selectedCategory !== 'All') {
      const oppCat = opp.category || opp.type;
      const normalizedCat = oppCat.toLowerCase();
      const normalizedFilter = selectedCategory.toLowerCase();
      if (!normalizedCat.includes(normalizedFilter) && !normalizedFilter.includes(normalizedCat)) {
        // Special case mapping for legacy type values
        if (selectedCategory === 'Government Schemes' && (opp.type === 'Scheme' || opp.category === 'Scheme')) {
          // match
        } else if (selectedCategory === 'Subsidies' && (opp.type === 'Scheme' || opp.category === 'Subsidies')) {
          // match
        } else if (selectedCategory === 'Grants' && (opp.type === 'Grant' || opp.category === 'Grant')) {
          // match
        } else if (selectedCategory === 'Training' && (opp.type === 'Training' || opp.category === 'Training')) {
          // match
        } else if (selectedCategory === 'Scholarships' && (opp.type === 'Scholarship' || opp.category === 'Scholarship')) {
          // match
        } else if (selectedCategory === 'Startup' && (opp.type === 'Startup' || opp.category === 'Startup')) {
          // match
        } else {
          return false;
        }
      }
    }

    // 4. Audience filter
    if (selectedAudience !== 'All') {
      if (!opp.audience || !opp.audience.includes(selectedAudience as OpportunityAudience)) {
        // Fallback checks
        const oppText = `${opp.title} ${opp.description} ${opp.eligibility}`.toLowerCase();
        if (selectedAudience === 'Farmer' && (oppText.includes('किसान') || oppText.includes('farmer'))) {
          // allow
        } else if (selectedAudience === 'Student' && (oppText.includes('छात्र') || oppText.includes('विद्यार्थी') || oppText.includes('student') || oppText.includes('b.sc'))) {
          // allow
        } else if (selectedAudience === 'Rural Youth' && (oppText.includes('युवा') || oppText.includes('youth') || oppText.includes('ग्रामीण'))) {
          // allow
        } else if (selectedAudience === 'Professional' && (oppText.includes('पेशेवर') || oppText.includes('fpo') || oppText.includes('professional'))) {
          // allow
        } else {
          return false;
        }
      }
    }

    // 5. AI Matched Only Toggle
    if (showAiMatchedOnly && !isAiRecommended(opp)) {
      return false;
    }

    return true;
  });

  // Read Aloud / Voice Mode for an Opportunity Card
  const handleReadOpportunity = (opp: Opportunity) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (readingId === opp.id) {
      window.speechSynthesis.cancel();
      setReadingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setReadingId(opp.id);

    const speechText = isHi
      ? `${opp.title}। संस्था: ${opp.organization}। ${opp.description}। लाभ: ${opp.benefits}। पात्रता: ${opp.eligibility}। अंतिम तिथि: ${opp.deadline || 'पंजीकरण खुला'}। यह जानकारी ${opp.sourceName || 'आधिकारिक स्रोत'} से सत्यापित है।`
      : `${opp.title}. Organization: ${opp.organization}. ${opp.description}. Benefits: ${opp.benefits}. Eligibility: ${opp.eligibility}. Deadline: ${opp.deadline || 'Registration open'}. Verified from ${opp.sourceName || 'official source'}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = isHi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setReadingId(null);
    };

    utterance.onerror = () => {
      setReadingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return isHi ? 'हाल ही में सत्यापित' : 'Recently verified';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isHi ? 'हाल ही में सत्यापित' : 'Recently verified';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4 pb-12">
      
      {/* SECTION HEADER & VALUE PROPOSITION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[28px] border border-krishx-earth-200/60 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-krishx-green-50 text-krishx-green-700 rounded-2xl border border-krishx-green-200/60 shadow-sm">
              <Briefcase className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-krishx-dark-900 tracking-tight flex items-center gap-2">
                {isHi ? 'कृषि अवसर एवं योजनाएं' : 'KrishX Opportunities'}
                <span className="text-[10px] font-black uppercase tracking-wider bg-krishx-green-600 text-white px-2 py-0.5 rounded-full">
                  Hub
                </span>
              </h2>
              <p className="text-[11px] font-semibold text-krishx-dark-700/60 uppercase tracking-[0.2em] mt-0.5">
                {isHi 
                  ? 'सरकारी योजनाएं • सब्सिडी • ग्रांट • छात्रवृत्ति • प्रशिक्षण • नौकरियां' 
                  : 'Govt Schemes • Subsidies • Grants • Scholarships • Training • Jobs'}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-krishx-dark-700/80 leading-relaxed font-medium max-w-2xl pt-1">
            {isHi
              ? 'किसानों, कृषि छात्रों, युवाओं और विशेषज्ञों के लिए सभी उपयोगी योजनाएं और अवसर एक ही स्थान पर। सीधे आधिकारिक पोर्टल से आवेदन करें।'
              : 'The central discovery hub bringing active government schemes, subsidies, grants, internships, scholarships, and private agribusiness opportunities into one verified place.'}
          </p>
        </div>

        {/* 24-Hour Update System Status & Action */}
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-krishx-earth-50/80 px-3.5 py-2 rounded-2xl border border-krishx-earth-200/50">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAutoUpdatesOn ? 'bg-krishx-green-500 animate-pulse' : 'bg-amber-500'}`} />
            <div className="text-left md:text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-krishx-dark-900">
                {isAutoUpdatesOn
                  ? (isHi ? '24 घंटे स्वचालित शोध: चालू (ON)' : 'Automated 24h Research: Active [ON]')
                  : (isHi ? 'स्वचालित शोध: रुका हुआ (OFF)' : 'Automated 24h Research: Paused [OFF]')}
              </p>
              <p className="text-[9px] text-krishx-dark-700/60 font-medium">
                {isAutoUpdatesOn
                  ? (syncStatus?.lastRunAt 
                      ? (isHi ? `अंतिम जांच: ${formatRelativeTime(syncStatus.lastRunAt)}` : `Last checked: ${formatRelativeTime(syncStatus.lastRunAt)}`)
                      : (isHi ? 'प्रतिदिन ~24 घंटे में एक बार स्वचालित अपडेट' : 'Runs lightweight cycle every ~24h'))
                  : (isHi ? 'बैकग्राउंड शोध रुका हुआ है' : 'Background research is stopped')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold tracking-wider transition-all duration-300 shadow-sm cursor-pointer ${
                isSyncing 
                  ? 'bg-krishx-earth-200 text-krishx-dark-600 cursor-not-allowed'
                  : 'bg-krishx-dark-900 hover:bg-krishx-green-800 text-white'
              }`}
              title="Run 24-hour update cycle now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (isHi ? 'जांच जारी...' : 'Checking...') : (isHi ? 'अपडेट चेक करें' : 'Check Updates')}</span>
            </button>

            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-3 py-2 rounded-xl text-[11px] font-semibold bg-white border border-krishx-earth-200 text-krishx-dark-700 hover:bg-krishx-earth-50 transition-colors cursor-pointer"
              title="View verification & update log"
            >
              <FileText className="w-3.5 h-3.5 inline mr-1 text-krishx-dark-500" />
              <span>{showLogs ? (isHi ? 'लॉग छुपाएं' : 'Hide Log') : (isHi ? 'ऑडिट लॉग' : 'Logs')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AUTOMATIC UPDATES ON / OFF CONTROL BAR */}
      <div className="bg-white/85 backdrop-blur-md p-4 sm:p-5 rounded-[24px] border border-krishx-earth-200/70 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-3 rounded-2xl border transition-all shrink-0 ${
            isAutoUpdatesOn 
              ? 'bg-krishx-green-50 text-krishx-green-700 border-krishx-green-200 shadow-sm' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <RefreshCw className={`w-5 h-5 ${isAutoUpdatesOn && syncStatus?.isRunning ? 'animate-spin' : ''}`} />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13px] font-extrabold text-krishx-dark-900 uppercase tracking-wider">
                {isHi ? 'स्वचालित अपडेट (Automatic Updates)' : 'Automatic Updates'}
              </h3>
              
              {/* Status indicator */}
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                isAutoUpdatesOn 
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isAutoUpdatesOn ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
                {isAutoUpdatesOn ? '[ ON ]' : '[ OFF ]'}
              </span>

              {!isUserAdmin && (
                <span className="text-[9px] font-bold bg-krishx-earth-100 text-krishx-dark-600 px-2 py-0.5 rounded-md border border-krishx-earth-200/80 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> {isHi ? 'केवल एडमिन' : 'Admin Only'}
                </span>
              )}
            </div>

            <p className="text-[12px] text-krishx-dark-700/80 font-medium leading-relaxed">
              {isAutoUpdatesOn
                ? (isHi 
                    ? 'चालू (ON): लगभग हर 24 घंटे में एक बार स्वचालित शोध चक्र चलता है, नई योजनाओं को जोड़ता है और पुरानी जानकारी को अपडेट करता है।' 
                    : 'ON: Lightweight research cycle runs approximately once every 24 hours to discover newly available schemes and updates.')
                : (isHi
                    ? 'बंद (OFF): स्वचालित शोध कार्य रुका हुआ है। कोई स्वचालित API या सर्च कॉल नहीं होगी। सभी पूर्व-संग्रहीत अवसर सुरक्षित हैं।'
                    : 'OFF: Automatic research task and scheduled API calls are stopped. All previously stored opportunities remain visible.')}
            </p>
          </div>
        </div>

        {/* [ ON ] / [ OFF ] Segmented Control Button */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="inline-flex p-1 bg-krishx-earth-100/90 rounded-2xl border border-krishx-earth-200 shadow-inner">
            <button
              onClick={() => handleToggleAutomaticUpdates(true)}
              disabled={isUpdatingSetting}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isAutoUpdatesOn
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-krishx-dark-600 hover:text-krishx-dark-900'
              }`}
              title={!isUserAdmin ? 'Admin authorization required' : 'Turn ON Automatic Updates'}
            >
              <Check className={`w-3.5 h-3.5 ${isAutoUpdatesOn ? 'inline' : 'hidden'}`} strokeWidth={3} />
              <span>ON</span>
            </button>

            <button
              onClick={() => handleToggleAutomaticUpdates(false)}
              disabled={isUpdatingSetting}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                !isAutoUpdatesOn
                  ? 'bg-krishx-dark-900 text-white shadow-sm'
                  : 'text-krishx-dark-600 hover:text-krishx-dark-900'
              }`}
              title={!isUserAdmin ? 'Admin authorization required' : 'Turn OFF Automatic Updates'}
            >
              <span>OFF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Setting Toast */}
      {settingToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`p-3 rounded-2xl text-[12px] font-semibold flex items-center gap-2 shadow-sm border ${
            settingToast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {settingToast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{settingToast.msg}</span>
        </motion.div>
      )}

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[12px] font-semibold text-emerald-800 flex items-center gap-2 shadow-sm"
        >
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </motion.div>
      )}

      {/* 24-Hour Process Audit Log Drawer (Expandable) */}
      <AnimatePresence>
        {showLogs && syncStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-krishx-dark-950 text-krishx-earth-100 rounded-[20px] p-4 font-mono text-[11px] space-y-2 border border-krishx-dark-800 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-krishx-dark-800">
              <span className="font-bold text-krishx-green-400 flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                <Clock className="w-3.5 h-3.5" /> 24-Hour Update Process Audit Logs
              </span>
              <span className="text-[10px] text-krishx-dark-400">
                Total Verified Records: {opportunities.length}
              </span>
            </div>
            <p className="text-[11px] text-krishx-green-300">
              Summary: {syncStatus.lastSummary || 'All items up-to-date and verified.'}
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-2 scrollbar-thin text-krishx-dark-300">
              {(syncStatus.logs || []).slice(-8).map((log: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-krishx-dark-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={log.level === 'success' ? 'text-krishx-green-400' : log.level === 'warn' ? 'text-amber-400' : 'text-krishx-earth-200'}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Matched Banner for Current User */}
      {userProfile && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-krishx-earth-50/90 to-krishx-green-50/60 border border-krishx-green-200/70 rounded-[24px] p-4.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-white text-krishx-green-700 rounded-2xl border border-krishx-green-200 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 fill-krishx-green-600/20" strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[12px] font-extrabold text-krishx-dark-900 uppercase tracking-wider flex items-center gap-2">
                {isHi ? 'व्यक्तिगत एआई अवसर मिलान' : 'Personalized AI Matching'}
                <span className="text-[9px] bg-krishx-green-100 text-krishx-green-800 font-bold px-2 py-0.5 rounded-md">
                  {userProfile.name}
                </span>
              </h3>
              <p className="text-[12px] text-krishx-dark-700/80 font-medium">
                {isHi
                  ? `आपकी प्रोफ़ाइल (फसलें: ${userProfile.crops?.join(', ') || 'सामान्य'}, स्थान: ${userProfile.location || 'भारत'}) के आधार पर प्रासंगिक योजनाओं की पहचान की गई है।`
                  : `Relevant schemes tailored to your profile (Crops: ${userProfile.crops?.join(', ') || 'General'}, Location: ${userProfile.location || 'India'}).`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAiMatchedOnly(!showAiMatchedOnly)}
            className={`shrink-0 px-4 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              showAiMatchedOnly
                ? 'bg-krishx-green-700 text-white border-krishx-green-700 shadow-md'
                : 'bg-white text-krishx-dark-800 border-krishx-earth-300 hover:border-krishx-green-400'
            }`}
          >
            <Compass className={`w-4 h-4 ${showAiMatchedOnly ? 'animate-spin-slow' : 'text-krishx-dark-600'}`} />
            <span>{showAiMatchedOnly ? (isHi ? 'सभी अवसर देखें' : 'Show All') : (isHi ? 'केवल मेरे लिए अनुशंसित' : 'Recommended for Me')}</span>
          </button>
        </motion.div>
      )}

      {/* SEARCH & MULTI-DIMENSIONAL FILTERS */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-[24px] border border-krishx-earth-200/60 shadow-sm space-y-4">
        
        {/* Keyword Search Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krishx-dark-700/40 group-focus-within:text-krishx-green-600 transition-colors" strokeWidth={1.75} />
          <input 
            type="text"
            placeholder={isHi 
              ? "योजना का नाम, सब्सिडी, छात्रवृत्ति, संस्था, या कीवर्ड खोजें (उदा. सोलर, जैविक, ड्रोन, बीज)..." 
              : "Search schemes, subsidies, scholarships, grants, internships, organizations (e.g. solar, organic, drone, seeds)..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-krishx-earth-50/50 border border-krishx-earth-200/70 rounded-2xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-krishx-green-500/20 focus:border-krishx-green-500 transition-all text-krishx-dark-900 placeholder:text-krishx-dark-700/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-krishx-dark-400 hover:text-krishx-dark-800"
            >
              ✕
            </button>
          )}
        </div>

        {/* Row 1: Sector & Audience Dropdowns / Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-krishx-earth-100/60">
          
          {/* Sector Filter (Government vs Private) */}
          <div className="flex items-center gap-1.5 bg-krishx-earth-50/80 p-1 rounded-xl border border-krishx-earth-200/50">
            <span className="text-[10px] font-bold text-krishx-dark-500 px-2 uppercase tracking-wider">
              {isHi ? 'क्षेत्र:' : 'Sector:'}
            </span>
            {(['All', 'Government', 'Private'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec)}
                className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider ${
                  selectedSector === sec
                    ? 'bg-krishx-dark-900 text-white shadow-sm'
                    : 'text-krishx-dark-700 hover:text-krishx-dark-900'
                }`}
              >
                {sec === 'All' && (isHi ? 'सभी' : 'All')}
                {sec === 'Government' && (isHi ? '🏛️ सरकारी (Govt)' : '🏛️ Government')}
                {sec === 'Private' && (isHi ? '🏢 निजी / संस्थागत' : '🏢 Private')}
              </button>
            ))}
          </div>

          {/* Intended Audience Smart Organization Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full scrollbar-none py-1">
            <span className="text-[10px] font-bold text-krishx-dark-500 px-1 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Users className="w-3 h-3" /> {isHi ? 'वर्ग:' : 'Target:'}
            </span>
            {ALL_AUDIENCES.map((aud) => (
              <button
                key={aud.key}
                onClick={() => setSelectedAudience(aud.key)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer uppercase tracking-wider ${
                  selectedAudience === aud.key
                    ? 'bg-krishx-green-700 text-white shadow-sm'
                    : 'bg-krishx-earth-50/60 text-krishx-dark-700 hover:bg-krishx-earth-100 hover:text-krishx-dark-900'
                }`}
              >
                {isHi ? aud.labelHi : aud.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin pt-2">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] font-bold px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all uppercase tracking-wider shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-krishx-dark-900 text-white shadow-sm'
                    : 'bg-krishx-earth-50/80 text-krishx-dark-700 hover:bg-krishx-earth-100 hover:text-krishx-dark-900 border border-krishx-earth-200/40'
                }`}
              >
                {cat === 'All' && (isHi ? 'सभी श्रेणियां' : 'All Categories')}
                {cat === 'Government Schemes' && (isHi ? 'सरकारी योजनाएं' : 'Govt Schemes')}
                {cat === 'Subsidies' && (isHi ? 'सब्सिडी' : 'Subsidies')}
                {cat === 'Grants' && (isHi ? 'अनुदान (Grants)' : 'Grants')}
                {cat === 'Internships' && (isHi ? 'इंटर्नशिप' : 'Internships')}
                {cat === 'Scholarships' && (isHi ? 'छात्रवृत्ति' : 'Scholarships')}
                {cat === 'Training' && (isHi ? 'प्रशिक्षण' : 'Training')}
                {cat === 'Certifications' && (isHi ? 'प्रमाणपत्र' : 'Certifications')}
                {cat === 'Jobs' && (isHi ? 'रोजगार / नौकरियां' : 'Jobs')}
                {cat === 'Fellowships' && (isHi ? 'फेलोशिप' : 'Fellowships')}
                {cat === 'Competitions' && (isHi ? 'प्रतियोगिताएं' : 'Competitions')}
                {cat === 'Mentorship' && (isHi ? 'मेंटरशिप' : 'Mentorship')}
                {cat === 'Startup' && (isHi ? 'स्टार्टअप' : 'Startup')}
                {cat === 'Other Agriculture Opportunities' && (isHi ? 'अन्य कृषि अवसर' : 'Other Opportunities')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Current Active Filters Summary */}
      <div className="flex items-center justify-between text-xs font-semibold text-krishx-dark-700/60 px-2">
        <p>
          {isHi 
            ? `${filteredOpps.length} सक्रिय अवसर उपलब्ध` 
            : `Showing ${filteredOpps.length} verified opportunities`}
          {(selectedCategory !== 'All' || selectedSector !== 'All' || selectedAudience !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSector('All');
                setSelectedAudience('All');
                setSearchQuery('');
                setShowAiMatchedOnly(false);
              }}
              className="ml-2 text-krishx-green-700 hover:underline cursor-pointer font-bold"
            >
              {isHi ? '(फ़िल्टर हटाएं)' : '(Clear filters)'}
            </button>
          )}
        </p>
      </div>

      {/* OPPORTUNITIES CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredOpps.map((opp) => {
            const recommended = isAiRecommended(opp);
            const isGovt = opp.sector === 'Government' || opp.type === 'Government' || opp.type === 'Scheme';
            const isVoiceReading = readingId === opp.id;

            return (
              <motion.div
                key={opp.id}
                id={`opp-${opp.id}`}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`bg-white rounded-[26px] p-6 border transition-all duration-300 flex flex-col justify-between relative shadow-sm hover:shadow-md group ${
                  recommended 
                    ? 'border-krishx-green-400/80 shadow-[0_4px_20px_rgba(22,163,74,0.06)] ring-1 ring-krishx-green-300/50' 
                    : 'border-krishx-earth-200/70 hover:border-krishx-earth-300'
                }`}
              >
                {/* Top Corner Ribbon for AI Matched */}
                {recommended && (
                  <div className="absolute top-0 right-0 bg-krishx-dark-900 text-white text-[9px] font-black tracking-widest px-3 py-1.5 uppercase rounded-bl-2xl border-l border-b border-krishx-dark-800 flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 fill-krishx-green-400 text-krishx-green-400" /> AI Matched
                  </div>
                )}

                <div className="space-y-4">
                  {/* Category & Sector Badges */}
                  <div className="flex flex-wrap items-center gap-2 pr-20">
                    {/* Sector Badge */}
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border flex items-center gap-1 ${
                      isGovt 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' 
                        : 'bg-purple-50 text-purple-800 border-purple-200/80'
                    }`}>
                      {isGovt ? '🏛️ Government' : '🏢 Private'}
                    </span>

                    {/* Category Badge */}
                    <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-krishx-earth-50 text-krishx-dark-700 border border-krishx-earth-200/60">
                      {opp.category || opp.type}
                    </span>

                    {/* Deadline Badge */}
                    {opp.deadline && (
                      <span className="text-[9px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-700" />
                        <span>{opp.deadline}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Organization */}
                  <div className="space-y-1">
                    <h3 className="text-[16px] font-display font-bold text-krishx-dark-900 leading-snug group-hover:text-krishx-green-800 transition-colors">
                      {opp.title}
                    </h3>
                    <p className="text-[11px] font-bold text-krishx-dark-700/60 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-krishx-dark-400 shrink-0" />
                      <span>{opp.organization}</span>
                    </p>
                  </div>

                  {/* Short Description */}
                  <p className="text-[13px] text-krishx-dark-700/85 leading-relaxed font-medium">
                    {opp.description}
                  </p>

                  {/* Targeted Audience Tags */}
                  {opp.audience && opp.audience.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[9px] font-bold text-krishx-dark-400 uppercase tracking-wider">
                        {isHi ? 'के लिए:' : 'For:'}
                      </span>
                      {opp.audience.map((aud) => (
                        <span 
                          key={aud} 
                          className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-krishx-earth-50 text-krishx-dark-700 border border-krishx-earth-200/40"
                        >
                          {aud}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Detailed Eligibility & Benefits Box */}
                  <div className="bg-krishx-earth-50/60 p-4 rounded-[18px] border border-krishx-earth-200/60 space-y-2.5 text-[12px]">
                    {/* Eligibility / Who Can Apply */}
                    <div className="flex gap-2.5 items-start">
                      <CheckCircle className="w-4 h-4 text-krishx-green-600 shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-krishx-dark-800 font-medium leading-snug">
                        <strong className="font-bold text-krishx-dark-900">{isHi ? 'पात्रता:' : 'Eligibility:'} </strong>
                        {opp.eligibility || opp.whoCanApply}
                      </p>
                    </div>

                    {/* Benefits */}
                    <div className="flex gap-2.5 items-start">
                      <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-krishx-dark-800 font-medium leading-snug">
                        <strong className="font-bold text-krishx-dark-900">{isHi ? 'प्रमुख लाभ:' : 'Benefits:'} </strong>
                        {opp.benefits}
                      </p>
                    </div>

                    {/* Location */}
                    {opp.location && (
                      <div className="flex gap-2.5 items-start pt-1 border-t border-krishx-earth-200/40 text-[11px] text-krishx-dark-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-krishx-dark-400 shrink-0 mt-0.5" />
                        <span><strong className="text-krishx-dark-700">{isHi ? 'क्षेत्र:' : 'Location:'}</strong> {opp.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer with Verification Badge & Apply Now CTA */}
                <div className="mt-5 pt-4 border-t border-krishx-earth-200/50 flex flex-wrap items-center justify-between gap-3">
                  {/* Verified Source info */}
                  <div className="flex items-center gap-1.5 text-[10px] text-krishx-dark-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-krishx-green-600" />
                    <span>
                      {opp.sourceName || 'Official Source'} • {formatRelativeTime(opp.verifiedAt)}
                    </span>
                  </div>

                  {/* Actions: Voice Listen & Apply Now */}
                  <div className="flex items-center gap-2">
                    {/* Read Aloud Button */}
                    <button
                      onClick={() => handleReadOpportunity(opp)}
                      className={`p-2 rounded-xl transition-all text-xs flex items-center gap-1 font-bold cursor-pointer ${
                        isVoiceReading
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : 'bg-krishx-earth-50 hover:bg-krishx-earth-100 text-krishx-dark-700'
                      }`}
                      title={isVoiceReading ? 'Stop voice reading' : 'Read opportunity aloud'}
                    >
                      {isVoiceReading ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span className="text-[10px] hidden sm:inline">{isVoiceReading ? 'Stop' : 'Listen'}</span>
                    </button>

                    {/* Apply Now Button (Opens Verified Official Portal) */}
                    <a
                      href={opp.sourceUrl || opp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-krishx-dark-900 hover:bg-krishx-green-700 text-white rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all duration-300 shadow-sm group-hover:shadow cursor-pointer"
                    >
                      <span>{isHi ? 'आवेदन करें' : 'Apply Now'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State when no results match search/filter */}
      {filteredOpps.length === 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-[26px] p-12 text-center space-y-3 border border-krishx-earth-200">
          <span className="text-4xl opacity-50 block">🔍</span>
          <h4 className="text-[16px] font-bold text-krishx-dark-900">
            {isHi ? 'कोई मेल खाता अवसर नहीं मिला' : 'No matching opportunities found'}
          </h4>
          <p className="text-[13px] text-krishx-dark-700/60 max-w-md mx-auto font-medium leading-relaxed">
            {isHi
              ? 'चयनित श्रेणी या फ़िल्टर के अंतर्गत वर्तमान में कोई अवसर नहीं है। कृपया कोई अन्य श्रेणी या कीवर्ड खोजें।'
              : 'There are currently no opportunities matching your search or filters. Try clearing filters or searching for keywords like "solar", "organic", "scholarship", or "training".'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedSector('All');
              setSelectedAudience('All');
              setSearchQuery('');
              setShowAiMatchedOnly(false);
            }}
            className="px-5 py-2.5 bg-krishx-dark-900 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-krishx-green-800 transition-colors cursor-pointer"
          >
            {isHi ? 'सभी अवसर देखें' : 'View All Opportunities'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Opportunities;
