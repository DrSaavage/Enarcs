// app/auth/profileInfo.tsx
import { auth, firestore } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileInfo() {
  const router = useRouter();
  const [civility, setCivility] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');

  async function handleSaveProfile() {
    if (!civility || !age || !bio) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("User non connecté");
      await setDoc(doc(firestore, "users", uid), {
        civility, age: Number(age), bio
      }, { merge: true });
      router.replace('/home');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer');
    }
  }

  return (
    <LinearGradient colors={['#000', '#1C1C1C', 'rgba(90,26,26,0.6)']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profil</Text>
        <TextInput
          style={styles.input}
          placeholder="Civilité (Monsieur, Madame, ...)"
          placeholderTextColor="#ccc"
          value={civility}
          onChangeText={setCivility}
        />
        <TextInput
          style={styles.input}
          placeholder="Âge"
          placeholderTextColor="#ccc"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />
        <TextInput
          style={styles.input}
          placeholder="Bio"
          placeholderTextColor="#ccc"
          value={bio}
          onChangeText={setBio}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
          <Text style={styles.buttonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = {
//const styles = StyleSheet.create({
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
};

