// lib/authListener.ts
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, firestore } from './firebase';

export function useAuthListener() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(firestore, 'users', currentUser.uid);
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
        });
      }
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  return user;
}
