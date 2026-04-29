import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";

export default function LegalContentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string | string[];
    content?: string | string[];
    url?: string | string[];
  }>();

  const getParam = (value: string | string[] | undefined, fallback: string) =>
    Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;

  const title = getParam(params.title, "Legal Information");
  const url = getParam(params.url, "");
  const injectedCssAndJs = `
    (function() {
      var style = document.createElement('style');
      style.innerHTML = \`
        header, footer, .header, .footer, #header, #footer,
        .site-header, .site-footer, .main-header, .main-footer,
        .bottom-bar, .bottom-nav, .bottom-navigation,
        .mobile-bottom-menu, .mobile-menu, .sticky-bottom, .sticky-footer,
        .footer-widget, .footer-widgets, .footwear, #footwear {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        body {
          margin: 0 !important;
          padding: 12px !important;
        }
      \`;
      document.head.appendChild(style);

      function hideBottomFixedElements() {
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          var cs = window.getComputedStyle(el);
          var isFixed = cs.position === 'fixed' || cs.position === 'sticky';
          if (!isFixed) continue;
          var rect = el.getBoundingClientRect();
          var nearBottom = rect.bottom >= (window.innerHeight - 2);
          if (nearBottom) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.height = '0';
            el.style.minHeight = '0';
            el.style.overflow = 'hidden';
          }
        }
      }

      hideBottomFixedElements();
      setTimeout(hideBottomFixedElements, 300);
      setTimeout(hideBottomFixedElements, 900);
      setTimeout(hideBottomFixedElements, 1800);
      true;
    })();
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {url ? (
        <WebView
          source={{ uri: url }}
          startInLoadingState
          style={styles.webView}
          injectedJavaScript={injectedCssAndJs}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.loadingText}>Content is currently unavailable.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
