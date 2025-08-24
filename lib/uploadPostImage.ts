// lib/uploadPostImage.ts
import { storage } from '@/lib/firebase'; // Assure-toi que storage est exporté dans lib/firebase
import * as FileSystem from 'expo-file-system';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export async function uploadPostImage(localUri: string, postId: string) {
  // Si pas de storage (ex: Expo Go sans config), on renvoie l’URI locale
  if (!storage) return localUri;

  try {
    const file = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
    const buffer = Buffer.from(file, 'base64');
    const ext = (localUri.split('.').pop() || 'jpg').toLowerCase();
    const storageRef = ref(storage, `posts/${postId}.${ext}`);
    await uploadBytes(storageRef, buffer);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch {
    // En cas d’échec (permissions/storage non branché), on renvoie l’URI locale
    return localUri;
  }
}
