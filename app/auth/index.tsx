// Path: app/index.tsx
// "Continuer en invité" avec gestion d'erreurs (auth/admin-restricted-operation, etc.)
import { auth } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInAnonymously } from 'firebase/auth';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();

  async function handleGuest() {
    try {
      await signInAnonymously(auth);   // STYLE: nécessite Anonymous=ON dans Firebase
      router.replace('/(tabs)/feed');      // STYLE: en invité, on n’ouvre que /home
    } catch (e: any) {
      // Erreur la plus fréquente: provider non activé
      const msg = String(e?.code || e?.message || '').includes('admin-restricted')
        ? "Active 'Anonymous' dans Firebase → Authentication → Sign-in method."
        : (e?.message || 'Échec de la connexion invitée.');
      Alert.alert('Invité indisponible', msg);
    }
  }

  return (
    <LinearGradient
      colors={['#000000', '#1C1C1C', 'rgba(90, 26, 26, 0.6)']}
      style={styles.container}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={styles.title}>enarcs</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/signup')}>
          <Text style={styles.buttonText}>S'inscrire</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/login')}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>

      {/* Lien texte invité (pas bouton) */}
      <Text style={styles.guestText} onPress={handleGuest}>
        Continuer en invité
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 48, fontWeight: 'bold', color: 'white', marginBottom: 60 },
  buttonContainer: { width: '90%', gap: 16 },
  button: {
    backgroundColor: '#fff',        // change la couleur de fond des boutons
    paddingVertical: 14,            // hauteur des boutons
    borderRadius: 8,                // arrondi
    alignItems: 'center',
  },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  guestText: {
    marginTop: 16,                  // espace au-dessus du lien invité
    color: '#D1D5DB',               // couleur du lien invité
    textDecorationLine: 'underline' // apparence "texte cliquable"
  },
});
