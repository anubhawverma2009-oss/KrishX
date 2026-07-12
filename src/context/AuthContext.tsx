/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, isOffline, seedOfflineData, handleFirestoreError, OperationType } from '../lib/firebase';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile } from '../types';

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
    console.log("[AuthDebug] AuthProvider mounted. Initializing state...");
    console.log("[AuthDebug] Browser network status: ", navigator.onLine ? "ONLINE" : "OFFLINE");
    
    const isOfflineMode = localStorage.getItem('krishx_offline_mode') === 'true';
    const savedUser = localStorage.getItem('krishx_mock_user');
    
    if (isOfflineMode && savedUser) {
      console.log("[AuthDebug] Loading existing session in Offline/Demo mode. Mock User:", savedUser);
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        const profile = localStorage.getItem(`krishx_mock_profile_${u.uid}`);
        if (profile) {
          setUserProfile(JSON.parse(profile));
          console.log("[AuthDebug] Mock profile loaded successfully.");
        }
      } catch (err) {
        console.error("[AuthDebug] Failed to parse saved mock user/profile, resetting.", err);
        localStorage.removeItem('krishx_offline_mode');
        localStorage.removeItem('krishx_mock_user');
      }
      setIsInitialLoading(false);
      return;
    } else {
      if (isOfflineMode) {
        console.log("[AuthDebug] Offline mode flag was set but no mock user found. Resetting.");
        localStorage.removeItem('krishx_offline_mode');
      }
    }

    console.log("[AuthDebug] Subscribing to real Firebase onAuthStateChanged...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthDebug] onAuthStateChanged callback fired. User:", firebaseUser ? firebaseUser.email : "null");
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          console.log("[AuthDebug] User is logged in. Syncing profile from Firestore...");
          await syncProfile(firebaseUser);
          console.log("[AuthDebug] Profile sync complete.");
        } catch (err) {
          console.error("[AuthDebug] Profile sync failed on auth change:", err);
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
    console.log("[AuthDebug] loginWithGoogle initiated.");
    console.log("[AuthDebug] Firebase config checks:");
    console.log("[AuthDebug]   - Project ID:", auth.app.options.projectId);
    console.log("[AuthDebug]   - Auth Domain:", auth.app.options.authDomain);
    console.log("[AuthDebug]   - API Key present:", !!auth.app.options.apiKey);
    
    // Explicitly clear offline mode to ensure a fresh, real Firebase Google Auth attempt
    if (localStorage.getItem('krishx_offline_mode') === 'true') {
      console.log("[AuthDebug] Clearing lingering offline mode flag before starting Google Sign-In.");
      localStorage.removeItem('krishx_offline_mode');
      localStorage.removeItem('krishx_mock_user');
    }

    try {
      console.log("[AuthDebug] Calling signOut() to clear stale sessions...");
      await auth.signOut();
      
      console.log("[AuthDebug] Calling signInWithPopup(auth, googleProvider)...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[AuthDebug] signInWithPopup completed successfully! User UID:", result.user.uid, "Email:", result.user.email);
    } catch (err: any) {
      console.error("[AuthDebug] Google Auth Error during signInWithPopup:");
      console.error("[AuthDebug]   - Error Code:", err.code);
      console.error("[AuthDebug]   - Error Message:", err.message);
      console.error("[AuthDebug]   - Full Error Object:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Legendary Demo User login to bypass iframe oauth restrictions during review / hackathon demo
  const loginAsDemoUser = async (demoType: 'farmer' | 'expert' | 'student') => {
    setIsActionLoading(true);
    console.log(`[AuthDebug] loginAsDemoUser called for demo type: ${demoType}`);
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
        console.log(`[AuthDebug] Attempting real Firebase Auth signInWithEmailAndPassword for: ${email}`);
        const res = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = res.user;
        console.log(`[AuthDebug] Real Firebase Auth sign-in successful. Syncing profile...`);

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
        console.error("[AuthDebug] Real Firebase Auth sign-in failed with error code:", e.code, "message:", e.message);
        
        const isNetworkOffline = !navigator.onLine || e.code === 'auth/network-request-failed' || e.message?.includes('network');
        
        if (isNetworkOffline) {
          console.warn("[AuthDebug] Firebase is actually unavailable (Network is offline). Switching to Offline Demo Mode.");
        } else {
          console.warn(`[AuthDebug] Firebase is available, but Email/Password provider returned error "${e.code}" (likely disabled in Firebase Console). Falling back to Local Mock Demo Mode for this session so you can explore the app.`);
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
      console.error("[AuthDebug] Demo login flow error:", err);
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
      switchLanguage
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

