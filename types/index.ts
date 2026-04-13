export type Translation = 'NIV' | 'ESV' | 'KJV' | 'NLT' | 'NKJV' | 'BSB' | 'ASV' | 'WEB' | 'YLT';
export type Visibility = 'public' | 'friends' | 'group';
export type ReactionType = 'pray' | 'amen' | 'hit';
export type Theme =
  | 'faith'
  | 'grace'
  | 'community'
  | 'suffering'
  | 'identity'
  | 'prayer'
  | 'purpose'
  | 'trust'
  | 'obedience';

export interface User {
  id: string;
  email: string;
  name: string;
  yoke_code: string;
  avatar_url: string | null;
  bio: string | null;
  church: string | null;
  streak: number;
  longest_streak: number;
  is_premium: boolean;
  trial_ends_at: string | null;
  created_at: string;
}

export interface Passage {
  id: string;
  reference: string;
  text: string;
  date: string;
  title: string;
  prompt: string;
  theme: Theme | null;
  plan_ref: string | null;
  created_at: string;
}

export interface Devotional {
  id: string;
  user_id: string;
  passage_id: string;
  content: string;
  visibility: Visibility;
  group_id: string | null;
  comments_disabled: boolean;
  created_at: string;
  // joined fields
  user?: User;
  passage?: Passage;
  reactions?: Reaction[];
  reaction_counts?: { pray: number; amen: number; hit: number };
  comment_count?: number;
}

export interface Reaction {
  id: string;
  devotional_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  streak: number;
  created_at: string;
  // joined fields
  member_count?: number;
  posted_today?: number;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Comment {
  id: string;
  devotional_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface BibleVerse {
  id: number;
  translation: Translation;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}
