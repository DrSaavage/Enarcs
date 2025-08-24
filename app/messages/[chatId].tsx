// app/messages/[chatId].tsx

import MessageBubble from "@/components/messages/MessageBubble";
import { auth, firestore } from "@/lib/firebase";
import { gradientColors, gradientConfig } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ChatDoc = {
  id: string;
  participants: string[];
  postId?: string;
  type: "text" | "audio" | "video" | "gift";
  accessGranted?: boolean;
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
  // champs d'aperçu pratique
  lastMessage?: string;
  lastMessageTime?: { seconds: number };
  // visuels optionnels si tu les utilises
  eventTitle?: string;
  eventImageUrl?: string;
};

type MessageDoc = {
  id: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video" | "gift";
  createdAt?: { seconds: number };
  senderName?: string;
};

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [input, setInput] = useState("");
  const [chatInfo, setChatInfo] = useState<ChatDoc | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Marquer comme lu pour l'utilisateur courant
  const resetUnread = useCallback(() => {
    if (!chatId || !auth.currentUser) return;
    const unreadRef = doc(
      firestore,
      "chats",
      String(chatId),
      "unreads",
      auth.currentUser.uid
    );
    setDoc(unreadRef, { count: 0 }, { merge: true });
  }, [chatId]);

  useFocusEffect(
    useCallback(() => {
      resetUnread();
    }, [resetUnread])
  );

  const handleBack = () => {
    resetUnread();
    setTimeout(() => router.back(), 20);
  };

  // Récup infos chat
  useEffect(() => {
    if (!chatId) return;
    const ref = doc(firestore, "chats", String(chatId));
    getDoc(ref).then((snap) => {
      if (snap.exists()) setChatInfo({ id: snap.id, ...(snap.data() as ChatDoc) });
      else setChatInfo(null);
    });
  }, [chatId]);

  // Stream messages
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(firestore, "chats", String(chatId), "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MessageDoc) }))
      );
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        80
      );
    });
    return unsub;
  }, [chatId]);

  const chatTitle = chatInfo?.eventTitle || "Discussion";
  const chatAvatar =
    chatInfo?.eventImageUrl ||
    "https://cdn-icons-png.flaticon.com/512/3097/3097035.png";

  const navigateToEvent = () => {
    if (chatInfo && chatInfo.id) {
      router.push(`/home/${chatInfo.id}`);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !auth.currentUser || !chatId) return;

    const senderId = auth.currentUser.uid;
    const message: Omit<MessageDoc, "id"> = {
      content: input.trim(),
      senderId,
      type: "text",
      createdAt: serverTimestamp() as any,
      senderName: auth.currentUser.displayName || "Moi",
    };

    // Ajoute le message
    await addDoc(
      collection(firestore, "chats", String(chatId), "messages"),
      message
    );

    // Met à jour le doc de chat (aperçu + tri)
    const chatRef = doc(firestore, "chats", String(chatId));
    await updateDoc(chatRef, {
      lastMessage: message.content,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setInput("");

    // Incrémente non-lus pour les autres participants
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const participants = (chatSnap.data() as ChatDoc).participants || [];
      for (const uid of participants) {
        if (uid !== senderId) {
          const unreadRef = doc(
            firestore,
            "chats",
            String(chatId),
            "unreads",
            uid
          );
          await setDoc(
            unreadRef,
            { count: increment(1) },
            { merge: true }
          );
        }
      }
    }
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons
              name="arrow-back"
              size={28}
              color="#fff"
              style={{ marginRight: 12 }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={navigateToEvent} style={styles.headerUser}>
            <Image source={{ uri: chatAvatar }} style={styles.headerAvatar} />
            <Text style={styles.headerName}>{chatTitle}</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              text={item.content}
              isMine={item.senderId === auth.currentUser?.uid}
              time={
                item.createdAt?.seconds
                  ? new Date(item.createdAt.seconds * 1000)
                      .toLocaleTimeString()
                      .slice(0, 5)
                  : ""
              }
            />
          )}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              placeholder="Écrire un message"
              placeholderTextColor="#ccc"
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 10,
    gap: 8,
  },
  headerUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  messages: {
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#191919",
    borderRadius: 30,
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#3F8AFF",
    borderRadius: 20,
    padding: 8,
  },
});
