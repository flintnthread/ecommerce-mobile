import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { usePathname } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useEffect } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/use-color-scheme';
import { installRuntimeTranslationPatch, LanguageProvider, setRuntimeTranslationConfig, useLanguage } from "../lib/language";

installRuntimeTranslationPatch();

function RuntimeTranslationBridge() {
  const pathname = usePathname();
  const { tr, selectedLanguage, hasSelectedLanguage, translationRevision } = useLanguage();

  useEffect(() => {
    setRuntimeTranslationConfig({
      enabled: hasSelectedLanguage && pathname !== "/language" && pathname !== "/promote",
      translator: tr,
    });
  }, [pathname, tr, selectedLanguage, hasSelectedLanguage, translationRevision]);

  return null;
}

function AppNavigator({ colorScheme }: { colorScheme: "light" | "dark" | null | undefined }) {
  const pathname = usePathname();
  const { selectedLanguage, translationRevision } = useLanguage();
  const languageRenderKey =
    pathname === "/language"
      ? "lang-setup-screen"
      : `lang-${selectedLanguage}-${translationRevision}`;

  return (
    <ThemeProvider key={languageRenderKey} value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack key={languageRenderKey} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <RuntimeTranslationBridge />
        <AppNavigator colorScheme={colorScheme} />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}