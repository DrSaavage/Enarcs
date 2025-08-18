// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "enarcs",
  slug: "enarcs",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "enarcs",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0F0F0F"
  },

  ios: {
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Cette app utilise ta localisation pour afficher des événements proches."
    }
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#0F0F0F"
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION"
    ]
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#0F0F0F"
      }
    ],
    "expo-font",
    "expo-localization"
  ],

  experiments: {
    typedRoutes: true
  },

  extra: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID
  }
});
