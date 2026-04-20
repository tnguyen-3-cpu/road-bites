import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";

export function MapControls({ onRecenter, bottomOffset = 24 }) {
  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onRecenter}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Recenter map on my location"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <View style={styles.ring}>
          <View style={styles.dot} />
        </View>
      </Pressable>
    </View>
  );
}

const FAB_SIZE = 48;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 16,
    alignItems: "flex-end",
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.ivory,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderWarm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
