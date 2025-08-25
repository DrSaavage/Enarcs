// app/(tabs)/profileMain.tsx
import { auth, firestore } from "@/lib/firebase";
import PageContainer from "@/theme/PageContainer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function ProfileMain() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sections = [
    { label: "Mes informations", icon: "person-outline", route: "/profile/privateProfile" },
    { label: "Paramètres", icon: "settings-outline", route: "/profile/settings" },
    { label: "Sécurité", icon: "lock-closed-outline", route: "/profile/security" },
    { label: "Déconnexion", icon: "exit-outline", route: "/profile/logoutButton", danger: true },
  ];

  // 🔹 Surveille l'état auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u || u.isAnonymous) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const ref = doc(firestore, "users", u.uid);
        const snap = await getDoc(ref);
        setUser(
          snap.exists()
            ? { uid: u.uid, ...snap.data() }
            : { uid: u.uid, email: u.email, displayName: u.displayName }
        );
      } catch (e) {
        console.error("Error fetching user:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Mon profil" showBackButton={false}>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      </PageContainer>
    );
  }

  // 🔹 Si pas connecté(e) → message + boutons
  if (!user) {
    return (
      <PageContainer title="Mon profil" showBackButton={false}>
        <ScrollView contentContainerStyle={styles.center}>
          <Text style={{ color: "#fff", marginBottom: 20 }}>
            Vous n'êtes pas connecté(e).
          </Text>

          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.authButton,
              { backgroundColor: "transparent", borderWidth: 1, borderColor: "#fff" },
            ]}
            onPress={() => router.replace("/auth/signup")}
          >
            <Text style={[styles.authButtonText, { color: "#fff" }]}>
              Créer un compte
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </PageContainer>
    );
  }

  // 🔹 Utilisateur connecté → sections
  const handleSectionPress = (section: any) => router.push(section.route);

  return (
    <PageContainer title="Mon profil" showBackButton={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {sections.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.section, section.danger && { borderColor: "red" }]}
            onPress={() => handleSectionPress(section)}
          >
            <Ionicons
              name={section.icon as any}
              size={22}
              color={section.danger ? "red" : "#fff"}
              style={styles.icon}
            />
            <Text
              style={[
                styles.label,
                section.danger && { color: "red", fontWeight: "600" },
              ]}
            >
              {section.label}
            </Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={section.danger ? "red" : "#fff"}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  section: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  icon: { marginRight: 14 },
  label: { flex: 1, fontSize: 16, color: "white" },
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
