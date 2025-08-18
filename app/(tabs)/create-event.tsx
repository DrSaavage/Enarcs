// 📄 /app/(tabs)/create-event.tsx

import ShotgunButton from '@/components/ShotgunButton';
import { auth, firestore } from '@/lib/firebase';
import { uploadEventImageToStorage } from '@/lib/uploadEventImage';
import { useGooglePlacesAutocomplete } from '@/lib/useGooglePlaces';
import { gradientColors, gradientConfig } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
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

// 📸 Fallback image officielle Pexels (tu peux la modifier ici)
const FALLBACK_IMAGE = 'https://images.pexels.com/photos/949587/pexels-photo-949587.jpeg?auto=compress&w=800';

export default function CreateEventScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Champs Google Places
  const [location, setLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const [userCoords, setUserCoords] = useState<{ latitude: number, longitude: number } | null>(null);

  const { suggestions, loading: placesLoading, search, fetchDetails } = useGooglePlacesAutocomplete();

  const router = useRouter();

  // --- Ajout pour auto-scroll ---
  const scrollRef = useRef<ScrollView>(null);

  const handleFocusLieu = () => {
    setTimeout(() => {
      // Décale le scroll pour bien voir les suggestions/autocomplete
      scrollRef.current?.scrollTo({ y: 340, animated: true });
    }, 300); // attend que le clavier soit bien ouvert
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let loc = await Location.getCurrentPositionAsync({});
        setUserCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch { }
    })();
  }, []);

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

  const handleCreate = async () => {
    if (
      !title ||
      !type ||
      !dateTime ||
      !location ||
      !lat ||
      !lng ||
      !country ||
      !city
    ) {
      Alert.alert('Erreur', 'Remplis tous les champs obligatoires.');
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Non connecté', 'Tu dois être connecté pour créer un événement.');
        return;
      }
      setLoading(true);

      const docRef = doc(collection(firestore, 'events'));
      let imageUrl: string = FALLBACK_IMAGE;

      if (image) {
        try {
          imageUrl = await uploadEventImageToStorage(image, docRef.id);
        } catch (err) {
          imageUrl = image; // URI locale
        }
      }

      const newEvent = {
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
        creatorId: user.uid,
        favorites: [] as string[],
        participants: [] as string[],
        createdAt: serverTimestamp(),
        id: docRef.id,
      };

      await setDoc(docRef, newEvent);

      // Remplace la stack par la vue détail (plus de back sur create-event)
      router.replace(`/home/${docRef.id}`);

      // Optionnel : reset les champs
      setTitle('');
      setType(null);
      setDateTime(null);
      setLocation('');
      setPrice('');
      setDescription('');
      setImage(null);
      setCity('');
      setCountry('');
      setLat(null);
      setLng(null);

    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
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
              <Text style={styles.title}>Créer</Text>
              <View style={styles.form}>
                {/* Photo */}
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={32} color="#aaa" />
                      <Text style={styles.imageText}>Ajouter une photo</Text>
                    </>
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
                      search(input, userCoords);
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
                                setCountry(details.country || '');
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
                <ShotgunButton
                  label={loading ? "Création..." : "Créer l'événement"}
                  onPress={handleCreate}
                  disabled={loading}
                />
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
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 18,
    letterSpacing: 0.6,
    alignSelf: 'flex-start',
    marginLeft: 18,
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
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 14,
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
});
