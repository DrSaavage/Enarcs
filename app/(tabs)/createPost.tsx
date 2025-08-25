// Path: app/(tabs)/createPost.tsx
// Description: New layout tweaks — no top spacing, removed "Réservé aux abonnés", smaller "Ajouter une image" area.
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type PackageItem = { label: string; price: string; includes?: string };

export default function CreatePost() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Basic post fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Offerings toggles
  const [enableAudio, setEnableAudio] = useState(false);
  const [enableVideo, setEnableVideo] = useState(false);
  const [enableMedia, setEnableMedia] = useState(false);
  const [enableSessions, setEnableSessions] = useState(false);

  // Offerings details
  const [audioPrice, setAudioPrice] = useState('');
  const [audioDuration, setAudioDuration] = useState(''); // minutes

  const [videoPrice, setVideoPrice] = useState('');
  const [videoDuration, setVideoDuration] = useState(''); // minutes

  const [mediaPricePerItem, setMediaPricePerItem] = useState('');

  const [packages, setPackages] = useState<PackageItem[]>([]);

  // Media attachment
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Auth gate
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
      Alert.alert('Permission refusée', "Autorise l’accès Photos dans les réglages.");
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

  const addPackage = () => setPackages((p) => [...p, { label: '', price: '', includes: '' }]);
  const updatePackage = (idx: number, patch: Partial<PackageItem>) =>
    setPackages((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removePackage = (idx: number) =>
    setPackages((p) => p.filter((_, i) => i !== idx));

  const numericOrNull = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : null;
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

      // Build offerings object only with enabled sections
      const offerings: any = {};
      if (enableAudio) {
        offerings.audioCall = {
          price: numericOrNull(audioPrice) ?? undefined,
          durationMin: numericOrNull(audioDuration) ?? undefined,
        };
      }
      if (enableVideo) {
        offerings.videoCall = {
          price: numericOrNull(videoPrice) ?? undefined,
          durationMin: numericOrNull(videoDuration) ?? undefined,
        };
      }
      if (enableMedia) {
        offerings.media = {
          pricePerItem: numericOrNull(mediaPricePerItem) ?? undefined,
        };
      }
      if (enableSessions) {
        const cleaned = packages
          .map((p) => ({
            label: p.label.trim(),
            price: numericOrNull(p.price) ?? undefined,
            includes: p.includes?.trim() || undefined,
          }))
          .filter((p) => p.label || p.price != null);
        if (cleaned.length) {
          offerings.sessions = { packages: cleaned };
        }
      }

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
        // ⛔️ isSubscriberOnly removed from UI/save per your request
        offerings: Object.keys(offerings).length ? offerings : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Reset and go back to feed
      setTitle('');
      setContent('');
      setImageUri(null);
      setEnableAudio(false);
      setEnableVideo(false);
      setEnableMedia(false);
      setEnableSessions(false);
      setAudioPrice('');
      setAudioDuration('');
      setVideoPrice('');
      setVideoDuration('');
      setMediaPricePerItem('');
      setPackages([]);

      router.replace('/(tabs)/feed');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de créer le post.');
    } finally {
      setSaving(false);
    }
  };

  // UI states
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
          <Text style={{ color: '#fff', marginBottom: 20 }}>Vous n'êtes pas connecté.</Text>
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
        {/* 1) Titre */}
        <Text style={[styles.sectionTitle, styles.firstSection]}>Titre</Text>
        <TextInput
          style={styles.input}
          placeholder="Titre du post"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />

        {/* 2) Contenu */}
        <Text style={styles.sectionTitle}>Contenu</Text>
        <TextInput
          style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          placeholder="Raconte quelque chose…"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
        />

        {/* 3) Calls & Services */}
        <Text style={styles.sectionTitle}>Calls & Services</Text>

        {/* Audio */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleTitle}>Appel audio</Text>
            <Switch value={enableAudio} onValueChange={setEnableAudio} />
          </View>
          {enableAudio && (
            <View style={styles.grid2}>
              <TextInput
                style={styles.input}
                placeholder="Prix (€)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={audioPrice}
                onChangeText={setAudioPrice}
              />
              <TextInput
                style={styles.input}
                placeholder="Durée (min)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={audioDuration}
                onChangeText={setAudioDuration}
              />
            </View>
          )}
        </View>

        {/* Video */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleTitle}>Appel vidéo</Text>
            <Switch value={enableVideo} onValueChange={setEnableVideo} />
          </View>
          {enableVideo && (
            <View style={styles.grid2}>
              <TextInput
                style={styles.input}
                placeholder="Prix (€)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={videoPrice}
                onChangeText={setVideoPrice}
              />
              <TextInput
                style={styles.input}
                placeholder="Durée (min)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={videoDuration}
                onChangeText={setVideoDuration}
              />
            </View>
          )}
        </View>

        {/* Medias premium */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleTitle}>Médias premium</Text>
            <Switch value={enableMedia} onValueChange={setEnableMedia} />
          </View>
          {enableMedia && (
            <TextInput
              style={styles.input}
              placeholder="Prix par média (€)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={mediaPricePerItem}
              onChangeText={setMediaPricePerItem}
            />
          )}
        </View>

        {/* Sessions/Packs */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleTitle}>Sessions / Packs</Text>
            <Switch value={enableSessions} onValueChange={setEnableSessions} />
          </View>

          {enableSessions && (
            <View style={{ gap: 10 }}>
              {packages.map((p, idx) => (
                <View key={idx} style={styles.packageRow}>
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    placeholder="Nom du pack (ex: Coaching 1h)"
                    placeholderTextColor="#999"
                    value={p.label}
                    onChangeText={(v) => updatePackage(idx, { label: v })}
                  />
                  <TextInput
                    style={[styles.input, styles.w120]}
                    placeholder="Prix (€)"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={p.price}
                    onChangeText={(v) => updatePackage(idx, { price: v })}
                  />
                  <TouchableOpacity onPress={() => removePackage(idx)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>×</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Détails (optionnel)"
                    placeholderTextColor="#999"
                    value={p.includes}
                    onChangeText={(v) => updatePackage(idx, { includes: v })}
                  />
                </View>
              ))}

              <TouchableOpacity onPress={addPackage} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>+ Ajouter un pack</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4) Ajouter un média (réduit) */}
        <Text style={styles.sectionTitle}>Ajouter un média</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.75}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={{ color: '#aaa' }}>Ajouter une image</Text>
          )}
        </TouchableOpacity>

        {/* Create */}
        <TouchableOpacity
          style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={saving}
        >
          <Text style={styles.primaryBtnText}>{saving ? 'Création…' : 'Publier'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  // No top space
  form: { paddingHorizontal: 18, paddingTop: 0, paddingBottom: 72, gap: 8 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 12, marginBottom: 6 },
  firstSection: { marginTop: 0 }, // remove initial top spacing
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  toggleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  grid2: { flexDirection: 'row', gap: 10 },
  packageRow: { gap: 8 },
  flex1: { flex: 1 },
  w120: { width: 120 },
  removeBtn: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff4757',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 20, marginTop: -2 },

  // Smaller image area
  imagePicker: {
    backgroundColor: '#333',
    borderRadius: 12,
    height: 120, // reduced from 160
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },

  primaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
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
