// 📄 app/(tabs)/messages/[chatId].tsx

import { auth, firestore } from "@/lib/firebase";
import { gradientColors, gradientConfig } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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

// MessageBubble : gère le style system msg
function MessageBubble({ text, isMine = false, time, senderName }) {
  return (
    <View style={[
      styles.bubble,
      isMine ? styles.bubbleMine : styles.bubbleOther
    ]}>
      {senderName === "Système" &&
        <Text style={{ color: '#ccc', fontSize: 12, marginBottom: 2 }}>{senderName}</Text>
      }
      <Text style={styles.bubbleText}>{text}</Text>
      {time && <Text style={styles.bubbleTime}>{time}</Text>}
    </View>
  );
}

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatInfo, setChatInfo] = useState(null);
  const flatListRef = useRef(null);

  // Util function: met à zéro les non lus pour ce chat et cet user
  const resetUnread = useCallback(() => {
    if (!chatId || !auth.currentUser) return;
    const unreadRef = doc(firestore, "chats", chatId, "unreads", auth.currentUser.uid);
    setDoc(unreadRef, { count: 0 }, { merge: true });
  }, [chatId, auth.currentUser]);

  // À chaque focus (entrée dans l'écran) → on marque comme lu
  useFocusEffect(
    useCallback(() => {
      resetUnread();
    }, [resetUnread])
  );

  // Quand on clique retour, on reset aussi AVANT navigation pour garantir la synchro
  const handleBack = () => {
    resetUnread();
    setTimeout(() => router.back(), 20); // petit délai pour assurer la propagation
  };

  useEffect(() => {
    if (!chatId) return;
    const ref = doc(firestore, "chats", chatId);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setChatInfo({ id: snap.id, ...snap.data() });
      else setChatInfo(null);
    });
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(firestore, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
    if (!input.trim() || !auth.currentUser) return;
    const senderId = auth.currentUser.uid;
    const message = {
      text: input,
      senderId,
      senderName: auth.currentUser.displayName || "Moi",
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(firestore, "chats", chatId, "messages"), message);
    await updateDoc(doc(firestore, "chats", chatId), {
      lastMessage: input,
      lastMessageTime: serverTimestamp(),
    });
    setInput("");

    // Incrémente "non lus" pour tous les autres participants
    const chatDocRef = doc(firestore, "chats", chatId);
    const chatSnap = await getDoc(chatDocRef);
    if (chatSnap.exists()) {
      const participants = chatSnap.data().participants || [];
      for (const uid of participants) {
        if (uid !== senderId) {
          const unreadRef = doc(firestore, "chats", chatId, "unreads", uid);
          await setDoc(unreadRef, { count: increment(1) }, { merge: true });
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
        {/* HEADER style Telegram */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={28} color="#fff" style={{ marginRight: 12 }} />
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
              text={item.text}
              isMine={item.senderId === auth.currentUser?.uid}
              time={
                item.createdAt?.seconds
                  ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString().slice(0, 5)
                  : ""
              }
              senderName={item.senderName}
            />
          )}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              placeholder="Écrire un message"
              placeholderTextColor="#ccc"
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
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
  bubble: {
    maxWidth: "75%",
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: "#3F8AFF",
    alignSelf: "flex-end",
    borderTopRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: "#262833",
    alignSelf: "flex-start",
    borderTopLeftRadius: 6,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 16,
  },
  bubbleTime: {
    color: "#c6c6c6",
    fontSize: 11,
    marginTop: 2,
    alignSelf: "flex-end",
  },
  bubbleSystem: {
    alignSelf: "center",
    backgroundColor: "#ececec",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  bubbleSystemText: {
    color: "#222",
    fontStyle: "italic",
    fontSize: 15,
    textAlign: "center",
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
