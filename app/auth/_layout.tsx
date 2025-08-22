// Path: app/(app)/_layout.tsx
// Guard invité: seul /home est accessible. Tout le reste => /auth/locked
import { auth } from '@/lib/firebase';
import { Redirect, Stack, usePathname } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';

const ALLOWED_FOR_GUEST = ['/feed']; // STYLE: ajoute d'autres routes publiques si besoin

export default function AppLayout() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsGuest(!!u?.isAnonymous); // STYLE: true si auth anonyme
      setReady(true);
    });
    return unsub;
  }, []);

  const allowed = useMemo(() => {
    return ALLOWED_FOR_GUEST.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
  }, [pathname]);

  if (!ready) return null; // STYLE: évite les clignotements pendant init Firebase

  if (isGuest && !allowed) {
    // STYLE: redirige tout invité hors /home vers l'écran verrouillé
    return <Redirect href="/auth/locked" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
