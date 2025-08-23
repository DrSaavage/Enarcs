// app/auth/index.tsx
import { auth } from "@/lib/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signInAnonymously } from "firebase/auth";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AuthIndex() {
  const router = useRouter();

  async function handleGuest() {
    try {
      await signInAnonymously(auth);
      router.replace("/feed"); // invité va sur le feed
    } catch (e: any) {
      const msg = String(e?.code || e?.message || "").includes("admin-restricted")
        ? "Active 'Anonymous' dans Firebase → Authentication → Sign-in method."
        : e?.message || "Échec de la connexion invitée.";
      Alert.alert("Invité indisponible", msg);
    }
  }

  return (
    <LinearGradient
      colors={["#000000", "#1C1C1C", "rgba(90, 26, 26, 0.6)"]}
      style={styles.container}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={styles.title}>enarcs</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={styles.buttonText}>S'inscrire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>

      {/* Lien invité */}
      <Text style={styles.guestText} onPress={handleGuest}>
        Continuer en invité
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    marginBottom: 60,
  },
  buttonContainer: {
    width: "90%",
    gap: 16,
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  guestText: {
    marginTop: 16,
    color: "#D1D5DB",
    textDecorationLine: "underline",
  },
});
