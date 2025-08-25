// Path: app/(tabs)/profile/privateProfile.tsx
import { auth, firestore } from "@/lib/firebase";
import type { User as UserDoc, UserRole } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
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
  View,
} from "react-native";

// Optional uploader (won't crash if missing)
import * as Upload from "@/lib/uploadAvatar";

export default function PrivateProfile() {
  const router = useRouter();
  const [user, setUser] = useState<Partial<UserDoc> | null>(null);
  const [loading, setLoading] = useState(true);

  const [editField, setEditField] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<string>("");
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const u = auth.currentUser;
        if (!u) {
          // minimal fallback to avoid blank screen
          setUser({ uid: "", displayName: "", email: "" });
          return;
        }
        const ref = doc(firestore, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUser({ uid: u.uid, ...(snap.data() as any) });
        } else {
          // Pas encore de doc -> on montre les infos Auth
          setUser({
            uid: u.uid,
            displayName: u.displayName || "",
            email: u.email || "",
          });
        }
      } catch {
        setUser({ uid: "", displayName: "", email: "" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission refusée", "Autorise l'accès à la photothèque.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.[0]?.uri || !auth.currentUser?.uid) return;

      const localUri = res.assets[0].uri;
      let avatarUrl = localUri;

      // Try cloud upload if helper exists
      try {
        // @ts-ignore support multiple export styles
        const uploader = Upload.uploadAvatarToStorage || Upload.uploadAvatar || Upload.default;
        if (typeof uploader === "function") {
          avatarUrl = await uploader(localUri, auth.currentUser.uid);
        }
      } catch {
        // keep local uri fallback in dev/Expo Go
      }

      const userRef = doc(firestore, "users", auth.currentUser.uid);
      // ⬇️ crée ou met à jour
      await setDoc(
        userRef,
        {
          uid: auth.currentUser.uid,
          avatar: avatarUrl,
          // createdAt au premier write (si le doc n'existait pas)
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUser((prev) => ({ ...(prev || {}), avatar: avatarUrl }));
    } catch {
      Alert.alert("Erreur", "Échec de la mise à jour de l'avatar.");
    }
  };

  const onEditField = (field: keyof UserDoc | string, label: string) => {
    setEditField(field as string);
    setEditLabel(label);
    const current = (user as Record<string, unknown>)?.[field as string];
    setEditValue(current == null ? "" : String(current));
  };

  const handleSaveEdit = async () => {
    if (!editField || !auth.currentUser) return;
    try {
      let valueToSave: any = editValue;
      if (editField === "age") {
        const n = parseInt(editValue, 10);
        valueToSave = Number.isFinite(n) ? n : null;
      }

      const userRef = doc(firestore, "users", auth.currentUser.uid);
      // ⬇️ crée si absent, met à jour sinon
      await setDoc(
        userRef,
        {
          uid: auth.currentUser.uid,
          [editField]: valueToSave,
          // on garde les timestamps cohérents
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUser((prev) => ({ ...(prev || {}), [editField]: valueToSave } as Partial<UserDoc>));
    } finally {
      setEditField(null);
      setEditLabel("");
      setEditValue("");
    }
  };

  const avatarUri = useMemo(
    () =>
      (user?.avatar && String(user.avatar).trim().length > 0 && String(user.avatar)) ||
      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    [user?.avatar]
  );

  if (loading) {
    return (
      <LinearGradient
        colors={["#000000", "#1C1C1C", "rgba(90, 26, 26, 0.6)"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      >
        <ActivityIndicator size="large" color="#fff" style={{ flex: 1 }} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#000000", "#1C1C1C", "rgba(90, 26, 26, 0.6)"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon profil</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity style={styles.avatarEditBtn} onPress={pickAvatar}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Champs éditables (issus de User type, sauf timestamps) */}
          <Field
            icon="person-outline"
            label="Username"
            value={user?.displayName || ""}
            onEdit={() => onEditField("displayName", "Username")}
          />
          <Field
            icon="information-circle-outline"
            label="Bio"
            value={user?.bio || ""}
            onEdit={() => onEditField("bio", "Bio")}
          />
          <Field
            icon="mail-outline"
            label="Email"
            value={user?.email || ""}
            onEdit={() => onEditField("email", "Email")}
          />
          <Field
            icon="call-outline"
            label="Téléphone"
            value={user?.phone || ""}
            onEdit={() => onEditField("phone", "Téléphone")}
          />
          <Field
            icon="flag-outline"
            label="Nationalité"
            value={user?.nationality || ""}
            onEdit={() => onEditField("nationality", "Nationalité")}
          />
          <Field
            icon="man-outline"
            label="Civilité"
            value={user?.civility || ""}
            onEdit={() => onEditField("civility", "Civilité")}
          />
          <Field
            icon="hourglass-outline"
            label="Âge"
            value={user?.age != null ? String(user.age) : ""}
            onEdit={() => onEditField("age", "Âge")}
          />
          <Field
            icon="ribbon-outline"
            label="Rôle"
            value={(user?.role as UserRole) || ""}
            onEdit={() => onEditField("role", "Rôle")}
          />
        </ScrollView>
      </SafeAreaView>

      {/* Modal d’édition inline */}
      <Modal
        visible={!!editField}
        transparent
        animationType="fade"
        onRequestClose={() => setEditField(null)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modal}>
            <Text style={modalStyles.title}>{`Modifier ${editLabel}`}</Text>

            {/* Choix rapides */}
            {editField === "civility" ? (
              <View style={modalStyles.quickRow}>
                {["M", "Mme", "Autre"].map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setEditValue(v)}
                    style={[
                      modalStyles.chip,
                      editValue === v && modalStyles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        modalStyles.chipText,
                        editValue === v && modalStyles.chipTextActive,
                      ]}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {editField === "role" ? (
              <View style={modalStyles.quickRow}>
                {(["influencer", "client"] as UserRole[]).map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setEditValue(v)}
                    style={[
                      modalStyles.chip,
                      editValue === v && modalStyles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        modalStyles.chipText,
                        editValue === v && modalStyles.chipTextActive,
                      ]}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              placeholder=""
              placeholderTextColor="#aaa"
              style={modalStyles.input}
              autoFocus
              keyboardType={editField === "age" ? "number-pad" : "default"}
            />
            <View style={modalStyles.buttons}>
              <TouchableOpacity
                onPress={() => setEditField(null)}
                style={modalStyles.buttonCancel}
              >
                <Text style={modalStyles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={modalStyles.buttonSave}
              >
                <Text style={modalStyles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function Field({
  icon,
  label,
  value,
  onEdit,
}: {
  icon: any;
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <View style={fieldStyles.fieldBox}>
      <Ionicons name={icon} size={20} color="#bdbdbd" style={{ marginRight: 8 }} />
      <View style={fieldStyles.fieldTextBox}>
        <Text style={fieldStyles.fieldLabel}>{label}</Text>
        <Text style={fieldStyles.fieldValue}>{String(value ?? "")}</Text>
      </View>
      <TouchableOpacity onPress={onEdit}>
        <Ionicons name="pencil-outline" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { fontSize: 22, color: "#fff", fontWeight: "bold" },
  content: { alignItems: "center", paddingBottom: 32, paddingHorizontal: 16 },
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
  fieldTextBox: { flex: 1 },
  fieldLabel: { color: "#bdbdbd", fontSize: 13, fontWeight: "600" },
  fieldValue: { color: "#fff", fontSize: 16, marginTop: 1 },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    padding: 20,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 12 },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#555",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  chipActive: {
    backgroundColor: "#3F8AFF",
    borderColor: "#3F8AFF",
  },
  chipText: { color: "#ddd", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    backgroundColor: "#2c2c2e",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  buttons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  buttonCancel: { paddingVertical: 6, paddingHorizontal: 14 },
  buttonSave: { paddingVertical: 6, paddingHorizontal: 14 },
  buttonText: { color: "#3F8AFF", fontWeight: "600", fontSize: 16 },
});
