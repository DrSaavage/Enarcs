// 📄 /lib/useGooglePlaces.ts

import { useState } from 'react';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

type PlaceSuggestion = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type PlaceDetails = {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  address?: string;
};

export function useGooglePlacesAutocomplete() {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search (avec autocomplétion)
  const search = async (input: string, userCoords?: { latitude: number; longitude: number }) => {
    setError(null);
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&language=fr&types=geocode|establishment`;
      if (userCoords) {
        url += `&location=${userCoords.latitude},${userCoords.longitude}&radius=35000`;
      }

      const res = await fetch(url);
      const json = await res.json();
      
      if (json.status === 'OK') {
        setSuggestions(json.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      setSuggestions([]);
      setError('Erreur lors de la recherche');
    }
    setLoading(false);
  };

  // Get détails (lat/lng, ville, pays...)
  const fetchDetails = async (place_id: string): Promise<PlaceDetails | null> => {
    setError(null);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_API_KEY}&language=fr`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status !== 'OK') return null;
      const result = json.result;
      const location = result.geometry.location;
      let city = '';
      let country = '';
      if (result.address_components) {
        for (const comp of result.address_components) {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('country')) country = comp.long_name;
        }
      }
      return {
        lat: location.lat,
        lng: location.lng,
        address: result.formatted_address,
        city,
        country,
      };
    } catch (e) {
      setError('Erreur lors de la récupération du lieu');
      return null;
    }
  };

  return { suggestions, loading, error, search, fetchDetails };
}
