// 📄 /app/(tabs)/eventID.tsx

import fallbackImage from '@/assets/images/events-default.jpg';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import { useParticipations } from '@/hooks/useParticipations';
import { formatEventDetails } from '@/lib/utils';
import { gradientColors, gradientConfig } from '@/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EventDetailScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { getEventById, loading } = useEvents();

  const event = getEventById(eventId ?? null);

  const auth = getAuth();
  const user = auth.currentUser;
  const isCreator = user && event?.creatorId === user.uid;

  const { favorites, toggleFavorite } = useFavorites();
  const { participations, toggleParticipation } = useParticipations();

  const isFavorite = event && favorites.includes(event.id);
  const isParticipating = event && participations.includes(event.id);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const isExpired = event?.date && new Date(event.date) < new Date();

  // --- Custom back : header + hardware ---
  useEffect(() => {
    const handleBack = () => {
      router.replace('/home');
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [router]);

  const handleBackPress = () => {
    router.replace('/home');
  };

  // Schéma deep link natif enarcs
  const eventDeepLink = event?.id ? `enarcs://event/${event.id}` : '';

  // --- SHARING HANDLERS ---

  const handleShareWhatsApp = () => {
    if (!eventDeepLink) return;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(eventDeepLink)}`)
      .catch(() => {
        Alert.alert("Erreur", "WhatsApp non installé !");
      });
    setShareModalVisible(false);
  };

  const handleShareFacebook = () => {
    if (!eventDeepLink) return;
    // Facebook ne supporte pas le partage direct de deep links, mais ça ouvrira le share web qui fonctionne aussi sur mobile
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventDeepLink)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Erreur", "Facebook non installé !");
    });
    setShareModalVisible(false);
  };

  const handleShareSnapchat = () => {
    if (!eventDeepLink) return;
    Clipboard.setStringAsync(eventDeepLink);
    Alert.alert("Lien copié !", "Colle-le dans Snapchat pour le partager.");
    setShareModalVisible(false);
  };

  const handleCopyLink = () => {
    if (!eventDeepLink) return;
    Clipboard.setStringAsync(eventDeepLink);
    Alert.alert('Lien copié !');
    setShareModalVisible(false);
  };

  // Badges: même calcul que sur EventCard
  const participantsCount = Array.isArray(event?.participants) ? event.participants.length : 0;
  const favoritesCount = Array.isArray(event?.favorites) ? event.favorites.length : 0;

  const handlePressParticipants = () => {
    if (event?.id) {
      router.push({ pathname: '/events/participantsList', params: { eventId: event.id } });
    }
  };

  const handlePressFavorites = () => {
    if (event?.id) {
      router.push({ pathname: '/events/favoritesList', params: { eventId: event.id } });
    }
  };

  const { dateHeure, prixTexte } = formatEventDetails({
    date: event?.date ?? null,
    heureInconnue: false,
    prix: event?.price,
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: '#fff' }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: '#fff' }}>Aucun événement trouvé.</Text>
      </SafeAreaView>
    );
  }

  const imageUrl =
    event.imageUrl && event.imageUrl.trim() !== '' ? event.imageUrl : undefined;

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header custom avec back qui va TOUJOURS vers home */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setShareModalVisible(true)}
              style={styles.shareBtn}
            >
              <MaterialCommunityIcons name="share-outline" size={26} color="#fff" />
            </TouchableOpacity>
            {isCreator && (
              <TouchableOpacity
                onPress={() => router.push(`/home/edit/${event.id}`)}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="pencil" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <View style={isExpired ? styles.expiredWrapper : undefined}>
            <Image
              source={imageUrl ? { uri: imageUrl } : fallbackImage}
              style={[styles.image, isExpired && { opacity: 0.3 }]}
            />

            {/* ----------- Zone texte + Badges à droite ----------- */}
            <View style={eventDetailStyles.textAndBadgesContainer}>
              <View style={{ flex: 1 }}>
                {/* Lieu + icône Google Maps */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.locationText, isExpired && { opacity: 0.3 }]}>
                    {event.location}
                    {event.city ? `, ${event.city}` : ''}
                    {event.country ? `, ${event.country}` : ''}
                  </Text>
                  {event.lat && event.lng && (
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`
                        )
                      }
                      style={{ marginLeft: 6, padding: 3 }}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <Ionicons name="location-outline" size={20} color="#4db8ff" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.datePriceText, isExpired && { opacity: 0.3 }]}>
                  {dateHeure}
                </Text>
                <Text style={[styles.datePriceText, isExpired && { opacity: 0.3 }]}>
                  {prixTexte}
                </Text>

                {isExpired && (
                  <Text style={styles.expiredText}>Événement terminé</Text>
                )}
                {event.description ? (
                  <Text style={[styles.descriptionText, isExpired && { opacity: 0.3 }]}>
                    {event.description}
                  </Text>
                ) : null}
              </View>
              {/* BADGES cliquables */}
              <View style={eventDetailStyles.badgesContainer}>
                <TouchableOpacity
                  onPress={handlePressParticipants}
                  style={eventDetailStyles.badge}
                  activeOpacity={0.7}
                >
                  <Ionicons name="people" size={16} color="#fff" />
                  <Text style={eventDetailStyles.badgeText}>{participantsCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePressFavorites}
                  style={eventDetailStyles.badge}
                  activeOpacity={0.7}
                >
                  <Ionicons name="heart" size={16} color="#fff" />
                  <Text style={eventDetailStyles.badgeText}>{favoritesCount}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions (favori/participer) */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => !isExpired && toggleFavorite(event.id)}
                style={[
                  styles.actionBtnSmall,
                  isExpired && { opacity: 0.3 },
                ]}
                disabled={isExpired}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color="#EA3943"
                />
                <Text style={styles.actionTextSmall}>
                  {isFavorite ? 'Favori' : 'Mettre en favori'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => !isExpired && toggleParticipation(event.id)}
                style={[
                  styles.actionBtnSmall,
                  {
                    backgroundColor: isParticipating ? '#181a2f' : '#EA3943',
                    borderColor: '#EA3943',
                    borderWidth: 1,
                  },
                  isExpired && { opacity: 0.3 },
                ]}
                disabled={isExpired}
              >
                <Ionicons
                  name={
                    isParticipating ? 'checkmark-circle' : 'add-circle-outline'
                  }
                  size={20}
                  color={isParticipating ? '#7CFC7C' : '#fff'}
                />
                <Text
                  style={[
                    styles.actionTextSmall,
                    { color: isParticipating ? '#7CFC7C' : '#fff' },
                  ]}
                >
                  {isParticipating ? 'Je participe !' : 'Participer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal partage */}
        <Modal
          animationType="fade"
          transparent
          visible={shareModalVisible}
          onRequestClose={() => setShareModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShareModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Partager l'événement</Text>
              <View style={styles.shareOptions}>
                <TouchableOpacity style={styles.shareOption} onPress={handleShareWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={28} color="#25d366" />
                  <Text>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareOption} onPress={handleShareFacebook}>
                  <Ionicons name="logo-facebook" size={28} color="#1877f3" />
                  <Text>Facebook</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareOption} onPress={handleShareSnapchat}>
                  <Ionicons name="logo-snapchat" size={28} color="#fffc00" />
                  <Text>Snapchat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={handleCopyLink}
                >
                  <Ionicons name="link-outline" size={28} color="#222" />
                  <Text>Copier lien</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- Styles badges identiques à EventCard ---
const eventDetailStyles = StyleSheet.create({
  textAndBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#804e50ff',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: 'bold',
  },
});

// --- Styles généraux ---
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181a2f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 18,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  backBtn: { marginRight: 12, padding: 6 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 1,
    flex: 1,
    textAlign: 'center',
  },
  shareBtn: { marginLeft: 12, padding: 6 },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 20,
  },
  expiredWrapper: {
    opacity: 1,
  },
  locationText: {
    color: '#fff',
    fontSize: 18,
  },
  datePriceText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 6,
  },
  expiredText: {
    color: '#FF6666',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  descriptionText: {
    color: '#ddd',
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
    marginTop: 18,
  },
  actionBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    backgroundColor: '#222240',
  },
  actionTextSmall: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    width: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 16,
    color: '#222',
  },
  shareOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
  },
  shareOption: {
    alignItems: 'center',
    margin: 10,
    width: 70,
  },
});
