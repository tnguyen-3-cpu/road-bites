export default ({ config }) => ({
  ...config,
  name: "Road Bites",
  slug: "road-bites",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.timothymonkey2006.roadbites",
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Road Bites uses your location to show nearby food stops along your route.",
      NSLocationAlwaysUsageDescription:
        "Road Bites uses your location to show nearby food stops along your route.",
      LSApplicationQueriesSchemes: ["snssdk1233", "tiktok"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.timothymonkey2006.roadbites",
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    queries: [
      { scheme: "snssdk1233" },
      { scheme: "tiktok" },
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Road Bites uses your location to find food stops along your route.",
      },
    ],
  ],
});
