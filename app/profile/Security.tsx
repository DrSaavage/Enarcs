import { auth, firestore } from '@/lib/firebase';
import { gradientColors, gradientConfig } from '@/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function Security() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastLoginDate, setLastLoginDate] = useState('');

  useEffect(() => {
    const fetchLastLogin = async () => {
      if (auth.currentUser) {
        const userRef = doc(firestore, 'users', auth.currentUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();
        if (data?.lastLogin?.toDate) {
          const date = data.lastLogin.toDate();
          const formatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          setLastLoginDate(formatted);
        }
      }
    };

    fetchLastLogin();
  }, [editing]);

  const handleSavePassword = async () => {
    if (!auth.currentUser || !currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (newPwd !== confirmPwd) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    const credential = EmailAuthProvider.credential(
      auth.currentUser.email || '',
      currentPwd
    );

    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      Alert.alert('Succès', 'Mot de passe mis à jour.');
      setEditing(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sécurité</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!editing ? (
            <View style={styles.card}>
              <MaterialCommunityIcons name="lock-outline" size={22} color="#fff" style={styles.iconLeft} />
              <Text style={styles.cardText}>Mot de passe</Text>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.iconRight}>
                <Ionicons name="pencil-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editBox}>
              <Text style={styles.label}>Mot de passe actuel</Text>
              <TextInput
                secureTextEntry
                style={styles.input}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                placeholder="********"
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <TextInput
                secureTextEntry
                style={styles.input}
                value={newPwd}
                onChangeText={setNewPwd}
                placeholder="********"
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
              <TextInput
                secureTextEntry
                style={styles.input}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                placeholder="********"
                placeholderTextColor="#aaa"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 20 }}> 
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#555' }]} onPress={() => setEditing(false)} disabled={loading}>
                  <Text style={styles.saveBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSavePassword} disabled={loading}>
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.info}>Dernière connexion : {lastLoginDate}</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c2c2e",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 22,
    marginTop: 30,
  },
  cardText: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    padding: 6,
  },
  editBox: {
    backgroundColor: "#2c2c2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    marginTop: 30,
  },
  label: {
    color: "#bdbdbd",
    fontSize: 15,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#000",
  },
  saveBtn: {
    backgroundColor: "#EA3943",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  info: {
    color: "#888",
    fontSize: 13,
    marginTop: 28,
    textAlign: "center",
  },
});
