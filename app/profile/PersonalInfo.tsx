// /app/(tabs)/profile/PersonalInfo.tsx

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
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function PersonalInfo() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editField, setEditField] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');

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

  const onEditField = (field: string, label: string) => {
    setEditField(field);
    setEditLabel(label);
    setEditValue(user?.[field] || '');
  };

  const handleSaveEdit = async () => {
    if (!editField || !auth.currentUser) return;
    await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
      [editField]: editValue,
    });
    setUser({ ...user, [editField]: editValue });
    setEditField(null);
    setEditLabel('');
    setEditValue('');
  };

  if (loading)
    return (
      <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#fff" style={{ flex: 1 }} />
      </LinearGradient>
    );

  if (!user) return null;

  return (
    <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon profil</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: user.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.avatarEditBtn} onPress={pickAvatar}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Field icon="person-outline" label="Username" value={user.displayName} onEdit={() => onEditField("displayName", "Username")} />
          <Field icon="information-circle-outline" label="Bio" value={user.bio || ''} onEdit={() => onEditField("bio", "Bio")} />
          <Field icon="mail-outline" label="Email" value={user.email} onEdit={() => onEditField("email", "Email")} />
          <Field icon="call-outline" label="Téléphone" value={user.phone || ''} onEdit={() => onEditField("phone", "Téléphone")} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal pour édition */}
      <Modal visible={!!editField} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modal}>
            <Text style={modalStyles.title}>{`Modifier ${editLabel}`}</Text>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              placeholder=""
              placeholderTextColor="#aaa"
              style={modalStyles.input}
              autoFocus
            />
            <View style={modalStyles.buttons}>
              <TouchableOpacity onPress={() => setEditField(null)} style={modalStyles.buttonCancel}>
                <Text style={modalStyles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} style={modalStyles.buttonSave}>
                <Text style={modalStyles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function Field({ icon, label, value, onEdit }: any) {
  return (
    <View style={fieldStyles.fieldBox}>
      <Ionicons name={icon} size={20} color="#bdbdbd" style={{ marginRight: 8 }} />
      <View style={fieldStyles.fieldTextBox}>
        <Text style={fieldStyles.fieldLabel}>{label}</Text>
        <Text style={fieldStyles.fieldValue}>{String(value || '')}</Text>
      </View>
      <TouchableOpacity onPress={onEdit}>
        <Ionicons name="pencil-outline" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: "85%",
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#2c2c2e',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  buttonCancel: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  buttonSave: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#3F8AFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    alignItems: "center",
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    marginTop: 25,
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#e1e1e1",
  },
  avatarEditBtn: {
    position: "absolute",
    right: 4,
    bottom: 8,
    backgroundColor: "#3F8AFF",
    borderRadius: 18,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 5,
  },
});

const fieldStyles = StyleSheet.create({
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 13,
    gap: 5,
  },
  fieldTextBox: {
    flex: 1,
  },
  fieldLabel: {
    color: "#bdbdbd",
    fontSize: 13,
    fontWeight: "600",
  },
  fieldValue: {
    color: "#fff",
    fontSize: 16,
    marginTop: 1,
  },
});
