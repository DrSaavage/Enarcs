// app/auth/locked.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LockedScreen() {
  const router = useRouter();
  return (
    <LinearGradient colors={['#000000', '#1C1C1C', 'rgba(90, 26, 26, 0.6)']} style={styles.container} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Se connecter pour continuer</Text>
        <Text style={styles.subtitle}>Cette section est réservée aux utilisateurs connectés.</Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.button}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <Text style={styles.link}>Pas encore de compte ? S’inscrire</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: 'white' },
  subtitle: { color: '#D1D5DB', marginTop: 8 },
  button: { backgroundColor: 'white', paddingVertical: 12, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  buttonText: { color: 'black', fontWeight: '700' },
  link: { color: '#D1D5DB', marginTop: 12, textDecorationLine: 'underline' },
});
