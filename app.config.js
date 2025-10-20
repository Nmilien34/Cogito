module.exports = {
  name: "Boltzman",
  slug: "boltzman",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./src/assets/BoltzmanIcon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./src/assets/BoltzmanIcon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "ai.boltzman.mobile",
    buildNumber: "1.0.0",
    jsEngine: "hermes",
    infoPlist: {
      NSCameraUsageDescription:
        "We need access to your camera to enable video chat features and visual interactions in the app.",
      NSMicrophoneUsageDescription:
        "We need access to your microphone for voice chat features and audio interactions.",
      NSPhotoLibraryUsageDescription:
        "We need access to your photo library to allow you to share images and save screenshots.",
      NSUserTrackingUsageDescription:
        "This identifier will be used to deliver personalized ads to you.",
      UIBackgroundModes: ["remote-notification"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./src/assets/BoltzmanIcon.png",
      backgroundColor: "#ffffff",
    },
    package: "ai.boltzman.mobile",
  },
  web: {
    favicon: "./src/assets/BoltzmanIcon.png",
  },
  extra: {
    eas: {
      projectId: "9f04b041-ecf7-4adc-bc35-d05d6cf585dc",
    },
  },
  jsEngine: "hermes",
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
          deploymentTarget: "15.1",
        },
      },
    ],
  ],
};
