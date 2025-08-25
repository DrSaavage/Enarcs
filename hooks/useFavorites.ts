// 📄 hooks/useFavorites.ts

import { auth, firestore } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setFavorites([]);
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  // Listen to user favorites in Firestore
  useEffect(() => {
    if (!userId) return;

    const userDocRef = doc(firestore, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
      } else {
        setFavorites([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [publicProfile]);

  // Toggle favorite for both user and event document
  const toggleFavorite = useCallback(
    async (eventId: string) => {
      if (!userId) return;
      const userDocRef = doc(firestore, 'users', userId);
      const eventDocRef = doc(firestore, 'events', eventId);

      try {
        if (favorites.includes(eventId)) {
          // Remove favorite
          await updateDoc(userDocRef, { favorites: arrayRemove(eventId) });
          await updateDoc(eventDocRef, { favorites: arrayRemove(userId) });
        } else {
          // Add favorite
          await updateDoc(userDocRef, { favorites: arrayUnion(eventId) });
          await updateDoc(eventDocRef, { favorites: arrayUnion(userId) });
        }
      } catch (error) {
        // Optional: handle error, e.g. show toast
      }
    },
    [favorites, userId]
  );

  return { favorites, toggleFavorite, loading };
}