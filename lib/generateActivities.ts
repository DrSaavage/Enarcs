// lib/generateActivities.ts
import type { Event } from '@/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from './firebase';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} | ${hours}:${minutes}`;
}

export async function generateActivities(city: string): Promise<Event[]> {
  try {
    if (!firestore) {
      return [];
    }

    const eventsRef = collection(firestore, 'events');
    const q = query(eventsRef, where('location', '==', city));
    const querySnapshot = await getDocs(q);

    const events: Event[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        date: data.date?.toDate ? formatDate(data.date.toDate().toISOString()) : '',
        location: data.location || '',
        price: data.price || '',
        image: data.image || '',
        type: data.type || '',
        favorites: data.favorites || [],
        participants: data.participants || [],
        creatorId: data.creatorId || '',
        createdAt: data.createdAt?.toDate ? formatDate(data.createdAt.toDate().toISOString()) : '',
        city: data.city || '',
        country: data.country || '',
        lat: data.lat ?? undefined,
        lng: data.lng ?? undefined,
        place_id: data.place_id || '',
      });
    });

    if (events.length === 0) {
      const now = new Date().toISOString();

      return [
        {
          id: 'fallback',
          title: 'Meetup',
          description: 'Rejoins-nous pour un événement inoubliable !',
          date: formatDate(now),
          location: city,
          price: 'Gratuit',
          image: 'https://source.unsplash.com/random/800x600?party',
          type: 'soirée',
          favorites: [],
          participants: [],
          creatorId: '',
          createdAt: formatDate(now),
        },
      ];
    }

    return events;
  } catch (error) {
    return [];
  }
}
