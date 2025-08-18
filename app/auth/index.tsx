import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const options = { headerShown: false };

export default function AuthScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#000000', '#1C1C1C', 'rgba(90, 26, 26, 0.6)']} // Shotgun-style dark gradient
      style={styles.container}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={styles.title}>enarcs</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/auth/signup')}
        >
          <Text style={styles.buttonText}>S'inscrire</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 60,
  },
  buttonContainer: {
    width: '90%',
    gap: 16,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
