// app/(tabs)/home.tsx
import cities from '@/assets/data/cities.json';
import EventCard from '@/components/cards/EventCard';
import EventMap from '@/components/maps/EventMap';
import ToggleViewButton from '@/components/ui/ToggleViewButton';
import { useFavorites } from '@/hooks/useFavorites';
import { firestore } from '@/lib/firebase';
import { gradientColors, gradientConfig } from '@/theme';
import { Event } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';

const { width } = Dimensions.get('window');
const EVENT_TYPES = ["Concert", "Soirée", "Sport", "Exposition", "Meetup", "Atelier", "Autre"];
const PRICE_OPTIONS = ["Tous", "Gratuit", "Payant"];

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activities, setActivities] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string | null>(null);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);


  // Filtres
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPrice, setFilterPrice] = useState<string>("Prix");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Valeurs utilisées
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string>("Tous");

  const router = useRouter();
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();

  // Auto-localisation pour la ville
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCity('Paris');
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        let geo = await Location.reverseGeocodeAsync(location.coords);
        if (geo && geo[0]?.city) {
          setCity(geo[0].city);
        } else {
          setCity('Paris'); // fallback si pas de ville
        }
      } catch {
        setCity('Paris');
      }
    })();
  }, []);

  const filteredCities =
    citySearch.trim().length === 0
      ? []
      : (cities as { name: string }[])
        .filter((c) =>
          c.name.toLowerCase().startsWith(citySearch.trim().toLowerCase())
        )
        .slice(0, 15);

  // --- Firestore temps réel : onSnapshot
  useEffect(() => {
    if (!city) return;
    setLoading(true);

    const eventsRef = collection(firestore, 'events');
    const filters = [];

    if (selectedType) filters.push(where('type', '==', selectedType));
    if (city) filters.push(where('city', '==', city));

    const q = filters.length > 0 ? query(eventsRef, ...filters) : eventsRef;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data: Event[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      // 🔎 Si filtre date, on le fait côté JS
      if (selectedDate) {
        const day = selectedDate.getDate();
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();
        data = data.filter(a => {
          let d = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
          return (
            d.getDate() === day &&
            d.getMonth() === month &&
            d.getFullYear() === year
          );
        });
      }

      // Filtrage prix
      if (selectedPrice === 'Gratuit') {
        data = data.filter(a =>
          (a.price === "Gratuit" || a.price === "0€" || a.price === "0 EUR" || a.price?.toLowerCase().includes('gratuit'))
        );
      } else if (selectedPrice === 'Payant') {
        data = data.filter(a =>
          a.price !== "Gratuit" && a.price !== "0€" && a.price !== "0 EUR" && !a.price?.toLowerCase().includes('gratuit')
        );
      }

      setActivities(data);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [city, selectedDate, selectedType, selectedPrice]);

  // --- Header
  const renderHeader = () => (
    <View style={styles.headerFilters}>
      <View style={styles.cityCalendarGroup}>
        <TouchableOpacity style={styles.cityBtn} onPress={() => { setCitySearch(''); setCityPickerVisible(true); }}>
          <Ionicons name="location-outline" size={20} color="#EA3943" />
          <Text style={styles.cityText} numberOfLines={1}>{city}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setCalendarVisible(true)}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
          {selectedDate && (
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('fr-FR')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.rightGroup}>
        <ToggleViewButton viewMode={viewMode} setViewMode={setViewMode} />
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push({
            pathname: '/home/favorites',
            params: {
              events: JSON.stringify(activities.filter(event => favorites.includes(event.id))),
            }
          })}
        >
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- City Picker
  const renderCityPicker = () => (
    <Modal
      animationType="fade"
      transparent
      visible={cityPickerVisible}
      onRequestClose={() => setCityPickerVisible(false)}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCityPickerVisible(false)}>
        <View style={styles.cityModalBox}>
          <Text style={styles.cityPickerTitle}>Choisis ta ville</Text>
          <TextInput
            style={styles.cityInput}
            placeholder="Tape le nom d'une ville"
            value={citySearch}
            onChangeText={setCitySearch}
            autoFocus
            placeholderTextColor="#bbb"
          />
          <FlatList
            data={[
              { name: 'Utiliser ma localisation', isCurrentLocation: true },
              ...(citySearch.trim().length > 0 ? filteredCities : cities.slice(0, 15))
            ]}
            keyExtractor={item =>
              item.isCurrentLocation ? 'current-location' : `${item.name}-${item.country}`
            }
            renderItem={({ item }) => {
              if (item.isCurrentLocation) {
                return (
                  <TouchableOpacity
                    style={[styles.cityOption, styles.useLocationOption]}
                    onPress={async () => {
                      try {
                        let { status } = await Location.requestForegroundPermissionsAsync();
                        if (status !== 'granted') return;
                        let location = await Location.getCurrentPositionAsync({});
                        let geo = await Location.reverseGeocodeAsync(location.coords);
                        if (geo && geo[0]?.city) {
                          setCity(geo[0].city);
                          setCityPickerVisible(false);
                        }
                      } catch { }
                    }}
                  >
                    <Ionicons name="locate" size={19} color="#EA3943" style={{ marginRight: 10 }} />
                    <Text style={[styles.cityOptionText, { fontWeight: 'bold' }]}>Utiliser ma localisation</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  style={[styles.cityOption, city === item.name && styles.cityOptionSelected]}
                  onPress={() => {
                    setCity(item.name);
                    setCityPickerVisible(false);
                  }}
                >
                  <Ionicons name="location-outline" size={18} color="#EA3943" style={{ marginRight: 10 }} />
                  <Text style={styles.cityOptionText}>
                    {item.name}, {item.country}
                  </Text>
                  {city === item.name && <Ionicons name="checkmark" size={18} color="#EA3943" />}
                </TouchableOpacity>
              );
            }}
            style={{ marginTop: 12, maxHeight: 240 }}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // --- Type Dropdown
  const renderTypeDropdown = () => (
    showTypeDropdown && (
      <View style={styles.typeDropdownBox}>
        {EVENT_TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeDropdownItem, filterType === type && styles.selectedListOption]}
            onPress={() => {
              setFilterType(type === filterType ? null : type);
              setShowTypeDropdown(false);
            }}
          >
            <Text style={styles.filterOptionText}>{type}</Text>
            {filterType === type && (
              <Ionicons name="checkmark" size={17} color="#EA3943" style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    )
  );

  // --- Filter Modal
  const renderFilterModal = () => (

    <Modal
      animationType="fade"
      transparent
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={() => setFilterModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.filterModalBox}>
            <Text style={styles.filterTitle}>Filtres</Text>
            {/* Date */}
            <TouchableOpacity
              style={styles.filterField}
              onPress={() => setCalendarVisible(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#EA3943" style={{ marginRight: 6 }} />
              <Text style={styles.filterOptionText}>
                {filterDate ? filterDate.toLocaleDateString('fr-FR') : "Choisir une date"}
              </Text>
            </TouchableOpacity>
            {/* Type */}
            <TouchableOpacity
              style={styles.filterField}
              onPress={() => setShowTypeDropdown(show => !show)}
            >
              <Ionicons name="grid-outline" size={19} color="#EA3943" style={{ marginRight: 6 }} />
              <Text style={styles.filterOptionText}>
                {filterType ? filterType : "Type"}
              </Text>
              <Ionicons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={16} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            {renderTypeDropdown()}
            {/* Prix (dropdown) */}
            <TouchableOpacity
              style={styles.filterField}
              onPress={() => setShowPriceDropdown(show => !show)}
            >
              <Ionicons name="pricetag-outline" size={19} color="#EA3943" style={{ marginRight: 6 }} />
              <Text style={styles.filterOptionText}>
                {filterPrice ? filterPrice : "Prix"}
              </Text>
              <Ionicons name={showPriceDropdown ? "chevron-up" : "chevron-down"} size={16} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            {showPriceDropdown && (
              <View style={styles.typeDropdownBox}>
                {PRICE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.typeDropdownItem,
                      filterPrice === opt && styles.selectedListOption
                    ]}
                    onPress={() => {
                      setFilterPrice(opt);
                      setShowPriceDropdown(false);
                    }}
                  >
                    <Text style={styles.filterOptionText}>{opt}</Text>
                    {filterPrice === opt && (
                      <Ionicons name="checkmark" size={17} color="#EA3943" style={{ marginLeft: 8 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {/* Boutons */}
            <View style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setFilterDate(null);
                  setFilterType(null);
                  setFilterPrice("Tous");
                  setSelectedDate(null);
                  setSelectedType(null);
                  setSelectedPrice("Tous");
                  setFilterModalVisible(false);
                  setShowTypeDropdown(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reset filter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  setSelectedDate(filterDate);
                  setSelectedType(filterType);
                  setSelectedPrice(filterPrice);
                  setFilterModalVisible(false);
                  setShowTypeDropdown(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmer</Text>
              </TouchableOpacity>
            </View>
            {/* Date picker pour le filtre */}
            <DateTimePicker
              isVisible={calendarVisible}
              mode="date"
              onConfirm={date => {
                setFilterDate(date);
                setCalendarVisible(false);
              }}
              onCancel={() => setCalendarVisible(false)}
              display={Platform.OS === "ios" ? "inline" : "default"}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // --- Affichage principal
  return (
    <LinearGradient colors={gradientColors} start={gradientConfig.start} end={gradientConfig.end} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSpacer} />
        {renderHeader()}
        {loading || favLoading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : activities.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: 'white' }}>Aucun événement trouvé.</Text>
        ) : viewMode === 'list' ? (
          <ScrollView contentContainerStyle={styles.cardContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {activities.map((event) => {
              const dateObj =
                event.date instanceof Timestamp
                  ? event.date.toDate()
                  : typeof event.date === 'string'
                    ? new Date(event.date)
                    : event.date ?? new Date();

              const prixNum =
                typeof event.price === 'string'
                  ? parseFloat(event.price) || 0
                  : event.price ?? 0;

              return (
                <EventCard
                  key={event.id}
                  id={event.id}
                  event={event}
                  title={event.title}
                  location={event.location || ''}
                  date={dateObj}
                  heureInconnue={false}
                  prix={prixNum}
                  imageUrl={event.imageUrl || ''}
                  isFavorite={favorites.includes(event.id)}
                  onToggleFavorite={() => toggleFavorite(event.id)}
                  city={event.city}
                  country={event.country}
                  lat={event.lat}
                  lng={event.lng}
                  place_id={event.place_id}
                  onPress={() =>
                    router.push({
                      pathname: `/home/${event.id}`,
                      params: { event: JSON.stringify(event) }
                    })
                  }
                />
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.mapWrapper}>
            <EventMap events={activities} />
          </View>
        )}
        <DateTimePicker
          isVisible={calendarVisible && !filterModalVisible}
          mode="date"
          onConfirm={date => {
            setSelectedDate(date);
            setCalendarVisible(false);
          }}
          onCancel={() => setCalendarVisible(false)}
          display={Platform.OS === "ios" ? "inline" : "default"}
          style={styles.datePicker}
        />
        {renderFilterModal()}
        {renderCityPicker()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 50 },
  topSpacer: { height: 22 },
  headerFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 2,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 18,
    marginLeft: 4,
    marginRight: 6,
  },
  todayTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'left',
    letterSpacing: 0.4,
  },
  cityCalendarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  cityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252424ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    minWidth: 90,
    marginRight: 7,
  },
  cityText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 4,
    maxWidth: 85,
  },
  iconBtn: {
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardContainer: {
    paddingVertical: 3,
    gap: 10,
  },
  mapWrapper: {
    marginHorizontal: 10,
    marginBottom: 12,
    height: 620,
  },
  // --- City picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityModalBox: {
    width: width * 0.88,
    backgroundColor: '#333333',
    //backgroundColor: '#181a2f',
    borderRadius: 14,
    padding: 24,
    alignItems: 'stretch',
  },
  cityPickerTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  cityInput: {
    backgroundColor: '#252424ff',
    //backgroundColor: '#252547',
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
    padding: 10,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  cityOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',

    cityOptionSelected: {
      backgroundColor: '#252424ff',
    },
    useLocationOption: {
      backgroundColor: '#252424ff',
      marginBottom: 4,
    },
  },
  // --- Filter modal
  filterModalBox: {
    width: width * 0.8,
    backgroundColor: '#333333',
    borderRadius: 14,
    padding: 24,
    alignItems: 'stretch',
  },
  filterTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#333333',
  },
  filterOptionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  filterField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#252424ff',
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#252424ff',
  },
  dropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedDropdownOption: {
    backgroundColor: '#252424ff',
  },
  typeDropdownBox: {
    backgroundColor: '#252424ff',
    borderRadius: 8,
    marginBottom: 8,
    marginTop: -5,
    marginLeft: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 2 }
  },
  typeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 2,
    backgroundColor: 'transparent'
  },
  selectedListOption: {
    backgroundColor: '#2c263e',
  },
  resetBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#252424ff',
    marginRight: 8,
  },
  confirmBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#252424ff',
    marginRight: 8,
  },
  datePicker: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },

});
