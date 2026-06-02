import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Marker } from "react-native-maps";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";

const ACCENT = {
  start: "#4a8a4a",
  end: colors.primary,
};

function RoutePinMarkerImpl({ coordinate, variant, title, description }) {
  const accent = ACCENT[variant] ?? colors.primary;

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.wrapper}>
        <View style={[styles.pill, { borderColor: accent }]}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[styles.label, { color: accent }]}>
            {variant === "start" ? "Start" : "Destination"}
          </Text>
        </View>
        <View style={[styles.tail, { borderTopColor: accent }]} />
      </View>
    </Marker>
  );
}

export const RoutePinMarker = React.memo(RoutePinMarkerImpl);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.ivory,
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: layout.fontSize.xs,
    fontWeight: layout.fontWeight.bold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
});
