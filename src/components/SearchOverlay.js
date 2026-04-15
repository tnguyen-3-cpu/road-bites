import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";
import { SearchBar } from "./SearchBar";
import { SuggestionsList } from "./SuggestionsList";

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
}) {
  const [activeField, setActiveField] = useState(null);

  const activeSuggestions =
    activeField === "start" ? startSuggestions : endSuggestions;
  const activeLoading =
    activeField === "start" ? startLoading : endLoading;
  const activeOnSelect =
    activeField === "start" ? onStartSelect : onEndSelect;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <SearchBar
          value={startValue}
          onChangeText={onStartChange}
          placeholder="Starting point"
          returnKeyType="next"
          onFocus={() => setActiveField("start")}
          onBlur={() => setTimeout(() => setActiveField(null), 150)}
        />
        <SearchBar
          value={endValue}
          onChangeText={onEndChange}
          placeholder="Destination"
          returnKeyType="search"
          onFocus={() => setActiveField("end")}
          onBlur={() => setTimeout(() => setActiveField(null), 150)}
        />
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

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  card: {
    backgroundColor: colors.ivory,
    paddingTop: layout.spacing.sm,
    paddingHorizontal: layout.spacing.md,
    paddingBottom: layout.spacing.md,
    borderBottomLeftRadius: layout.borderRadius.xl,
    borderBottomRightRadius: layout.borderRadius.xl,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.08)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  suggestionsContainer: {
    paddingHorizontal: layout.spacing.md,
  },
});
