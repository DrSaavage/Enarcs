// app/(tabs)/_layout.tsx
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { auth, firestore } from '@/lib/firebase';
import { colors, gradientColors, gradientConfig } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

function useUnreadMessagesCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let unsubChats: (() => void) | null = null;
    let unsubUnreads: Array<() => void> = [];
    let totals: { [chatId: string]: number } = {};

    function cleanup() {
      unsubUnreads.forEach(fn => fn());
      unsubUnreads = [];
      totals = {};
    }

    const listen = () => {
      const user = auth.currentUser;
      if (!user) {
        setCount(0);
        cleanup();
        return;
      }
      const userId = user.uid;
      const chatsRef = collection(firestore, 'chats');
      unsubChats = onSnapshot(chatsRef, (snapshot) => {
        cleanup();
        const userChats = snapshot.docs.filter(doc =>
          Array.isArray(doc.data().participants) && doc.data().participants.includes(userId)
        );
        if (userChats.length === 0) {
          setCount(0);
          return;
        }
        userChats.forEach(chatDoc => {
          const unreadRef = doc(firestore, 'chats', chatDoc.id, 'unreads', userId);
          const unsub = onSnapshot(unreadRef, snap => {
            const val = snap.exists() && typeof snap.data().count === 'number'
              ? snap.data().count
              : 0;
            totals[chatDoc.id] = val;
            setCount(Object.values(totals).reduce((a, b) => a + b, 0));
          });
          unsubUnreads.push(unsub);
        });
      });
    };

    listen();

    // Relance l'écoute si l'user change
    const interval = setInterval(() => {
      listen();
    }, 1500);

    return () => {
      if (unsubChats) unsubChats();
      cleanup();
      clearInterval(interval);
    };
  }, [auth.currentUser]);

  return count;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const unreadCount = useUnreadMessagesCount();

  // Icône Messages avec badge
  function MessagesTabIcon({ color }) {
    return (
      <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
        <IconSymbol size={28} name="paperplane" color={color} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={styles.container}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
              backgroundColor: 'transparent',
            },
            default: {
              backgroundColor: 'transparent',
            },
          }),
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="bolt" color={color} />,
          }}
        />
        <Tabs.Screen
          name="myevent"
          options={{
            title: 'My Events',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="tray" color={color} />,
          }}
        />
        <Tabs.Screen
          name="create-event"
          options={{
            title: 'Create',
            tabBarIcon: ({ color }) => <IconSymbol size={34} name="plus.circle" color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages-list"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color }) => <MessagesTabIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile-main"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
          }}
        />
      </Tabs>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,      
    right: -8,    
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EA3943',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});