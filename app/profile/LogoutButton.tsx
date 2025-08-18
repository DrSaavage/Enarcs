// /app/(tabs)/profile/LogoutButton.tsx

import ShotgunButton from "@/components/ShotgunButton";
import { gradientColors, gradientConfig } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function LogOutButton() {
  const router = useRouter();
  const handleLogout = () => {
    Alert.alert("Déconnexion", "Tu es maintenant déconnecté.");
    // Ajoute ici la vraie logique de logout si besoin
    router.replace("/auth/login");
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
        <ShotgunButton
          label="Déconnexion"
          onPress={handleLogout}
          style={{ marginBottom: 20 }}
        />
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    letterSpacing: 0.5,
  },
});
