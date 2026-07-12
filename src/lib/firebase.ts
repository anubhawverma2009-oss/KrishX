/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { 
  collection as realCollection,
  query as realQuery,
  where as realWhere,
  orderBy as realOrderBy,
  limit as realLimit,
  onSnapshot as realOnSnapshot,
  getDocs as realGetDocs,
  getDoc as realGetDoc,
  setDoc as realSetDoc,
  addDoc as realAddDoc,
  updateDoc as realUpdateDoc,
  doc as realDoc,
  arrayUnion as realArrayUnion,
  arrayRemove as realArrayRemove,
  writeBatch as realWriteBatch,
  deleteDoc as realDeleteDoc
} from 'firebase/firestore';

// Credentials from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCP_hJaqXCjqa2wa11uhOR5jV4Y3DumKA4",
  authDomain: "lofty-market-zbwbv.firebaseapp.com",
  projectId: "lofty-market-zbwbv",
  storageBucket: "lofty-market-zbwbv.firebasestorage.app",
  messagingSenderId: "81317196678",
  appId: "1:81317196678:web:3677ede5a1d971adfc7207"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID provisioned by AI Studio
export const db = getFirestore(app, "ai-studio-krishx-a5f757f4-e629-40e8-b716-a52e7dd6c84e");

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const storage = getStorage(app);

// --- ERROR HANDLING ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- HYBRID MOCK / OFFLINE MODE INTERCEPTOR ---

export const isOffline = () => localStorage.getItem('krishx_offline_mode') === 'true';

export class MockDocRef {
  constructor(public path: string, public id: string) {}
}

export class MockCollectionRef {
  constructor(public path: string) {}
}

export class MockQuery {
  constructor(public collectionRef: MockCollectionRef, public constraints: any[] = []) {}
}

export const collection = (dbInstance: any, path: string) => {
  if (isOffline()) {
    return new MockCollectionRef(path) as any;
  }
  return realCollection(dbInstance, path);
};

export const doc = (parent: any, ...pathSegments: string[]) => {
  if (isOffline()) {
    let fullPath = "";
    if (parent instanceof MockCollectionRef) {
      fullPath = parent.path + "/" + pathSegments[0];
    } else if (typeof parent === 'string') {
      fullPath = parent + "/" + pathSegments.join("/");
    } else if (parent && parent.path) {
      fullPath = parent.path + "/" + pathSegments.join("/");
    } else {
      fullPath = pathSegments.join("/");
    }
    const parts = fullPath.split("/");
    const id = parts[parts.length - 1];
    return new MockDocRef(fullPath, id) as any;
  }
  return (realDoc as any)(parent, ...pathSegments);
};

export const query = (queryInstance: any, ...constraints: any[]) => {
  if (isOffline()) {
    const colRef = queryInstance instanceof MockQuery ? queryInstance.collectionRef : queryInstance;
    const existingConstraints = queryInstance instanceof MockQuery ? queryInstance.constraints : [];
    return new MockQuery(colRef, [...existingConstraints, ...constraints]) as any;
  }
  return realQuery(queryInstance, ...constraints);
};

export const where = (field: string, op: string, value: any) => {
  if (isOffline()) {
    return { type: 'where', field, op, value };
  }
  return realWhere(field, op as any, value);
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  if (isOffline()) {
    return { type: 'orderBy', field, direction };
  }
  return realOrderBy(field, direction);
};

export const limit = (num: number) => {
  if (isOffline()) {
    return { type: 'limit', value: num };
  }
  return realLimit(num);
};

export const arrayUnion = (...elements: any[]) => {
  if (isOffline()) {
    return { __op: 'arrayUnion', elements };
  }
  return realArrayUnion(...elements);
};

export const arrayRemove = (...elements: any[]) => {
  if (isOffline()) {
    return { __op: 'arrayRemove', elements };
  }
  return realArrayRemove(...elements);
};

// Listeners registry for local live updates
const listeners: { [path: string]: (() => void)[] } = {};

const registerListener = (path: string, cb: () => void) => {
  if (!listeners[path]) {
    listeners[path] = [];
  }
  listeners[path].push(cb);
  return () => {
    listeners[path] = listeners[path].filter(x => x !== cb);
  };
};

const notifyListeners = (path: string) => {
  if (listeners[path]) {
    listeners[path].forEach(cb => cb());
  }
};

const getLocalStorageDb = (path: string): any[] => {
  const key = `krishx_local_db_${path}`;
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  // If empty, initialize with default seeded data
  let initial: any[] = [];
  if (path === 'communities') {
    initial = [
      {
        id: 'organic',
        name: 'जैविक खेती (Organic Farming)',
        description: 'प्राकृतिक खाद, गोमूत्र, और जीवामृत से टिकाऊ कृषि की विधियों और अनुभवों का आदान-प्रदान।',
        category: 'Sustainable',
        memberCount: 1420,
        coverImage: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600',
        icon: '🌱'
      },
      {
        id: 'wheat',
        name: 'गेहूं उत्पादक संघ (Wheat Farmers)',
        description: 'गेहूं की नई किस्मों, बुवाई तकनीकों, खरपतवार नियंत्रण और अधिकतम उपज पर वैज्ञानिक चर्चा।',
        category: 'Crops',
        memberCount: 2310,
        coverImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
        icon: '🌾'
      },
      {
        id: 'sugarcane',
        name: 'गन्ना क्रांति (Sugarcane Growers)',
        description: 'गन्ने की बुवाई, रोग निवारण, ड्रिप सिंचाई और चीनी मिल भुगतान प्रक्रियाओं पर केंद्रित समूह।',
        category: 'Crops',
        memberCount: 980,
        coverImage: 'https://images.unsplash.com/photo-1593113644099-5f41e12d962e?auto=format&fit=crop&q=80&w=600',
        icon: '🪵'
      },
      {
        id: 'dairy',
        name: 'श्वेत क्रांति (Dairy Farming)',
        description: 'उन्नत नस्ल के पशुपालन, दूध उत्पादन बढ़ाने, संतुलित पशु आहार और पशु स्वास्थ्य प्रबंधन गाइड।',
        category: 'Dairy',
        memberCount: 1840,
        coverImage: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600',
        icon: '🥛'
      },
      {
        id: 'vegetables',
        name: 'सब्जी उत्पादन (Vegetable Farming)',
        description: 'पॉलीहाउस खेती, संरक्षित बागवानी और टमाटर, मिर्च, आलू जैसी सब्जियों के लिए उन्नत तकनीकें।',
        category: 'Horticulture',
        memberCount: 1150,
        coverImage: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=600',
        icon: '🥦'
      }
    ];
  } else if (path === 'opportunities') {
    initial = [
      {
        id: 'pm-kusum',
        title: 'पीएम-कुसुम योजना (PM-KUSUM Scheme)',
        organization: 'नवीन और नवीकरणीय ऊर्जा मंत्रालय, भारत सरकार',
        type: 'Scheme',
        description: 'खेतों में सौर जल पंप स्थापित करने के लिए किसानों को 60% तक की भारी सब्सिडी। बंजर भूमि पर सौर संयंत्र लगाने के अवसर।',
        eligibility: 'सभी किसान, सहकारी समितियां, और एफपीओ जिनके पास कृषि योग्य या बंजर भूमि हो।',
        benefits: 'सिंचाई लागत 90% तक कम होगी। अतिरिक्त सौर बिजली को ग्रिड में बेचकर सालाना आय बढ़ाने का मौका।',
        link: 'https://pmkusum.mnre.gov.in',
        createdAt: new Date().toISOString(),
        highlightColor: 'bg-krishx-earth-50 text-krishx-dark-700 border-krishx-earth-300'
      },
      {
        id: 'drone-training',
        title: 'कृषि ड्रोन संचालन प्रशिक्षण (Agricultural Drone Training)',
        organization: 'राष्ट्रीय कृषि विस्तार एवं प्रबंधन संस्थान (MANAGE)',
        type: 'Training',
        description: 'खेतों में उर्वरक और कीटनाशकों के स्मार्ट छिड़काव के लिए 10 दिवसीय प्रमाणित ड्रोन उड़ाने का प्रशिक्षण कार्यक्रम।',
        eligibility: 'कृषि छात्र, स्नातक या 10वीं पास प्रगतिशील युवा किसान (आयु 18-35 वर्ष)।',
        benefits: 'प्रशिक्षण के बाद सरकारी मान्यता प्राप्त पायलट लाइसेंस। ड्रोन स्टार्टअप शुरू करने के लिए कम ब्याज दर पर ऋण सुविधा।',
        link: 'https://www.manage.gov.in',
        createdAt: new Date().toISOString(),
        highlightColor: 'bg-teal-50 text-teal-800 border-teal-200'
      },
      {
        id: 'organic-grant',
        title: 'परंपरागत कृषि विकास योजना ग्रांट (PKVY Grant)',
        organization: 'कृषि एवं किसान कल्याण मंत्रालय',
        type: 'Grant',
        description: 'जैविक खेती को बढ़ावा देने के लिए क्लस्टर निर्माण हेतु वित्तीय सहायता। 3 वर्षों के लिए प्रति हेक्टेयर ₹50,000 की राशि।',
        eligibility: 'न्यूनतम 20 एकड़ क्षेत्र के साथ कम से कम 50 किसानों का सक्रिय क्लस्टर या FPO।',
        benefits: 'जैविक खाद, बीज उत्पादन, मूल्य संवर्धन, ब्रांडिंग और पैकिंग के लिए सीधे बैंक खाते में सहायता राशि।',
        link: 'https://dshd.dac.gov.in',
        createdAt: new Date().toISOString(),
        highlightColor: 'bg-amber-50 text-amber-800 border-amber-200'
      },
      {
        id: 'agri-startup-fellowship',
        title: 'कृषि-उद्यमिता फेलोशिप प्रोग्राम (Agri-Startup Fellowship)',
        organization: 'कृषि अनुसंधान परिषद (ICAR) - पूसा कृषि',
        type: 'Startup',
        description: 'कृषि क्षेत्र में नए तकनीकी नवाचारों, स्मार्ट सेंसर, आईओटी या एआई आधारित समाधानों को स्टार्टअप में बदलने के लिए मेंटरशिप और सीड फंडिंग।',
        eligibility: 'कृषि स्नातक छात्र, रिसर्चर्स, और इनोवेटर्स जिनके पास व्यावहारिक वर्किंग प्रोटोटाइप हो।',
        benefits: '₹5 लाख से ₹25 लाख तक की वित्तीय सहायता (सीड ग्रांट)। आईसीआर के वैज्ञानिकों से डायरेक्ट लैब सपोर्ट।',
        link: 'https://pusakrishi.icar.gov.in',
        createdAt: new Date().toISOString(),
        highlightColor: 'bg-blue-50 text-blue-800 border-blue-200'
      },
      {
        id: 'msc-scholarship',
        title: 'राष्ट्रीय कृषि छात्रवृत्ति (National Agri Scholarship)',
        organization: 'भारतीय कृषि अनुसंधान परिषद (ICAR)',
        type: 'Scholarship',
        description: 'कृषि विश्वविद्यालयों में उच्च शिक्षा (M.Sc / Ph.D Agriculture) के लिए मेधावी छात्रों को मासिक वित्तीय छात्रवृत्ति सहायता।',
        eligibility: 'मान्यता प्राप्त कृषि विश्वविद्यालय से उत्कृष्ट अंकों के साथ स्नातक छात्र।',
        benefits: '₹12,000 प्रति माह फेलोशिप के साथ शैक्षणिक व्यय के लिए आकस्मिक निधि सहायता।',
        link: 'https://icar.org.in',
        createdAt: new Date().toISOString(),
        highlightColor: 'bg-violet-50 text-violet-800 border-violet-200'
      }
    ];
  } else if (path === 'posts') {
    initial = [
      {
        id: 'post-1',
        authorId: 'demo-expert',
        authorName: 'डॉ. आरती सिंह',
        authorPhotoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
        authorKrishXId: 'KX-DL-492104',
        authorBadges: ['expert', 'helper'],
        content: 'किसान भाइयों, वर्तमान मौसम में गन्ने की फसल में "ब्लैक बग" (काले कीड़े) का प्रकोप देखा जा रहा है। इसके नियंत्रण के लिए कृपया रासायनिक कीटनाशकों के अत्यधिक छिड़काव से बचें। \n\nप्राकृतिक उपचार: प्रति एकड़ 5 लीटर मट्ठे (छाछ) में 1 किलो नीम की पत्ती और 250 ग्राम लहसुन पीसकर उबालें। छानकर 150 लीटर पानी में मिलाकर सुबह के समय छिड़काव करें। यह कीटों को भगाता है और पत्तों को मजबूती प्रदान करता है। किसी भी संदेह की स्थिति में तुरंत कमेंट करें!',
        category: 'Knowledge',
        topic: 'गन्ना क्रांति (Sugarcane Growers)',
        likes: ['demo-farmer', 'demo-student'],
        comments: [
          {
            id: 'c-1',
            authorId: 'demo-farmer',
            authorName: 'रमेश कुमार',
            authorPhotoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
            content: 'बहुत उपयोगी सलाह डॉक्टर साहिबा! क्या इस घोल का प्रयोग हम टमाटर की फसल पर भी कर सकते हैं?',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'post-2',
        authorId: 'demo-farmer',
        authorName: 'रमेश कुमार',
        authorPhotoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
        authorKrishXId: 'KX-PB-774012',
        authorBadges: ['pioneer', 'expert'],
        content: 'आज मेरे खेत में जैविक विधि से तैयार "जीवामृत" का छिड़काव किया गया। 200 लीटर पानी में 10 किलो देसी गाय का गोबर, 8 लीटर गोमूत्र, 2 किलो गुड़, 2 किलो बेसन और 1 किलो पीपल के पेड़ के नीचे की सजीव मिट्टी को मिलाकर 4 दिन फर्मेंट किया था। \n\nफायदे: फसल का रंग गहरा हरा हो गया है और केंचुए फिर से भूमि में सक्रिय हो रहे हैं। जैविक खेती अपनाएं, भूमि का स्वास्थ्य बचाएं!',
        imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600',
        category: 'Experience',
        topic: 'जैविक खेती (Organic Farming)',
        likes: ['demo-expert'],
        comments: [],
        createdAt: new Date(Date.now() - 14400000).toISOString()
      }
    ];
  } else if (path === 'users') {
    initial = [
      {
        uid: 'demo-farmer',
        krishXId: 'KX-PB-774012',
        name: 'रमेश कुमार',
        email: 'ramesh.farmer@krishx.org',
        photoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
        crops: ["गेहूं (Wheat)", "सरसों (Mustard)", "गन्ना (Sugarcane)"],
        location: "बठिंडा, पंजाब",
        experienceYears: 12,
        education: "कृषि विज्ञान केंद्र प्रशिक्षण",
        skills: ["जैविक खाद उत्पादन", "ड्रिप सिंचाई तकनीक", "फसल रोटेशन"],
        achievements: ["जिला सर्वोत्तम किसान पुरस्कार 2024", "उन्नत कृषक सम्मान"],
        summary: "मैं पिछले 12 वर्षों से पर्यावरण हितैषी प्राकृतिक खाद और आधुनिक जल-बचत तकनीकों से जैविक खेती कर रहा हूँ।",
        krishScore: 850,
        badges: ["pioneer", "expert"],
        createdAt: new Date().toISOString()
      },
      {
        uid: 'demo-expert',
        krishXId: 'KX-DL-492104',
        name: 'डॉ. आरती सिंह',
        email: 'dr.singh.expert@krishx.org',
        photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
        crops: ["मृदा स्वास्थ्य (Soil)", "कीट नियंत्रण (Pest Control)"],
        location: "नई दिल्ली",
        experienceYears: 15,
        education: "Ph.D. कृषि विज्ञान (IARI)",
        skills: ["कीट विज्ञान विशेषज्ञता", "मृदा परीक्षण", "पौध संरक्षण तकनीक"],
        achievements: ["राष्ट्रीय कृषि वैज्ञानिक सम्मान", "15+ शोध पत्र प्रकाशित"],
        summary: "वरिष्ठ कृषि वैज्ञानिक और मृदा स्वास्थ्य विशेषज्ञ। भारतीय किसानों के आर्थिक उत्थान और फसल सुधार के लिए निरंतर समर्पित।",
        krishScore: 920,
        badges: ["expert", "helper"],
        createdAt: new Date().toISOString()
      },
      {
        uid: 'demo-student',
        krishXId: 'KX-MH-102938',
        name: 'शुभम चौधरी',
        email: 'shubham.student@krishx.org',
        photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        crops: ["उद्यानिकी (Horticulture)", "फलों की खेती"],
        location: "नासिक, महाराष्ट्र",
        experienceYears: 2,
        education: "B.Sc. Agriculture (अंतिम वर्ष)",
        skills: ["कृषि ड्रोन तकनीक", "हाइड्रोपोनिक्स सिस्टम", "डिजिटल कृषि मार्केटिंग"],
        achievements: ["स्मार्ट इंडिया हैकाथॉन कृषि विजेता"],
        summary: "उत्साही कृषि छात्र। नए वैज्ञानिक अनुसंधान को जमीनी स्तर पर लागू करने और डिजिटल टूल्स के माध्यम से किसानों की सहायता करने में रुचि।",
        krishScore: 680,
        badges: ["pioneer", "helper"],
        createdAt: new Date().toISOString()
      }
    ];
  }
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const setLocalStorageDb = (path: string, list: any[]) => {
  const key = `krishx_local_db_${path}`;
  localStorage.setItem(key, JSON.stringify(list));
  notifyListeners(path);
};

export const seedOfflineData = () => {
  getLocalStorageDb('communities');
  getLocalStorageDb('opportunities');
  getLocalStorageDb('posts');
  getLocalStorageDb('users');
};

export const onSnapshot = (
  queryOrRef: any,
  next: (snapshot: any) => void,
  error?: (error: any) => void
) => {
  if (isOffline()) {
    const runQueryAndNotify = () => {
      try {
        let path = "";
        let constraints: any[] = [];
        if (queryOrRef instanceof MockCollectionRef) {
          path = queryOrRef.path;
        } else if (queryOrRef instanceof MockQuery) {
          path = queryOrRef.collectionRef.path;
          constraints = queryOrRef.constraints;
        } else if (queryOrRef instanceof MockDocRef) {
          path = queryOrRef.path;
        } else {
          path = queryOrRef.path || "";
        }

        if (path.includes('/')) {
          const parts = path.split('/');
          const collectionPath = parts[0];
          const docId = parts[1];
          const items = getLocalStorageDb(collectionPath);
          const item = items.find((x: any) => x.id === docId || x.uid === docId);
          
          next({
            exists: () => !!item,
            id: docId,
            data: () => item || null
          });
        } else {
          let items = [...getLocalStorageDb(path)];
          
          for (const c of constraints) {
            if (c.type === 'where') {
              items = items.filter(item => {
                const itemVal = item[c.field];
                if (c.op === '==') return itemVal === c.value;
                if (c.op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(c.value);
                return true;
              });
            } else if (c.type === 'orderBy') {
              items.sort((a, b) => {
                const valA = a[c.field];
                const valB = b[c.field];
                if (valA < valB) return c.direction === 'asc' ? -1 : 1;
                if (valA > valB) return c.direction === 'asc' ? 1 : -1;
                return 0;
              });
            } else if (c.type === 'limit') {
              items = items.slice(0, c.value);
            }
          }

          next({
            docs: items.map(item => ({
              id: item.id || item.uid,
              data: () => item
            })),
            empty: items.length === 0
          });
        }
      } catch (err) {
        if (error) error(err);
      }
    };

    runQueryAndNotify();
    
    let collectionName = "";
    if (queryOrRef instanceof MockCollectionRef) {
      collectionName = queryOrRef.path;
    } else if (queryOrRef instanceof MockQuery) {
      collectionName = queryOrRef.collectionRef.path;
    } else if (queryOrRef instanceof MockDocRef) {
      collectionName = queryOrRef.path.split('/')[0];
    } else {
      collectionName = (queryOrRef.path || "").split('/')[0];
    }
    
    return registerListener(collectionName, runQueryAndNotify);
  }
  
  return realOnSnapshot(queryOrRef, next, (err) => {
    handleFirestoreError(err, OperationType.LIST, (queryOrRef as any).path || 'query');
    if (error) error(err);
  });
};

export const getDocs = async (queryOrRef: any) => {
  if (isOffline()) {
    let path = "";
    let constraints: any[] = [];
    if (queryOrRef instanceof MockCollectionRef) {
      path = queryOrRef.path;
    } else if (queryOrRef instanceof MockQuery) {
      path = queryOrRef.collectionRef.path;
      constraints = queryOrRef.constraints;
    } else {
      path = queryOrRef.path || "";
    }

    let items = [...getLocalStorageDb(path)];
    
    for (const c of constraints) {
      if (c.type === 'where') {
        items = items.filter(item => {
          const itemVal = item[c.field];
          if (c.op === '==') return itemVal === c.value;
          if (c.op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(c.value);
          return true;
        });
      } else if (c.type === 'orderBy') {
        items.sort((a, b) => {
          const valA = a[c.field];
          const valB = b[c.field];
          if (valA < valB) return c.direction === 'asc' ? -1 : 1;
          if (valA > valB) return c.direction === 'asc' ? 1 : -1;
          return 0;
        });
      } else if (c.type === 'limit') {
        items = items.slice(0, c.value);
      }
    }

    return {
      docs: items.map(item => ({
        id: item.id || item.uid,
        data: () => item
      })),
      empty: items.length === 0
    } as any;
  }
  try {
    return await realGetDocs(queryOrRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, (queryOrRef as any).path || 'query');
    throw error;
  }
};

export const getDoc = async (docRef: any) => {
  if (isOffline()) {
    const parts = docRef.path.split('/');
    const colPath = parts[0];
    const docId = parts[1];
    const items = getLocalStorageDb(colPath);
    const item = items.find((x: any) => x.id === docId || x.uid === docId);
    return {
      exists: () => !!item,
      id: docId,
      data: () => item || null
    } as any;
  }
  try {
    return await realGetDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, (docRef as any).path || 'doc');
    throw error;
  }
};

const setLocalDoc = (path: string, data: any) => {
  const parts = path.split('/');
  const colPath = parts[0];
  const docId = parts[1];
  const items = getLocalStorageDb(colPath);
  const existingIdx = items.findIndex((x: any) => x.id === docId || x.uid === docId);
  
  const docData = { ...data };
  if (docData.id === undefined && docData.uid === undefined) {
    if (colPath === 'users') {
      docData.uid = docId;
    } else {
      docData.id = docId;
    }
  }

  if (existingIdx >= 0) {
    items[existingIdx] = { ...items[existingIdx], ...docData };
  } else {
    items.push(docData);
  }
  setLocalStorageDb(colPath, items);
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  if (isOffline()) {
    setLocalDoc(docRef.path, data);
    return;
  }
  try {
    return await realSetDoc(docRef, data, options);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, (docRef as any).path || 'doc');
    throw error;
  }
};

export const addDoc = async (colRef: any, data: any) => {
  if (isOffline()) {
    const docId = Math.random().toString(36).substring(2, 11);
    const items = getLocalStorageDb(colRef.path);
    const docData = { id: docId, ...data };
    items.push(docData);
    setLocalStorageDb(colRef.path, items);
    return { id: docId, path: `${colRef.path}/${docId}` } as any;
  }
  try {
    return await realAddDoc(colRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, (colRef as any).path || 'collection');
    throw error;
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  if (isOffline()) {
    const parts = docRef.path.split('/');
    const colPath = parts[0];
    const docId = parts[1];
    const items = getLocalStorageDb(colPath);
    const existingIdx = items.findIndex((x: any) => x.id === docId || x.uid === docId);
    
    if (existingIdx >= 0) {
      const current = items[existingIdx];
      const updated = { ...current };
      
      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && (val as any).__op === 'arrayUnion') {
          const arr = Array.isArray(updated[key]) ? updated[key] : [];
          updated[key] = [...arr, ...(val as any).elements];
        } else if (val && typeof val === 'object' && (val as any).__op === 'arrayRemove') {
          const arr = Array.isArray(updated[key]) ? updated[key] : [];
          updated[key] = arr.filter((x: any) => !(val as any).elements.includes(x));
        } else {
          updated[key] = val;
        }
      }
      
      items[existingIdx] = updated;
      setLocalStorageDb(colPath, items);
    }
    return;
  }
  try {
    return await realUpdateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, (docRef as any).path || 'doc');
    throw error;
  }
};

export const deleteDoc = async (docRef: any) => {
  if (isOffline()) {
    const parts = docRef.path.split('/');
    const colPath = parts[0];
    const docId = parts[1];
    const items = getLocalStorageDb(colPath);
    const updated = items.filter((x: any) => x.id !== docId && x.uid !== docId);
    setLocalStorageDb(colPath, updated);
    return;
  }
  try {
    return await realDeleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, (docRef as any).path || 'doc');
    throw error;
  }
};

export const writeBatch = (dbInstance: any) => {
  if (isOffline()) {
    const batchOperations: (() => void)[] = [];
    return {
      set: (docRef: any, data: any) => {
        batchOperations.push(() => {
          setLocalDoc(docRef.path, data);
        });
      },
      commit: async () => {
        for (const op of batchOperations) {
          op();
        }
      }
    } as any;
  } else {
    const batch = realWriteBatch(dbInstance);
    const realCommit = batch.commit.bind(batch);
    batch.commit = async () => {
      try {
        return await realCommit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'batch');
        throw error;
      }
    };
    return batch;
  }
};

export default app;

