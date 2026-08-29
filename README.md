# Road Bites

Discover hidden-gem restaurants along your driving route.

Enter a start and destination, and Road Bites samples the route, surfaces highly-rated but under-the-radar restaurants nearby, and tells you exactly how many minutes each stop will add to your trip.

## Features

- Route-aware restaurant discovery (Google Places API)
- Hidden-gem scoring — filters for well-rated places with lower review counts
- Per-restaurant detour delay via Google Directions (e.g., `+8 min`, or `On route` for ≤2 min)
- Swipeable carousel + detailed sheet with Yelp / TikTok / Website / Call actions

## Tech Stack

- React Native + Expo (SDK 54)
- `react-native-maps` for the map view
- `@react-navigation` for navigation
- Google Places API (New) + Google Directions API
- `react-native-dotenv` for env vars

## Setup

**Prerequisites:** Node.js 18+, an Expo Go app (iOS or Android) or a local simulator, and a Google Cloud project.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file at the repo root:
   ```
   GOOGLE_MAPS_API_KEY=your_key_here
   ```

3. In your Google Cloud project, enable:
   - **Places API (New)**
   - **Directions API**
   - **Maps SDK for Android** and/or **Maps SDK for iOS** (depending on your target)

   The API key must have these APIs in its allow-list (or be unrestricted for development).

4. Start the dev server:
   ```bash
   npm start
   ```
   Then press `a` for Android or `i` for iOS, or scan the QR with Expo Go.

## Project Structure

```
src/
├── api/            Google Places + Directions clients
├── components/     Carousel, detail sheet, map markers, search UI
├── constants/      Colors, layout, map style, detour threshold
├── hooks/          Autocomplete, detour, restaurants, device location
├── screens/        HomeScreen (map + search + carousel)
└── utils/          Route sampler, hidden-gem scoring, polyline decode
```

## Design Docs

Feature specs and implementation plans live under `docs/superpowers/`.
