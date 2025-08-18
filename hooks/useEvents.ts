// hooks/useEvents.ts

import { firestore } from '@/lib/firebase';
import type { Event } from '@/types';
import {
  collection,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, 'events'), orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData: Event[] = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;

          return {
            id: doc.id,
            title: data.title ?? '',
            description: data.description ?? '',
            location: data.location ?? '',
            date: data.date?.toDate?.() ?? null, // toujours un Date JS ou null
            price:
              typeof data.price === 'number'
                ? data.price
                : typeof data.price === 'string'
                ? parseFloat(data.price)
                : null,
            imageUrl: data.imageUrl ?? '',
            type: data.type ?? '',
            creatorId: data.creatorId ?? '',
            participants: Array.isArray(data.participants) ? data.participants : [],
            favorites: Array.isArray(data.favorites) ? data.favorites : [],
            createdAt: data.createdAt?.toDate?.() ?? null,
          };
        });

        setEvents(eventsData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getEventById = (id: string | undefined | null) => {
    if (!id) return null;
    return events.find((e) => e.id === id) ?? null;
  };

  return { events, loading, error, getEventById };
}
