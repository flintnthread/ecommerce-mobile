import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  withCredentials: true, // session/cookies when the server uses them
});

/** Same key as `app/otpsection.tsx` after successful OTP verify. */
const AUTH_TOKEN_STORAGE_KEY = "token";

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token?.trim()) return config;

    const value = token.trim().startsWith("Bearer ")
      ? token.trim()
      : `Bearer ${token.trim()}`;

    const headers = config.headers;
    if (headers && typeof (headers as { set?: (k: string, v: string) => void }).set === "function") {
      (headers as { set: (k: string, v: string) => void }).set("Authorization", value);
    } else if (headers && typeof headers === "object") {
      (headers as Record<string, string>)["Authorization"] = value;
    }
  } catch {
    // ignore storage errors; request proceeds without auth header
  }
  return config;
});

export default api;