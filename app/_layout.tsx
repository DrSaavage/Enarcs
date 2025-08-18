import '@/i18n';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import "react-native-gesture-handler";
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthListener } from '@/lib/authListener';
import { colors, fontSizes, gradientColors, gradientConfig, radius, spacing, ThemeContext } from '@/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    Inter: require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  const user = useAuthListener();

  useEffect(() => {
    if (user === undefined) return;
    if (user) router.replace('/home');
    else router.replace('/auth/login');
  }, [user]);

  if (!loaded || user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ThemeContext.Provider
        value={{
          colors,
          spacing,
          fontSizes,
          radius,
          gradientColors,
          gradientConfig,
        }}
      >
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="messages" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeContext.Provider>
    </NavigationThemeProvider>
  );
}