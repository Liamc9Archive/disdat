import type { Timestamp } from "firebase/firestore";

export type Group = {
  value: string;
  label: string;
  trending?: boolean;
};

export type PollVotes = {
  opt1: number;
  opt2: number;
};

export type Poll = {
  id: string;
  question: string;
  category: string;
  opt1: string;
  opt2: string;
  votes: PollVotes;
  trendingScore: number;
  createdAt?: Date | Timestamp;
};

export type CreatePollInput = {
  question: string;
  category: string;
  opt1: string;
  opt2: string;
};

export type SortTab = "trending" | "top" | "recent";

export type UserProfile = {
  id?: string;
  email?: string | null;
  username?: string;
  displayName?: string;
  photoURL?: string;
  profileComplete?: boolean;
  isAnonymous?: boolean;
  notifications?: Record<string, boolean>;
};
