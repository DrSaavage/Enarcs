// app/(tabs)/createPost.tsx
import { auth, firestore } from '@/lib/firebase';
import { uploadPostImage } from '@/lib/uploadPostImage';
import PageContainer from '@/theme/PageContainer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';

export default function CreatePost() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Champs du post
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Protéger l’accès (comme tes autres tabs protégées)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u && !u.isAnonymous ? u : null);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorise l’accès Photos dans les réglages.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Non connecté', 'Connecte-toi pour créer un post.');
      return;
    }
    if (!title.trim() && !content.trim() && !imageUri) {
      Alert.alert('Champs vides', 'Ajoute au moins un titre, un contenu ou une image.');
      return;
    }

    try {
      setSaving(true);

      const postsCol = collection(firestore, 'posts');
      const ref = doc(postsCol);
      let finalImageUrl: string | undefined;

      if (imageUri) {
        finalImageUrl = await uploadPostImage(imageUri, ref.id);
      }

      await setDoc(ref, {
        id: ref.id,
        authorId: user.uid,
        title: title.trim() || null,
        content: content.trim() || null,
        mediaUrls: finalImageUrl ? [finalImageUrl] : [],
        price: price ? Number(price) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Reset
      setTitle('');
      setContent('');
      setPrice('');
      setImageUri(null);

      // Retour au feed (il se mettra à jour via onSnapshot)
      router.replace('/(tabs)/feed');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de créer le post.');
    } finally {
      setSaving(false);
    }
  };

  // États d’accès
  if (loadingAuth) {
    return (
      <PageContainer title="Créer" showBackButton={false}>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="Créer" showBackButton={false}>
        <ScrollView contentContainerStyle={styles.center}>
          <Text style={{ color: '#fff', marginBottom: 20 }}>Vous n'êtes pas connecté(e).</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#fff' }]}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={[styles.authButtonText, { color: '#fff' }]}>Créer un compte</Text>
          </TouchableOpacity>
        </ScrollView>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Créer" showBackButton={false}>
      <ScrollView contentContainerStyle={styles.form}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.75}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={{ color: '#aaa' }}>Ajouter une image</Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Titre (optionnel)"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          placeholder="Contenu (optionnel)"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
        />
        <TextInput
          style={styles.input}
          placeholder="Prix (ex: 20)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.6 }]} onPress={handleCreate} disabled={saving}>
          <Text style={styles.primaryBtnText}>{saving ? 'Création...' : 'Publier'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  form: { padding: 18, paddingBottom: 60 },
  imagePicker: {
    backgroundColor: '#333',
    borderRadius: 12,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  authButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginVertical: 8,
    width: 200,
    alignItems: 'center',
  },
  authButtonText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
});
