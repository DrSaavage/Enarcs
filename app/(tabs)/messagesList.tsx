// Path: app/(tabs)/messagesList.tsx

import MessageItem from "@/components/messages/MessageItem";
import { auth, firestore } from "@/lib/firebase";
import PageContainer from "@/theme/PageContainer";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ChatListItem = {
  id: string;
  participants: string[];
  type: "text" | "audio" | "video" | "gift";
  postId?: string;
  accessGranted?: boolean;
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
  lastMessage?: string;
  eventImageUrl?: string; // fallback visuel si tu l'utilises déjà
  postTitle?: string; // fallback titre si présent
};

export default function MessagesList() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const unreadUnsubsRef = useRef<Record<string, () => void>>({});

  // Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u && !u.isAnonymous ? u : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Liste des chats de l'utilisateur + listeners non-lus
  useEffect(() => {
    // cleanup listeners non-lus existants
    Object.values(unreadUnsubsRef.current).forEach((fn) => fn?.());
    unreadUnsubsRef.current = {};
    setUnreadMap({});

    if (!user) {
      setChats([]);
      return;
    }

    const q = query(
      collection(firestore, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as ChatListItem),
      }));
      setChats(docs);

      // Attache/rafraîchit un listener non-lus pour chaque chat
      docs.forEach((c) => {
        const key = `${c.id}__${user.uid}`;
        if (unreadUnsubsRef.current[key]) return; // déjà attaché

        const unreadRef = doc(firestore, "chats", c.id, "unreads", user.uid);
        const unreadUnsub = onSnapshot(unreadRef, (unreadSnap) => {
          const count =
            (unreadSnap.exists() ? (unreadSnap.data() as any).count : 0) || 0;
          setUnreadMap((prev) => ({ ...prev, [c.id]: count }));
        });

        unreadUnsubsRef.current[key] = unreadUnsub;
      });
    });

    return () => {
      unsub();
      Object.values(unreadUnsubsRef.current).forEach((fn) => fn?.());
      unreadUnsubsRef.current = {};
    };
  }, [user]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      );
    }

    // 🔹 Même rendu que createPost quand non connecté/anonyme
    if (!user) {
      return (
        <ScrollView contentContainerStyle={styles.center}>
          <Text style={{ color: "#fff", marginBottom: 20 }}>
            Vous n'êtes pas connecté(e).
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.authButton,
              { backgroundColor: "transparent", borderWidth: 1, borderColor: "#fff" },
            ]}
            onPress={() => router.push("/auth/signup")}
          >
            <Text style={[styles.authButtonText, { color: "#fff" }]}>
              Créer un compte
            </Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    if (chats.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={{ color: "#aaa" }}>Aucune conversation</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const ts = item.updatedAt?.seconds
            ? new Date(item.updatedAt.seconds * 1000)
            : undefined;

          return (
            <MessageItem
              id={item.id}
              senderName={item.postTitle || "Discussion"}
              lastMessage={item.lastMessage || ""}
              time={ts ? ts.toLocaleDateString() : ""}
              avatarUrl={
                item.eventImageUrl ||
                "https://cdn-icons-png.flaticon.com/512/3097/3097035.png"
              }
              unreadCount={unreadMap[item.id] || 0}
            />
          );
        }}
      />
    );
  }, [loading, user, chats, unreadMap]);

  return (
    <PageContainer title="Messages" showBackButton={false}>
      {content}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  // mêmes styles de boutons que sur createPost
  authButton: {
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginVertical: 8,
    width: 200,
    alignItems: "center",
  },
  authButtonText: { color: "black", fontSize: 16, fontWeight: "bold" },
});
