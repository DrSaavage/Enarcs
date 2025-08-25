// Path: types/index.ts
import { Timestamp } from "firebase/firestore";

export type UserRole = "influencer" | "client";

/** Optional: centralize your pricing type so public & private can share it */
export interface Pricing {
  dm?: { price?: number };
  audioCall?: { price?: number; durationMin?: number };
  videoCall?: { price?: number; durationMin?: number };
  media?: { pricePerItem?: number };
  sessions?: {
    packages?: Array<{ label: string; price: number; includes?: string }>;
  };
}

export interface User {
  uid: string;
  displayName: string;       // ✅ single source of truth for name
  email: string;

  avatar?: string;           // URL
  bio?: string;
  civility?: "M" | "Mme" | "Autre";
  phone?: string;
  age?: number;
  nationality?: string;
  role: UserRole;

  // (optionnels, utiles côté public)
  followersCount?: number;
  postsCount?: number;
  mediaUrls?: string[];
  pricing?: Pricing;

  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/** Shape tolérante pour lecture/écriture Firestore (doc partiel) */
export type UserDoc = Partial<User> & { uid: string };
