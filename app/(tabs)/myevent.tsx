// /app/(tabs)/myevents.tsx

import EventCard from '@/components/cards/EventCard';
import { Event, useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import { useParticipations } from '@/hooks/useParticipations';
import { useAuthListener } from '@/lib/authListener';
import { gradientColors, gradientConfig } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MyEventsScreen() {
  const [tab, setTab] = useState<'a_venir' | 'passe' | 'crees'>('a_venir');
  const now = Date.now();
  const router = useRouter();
  const user = useAuthListener();

  const { participations, loading: partLoading } = useParticipations();
  const { favorites, toggleFavorite } = useFavorites();
  const { events, loading: eventsLoading, error } = useEvents();

  const myEvents =
    user && participations.length > 0
      ? events.filter((e) => participations.includes(e.id))
      : [];

  const eventsAVenir = myEvents
    .filter((e) => new Date(e.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const eventsPasse = myEvents
    .filter((e) => new Date(e.date).getTime() <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const eventsCrees = user
    ? events.filter((e) => e.creatorId === user.uid)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
    : [];

  const currentList =
    tab === 'a_venir'
      ? eventsAVenir
      : tab === 'passe'
      ? eventsPasse
      : eventsCrees;

  const isLoading = partLoading || eventsLoading || user === undefined;

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Mes Events</Text>

        <View style={styles.tabsContainer}>
          {['a_venir', 'passe', 'crees'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t as any)}
            >
              <Text
                style={[styles.tabText, tab === t && styles.tabTextActive]}
              >
                {t === 'a_venir' ? 'À venir' : t === 'passe' ? 'Passé' : 'Créés'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.errorText}>Erreur chargement des événements</Text>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {currentList.length === 0 ? (
              <Text style={styles.noEvent}>Aucun événement pour cet onglet.</Text>
            ) : (
              currentList.map((event: Event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  event={event}
                  title={event.title}
                  location={event.location || event.city || ''}
                  date={event.date}
                  heureInconnue={false}
                  prix={
                    typeof event.price === 'string'
                      ? parseFloat(event.price)
                      : event.price
                  }
                  imageUrl={
                    typeof event.imageUrl === 'string' && event.imageUrl.trim().length > 0
                      ? event.imageUrl
                      : ''
                  }
                  isFavorite={favorites.includes(event.id)}
                  onToggleFavorite={() => toggleFavorite(event.id)}
                  onPress={() =>
                    router.push({
                      pathname: `/home/${event.id}`,
                    })
                  }
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 18,
    letterSpacing: 0.6,
    alignSelf: 'flex-start',
    marginLeft: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 22,
    gap: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: 'rgba(248, 246, 246, 0.6)',
  },
  tabText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 17,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 40,
  },
  noEvent: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 42,
    fontSize: 18,
    opacity: 0.7,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
  },
});
