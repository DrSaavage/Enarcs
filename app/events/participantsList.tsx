// /app/events/participantsList.tsx

import { firestore } from "@/lib/firebase";
import { gradientColors, gradientConfig } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { collection, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const router = useRouter();

interface UserInfo {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export default function ParticipantsListScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [participants, setParticipants] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  // Masquer la tabBar & header natif
  useEffect(() => {
    navigation.setOptions?.({
      tabBarStyle: { display: "none" },
      headerShown: false,
      tabBarVisible: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (!eventId) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    const eventRef = doc(firestore, "events", eventId as string);

    const unsubscribe = onSnapshot(eventRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      const data = snapshot.data();
      const uids: string[] = Array.isArray(data.participants) ? data.participants : [];

      if (uids.length === 0) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      try {
        const usersCollection = collection(firestore, "users");
        const batches: UserInfo[] = [];
        const chunkSize = 10;

        for (let i = 0; i < uids.length; i += chunkSize) {
          const chunk = uids.slice(i, i + chunkSize);
          const q = query(usersCollection, where("uid", "in", chunk));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            batches.push({
              uid: doc.id,
              displayName: userData.displayName || "Utilisateur",
              photoURL: userData.photoURL || undefined,
            });
          });
        }

        setParticipants(batches);
      } catch (error) {
        setParticipants([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header Custom */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Participants</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 32 }} color="#fff" />
        ) : participants.length === 0 ? (
          <Text style={styles.message}>Aucun participant pour cet événement.</Text>
        ) : (
          <FlatList
            data={participants}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => router.push('/profile/PublicProfile/' + item.uid)}
              >
                <Image
                  source={
                    item.photoURL && item.photoURL.startsWith("http")
                      ? { uri: item.photoURL }
                      : require("@/assets/images/avatar-placeholder.png")
                  }
                  style={styles.avatar}
                />
                <Text style={styles.name}>{item.displayName}</Text>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 0 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 18,
    paddingHorizontal: 14,
    gap: 12,
  },
  backButton: {
    padding: 3,
    marginRight: 4,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 25,
    letterSpacing: 1,
  },
  listContainer: { paddingHorizontal: 18, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: "#232345",
  },
  name: { color: "#fff", fontSize: 16, fontWeight: "500" },
  message: {
    color: "#fff",
    marginTop: 42,
    fontSize: 17,
    textAlign: "center",
    opacity: 0.8,
  },
});
