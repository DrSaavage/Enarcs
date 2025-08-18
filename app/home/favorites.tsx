// /app/(tabs)/home/favorites.tsx

import EventCard from '@/components/cards/EventCard';
import { useFavorites } from '@/hooks/useFavorites';
import { firestore } from '@/lib/firebase';
import { gradientColors, gradientConfig } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Timestamp, collection, getDocs, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useFavorites();
  const router = useRouter();

  const [favoriteEvents, setFavoriteEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteEvents = async () => {
      if (!favorites.length) {
        setFavoriteEvents([]);
        setLoading(false);
        return;
      }

      try {
        const eventsRef = collection(firestore, 'events');
        const q = query(eventsRef);
        const querySnapshot = await getDocs(q);

        const allEvents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          };
        });

        // On filtre ensuite par favoris
        const filtered = allEvents.filter(e => favorites.includes(e.id));
        setFavoriteEvents(filtered);
      } catch (error) {
        setFavoriteEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteEvents();
  }, [favorites]);

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 16 }}>
          <TouchableOpacity style={{ padding: 8, marginRight: 10 }} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <Text style={[styles.title, { marginTop: 0 }]}>Mes Favoris</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="white" style={{ marginTop: 50 }} />
        ) : favoriteEvents.length === 0 ? (
          <Text style={styles.emptyText}>Aucun favori pour l’instant.</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.cardContainer}>
            {favoriteEvents.map((event) => {
              // 🔥 Ici on transforme le Timestamp Firestore en Date
              const dateObj =
                event.date instanceof Timestamp
                  ? event.date.toDate()
                  : typeof event.date === 'string'
                  ? new Date(event.date)
                  : event.date ?? new Date();

              return (
                <EventCard
                  key={event.id}
                  id={event.id}
                  event={event}
                  title={event.title}
                  location={event.location}
                  date={dateObj}
                  heureInconnue={false}
                  prix={
                    typeof event.price === 'string'
                      ? parseFloat(event.price)
                      : event.price
                  }
                  imageUrl={event.imageUrl}
                  isFavorite={true}
                  onToggleFavorite={() => toggleFavorite(event.id)}
                  onPress={() =>
                    router.push({
                      pathname: `/home/${event.id}`,
                      params: { event: JSON.stringify(event) },
                    })
                  }
                />
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 0 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
    letterSpacing: 1,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 80,
  },
  cardContainer: {
    paddingHorizontal: 12,
    gap: 16,
    paddingBottom: 20,
  },
});
