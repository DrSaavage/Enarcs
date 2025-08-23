// Path: app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // 👉 Toujours rediriger vers le feed au lancement (accessible à tous)
  return <Redirect href="/(tabs)/feed" />;
}
