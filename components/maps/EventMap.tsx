// 📄 /components/maps/EventMap.tsx

import cities from '@/assets/data/cities.json';
import fallbackImage from '@/assets/images/events-default.jpg';
import { Event } from '@/types/Event';
import { useRouter } from 'expo-router';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';

const screen = Dimensions.get('window');

type Props = {
  events: Event[];
};

type City = {
  name: string;
  lat: string; // string dans cities.json
  lng: string;
  country: string;
};

// 🔥 Récupère les coordonnées prioritaires depuis l'event (lat/lng Firestore), sinon fallback
function getEventLatLng(event: any): { latitude: number, longitude: number } | null {
  if (event.lat && event.lng) {
    return {
      latitude: typeof event.lat === "string" ? parseFloat(event.lat) : event.lat,
      longitude: typeof event.lng === "string" ? parseFloat(event.lng) : event.lng,
    };
  }

  // fallback : lookup city/country
  if ((event.city || event.location) && event.country) {
    const cityName = (event.city || event.location).toLowerCase();
    const country = event.country.toLowerCase();
    const cityMatch = (cities as City[]).find(
      c => c.name.toLowerCase() === cityName && c.country.toLowerCase() === country
    );
    if (cityMatch) {
      return {
        latitude: parseFloat(cityMatch.lat),
        longitude: parseFloat(cityMatch.lng),
      };
    }
  }
  // fallback Casablanca
  return {
    latitude: 33.58831,
    longitude: -7.61138,
  };
}

// Décale chaque event (si plusieurs au même endroit) pour ne pas stacker les pins
function getOffsetCoords(
  coords: { latitude: number; longitude: number },
  index: number
): { latitude: number; longitude: number } {
  if (index === 0) return coords;
  // Décalage circulaire de ~15m
  const R = 0.00015;
  const angle = (index * 60) * (Math.PI / 180);
  return {
    latitude: coords.latitude + R * Math.cos(angle),
    longitude: coords.longitude + R * Math.sin(angle),
  };
}

export default function EventMap({ events }: Props) {
  const router = useRouter();

  // Grouper par coordonnée arrondie
  const eventsByCoord = new Map<string, Event[]>();
  events.forEach(ev => {
    const coords = getEventLatLng(ev);
    if (!coords) return;
    const key = `${coords.latitude.toFixed(5)}_${coords.longitude.toFixed(5)}`;
    if (!eventsByCoord.has(key)) eventsByCoord.set(key, []);
    eventsByCoord.get(key)!.push(ev);
  });

  // Centrage sur le premier event avec coords valides
  let region: Region = {
    latitude: 33.58831,
    longitude: -7.61138,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };
  const firstWithCoords = events.find(e => getEventLatLng(e));
  if (firstWithCoords) {
    const coords = getEventLatLng(firstWithCoords)!;
    region = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }

  return (
    <MapView style={styles.map} initialRegion={region}>
      {[...eventsByCoord.entries()].map(([key, eventsList]) =>
        eventsList.map((event, idx) => {
          const baseCoords = getEventLatLng(event)!;
          const coords = getOffsetCoords(baseCoords, idx);
          return (
            <Marker
              key={event.id}
              coordinate={coords}
              title={event.title}
              description={event.address || event.location || event.city}
            >
              <Callout
                tooltip
                style={styles.calloutBox}
                onPress={() =>
                  router.push({
                    pathname: `/home/${event.id}`,
                    params: { event: JSON.stringify(event) },
                  })
                }
              >
                <View style={styles.calloutTouchable}>
                  <View style={styles.card}>
                    <Image
                      source={
                        typeof event.imageUrl === 'string' && event.imageUrl.trim()
                          ? { uri: event.imageUrl }
                          : fallbackImage
                      }
                      style={styles.image}
                    />
                    <View style={styles.textBlock}>
                      <Text style={styles.title} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {event.address || event.location || event.city}
                      </Text>
                    </View>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  calloutBox: {
    minWidth: 220,
    maxWidth: 260,
    alignSelf: 'center',
    padding: 0,
  },
  calloutTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333333',
    elevation: 7,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
  },
  image: {
    width: 62,
    height: 62,
    borderRadius: 9,
    marginRight: 8,
    backgroundColor: '#222',
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  meta: {
    fontSize: 13,
    color: '#bebebe',
    marginBottom: 1,
  },
});
