import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import MapView, { PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SearchOverlay } from "../components/SearchOverlay";
import { RouteInfoPill } from "../components/RouteInfoPill";
import { RestaurantMarker } from "../components/RestaurantMarker";
import { RoutePinMarker } from "../components/RoutePinMarker";
import { RestaurantCarousel } from "../components/RestaurantCarousel";
import { RestaurantDetailSheet } from "../components/RestaurantDetailSheet";
import { MapControls } from "../components/MapControls";
import { useDeviceLocation } from "../hooks/useDeviceLocation";
import { usePlacesAutocomplete } from "../hooks/usePlacesAutocomplete";
import { useRestaurants } from "../hooks/useRestaurants";
import { useDetour } from "../hooks/useDetour";
import { getDirections } from "../api/googleMaps";
import { colors } from "../constants/colors";
import { layout } from "../constants/layout";
import { mapStyle } from "../constants/mapStyle";

const CAROUSEL_HEIGHT = 180;

export function HomeScreen() {
  const { region } = useDeviceLocation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const startAC = usePlacesAutocomplete();
  const endAC = usePlacesAutocomplete();

  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [focusedRestaurantId, setFocusedRestaurantId] = useState(null);
  const { restaurants, isLoading: restaurantsLoading } = useRestaurants(routeCoords);

  const focusedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === focusedRestaurantId) ?? null,
    [restaurants, focusedRestaurantId]
  );

  const detour = useDetour(
    focusedRestaurant,
    startAC.selectedPlace?.coordinate ?? null,
    endAC.selectedPlace?.coordinate ?? null,
    routeInfo?.durationValue ?? null
  );

  // Animate map when a single place is selected (start or end alone)
  useEffect(() => {
    if (!mapRef.current) return;
    const coord = startAC.selectedPlace?.coordinate;
    if (coord && !endAC.selectedPlace) {
      mapRef.current.animateToRegion({
        ...coord,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [startAC.selectedPlace, endAC.selectedPlace]);

  useEffect(() => {
    if (!mapRef.current) return;
    const coord = endAC.selectedPlace?.coordinate;
    if (coord && !startAC.selectedPlace) {
      mapRef.current.animateToRegion({
        ...coord,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [endAC.selectedPlace, startAC.selectedPlace]);

  // Fetch route when both places are selected
  useEffect(() => {
    const startCoord = startAC.selectedPlace?.coordinate;
    const endCoord = endAC.selectedPlace?.coordinate;

    if (!startCoord || !endCoord) {
      setRouteCoords([]);
      setRouteInfo(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await getDirections(startCoord, endCoord);
        if (cancelled || !result) return;

        setRouteCoords(result.points);
        setRouteInfo({
          distance: result.distance,
          duration: result.duration,
          durationValue: result.durationValue,
        });

        if (mapRef.current && result.points.length) {
          mapRef.current.fitToCoordinates(result.points, {
            edgePadding: {
              top: 220,
              right: 60,
              bottom: CAROUSEL_HEIGHT + 60,
              left: 60,
            },
            animated: true,
          });
        }
      } catch {
        // Route fetch failed — leave map as is
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [startAC.selectedPlace, endAC.selectedPlace]);

  // When restaurants arrive, focus the first one in the carousel
  useEffect(() => {
    if (restaurants.length > 0) {
      setFocusedRestaurantId(restaurants[0].id);
    } else {
      setFocusedRestaurantId(null);
    }
  }, [restaurants]);

  const handleMarkerPress = useCallback((restaurant) => {
    setFocusedRestaurantId(restaurant.id);
    if (mapRef.current && restaurant.latitude && restaurant.longitude) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          },
        },
        { duration: 300 }
      );
    }
  }, []);

  const handleCarouselSelect = useCallback((restaurant) => {
    setFocusedRestaurantId(restaurant.id);
    if (mapRef.current && restaurant.latitude && restaurant.longitude) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          },
        },
        { duration: 400 }
      );
    }
  }, []);

  const handleCarouselOpen = useCallback((restaurant) => {
    setSelectedRestaurant(restaurant);
  }, []);

  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return;
    if (routeCoords.length > 0) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: {
          top: 220,
          right: 60,
          bottom: CAROUSEL_HEIGHT + 60,
          left: 60,
        },
        animated: true,
      });
    } else if (region) {
      mapRef.current.animateToRegion(region, 400);
    }
  }, [routeCoords, region]);

  const handleSwap = useCallback(() => {
    const a = startAC.selectedPlace;
    const b = endAC.selectedPlace;
    if (!a || !b) return;
    startAC.restore(b);
    endAC.restore(a);
  }, [startAC, endAC]);

  const canSwap = !!(startAC.selectedPlace && endAC.selectedPlace);

  const fabBottom = useMemo(
    () => (restaurants.length ? CAROUSEL_HEIGHT + 12 : insets.bottom + 24),
    [restaurants.length, insets.bottom]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        customMapStyle={mapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        toolbarEnabled={false}
      >
        {startAC.selectedPlace && (
          <RoutePinMarker
            coordinate={startAC.selectedPlace.coordinate}
            variant="start"
            title="Start"
            description={startAC.selectedPlace.description}
          />
        )}
        {endAC.selectedPlace && (
          <RoutePinMarker
            coordinate={endAC.selectedPlace.coordinate}
            variant="end"
            title="Destination"
            description={endAC.selectedPlace.description}
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.primary}
            strokeWidth={5}
          />
        )}
        {restaurants.map((r, i) => (
          <RestaurantMarker
            key={r.id ?? `${r.name}-${i}`}
            restaurant={r}
            selected={r.id === focusedRestaurantId}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {restaurantsLoading && (
        <View style={[styles.loadingBadge, { bottom: fabBottom + 60 }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <SafeAreaView style={styles.overlayWrapper} edges={["top"]}>
        <SearchOverlay
          startValue={startAC.text}
          endValue={endAC.text}
          onStartChange={startAC.setText}
          onEndChange={endAC.setText}
          startSuggestions={startAC.suggestions}
          endSuggestions={endAC.suggestions}
          startLoading={startAC.isLoading}
          endLoading={endAC.isLoading}
          onStartSelect={startAC.handleSelect}
          onEndSelect={endAC.handleSelect}
          onSwap={handleSwap}
          canSwap={canSwap}
        />
        <RouteInfoPill
          distance={routeInfo?.distance}
          duration={routeInfo?.duration}
          stopCount={restaurants.length || null}
        />
      </SafeAreaView>

      <MapControls onRecenter={handleRecenter} bottomOffset={fabBottom} />

      <RestaurantCarousel
        restaurants={restaurants}
        selectedId={focusedRestaurantId}
        onSelect={handleCarouselSelect}
        onOpen={handleCarouselOpen}
        bottomInset={insets.bottom}
        focusedDetour={detour}
      />

      <RestaurantDetailSheet
        restaurant={selectedRestaurant}
        visible={selectedRestaurant != null}
        onClose={() => setSelectedRestaurant(null)}
        detour={selectedRestaurant?.id === focusedRestaurant?.id ? detour : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  loadingBadge: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: colors.ivory,
    borderRadius: layout.borderRadius.hero,
    padding: layout.spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderCream,
  },
});
