import * as Location from "expo-location";
import { PermissionStatus, type LocationGeocodedAddress } from "expo-location";
import { Platform } from "react-native";

export type RequestForegroundLocationResult =
  | { ok: true; addressLine: string }
  | { ok: false; reason: "web" | "denied" | "error"; message?: string };

function formatGeocodedLine(place: LocationGeocodedAddress | undefined): string {
  if (!place) return "";
  const parts = [
    [place.streetNumber, place.street].filter(Boolean).join(" ").trim(),
    place.district,
    place.city,
    place.region,
    place.postalCode,
    place.country,
  ].filter((p): p is string => Boolean(p && String(p).trim()));
  const joined = parts.join(", ").trim();
  if (joined) return joined;
  if (place.name) return place.name;
  return "";
}

/**
 * Uses the OS location permission dialog (expo-location), then reads position and reverse-geocodes.
 * No custom in-app permission alert — the system UI handles permission.
 */
export async function requestForegroundLocation(): Promise<RequestForegroundLocationResult> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "web" };
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      return { ok: false, reason: "denied" };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const places = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });

    const line = formatGeocodedLine(places[0]);
    if (line) {
      return { ok: true, addressLine: line };
    }

    return {
      ok: true,
      addressLine: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return { ok: false, reason: "error", message };
  }
}
