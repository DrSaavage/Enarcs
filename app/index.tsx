// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirige vers le feed au lancement
  return <Redirect href="/(tabs)/feed" />;
}
