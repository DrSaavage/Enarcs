// Path: app/(tabs)/profile/profileMain.tsx
import { auth, firestore } from "@/lib/firebase";
import PageContainer from "@/theme/PageContainer";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function profileMain() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sections = [
    { label: "Mes informations", icon: "person-outline", route: "/profile/PersonalInfo" },
    { label: "Paramètres", icon: "settings-outline", route: "/profile/settings" },
    { label: "Sécurité", icon: "lock-closed-outline", route: "/profile/security" },
    { label: "Déconnexion", icon: "exit-outline", route: "/profile/logoutButton", danger: true },
  ];

  // 🔹 Détection auth en temps réel
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (u && !u.isAnonymous) {
          const ref = doc(firestore, "users", u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setUser({ uid: u.uid, ...snap.data() });
          } else {
            setUser({ uid: u.uid, email: u.email, displayName: u.displayName });
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // 🔹 Protection focus: redirige si déconnecté ou invité
  useFocusEffect(
    useCallback(() => {
      if (!auth.currentUser || auth.currentUser.isAnonymous) {
        router.replace("/auth/login");
      }
    }, [])
  );

  const handleSectionPress = (section: any) => {
    router.push(section.route);
  };

  if (loading) {
    return (
      <PageContainer title="Mon profil" showBackButton={false}>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="Mon profil" showBackButton={false}>
        <ScrollView contentContainerStyle={[styles.scroll, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#fff", opacity: 0.8, marginBottom: 20 }}>
            Aucun utilisateur connecté.
          </Text>

          <TouchableOpacity style={styles.authButton} onPress={() => router.replace("/auth/login")}>
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: "transparent", borderWidth: 1, borderColor: "#fff" }]}
            onPress={() => router.replace("/auth/signup")}
          >
            <Text style={[styles.authButtonText, { color: "#fff" }]}>Créer un compte</Text>
          </TouchableOpacity>
        </ScrollView>
      </PageContainer>
    );
  }

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
            <Text style={[styles.label, section.danger && { color: "red", fontWeight: "600" }]}>
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
