// Path: app/(tabs)/myCircle.tsx
import { auth, firestore } from "@/lib/firebase";
import PageContainer from "@/theme/PageContainer";
import { useRouter } from "expo-router";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Influencer = {
  uid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  role?: "influencer" | "client";
};

export default function myCircleScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // liste des influenceurs liés à des chats payés
  const [infLoading, setInfLoading] = useState(true);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u && !u.isAnonymous ? u : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // charger les influenceurs pour lesquels l’utilisateur a payé (chats.accessGranted = true)
  useEffect(() => {
    if (!user) {
      setInfluencers([]);
      setInfLoading(false);
      return;
    }

    setInfLoading(true);

    const qChats = query(
      collection(firestore, "chats"),
      where("participants", "array-contains", user.uid),
      where("accessGranted", "==", true)
    );

    const unsub = onSnapshot(
      qChats,
      async (snap) => {
        const others = new Set<string>();
        snap.forEach((d) => {
          const data = d.data() as { participants?: string[] };
          (data.participants || []).forEach((p) => {
            if (p && p !== user.uid) others.add(p);
          });
        });

        const uids = Array.from(others);
        if (uids.length === 0) {
          setInfluencers([]);
          setInfLoading(false);
          return;
        }

        // where("uid","in", [...]) en chunks de 10
        const usersCol = collection(firestore, "users");
        const chunkSize = 10;
        const loaded: Influencer[] = [];

        for (let i = 0; i < uids.length; i += chunkSize) {
          const chunk = uids.slice(i, i + chunkSize);
          const qUsers = query(usersCol, where("uid", "in", chunk));
          const qs = await getDocs(qUsers);
          qs.forEach((doc) => {
            const data = doc.data() as Influencer;
            loaded.push({
              uid: data.uid || doc.id,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              avatar: data.avatar,
              role: data.role,
            });
          });
        }

        // uniquement les influenceurs, dédoublonnés
        const map = new Map<string, Influencer>();
        loaded
          .filter((p) => p.role === "influencer")
          .forEach((p) => map.set(p.uid, p));

        setInfluencers(Array.from(map.values()));
        setInfLoading(false);
      },
      () => {
        setInfluencers([]);
        setInfLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <PageContainer title="Mon cercle" showBackButton={false}>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="Mon cercle" showBackButton={false}>
        <ScrollView contentContainerStyle={styles.center}>
          <Text style={{ color: "#fff", marginBottom: 20 }}>Vous n'êtes pas connecté(e).</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.push("/auth/login")}>
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: "transparent", borderWidth: 1, borderColor: "#fff" }]}
            onPress={() => router.push("/auth/signup")}
          >
            <Text style={[styles.authButtonText, { color: "#fff" }]}>Créer un compte</Text>
          </TouchableOpacity>
        </ScrollView>
      </PageContainer>
    );
  }

  // connecté
  return (
    <PageContainer title="Mon cercle" showBackButton={false}>
      {infLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : influencers.length === 0 ? (
        // État vide centré comme "Aucune conversation"
        <View style={styles.center}>
          <Text style={{ color: "#aaa" }}>Aucun abonnement ou paiement en cours</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {influencers.map((item) => {
            const fullName =
              [item.firstName, item.lastName].filter(Boolean).join(" ") ||
              item.email?.split("@")[0] ||
              "";
            const avatarSrc =
              item.avatar && item.avatar.startsWith("http")
                ? { uri: item.avatar }
                : require("@/assets/images/avatar-placeholder.png");

            return (
              <Pressable
                key={item.uid}
                style={styles.row}
                onPress={() => router.push(`/profile/${item.uid}`)}
              >
                <Image source={avatarSrc} style={styles.avatar} />
                <Text style={styles.name}>{fullName}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  text: { color: "#fff", fontSize: 16 },
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

  // liste minimaliste
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomColor: "rgba(255,255,255,0.06)",
    borderBottomWidth: 1,
    gap: 12,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: "#232345",
    borderWidth: 1,
    borderColor: "#ffffff20",
  },
  name: { color: "#fff", fontSize: 16, fontWeight: "500", flex: 1 },
});
