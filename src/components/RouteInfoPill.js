import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";

export function RouteInfoPill({ distance, duration, stopCount }) {
  if (!distance || !duration) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <View style={styles.pill}>
        <Stat value={duration} label="time" />
        <Divider />
        <Stat value={distance} label="distance" />
        {stopCount != null ? (
          <>
            <Divider />
            <Stat value={String(stopCount)} label={stopCount === 1 ? "stop" : "stops"} />
          </>
        ) : null}
      </View>
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginTop: layout.spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.nearBlack,
    paddingHorizontal: layout.spacing.md + 2,
    paddingVertical: layout.spacing.sm,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  stat: {
    alignItems: "center",
    paddingHorizontal: layout.spacing.sm + 2,
  },
  value: {
    color: colors.ivory,
    fontSize: layout.fontSize.md,
    fontWeight: layout.fontWeight.bold,
    letterSpacing: 0.2,
  },
  label: {
    color: colors.textOnDark,
    fontSize: 10,
    fontWeight: layout.fontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
