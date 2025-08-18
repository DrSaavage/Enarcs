// 📄 /app/profile/PublicProfile/[userId].tsx

import { firestore } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PublicProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoModal, setPhotoModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (!userId) return;
      const ref = doc(firestore, "users", userId);
      const snap = await getDoc(ref);
      setUser(snap.exists() ? snap.data() : null);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading)
    return (
      <LinearGradient colors={['#000', '#1C1C1C', 'rgba(90,26,26,0.6)']} style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color="#fff" size="large" />
      </LinearGradient>
    );
  if (!user)
    return (
      <LinearGradient colors={['#000', '#1C1C1C', 'rgba(90,26,26,0.6)']} style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ color: '#fff', textAlign: "center" }}>Utilisateur introuvable</Text>
      </LinearGradient>
    );

  const avatarUri = user.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  return (
    <LinearGradient
      colors={['#000', '#1C1C1C', 'rgba(90,26,26,0.6)']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" style={{ marginRight: 12 }} />
          </TouchableOpacity>
          <View style={styles.headerUser}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.headerAvatar}
            />
            <Text style={styles.headerName}>{user.displayName || "Profil"}</Text>
          </View>
        </View>

        {/* Centré verticalement */}
        <ScrollView
          contentContainerStyle={[styles.content, { flex: 1, justifyContent: "center" }]}
        >
          {/* Avatar cliquable */}
          <TouchableOpacity onPress={() => setPhotoModal(true)}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarLarge}
            />
          </TouchableOpacity>
          <Text style={styles.profileName}>{user.displayName}</Text>
          <Text style={styles.profileMeta}>
            {user.civility ? user.civility : ""}
            {user.civility && user.age ? " | " : ""}
            {user.age ? `${user.age} ans` : ""}
          </Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </ScrollView>

        {/* Modal plein écran pour la photo */}
        <Modal
          visible={photoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoModal(false)}
        >
          <TouchableOpacity
            style={styles.photoModalBg}
            onPress={() => setPhotoModal(false)}
            activeOpacity={1}
          >
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarFull}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>
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
    backgroundColor: "#d1d1d1",
  },
  headerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    alignItems: "center",
    padding: 28,
    flex: 1,
    justifyContent: "center",
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 18,
    backgroundColor: "#eee",
  },
  profileName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 6,
    textAlign: "center",
  },
  profileMeta: {
    color: "#fff",
    marginVertical: 4,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    opacity: 0.8,
  },
  bio: {
    color: "#ccc",
    marginTop: 14,
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  photoModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFull: {
    width: "90%",
    height: "70%",
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#fff",
  },
});
