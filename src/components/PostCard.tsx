/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Check, 
  Clock, 
  UserPlus, 
  MapPin, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Volume2, 
  VolumeX, 
  Languages, 
  Loader2 
} from 'lucide-react';
import { Post, UserProfile, Comment } from '../types';
import { db, doc, updateDoc, arrayUnion, arrayRemove } from '../lib/firebase';
import { safeString, safeDateString } from '../lib/utils';
import { voiceService } from '../lib/voiceAssistant';
import { detectPostLanguage, translateContent, getPostAuthorAttribution } from '../lib/translationService';

interface PostCardProps {
  post: Post;
  userProfile: UserProfile | null;
  connections: any[];
  savedPosts: string[];
  onToggleSave: (postId: string) => void;
  onProfileClick: (authorId: string) => void;
  onGrowTogether: (authorId: string) => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  onPreviewImage: (url: string) => void;
  triggerToast: (msg: string) => void;
}

export const PostCard: React.FC<PostCardProps> = React.memo(({
  post,
  userProfile,
  connections,
  savedPosts,
  onToggleSave,
  onProfileClick,
  onGrowTogether,
  onEdit,
  onDelete,
  onPreviewImage,
  triggerToast
}) => {
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  // Translation State
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Global Speech State Subscription
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Detect whether original text is primarily Hindi or English
  const originalLang = detectPostLanguage(post.content);
  const isOriginalHindi = originalLang === 'hi';

  // Listen to global voice service to keep speech states strictly exclusive across all posts
  useEffect(() => {
    const unsubscribe = voiceService.subscribe((activeId) => {
      setIsSpeaking(activeId === post.id);
    });
    return () => unsubscribe();
  }, [post.id]);

  // Handle Listen / Read Aloud Action
  const handleListen = () => {
    if (!voiceService.isSupported()) {
      triggerToast("Speech synthesis is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      voiceService.stop();
      return;
    }

    // Determine target text and appropriate language code
    let textToRead: string;
    let speechLang: 'hi' | 'en';

    if (showTranslation && translatedText) {
      textToRead = translatedText;
      // If original was Hindi and translated to English -> read in Indian English (en-IN)
      // If original was English and translated to Hindi -> read in Hindi (hi-IN)
      speechLang = isOriginalHindi ? 'en' : 'hi';
    } else {
      textToRead = post.content;
      speechLang = isOriginalHindi ? 'hi' : 'en';
    }

    // Add author attribution at the very end of voice output (after complete post is read)
    let spokenText = textToRead;
    const attribution = getPostAuthorAttribution(post.authorName, speechLang, textToRead);
    if (attribution) {
      const trimmed = spokenText.trim();
      const lastChar = trimmed.slice(-1);
      const separator = (lastChar === '.' || lastChar === '।' || lastChar === '!' || lastChar === '?') ? '\n\n' : '.\n\n';
      spokenText = `${trimmed}${separator}${attribution}`;
    }

    voiceService.speakForId(
      post.id,
      spokenText,
      speechLang,
      () => {},
      () => {},
      () => {
        triggerToast("Could not play audio. Please check device sound settings.");
      }
    );
  };

  // Handle Translate Action (Hindi <-> English)
  const handleToggleTranslate = async () => {
    if (showTranslation) {
      // Toggle back to original
      setShowTranslation(false);
      return;
    }

    if (translatedText) {
      // Already cached in component
      setShowTranslation(true);
      return;
    }

    try {
      setIsTranslating(true);
      const targetLang = isOriginalHindi ? 'en' : 'hi';
      const result = await translateContent(post.content, targetLang);
      setTranslatedText(result);
      setShowTranslation(true);
    } catch (err) {
      console.error("Translation error:", err);
      triggerToast("Translation temporarily unavailable.");
    } finally {
      setIsTranslating(false);
    }
  };

  const isAuthorMe = userProfile?.uid === post.authorId;
  const hasAppreciated = userProfile ? post.likes?.includes(userProfile.uid) : false;
  const isSaved = (savedPosts || []).includes(post.id) || (userProfile?.savedPosts || []).includes(post.id);
  
  const connection = connections.find(c => 
    userProfile && (
      (c.fromId === userProfile.uid && c.toId === post.authorId) || 
      (c.fromId === post.authorId && c.toId === userProfile.uid)
    )
  );

  const connStatus = connection 
    ? connection.status 
    : (isAuthorMe ? 'self' : 'not_connected');

  const handleAppreciatePost = async () => {
    if (!userProfile) return;
    try {
      const postRef = doc(db, 'posts', post.id);
      if (hasAppreciated) {
        await updateDoc(postRef, {
          likes: arrayRemove(userProfile.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userProfile.uid)
        });
      }
    } catch (err) {
      console.error("Error appreciating post:", err);
    }
  };

  const handleAddComment = async () => {
    if (!userProfile || !commentInput.trim()) return;
    try {
      const newComment: Comment = {
        id: `c_${Date.now()}`,
        authorId: userProfile.uid,
        authorName: userProfile.name,
        authorPhotoURL: userProfile.photoURL,
        content: commentInput.trim(),
        createdAt: new Date().toISOString()
      };
      
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      setCommentInput('');
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleVotePoll = async (optionIdx: number) => {
    if (!userProfile || !post.poll) return;
    try {
      const postRef = doc(db, 'posts', post.id);
      const updatedOptions = [...post.poll.options];
      
      if (!updatedOptions[optionIdx].votes) {
        updatedOptions[optionIdx].votes = [];
      }
      updatedOptions[optionIdx].votes.push(userProfile.uid);
      
      await updateDoc(postRef, {
        'poll.options': updatedOptions
      });
      triggerToast("Vote recorded!");
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  const currentlyDisplayedText = (showTranslation && translatedText) ? translatedText : post.content;
  const currentLang = (showTranslation && translatedText) ? (isOriginalHindi ? 'en' : 'hi') : originalLang;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden"
    >
      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={safeString(post.authorPhotoURL) || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100'} 
              alt={safeString(post.authorName)} 
              onClick={() => onProfileClick(post.authorId)}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-krishx-earth-50 cursor-pointer hover:opacity-90 transition-opacity"
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span 
                  onClick={() => onProfileClick(post.authorId)}
                  className="text-sm font-black text-krishx-dark-900 tracking-tight cursor-pointer hover:text-krishx-green-700 transition-colors"
                >
                  {safeString(post.authorName)}
                </span>
                
                {/* Category Tag */}
                <span className="bg-krishx-earth-50 text-krishx-green-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                  {safeString(post.category)}
                </span>
              </div>
              
              {/* Subheader: Role, Location, Time */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold text-krishx-dark-800/40 uppercase tracking-tight mt-0.5">
                <span>{safeString(post.authorRole)}</span>
                {safeString(post.authorLocation) && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-krishx-earth-300" />
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {safeString(post.authorLocation)}
                    </span>
                  </>
                )}
                <div className="w-1 h-1 rounded-full bg-krishx-earth-300" />
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {safeDateString(post.createdAt, 'Recent')}
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
                          onEdit(post);
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
                          onDelete(post.id);
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
              onClick={() => onGrowTogether(post.authorId)}
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

        {/* Translation Banner / Original indicator when translated */}
        {showTranslation && (
          <div className="mb-2 flex items-center justify-between bg-emerald-50/60 border border-emerald-200/50 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-emerald-600" />
              {isOriginalHindi ? 'Translated to English (मूल: हिंदी)' : 'हिंदी अनुवाद (Original: English)'}
            </span>
            <button
              onClick={handleToggleTranslate}
              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline ml-2"
            >
              Show original • मूल देखें
            </button>
          </div>
        )}

        {/* Post Content */}
        <p className="text-[15px] md:text-[16px] text-krishx-dark-900 leading-relaxed tracking-wide font-medium mb-3 whitespace-pre-wrap break-words">
          {currentlyDisplayedText}
        </p>

        {/* Inline Actions Bar: 🌐 Translate and 🔊 Quick Listen */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-xs">
          {/* Translate Button */}
          <button
            onClick={handleToggleTranslate}
            disabled={isTranslating}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-krishx-green-700 hover:text-krishx-green-800 hover:underline transition-all cursor-pointer bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-lg disabled:opacity-50"
            title={isOriginalHindi ? "Translate this post to English" : "इस पोस्ट का हिंदी में अनुवाद करें"}
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-krishx-green-600" />
                <span>Translating... / अनुवाद हो रहा है...</span>
              </>
            ) : showTranslation ? (
              <>
                <Languages className="w-3.5 h-3.5" />
                <span>Show Original • मूल पोस्ट देखें</span>
              </>
            ) : isOriginalHindi ? (
              <>
                <Languages className="w-3.5 h-3.5" />
                <span>Translate to English</span>
              </>
            ) : (
              <>
                <Languages className="w-3.5 h-3.5" />
                <span>हिंदी में अनुवाद करें</span>
              </>
            )}
          </button>

          {/* Language tag pill */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-krishx-dark-800/40 bg-krishx-earth-50 px-2 py-0.5 rounded-md">
            {currentLang === 'hi' ? '🇮🇳 Hindi (हिंदी)' : '🌐 English'}
          </span>
        </div>

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
                      onClick={() => handleVotePoll(idx)}
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
                onClick={() => onPreviewImage(url)}
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
              onClick={handleAppreciatePost}
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
              onClick={() => setExpandedComments(!expandedComments)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
                expandedComments
                  ? 'bg-krishx-earth-50 text-krishx-green-700'
                  : 'text-krishx-dark-800/40 hover:bg-krishx-earth-50 hover:text-krishx-dark-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.comments?.length ? `${post.comments.length} Comment` : 'Comment'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 🔊 Listen / Read Aloud Action Button */}
            <button 
              onClick={handleListen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-[11px] font-bold select-none ${
                isSpeaking 
                  ? 'bg-krishx-green-600 text-white animate-pulse shadow-md ring-2 ring-krishx-green-400/40' 
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/90 border border-emerald-200/70'
              }`}
              title={
                isSpeaking 
                  ? "Stop speech playback • रुकें" 
                  : currentLang === 'hi' 
                    ? "Listen aloud in Hindi (हिंदी में सुनें)" 
                    : "Listen aloud in Indian English"
              }
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Save */}
            <button 
              onClick={() => onToggleSave(post.id)}
              className={`p-2 rounded-xl transition-all ${
                isSaved 
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' 
                  : 'text-stone-400 hover:bg-stone-50 hover:text-stone-700'
              }`}
              title={isSaved ? "Remove Bookmark" : "Save Post"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-700 text-emerald-700' : ''}`} />
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
          {expandedComments && (
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
                        onClick={() => onProfileClick(comment.authorId)}
                        className="w-8 h-8 rounded-xl object-cover ring-1 ring-krishx-earth-50 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span 
                            onClick={() => onProfileClick(comment.authorId)}
                            className="text-xs font-black text-krishx-dark-900 cursor-pointer hover:text-krishx-green-700"
                          >
                            {safeString(comment.authorName, 'Farmer')}
                          </span>
                          <span className="text-[9px] font-bold text-krishx-dark-800/30 uppercase">
                            {safeDateString(comment.createdAt, 'Recent')}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-krishx-dark-900/80 mt-1">{safeString(comment.content)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment input form */}
              <div className="flex gap-2 pt-2">
                <input 
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  placeholder="Write a professional comment..."
                  className="flex-1 bg-krishx-earth-50/40 border border-krishx-earth-200/50 rounded-xl px-4 py-2.5 text-xs font-medium placeholder:text-krishx-dark-900/30 focus:outline-none focus:border-krishx-dark-800 focus:bg-white transition-all text-krishx-dark-900"
                />
                <button 
                  onClick={handleAddComment}
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
});
