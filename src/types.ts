/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SlangCard {
  id: string;
  term: string; // Dynamic English or Portuguese BJJ phrase
  translation: string;
  pronunciationExample: string;
  context: string;
  category: 'techniques' | 'positions' | 'tatame-etiquette' | 'verbs';
  difficultLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  xpReward: number;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  belt: 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black';
  xp: number;
  accuracy: number;
  avatar: string;
  isCurrentUser?: boolean;
  country: string; // Flag emoji support
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  xpReward: number;
  unlocked: boolean;
  category: 'pronunciation' | 'streak' | 'arena' | 'quiz';
  progress: number;
  maxProgress: number;
}

export interface VocabularyTerm {
  english: string;
  translation: string;
  ipa: string;
  example: string;
  exampleTranslation: string;
  context: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  duration: string;
  completed: boolean;
  category: 'Basics' | 'Defense' | 'Attacking' | 'Ref-Commands';
  level: string;
  terms?: VocabularyTerm[];
}

export interface DailyChallenge {
  id: string;
  task: string;
  xpReward: number;
  completed: boolean;
  progress: number;
  target: number;
}

