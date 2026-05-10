import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import {
  Stack,
  usePathname,
} from "expo-router";

import { StatusBar } from "expo-status-bar";

import {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaProvider,
} from "react-native-safe-area-context";

import "react-native-reanimated";

import { useColorScheme }
from "../hooks/use-color-scheme";

import {
  LanguageProvider,
  setRuntimeTranslationConfig,
  useLanguage,
} from "../lib/language";

import SplashScreen
from "../components/SplashScreen";

function RuntimeTranslationBridge() {

  const pathname = usePathname();

  const {
    tr,
    selectedLanguage,
    hasSelectedLanguage,
    translationRevision,
  } = useLanguage();

  useEffect(() => {

    setRuntimeTranslationConfig({

      enabled:
        hasSelectedLanguage
        && pathname !== "/language"
        && pathname !== "/promote",

      translator: tr,

    });

  }, [
    pathname,
    tr,
    selectedLanguage,
    hasSelectedLanguage,
    translationRevision,
  ]);

  return null;
}

function AppNavigator({

  colorScheme,

}: {
  colorScheme:
    | "light"
    | "dark"
    | null
    | undefined;
}) {

  const pathname = usePathname();

  const {
    selectedLanguage,
    translationRevision,
  } = useLanguage();

  const languageRenderKey =
    pathname === "/language"
      ? "lang-setup-screen"
      : `lang-${selectedLanguage}-${translationRevision}`;

  return (

    <ThemeProvider
      key={languageRenderKey}
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >

      <Stack
        key={languageRenderKey}
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >

        <Stack.Screen name="index" />

      </Stack>

      <StatusBar style="auto" />

    </ThemeProvider>
  );
}

function AppBootstrap({

  colorScheme,

}: {
  colorScheme:
    | "light"
    | "dark"
    | null
    | undefined;
}) {

  const [
    isInitializing,
    setIsInitializing,
  ] = useState(true);

  useEffect(() => {

    const initializeApp =
      async () => {

        try {

          // Future:
          // token restore
          // cart restore
          // notification setup
          // user restore

          await new Promise(resolve =>
            setTimeout(resolve, 1800)
          );

        } catch (e) {

          console.log(
            "App bootstrap error",
            e
          );

        } finally {

          setIsInitializing(false);
        }
      };

    initializeApp();

  }, []);

  // =========================
  // SPLASH SCREEN
  // =========================

  if (isInitializing) {

    return <SplashScreen />;
  }

  return (
    <>
      <RuntimeTranslationBridge />

      <AppNavigator
        colorScheme={colorScheme}
      />
    </>
  );
}

export default function RootLayout() {

  const colorScheme =
    useColorScheme();

  return (

    <SafeAreaProvider>

      <LanguageProvider>

        <AppBootstrap
          colorScheme={colorScheme}
        />

      </LanguageProvider>

    </SafeAreaProvider>
  );
}