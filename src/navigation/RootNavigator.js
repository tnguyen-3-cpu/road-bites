import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { HomeScreen } from "../screens/HomeScreen";
import { RouteDetailScreen } from "../screens/RouteDetailScreen";
import { PlaceDetailScreen } from "../screens/PlaceDetailScreen";

const Stack = createStackNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="RouteDetail" component={RouteDetailScreen} />
        <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
