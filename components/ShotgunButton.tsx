// /components/ShotgunButton.tsx

import { useAppTheme } from '@/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;  // Permet d'ajouter une icône à gauche
  style?: ViewStyle;
  textStyle?: any;
  textColor?: string;      // <--- Ajoute ceci
};

export default function ShotgunButton({ label, onPress, icon, style, textStyle, textColor = "#000" }: Props) {
  const { spacing, fontSizes, radius } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: '#fff',
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      activeOpacity={0.87}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          {
            color: textColor, // <--- Ici
            fontFamily: 'Inter-Bold',
            fontSize: fontSizes.md,
            textAlign: 'center',
          },
          textStyle
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 170,
    alignSelf: 'center',
    marginHorizontal: 8,
  },
  icon: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
