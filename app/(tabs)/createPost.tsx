// Path: app/(tabs)/createPost.tsx
import PageContainer from "@/theme/PageContainer";
import { StyleSheet, Text, View } from "react-native";

export default function CreatePostScreen() {
  return (
    <PageContainer title="Créer un post" showBackButton={false}>
      <View style={styles.content}>
        <Text style={styles.text}>Contenu pour créer un post ici...</Text>
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
