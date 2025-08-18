// 📄 /app/(tabs)/messages-list.tsx

import MessageItem from "@/components/messages/MessageItem";
import { auth, firestore } from "@/lib/firebase";
import { gradientColors, gradientConfig } from "@/theme";
import { useFocusEffect } from '@react-navigation/native';
import Checkbox from "expo-checkbox";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

export default function MessagesListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [chats, setChats] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [chatId: string]: number }>({});
  const [editMode, setEditMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // 👈 Pour forcer le refresh

  const listenersRef = useRef<{ [chatId: string]: () => void }>({});

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setEditMode((prev) => !prev)}
          style={{ marginRight: 16 }}
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>
            {editMode ? "Annuler" : "Edit"}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, editMode]);

  // 🚨 Ajoute ceci : refocus = refreshKey++
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, [])
  );

  useEffect(() => {
    if (!auth.currentUser) return;
    const chatsRef = collection(firestore, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", auth.currentUser.uid),
      orderBy("lastMessageTime", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const rawChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Remove previous listeners
      Object.values(listenersRef.current).forEach(unsub => unsub && unsub());
      listenersRef.current = {};

      // Subscribe to "unreads" of each chat
      rawChats.forEach((chat) => {
        const unreadRef = doc(firestore, "chats", chat.id, "unreads", auth.currentUser.uid);
        listenersRef.current[chat.id] = onSnapshot(unreadRef, (docSnap) => {
          setUnreadCounts((prev) => ({
            ...prev,
            [chat.id]: docSnap.exists() && typeof docSnap.data().count === "number"
              ? docSnap.data().count
              : 0,
          }));
        });
      });

      setChats(rawChats);
    });

    // Clean all listeners on unmount
    return () => {
      unsub();
      Object.values(listenersRef.current).forEach(unsub => unsub && unsub());
      listenersRef.current = {};
    };
    // 👇 Ajoute refreshKey ici !
  }, [auth.currentUser, refreshKey]);

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteDoc(doc(firestore, "chats", chatId));
    } catch (error) {
      console.error("Erreur suppression chat:", error);
    }
  };

  const handleBulkDelete = async () => {
    Alert.alert(
      "Supprimer",
      `Supprimer ${selectedChats.length} chat(s) ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            for (const id of selectedChats) {
              await handleDeleteChat(id);
            }
            setSelectedChats([]);
            setEditMode(false);
          },
        },
      ]
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedChats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={gradientColors}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.title}>Messages</Text>

          {editMode && selectedChats.length > 0 && (
            <Pressable onPress={handleBulkDelete}>
              <Text style={styles.deleteButton}>
                Supprimer {selectedChats.length} sélectionné(s)
              </Text>
            </Pressable>
          )}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {chats.length === 0 ? (
              <Text
                style={{ color: "#ccc", textAlign: "center", marginTop: 44 }}
              >
                Aucun message pour l’instant.
              </Text>
            ) : (
              chats.map((chat) => {
                const item = (
                  <MessageItem
                    key={chat.id}
                    id={chat.id}
                    senderName={chat.eventTitle || "Chat"}
                    lastMessage={chat.lastMessage || ""}
                    time={
                      chat.lastMessageTime?.seconds
                        ? new Date(
                          chat.lastMessageTime.seconds * 1000
                        )
                          .toLocaleTimeString()
                          .slice(0, 5)
                        : ""
                    }
                    avatarUrl={
                      chat.eventImageUrl ||
                      "https://cdn-icons-png.flaticon.com/512/3097/3097035.png"
                    }
                    unreadCount={unreadCounts[chat.id] || 0}
                    onPress={() =>
                      editMode
                        ? toggleSelect(chat.id)
                        : router.push(`/messages/${chat.id}`)
                    }
                  />
                );

                return editMode ? (
                  <View key={chat.id} style={styles.editRow}>
                    <Checkbox
                      value={selectedChats.includes(chat.id)}
                      onValueChange={() => toggleSelect(chat.id)}
                      color="#fff"
                    />
                    <View style={{ flex: 1 }}>{item}</View>
                  </View>
                ) : (
                  <Swipeable
                    key={chat.id}
                    renderRightActions={() => (
                      <Pressable
                        onPress={() =>
                          Alert.alert("Supprimer", "Supprimer cette conversation ?", [
                            { text: "Annuler", style: "cancel" },
                            {
                              text: "Supprimer",
                              style: "destructive",
                              onPress: () => handleDeleteChat(chat.id),
                            },
                          ])
                        }
                        style={styles.swipeDelete}
                      >
                        <Text style={styles.swipeDeleteText}>Supprimer</Text>
                      </Pressable>
                    )}
                  >
                    {item}
                  </Swipeable>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 6 },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 18,
    marginLeft: 18,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 4,
  },
  swipeDelete: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    marginVertical: 4,
    borderRadius: 8,
  },
  swipeDeleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 10,
  },
  deleteButton: {
    color: "#ff4d4d",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
});