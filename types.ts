
export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'peer';
  text: string;
  timestamp: Date;
}

export interface UserProfile {
  name: string;
  role: 'warrior' | 'caregiver' | 'advocate' | 'doctor';
  location: string;
  age?: number;
}

export type GameType = 'rpg' | 'runner' | 'platformer' | 'puzzle' | 'strategy' | 'adventure' | 'sim' | 'escape' | 'cards' | 'defense';

export interface GameConcept {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'RPG' | 'Action' | 'Puzzle' | 'Strategy' | 'Adventure' | 'Sim';
  type: GameType;
}

export interface ForumPost {
  id: string;
  author: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  tags: string[];
}
