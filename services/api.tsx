import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = "8080";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function getHostFromExpo(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
    null;

  if (!hostUri) return null;
  const host = hostUri.split(":")[0]?.trim();
  if (!host) return null;
  if (host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

function resolveBaseUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl) return normalizeBaseUrl(envBaseUrl);

  const expoHost = getHostFromExpo();
  if (expoHost) return `http://${expoHost}:${API_PORT}`;

  if (Platform.OS === "android") {
    // Android emulator cannot access host machine via localhost.
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

const normalizedBaseUrl = resolveBaseUrl();

const api = axios.create({
  baseURL: normalizedBaseUrl,

  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ crucial for session/cookies
});

export default api;