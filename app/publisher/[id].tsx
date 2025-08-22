// app/publisher/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PublisherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#000000', '#1C1C1C', 'rgba(90, 26, 26, 0.6)']}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Publisher</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.idText}>ID: {id}</Text>
          {/* TODO: fetch and render publisher info + price here */}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  idText: { color: '#fff', fontSize: 16, opacity: 0.9 },
});
