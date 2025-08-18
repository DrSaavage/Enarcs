// /lib/uploadEventImage.ts
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload une image d’event et retourne l’URL
 * @param uri URI locale de l’image (ex: file:///...)
 * @param eventId string - identifiant unique (ex: docRef.id)
 */
export async function uploadEventImageToStorage(uri: string, eventId: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, `eventImages/${eventId}_${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);

  return await getDownloadURL(storageRef);
}
