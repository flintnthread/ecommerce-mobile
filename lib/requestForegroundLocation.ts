import * as Linking from "expo-linking";
import { PermissionsAndroid, Platform } from "react-native";

/**
 * Android: system location permission dialog via PermissionsAndroid.
 * iOS: opens the app’s page in Settings so the user can enable Location (no expo-location).
 * Web: no-op.
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
    return;
  }

  if (Platform.OS === "ios") {
    try {
      await Linking.openSettings();
    } catch {
      /* ignore */
    }
  }
}
