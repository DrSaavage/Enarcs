// Path: app/(tabs)/feed.tsx
import PageContainer from "@/theme/PageContainer";
import { StyleSheet, Text, View } from "react-native";

export default function FeedScreen() {
  return (
    <PageContainer title="Feed" showBackButton={false}>
      <View style={styles.content}>
        <Text style={styles.text}>Contenu du feed ici...</Text>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
});
