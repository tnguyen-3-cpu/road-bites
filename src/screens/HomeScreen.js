import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SearchOverlay } from "../components/SearchOverlay";
import { RouteInfoCard } from "../components/RouteInfoCard";
import { useDeviceLocation } from "../hooks/useDeviceLocation";
import { usePlacesAutocomplete } from "../hooks/usePlacesAutocomplete";
import { getDirections } from "../api/googleMaps";
import { colors } from "../constants/colors";

export function HomeScreen() {
  const { region } = useDeviceLocation();
  const mapRef = useRef(null);

  const startAC = usePlacesAutocomplete();
  const endAC = usePlacesAutocomplete();

  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);

  // Animate map when one place is selected
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
  }, [startAC.selectedPlace]);

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
  }, [endAC.selectedPlace]);

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
        setRouteInfo({ distance: result.distance, duration: result.duration });

        if (mapRef.current && result.points.length) {
          mapRef.current.fitToCoordinates(result.points, {
            edgePadding: { top: 200, right: 50, bottom: 100, left: 50 },
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        {startAC.selectedPlace && (
          <Marker
            coordinate={startAC.selectedPlace.coordinate}
            title="Start"
            description={startAC.selectedPlace.description}
            pinColor="green"
          />
        )}
        {endAC.selectedPlace && (
          <Marker
            coordinate={endAC.selectedPlace.coordinate}
            title="Destination"
            description={endAC.selectedPlace.description}
            pinColor="red"
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>
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
        />
      </SafeAreaView>
      <RouteInfoCard
        distance={routeInfo?.distance}
        duration={routeInfo?.duration}
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
});
