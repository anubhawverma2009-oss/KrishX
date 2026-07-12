/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove 
} from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Sprout, 
  ChevronRight, 
  MessageSquare, 
  ThumbsUp, 
  ArrowLeft, 
  Send, 
  Smile, 
  Image, 
  FileText, 
  Check, 
  Lock, 
  Plus, 
  Share2, 
  Globe, 
  Sparkles, 
  MapPin,
  MessageCircle
} from 'lucide-react';
import { Community, Post, Comment } from '../types';

interface CommunitiesProps {
  searchQuery?: string;
}

// 6 Premium Agriculture Communities
const STATIC_COMMUNITIES = [
  {
    id: 'wheat',
    name: 'गेहूं उत्पादक संघ (Wheat Farmers)',
    description: 'गेहूं की नई किस्मों (HD 3226, DBW 187), बुवाई तकनीकों, खरपतवार नियंत्रण और अधिकतम उपज पर वैज्ञानिक चर्चा।',
    category: 'Crops',
    memberCount: 2310,
    activeToday: 342,
    coverImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
    icon: '🌾'
  },
  {
    id: 'dairy',
    name: 'श्वेत क्रांति (Dairy Farmers)',
    description: 'उन्नत नस्ल के पशुपालन (गीर, साहिवाल, मुर्राह), दूध उत्पादन बढ़ाने, संतुलित पशु आहार और पशु स्वास्थ्य प्रबंधन गाइड।',
    category: 'Dairy',
    memberCount: 1840,
    activeToday: 198,
    coverImage: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600',
    icon: '🥛'
  },
  {
    id: 'organic',
    name: 'जैविक खेती (Organic Farming)',
    description: 'प्राकृतिक खाद, गोमूत्र, और जीवामृत से टिकाऊ कृषि की विधियों और अनुभवों का आदान-प्रदान। रसायन मुक्त खेती।',
    category: 'Sustainable',
    memberCount: 1420,
    activeToday: 156,
    coverImage: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600',
    icon: '🌱'
  },
  {
    id: 'vegetables',
    name: 'सब्जी उत्पादन (Vegetable Growers)',
    description: 'पॉलीहाउस खेती, संरक्षित बागवानी और टमाटर, मिर्च, आलू जैसी सब्जियों के लिए उन्नत तकनीकें व मंडी भाव।',
    category: 'Horticulture',
    memberCount: 1150,
    activeToday: 87,
    coverImage: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=600',
    icon: '🍅'
  },
  {
    id: 'rice',
    name: 'धान उत्पादक संघ (Rice Farmers)',
    description: 'धान की बासमती किस्मों की बुवाई, नर्सरी प्रबंधन, जल प्रबंधन और रोग नियंत्रण पर कृषि विशेषज्ञों द्वारा सलाह।',
    category: 'Crops',
    memberCount: 3450,
    activeToday: 412,
    coverImage: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600',
    icon: '🌾'
  },
  {
    id: 'sugarcane',
    name: 'गन्ना क्रांति (Sugarcane Growers)',
    description: 'गन्ने की ट्रेंच बुवाई, रोग निवारण (लाल सड़न रोग), ड्रिप सिंचाई और चीनी मिल भुगतान प्रक्रियाओं पर केंद्रित समूह।',
    category: 'Crops',
    memberCount: 980,
    activeToday: 64,
    coverImage: 'https://images.unsplash.com/photo-1593113644099-5f41e12d962e?auto=format&fit=crop&q=80&w=600',
    icon: '🌴'
  }
];

// Fallback/Sample Posts for communities to keep the experience extremely rich
const SAMPLE_COMMUNITY_POSTS: Record<string, Post[]> = {
  wheat: [
    {
      id: 'p-wheat-1',
      authorId: 'expert-1',
      authorName: 'Dr. Ramesh Kumar',
      authorPhotoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
      authorKrishXId: 'KX-EX-449120',
      authorBadges: ['expert'],
      authorRole: 'Soil Science & Nutrition Specialist',
      authorLocation: 'Ludhiana, Punjab',
      content: 'किसान भाइयों, गेहूं की फसल में नाइट्रोजन की कमी को पूरा करने के लिए पहले पानी के बाद यूरिया के साथ-साथ जिंक सल्फेट का छिड़काव अवश्य करें। इससे पत्तियां पीली नहीं पड़ेंगी और कल्ले अधिक निकलेंगे। बुवाई के समय सुपर सीडर का प्रयोग करने से भूमि की नमी भी बनी रहती है।',
      category: 'Knowledge',
      topic: 'गेहूं उत्पादक संघ (Wheat Farmers)',
      likes: ['user-12', 'user-45'],
      comments: [
        {
          id: 'c-1',
          authorId: 'farmer-balwinder',
          authorName: 'Balwinder Singh',
          authorPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
          content: 'डॉक्टर साहब, क्या हम यूरिया के साथ घुलनशील NPK 19:19:19 का स्प्रे कर सकते हैं?',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    }
  ],
  dairy: [
    {
      id: 'p-dairy-1',
      authorId: 'expert-2',
      authorName: 'Surendra Singh Rathore',
      authorPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
      authorKrishXId: 'KX-EX-128450',
      authorBadges: ['expert'],
      authorRole: 'Veterinary Officer',
      authorLocation: 'Karnal, Haryana',
      content: 'डेयरी किसानों के लिए सलाह: दुधारू पशुओं के आहार में साइलेज का उपयोग बढ़ाएं। साइलेज हरा चारा न होने पर भी पशुओं को आवश्यक पोषण देता है, जिससे दूध की वसा (FAT) और SNF मात्रा बनी रहती है। मुर्राह भैंसों के संतुलित आहार में 50 ग्राम खनिज लवण प्रतिदिन शामिल करें।',
      category: 'Research',
      topic: 'श्वेत क्रांति (Dairy Farmers)',
      likes: ['user-22'],
      comments: [],
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    }
  ],
  organic: [
    {
      id: 'p-organic-1',
      authorId: 'farmer-balwinder',
      authorName: 'Balwinder Singh',
      authorPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
      authorKrishXId: 'KX-FM-229108',
      authorBadges: ['pioneer'],
      authorRole: 'Organic Farming Practitioner',
      authorLocation: 'Bhatinda, Punjab',
      content: 'साथियों, आज मैंने अपने खेत के लिए 500 लीटर जीवामृत तैयार किया है। इसमें 10 किलो गाय का गोबर, 10 लीटर गोमूत्र, 2 किलो गुड़, 2 किलो बेसन और हमारे खेत की सजीव मिट्टी मिलाई है। यह जीवामृत फसलों को पोषक तत्व प्रदान करने और मिट्टी के मित्र कीड़ों की संख्या बढ़ाने में चमत्कारी परिणाम देता है।',
      imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600',
      category: 'Success Story',
      topic: 'जैविक खेती (Organic Farming)',
      likes: ['user-3', 'user-89', 'user-77'],
      comments: [],
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ]
};

// Preset high-quality images farmers can use when writing posts
const PRESET_POST_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400', label: '🌾 Wheat Field' },
  { url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=400', label: '🌱 Compost/Bio' },
  { url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400', label: '🍅 Veggies' },
  { url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=400', label: '🥛 Dairy Farm' },
  { url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=400', label: '🌾 Paddy Crop' }
];

// Preset Group Chat messages for realistic, real-time feel
const DEFAULT_CHAT_MESSAGES: Record<string, Array<{id: string, senderName: string, role: string, badges: string[], photoURL: string, text: string, createdAt: string, isRealUser?: boolean}>> = {
  wheat: [
    { id: 'm1', senderName: 'Dr. Ramesh Kumar', role: 'Soil Scientist', badges: ['expert'], photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100', text: 'राम राम सभी गेहूं उत्पादक भाइयों को! इस बार बुवाई के लिए बीज उपचार (seed treatment) बहुत जरूरी है।', createdAt: '06:12 PM' },
    { id: 'm2', senderName: 'Balwinder Singh', role: 'Farmer', badges: ['pioneer'], photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', text: 'जी डॉक्टर साहब, मैंने ट्राइकोडर्मा से बीज उपचारित किया है। बहुत बढ़िया कल्ले निकले हैं।', createdAt: '06:15 PM' },
    { id: 'm3', senderName: 'Suhani Singh', role: 'Student', badges: [], photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100', text: 'किसान भाइयों, कृषि अनुसंधान केंद्र ने इस वर्ष पीला रतुआ (Yellow Rust) के प्रति सतर्क रहने की चेतावनी दी है।', createdAt: '06:18 PM' }
  ],
  dairy: [
    { id: 'm1', senderName: 'Surendra Singh Rathore', role: 'Veterinary Officer', badges: ['expert'], photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', text: 'पशुओं को थनैला रोग (Mastitis) से बचाने के लिए दूध निकालने के बाद थनों को लाल दवा (KMnO4) के घोल से धोएं।', createdAt: '10:05 AM' },
    { id: 'm2', senderName: 'Ram Avatar', role: 'Dairy Farmer', badges: [], photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', text: 'धन्यवाद डॉक्टर साहब! मेरे पशुशाला में स्वच्छता रखने से दूध उत्पादन बढ़ा है।', createdAt: '10:12 AM' }
  ],
  organic: [
    { id: 'm1', senderName: 'Balwinder Singh', role: 'Organic Practitioner', badges: ['pioneer'], photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', text: 'जीवामृत का छिड़काव हमेशा सुबह के समय या शाम को करें, तेज धूप में बैक्टीरिया नष्ट हो सकते हैं।', createdAt: '04:22 PM' },
    { id: 'm2', senderName: 'Suhani Singh', role: 'BHU Student', badges: [], photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100', text: 'जी बिल्कुल! मैंने अपनी लैब स्टडीज में पाया कि तेज धूप में जीवामृत की सूक्ष्मजीव गतिविधि 70% तक गिर जाती है।', createdAt: '04:30 PM' }
  ]
};

export const Communities: React.FC<CommunitiesProps> = ({ searchQuery = '' }) => {
  const { userProfile } = useAuth();
  
  // States
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>(() => {
    const saved = localStorage.getItem('krishx_joined_communities');
    return saved ? JSON.parse(saved) : ['organic', 'wheat']; // Default pre-joins for immediate action
  });
  
  const [activeCommunity, setActiveCommunity] = useState<typeof STATIC_COMMUNITIES[0] | null>(null);
  const [communityTab, setCommunityTab] = useState<'feed' | 'chat'>('feed');
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  
  // Feed creation states
  const [newPostContent, setNewPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<'Knowledge' | 'Experience' | 'Learning' | 'Success Story' | 'Question' | 'Research'>('Knowledge');
  const [selectedPostImageUrl, setSelectedPostImageUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  
  // Comment states
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<Record<string, typeof DEFAULT_CHAT_MESSAGES['wheat']>>(() => {
    const saved = localStorage.getItem('krishx_local_chats');
    return saved ? JSON.parse(saved) : DEFAULT_CHAT_MESSAGES;
  });
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [chatImageInput, setChatImageInput] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastText(msg);
    toastTimeoutRef.current = setTimeout(() => setToastText(null), 3000);
  };

  // 1. Subscribe to Firestore posts real-time
  useEffect(() => {
    if (!activeCommunity) return;

    const postsQuery = query(
      collection(db, 'posts'), 
      where('topic', '==', activeCommunity.name),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setCommunityPosts(loaded);
    }, (error) => {
      console.warn('Realtime posts load skipped or failed, using local fallback:', error);
    });

    return unsubscribe;
  }, [activeCommunity]);

  // 2. Auto scroll chat to bottom
  useEffect(() => {
    if (communityTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [communityTab, chatMessages, activeCommunity]);

  // Toggle Join
  const handleToggleJoin = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated;
    if (joinedCommunities.includes(id)) {
      updated = joinedCommunities.filter(x => x !== id);
      triggerToast(`Left ${name.split(' (')[0]}`);
    } else {
      updated = [...joinedCommunities, id];
      triggerToast(`Joined ${name.split(' (')[0]}`);
    }
    setJoinedCommunities(updated);
    localStorage.setItem('krishx_joined_communities', JSON.stringify(updated));
  };

  // Submit Post inside community
  const handleCreatePost = async () => {
    if (!userProfile || !activeCommunity) return;
    if (!newPostContent.trim()) {
      triggerToast("कृपया पोस्ट की सामग्री लिखें!");
      return;
    }

    setPosting(true);
    try {
      const postData: any = {
        authorId: userProfile.uid,
        authorName: userProfile.name,
        authorPhotoURL: userProfile.photoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100',
        authorKrishXId: userProfile.krishXId,
        authorBadges: userProfile.badges || [],
        authorRole: userProfile.education || 'किसान मित्र (Farmer)',
        authorLocation: userProfile.location || 'India',
        content: newPostContent,
        category: postCategory,
        topic: activeCommunity.name,
        imageUrl: selectedPostImageUrl || undefined,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(postData).forEach(key => {
        if (postData[key] === undefined) delete postData[key];
      });

      await addDoc(collection(db, 'posts'), postData);
      
      setNewPostContent('');
      setSelectedPostImageUrl(null);
      triggerToast("समुदाय में पोस्ट सफलतापूर्वक साझा की गई!");
    } catch (err) {
      console.error(err);
      triggerToast("पोस्ट पोस्ट करने में विफल।");
    } finally {
      setPosting(false);
    }
  };

  // Like / Appreciate Post
  const handleAppreciatePost = async (post: Post) => {
    if (!userProfile) return;
    const postRef = doc(db, 'posts', post.id);
    const hasAppreciated = post.likes.includes(userProfile.uid);

    try {
      await updateDoc(postRef, {
        likes: hasAppreciated ? arrayRemove(userProfile.uid) : arrayUnion(userProfile.uid)
      });
      triggerToast(hasAppreciated ? "सहमति वापस ली गई" : "पोस्ट की सराहना की!");
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment on post
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !userProfile) return;

    const postRef = doc(db, 'posts', postId);
    const newComment: Comment = {
      id: Math.random().toString(36).substring(7),
      authorId: userProfile.uid,
      authorName: userProfile.name,
      authorPhotoURL: userProfile.photoURL,
      content: text,
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      triggerToast("टिप्पणी जोड़ी गई!");
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Chat Message
  const handleSendChatMessage = () => {
    if (!userProfile || !activeCommunity) return;
    if (!currentChatInput.trim() && !chatImageInput) return;

    const commId = activeCommunity.id;
    const newMessage = {
      id: Math.random().toString(36).substring(7),
      senderName: userProfile.name,
      role: userProfile.education || 'किसान मित्र (Farmer)',
      badges: userProfile.badges || [],
      photoURL: userProfile.photoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100',
      text: currentChatInput,
      imageUrl: chatImageInput || undefined,
      createdAt: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      isRealUser: true
    };

    const currentCommMessages = chatMessages[commId] || [];
    const updatedMessages = [...currentCommMessages, newMessage];

    const newChatState = {
      ...chatMessages,
      [commId]: updatedMessages
    };

    setChatMessages(newChatState);
    setCurrentChatInput('');
    setChatImageInput(null);
    localStorage.setItem('krishx_local_chats', JSON.stringify(newChatState));
  };

  // Filters search queries
  const filteredCommunities = STATIC_COMMUNITIES.filter(comm => {
    const s = searchQuery.toLowerCase();
    return comm.name.toLowerCase().includes(s) || 
           comm.category.toLowerCase().includes(s) || 
           comm.description.toLowerCase().includes(s);
  });

  const isJoined = activeCommunity ? joinedCommunities.includes(activeCommunity.id) : false;

  // Merge sample fallback posts with real Firestore posts
  const activeCommunityPosts = activeCommunity 
    ? [
        ...communityPosts,
        ...(SAMPLE_COMMUNITY_POSTS[activeCommunity.id] || []).filter(
          sp => !communityPosts.some(cp => cp.content === sp.content)
        )
      ]
    : [];

  return (
    <div className="relative min-h-[500px]">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastText && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-krishx-dark-900 text-white border border-krishx-dark-800 text-[11px] font-bold uppercase tracking-[0.2em] py-3.5 px-6 rounded-2xl z-50 shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-krishx-green-400 rounded-full animate-ping" />
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!activeCommunity ? (
          /* ========================================== */
          /* 1. COMMUNITIES LIST GRID VIEW               */
          /* ========================================== */
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Introductory Cards Heading */}
            <div className="flex items-center gap-3 bg-krishx-earth-50 border border-krishx-earth-200/50 p-5 rounded-[2rem]">
              <Sparkles className="w-5 h-5 text-krishx-green-600 animate-pulse shrink-0" strokeWidth={1.5} />
              <p className="text-[12px] font-bold text-krishx-dark-900/80 uppercase tracking-widest leading-relaxed">
                कृषि विशेषज्ञों और प्रगतिशील किसानों के समुदायों से जुड़ें। ज्ञान साझा करें और उपज बढ़ाएं।
              </p>
            </div>

            {/* Grid of beautiful communities cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map((comm, idx) => {
                const joined = joinedCommunities.includes(comm.id);
                return (
                  <motion.div
                    key={comm.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setActiveCommunity(comm);
                      setCommunityTab('feed');
                    }}
                    className="premium-card group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer p-0 overflow-hidden"
                  >
                    <div>
                      {/* Image Cover */}
                      <div className="h-44 relative overflow-hidden">
                        <img 
                          src={comm.coverImage} 
                          alt={comm.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-krishx-dark-950/90 via-krishx-dark-900/30 to-transparent" />
                        
                        {/* Emoji Avatar overlay */}
                        <div className="absolute bottom-5 left-5 flex items-center gap-3">
                          <span className="text-2xl bg-white p-2.5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-krishx-earth-200">{comm.icon}</span>
                          <span className="text-[10px] bg-krishx-green-600/95 text-white font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-xl backdrop-blur-sm">
                            {comm.category}
                          </span>
                        </div>
                      </div>

                      {/* Info and stats */}
                      <div className="p-6 space-y-3">
                        <h3 className="text-lg font-display font-bold text-krishx-dark-900 group-hover:text-krishx-green-700 transition-colors tracking-tight leading-snug">
                          {comm.name}
                        </h3>
                        <p className="text-[13px] text-krishx-dark-700/80 font-medium leading-relaxed line-clamp-2">
                          {comm.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions Area */}
                    <div className="p-6 pt-0 border-t border-krishx-earth-200/50 mt-auto flex items-center justify-between">
                      <div className="flex flex-col gap-1 mt-4">
                        <span className="text-[12px] font-bold text-krishx-dark-900">
                          {comm.memberCount.toLocaleString()} सदस्य
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-krishx-green-600 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-krishx-green-500 rounded-full animate-ping" />
                          {comm.activeToday} आज सक्रिय
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleToggleJoin(comm.id, comm.name, e)}
                        className={`mt-4 px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                          joined
                            ? 'bg-krishx-earth-100 text-krishx-dark-900 hover:bg-krishx-earth-200 border border-krishx-earth-200/50'
                            : 'bg-krishx-dark-900 text-white hover:bg-krishx-dark-800 shadow-md shadow-krishx-dark-900/10'
                        }`}
                      >
                        {joined ? (
                          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-krishx-green-600" /> Joined</span>
                        ) : (
                          'Join'
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredCommunities.length === 0 && (
              <div className="text-center py-24 premium-card shadow-sm">
                <p className="text-[12px] font-bold text-krishx-dark-700/60 uppercase tracking-[0.2em]">
                  No agricultural communities found.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          /* ========================================== */
          /* 2. SPECIFIC COMMUNITY DETAIL VIEW           */
          /* ========================================== */
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Back to communities link */}
            <button
              onClick={() => setActiveCommunity(null)}
              className="group flex items-center gap-2.5 text-krishx-dark-700/60 hover:text-krishx-dark-900 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to all Communities</span>
            </button>

            {/* Premium Header Banner Card */}
            <div className="bg-white border border-krishx-earth-200/50 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="h-56 relative">
                <img 
                  src={activeCommunity.coverImage} 
                  alt={activeCommunity.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-krishx-dark-950/95 via-krishx-dark-900/40 to-transparent" />
                
                {/* Overlay top back/info */}
                <div className="absolute top-5 right-5 flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-krishx-green-600/90 text-white border border-krishx-green-500 px-3.5 py-2 rounded-xl backdrop-blur-sm shadow-sm">
                    {activeCommunity.category}
                  </span>
                </div>

                {/* Cover Name & Stats */}
                <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl bg-white p-3 rounded-2xl shadow-lg border border-krishx-earth-100 text-krishx-dark-900">{activeCommunity.icon}</span>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{activeCommunity.name}</h2>
                        <div className="flex items-center gap-3 text-[13px] text-white/80 font-medium mt-1.5">
                          <span>{activeCommunity.memberCount.toLocaleString()} सदस्य</span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 text-krishx-green-400 font-bold uppercase tracking-wider text-[10px]">
                            <span className="w-1.5 h-1.5 bg-krishx-green-400 rounded-full animate-ping" />
                            {activeCommunity.activeToday} आज सक्रिय
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleJoin(activeCommunity.id, activeCommunity.name)}
                    className={`py-3.5 px-6 rounded-2xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                      isJoined
                        ? 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/25'
                        : 'bg-krishx-green-600 text-white hover:bg-krishx-green-500 shadow-xl shadow-krishx-green-600/20'
                    }`}
                  >
                    {isJoined ? (
                      <span className="flex items-center gap-2">🤝 JOINED • MEMBER</span>
                    ) : (
                      'JOIN COMMUNITY'
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-krishx-earth-50 border-t border-krishx-earth-200/50">
                <p className="text-[14px] text-krishx-dark-900/80 font-medium leading-relaxed">
                  {activeCommunity.description}
                </p>
              </div>
            </div>

            {/* Feed vs Group Chat Navigation Toggles */}
            <div className="flex p-1.5 bg-krishx-earth-50 rounded-[1.25rem] border border-krishx-earth-200/50 max-w-md">
              <button
                onClick={() => setCommunityTab('feed')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  communityTab === 'feed'
                    ? 'bg-white text-krishx-dark-900 shadow-md shadow-krishx-dark-900/5 border border-krishx-earth-200'
                    : 'text-krishx-dark-700/60 hover:text-krishx-dark-900 hover:bg-white/50'
                }`}
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                Feed & Discussions ({activeCommunityPosts.length})
              </button>
              <button
                onClick={() => setCommunityTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  communityTab === 'chat'
                    ? 'bg-white text-krishx-dark-900 shadow-md shadow-krishx-dark-900/5 border border-krishx-earth-200'
                    : 'text-krishx-dark-700/60 hover:text-krishx-dark-900 hover:bg-white/50'
                }`}
              >
                <Users className="w-4 h-4" strokeWidth={1.5} />
                Member Group Chat
                {isJoined && (
                  <span className="w-1.5 h-1.5 bg-krishx-green-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* Layout based on selected internal community tab */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left/Middle Column: Content */}
              <div className="lg:col-span-2 space-y-6">
                
                {communityTab === 'feed' ? (
                  <>
                    {/* Write Post (Available to everyone but suggests joining) */}
                    <div className="premium-card space-y-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 bg-krishx-green-50 text-krishx-green-700 rounded-xl"><Sprout className="w-4 h-4" strokeWidth={1.5} /></span>
                        <h4 className="text-[12px] font-bold uppercase tracking-widest text-krishx-dark-900">इस समुदाय में चर्चा शुरू करें</h4>
                      </div>

                      <div className="space-y-4">
                        <textarea
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="अपनी कृषि समस्या, सफलता की कहानी या ज्ञान यहाँ साझा करें..."
                          className="premium-input w-full min-h-[120px] p-5 text-[14px] resize-none"
                        />

                        {/* Presets and Upload tools */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-krishx-earth-200/50 mt-4 pt-4">
                          <div className="flex items-center gap-3">
                            {/* Category Selector */}
                            <select
                              value={postCategory}
                              onChange={(e: any) => setPostCategory(e.target.value)}
                              className="bg-krishx-earth-50 text-krishx-dark-900 text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-krishx-earth-200 focus:outline-none focus:ring-2 focus:ring-krishx-green-500/20"
                            >
                              <option value="Knowledge">Knowledge (ज्ञान)</option>
                              <option value="Success Story">Success Story (सफलता)</option>
                              <option value="Question">Question (प्रश्न)</option>
                              <option value="Experience">Experience (अनुभव)</option>
                              <option value="Research">Research (अनुसंधान)</option>
                            </select>

                            {/* Image selector button */}
                            <div className="relative">
                              <button
                                type="button"
                                className={`p-2.5 rounded-xl border transition-colors ${
                                  selectedPostImageUrl 
                                    ? 'bg-krishx-green-100 border-krishx-green-300 text-krishx-green-900' 
                                    : 'bg-krishx-earth-50 border-krishx-earth-200 text-krishx-dark-700 hover:bg-krishx-earth-100 hover:text-krishx-dark-900'
                                }`}
                                onClick={() => {
                                  // Toggle select first preset as a mock selection
                                  if (selectedPostImageUrl) {
                                    setSelectedPostImageUrl(null);
                                  } else {
                                    setSelectedPostImageUrl(PRESET_POST_IMAGES[0].url);
                                    triggerToast("Preset picture added!");
                                  }
                                }}
                              >
                                <Image className="w-4 h-4" strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={handleCreatePost}
                            disabled={posting || !newPostContent.trim()}
                            className="premium-btn text-[11px] px-6 py-3"
                          >
                            {posting ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Send className="w-4 h-4" strokeWidth={1.5} />
                                <span>POST NOW</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Presets Gallery Helper for Demo */}
                        {selectedPostImageUrl && (
                          <div className="p-4 bg-krishx-earth-50 border border-krishx-earth-200/50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <img src={selectedPostImageUrl} className="w-14 h-14 rounded-xl object-cover border border-krishx-earth-200" />
                              <div>
                                <p className="text-[11px] font-bold text-krishx-dark-900 uppercase tracking-widest">Attached Photo</p>
                                <p className="text-[10px] text-krishx-dark-700/80 font-medium">Ready to upload on post</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedPostImageUrl(null)} 
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-bold uppercase tracking-wider"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pinned Announcement Section */}
                    <div className="bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 border-l-4 border-l-amber-500 border border-krishx-earth-200/50 rounded-[2rem] p-6 shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-amber-800">
                          <span className="text-sm">📌</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pinned Guidelines & Resource (मुख्य दिशानिर्देश)</span>
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-200/50">Pinned</span>
                      </div>
                      
                      <h4 className="text-[14px] md:text-[15px] font-display font-black text-krishx-dark-900 leading-snug">
                        {activeCommunity.id === 'wheat' && 'गेहूं की वैज्ञानिक खेती और समय पर सिंचाई प्रबंधन निर्देशिका'}
                        {activeCommunity.id === 'dairy' && 'दुग्ध उत्पादन वृद्धि और स्वच्छ पशुपालन के वैज्ञानिक नियम'}
                        {activeCommunity.id === 'organic' && 'जीवामृत व प्राकृतिक खाद तैयार करने की प्रामाणिक कृषि विधि'}
                        {activeCommunity.id === 'vegetables' && 'सब्जी फसलों में ड्रिप सिंचाई और पॉलीहाउस कीट नियंत्रण विधियां'}
                        {activeCommunity.id === 'rice' && 'बासमती धान नर्सरी प्रबंधन व जल संरक्षण महत्वपूर्ण सूचना'}
                        {activeCommunity.id === 'sugarcane' && 'गन्ने की ट्रेंच विधि बुवाई और लाल सड़न रोग बचाव संदर्शिका'}
                      </h4>
                      
                      <p className="text-[14px] md:text-[15px] text-krishx-dark-700 leading-relaxed tracking-wide font-medium">
                        {activeCommunity.id === 'wheat' && 'सभी गेहूं उत्पादक ध्यान दें: बुवाई के 21-25 दिनों के भीतर पहली सिंचाई (CRI स्टेज) फसल के विकास के लिए अत्यंत महत्वपूर्ण है। यूरिया की पहली खुराक भी इसी समय दें ताकि कल्ले भरपूर निकलें।'}
                        {activeCommunity.id === 'dairy' && 'दुधारू पशुओं को संतुलित आहार में हरा चारा, सूखा चारा और पशु आहार का 1:1:1 अनुपात दें। कैल्शियम और मिनरल मिक्सचर प्रतिदिन 50 ग्राम देने से दूध उत्पादन और पशु स्वास्थ्य दोनों उत्तम रहता है।'}
                        {activeCommunity.id === 'organic' && 'जीवामृत निर्माण: 10 किलो गाय का ताजा गोबर, 10 लीटर गोमूत्र, 2 किलो पुराना गुड़, 2 किलो चने का बेसन और 1 मुट्ठी खेत की उपजाऊ मिट्टी को 200 लीटर पानी में मिलाकर छाया में रखें। दिन में दो बार हिलाएं, 7 दिन में तैयार।'}
                        {activeCommunity.id === 'vegetables' && 'सब्जी उत्पादकों के लिए सलाह: टमाटर, मिर्च और बैंगन की फसलों में रस चूसक कीटों से बचाव के लिए पीले चिपचिपे कार्ड (Yellow Sticky Traps) प्रति एकड़ 15-20 की संख्या में स्थापित करें।'}
                        {activeCommunity.id === 'rice' && 'धान उत्पादकों के लिए वैज्ञानिक निर्देश: खरपतवार नियंत्रण के लिए रोपाई के 3 दिनों के भीतर प्रीतिलाक्लोर (Pretilachlor) का सुरक्षित उपयोग करें। जल निकासी और नमी का संतुलन बनाए रखें।'}
                        {activeCommunity.id === 'sugarcane' && 'गन्ना किसानों के लिए संदेश: लाल सड़न (Red Rot) रोग रोधी किस्मों जैसे Co 15023 या Co 0118 का ही चुनाव करें। बुवाई से पूर्व बीज के टुकड़ों को ट्राइकोडर्मा घोल से अवश्य उपचारित करें।'}
                      </p>
                    </div>

                    {/* Discussions List Feed */}
                    <div className="space-y-6">
                      {activeCommunityPosts.map((post) => {
                        const liked = post.likes.includes(userProfile?.uid || '');
                        const commentsExpanded = showComments[post.id];
                        return (
                          <motion.div 
                            key={post.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="premium-card p-6 md:p-8 space-y-6 hover:border-krishx-earth-300 transition-all"
                          >
                            {/* Author Row */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={post.authorPhotoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100'} 
                                  alt={post.authorName} 
                                  className="w-12 h-12 rounded-full object-cover ring-4 ring-krishx-earth-50 shrink-0"
                                />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-krishx-dark-900">{post.authorName}</span>
                                    {post.authorBadges?.includes('expert') && (
                                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
                                        expert
                                      </span>
                                    )}
                                    {post.authorBadges?.includes('pioneer') && (
                                      <span className="bg-krishx-green-100 text-krishx-green-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
                                        pioneer
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-medium text-krishx-dark-700/80 font-mono mt-0.5">
                                    {post.authorKrishXId} • {post.authorRole} • {post.authorLocation}
                                  </p>
                                </div>
                              </div>
                              <span className="bg-krishx-earth-50 text-krishx-dark-900 text-[9px] font-bold px-3 py-1.5 rounded-xl border border-krishx-earth-200/50 uppercase tracking-[0.15em] hidden sm:block">
                                {post.category}
                              </span>
                            </div>

                            {/* Content text */}
                            <p className="text-[15px] md:text-[16px] text-krishx-dark-900/90 leading-relaxed tracking-wide font-medium whitespace-pre-wrap">
                              {post.content}
                            </p>

                            {/* Attached Image */}
                            {post.imageUrl && (
                              <div className="rounded-3xl overflow-hidden max-h-96 border border-krishx-earth-200/50 relative group shadow-sm">
                                <img src={post.imageUrl} alt="Community Attachment" className="w-full h-full object-cover" />
                              </div>
                            )}

                            {/* Actions Area */}
                            <div className="pt-5 border-t border-krishx-earth-200/50 flex items-center justify-between text-[12px] font-bold text-krishx-dark-700">
                              <div className="flex gap-2 sm:gap-4">
                                <button 
                                  onClick={() => handleAppreciatePost(post)}
                                  className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl hover:bg-krishx-earth-50 transition-colors ${
                                    liked ? 'text-krishx-green-700 bg-krishx-green-50' : ''
                                  }`}
                                >
                                  <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-krishx-green-700 text-krishx-green-700' : ''}`} strokeWidth={1.5} />
                                  <span className="hidden sm:inline">{post.likes.length} सहमति (Agree)</span>
                                  <span className="sm:hidden">{post.likes.length}</span>
                                </button>

                                <button 
                                  onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                  className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl hover:bg-krishx-earth-50 transition-colors ${
                                    commentsExpanded ? 'text-krishx-green-700 bg-krishx-green-50' : ''
                                  }`}
                                >
                                  <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                                  <span className="hidden sm:inline">{post.comments?.length || 0} चर्चा (Discuss)</span>
                                  <span className="sm:hidden">{post.comments?.length || 0}</span>
                                </button>
                              </div>

                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.href);
                                  triggerToast("चर्चा लिंक क्लिपबोर्ड पर कॉपी की गई!");
                                }}
                                className="flex items-center gap-1.5 hover:text-krishx-dark-900 py-2 px-3 sm:px-4 rounded-xl hover:bg-krishx-earth-50 transition-colors"
                              >
                                <Share2 className="w-4 h-4" strokeWidth={1.5} />
                                <span className="hidden md:inline">साझा करें (Share)</span>
                              </button>
                            </div>

                            {/* Expandable Comments Drawer */}
                            <AnimatePresence>
                              {commentsExpanded && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden space-y-4 pt-5 border-t border-krishx-earth-200/50 bg-krishx-earth-50/50 -mx-6 -mb-6 px-6 pb-6 rounded-b-[2rem] md:-mx-8 md:-mb-8 md:px-8 md:pb-8"
                                >
                                  {/* Comments list */}
                                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {post.comments && post.comments.length > 0 ? (
                                      post.comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 items-start bg-white p-4 rounded-2xl border border-krishx-earth-200/50 shadow-sm">
                                          <img 
                                            src={comment.authorPhotoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100'} 
                                            alt={comment.authorName} 
                                            className="w-8 h-8 rounded-full object-cover border border-krishx-earth-200" 
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-[12px] font-bold text-krishx-dark-900 truncate">{comment.authorName}</span>
                                              <span className="text-[10px] font-mono font-medium text-krishx-dark-700/60 shrink-0">
                                                {new Date(comment.createdAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                            <p className="text-[13px] text-krishx-dark-900/90 mt-1 font-medium leading-relaxed">
                                              {comment.content}
                                            </p>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-[11px] text-krishx-dark-700/50 font-bold uppercase tracking-widest text-center py-4">इस चर्चा पर अभी तक कोई टिप्पणी नहीं है।</p>
                                    )}
                                  </div>

                                  {/* Write comment input */}
                                  <div className="flex gap-3 relative pt-2 border-t border-krishx-earth-200/50">
                                    <input 
                                      type="text" 
                                      placeholder="अपनी सलाह या राय लिखें..."
                                      value={commentInputs[post.id] || ''}
                                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddComment(post.id);
                                      }}
                                      className="premium-input flex-1 px-5 py-3 text-[13px]"
                                    />
                                    <button 
                                      onClick={() => handleAddComment(post.id)}
                                      className="premium-btn p-3 px-4"
                                    >
                                      <Send className="w-4 h-4" strokeWidth={1.5} />
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* ========================================== */
                  /* GROUP CHAT EXPERIENCE                       */
                  /* ========================================== */
                  <div className="premium-card p-0 flex flex-col h-[600px] overflow-hidden">
                    {!isJoined ? (
                      /* LOCKED MODE */
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-5">
                        <div className="w-20 h-20 bg-krishx-earth-50 rounded-full flex items-center justify-center text-krishx-dark-900 border border-krishx-earth-200/50 shadow-inner">
                          <Lock className="w-8 h-8 animate-pulse" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-[16px] font-bold text-krishx-dark-900 uppercase tracking-widest">ग्रुप चैट लॉक है (Chat Locked)</h4>
                        <p className="text-[14px] text-krishx-dark-700/80 font-medium max-w-sm leading-relaxed">
                          लाइव सदस्य ग्रुप चैट में प्रवेश करने के लिए ऊपर दिए गए "JOIN COMMUNITY" बटन पर क्लिक करके पहले इस समुदाय में शामिल हों।
                        </p>
                        <button
                          onClick={() => handleToggleJoin(activeCommunity.id, activeCommunity.name)}
                          className="premium-btn px-8 py-3.5 mt-4"
                        >
                          Join Community Now
                        </button>
                      </div>
                    ) : (
                      /* ACTIVE CHAT WORKSPACE */
                      <>
                        {/* Chat Info Header */}
                        <div className="bg-krishx-earth-50/50 px-6 py-4 border-b border-krishx-earth-200/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 bg-krishx-green-500 rounded-full animate-ping" />
                            <span className="text-[11px] font-bold text-krishx-dark-900 uppercase tracking-[0.15em]">
                              लाइव कृषक संवाद • {activeCommunity.name.split(' (')[0]}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-krishx-dark-700/60 bg-white border border-krishx-earth-200/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            Secure C2C Chat
                          </span>
                        </div>

                        {/* Message Panel list */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white custom-scrollbar">
                          {(chatMessages[activeCommunity.id] || []).map((msg) => {
                            const isMe = msg.isRealUser;
                            return (
                              <div key={msg.id} className={`flex items-start gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                <img 
                                  src={msg.photoURL} 
                                  alt={msg.senderName} 
                                  className="w-10 h-10 rounded-full object-cover border border-krishx-earth-200/50 shadow-sm" 
                                />
                                <div className="space-y-1.5">
                                  {/* Sender name details */}
                                  <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : ''}`}>
                                    <span className="text-[11px] font-bold text-krishx-dark-900">{msg.senderName}</span>
                                    {msg.badges?.includes('expert') && (
                                      <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">expert</span>
                                    )}
                                  </div>
                                  
                                  {/* Message Bubble */}
                                  <div className={`p-4 rounded-[1.25rem] text-[13px] font-medium leading-relaxed shadow-sm border ${
                                    isMe 
                                      ? 'bg-krishx-dark-900 text-white border-krishx-dark-800 rounded-tr-sm' 
                                      : 'bg-krishx-earth-50 text-krishx-dark-900 border-krishx-earth-200/50 rounded-tl-sm'
                                  }`}>
                                    {msg.text}

                                    {/* Mock image inside message */}
                                    {msg.imageUrl && (
                                      <img src={msg.imageUrl} className="mt-3 rounded-xl max-h-48 object-cover border border-black/10" alt="Chat attachment" />
                                    )}
                                  </div>

                                  <p className={`text-[9px] font-mono text-krishx-dark-700/50 font-medium ${isMe ? 'text-right' : ''}`}>
                                    {msg.role} • {msg.createdAt}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Interactive Chat Input Area */}
                        <div className="p-5 bg-white border-t border-krishx-earth-200/50 space-y-4">
                          {/* Rich attachment status */}
                          {chatImageInput && (
                            <div className="p-3 bg-krishx-green-50 border border-krishx-green-100 rounded-xl flex items-center justify-between text-[12px]">
                              <span className="flex items-center gap-2 font-bold text-krishx-green-900">
                                <Image className="w-4 h-4 text-krishx-green-700" strokeWidth={1.5} /> Attached Crop Photo
                              </span>
                              <button onClick={() => setChatImageInput(null)} className="text-rose-600 hover:text-rose-700 text-[10px] font-bold uppercase tracking-wider transition-colors">Cancel</button>
                            </div>
                          )}

                          <div className="flex gap-3 items-center">
                            {/* Preset crop image option */}
                            <button
                              onClick={() => {
                                if (chatImageInput) {
                                  setChatImageInput(null);
                                } else {
                                  setChatImageInput('https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=300');
                                  triggerToast("Crop Photo attached to message!");
                                }
                              }}
                              className={`p-3 rounded-xl border transition-colors shrink-0 ${
                                chatImageInput ? 'bg-krishx-green-100 border-krishx-green-300 text-krishx-green-900' : 'bg-krishx-earth-50 border-krishx-earth-200 text-krishx-dark-700 hover:bg-krishx-earth-100 hover:text-krishx-dark-900'
                              }`}
                            >
                              <Image className="w-5 h-5" strokeWidth={1.5} />
                            </button>

                            {/* Preset mock PDF file option */}
                            <button
                              onClick={() => {
                                triggerToast("Report.pdf attached to message!");
                                setCurrentChatInput(prev => prev + " [संलग्न दस्तावेज़: Soil_Report.pdf] ");
                              }}
                              className="p-3 bg-krishx-earth-50 border border-krishx-earth-200 rounded-xl text-krishx-dark-700 hover:bg-krishx-earth-100 hover:text-krishx-dark-900 shrink-0 transition-colors"
                            >
                              <FileText className="w-5 h-5" strokeWidth={1.5} />
                            </button>

                            {/* Emojis Preset Quick Button */}
                            <button
                              onClick={() => {
                                setCurrentChatInput(prev => prev + " 🌾 ");
                              }}
                              className="p-3 bg-krishx-earth-50 border border-krishx-earth-200 rounded-xl text-krishx-dark-700 hover:bg-krishx-earth-100 hover:text-krishx-dark-900 shrink-0 transition-colors hidden sm:block"
                            >
                              <Smile className="w-5 h-5" strokeWidth={1.5} />
                            </button>

                            <input 
                              type="text" 
                              placeholder="समुदाय चैट में संदेश भेजें..."
                              value={currentChatInput}
                              onChange={(e) => setCurrentChatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendChatMessage();
                              }}
                              className="premium-input flex-1 px-4 py-3 text-[14px]"
                            />
                            
                            <button 
                              onClick={handleSendChatMessage}
                              className="premium-btn p-3 px-4 shrink-0"
                            >
                              <Send className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Community Summary & Member Guidelines */}
              <div className="space-y-6">
                
                {/* AI Community Summary Widget */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-white to-krishx-green-50/30 border border-krishx-earth-200/50 rounded-[2rem] p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-2 text-krishx-dark-900">
                    <Sparkles className="w-4 h-4 text-krishx-green-700" strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-krishx-dark-700">AI कम्युनिटी समरी (AI Insight)</span>
                  </div>
                  <h4 className="text-[14px] font-display font-bold text-krishx-dark-900">
                    {activeCommunity.name.split(' (')[0]} के मुख्य मुद्दे
                  </h4>
                  <p className="text-[13px] leading-relaxed text-krishx-dark-700/90 font-medium">
                    इस समुदाय में वर्तमान में उत्पादकता बढ़ाने, रोग प्रबंधन और उत्तम किस्म के बीजों की बुवाई पर चर्चा चल रही है। विशेषज्ञों द्वारा रासायनिक कीटनाशकों के जैविक विकल्पों पर बल दिया जा रहा है।
                  </p>
                  <div className="text-[9px] font-bold text-krishx-green-700 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-krishx-earth-200/50 mt-2">
                    <span className="w-1.5 h-1.5 bg-krishx-green-500 rounded-full animate-ping" />
                    एआई स्वचालित साप्ताहिक विश्लेषण
                  </div>
                </motion.div>

                {/* Professional Guidelines */}
                <div className="premium-card space-y-5">
                  <h4 className="text-[11px] font-bold text-krishx-dark-900 uppercase tracking-[0.2em] border-b border-krishx-earth-200/50 pb-3">समुदाय के नियम (Rules)</h4>
                  <ul className="space-y-4 text-[13px] text-krishx-dark-700/80 font-medium leading-relaxed">
                    <li className="flex gap-3 items-start">
                      <span className="text-krishx-green-700 font-black">1.</span>
                      <span>केवल कृषि-संबंधित पेशेवर प्रश्न या जानकारियां ही पोस्ट करें।</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-krishx-green-700 font-black">2.</span>
                      <span>मनोरंजन, मीम्स या अप्रासंगिक तस्वीरें पोस्ट करने से बचें।</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-krishx-green-700 font-black">3.</span>
                      <span>सभी साथी किसानों और कृषि वैज्ञानिकों का सम्मान करें।</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Communities;
