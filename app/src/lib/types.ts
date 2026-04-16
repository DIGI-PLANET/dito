export interface Choice {
  id: string;
  text: string;
}

export interface Challenge {
  title: string;
  description: string;
  duration: string;
}

export type EmberStage = 'sparked' | 'burning' | 'blazing' | 'radiant' | 'eternal';

// Soul interface matching Go backend
export interface Soul {
  id: string;
  seeker_name: string;
  current_level: string;
  ember_points: number;
  total_talents: number;
  active_talents: number;
  conviction_level: number;
  next_milestone: string;
  arena_eligible: boolean;
  last_activity: string;
  talents: Talent[];
  current_talent_label?: string;
  created_at?: string;
}

// Talent interface matching Go backend  
export interface Talent {
  id: string;
  name: string;
  category: string;
  progress_percentage: number;
  ember_earned: number;
  days_active: number;
  mastery_level: string;
}

export interface DiaryEntry {
  type: 'user' | 'ember';
  content: string;
  timestamp: number;
  choices?: Choice[];
  challenge?: Challenge;
  image?: string;
}

export interface SoulCard {
  label: string;
  traits: string[];
  description: string;
  talentLabel: string;
  mintDate: string;
  stage: EmberStage;
  soul_id?: string;
}

export interface Ember {
  id: string;
  user_id: string;
  ember_name: string;
  talent: string;
  talent_category?: string;
  discovery_conversation: Array<{ role: 'ember' | 'user'; content: string }>;
  ember_stage: EmberStage;
  discovery_turns?: number;
  abandoned_at?: string;
  lang?: string;
  created_at: string;
  updated_at: string;
}
