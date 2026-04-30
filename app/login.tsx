import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { sendOtp } from "../services/api";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Checkbox } from "expo-checkbox";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../lib/language";
import { SHOW_POST_LOGIN_PROMO_KEY } from "./otpsection";

WebBrowser.maybeCompleteAuthSession();
const PRIVACY_POLICY_URL = "https://flintnthread.in/page-privacy-policy";

function resolveGoogleOAuthClientId(): string | undefined {
  const fromEnv =
    typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  const extra = Constants.expoConfig?.extra as
    | { googleOAuthClientId?: string }
    | undefined;
  const fromExtra = extra?.googleOAuthClientId?.trim();
  if (fromExtra) return fromExtra;
  return undefined;
}

async function fetchGoogleEmailFromAccessToken(
  accessToken: string
): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { email?: string };
    return typeof j.email === "string" && j.email.trim()
      ? j.email.trim().toLowerCase()
      : null;
  } catch {
    return null;
  }
}

function readEmailFromGoogleIdToken(idToken: string): string | null {
  try {
    const payloadB64 = idToken.split(".")[1];
    if (!payloadB64) return null;
    const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const o = JSON.parse(json) as { email?: string };
    return typeof o.email === "string" && o.email.trim()
      ? o.email.trim().toLowerCase()
      : null;
  } catch {
    return null;
  }
}

async function resolveGoogleAccountEmail(
  accessToken: string | undefined,
  idToken: string | undefined
): Promise<string | null> {
  if (accessToken) {
    const fromUserInfo = await fetchGoogleEmailFromAccessToken(accessToken);
    if (fromUserInfo) return fromUserInfo;
  }
  if (idToken) return readEmailFromGoogleIdToken(idToken);
  return null;
}

type GoogleAuthSessionPayload = {
  email: string;
  idToken?: string;
  accessToken?: string;
};

type GoogleOAuthContinueRowProps = {
  clientId: string;
  tr: (key: string) => string;
  submitLocked: boolean;
  onGoogleAuthSuccess: (payload: GoogleAuthSessionPayload) => Promise<void>;
};

/** Opens Google OAuth with account picker, then passes tokens + email for direct session. */
function GoogleOAuthContinueRow({
  clientId,
  tr,
  submitLocked,
  onGoogleAuthSuccess,
}: GoogleOAuthContinueRowProps) {
  const redirectUri = useMemo(() => {
    const raw = Constants.expoConfig?.scheme;
    const scheme =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw) && raw[0]
        ? raw[0]
        : "myloginapp";
    return makeRedirectUri({ scheme, path: "oauthredirect" });
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    selectAccount: true,
    redirectUri,
  });
  const processedTokenKey = useRef<string>("");

  useEffect(() => {
    if (__DEV__ && request?.redirectUri) {
      console.log(
        "[Google sign-in] Add this Authorized redirect URI in Google Cloud:",
        request.redirectUri
      );
    }
  }, [request?.redirectUri]);

  useEffect(() => {
    if (!response) return;
    if (response.type === "cancel" || response.type === "dismiss") return;
    if (response.type === "error") {
      const err = response.error;
      const msg =
        typeof err === "string"
          ? err
          : err?.message ??
            (err as { description?: string })?.description ??
            tr("Sign-in could not complete.");
      Alert.alert(tr("Google"), msg);
      return;
    }
    if (response.type !== "success") return;

    const accessToken = response.authentication?.accessToken;
    const idToken = response.authentication?.idToken;
    if (!accessToken && !idToken) return;

    const dedupeKey = `${accessToken ?? ""}|${idToken ?? ""}`;
    if (processedTokenKey.current === dedupeKey) return;
    processedTokenKey.current = dedupeKey;

    void (async () => {
      const email = await resolveGoogleAccountEmail(
        accessToken ?? undefined,
        idToken ?? undefined
      );
      if (!email) {
        Alert.alert(
          tr("Google"),
          tr("Could not read your email from this Google account.")
        );
        processedTokenKey.current = "";
        return;
      }
      try {
        await onGoogleAuthSuccess({
          email,
          idToken: idToken ?? undefined,
          accessToken: accessToken ?? undefined,
        });
      } catch {
        processedTokenKey.current = "";
      }
    })();
  }, [response, tr, onGoogleAuthSuccess]);

  const onPressGoogle = useCallback(async () => {
    if (!request) return;
    try {
      await promptAsync();
    } catch (e) {
      Alert.alert(tr("Error"), String((e as Error)?.message ?? e));
    }
  }, [promptAsync, request, tr]);

  return (
    <TouchableOpacity
      style={[
        styles.googleButton,
        (!request || submitLocked) && { opacity: 0.65 },
      ]}
      onPress={onPressGoogle}
      disabled={!request || submitLocked}
    >
      {!request ? (
        <ActivityIndicator style={{ marginRight: 10 }} color="#555" />
      ) : (
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/281/281764.png",
          }}
          style={styles.googleIcon}
        />
      )}
      <Text style={styles.googleText}>{tr("Continue with Google")}</Text>
    </TouchableOpacity>
  );
}

export default function Login() {
  const router = useRouter();
  const { tr } = useLanguage();

  const [isChecked, setChecked] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const googleClientId = resolveGoogleOAuthClientId();
  const fallbackChooserReturnUri = useMemo(() => {
    const raw = Constants.expoConfig?.scheme;
    const scheme =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw) && raw[0]
        ? raw[0]
        : "myloginapp";
    return makeRedirectUri({ scheme, path: "oauthredirect" });
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/;

  const sendOtpAndNavigateToOtp = useCallback(
    async (value: string) => {
      try {
        setLoading(true);
        const payload = emailRegex.test(value)
          ? { email: value }
          : { mobile: value };
        const data = await sendOtp(payload);
        if (data) {
          Alert.alert(
            tr("OTP Sent"),
            emailRegex.test(value)
              ? tr("OTP sent to your email")
              : tr("OTP sent to your mobile")
          );
          router.push({
            pathname: "/otpsection",
            params: { input: value },
          });
        } else {
          Alert.alert(tr("Error"), tr("Failed to send OTP"));
        }
      } catch (error: any) {
        console.log("API Error:", error?.response || error);
        if (error?.response?.data?.message) {
          Alert.alert(tr("Error"), tr(error.response.data.message));
        } else {
          Alert.alert(tr("Error"), tr("Server not reachable"));
        }
      } finally {
        setLoading(false);
      }
    },
    [tr, router]
  );

  const completeGoogleSignIn = useCallback(
    async ({ email, idToken, accessToken }: GoogleAuthSessionPayload) => {
      if (!isChecked) {
        Alert.alert(tr("Error"), tr("Please accept terms & conditions"));
        return;
      }
      const sessionSecret = idToken ?? accessToken;
      if (!sessionSecret) {
        Alert.alert(tr("Google"), tr("Could not read Google credentials. Try again."));
        return;
      }

      setLoading(true);
      try {
        let appJwt: string | null = null;
        try {
          const res = await api.post("/auth/google", {
            email,
            idToken,
            accessToken,
          });
          const d = res.data as {
            success?: boolean;
            token?: string;
            message?: string;
          };
          if (d?.success === false && d.message) {
            Alert.alert(tr("Error"), tr(d.message));
            return;
          }
          if (typeof d?.token === "string" && d.token.length > 0) {
            appJwt = d.token;
          }
        } catch {
          /* Server may not expose POST /auth/google yet — fall back to Google token for local session. */
        }

        const tokenToStore = appJwt ?? sessionSecret;
        await AsyncStorage.setItem("token", tokenToStore);
        await AsyncStorage.setItem(
          "userDisplayName",
          email.includes("@") ? email.split("@")[0]! : email
        );
        await AsyncStorage.setItem(SHOW_POST_LOGIN_PROMO_KEY, "1");
        /* Home reads this key on focus and opens the same promo modal as after OTP (Spread & Save). */
        router.replace("/home");
      } catch (error: any) {
        if (error?.response?.data?.message) {
          Alert.alert(tr("Error"), tr(error.response.data.message));
        } else {
          Alert.alert(tr("Error"), tr("Google sign-in failed"));
        }
      } finally {
        setLoading(false);
      }
    },
    [isChecked, router, tr]
  );

  const openAccountChooserThenGoHome = useCallback(async () => {
    if (!isChecked) {
      Alert.alert(tr("Error"), tr("Please accept terms & conditions"));
      return;
    }
    try {
      setLoading(true);
      const chooserUrl =
        "https://accounts.google.com/v3/signin/accountchooser?continue=" +
        encodeURIComponent(fallbackChooserReturnUri) +
        "&flowName=WebLiteSignIn&flowEntry=AccountChooser";
      const result = await WebBrowser.openAuthSessionAsync(
        chooserUrl,
        fallbackChooserReturnUri
      );
      if (result.type === "success") {
        await AsyncStorage.setItem(SHOW_POST_LOGIN_PROMO_KEY, "1");
        router.replace("/home");
      }
    } catch {
      Alert.alert(tr("Error"), tr("Could not open Google sign-in."));
    } finally {
      setLoading(false);
    }
  }, [isChecked, tr, fallbackChooserReturnUri, router]);

  const handleSignIn = async () => {
    if (loading) return;

    const value = inputValue.trim();

    if (!value) {
      Alert.alert(tr("Error"), tr("Please enter Email or Mobile Number"));
      return;
    }

    if (!emailRegex.test(value) && !mobileRegex.test(value)) {
      Alert.alert(
        tr("Invalid Input"),
        tr("Enter valid Email or 10-digit Mobile Number")
      );
      return;
    }

    if (!isChecked) {
      Alert.alert(tr("Error"), tr("Please accept terms & conditions"));
      return;
    }

    await sendOtpAndNavigateToOtp(value);
  };

  const openTerms = useCallback(() => {
    router.push({
      pathname: "/legal-content" as any,
      params: {
        title: "Terms & Conditions",
        url: PRIVACY_POLICY_URL,
      },
    });
  }, [router]);

  const openPrivacy = useCallback(() => {
    router.push({
      pathname: "/legal-content" as any,
      params: {
        title: "Privacy Policy",
        url: PRIVACY_POLICY_URL,
      },
    });
  }, [router]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.replace("/gender")}
        style={styles.backButton}
        activeOpacity={0.75}
      >
        <Ionicons name="arrow-back" size={22} color="#0F172A" />
      </TouchableOpacity>

      <Image
        source={require("../assets/images/fntfav.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.welcome}>{tr("welcome back 👋")}</Text>
      <Text style={styles.signIn}>{tr("Sign In or create account")}</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#888" />

        <TextInput
          placeholder={tr("Email or Mobile Number")}
          value={inputValue}
          onChangeText={(text) => setInputValue(text.replace(/\s/g, ""))}
          style={styles.input}
          keyboardType={
            mobileRegex.test(inputValue) ? "number-pad" : "email-address"
          }
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox
          value={isChecked}
          onValueChange={setChecked}
          color={isChecked ? "#E97A1F" : undefined}
        />

        <Text style={styles.checkboxText}>
          {tr("By continue you agree to flint & thread")}{" "}
          <Text style={styles.linkText} onPress={openTerms}>
            {tr("terms & conditions")}
          </Text>{" "}
          {tr("and along with")}{" "}
          <Text style={styles.linkText} onPress={openPrivacy}>
            {tr("privacy policy")}
          </Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.signButton, loading && { opacity: 0.6 }]}
        onPress={handleSignIn}
        disabled={loading}
        activeOpacity={1}
      >
        <View style={styles.signButtonContent}>
          {loading ? <ActivityIndicator color="#fff" style={styles.signButtonLoader} /> : null}
          <Text style={styles.signButtonText}>{tr("Sign in to continue")}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.createAccountRow}>
        <Text style={styles.newText}>{tr("New to Flint & Thread?")}</Text>
        <Text style={styles.createText}> {tr("Create an account")}</Text>
      </View>

      {/*
      {googleClientId ? (
        <GoogleOAuthContinueRow
          clientId={googleClientId}
          tr={tr}
          submitLocked={loading}
          onGoogleAuthSuccess={completeGoogleSignIn}
        />
      ) : (
        <TouchableOpacity
          style={[styles.googleButton, loading && { opacity: 0.6 }]}
          onPress={() => void openAccountChooserThenGoHome()}
          disabled={loading}
        >
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/281/281764.png",
            }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>{tr("Continue with Google")}</Text>
        </TouchableOpacity>
      )}
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  backButton: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.12)",
    zIndex: 10,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
  },
  welcome: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  signIn: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    color: "#555",
  },
  signButton: {
    backgroundColor: "#E97A1F",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 25,
  },
  signButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  createAccountRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
  },
  newText: {
    color: "#777",
  },
  createText: {
    color: "#777",
    fontWeight: "400",
  },
  linkText: {
    color: "#0F172A",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  signButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signButtonLoader: {
    marginRight: 8,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: "#fff",
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    fontWeight: "500",
  },
});
