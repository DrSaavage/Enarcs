// Path: app/(tabs)/messagesList.tsx
import PageContainer from "@/theme/PageContainer";
import { StyleSheet, Text, View } from "react-native";

export default function MessagesListScreen() {
  return (
    <PageContainer title="Messages" showBackButton={false}>
      <View style={styles.content}>
        <Text style={styles.text}>Liste des messages ici...</Text>
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
