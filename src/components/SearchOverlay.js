import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";
import { SearchBar } from "./SearchBar";
import { SuggestionsList } from "./SuggestionsList";

const START_ACCENT = "#4a8a4a";
const END_ACCENT = colors.primary;

export function SearchOverlay({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startSuggestions,
  endSuggestions,
  startLoading,
  endLoading,
  onStartSelect,
  onEndSelect,
  onSwap,
  canSwap,
}) {
  const [activeField, setActiveField] = useState(null);

  const activeSuggestions =
    activeField === "start" ? startSuggestions : endSuggestions;
  const activeLoading = activeField === "start" ? startLoading : endLoading;
  const activeOnSelect =
    activeField === "start" ? onStartSelect : onEndSelect;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.brand}>RoadBites</Text>
          <Text style={styles.subtitle}>Find hidden gems on your route</Text>
        </View>

        <View style={styles.fieldsRow}>
          <View style={styles.fieldsColumn}>
            <SearchBar
              value={startValue}
              onChangeText={onStartChange}
              placeholder="Where from?"
              returnKeyType="next"
              accentColor={START_ACCENT}
              onFocus={() => setActiveField("start")}
              onBlur={() => setTimeout(() => setActiveField(null), 150)}
            />
            <View style={styles.gap} />
            <SearchBar
              value={endValue}
              onChangeText={onEndChange}
              placeholder="Where to next?"
              returnKeyType="search"
              accentColor={END_ACCENT}
              onFocus={() => setActiveField("end")}
              onBlur={() => setTimeout(() => setActiveField(null), 150)}
            />
          </View>

          <Pressable
            onPress={onSwap}
            disabled={!canSwap}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Swap start and destination"
            style={({ pressed }) => [
              styles.swapBtn,
              !canSwap && styles.swapBtnDisabled,
              pressed && styles.swapBtnPressed,
            ]}
          >
            <SwapIcon />
          </Pressable>
        </View>
      </View>
      <View style={styles.suggestionsContainer}>
        <SuggestionsList
          suggestions={activeSuggestions || []}
          onSelect={activeOnSelect}
          isLoading={activeLoading || false}
          visible={activeField !== null}
        />
      </View>
    </View>
  );
}

function SwapIcon() {
  return (
    <View style={iconStyles.wrap}>
      <View style={iconStyles.arrowUp}>
        <View style={[iconStyles.head, iconStyles.headUp]} />
        <View style={iconStyles.shaft} />
      </View>
      <View style={iconStyles.arrowDown}>
        <View style={iconStyles.shaft} />
        <View style={[iconStyles.head, iconStyles.headDown]} />
      </View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 16,
    height: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  arrowUp: {
    alignItems: "center",
    width: 6,
  },
  arrowDown: {
    alignItems: "center",
    width: 6,
  },
  shaft: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.charcoalWarm,
  },
  head: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  headUp: {
    borderBottomWidth: 4,
    borderBottomColor: colors.charcoalWarm,
  },
  headDown: {
    borderTopWidth: 4,
    borderTopColor: colors.charcoalWarm,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  card: {
    backgroundColor: colors.ivory,
    paddingTop: layout.spacing.sm + 2,
    paddingHorizontal: layout.spacing.md,
    paddingBottom: layout.spacing.md,
    borderBottomLeftRadius: layout.borderRadius.hero,
    borderBottomRightRadius: layout.borderRadius.hero,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
    }),
  },
  header: {
    paddingHorizontal: 2,
    marginBottom: layout.spacing.sm + 2,
  },
  brand: {
    fontSize: layout.fontSize.xl,
    fontWeight: layout.fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: layout.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
    letterSpacing: 0.2,
  },
  fieldsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  fieldsColumn: {
    flex: 1,
  },
  gap: {
    height: layout.spacing.sm,
  },
  swapBtn: {
    width: 40,
    alignSelf: "center",
    marginLeft: layout.spacing.sm,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  swapBtnDisabled: {
    opacity: 0.4,
  },
  swapBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  suggestionsContainer: {
    paddingHorizontal: layout.spacing.md,
  },
});
