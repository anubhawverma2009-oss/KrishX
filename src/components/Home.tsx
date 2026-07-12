/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  deleteDoc
} from '../lib/firebase';
import { Post, Comment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Bell, 
  Sparkles, 
  X, 
  Plus, 
  Image as ImageIcon, 
  BarChart3, 
  Clock, 
  MapPin, 
  Check, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  UserCheck,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';

interface HomeProps {
  setActiveTab?: (tab: string) => void;
  onViewProfile?: (uid: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setActiveTab, onViewProfile }) => {
  const { userProfile, language } = useAuth();
  
  // Feed & connection states
  const [posts, setPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<{ id: string; fromId: string; toId: string }[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Compose Post states
  const [isExpanded, setIsExpanded] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<Post['category']>('Experience');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Poll state inside composer
  const [isPollActive, setIsPollActive] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Comments interaction
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Permissions state
  const [hasGalleryPermission, setHasGalleryPermission] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Full-screen image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Post Management (Edit & Delete)
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Real-time posts subscription
  useEffect(() => {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const loadedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(loadedPosts);
    }, (error) => {
      console.error("Firestore Error reading posts: ", error);
    });

    return unsubscribe;
  }, []);

  // Real-time connections subscription
  useEffect(() => {
    if (!userProfile) return;
    const connectionsQuery = query(collection(db, 'connections'));
    const unsubscribe = onSnapshot(connectionsQuery, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as { id: string; fromId: string; toId: string }[];
      setConnections(loaded);
    }, (error) => {
      console.error("Error reading connections: ", error);
    });
    return unsubscribe;
  }, [userProfile]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelectClick = () => {
    if (!hasGalleryPermission) {
      setShowPermissionModal(true);
    } else {
      imageInputRef.current?.click();
    }
  };

  const handleGrantPermission = () => {
    setHasGalleryPermission(true);
    setShowPermissionModal(false);
    triggerToast("Gallery permission granted successfully!");
    setTimeout(() => {
      imageInputRef.current?.click();
    }, 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadProgress(20);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null) return null;
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 80);

      try {
        const base64Promises = Array.from(files).map(file => readFileAsDataURL(file as File));
        const base64s = await Promise.all(base64Promises);
        setSelectedImages(prev => [...prev, ...base64s]);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 400);
        triggerToast("Photos attached successfully!");
      } catch (err) {
        console.error(err);
        clearInterval(interval);
        setUploadProgress(null);
        triggerToast("Failed to read image file.");
      }
    }
  };

  const handleCreatePost = async () => {
    if (!userProfile) return;
    if (!newPostContent.trim() && selectedImages.length === 0 && (!isPollActive || !pollQuestion.trim())) {
      return;
    }

    setPosting(true);
    try {
      const hasValidPoll = isPollActive && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2;
      const pollData = hasValidPoll ? {
        question: pollQuestion.trim(),
        options: pollOptions.filter(o => o.trim()).map(opt => ({ text: opt.trim(), votes: [] }))
      } : undefined;

      const postData: any = {
        authorId: userProfile.uid,
        authorName: userProfile.name,
        authorPhotoURL: userProfile.photoURL,
        authorKrishXId: userProfile.krishXId,
        authorBadges: userProfile.badges || [],
        authorRole: userProfile.education || 'Agriculture Specialist',
        authorLocation: userProfile.location || 'India',
        content: newPostContent,
        category: postCategory,
        topic: 'General',
        imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
        imageUrl: selectedImages[0] || undefined,
        likes: [],
        comments: [],
        poll: pollData,
        createdAt: new Date().toISOString()
      };

      // Remove undefined properties to prevent Firestore unsupported field value errors
      Object.keys(postData).forEach(key => {
        if (postData[key] === undefined) {
          delete postData[key];
        }
      });

      await addDoc(collection(db, 'posts'), postData);
      
      setNewPostContent('');
      setSelectedImages([]);
      setPostCategory('Experience');
      setIsPollActive(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setIsExpanded(false);
      triggerToast("Post shared with your agriculture network!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to share post.");
    } finally {
      setPosting(false);
    }
  };

  const handleVotePoll = async (postId: string, optionIdx: number) => {
    if (!userProfile) return;
    const post = posts.find(p => p.id === postId);
    if (!post || !post.poll) return;

    const alreadyVoted = post.poll.options.some((opt: any) => opt.votes?.includes(userProfile.uid));
    if (alreadyVoted) {
      triggerToast("You have already voted in this poll!");
      return;
    }

    const updatedOptions = post.poll.options.map((opt: any, idx: number) => {
      if (idx === optionIdx) {
        return { ...opt, votes: [...(opt.votes || []), userProfile.uid] };
      }
      return opt;
    });

    const postRef = doc(db, 'posts', postId);
    try {
      await updateDoc(postRef, {
        poll: {
          ...post.poll,
          options: updatedOptions
        }
      });
      triggerToast("Your vote has been recorded!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to record your vote.");
    }
  };

  const handleAppreciatePost = async (post: Post) => {
    if (!userProfile) return;
    const postRef = doc(db, 'posts', post.id);
    const hasAppreciated = post.likes.includes(userProfile.uid);

    try {
      await updateDoc(postRef, {
        likes: hasAppreciated ? arrayRemove(userProfile.uid) : arrayUnion(userProfile.uid)
      });
      if (!hasAppreciated) {
        triggerToast("Post appreciated!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText || !userProfile) return;

    const postRef = doc(db, 'posts', postId);
    const newComment: Comment = {
      id: Math.random().toString(36).substring(7),
      authorId: userProfile.uid,
      authorName: userProfile.name,
      authorPhotoURL: userProfile.photoURL,
      content: commentText,
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      triggerToast("Comment added!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleGrowTogether = async (authorId: string) => {
    if (!userProfile) return;
    try {
      const existingConn = connections.find(
        c => (c.fromId === userProfile.uid && c.toId === authorId) || (c.fromId === authorId && c.toId === userProfile.uid)
      );
      if (existingConn) {
        if (existingConn.status === 'pending') {
          triggerToast("Connection request is already pending!");
        } else {
          triggerToast("You are already connected!");
        }
        return;
      }
      await addDoc(collection(db, 'connections'), {
        fromId: userProfile.uid,
        toId: authorId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      triggerToast("Connection request sent!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to connect.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      triggerToast("Post deleted successfully!");
      setDeletingPostId(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      triggerToast("Failed to delete post.");
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    setIsEditingSaving(true);
    try {
      const postRef = doc(db, 'posts', editingPost.id);
      await updateDoc(postRef, {
        content: editedContent
      });
      triggerToast("Post updated successfully!");
      setEditingPost(null);
      setEditedContent('');
    } catch (err) {
      console.error("Error updating post:", err);
      triggerToast("Failed to update post.");
    } finally {
      setIsEditingSaving(false);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
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

  const handleProfileNavigation = (authorId: string) => {
    if (onViewProfile) {
      onViewProfile(authorId);
    } else if (setActiveTab) {
      setActiveTab('profile');
    } else {
      triggerToast("Redirecting to profile...");
    }
  };

  const categoriesList: { value: Post['category']; label: string; icon: string }[] = [
    { value: 'Experience', label: 'Experience', icon: '🌱' },
    { value: 'Success Story', label: 'Success Story', icon: '🏆' },
    { value: 'Research', label: 'Research', icon: '🔬' },
    { value: 'Question', label: 'Ask Question', icon: '❓' },
    { value: 'Knowledge', label: 'Knowledge', icon: '📚' },
    { value: 'Learning', label: 'Learning', icon: '💡' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 select-none">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-krishx-dark-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-krishx-green-500/20 flex items-center gap-3 text-xs font-semibold tracking-wide"
          >
            <div className="w-5 h-5 bg-krishx-green-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-krishx-dark-900 stroke-[3]" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header: Keep it clean and minimal. Greeting, Small AI Brief (optional), Notification icon. Nothing else. */}
      <div className="relative flex items-center justify-between py-6 border-b border-krishx-earth-200/50 mb-6 z-10">
        {/* Soft background depth behind greeting */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[150px] bg-krishx-green-100/30 blur-[60px] -z-10 pointer-events-none rounded-full" />
        
        <div className="space-y-1">
          <h2 className="text-xl md:text-3xl font-display font-bold text-krishx-dark-900 tracking-tight">
            {getGreeting()}, <span className="text-krishx-green-700">{userProfile?.name?.split(' ')[0]}</span>
          </h2>
          {/* Small AI Brief (optional) */}
          <div className="flex items-center gap-2 text-[12px] font-medium text-krishx-dark-700/80 bg-white/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white shadow-sm w-fit mt-2">
            <Sparkles className="w-4 h-4 text-krishx-green-500" />
            <span>Optimal sowing window open for local crops. Clear skies ahead.</span>
          </div>
        </div>
        
        {/* Notification Icon */}
        <button 
          onClick={() => triggerToast("You are fully up to date! No new notifications.")}
          className="relative p-3 bg-white/80 backdrop-blur-sm hover:bg-white border border-krishx-earth-200/50 rounded-2xl transition-all shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] group hover:-translate-y-0.5"
        >
          <Bell className="w-5 h-5 text-krishx-dark-700/60 group-hover:text-krishx-dark-900 transition-colors" strokeWidth={1.5} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-krishx-green-500 rounded-full border-2 border-white" />
        </button>
      </div>

      {/* SECTION 1: CREATE POST */}
      <div className="premium-card p-6">
        <div className="flex items-start gap-4">
          <img 
            src={userProfile?.photoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100'} 
            alt={userProfile?.name} 
            onClick={() => handleProfileNavigation(userProfile?.uid || '')}
            className="w-12 h-12 rounded-2xl object-cover shrink-0 ring-2 ring-krishx-earth-50 cursor-pointer hover:opacity-90 transition-opacity"
          />
          <div className="flex-1 space-y-4">
            <textarea 
              value={newPostContent}
              onChange={(e) => {
                setNewPostContent(e.target.value);
                if (!isExpanded) setIsExpanded(true);
              }}
              onClick={() => setIsExpanded(true)}
              placeholder="Share your farming knowledge with the community..."
              className="w-full bg-krishx-earth-50 rounded-2xl border border-krishx-earth-200/50 resize-none text-krishx-dark-900 placeholder:text-krishx-dark-700/40 text-[15px] font-medium focus:outline-none focus:border-krishx-green-400 focus:ring-1 focus:ring-krishx-green-400/20 px-4 py-3 min-h-[52px] transition-all duration-300"
              style={{ height: isExpanded ? '110px' : '52px' }}
            />
            
            {/* Smooth expansion block */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-3 border-t border-krishx-earth-50/50 overflow-hidden"
                >
                  {/* Category selector */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-krishx-dark-800/30">Select Category</p>
                    <div className="flex flex-wrap gap-1.5">
                      {categoriesList.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setPostCategory(cat.value)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            postCategory === cat.value 
                              ? 'bg-krishx-dark-900 text-white shadow-sm' 
                              : 'bg-krishx-earth-50 text-krishx-dark-800/70 hover:bg-krishx-earth-200/70'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Poll Builder */}
                  {isPollActive && (
                    <div className="bg-krishx-earth-50/40 border border-krishx-earth-200/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-krishx-dark-800/40">Create a Poll</span>
                        <button 
                          onClick={() => setIsPollActive(false)}
                          className="p-1 hover:bg-krishx-earth-200/50 rounded-lg text-krishx-dark-900/40"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder="What is your farming question?"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        className="w-full bg-white border border-krishx-earth-200/50 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-krishx-green-700 text-krishx-dark-900 placeholder:text-krishx-dark-800/30"
                      />
                      <div className="space-y-2">
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-krishx-dark-800/40">{idx + 1}</span>
                            <input 
                              type="text"
                              placeholder={`Option ${idx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const copy = [...pollOptions];
                                copy[idx] = e.target.value;
                                setPollOptions(copy);
                              }}
                              className="flex-1 bg-white border border-krishx-earth-200/50 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-krishx-green-700 text-krishx-dark-900 placeholder:text-krishx-dark-800/30"
                            />
                            {pollOptions.length > 2 && (
                              <button 
                                onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {pollOptions.length < 4 && (
                          <button 
                            type="button"
                            onClick={() => setPollOptions(prev => [...prev, ''])}
                            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-krishx-green-700 hover:text-krishx-dark-900 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Add Poll Option
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attached Image Previews */}
                  {selectedImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-krishx-dark-800/30">Attached Photos</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedImages.map((src, idx) => (
                          <div key={idx} className="relative group">
                            <img src={src} className="w-16 h-16 rounded-xl object-cover border border-krishx-earth-200" />
                            <button 
                              onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress Indicator */}
                  {uploadProgress !== null && (
                    <div className="w-full bg-krishx-earth-200 h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-krishx-green-600" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Controls / Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-krishx-earth-50/50">
              {/* Show Icons Only */}
              <div className="flex items-center gap-1.5">
                <button 
                  type="button"
                  onClick={handleImageSelectClick}
                  title="Photo Upload"
                  className="p-2.5 hover:bg-krishx-earth-50 text-krishx-green-700 rounded-xl transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsPollActive(prev => !prev)}
                  title="Create Poll"
                  className={`p-2.5 hover:bg-krishx-earth-50 rounded-xl transition-all ${
                    isPollActive ? 'text-krishx-green-700 bg-krishx-earth-50' : 'text-krishx-dark-800/40'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isExpanded && (
                  <button 
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setNewPostContent('');
                      setSelectedImages([]);
                      setIsPollActive(false);
                    }}
                    className="px-4 py-2.5 text-[12px] font-semibold text-krishx-dark-700/60 hover:text-krishx-dark-900 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  disabled={posting || (!newPostContent.trim() && selectedImages.length === 0 && (!isPollActive || !pollQuestion.trim()))}
                  onClick={handleCreatePost}
                  className="premium-btn text-[13px] disabled:opacity-50 flex items-center gap-2"
                >
                  {posting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Post Now'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Photo Picker Input */}
        <input 
          type="file"
          ref={imageInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>

      {/* SECTION 2: PROFESSIONAL FEED */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-24 premium-card">
            <div className="w-16 h-16 bg-krishx-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-krishx-green-100">
              <Sparkles className="w-8 h-8 text-krishx-green-500" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] font-semibold text-krishx-dark-700/60 uppercase tracking-widest">
              Feeding empty. Share your first farming update!
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const hasAppreciated = userProfile && post.likes?.includes(userProfile.uid);
            const isAuthorMe = userProfile && post.authorId === userProfile.uid;
            
            // Connection state
            const conn = connections.find(
              c => (c.fromId === userProfile?.uid && c.toId === post.authorId) || 
                   (c.fromId === post.authorId && c.toId === userProfile?.uid)
            );
            const connStatus = !conn 
              ? 'not_connected' 
              : conn.status === 'pending' 
                ? 'pending' 
                : 'connected';

            return (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card overflow-hidden"
              >
                <div className="p-6">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={post.authorPhotoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100'} 
                        alt={post.authorName} 
                        onClick={() => handleProfileNavigation(post.authorId)}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-krishx-earth-50 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            onClick={() => handleProfileNavigation(post.authorId)}
                            className="text-sm font-black text-krishx-dark-900 tracking-tight cursor-pointer hover:text-krishx-green-700 transition-colors"
                          >
                            {post.authorName}
                          </span>
                          
                          {/* Category Tag */}
                          <span className="bg-krishx-earth-50 text-krishx-green-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                            {post.category}
                          </span>
                        </div>
                        
                        {/* Subheader: Role, Location, Time */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold text-krishx-dark-800/40 uppercase tracking-tight mt-0.5">
                          <span>{post.authorRole}</span>
                          <div className="w-1 h-1 rounded-full bg-krishx-earth-300" />
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {post.authorLocation}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-krishx-earth-300" />
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAuthorMe ? (
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePostMenuId(activePostMenuId === post.id ? null : post.id);
                          }}
                          className="p-1.5 hover:bg-krishx-earth-50 text-krishx-dark-900 rounded-xl transition-all active:scale-95"
                          title="Post Actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {activePostMenuId === post.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePostMenuId(null);
                                }}
                              />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-0 mt-1 w-36 bg-white border border-krishx-earth-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1"
                              >
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePostMenuId(null);
                                    setEditingPost(post);
                                    setEditedContent(post.content);
                                  }}
                                  className="w-full px-4 py-2 text-left text-xs font-black uppercase tracking-wider text-krishx-dark-900 hover:bg-krishx-earth-50 flex items-center gap-2 transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5 text-krishx-green-600" />
                                  <span>Edit Post</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePostMenuId(null);
                                    setDeletingPostId(post.id);
                                  }}
                                  className="w-full px-4 py-2 text-left text-xs font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-krishx-earth-50/50"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete Post</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      /* Connect Button */
                      <button 
                        onClick={() => handleGrowTogether(post.authorId)}
                        disabled={connStatus !== 'not_connected'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                          connStatus === 'connected' 
                            ? 'bg-krishx-earth-50 text-krishx-dark-800/40 border-krishx-earth-200/30' 
                            : connStatus === 'pending'
                            ? 'bg-amber-50 text-amber-900/50 border-amber-100/30'
                            : 'bg-white hover:bg-krishx-earth-50 text-krishx-dark-900 border-krishx-earth-200/50 shadow-sm active:scale-95'
                        }`}
                      >
                        {connStatus === 'connected' ? (
                          <>
                            <Check className="w-3 h-3 text-krishx-green-600" />
                            <span>Connected</span>
                          </>
                        ) : connStatus === 'pending' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>Pending</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 text-krishx-green-600" />
                            <span>🤝 Connect</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="text-sm text-krishx-dark-900 leading-relaxed font-medium mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Interactive Poll Panel */}
                  {post.poll && (
                    <div className="bg-krishx-earth-50/25 border border-krishx-earth-200/20 rounded-2xl p-4 mb-4 space-y-3">
                      <h4 className="text-xs font-black text-krishx-dark-900 uppercase tracking-tight">
                        📊 {post.poll.question}
                      </h4>
                      
                      <div className="space-y-2">
                        {(() => {
                          const totalVotes = post.poll.options.reduce((acc: number, opt: any) => acc + (opt.votes?.length || 0), 0);
                          const userVotedOptIdx = post.poll.options.findIndex((opt: any) => opt.votes?.includes(userProfile?.uid));
                          const hasVoted = userVotedOptIdx !== -1;

                          return post.poll.options.map((opt: any, idx: number) => {
                            const optionVotes = opt.votes?.length || 0;
                            const pct = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                            const isMyVote = userVotedOptIdx === idx;

                            return (
                              <button 
                                key={idx}
                                onClick={() => handleVotePoll(post.id, idx)}
                                disabled={hasVoted}
                                className="w-full relative overflow-hidden rounded-xl border border-krishx-earth-200/50 py-3.5 px-4 text-left font-bold text-xs flex justify-between items-center transition-all hover:bg-krishx-earth-50/50"
                              >
                                {/* Percentage fill bar */}
                                <div 
                                  className="absolute top-0 left-0 bottom-0 bg-krishx-earth-200/40 transition-all duration-500" 
                                  style={{ width: `${pct}%` }}
                                />
                                
                                <span className="relative z-10 text-krishx-dark-900 flex items-center gap-2">
                                  {isMyVote && <Check className="w-3.5 h-3.5 text-krishx-green-700" />}
                                  {opt.text}
                                </span>
                                
                                <span className="relative z-10 text-krishx-green-700 font-mono">
                                  {pct}% ({optionVotes})
                                </span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Post Images Gallery */}
                  {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className={`grid gap-2 mb-4 ${
                      post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    }`}>
                      {post.imageUrls.map((url: string, idx: number) => (
                        <img 
                          key={idx}
                          src={url} 
                          alt="Feed visual" 
                          onClick={() => setPreviewImage(url)}
                          className={`w-full object-cover rounded-2xl border border-krishx-earth-50/50 shadow-sm transition-transform hover:scale-[1.01] cursor-pointer ${
                            post.imageUrls!.length === 1 ? 'h-auto max-h-[450px]' : 'h-40'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Saved indicators / Action buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-krishx-earth-50/50">
                    <div className="flex items-center gap-2">
                      {/* Appreciate instead of Like */}
                      <button 
                        onClick={() => handleAppreciatePost(post)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
                          hasAppreciated 
                            ? 'bg-rose-50 text-rose-600' 
                            : 'text-krishx-dark-800/40 hover:bg-krishx-earth-50 hover:text-krishx-dark-900'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasAppreciated ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{post.likes?.length ? `${post.likes.length} Appreciate` : 'Appreciate'}</span>
                      </button>

                      {/* Comment */}
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
                          expandedComments[post.id]
                            ? 'bg-krishx-earth-50 text-krishx-green-700'
                            : 'text-krishx-dark-800/40 hover:bg-krishx-earth-50 hover:text-krishx-dark-900'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments?.length ? `${post.comments.length} Comment` : 'Comment'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Save */}
                      <button 
                        onClick={() => toggleSavePost(post.id)}
                        className={`p-2 rounded-xl transition-all ${
                          (userProfile?.savedPosts || []).includes(post.id) 
                            ? 'text-krishx-green-700 bg-krishx-earth-50' 
                            : 'text-krishx-dark-800/40 hover:bg-krishx-earth-50 hover:text-krishx-dark-900'
                        }`}
                        title="Save Post"
                      >
                        <Bookmark className={`w-4 h-4 ${(userProfile?.savedPosts || []).includes(post.id) ? 'fill-krishx-green-700' : ''}`} />
                      </button>

                      {/* Share */}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          triggerToast("Shareable link copied to clipboard!");
                        }}
                        className="p-2 rounded-xl text-krishx-dark-800/40 hover:bg-krishx-earth-50 hover:text-krishx-dark-900 transition-all"
                        title="Share Link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comments Overlay Panel */}
                  <AnimatePresence>
                    {expandedComments[post.id] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4 pt-4 border-t border-krishx-earth-50/50 space-y-4"
                      >
                        {post.comments && post.comments.length > 0 && (
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3 bg-krishx-earth-50/20 p-3 rounded-2xl border border-krishx-earth-200/30">
                                <img 
                                  src={comment.authorPhotoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100'} 
                                  alt={comment.authorName} 
                                  onClick={() => handleProfileNavigation(comment.authorId)}
                                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-krishx-earth-50 cursor-pointer hover:opacity-90 transition-opacity"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span 
                                      onClick={() => handleProfileNavigation(comment.authorId)}
                                      className="text-xs font-black text-krishx-dark-900 cursor-pointer hover:text-krishx-green-700"
                                    >
                                      {comment.authorName}
                                    </span>
                                    <span className="text-[9px] font-bold text-krishx-dark-800/30 uppercase">
                                      {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-krishx-dark-900/80 mt-1">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment input form */}
                        <div className="flex gap-2 pt-2">
                          <input 
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            placeholder="Write a professional comment..."
                            className="flex-1 bg-krishx-earth-50/40 border border-krishx-earth-200/50 rounded-xl px-4 py-2.5 text-xs font-medium placeholder:text-krishx-dark-900/30 focus:outline-none focus:border-krishx-dark-800 focus:bg-white transition-all text-krishx-dark-900"
                          />
                          <button 
                            onClick={() => handleAddComment(post.id)}
                            className="px-4 py-2.5 bg-krishx-dark-900 hover:bg-krishx-dark-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors shrink-0"
                          >
                            Send
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modern Simulated Gallery Access Dialog */}
      <AnimatePresence>
        {showPermissionModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-krishx-dark-900/60 backdrop-blur-sm z-[110]"
              onClick={() => setShowPermissionModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2rem] border border-krishx-earth-200 p-6 shadow-2xl z-[120]"
            >
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-krishx-earth-50 rounded-full flex items-center justify-center mx-auto text-krishx-green-700">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-krishx-dark-900">
                  Allow Gallery Permission?
                </h3>
                <p className="text-xs text-krishx-dark-800/60 leading-relaxed font-semibold">
                  KrishX needs access to your gallery/device storage so you can easily attach field photographs and research diagrams to your posts.
                </p>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setShowPermissionModal(false)}
                    className="flex-1 py-3 bg-krishx-earth-50 text-krishx-dark-800 hover:bg-krishx-earth-200/50 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Deny
                  </button>
                  <button 
                    onClick={handleGrantPermission}
                    className="flex-1 py-3 bg-krishx-dark-900 text-white hover:bg-krishx-dark-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Premium Full-Screen Image Viewer Overlay */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[130] flex items-center justify-center p-4 md:p-10"
            onClick={() => setPreviewImage(null)}
          >
            <button 
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-xl md:rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingPostId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-krishx-dark-900/60 backdrop-blur-sm z-[110]"
              onClick={() => setDeletingPostId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2rem] border border-krishx-earth-200 p-6 shadow-2xl z-[120]"
            >
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-krishx-dark-900 uppercase tracking-tight">
                  Delete Post?
                </h3>
                <p className="text-xs text-krishx-dark-800/60 leading-relaxed font-semibold">
                  Are you sure you want to permanently delete this post? This action cannot be undone and will remove it from the professional feed.
                </p>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setDeletingPostId(null)}
                    className="flex-1 py-3 bg-krishx-earth-50 text-krishx-dark-800 hover:bg-krishx-earth-200/50 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDeletePost(deletingPostId)}
                    className="flex-1 py-3 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-rose-600/20"
                  >
                    Delete Now
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Post Modal */}
      <AnimatePresence>
        {editingPost && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-krishx-dark-900/60 backdrop-blur-sm z-[110]"
              onClick={() => {
                setEditingPost(null);
                setEditedContent('');
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2rem] border border-krishx-earth-200 p-6 shadow-2xl z-[120]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-krishx-earth-200/30 pb-3">
                  <h3 className="text-sm font-black text-krishx-dark-900 uppercase tracking-widest">
                    Edit Professional Post
                  </h3>
                  <button 
                    onClick={() => {
                      setEditingPost(null);
                      setEditedContent('');
                    }}
                    className="p-1 hover:bg-krishx-earth-50 rounded-lg text-krishx-dark-800/40 hover:text-krishx-dark-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea 
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-krishx-earth-50/20 border border-krishx-earth-200/50 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-krishx-dark-800 focus:bg-white text-krishx-dark-900 min-h-[150px] resize-none"
                    placeholder="What would you like to update?"
                  />
                </div>

                {/* Preserve Images Display */}
                {editingPost.imageUrls && editingPost.imageUrls.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-krishx-dark-800/40">Preserved Photos ({editingPost.imageUrls.length})</p>
                    <div className="flex gap-2">
                      {editingPost.imageUrls.map((url, idx) => (
                        <img 
                          key={idx} 
                          src={url} 
                          className="w-12 h-12 rounded-xl object-cover border border-krishx-earth-200 opacity-80" 
                        />
                      ))}
                    </div>
                  </div>
                )}
                {editingPost.imageUrl && !editingPost.imageUrls && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-krishx-dark-800/40">Preserved Photo</p>
                    <div className="flex gap-2">
                      <img 
                        src={editingPost.imageUrl} 
                        className="w-12 h-12 rounded-xl object-cover border border-krishx-earth-200 opacity-80" 
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setEditingPost(null);
                      setEditedContent('');
                    }}
                    className="flex-1 py-3 bg-krishx-earth-50 text-krishx-dark-800 hover:bg-krishx-earth-200/50 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdatePost}
                    disabled={isEditingSaving || !editedContent.trim()}
                    className="flex-1 py-3 bg-krishx-dark-900 text-white hover:bg-krishx-dark-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {isEditingSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Home;
