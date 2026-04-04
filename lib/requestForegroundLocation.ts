import { PermissionsAndroid, Platform } from "react-native";

/**
 * Android: system location permission dialog via PermissionsAndroid.
 * iOS / Web: no-op here (no expo-location).
 */
export async function requestForegroundLocation(): Promise<void> {
  if (Platform.OS === "web") return;

  if (Platform.OS === "android") {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location access",
          message:
            "Allow location for delivery updates and nearby store features.",
          buttonPositive: "OK",
          buttonNegative: "Cancel",
        }
      );
    } catch {
      // Ignore — continue onboarding
    }
  }
}
