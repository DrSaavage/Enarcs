// /app/(tabs)/profile-main.tsx

import { auth, firestore } from '@/lib/firebase';
import { gradientColors, gradientConfig } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const sections = [
  { label: "Mes informations", icon: "person-outline", route: "/profile/PersonalInfo" },
  { label: "Paramètres", icon: "settings-outline", route: "/profile/Settings" },
  { label: "Sécurité", icon: "lock-closed-outline", route: "/profile/Security" },
  { label: "Déconnexion", icon: "exit-outline", route: "/profile/LogoutButton", danger: true },
];

export default function ProfileMainScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const ref = doc(firestore, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);
      setUser(snap.exists() ? snap.data() : null);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission refusée", "Tu dois autoriser l'accès à la photothèque.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets[0].uri && auth.currentUser) {
        let url = res.assets[0].uri;

        // --- Mode CLOUD uniquement si Storage dispo ---
        try {
          url = await uploadAvatarToStorage(res.assets[0].uri, auth.currentUser.uid);
        } catch (e) {
          // Si Storage pas prêt (Expo Go), garde l'uri locale
        }

        await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
          avatar: url,
        });
        setUser({ ...user, avatar: url });
      }
    } catch (e) {
      Alert.alert("Erreur", "Échec de l'upload");
    }
  };

  if (loading)
    return (
      <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={styles.container}>
        <ActivityIndicator size="large" color="#fff" style={{ flex: 1 }} />
      </LinearGradient>
    );

  if (!user) return null;

  return (
    <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Profil</Text>
          <View style={styles.spacer} />
          <View style={styles.avatarBox}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: user.avatar || "https://ui-avatars.com/api/?name=" + (user.displayName || "U") }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.editAvatarBtn} onPress={pickAvatar}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <View style={styles.sectionList}>
            {sections.map((section) => (
              <TouchableOpacity
                style={[styles.sectionItem, section.danger && styles.sectionDanger]}
                key={section.label}
                onPress={() => router.push(section.route)}
              >
                <View style={styles.iconLabel}>
                  <Ionicons name={section.icon as any} size={22} color="#fff" />
                  <Text style={[styles.sectionLabel, section.danger && { color: "#fff" }]}>{section.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 24 },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 10,
    letterSpacing: 0.6,
    alignSelf: 'flex-start',
    marginLeft: 18,
  },
  spacer: { height: 28 },
  avatarBox: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  avatarWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },
  editAvatarBtn: {
    position: 'absolute',
    right: 2,
    bottom: 6,
    backgroundColor: "#3F8AFF",
    borderRadius: 16,
    padding: 5,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    color: "#fff",
    fontSize: 21,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 2,
  },
  email: {
    color: "#bdbdbd",
    fontSize: 15,
    marginBottom: 10,
  },
  sectionList: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 10,
  },
  sectionItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionDanger: {},
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});