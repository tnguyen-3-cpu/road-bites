import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  returnKeyType,
  onFocus,
  onBlur,
}) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType || "search"}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ivory,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm + 2,
    marginBottom: layout.spacing.sm,
  },
  input: {
    fontSize: layout.fontSize.md,
    fontWeight: layout.fontWeight.regular,
    color: colors.text,
    height: 36,
    padding: 0,
  },
});
