// 📄 hooks/useParticipations.ts

import { auth, firestore } from '@/lib/firebase';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export function useParticipations() {
  const [participations, setParticipations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    const currentUserId = user?.uid;
    if (!currentUserId) {
      setParticipations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const userDocRef = doc(firestore, 'users', currentUserId);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setParticipations(Array.isArray(data.participations) ? data.participations : []);
      } else {
        setParticipations([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleParticipation = useCallback(async (eventId: string) => {
    const user = auth.currentUser;
    const currentUserId = user?.uid;
    if (!currentUserId) return;

    const userDocRef = doc(firestore, 'users', currentUserId);
    const eventDocRef = doc(firestore, 'events', eventId);

    try {
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;

      const data = userSnap.data();
      const currentParticipations: string[] = Array.isArray(data.participations) ? data.participations : [];
      const isParticipating = currentParticipations.includes(eventId);

      if (isParticipating) {
        // Retirer participation
        await updateDoc(userDocRef, { participations: arrayRemove(eventId) });
        await updateDoc(eventDocRef, { participants: arrayRemove(currentUserId) });
      } else {
        // Ajouter participation
        await updateDoc(userDocRef, { participations: arrayUnion(eventId) });
        await updateDoc(eventDocRef, { participants: arrayUnion(currentUserId) });

        // ----- AUTO CRÉATION DU CHAT POUR L'ÉVENT -----
        const chatDocRef = doc(firestore, 'chats', eventId);
        const chatSnap = await getDoc(chatDocRef);

        if (!chatSnap.exists()) {
          // Récup infos de l'event pour titre/avatar du chat
          const eventSnap = await getDoc(eventDocRef);
          const eventData = eventSnap.exists() ? eventSnap.data() : {};

          await setDoc(chatDocRef, {
            participants: [currentUserId],
            eventId,
            eventTitle: eventData.title || "Événement",
            eventImageUrl: eventData.imageUrl || "",
            lastMessage: "",
            lastMessageTime: null,
            createdAt: new Date(),
          });
        } else {
          // Chat existe déjà → on ajoute juste l'user s'il n'y est pas déjà
          await updateDoc(chatDocRef, {
            participants: arrayUnion(currentUserId),
          });
        }

        // ----------- Message de bienvenue UNIQUE PAR USER -----------
        const welcomeFlagRef = doc(firestore, 'chats', eventId, 'systemWelcome', currentUserId);
        const welcomeFlagSnap = await getDoc(welcomeFlagRef);

        // 💡 On met tout de suite le count à 1 dans /unreads
        const unreadRef = doc(firestore, 'chats', eventId, 'unreads', currentUserId);
        await setDoc(unreadRef, { count: 1 }, { merge: true }); // Badge = 1 dès participation

        if (!welcomeFlagSnap.exists()) {
          // Récupère le displayName Firestore (toujours à jour)
          let displayName = "Utilisateur";
          try {
            const userProfileSnap = await getDoc(doc(firestore, "users", currentUserId));
            if (userProfileSnap.exists() && userProfileSnap.data().displayName) {
              displayName = userProfileSnap.data().displayName;
            }
          } catch {}

          const chatInfoSnap = await getDoc(chatDocRef);
          const chatInfo = chatInfoSnap.exists() ? chatInfoSnap.data() : {};
          const eventTitle = chatInfo.eventTitle || "Événement";

          // Ajoute le message système (affiché comme un message classique)
          const msgDoc = await addDoc(collection(firestore, 'chats', eventId, 'messages'), {
            text: `Bienvenue dans le chat "${eventTitle}", ${displayName} !`,
            senderId: "system",
            senderName: "Système",
            createdAt: serverTimestamp(),
            type: "system", // pas de system: true
          });

          // Mets à jour le dernier message du chat
          await updateDoc(chatDocRef, {
            lastMessage: `Bienvenue dans le chat "${eventTitle}", ${displayName} !`,
            lastMessageTime: serverTimestamp(),
          });

          // -------- Incrémente "non lus" pour TOUS les autres participants --------
          if (chatInfo.participants) {
            for (const uid of chatInfo.participants) {
              if (uid !== currentUserId) {
                const unreadRef = doc(firestore, 'chats', eventId, 'unreads', uid);
                await setDoc(unreadRef, { count: increment(1) }, { merge: true });
              }
            }
          }
          // Flag welcome envoyé
          await setDoc(welcomeFlagRef, { welcomed: true });
        }
      }
    } catch (error) {
      // Silent fail, log si besoin
      // console.error(error);
    }
  }, []);

  return { participations, toggleParticipation, loading };
}
