// Path: theme/PageContainer.tsx
import { useAppTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type PageContainerProps = {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
};

export default function PageContainer({
  title,
  children,
  showBackButton = true,
}: PageContainerProps) {
  const router = useRouter();
  const { colors, spacing, fontSizes, gradientColors, gradientConfig } = useAppTheme();

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
          {showBackButton && (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: spacing.sm }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.light.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: colors.light.text, fontSize: fontSizes.xxl }]}>
            {title}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: spacing.md }}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    // fontSize est maintenant contrôlé par fontSizes.xxl
  },
});
