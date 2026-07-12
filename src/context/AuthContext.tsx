/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  isOffline, 
  seedOfflineData, 
  handleFirestoreError, 
  OperationType,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc
} from '../lib/firebase';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile, AppNotification } from '../types';

// Safely disable detailed AuthDebug logs in production to avoid exposing configuration or spamming console
if (typeof window !== 'undefined' && (import.meta as any).env?.PROD) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('[AuthDebug]')) return;
    originalLog(...args);
  };
  console.warn = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('[AuthDebug]')) return;
    originalWarn(...args);
  };
  console.error = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('[AuthDebug]')) return;
    originalError(...args);
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isInitialLoading: boolean;
  isActionLoading: boolean;
  language: 'hi' | 'en';
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: (demoType: 'farmer' | 'expert' | 'student') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
  switchLanguage: (lang: 'hi' | 'en') => Promise<void>;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate unique KrishX ID
// Format: KX - STATE - 6 digits
export function generateKrishXId(location: string = "IN"): string {
  const states: { [key: string]: string } = {
    "uttar pradesh": "UP",
    "punjab": "PB",
    "haryana": "HR",
    "maharashtra": "MH",
    "rajasthan": "RJ",
    "bihar": "BR",
    "madhya pradesh": "MP",
    "gujarat": "GJ",
    "karnataka": "KA",
    "andhra pradesh": "AP"
  };
  
  const locLower = location.toLowerCase();
  let stateCode = "IN";
  for (const [state, code] of Object.entries(states)) {
    if (locLower.includes(state)) {
      stateCode = code;
      break;
    }
  }
  
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `KX-${stateCode}-${randomDigits}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Sync user profile from Firestore or create one
  const syncProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      const currentSelectedLanguage = language;

      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        const updatedProfile = { ...profile, language: currentSelectedLanguage };
        await setDoc(userRef, { language: currentSelectedLanguage }, { merge: true });
        setUserProfile(updatedProfile);
        setLanguage(currentSelectedLanguage);
      } else {
        // Create new professional profile for Indian Farmer
        const defaultProfile: UserProfile = {
          uid: firebaseUser.uid,
          krishXId: generateKrishXId("Meerut, Uttar Pradesh"),
          name: firebaseUser.displayName || 'कृषक साथी',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=200',
          location: currentSelectedLanguage === 'en' ? "Meerut, Uttar Pradesh" : "मेरठ, उत्तर प्रदेश",
          crops: currentSelectedLanguage === 'en' ? ["Wheat", "Sugarcane"] : ["गेहूं (Wheat)", "गन्ना (Sugarcane)"],
          experienceYears: 5,
          education: currentSelectedLanguage === 'en' ? "Traditional Farming Experience" : "पारंपरिक कृषि अनुभव",
          skills: currentSelectedLanguage === 'en' ? ["Natural Farming", "Soil Health Management"] : ["प्राकृतिक खेती", "मृदा स्वास्थ्य प्रबंधन"],
          achievements: currentSelectedLanguage === 'en' ? ["Agricultural Service Award"] : ["कृषि सेवा सम्मान"],
          summary: currentSelectedLanguage === 'en' 
            ? "I am a progressive Indian farmer dedicated to boosting crop yields using sustainable and modern agricultural practices."
            : "मैं एक प्रगतिशील भारतीय किसान हूँ जो पर्यावरण-अनुकूल और आधुनिक कृषि विधियों से फसल उत्पादन बढ़ाता हूँ।",
          krishScore: 450, // default completeness score
          badges: ["pioneer"],
          language: currentSelectedLanguage,
          onboardingComplete: false,
          createdAt: new Date().toISOString()
        };

        await setDoc(userRef, defaultProfile);
        setUserProfile(defaultProfile);
        setLanguage(currentSelectedLanguage);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[AuthDebug] AuthProvider mounted. Initializing state...");
      console.log("[AuthDebug] Browser network status: ", navigator.onLine ? "ONLINE" : "OFFLINE");
    }
    
    const isOfflineMode = localStorage.getItem('krishx_offline_mode') === 'true';
    const savedUser = localStorage.getItem('krishx_mock_user');
    
    if (isOfflineMode && savedUser) {
      if (import.meta.env.DEV) {
        console.log("[AuthDebug] Loading existing session in Offline/Demo mode. Mock User:", savedUser);
      }
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        const profile = localStorage.getItem(`krishx_mock_profile_${u.uid}`);
        if (profile) {
          setUserProfile(JSON.parse(profile));
          if (import.meta.env.DEV) {
            console.log("[AuthDebug] Mock profile loaded successfully.");
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("[AuthDebug] Failed to parse saved mock user/profile, resetting.", err);
        }
        localStorage.removeItem('krishx_offline_mode');
        localStorage.removeItem('krishx_mock_user');
      }
      setIsInitialLoading(false);
      return;
    } else {
      if (isOfflineMode) {
        if (import.meta.env.DEV) {
          console.log("[AuthDebug] Offline mode flag was set but no mock user found. Resetting.");
        }
        localStorage.removeItem('krishx_offline_mode');
      }
    }

    // Process redirect sign-in results if arriving from a redirect flow
    if (import.meta.env.DEV) {
      console.log("[AuthDebug] Checking for redirect result from Firebase Auth...");
    }
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          if (import.meta.env.DEV) {
            console.log("[AuthDebug] getRedirectResult successful! User UID:", result.user.uid, "Email:", result.user.email);
          }
          setUser(result.user);
          await syncProfile(result.user);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.error("[AuthDebug] Error resolving getRedirectResult:", err);
        }
      });

    if (import.meta.env.DEV) {
      console.log("[AuthDebug] Subscribing to real Firebase onAuthStateChanged...");
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (import.meta.env.DEV) {
        console.log("[AuthDebug] onAuthStateChanged callback fired. User:", firebaseUser ? firebaseUser.email : "null");
      }
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          if (import.meta.env.DEV) {
            console.log("[AuthDebug] User is logged in. Syncing profile from Firestore...");
          }
          await syncProfile(firebaseUser);
          if (import.meta.env.DEV) {
            console.log("[AuthDebug] Profile sync complete.");
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error("[AuthDebug] Profile sync failed on auth change:", err);
          }
        }
      } else {
        setUserProfile(null);
      }
      setIsInitialLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setIsActionLoading(true);
    if (import.meta.env.DEV) {
      console.log("[AuthDebug] loginWithGoogle initiated.");
      console.log("[AuthDebug] Firebase config checks:");
      console.log("[AuthDebug]   - Project ID:", auth.app.options.projectId);
      console.log("[AuthDebug]   - Auth Domain:", auth.app.options.authDomain);
      console.log("[AuthDebug]   - API Key present:", !!auth.app.options.apiKey);
    }
    
    // Explicitly clear offline mode to ensure a fresh, real Firebase Google Auth attempt
    if (localStorage.getItem('krishx_offline_mode') === 'true') {
      if (import.meta.env.DEV) {
        console.log("[AuthDebug] Clearing lingering offline mode flag before starting Google Sign-In.");
      }
      localStorage.removeItem('krishx_offline_mode');
      localStorage.removeItem('krishx_mock_user');
    }

    // Detect if running inside an iframe, embedded preview, sandbox, or restricted window context
    const isIframe = typeof window !== 'undefined' && (
      window.self !== window.top ||
      window.parent !== window ||
      document.referrer.includes("run.app") ||
      !window.opener
    );
    if (import.meta.env.DEV) {
      console.log("[AuthDebug] Environment detection: isIframe =", isIframe);
    }

    try {
      if (import.meta.env.DEV) {
        console.log("[AuthDebug] Calling signOut() to clear stale sessions...");
      }
      await auth.signOut();
      
      // If we are in an iframe, popup flows are heavily restricted or blocked, so we must use signInWithRedirect
      if (isIframe) {
        if (import.meta.env.DEV) {
          console.log("[AuthDebug] Running inside restricted/iframe environment. Automatically using signInWithRedirect() instead of signInWithPopup() to ensure compatibility.");
        }
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      try {
        if (import.meta.env.DEV) {
          console.log("[AuthDebug] Attempting signInWithPopup(auth, googleProvider)...");
        }
        const result = await signInWithPopup(auth, googleProvider);
        if (import.meta.env.DEV) {
          console.log("[AuthDebug] signInWithPopup completed successfully! User UID:", result.user.uid, "Email:", result.user.email);
        }
      } catch (popupErr: any) {
        if (import.meta.env.DEV) {
          console.warn("[AuthDebug] signInWithPopup failed. Checking if we should fall back to signInWithRedirect...");
          console.warn("[AuthDebug]   - Error Code:", popupErr.code);
          console.warn("[AuthDebug]   - Error Message:", popupErr.message);
        }

        const isPopupBlockedOrClosed = [
          'auth/popup-closed-by-user',
          'auth/popup-blocked',
          'auth/operation-not-supported-in-this-environment',
          'auth/cancelled-popup-request'
        ].includes(popupErr.code) || popupErr.message?.toLowerCase().includes('popup');

        if (isPopupBlockedOrClosed) {
          if (import.meta.env.DEV) {
            console.log("[AuthDebug] Popup blocked, closed, or unsupported. Automatically falling back to signInWithRedirect()...");
          }
          await signInWithRedirect(auth, googleProvider);
        } else {
          throw popupErr;
        }
      }
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("[AuthDebug] Google Auth Error during flow:");
        console.error("[AuthDebug]   - Error Code:", err.code);
        console.error("[AuthDebug]   - Error Message:", err.message);
        console.error("[AuthDebug]   - Full Error Object:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      }
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Legendary Demo User login to bypass iframe oauth restrictions during review / hackathon demo
  const loginAsDemoUser = async (demoType: 'farmer' | 'expert' | 'student') => {
    setIsActionLoading(true);
    if (import.meta.env.DEV) {
      console.log(`[AuthDebug] loginAsDemoUser called for demo type: ${demoType}`);
    }
    try {
      // Predefined secure auth credentials for offline/demo simulation in Firebase or manual handling
      let email = "";
      let password = "KrishXPassword123";
      let name = "";
      let photoURL = "";
      let defaultProfile: Partial<UserProfile> = {};

      if (demoType === 'farmer') {
        email = "ramesh.farmer@krishx.org";
        name = "रमेश कुमार";
        photoURL = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";
        defaultProfile = {
          name: name,
          crops: ["गेहूं (Wheat)", "सरसों (Mustard)", "गन्ना (Sugarcane)"],
          location: "बठिंडा, पंजाब",
          experienceYears: 12,
          education: "कृषि विज्ञान केंद्र प्रशिक्षण",
          skills: ["जैविक खाद उत्पादन", "ड्रिप सिंचाई तकनीक", "फसल रोटेशन"],
          achievements: ["जिला सर्वोत्तम किसान पुरस्कार 2024", "उन्नत कृषक सम्मान"],
          summary: "मैं पिछले 12 वर्षों से पर्यावरण हितैषी प्राकृतिक खाद और आधुनिक जल-बचत तकनीकों से जैविक खेती कर रहा हूँ।",
          krishScore: 850,
          badges: ["pioneer", "expert"]
        };
      } else if (demoType === 'expert') {
        email = "dr.singh.expert@krishx.org";
        name = "डॉ. आरती सिंह";
        photoURL = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200";
        defaultProfile = {
          name: name,
          crops: ["मृदा स्वास्थ्य (Soil)", "कीट नियंत्रण (Pest Control)"],
          location: "नई दिल्ली",
          experienceYears: 15,
          education: "Ph.D. कृषि विज्ञान (IARI)",
          skills: ["कीट विज्ञान विशेषज्ञता", "मृदा परीक्षण", "पौध संरक्षण तकनीक"],
          achievements: ["राष्ट्रीय कृषि वैज्ञानिक सम्मान", "15+ शोध पत्र प्रकाशित"],
          summary: "वरिष्ठ कृषि वैज्ञानिक और मृदा स्वास्थ्य विशेषज्ञ। भारतीय किसानों के आर्थिक उत्थान और फसल सुधार के लिए निरंतर समर्पित।",
          krishScore: 920,
          badges: ["expert", "helper"]
        };
      } else {
        email = "shubham.student@krishx.org";
        name = "शुभम चौधरी";
        photoURL = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200";
        defaultProfile = {
          name: name,
          crops: ["उद्यानिकी (Horticulture)", "फलों की खेती"],
          location: "नासिक, महाराष्ट्र",
          experienceYears: 2,
          education: "B.Sc. Agriculture (अंतिम वर्ष)",
          skills: ["कृषि ड्रोन तकनीक", "हाइड्रोपोनिक्स सिस्टम", "डिजिटल कृषि मार्केटिंग"],
          achievements: ["स्मार्ट इंडिया हैकाथॉन कृषि विजेता"],
          summary: "उत्साही कृषि छात्र। नए वैज्ञानिक अनुसंधान को जमीनी स्तर पर लागू करने और digital tools के माध्यम से किसानों की सहायता करने में रुचि।",
          krishScore: 680,
          badges: ["pioneer", "helper"]
        };
      }

      // Try login first, if doesn't exist, create user
      try {
        let firebaseUser: User;
        if (import.meta.env.DEV) {
          console.log(`[AuthDebug] Attempting real Firebase Auth signInWithEmailAndPassword for: ${email}`);
        }
        const res = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = res.user;
        if (import.meta.env.DEV) {
          console.log(`[AuthDebug] Real Firebase Auth sign-in successful. Syncing profile...`);
        }

        // Sync custom default demo values to firestore to make it super rich
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        const mergedProfile: UserProfile = {
          uid: firebaseUser.uid,
          krishXId: userSnap.exists() ? (userSnap.data() as UserProfile).krishXId : generateKrishXId(defaultProfile.location),
          name: name,
          email: email,
          photoURL: photoURL,
          location: defaultProfile.location || "मेरठ, उत्तर प्रदेश",
          crops: defaultProfile.crops || [],
          experienceYears: defaultProfile.experienceYears || 1,
          education: defaultProfile.education || "",
          skills: defaultProfile.skills || [],
          achievements: defaultProfile.achievements || [],
          summary: defaultProfile.summary || "",
          krishScore: defaultProfile.krishScore || 100,
          badges: defaultProfile.badges || [],
          language: language,
          onboardingComplete: defaultProfile.onboardingComplete ?? true,
          createdAt: new Date().toISOString()
        };

        await setDoc(userRef, mergedProfile);
        setUserProfile(mergedProfile);
        setUser(firebaseUser);
      } catch (e: any) {
        if (import.meta.env.DEV) {
          console.warn("[AuthDebug] Real Firebase Auth sign-in failed with error code:", e.code, "message:", e.message);
        }
        
        const isNetworkOffline = !navigator.onLine || e.code === 'auth/network-request-failed' || e.message?.includes('network');
        
        if (isNetworkOffline) {
          if (import.meta.env.DEV) {
            console.warn("[AuthDebug] Firebase is actually unavailable (Network is offline). Switching to Offline Demo Mode.");
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn(`[AuthDebug] Firebase is available, but Email/Password provider returned error "${e.code}" (likely disabled in Firebase Console). Falling back to Local Mock Demo Mode for this session so you can explore the app.`);
          }
        }

        localStorage.setItem('krishx_offline_mode', 'true');
        
        const mockUid = `demo-${demoType}`;
        const mockUserObj = {
          uid: mockUid,
          email: email,
          displayName: name,
          photoURL: photoURL,
          emailVerified: true,
          isAnonymous: false,
        } as any;
        
        localStorage.setItem('krishx_mock_user', JSON.stringify(mockUserObj));
        
        const mergedProfile: UserProfile = {
          uid: mockUid,
          krishXId: generateKrishXId(defaultProfile.location),
          name: name,
          email: email,
          photoURL: photoURL,
          location: defaultProfile.location || "मेरठ, उत्तर प्रदेश",
          crops: defaultProfile.crops || [],
          experienceYears: defaultProfile.experienceYears || 1,
          education: defaultProfile.education || "",
          skills: defaultProfile.skills || [],
          achievements: defaultProfile.achievements || [],
          summary: defaultProfile.summary || "",
          krishScore: defaultProfile.krishScore || 100,
          badges: defaultProfile.badges || [],
          language: language,
          onboardingComplete: defaultProfile.onboardingComplete ?? true,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`krishx_mock_profile_${mockUid}`, JSON.stringify(mergedProfile));
        
        seedOfflineData();

        setUser(mockUserObj);
        setUserProfile(mergedProfile);
      }

    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[AuthDebug] Demo login flow error:", err);
      }
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const logout = async () => {
    setIsActionLoading(true);
    try {
      if (localStorage.getItem('krishx_offline_mode') === 'true') {
        localStorage.removeItem('krishx_offline_mode');
        localStorage.removeItem('krishx_mock_user');
        setUser(null);
        setUserProfile(null);
      } else {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Logout Error:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newProfile = { ...userProfile, ...updatedData } as UserProfile;
      
      // Calculate complete score based on field richness
      let score = 300; // Base score
      if (newProfile.crops && newProfile.crops.length > 0) score += 150;
      if (newProfile.skills && newProfile.skills.length > 0) score += 150;
      if (newProfile.education) score += 100;
      if (newProfile.experienceYears > 0) score += 100;
      if (newProfile.summary) score += 100;
      if (newProfile.achievements && newProfile.achievements.length > 0) score += 100;
      
      newProfile.krishScore = Math.min(1000, score);

      await setDoc(userRef, newProfile);
      
      if (localStorage.getItem('krishx_offline_mode') === 'true') {
        localStorage.setItem(`krishx_mock_profile_${user.uid}`, JSON.stringify(newProfile));
      }

      setUserProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      throw err;
    }
  };

  const switchLanguage = async (newLang: 'hi' | 'en') => {
    setLanguage(newLang);
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { language: newLang }, { merge: true });
        if (userProfile) {
          setUserProfile({ ...userProfile, language: newLang });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  // Notifications Real-Time Subscription & Seeding
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }

    const notifCol = collection(db, 'notifications');
    const qNotif = query(
      notifCol,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(qNotif, async (snapshot) => {
      let loadedNotifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];

      // If empty, seed initial realistic notifications
      if (loadedNotifs.length === 0) {
        const isEn = language === 'en';
        const initialNotifs: Omit<AppNotification, 'id'>[] = [
          {
            userId: user.uid,
            type: 'alert',
            title: isEn ? "Optimal Sowing Window Open" : "इष्टतम बुवाई का समय खुला है",
            body: isEn 
              ? "Optimal soil moisture and temperature levels detected for Millet and Paddy in your region." 
              : "आपके क्षेत्र में बाजरा और धान के लिए इष्टतम मिट्टी की नमी और तापमान स्तर देखा गया है।",
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
            read: false
          },
          {
            userId: user.uid,
            type: 'like',
            senderName: "Rajesh Patel",
            senderPhoto: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100",
            title: isEn ? "Post Appreciated" : "पोस्ट की सराहना की गई",
            body: isEn 
              ? "Rajesh Patel liked your post on organic compost preparation." 
              : "राजेश पटेल ने जैविक खाद तैयार करने की आपकी पोस्ट को पसंद किया।",
            createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3h ago
            read: false
          },
          {
            userId: user.uid,
            type: 'connection',
            senderName: "Dr. Swati Sharma",
            senderPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100",
            title: isEn ? "Connection Approved" : "कनेक्शन स्वीकृत",
            body: isEn 
              ? "Dr. Swati Sharma (Agri-Scientist) accepted your professional connection request." 
              : "डॉ. स्वाति शर्मा (कृषि वैज्ञानिक) ने आपके पेशेवर कनेक्शन अनुरोध को स्वीकार कर लिया है।",
            createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1d ago
            read: true
          },
          {
            userId: user.uid,
            type: 'system',
            title: isEn ? "Mandi Price Alert" : "मंडी मूल्य चेतावनी",
            body: isEn 
              ? "Wheat prices in nearest Meerut Mandi have increased by ₹50/quintal. Tap to analyze." 
              : "निकटतम मेरठ मंडी में गेहूं की कीमतों में ₹50/क्विंटल की वृद्धि हुई है। विश्लेषण के लिए टैप करें।",
            createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2d ago
            read: true
          }
        ];

        try {
          for (const notif of initialNotifs) {
            await addDoc(notifCol, notif);
          }
        } catch (e) {
          console.error("Error seeding initial notifications:", e);
        }
        return;
      }

      setNotifications(loadedNotifs);
      setUnreadNotificationsCount(loadedNotifs.filter(n => !n.read).length);
    }, (err) => {
      console.error("Error loading notifications:", err);
    });

    return unsubscribe;
  }, [user, language]);

  const markNotificationAsRead = async (id: string) => {
    try {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        const notifRef = doc(db, 'notifications', n.id);
        await updateDoc(notifRef, { read: true });
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    try {
      const notifCol = collection(db, 'notifications');
      await addDoc(notifCol, {
        ...notif,
        createdAt: new Date().toISOString(),
        read: false
      });
    } catch (err) {
      console.error("Error adding notification:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      isInitialLoading,
      isActionLoading,
      language,
      loginWithGoogle, 
      loginAsDemoUser,
      logout, 
      updateProfile,
      switchLanguage,
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

