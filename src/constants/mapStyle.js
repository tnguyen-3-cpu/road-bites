// Warm parchment map theme — reduces Google's default visual noise and
// harmonizes the map with the RoadBites palette (terracotta + cream).
export const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f4ed" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6a64" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#faf9f5" }] },

  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{ color: "#87867f" }],
  },

  // Hide Google's POIs — we draw our own restaurant markers.
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#dfe2cc" }, { visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7a8566" }],
  },

  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#faf9f5" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#eae7dc" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#f0ece0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#ead9bc" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d6c09a" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#87867f" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a3a29a" }],
  },

  { featureType: "transit", stylers: [{ visibility: "off" }] },

  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9d6d2" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7a8a86" }],
  },
];
