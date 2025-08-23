//app/auth/login.tsx
import { auth } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/feed');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  }

  async function handleGuest() {
    try {
      await signInAnonymously(auth);
      router.replace('/feed'); // continue en invité sur le feed
    } catch (e: any) {
      Alert.alert('Invité indisponible', e.message || 'Impossible de se connecter en invité.');
    }
  }

  return (
    <LinearGradient
      colors={['#000000', '#1C1C1C', 'rgba(90, 26, 26, 0.6)']}
      style={styles.container}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
    >
      {/* Flèche Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Connexion</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <Text style={styles.link}>Pas encore de compte ? S’inscrire</Text>
        </TouchableOpacity>

        {/* Lien invité */}
        <Text style={styles.guestText} onPress={handleGuest}>
          Continuer en invité
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 20,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#222',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    color: 'white',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  link: {
    color: 'white',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  guestText: {
    marginTop: 16,
    color: '#D1D5DB',
    textDecorationLine: 'underline',
  },
});
