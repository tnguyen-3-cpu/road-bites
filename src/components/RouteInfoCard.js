import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";

export function RouteInfoCard({ distance, duration }) {
  if (!distance || !duration) return null;

  return (
    <View style={styles.card}>
      <View style={styles.item}>
        <Text style={styles.value}>{distance}</Text>
        <Text style={styles.label}>Distance</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Text style={styles.value}>{duration}</Text>
        <Text style={styles.label}>Drive time</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 40,
    left: layout.spacing.md,
    right: layout.spacing.md,
    backgroundColor: colors.ivory,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderCream,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: layout.spacing.md + 4,
    paddingHorizontal: layout.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    fontSize: layout.fontSize.xl,
    fontWeight: layout.fontWeight.bold,
    color: colors.text,
  },
  label: {
    fontSize: layout.fontSize.xs,
    fontWeight: layout.fontWeight.regular,
    color: colors.textTertiary,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderWarm,
  },
});
