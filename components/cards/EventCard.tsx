// 📄 /components/cards/EventCard.tsx

import fallbackImage from '@/assets/images/events-default.jpg';
import { firestore } from '@/lib/firebase';
import { formatEventDetails } from '@/lib/utils';
import { useAppTheme } from '@/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Timestamp, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type Props = {
  id: string;
  title: string;
  location: string;
  date: Date | Timestamp | string;
  heureInconnue: boolean;
  prix?: number;
  imageUrl: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  onPress?: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function EventCard({
  id,
  title,
  location,
  city,
  country,
  lat,
  lng,
  date,
  heureInconnue,
  prix,
  imageUrl,
  onPress,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const { colors } = useAppTheme();
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    const docRef = doc(firestore, 'events', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setParticipantsCount(Array.isArray(data.participants) ? data.participants.length : 0);
        setFavoritesCount(Array.isArray(data.favorites) ? data.favorites.length : 0);
      }
    });
    return unsubscribe;
  }, [id]);

  // Utilise le lien de l'event dans ton app mobile (à adapter selon ton schéma deep link)
  const eventDeepLink = `enarcs://event/${id}`;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(eventDeepLink);
    Linking.openURL(`whatsapp://send?text=${text}`)
      .catch(() => {
        Alert.alert("Erreur", "WhatsApp non installé !");
      });
    setShareModalVisible(false);
  };

  const handleShareFacebook = () => {
    // Facebook ne supporte pas les deep links d'app custom, donc on met le fallback (ou un lien web si tu ajoutes un jour)
    // Ici on met juste le lien de l’event (même deep link)
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventDeepLink)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Erreur", "Facebook non installé !");
    });
    setShareModalVisible(false);
  };

  const handleShareSnapchat = () => {
    // Snapchat ne permet pas de partager un lien via URL, alors on copie et on prévient
    Clipboard.setStringAsync(eventDeepLink);
    Alert.alert("Lien copié !", "Colle-le dans Snapchat pour le partager.");
    setShareModalVisible(false);
  };

  const handleCopyLink = () => {
    Clipboard.setStringAsync(eventDeepLink);
    Alert.alert('Lien copié !');
    setShareModalVisible(false);
  };

  const handlePressParticipants = () => {
    router.push({ pathname: '/events/participantsList', params: { eventId: id } });
  };

  const handlePressFavorites = () => {
    router.push({ pathname: '/events/favoritesList', params: { eventId: id } });
  };

  const hasValidImage = typeof imageUrl === 'string' && imageUrl.trim().length > 0;
  const { dateHeure, prixTexte } = formatEventDetails({ date, heureInconnue, prix });
  const eventDate = date instanceof Timestamp ? date.toDate() : new Date(date);
  const isExpired = eventDate < new Date();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, isExpired && { opacity: 0.5 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View>
        <Image
          source={hasValidImage ? { uri: imageUrl } : fallbackImage}
          style={styles.image}
        />

        <View style={styles.topRightButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={() => setShareModalVisible(true)}>
            <MaterialCommunityIcons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartButton} onPress={onToggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.textAndBadgesContainer}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isExpired && styles.expiredText]}>
            {title || 'Événement sans titre'}
          </Text>
          <Text style={[styles.location, isExpired && styles.expiredText]}>
            {location || 'Lieu inconnu'}
          </Text>
          <Text style={[styles.meta, isExpired && styles.expiredText]}>
            {dateHeure} {prixTexte ? `| ${prixTexte}` : ''}
          </Text>
          {isExpired && (
            <Text style={styles.eventEndedText}>Événement terminé</Text>
          )}
        </View>

        <View style={styles.badgesContainer}>
          <TouchableOpacity onPress={handlePressParticipants} style={styles.badge}>
            <Ionicons name="people" size={16} color="#fff" />
            <Text style={styles.badgeText}>{participantsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePressFavorites} style={styles.badge}>
            <Ionicons name="heart" size={16} color="#fff" />
            <Text style={styles.badgeText}>{favoritesCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal partage */}
      <Modal
        animationType="fade"
        transparent
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShareModalVisible(false)}>
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
              <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
                <Ionicons name="link-outline" size={28} color="#222" />
                <Text>Copier lien</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
  },
  topRightButtons: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  shareButton: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 18,
    marginRight: 6,
  },
  heartButton: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 18,
  },
  textAndBadgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
    marginTop: 10,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#fff',
  },
  location: {
    fontFamily: 'Inter',
    fontSize: 14,
    marginTop: 2,
    color: '#fff',
  },
  meta: {
    fontFamily: 'Inter',
    fontSize: 14,
    marginTop: 4,
    color: '#fff',
  },
  expiredText: {
    color: '#ccc',
    opacity: 1,
  },
  eventEndedText: {
    fontFamily: 'Inter-Italic',
    fontSize: 14,
    color: '#FF6666',
    marginTop: 8,
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#804e50ff',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: 'bold',
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
    fontFamily: 'Inter-Bold',
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
