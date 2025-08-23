// app/(tabs)/messagesList.tsx
import { auth } from "@/lib/firebase";
import PageContainer from "@/theme/PageContainer";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MessagesList() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u && !u.isAnonymous ? u : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Messages" showBackButton={false}>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      </PageContainer>
    );
  }

  // 🔹 Si pas connecté(e) → message + boutons
  if (!user) {
    return (
      <PageContainer title="Messages" showBackButton={false}>
        <View style={styles.center}>
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
        </View>
      </PageContainer>
    );
  }

  // 🔹 Utilisateur connecté → contenu normal
  return (
    <PageContainer title="Messages" showBackButton={false}>
      <View style={styles.content}>
        <Text style={styles.text}>Liste des messages ici...</Text>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
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
