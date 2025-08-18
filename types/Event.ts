// 📄 /types/Event.ts
export type Event = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  date: Date | string | any; // pour Firestore (Timestamp) ou JS Date
  price?: string | number | null;
  imageUrl?: string;
  image?: string; // pour compatibilité
  type?: string;
  city?: string;
  country?: string;
  lat?: number | string;
  lng?: number | string;
  place_id?: string;
  favorites?: string[];
  participants?: string[];
  creatorId?: string;
  createdAt?: Date | string | any | null;
  [key: string]: any; // fallback Firestore
};
