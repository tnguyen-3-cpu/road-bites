import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { getRestaurantDetails } from "../api/googlePlaces";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";

function buildYelpUrl(name, latitude, longitude) {
  const q = encodeURIComponent(name);
  return `https://www.yelp.com/search?find_desc=${q}&find_loc=${latitude},${longitude}`;
}

async function openTikTokFor(name, address) {
  // Build a specific search query (include city for disambiguation).
  let query = name;
  if (address) {
    const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) query = `${name} ${parts[1]}`;
  }
  const searchQ = encodeURIComponent(query + " review");

  // Hashtag form of the name: lowercase alphanumeric (e.g. "Franklin Barbecue" → "franklinbarbecue").
  const hashtag = name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Try in priority order:
  //  1. Custom scheme (instant app open, no browser detour)
  //  2. Hashtag universal link (TikTok registers /tag/* — iOS opens the app)
  //  3. Web search (always works, but opens browser)
  const candidates = [
    `snssdk1233://search?keyword=${searchQ}`,
    `tiktok://search?keyword=${searchQ}`,
    hashtag.length >= 3 ? `https://www.tiktok.com/tag/${hashtag}` : null,
    `https://www.tiktok.com/search?q=${searchQ}`,
  ].filter(Boolean);

  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
    } catch {}
  }
}

export function RestaurantDetailSheet({ restaurant, visible, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !restaurant?.id) {
      setDetails(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getRestaurantDetails(restaurant.id)
      .then((d) => {
        if (!cancelled) setDetails(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, restaurant?.id]);

  if (!restaurant) return null;

  const openYelp = () => {
    Linking.openURL(
      buildYelpUrl(restaurant.name, restaurant.latitude, restaurant.longitude)
    ).catch(() => {});
  };

  const openTikTok = () => {
    const address = details?.address ?? restaurant.address;
    openTikTokFor(restaurant.name, address).catch(() => {});
  };

  const openWebsite = () => {
    if (details?.website) Linking.openURL(details.website).catch(() => {});
  };

  const callPhone = () => {
    if (details?.phone)
      Linking.openURL(`tel:${details.phone.replace(/\s/g, "")}`).catch(() => {});
  };

  const reviews = details?.reviews ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.name}>{restaurant.name}</Text>

            <View style={styles.metaRow}>
              {restaurant.rating ? (
                <Text style={styles.rating}>
                  {restaurant.rating} ★
                  {restaurant.reviewCount
                    ? ` (${restaurant.reviewCount.toLocaleString()})`
                    : ""}
                </Text>
              ) : null}
              {restaurant.priceRange ? (
                <Text style={styles.meta}>  ·  {restaurant.priceRange}</Text>
              ) : null}
              {restaurant.cuisine ? (
                <Text style={styles.meta}>  ·  {restaurant.cuisine}</Text>
              ) : null}
            </View>

            {details?.summary ? (
              <Text style={styles.summary}>{details.summary}</Text>
            ) : null}

            {details?.openNow != null ? (
              <Text
                style={[
                  styles.openStatus,
                  details.openNow ? styles.openNow : styles.closedNow,
                ]}
              >
                {details.openNow ? "Open now" : "Closed"}
              </Text>
            ) : null}

            {details?.address ? (
              <Text style={styles.address}>{details.address}</Text>
            ) : restaurant.address ? (
              <Text style={styles.address}>{restaurant.address}</Text>
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={openTikTok}>
                <Text style={styles.actionText}>Find on TikTok</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={openYelp}>
                <Text style={styles.actionText}>View on Yelp</Text>
              </TouchableOpacity>
              {details?.website ? (
                <TouchableOpacity style={styles.actionBtn} onPress={openWebsite}>
                  <Text style={styles.actionText}>Website</Text>
                </TouchableOpacity>
              ) : null}
              {details?.phone ? (
                <TouchableOpacity style={styles.actionBtn} onPress={callPhone}>
                  <Text style={styles.actionText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Reviews</Text>
            {loading && !details ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyReviews}>No reviews available.</Text>
            ) : (
              reviews.slice(0, 5).map((rev, i) => (
                <View key={i} style={styles.review}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor} numberOfLines={1}>
                      {rev.author}
                    </Text>
                    {rev.rating ? (
                      <Text style={styles.reviewRating}>{rev.rating} ★</Text>
                    ) : null}
                  </View>
                  {rev.relativeTime ? (
                    <Text style={styles.reviewTime}>{rev.relativeTime}</Text>
                  ) : null}
                  <Text style={styles.reviewText}>{rev.text}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.ivory,
    borderTopLeftRadius: layout.borderRadius.hero,
    borderTopRightRadius: layout.borderRadius.hero,
    maxHeight: "85%",
    paddingBottom: layout.spacing.lg,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderWarm,
    marginTop: layout.spacing.sm + 2,
    marginBottom: layout.spacing.sm,
  },
  scroll: {
    paddingHorizontal: layout.spacing.lg,
  },
  scrollContent: {
    paddingBottom: layout.spacing.lg,
  },
  name: {
    fontSize: layout.fontSize.heading,
    fontWeight: layout.fontWeight.bold,
    color: colors.text,
    marginTop: layout.spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: layout.spacing.sm,
    flexWrap: "wrap",
  },
  rating: {
    fontSize: layout.fontSize.md,
    fontWeight: layout.fontWeight.semibold,
    color: colors.primary,
  },
  meta: {
    fontSize: layout.fontSize.md,
    color: colors.textSecondary,
  },
  summary: {
    fontSize: layout.fontSize.sm,
    color: colors.textSecondary,
    marginTop: layout.spacing.sm,
    lineHeight: layout.fontSize.sm * layout.lineHeight.normal,
  },
  openStatus: {
    fontSize: layout.fontSize.sm,
    fontWeight: layout.fontWeight.medium,
    marginTop: layout.spacing.sm,
  },
  openNow: { color: "#2f8a4a" },
  closedNow: { color: colors.error },
  address: {
    fontSize: layout.fontSize.sm,
    color: colors.textTertiary,
    marginTop: layout.spacing.xs + 2,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: layout.spacing.md,
    gap: layout.spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm + 2,
    backgroundColor: colors.parchment,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderCream,
  },
  actionText: {
    fontSize: layout.fontSize.sm,
    fontWeight: layout.fontWeight.semibold,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: layout.fontSize.lg,
    fontWeight: layout.fontWeight.semibold,
    color: colors.text,
    marginTop: layout.spacing.lg,
    marginBottom: layout.spacing.sm,
  },
  loader: {
    marginVertical: layout.spacing.lg,
  },
  emptyReviews: {
    fontSize: layout.fontSize.sm,
    color: colors.textTertiary,
  },
  review: {
    paddingVertical: layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderCream,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewAuthor: {
    fontSize: layout.fontSize.md,
    fontWeight: layout.fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: layout.spacing.sm,
  },
  reviewRating: {
    fontSize: layout.fontSize.sm,
    fontWeight: layout.fontWeight.medium,
    color: colors.primary,
  },
  reviewTime: {
    fontSize: layout.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  reviewText: {
    fontSize: layout.fontSize.sm,
    color: colors.textDark,
    marginTop: layout.spacing.xs + 2,
    lineHeight: layout.fontSize.sm * layout.lineHeight.relaxed,
  },
});
