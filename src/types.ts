/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExperienceItem {
  id: string;
  role: string;
  farmOrOrg: string;
  location?: string;
  period: string;
  description?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  organization: string;
  year: string;
  type: 'award' | 'training' | 'recognition' | 'badge';
  description?: string;
}

export interface UserProfile {
  uid: string;
  krishXId: string; // Unique KX-XX-XXXXXX
  name: string;
  email: string;
  photoURL?: string;
  coverImage?: string;
  role?: string; // e.g., "Progressive Farmer • Wheat & Mustard"
  bio?: string; // short bio
  location: string; // e.g., "Meerut, Uttar Pradesh"
  crops: string[]; // e.g., ["Wheat", "Sugarcane"]
  currentCrops?: string[]; // Alias/extended crops
  farmingPractices?: string[]; // e.g., ["Organic Farming", "Drip Irrigation"]
  expertise?: string[]; // e.g., ["Soil Health", "Crop Management"]
  interests?: string[]; // e.g., ["AgriTech", "Zero Budget Farming"]
  languages?: string[]; // e.g., ["Hindi", "English", "Punjabi"]
  experienceYears: number;
  education: string; // e.g., "B.Sc Agriculture"
  skills: string[]; // e.g., ["Organic Farming", "Drip Irrigation"]
  achievements: string[]; // legacy list of achievement strings
  structuredAchievements?: AchievementItem[];
  experiences?: ExperienceItem[];
  summary: string; // Professional summary
  krishScore: number; // calculated score
  badges: string[]; // earned badges e.g., ["pioneer", "helper", "expert"]
  isVerified?: boolean;
  language: 'hi' | 'en';
  onboardingComplete: boolean;
  createdAt: string;
  savedPosts?: string[];
}

export type OpportunitySector = 'Government' | 'Private';

export type OpportunityCategory = 
  | 'Government Schemes'
  | 'Subsidies'
  | 'Grants'
  | 'Internships'
  | 'Scholarships'
  | 'Training'
  | 'Certifications'
  | 'Jobs'
  | 'Fellowships'
  | 'Competitions'
  | 'Mentorship'
  | 'Startup'
  | 'Other Agriculture Opportunities';

export type OpportunityAudience = 
  | 'Farmer'
  | 'Student'
  | 'Rural Youth'
  | 'Professional'
  | 'Other Agriculture User';

export type OpportunityType = 'Scheme' | 'Grant' | 'Job' | 'Internship' | 'Admission' | 'Program' | 'Training' | 'Startup' | 'Scholarship' | 'Government' | 'Private';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  sector?: OpportunitySector;
  category: OpportunityCategory | string;
  description: string;
  whoCanApply?: string;
  eligibility: string;
  benefits: string;
  deadline?: string;
  location?: string;
  sourceUrl?: string;
  sourceName?: string;
  link: string;
  audience?: OpportunityAudience[] | string[];
  verifiedAt?: string;
  createdAt: string;
  updatedAt?: string;
  highlightColor?: string;
}
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorKrishXId: string;
  authorBadges?: string[];
  authorRole?: string;
  authorLocation?: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  attachments?: {
    name: string;
    url: string;
    type: 'pdf' | 'doc' | 'image';
  }[];
  category: 'Knowledge' | 'Experience' | 'Learning' | 'Success Story' | 'Question' | 'Research';
  topic: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  coverImage: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
  createdAt: string;
  followUpQuestions?: string[];
  isThinking?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  senderId?: string;
  senderName?: string;
  senderPhoto?: string;
  type: 'like' | 'comment' | 'connection' | 'alert' | 'system' | 'opportunity';
  title: string;
  body: string;
  postId?: string;
  opportunityId?: string;
  createdAt: string;
  read: boolean;
}
