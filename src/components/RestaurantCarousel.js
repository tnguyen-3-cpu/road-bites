import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = layout.spacing.sm + 2;
const SIDE = layout.spacing.md;
export const CARD_WIDTH = Math.min(SCREEN_WIDTH - SIDE * 2 - 32, 300);
const SNAP = CARD_WIDTH + GAP;

function DetourPill({ detour }) {
  const { detourMinutes, isLoading, error } = detour;

  if (error) return null;
  if (isLoading) {
    return (
      <View style={[styles.detourPill, styles.detourPillLoading]}>
        <Text style={styles.detourPillText}>…</Text>
      </View>
    );
  }
  if (detourMinutes == null) return null;
  if (detourMinutes === 0) {
    return (
      <View style={[styles.detourPill, styles.detourPillOnRoute]}>
        <Text style={styles.detourPillText}>On route</Text>
      </View>
    );
  }
  return (
    <View style={[styles.detourPill, styles.detourPillAmber]}>
      <Text style={styles.detourPillText}>+{detourMinutes} min</Text>
    </View>
  );
}

function Card({ restaurant, selected, onPress, detour }) {
  return (
    <Pressable
      onPress={() => onPress(restaurant)}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.ratingChip}>
          <Text style={styles.ratingChipText}>
            {restaurant.rating != null ? restaurant.rating.toFixed(1) : "★"}
          </Text>
        </View>
        {restaurant.priceRange ? (
          <Text style={styles.price}>{restaurant.priceRange}</Text>
        ) : null}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {restaurant.name}
      </Text>
      {restaurant.cuisine ? (
        <Text style={styles.cuisine} numberOfLines={1}>
          {restaurant.cuisine}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.reviews} numberOfLines={1}>
            {restaurant.reviewCount
              ? `${restaurant.reviewCount.toLocaleString()} reviews`
              : "New find"}
          </Text>
          {selected && detour ? <DetourPill detour={detour} /> : null}
        </View>
        <Text style={styles.cta}>Details →</Text>
      </View>
    </Pressable>
  );
}

export function RestaurantCarousel({
  restaurants,
  selectedId,
  onSelect,
  onOpen,
  bottomInset = 0,
  focusedDetour = null,
}) {
  const listRef = useRef(null);

  const scrollToIndex = useCallback((index) => {
    if (!listRef.current) return;
    listRef.current.scrollToOffset({
      offset: index * SNAP,
      animated: true,
    });
  }, []);

  // Keep carousel in sync when selection changes from map taps
  useEffect(() => {
    if (!selectedId || !restaurants?.length) return;
    const index = restaurants.findIndex((r) => r.id === selectedId);
    if (index >= 0) scrollToIndex(index);
  }, [selectedId, restaurants, scrollToIndex]);

  const handleMomentumEnd = useCallback(
    (e) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SNAP);
      const next = restaurants[index];
      if (next && next.id !== selectedId) onSelect?.(next);
    },
    [restaurants, selectedId, onSelect]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <Card
        restaurant={item}
        selected={item.id === selectedId}
        onPress={onOpen}
        detour={item.id === selectedId ? focusedDetour : null}
      />
    ),
    [selectedId, onOpen, focusedDetour]
  );

  const keyExtractor = useCallback(
    (item, i) => item.id ?? `${item.name}-${i}`,
    []
  );

  if (!restaurants || restaurants.length === 0) return null;

  return (
    <View
      style={[styles.container, { paddingBottom: bottomInset + 8 }]}
      pointerEvents="box-none"
    >
      <View style={styles.headerRow} pointerEvents="none">
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {restaurants.length} hidden gem
            {restaurants.length === 1 ? "" : "s"} along your route
          </Text>
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={restaurants}
        horizontal
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        contentContainerStyle={styles.listContent}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP}
        snapToAlignment="start"
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: SNAP,
          offset: SNAP * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    alignItems: "center",
    marginBottom: layout.spacing.sm,
    paddingHorizontal: SIDE,
  },
  countPill: {
    backgroundColor: colors.nearBlack,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  countText: {
    color: colors.ivory,
    fontSize: layout.fontSize.xs,
    fontWeight: layout.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: SIDE,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.ivory,
    borderRadius: layout.borderRadius.xl,
    padding: layout.spacing.md,
    borderWidth: 1,
    borderColor: colors.borderCream,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    padding: layout.spacing.md - 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    minWidth: 40,
    alignItems: "center",
  },
  ratingChipText: {
    color: colors.ivory,
    fontSize: layout.fontSize.xs,
    fontWeight: layout.fontWeight.bold,
    letterSpacing: 0.3,
  },
  price: {
    fontSize: layout.fontSize.sm,
    fontWeight: layout.fontWeight.semibold,
    color: colors.textSecondary,
  },
  name: {
    marginTop: layout.spacing.sm + 2,
    fontSize: layout.fontSize.lg,
    fontWeight: layout.fontWeight.bold,
    color: colors.text,
  },
  cuisine: {
    marginTop: 2,
    fontSize: layout.fontSize.sm,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: layout.spacing.sm + 2,
    paddingTop: layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderCream,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: layout.spacing.sm,
    gap: 6,
  },
  detourPill: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  detourPillAmber: {
    backgroundColor: "#F4A84B", // warm amber
  },
  detourPillLoading: {
    backgroundColor: colors.borderCream,
  },
  detourPillOnRoute: {
    backgroundColor: "#2f8a4a",
  },
  detourPillText: {
    color: colors.ivory,
    fontSize: layout.fontSize.xs,
    fontWeight: layout.fontWeight.bold,
    letterSpacing: 0.3,
  },
  reviews: {
    fontSize: layout.fontSize.xs,
    color: colors.textTertiary,
    flexShrink: 1,
  },
  cta: {
    fontSize: layout.fontSize.xs,
    fontWeight: layout.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
