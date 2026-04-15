import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";

export function SuggestionsList({ suggestions, onSelect, isLoading, visible }) {
  if (!visible) return null;
  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <View style={styles.container}>
      {isLoading && suggestions.length === 0 ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onSelect(item)}
              activeOpacity={0.6}
            >
              <Text style={styles.mainText} numberOfLines={1}>
                {item.mainText}
              </Text>
              {item.secondaryText ? (
                <Text style={styles.secondaryText} numberOfLines={1}>
                  {item.secondaryText}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ivory,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderCream,
    marginTop: layout.spacing.xs,
    maxHeight: 220,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingRow: {
    paddingVertical: layout.spacing.md,
    alignItems: "center",
  },
  row: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm + 2,
  },
  mainText: {
    fontSize: layout.fontSize.md,
    fontWeight: layout.fontWeight.medium,
    color: colors.text,
  },
  secondaryText: {
    fontSize: layout.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderCream,
    marginHorizontal: layout.spacing.md,
  },
});
