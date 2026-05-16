import * as Location from "expo-location";
import { PermissionStatus, type LocationGeocodedAddress } from "expo-location";
import { Platform } from "react-native";

export type RequestForegroundLocationResult =
  | {
      ok: true;
      addressLine: string;
      latitude: number;
      longitude: number;
    }
  | {
      ok: false;
      reason: "web" | "denied" | "error";
      message?: string;
    };

function formatGeocodedLine(
  place: LocationGeocodedAddress | undefined
): string {
  if (!place) return "";

  const parts = [
    [place.streetNumber, place.street]
      .filter(Boolean)
      .join(" ")
      .trim(),

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
 * Uses system location permission popup
 */
export async function requestForegroundLocation(): Promise<RequestForegroundLocationResult> {

  if (Platform.OS === "web") {
    return { ok: false, reason: "web" };
  }

  try {

    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== PermissionStatus.GRANTED) {
      return { ok: false, reason: "denied" };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    const places = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    const line = formatGeocodedLine(places[0]);

    return {
      ok: true,
      addressLine:
        line ||
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude,
      longitude,
    };

  } catch (e) {

    const message =
      e instanceof Error ? e.message : undefined;

    return {
      ok: false,
      reason: "error",
      message,
    };
  }
}

/**
 * Save current location as address
 */
export async function createAddressFromLocation(data: {
  latitude: number;
  longitude: number;
  name?: string;
  addressType?: string;
  isDefault?: boolean;
}) {

  // TODO:
  // Add your API call here later

  return {
    success: true,
    data,
  };
}