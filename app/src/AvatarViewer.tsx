import React from "react";
import { View, StyleSheet, ActivityIndicator, Text, type ViewStyle } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "./ThemeContext";

interface AvatarViewerProps {
  glbUrl: string | null | undefined;
  style?: ViewStyle;
  autoRotate?: boolean;
}

export function AvatarViewer({ glbUrl, style, autoRotate = true }: AvatarViewerProps) {
  const { colors } = useTheme();

  if (!glbUrl) {
    return (
      <View style={[styles.container, style, { backgroundColor: colors.card }]}>
        <Text style={[styles.placeholder, { color: colors.muted }]}>No avatar yet</Text>
      </View>
    );
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
  <style>
    body { margin: 0; overflow: hidden; background: radial-gradient(circle at 50% 32%, #F6F3EC, #E2DBCC); }
    model-viewer { width: 100%; height: 100%; --poster-color: transparent; }
  </style>
</head>
<body>
  <model-viewer
    src="${glbUrl}"
    alt="3D pet avatar"
    autoplay
    auto-rotate
    camera-controls
    touch-action="pan-y"
    shadow-intensity="1"
    exposure="1"
    environment-image="neutral"
    style="width:100%;height:100%;"
    ${autoRotate ? "auto-rotate-delay=\"0\"" : ""}
  ></model-viewer>
</body>
</html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://localhost/" }}
        style={styles.webview}
        allowsFullscreenVideo={false}
        mediaPlaybackRequiresUserAction={false}
        androidHardwareAccelerationDisabled={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.text} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 14,
    fontWeight: "600",
  },
});
