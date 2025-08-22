// Path: app/(tabs)/myCircle.tsx
import PageContainer from "@/theme/PageContainer";
import { StyleSheet, Text, View } from "react-native";

export default function myCircleScreen() {
  return (
    <PageContainer title="Mon cercle" showBackButton={false}>
      <View style={styles.content}>
        <Text style={styles.text}>Contenu du cercle ici...</Text>
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
