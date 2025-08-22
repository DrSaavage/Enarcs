import { gradientColors, gradientConfig } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function settings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [lang, setLang] = useState(i18n.language);
  const [notif, setNotif] = useState(true);
  const [langMenuVisible, setLangMenuVisible] = useState(false);

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  return (
    <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings') || 'Paramètres'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Langue dropdown */}
          <View style={styles.row}>
            <Text style={styles.label}>{t('settings.language') || 'Langue'} :</Text>
            <TouchableOpacity onPress={() => setLangMenuVisible(true)} style={styles.dropdown}>
              <Text style={styles.dropdownText}>{lang === 'fr' ? 'Français' : 'English'}</Text>
              <Ionicons name="chevron-down" size={20} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          <Modal transparent animationType="fade" visible={langMenuVisible} onRequestClose={() => setLangMenuVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setLangMenuVisible(false)}>
              <View style={styles.modalMenu}>
                <Pressable onPress={() => { setLang('fr'); setLangMenuVisible(false); }}>
                  <Text style={styles.modalItem}>Français</Text>
                </Pressable>
                <Pressable onPress={() => { setLang('en'); setLangMenuVisible(false); }}>
                  <Text style={styles.modalItem}>English</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>

          {/* Notifications */}
          <View style={styles.row}>
            <Text style={styles.label}>{t('settings.notifications') || 'Notifications'} :</Text>
            <Switch value={notif} onValueChange={setNotif} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    justifyContent: 'space-between',
  },
  label: {
    width: 110,
    color: '#bdbdbd',
    fontWeight: '500',
    fontSize: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2f2f33ff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  dropdownText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMenu: {
    backgroundColor: '#2f2f33ff',
    borderRadius: 10,
    paddingVertical: 10,
    width: 200,
  },
  modalItem: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
