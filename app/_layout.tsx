import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" }, // ✅ Fix black background
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="account" />
        <Stack.Screen name="cart" />
      </Stack>

      <StatusBar style="dark" backgroundColor="#ffffff" />
    </ThemeProvider>
  );
}