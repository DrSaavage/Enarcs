// hooks/useTotalUnreadMessages.ts
import { auth, firestore } from "@/lib/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useTotalUnreadMessages() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return setTotal(0);
    const chatsRef = collection(firestore, "chats");
    let unsubUnreads: Array<() => void> = [];

    const unsubChats = onSnapshot(chatsRef, (snapshot) => {
      // Nettoyage précédent
      unsubUnreads.forEach(u => u());
      unsubUnreads = [];
      let totals: { [chatId: string]: number } = {};
      const userChats = snapshot.docs.filter(doc =>
        Array.isArray(doc.data().participants) && doc.data().participants.includes(user.uid)
      );
      if (userChats.length === 0) {
        setTotal(0);
        return;
      }
      userChats.forEach(chatDoc => {
        const unreadRef = doc(firestore, "chats", chatDoc.id, "unreads", user.uid);
        const unsub = onSnapshot(unreadRef, snap => {
          const val = (snap.exists() && typeof snap.data().count === "number") ? snap.data().count : 0;
          totals[chatDoc.id] = val;
          setTotal(Object.values(totals).reduce((a, b) => a + b, 0));
        });
        unsubUnreads.push(unsub);
      });
    });

    return () => {
      unsubUnreads.forEach(u => u());
      unsubChats();
    };
  }, [auth.currentUser]);

  return total;
}
