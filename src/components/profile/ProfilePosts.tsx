import React, { useState } from 'react';
import { Post, UserProfile } from '../../types';
import { PostCard } from '../PostCard';
import { MessageSquare, Plus, Image as ImageIcon, Send, Sprout, Bookmark } from 'lucide-react';

interface ProfilePostsProps {
  posts: Post[];
  userProfile: UserProfile | null;
  connections: any[];
  savedPosts: string[];
  isMyOwnProfile: boolean;
  isSavedTab?: boolean;
  onToggleSave: (postId: string) => void;
  onProfileClick: (authorId: string) => void;
  onGrowTogether: (authorId: string) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onPreviewImage: (url: string) => void;
  triggerToast: (msg: string) => void;
  onCreatePost?: (content: string, category: string, topic: string, imageUrl?: string) => void;
}

export const ProfilePosts: React.FC<ProfilePostsProps> = ({
  posts,
  userProfile,
  connections,
  savedPosts,
  isMyOwnProfile,
  isSavedTab = false,
  onToggleSave,
  onProfileClick,
  onGrowTogether,
  onEditPost,
  onDeletePost,
  onPreviewImage,
  triggerToast,
  onCreatePost
}) => {
  const [showComposer, setShowComposer] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Knowledge' | 'Experience' | 'Learning' | 'Success Story' | 'Question' | 'Research'>('Knowledge');
  const [newPostTopic, setNewPostTopic] = useState('');
  const [newPostImage, setNewPostImage] = useState('');

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !onCreatePost) return;
    onCreatePost(newPostContent, newPostCategory, newPostTopic || 'General Agriculture', newPostImage || undefined);
    setNewPostContent('');
    setNewPostTopic('');
    setNewPostImage('');
    setShowComposer(false);
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Quick Composer for own profile */}
      {isMyOwnProfile && !isSavedTab && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-4">
          {!showComposer ? (
            <div 
              onClick={() => setShowComposer(true)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img 
                src={userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile?.name || 'Farmer')}`}
                alt="User"
                className="w-10 h-10 rounded-full object-cover border border-stone-200"
              />
              <div className="flex-1 bg-stone-50 hover:bg-stone-100 rounded-full px-4 py-2.5 border border-stone-200/80 text-stone-500 text-sm font-medium transition-colors flex items-center justify-between">
                <span>Share an update, crop learning, or question...</span>
                <Plus className="w-4 h-4 text-emerald-800" />
              </div>
            </div>
          ) : (
            <form onSubmit={handlePostSubmit} className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  New Agricultural Post
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowComposer(false)} 
                  className="text-xs text-stone-400 hover:text-stone-600 font-medium"
                >
                  Cancel
                </button>
              </div>

              <textarea
                rows={3}
                required
                placeholder="What farming practices, crop results, or questions do you want to share today?"
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                className="w-full text-sm p-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-stone-50/50"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 mb-1">Category</label>
                  <select
                    value={newPostCategory}
                    onChange={e => setNewPostCategory(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white focus:outline-none"
                  >
                    <option value="Knowledge">Knowledge</option>
                    <option value="Experience">Experience</option>
                    <option value="Learning">Learning</option>
                    <option value="Success Story">Success Story</option>
                    <option value="Question">Question</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 mb-1">Topic / Crop</label>
                  <input
                    type="text"
                    placeholder="e.g. Wheat, Pest Control, Organic Soil"
                    value={newPostTopic}
                    onChange={e => setNewPostTopic(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newPostImage}
                  onChange={e => setNewPostImage(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Post
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Posts List or Empty State */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-stone-200/80 text-center">
          {isSavedTab ? (
            <>
              <Bookmark className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-base font-bold text-stone-800">No saved posts yet</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Bookmark valuable farming posts across the KrishX network to read them later here.
              </p>
            </>
          ) : (
            <>
              <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-base font-bold text-stone-800">No posts published yet</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {isMyOwnProfile
                  ? 'Share your agricultural experiences, crop yields, and techniques with fellow farmers.'
                  : 'This farmer has not published any community posts yet.'}
              </p>
            </>
          )}
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userProfile={userProfile}
            connections={connections}
            savedPosts={savedPosts}
            onToggleSave={onToggleSave}
            onProfileClick={onProfileClick}
            onGrowTogether={onGrowTogether}
            onEdit={onEditPost}
            onDelete={onDeletePost}
            onPreviewImage={onPreviewImage}
            triggerToast={triggerToast}
          />
        ))
      )}
    </div>
  );
};
