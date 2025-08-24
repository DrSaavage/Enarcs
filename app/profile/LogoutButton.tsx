// Path: app/(tabs)/profile/logoutButton.tsx
import ShotgunButton from "@/components/ui/ShotgunButton";
import { auth } from "@/lib/firebase";
import { gradientColors, gradientConfig } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function logoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth); // 🔹 vraie déconnexion Firebase
      router.replace("/auth/login"); // navigation forcée

      setTimeout(() => {
        Alert.alert("Déconnexion", "Tu es maintenant déconnecté.");
      }, 200);
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de se déconnecter.");
    }
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Se déconnecter</Text>

        {/* Bouton Déconnexion */}
        <ShotgunButton
          label="Déconnexion"
          onPress={handleLogout}
          style={{ marginBottom: 20 }}
        />

        {/* Bouton Retour */}
        <ShotgunButton
          label="Retour"
          onPress={() => router.back()}
          style={{ marginBottom: 20 }}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    letterSpacing: 0.5,
  },
});
