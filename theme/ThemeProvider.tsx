// Path: theme/ThemeProvider.tsx
import { ThemeContext, colors, fontSizes, gradientColors, gradientConfig, radius, spacing } from "@/theme";
import React from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider
      value={{
        colors,
        spacing,
        fontSizes,
        radius,
        gradientColors,
        gradientConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
