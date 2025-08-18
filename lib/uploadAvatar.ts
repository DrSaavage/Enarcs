// /lib/uploadAvatar.ts
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload un avatar local (image) dans Firebase Storage
 * @param {string} uri - L’URI locale du fichier (ex: file:///...)
 * @param {string} uid - L'ID utilisateur pour lier l'avatar
 * @returns {Promise<string>} - L’URL publique de l’avatar
 */
export async function uploadAvatarToStorage(uri: string, uid: string): Promise<string> {
  try {
    // Récupère le blob à partir de l’URI locale (Expo)
    const response = await fetch(uri);
    const blob = await response.blob();

    // Crée le chemin de stockage : avatars/uid_timestamp.jpg
    const path = `avatars/${uid}_${Date.now()}.jpg`;
    const storageRef = ref(storage, path);

    // Upload du fichier sur Firebase Storage
    await uploadBytes(storageRef, blob);

    // Récupère l’URL publique
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (err) {
    console.error('Echec de l’upload avatar:', err);
    throw new Error("Echec de l'upload");
  }
}
