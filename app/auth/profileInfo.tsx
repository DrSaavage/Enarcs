// app/auth/profileInfo.tsx
import { auth, firestore } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FEED_ROUTE = '/(tabs)/feed';

export default function ProfileInfo() {
  const router = useRouter();
  const [civility, setCivility] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');

  async function handleSaveProfile() {
    if (!civility.trim() || !age.trim() || !bio.trim()) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Utilisateur non connecté');
      await setDoc(
        doc(firestore, 'users', uid),
        { civility: civility.trim(), age: Number(age), bio: bio.trim() },
        { merge: true }
      );
      router.replace(FEED_ROUTE);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible d'enregistrer");
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

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, position: 'relative' },
  backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
  backArrow: { fontSize: 28, color: 'white', fontWeight: 'bold' },
  content: { alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#222', padding: 14, borderRadius: 8, marginBottom: 16, color: 'white' },
  button: { backgroundColor: 'white', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, marginBottom: 20 },
  buttonText: { color: 'black', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  link: { color: 'white', marginTop: 10, textDecorationLine: 'underline' },
});
