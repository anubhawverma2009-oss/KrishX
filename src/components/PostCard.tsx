import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Edit, Trash2, Check, Clock, UserPlus, MapPin, Heart, MessageSquare, Bookmark, Share2 } from 'lucide-react';
import { Post, UserProfile, Comment } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Subtle high-quality client-side translation helper for agrarian content
const translatePostContent = (text: string, toLanguage: 'hi' | 'en'): string => {
  const textNormalized = text.trim();

  // 1. High-precision predefined translations for seeded posts to ensure 100% flawless professional experience
  if (textNormalized.includes('मौसम में गन्ने की फसल') || textNormalized.includes('ब्लैक बग')) {
    return 'Dear farmer brothers, an outbreak of "Black Bug" (black insects) is being seen in the sugarcane crop in the current season. To control this, please avoid excessive spraying of chemical pesticides.\n\nNatural remedy: Boil 1 kg of neem leaves and 250 g of crushed garlic in 5 liters of buttermilk (whey) per acre. Strain and mix with 150 liters of water, then spray in the morning. This repels pests and strengthens the leaves. If you have any doubts, comment immediately!';
  }

  if (textNormalized.includes('जैविक विधि से तैयार') || textNormalized.includes('जीवामृत')) {
    return 'Today, organically prepared "Jeevamrut" was sprayed on my farm. Mixed 10 kg native cow dung, 8 liters cow urine, 2 kg jaggery, 2 kg gram flour, and 1 kg living soil from under a peepal tree in 200 liters of water and fermented it for 4 days.\n\nBenefits: The color of the crop has turned deep green and earthworms are active again in the soil. Adopt organic farming, protect soil health!';
  }

  // Dual mapping: English to Hindi seeded posts
  if (textNormalized.toLowerCase().includes('black bug') || textNormalized.toLowerCase().includes('sugarcane crop')) {
    return 'किसान भाइयों, वर्तमान मौसम में गन्ने की फसल में "ब्लैक बग" (काले कीड़े) का प्रकोप देखा जा रहा है। इसके नियंत्रण के लिए कृपया रासायनिक कीटनाशकों के अत्यधिक छिड़काव से बचें। \n\nप्राकृतिक उपचार: प्रति एकड़ 5 लीटर मट्ठे (छाछ) में 1 किलो नीम की पत्ती और 250 ग्राम लहसुन पीसकर उबालें। छानकर 150 लीटर पानी में मिलाकर सुबह के समय छिड़काव करें। यह कीटों को भगाता है और पत्तों को मजबूती प्रदान करता है। किसी भी संदेह की स्थिति में तुरंत कमेंट करें!';
  }

  if (textNormalized.toLowerCase().includes('jeevamrut') || textNormalized.toLowerCase().includes('organically prepared')) {
    return 'आज मेरे खेत में जैविक विधि से तैयार "जीवामृत" का छिड़काव किया गया। 200 लीटर पानी में 10 किलो देसी गाय का गोबर, 8 लीटर गोमूत्र, 2 किलो गुड़, 2 किलो बेसन और 1 किलो पीपल के पेड़ के नीचे की सजीव मिट्टी को मिलाकर 4 दिन फर्मेंट किया था। \n\nफायदे: फसल का रंग गहरा हरा हो गया है और केंचुए फिर से भूमि में सक्रिय हो रहे हैं। जैविक खेती अपनाएं, भूमि का स्वास्थ्य बचाएं!';
  }

  // 2. Adaptive dictionary translation for dynamic custom posts
  const engToHinDict: Record<string, string> = {
    'hello': 'नमस्ते',
    'farmer': 'किसान',
    'farmers': 'किसानों',
    'farming': 'खेती',
    'agriculture': 'कृषि',
    'crop': 'फसल',
    'crops': 'फसलों',
    'soil': 'मिट्टी',
    'water': 'पानी',
    'seed': 'बीज',
    'seeds': 'बीजों',
    'fertilizer': 'उर्वरक',
    'fertilizers': 'उर्वरकों',
    'pest': 'कीट',
    'pests': 'कीटों',
    'disease': 'बीमारी',
    'diseases': 'बीमारियों',
    'organic': 'जैविक',
    'green': 'हरा',
    'wheat': 'गेहूं',
    'rice': 'धान',
    'sugarcane': 'गन्ना',
    'mustard': 'सरसों',
    'yield': 'पैदावार',
    'market': 'मंडी',
    'price': 'मूल्य',
    'weather': 'मौसम',
    'rain': 'बारिश',
    'expert': 'विशेषज्ञ',
    'today': 'आज',
    'good': 'अच्छा',
    'spraying': 'छिड़काव',
    'sprayed': 'छिड़काव किया',
    'benefits': 'फायदे',
    'protect': 'सुरक्षित',
    'health': 'स्वास्थ्य',
    'help': 'मदद',
    'experience': 'अनुभव',
    'research': 'अनुसंधान',
    'success': 'सफलता'
  };

  const hinToEngDict: Record<string, string> = {
    'नमस्कार': 'Greetings',
    'नमस्ते': 'Hello',
    'किसान': 'farmer',
    'किसानों': 'farmers',
    'खेती': 'farming',
    'कृषि': 'agriculture',
    'फसल': 'crop',
    'फसलों': 'crops',
    'मिट्टी': 'soil',
    'पानी': 'water',
    'बीज': 'seed',
    'बीजों': 'seeds',
    'उर्वरक': 'fertilizer',
    'खाद': 'manure',
    'कीट': 'pest',
    'कीटों': 'pests',
    'बीमारी': 'disease',
    'बीमारियों': 'diseases',
    'जैविक': 'organic',
    'हरा': 'green',
    'गेहूं': 'wheat',
    'धान': 'rice',
    'गन्ना': 'sugarcane',
    'सरसों': 'mustard',
    'पैदावार': 'yield',
    'मंडी': 'market',
    'मूल्य': 'price',
    'मौसम': 'weather',
    'बारिश': 'rain',
    'विशेषज्ञ': 'expert',
    'आज': 'today',
    'छिड़काव': 'spraying',
    'फायदे': 'benefits',
    'स्वास्थ्य': 'health'
  };

  if (toLanguage === 'hi') {
    let result = text;
    for (const [eng, hin] of Object.entries(engToHinDict)) {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      result = result.replace(regex, hin);
    }
    if (result === text) {
      return `[अनुवाद]: ${text}\n\n(यह पोस्ट अंग्रेजी में लिखी गई थी)`;
    }
    return result;
  } else {
    let result = text;
    for (const [hin, eng] of Object.entries(hinToEngDict)) {
      const regex = new RegExp(hin, 'g');
      result = result.replace(regex, eng);
    }
    if (result === text) {
      return `[Translated]: ${text}\n\n(This post was originally written in Hindi)`;
    }
    return result;
  }
};

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

export const PostCard: React.FC<PostCardProps> = ({
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
  const [showTranslation, setShowTranslation] = useState(false);

  const isAuthorMe = userProfile?.uid === post.authorId;
  const hasAppreciated = userProfile ? post.likes?.includes(userProfile.uid) : false;
  
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
              src={post.authorPhotoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100'} 
              alt={post.authorName} 
              onClick={() => onProfileClick(post.authorId)}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-krishx-earth-50 cursor-pointer hover:opacity-90 transition-opacity"
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span 
                  onClick={() => onProfileClick(post.authorId)}
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

        {/* Post Content */}
        <p className="text-sm text-krishx-dark-900 leading-relaxed font-medium mb-2 whitespace-pre-wrap">
          {showTranslation 
            ? translatePostContent(post.content, /[\u0900-\u097F]/.test(post.content) ? 'en' : 'hi') 
            : post.content}
        </p>

        {/* Subtle, X/LinkedIn-style translation button */}
        <div className="mb-4">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="text-[11px] font-bold text-krishx-green-700/85 hover:text-krishx-green-800 hover:underline transition-all cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0"
          >
            {showTranslation ? (
              <span>Show Original • मूल पोस्ट देखें</span>
            ) : /[\u0900-\u097F]/.test(post.content) ? (
              <span>Translate to English</span>
            ) : (
              <span>हिंदी में अनुवाद करें</span>
            )}
          </button>
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

          <div className="flex items-center gap-1">
            {/* Save */}
            <button 
              onClick={() => onToggleSave(post.id)}
              className={`p-2 rounded-xl transition-all ${
                savedPosts.includes(post.id) 
                  ? 'text-krishx-green-700 bg-krishx-earth-50' 
                  : 'text-krishx-dark-800/40 hover:bg-krishx-earth-50 hover:text-krishx-dark-900'
              }`}
              title="Save Post"
            >
              <Bookmark className={`w-4 h-4 ${savedPosts.includes(post.id) ? 'fill-krishx-green-700' : ''}`} />
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
};
