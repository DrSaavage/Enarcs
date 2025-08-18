// 📄 /app/(tabs)/home/edit/[id].tsx

import { firestore } from '@/lib/firebase';
import { uploadEventImageToStorage } from '@/lib/uploadEventImage';
import { useGooglePlacesAutocomplete } from '@/lib/useGooglePlaces';
import { gradientColors, gradientConfig } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const EVENT_TYPES = [
  "Concert",
  "Soirée",
  "Sport",
  "Exposition",
  "Meetup",
  "Atelier",
  "Autre"
];

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/949587/pexels-photo-949587.jpeg?auto=compress&w=800';
const DEFAULT_COUNTRY = "France";

export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Form state
  const [image, setImage] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [location, setLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [city, setCity] = useState('');

  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true); // true au début pour chargement
  const [saving, setSaving] = useState(false);

  // Google Places (autocomplete)
  const { suggestions, loading: placesLoading, search, fetchDetails } = useGooglePlacesAutocomplete();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(firestore, 'events', id));
        if (!snap.exists()) {
          Alert.alert('Erreur', 'Événement introuvable');
          router.back();
          return;
        }
        const data = snap.data();
        setTitle(data.title || '');
        setType(data.type || null);
        setDateTime(data.date ? new Date(data.date.seconds ? data.date.seconds * 1000 : data.date) : null);
        setLocation(data.location || '');
        setLat(data.lat ?? null);
        setLng(data.lng ?? null);
        setCity(data.city || '');
        setCountry(data.country || DEFAULT_COUNTRY);
        setPrice(data.price || '');
        setDescription(data.description || '');
        setImage(data.imageUrl || null);
        setImageChanged(false);
      } catch {
        Alert.alert('Erreur', 'Impossible de charger');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission refusée", "Vas dans Réglages > Expo Go > Photos > Toutes les photos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const handleTypeSelect = (t: string) => {
    setType(t);
    setTypeDropdownVisible(false);
  };

  const handleDateConfirm = (date: Date) => {
    setDateTime(date);
    setDatePickerVisible(false);
  };

  const handleFocusLieu = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 340, animated: true });
    }, 300);
  };

  const handleSave = async () => {
    if (!title || !type || !dateTime || !location || !lat || !lng || !country || !city) {
      Alert.alert('Erreur', 'Remplis tous les champs obligatoires.');
      return;
    }
    try {
      setSaving(true);
      let imageUrl = image || FALLBACK_IMAGE;
      if (imageChanged && image && image.startsWith('file')) {
        try {
          imageUrl = await uploadEventImageToStorage(image, id as string);
        } catch {
          // fallback to local URI, mais pas optimal
        }
      }

      await updateDoc(doc(firestore, 'events', id as string), {
        title,
        type,
        date: dateTime,
        location,
        city,
        country,
        lat,
        lng,
        price,
        description,
        imageUrl,
        updatedAt: new Date()
      });

      Alert.alert('Événement modifié !', '', [
        { text: 'OK', onPress: () => router.replace(`/home/${id}`) }
      ]);
    } catch {
      Alert.alert('Erreur', 'Modification échouée');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Supprimer l'événement",
      "Tu es sûr ? Action irréversible.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteDoc(doc(firestore, 'events', id as string));
              Alert.alert('Supprimé !', '', [
                { text: 'OK', onPress: () => router.replace('/home') }
              ]);
            } catch {
              Alert.alert('Erreur', 'Suppression échouée');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#181a2f" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Header custom */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Modifier
            </Text>
            <View style={{ width: 38 }} />
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 30}
            style={{ flex: 1 }}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.form}>
                {/* Photo */}
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="camera-outline" size={32} color="#aaa" />
                      <Text style={styles.imageText}>Ajouter/modifier une photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Titre de l'événement"
                  placeholderTextColor="#999"
                  value={title}
                  onChangeText={setTitle}
                  selectionColor="#fff"
                />

                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity
                    style={styles.dropdownField}
                    onPress={() => setTypeDropdownVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownText, { color: type ? '#fff' : '#999' }]}>
                      {type ?? 'Type'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#999" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                  <Modal
                    visible={typeDropdownVisible}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setTypeDropdownVisible(false)}
                  >
                    <Pressable style={styles.modalOverlay} onPress={() => setTypeDropdownVisible(false)}>
                      <View style={styles.dropdownModal}>
                        {EVENT_TYPES.map((t) => (
                          <TouchableOpacity key={t} style={styles.dropdownItem} onPress={() => handleTypeSelect(t)}>
                            <Text style={styles.dropdownItemText}>{t}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Pressable>
                  </Modal>
                </View>

                <TouchableOpacity
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  onPress={() => setDatePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: dateTime ? '#fff' : '#999', fontSize: 16 }}>
                    {dateTime
                      ? `${dateTime.toLocaleDateString('fr-FR')} à ${dateTime.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`
                      : 'Date et heure'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#999" />
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={datePickerVisible}
                  mode="datetime"
                  onConfirm={handleDateConfirm}
                  onCancel={() => setDatePickerVisible(false)}
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  pickerContainerStyleIOS={{ minHeight: 340, justifyContent: 'center' }}
                  date={dateTime || new Date()}
                />

                {/* Lieu (autocomplete Google Places) */}
                <View style={{ position: 'relative', marginBottom: 12 }}>
                  <TextInput
                    style={[styles.input, { marginBottom: 0 }]}
                    placeholder="Lieu (ville, adresse, quartier...)"
                    placeholderTextColor="#999"
                    value={location}
                    onChangeText={input => {
                      setLocation(input);
                      search(input, null);
                      setShowSuggestions(true);
                    }}
                    selectionColor="#fff"
                    onFocus={handleFocusLieu}
                  />
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#999"
                    style={{ position: 'absolute', right: 18, top: 18 }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: 55,
                      left: 0,
                      right: 0,
                      backgroundColor: '#2c2c46ff',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#444',
                      zIndex: 10,
                      elevation: 10,
                      maxHeight: 210,
                    }}>
                      <ScrollView keyboardShouldPersistTaps="always">
                        {suggestions.map((s) => (
                          <TouchableOpacity
                            key={s.place_id}
                            onPress={async () => {
                              setLocation(s.description);
                              const details = await fetchDetails(s.place_id);
                              if (details) {
                                setLat(details.lat);
                                setLng(details.lng);
                                setCountry(details.country || DEFAULT_COUNTRY);
                                setCity(details.city || '');
                              }
                              setShowSuggestions(false);
                            }}
                            style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#444' }}
                          >
                            <Text style={{ color: '#fff', fontSize: 15 }}>{s.description}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Prix (ex: Gratuit, 10€...)"
                  placeholderTextColor="#999"
                  value={price}
                  onChangeText={setPrice}
                  selectionColor="#fff"
                />
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Description"
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  selectionColor="#fff"
                />
                <View style={{ height: 10 }} />
                <View style={{ flexDirection: "row", gap: 14, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={styles.deleteBtn}
                    disabled={saving}
                  >
                    <Text style={styles.deleteBtnText}>Supprimer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={styles.saveBtn}
                    disabled={saving}
                  >
                    <Text style={styles.saveBtnText}>{saving ? "Modification..." : "Modifier"}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 80 }} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  backBtn: { padding: 6, marginRight: 12 },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  form: {
    paddingHorizontal: 18,
    marginTop: 10,
    flexGrow: 1,
  },
  imagePicker: {
    backgroundColor: '#333333',
    borderRadius: 12,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  imagePreview: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 0,
  },
  imageText: {
    color: '#aaa',
    marginTop: 0,
    fontSize: 15,
  },
  input: {
    backgroundColor: '#333333',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownWrapper: {
    marginBottom: 14,
  },
  dropdownField: {
    backgroundColor: '#333333',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.24)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    paddingVertical: 10,
    minWidth: 230,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 16,
  },
  deleteBtn: {
    borderColor: '#111',
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff', // même fond que la page
  },
  deleteBtnText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 17,
  },
  saveBtn: {
    borderColor: '#111',
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  saveBtnText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 17,
  },
});
