// Path: app/profile/[userId].tsx
import { auth, firestore } from "@/lib/firebase";
import type { Pricing, User } from "@/types"; // ✅ use shared types
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type PublicUser = Partial<User>; // tolerant shape for Firestore reads

const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

export default function PublicProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoModal, setPhotoModal] = useState(false);

  // Mini aperçus de médias (dernier contenu du feed de l’auteur)
  const [latestMedia, setLatestMedia] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!userId) return;
      try {
        const ref = doc(firestore, "users", userId);
        const snap = await getDoc(ref);
        const u = (snap.exists() ? (snap.data() as PublicUser) : null);

        if (mounted) setUser(u);

        // Charger quelques médias depuis les posts publics de l’auteur
        try {
          const postsQ = query(
            collection(firestore, "posts"),
            where("authorId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(6)
          );
          const postsSnap = await getDocs(postsQ);
          const medias: string[] = [];
          postsSnap.forEach((d) => {
            const data = d.data() as any;
            if (Array.isArray(data.mediaUrls) && data.mediaUrls[0]) {
              medias.push(data.mediaUrls[0]);
            }
          });
          if (mounted) setLatestMedia(medias);
        } catch {
          // silent
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const avatarUri = useMemo(
    () => (user?.avatar && String(user.avatar).trim().length > 0 ? String(user.avatar) : FALLBACK_AVATAR),
    [user?.avatar]
  );

  const displayName =
    (user?.displayName && user.displayName.trim()) ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "Profil";

  const fmt = (n?: number | null) =>
    typeof n === "number" && !isNaN(n) ? n.toLocaleString("fr-FR") : "—";

  const formatPrice = (n?: number) =>
    typeof n === "number" && !isNaN(n) ? `${n.toFixed(0)} €` : "—";

  function requireAuthOrInvite(action: () => void) {
    const u = auth.currentUser;
    if (!u || u.isAnonymous) {
      Alert.alert("Connexion requise", "Connecte-toi pour continuer.", [
        { text: "Annuler", style: "cancel" },
        { text: "Se connecter", onPress: () => router.push("/auth/login") },
        { text: "Créer un compte", onPress: () => router.push("/auth/signup") },
      ]);
      return;
    }
    action();
  }

  // CTA (à brancher plus tard)
  const handleStartDM = () =>
    requireAuthOrInvite(() => Alert.alert("Message privé", "Déclenchement achat/accès DM (à brancher)."));
  const handleStartAudio = () =>
    requireAuthOrInvite(() => Alert.alert("Appel audio", "Paiement + création chat audio (à brancher)."));
  const handleStartVideo = () =>
    requireAuthOrInvite(() => Alert.alert("Appel vidéo", "Paiement + création chat vidéo (à brancher)."));
  const handleBuyMedia = () =>
    requireAuthOrInvite(() => Alert.alert("Médias premium", "Achat média(s) (à brancher)."));
  const handleBuySession = (label: string, price: number) =>
    requireAuthOrInvite(() => Alert.alert("Session", `Achat du pack "${label}" (${formatPrice(price)}) (à brancher).`));

  if (loading) {
    return (
      <LinearGradient colors={["#000", "#1C1C1C", "rgba(90,26,26,0.6)"]} style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color="#fff" size="large" />
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={["#000", "#1C1C1C", "rgba(90,26,26,0.6)"]} style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ color: "#fff", textAlign: "center" }}>Utilisateur introuvable</Text>
      </LinearGradient>
    );
  }

  const p: Pricing | undefined = user.pricing;

  return (
    <LinearGradient colors={["#000", "#1C1C1C", "rgba(90,26,26,0.6)"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" style={{ marginRight: 12 }} />
          </TouchableOpacity>
          <View style={styles.headerUser}>
            <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
            <Text style={styles.headerName}>{displayName}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero / Avatar */}
          <TouchableOpacity onPress={() => setPhotoModal(true)} activeOpacity={0.8}>
            <Image source={{ uri: avatarUri }} style={styles.avatarLarge} />
          </TouchableOpacity>

          {/* Nom + meta */}
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileMeta}>
            {user.civility ? user.civility : ""}
            {!!user.civility && !!user.age ? " • " : ""}
            {user.age ? `${user.age} ans` : ""}
            {!!(user.age || user.civility) && user.nationality ? " • " : ""}
            {user.nationality ?? ""}
          </Text>

          {user.role ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user.role}</Text>
            </View>
          ) : null}

          {/* Bio */}
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          {/* Stats simples */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{fmt(user.followersCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{fmt(user.postsCount)}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{latestMedia.length}</Text>
              <Text style={styles.statLabel}>Médias</Text>
            </View>
          </View>

          {/* Aperçu médias récents */}
          {latestMedia.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Derniers médias</Text>
              <View style={styles.mediaGrid}>
                {latestMedia.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.mediaItem} />
                ))}
              </View>
            </>
          ) : null}

          {/* Offres & Tarifs */}
          <Text style={styles.sectionTitle}>Offres & Tarifs</Text>
          <View style={styles.cards}>
            {/* DM */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
                <Text style={styles.cardTitle}>Message privé</Text>
              </View>
              <Text style={styles.cardPrice}>{formatPrice(p?.dm?.price)}</Text>
              <Text style={styles.cardDesc}>Discuter par écrit avec {displayName}.</Text>
              <TouchableOpacity style={styles.cardCTA} onPress={handleStartDM}>
                <Text style={styles.cardCTAText}>Envoyer un message</Text>
              </TouchableOpacity>
            </View>

            {/* Audio */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="call-outline" size={20} color="#fff" />
                <Text style={styles.cardTitle}>Appel audio</Text>
              </View>
              <Text style={styles.cardPrice}>
                {formatPrice(p?.audioCall?.price)} {p?.audioCall?.durationMin ? ` / ${p.audioCall.durationMin} min` : ""}
              </Text>
              <Text style={styles.cardDesc}>Appel vocal direct.</Text>
              <TouchableOpacity style={styles.cardCTA} onPress={handleStartAudio}>
                <Text style={styles.cardCTAText}>Réserver un audio</Text>
              </TouchableOpacity>
            </View>

            {/* Video */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="videocam-outline" size={20} color="#fff" />
                <Text style={styles.cardTitle}>Appel vidéo</Text>
              </View>
              <Text style={styles.cardPrice}>
                {formatPrice(p?.videoCall?.price)} {p?.videoCall?.durationMin ? ` / ${p.videoCall.durationMin} min` : ""}
              </Text>
              <Text style={styles.cardDesc}>Face à face en vidéo.</Text>
              <TouchableOpacity style={styles.cardCTA} onPress={handleStartVideo}>
                <Text style={styles.cardCTAText}>Réserver une vidéo</Text>
              </TouchableOpacity>
            </View>

            {/* Medias */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="images-outline" size={20} color="#fff" />
                <Text style={styles.cardTitle}>Médias premium</Text>
              </View>
              <Text style={styles.cardPrice}>
                {p?.media?.pricePerItem ? `${formatPrice(p.media.pricePerItem)} / média` : "—"}
              </Text>
              <Text style={styles.cardDesc}>Acheter des médias exclusifs.</Text>
              <TouchableOpacity style={styles.cardCTA} onPress={handleBuyMedia}>
                <Text style={styles.cardCTAText}>Acheter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Packs / Sessions suivies */}
          {p?.sessions?.packages?.length ? (
            <>
              <Text style={styles.sectionTitle}>Sessions & Suivi</Text>
              <View style={{ gap: 12, width: "100%" }}>
                {p.sessions.packages!.map((pack, idx) => (
                  <View key={idx} style={styles.sessionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionTitle}>{pack.label}</Text>
                      {pack.includes ? <Text style={styles.sessionDesc}>{pack.includes}</Text> : null}
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.sessionPrice}>{formatPrice(pack.price)}</Text>
                      <TouchableOpacity style={styles.sessionCTA} onPress={() => handleBuySession(pack.label, pack.price)}>
                        <Text style={styles.sessionCTAText}>Choisir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modal plein écran pour la photo */}
        <Modal visible={photoModal} transparent animationType="fade" onRequestClose={() => setPhotoModal(false)}>
          <TouchableOpacity style={styles.photoModalBg} onPress={() => setPhotoModal(false)} activeOpacity={1}>
            <Image source={{ uri: avatarUri }} style={styles.avatarFull} resizeMode="contain" />
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
  headerUser: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#d1d1d1",
  },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  content: { padding: 18, paddingBottom: 26, alignItems: "center" },

  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 14,
    backgroundColor: "#eee",
  },
  profileName: { color: "#fff", fontWeight: "bold", fontSize: 22, marginBottom: 4, textAlign: "center" },
  profileMeta: { color: "#fff", opacity: 0.85, fontSize: 14, marginBottom: 10, textAlign: "center" },
  badge: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: "#fff", fontWeight: "600", fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase" },
  bio: { color: "#ddd", marginTop: 12, fontSize: 15, textAlign: "center" },

  stats: { flexDirection: "row", gap: 16, marginTop: 18, marginBottom: 8 },
  statItem: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statLabel: { color: "#bbb", fontSize: 12, marginTop: 2 },

  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", alignSelf: "flex-start", marginTop: 18, marginBottom: 10 },

  mediaGrid: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  mediaItem: { width: "31.6%", aspectRatio: 1, borderRadius: 10, backgroundColor: "#222" },

  cards: { width: "100%", gap: 12 },
  card: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cardPrice: { color: "#fff", fontWeight: "800", fontSize: 18, marginVertical: 4 },
  cardDesc: { color: "#cfcfcf", fontSize: 13, marginBottom: 10 },
  cardCTA: { backgroundColor: "#fff", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  cardCTAText: { color: "#000", fontWeight: "700" },

  sessionRow: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sessionDesc: { color: "#cfcfcf", fontSize: 13, marginTop: 2 },
  sessionPrice: { color: "#fff", fontWeight: "800", fontSize: 16 },
  sessionCTA: { marginTop: 6, backgroundColor: "#fff", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  sessionCTAText: { color: "#000", fontWeight: "700" },

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
