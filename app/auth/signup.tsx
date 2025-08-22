// app/auth/signup.tsx
import { auth, firestore } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();

  // 🔹 Champs auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🔹 Champs profil utilisateur
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [nationality, setNationality] = useState('');
  const [bio, setBio] = useState('');
  const [civility, setCivility] = useState<'M' | 'Mme' | 'Autre'>('M');
  const [phone, setPhone] = useState('');

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !firstName.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // 🔹 Création du compte auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 🔹 Création du document utilisateur dans Firestore
      await setDoc(doc(firestore, 'users', uid), {
        uid,
        email,
        firstName,
        lastName,
        age: age ? Number(age) : undefined,
        nationality,
        bio,
        civility,
        phone,
        role: 'client', // ou 'influencer' si tu veux offrir le choix
        avatar: '', // avatar vide par défaut
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      router.replace('/home'); // ou '/profile' pour compléter le profil
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <LinearGradient
      colors={['#000000', '#1C1C1C', 'rgba(90, 26, 26, 0.6)']}
      style={styles.container}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Flèche Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Créer un compte</Text>

        {/* 🔹 Inputs */}
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
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          placeholderTextColor="#ccc"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Nom"
          placeholderTextColor="#ccc"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Âge"
          placeholderTextColor="#ccc"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Nationalité"
          placeholderTextColor="#ccc"
          value={nationality}
          onChangeText={setNationality}
        />
        <TextInput
          style={styles.input}
          placeholder="Bio"
          placeholderTextColor="#ccc"
          value={bio}
          onChangeText={setBio}
        />
        <TextInput
          style={styles.input}
          placeholder="Téléphone"
          placeholderTextColor="#ccc"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* 🔹 Boutons */}
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>S’inscrire</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
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
    width: '100%',
    alignItems: 'center',
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
