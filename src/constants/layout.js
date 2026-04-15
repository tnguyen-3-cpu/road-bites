import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const layout = {
  window: { width, height },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,        // Subtly rounded
    md: 8,        // Comfortably rounded (standard cards/buttons)
    lg: 12,       // Generously rounded (inputs, primary buttons)
    xl: 16,       // Featured containers
    hero: 32,     // Hero containers, large cards
  },
  fontSize: {
    xs: 12,       // Labels, badges
    sm: 14,       // Captions, metadata
    md: 16,       // Body standard
    lg: 17,       // Body / nav
    xl: 20,       // Body large, intro text
    heading: 25,  // Sub-heading small
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.6,
  },
};
