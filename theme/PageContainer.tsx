import { useAppTheme } from "@/theme"; // ALIAS ABSOLU
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
      <SafeAreaView style={{ flex: 1, paddingHorizontal: spacing.md }}>
        <View style={styles(spacing).header}>
          {showBackButton && (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles(spacing).backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.light.text} />
            </TouchableOpacity>
          )}
          <Text
            style={[
              styles(spacing, fontSizes).title,
              { color: colors.light.text },
            ]}
          >
            {title}
          </Text>
        </View>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = (spacing: any = {}, fontSizes: any = {}) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.lg || 24,
      marginTop: spacing.sm || 8,
    },
    backButton: {
      marginRight: spacing.md || 16,
      padding: 4,
    },
    title: {
      fontSize: fontSizes.lg || 20,
      fontWeight: "bold",
    },
  });
