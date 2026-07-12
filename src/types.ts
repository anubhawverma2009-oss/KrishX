/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  krishXId: string; // Unique KX-XX-XXXXXX
  name: string;
  email: string;
  photoURL?: string;
  location: string; // e.g., "Meerut, Uttar Pradesh"
  crops: string[]; // e.g., ["Wheat", "Sugarcane"]
  experienceYears: number;
  education: string; // e.g., "B.Sc Agriculture"
  skills: string[]; // e.g., ["Organic Farming", "Drip Irrigation"]
  achievements: string[]; // e.g., "Best Sugarcane Yield 2025"
  summary: string; // Professional summary
  krishScore: number; // calculated score
  badges: string[]; // earned badges e.g., ["pioneer", "helper", "expert"]
  language: 'hi' | 'en';
  onboardingComplete: boolean;
  createdAt: string;
  savedPosts?: string[];
}

export type OpportunityType = 'Scheme' | 'Grant' | 'Job' | 'Internship' | 'Admission' | 'Program' | 'Training' | 'Startup' | 'Scholarship';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  description: string;
  eligibility: string;
  benefits: string;
  link: string;
  createdAt: string;
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
