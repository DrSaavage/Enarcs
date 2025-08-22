// types/index.ts
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'influencer' | 'client';

export interface User {
  uid: string;
  firstName: string;
  lastName?: string;
  age?: number;
  nationality?: string;
  avatar?: string;            // URL
  bio?: string;
  civility?: 'M' | 'Mme' | 'Autre';
  email: string;
  phone?: string;
  role: UserRole;             // influencer ou client
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// -----------------------

export interface Post {
  id: string;
  authorId: string;           // uid de l’influenceur
  title?: string;
  content?: string;           // texte du post
  mediaUrls?: string[];       // images, vidéos
  price?: number;             // tarif pour discussion / service
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// -----------------------

export type ChatType = 'text' | 'audio' | 'video' | 'gift';

export interface Message {
  id: string;
  senderId: string;
  content: string;            // texte ou URL média
  type: 'text' | 'image' | 'video' | 'gift';
  createdAt: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[];     // array of user uids (2 for now)
  postId?: string;            // le post qui a déclenché le chat
  type: ChatType;
  accessGranted?: boolean;    // true si le client a payé pour ce chat
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  // messages peuvent être une subcollection dans Firestore, sinon tableau
  messages?: Message[];
}
