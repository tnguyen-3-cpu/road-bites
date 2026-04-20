import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Marker } from "react-native-maps";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";

function RestaurantMarkerImpl({ restaurant, selected, onPress }) {
  const { rating, latitude, longitude } = restaurant;
  const handlePress = () => onPress?.(restaurant);
  const label = rating != null ? rating.toFixed(1) : "★";

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={Platform.OS === "ios" ? selected : true}
    >
      <View style={styles.wrapper}>
        <View style={[styles.bubble, selected && styles.bubbleSelected]}>
          <Text style={[styles.rating, selected && styles.ratingSelected]}>
            {label}
          </Text>
        </View>
        <View style={[styles.tail, selected && styles.tailSelected]} />
      </View>
    </Marker>
  );
}

export const RestaurantMarker = React.memo(RestaurantMarkerImpl);

const BUBBLE = 36;
const BUBBLE_SELECTED = 46;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.ivory,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bubbleSelected: {
    width: BUBBLE_SELECTED,
    height: BUBBLE_SELECTED,
    borderRadius: BUBBLE_SELECTED / 2,
    backgroundColor: colors.nearBlack,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  rating: {
    fontSize: 13,
    fontWeight: layout.fontWeight.bold,
    color: colors.ivory,
    letterSpacing: 0.2,
  },
  ratingSelected: {
    fontSize: 15,
    color: colors.primary,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.primary,
    marginTop: -1,
  },
  tailSelected: {
    borderTopColor: colors.primary,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
  },
});
