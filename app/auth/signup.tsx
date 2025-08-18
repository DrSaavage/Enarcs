// app/auth.signup.tsx
import { auth } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace('/auth/profileInfo');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
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
        <Text style={styles.title}>Créer un compte</Text>
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
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>S’inscrire</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative', // important pour position absolute du back
  },
  backButton: {
    position: 'absolute',
    top: 70, // ajuster selon safe area ou status bar, peut être plus petit selon device
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
});
