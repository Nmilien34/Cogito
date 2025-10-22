import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Linking,
  StyleSheet,
  ActionSheetIOS,
  Platform,
  Alert,
  Modal,
  SafeAreaView,
  Animated as RNAnimated,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import {
  YouTubeVideo,
  SearchResult,
  ToolOutputProps,
  ToolOutputType,
} from "./toolReturnTypes";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;
const SPACING = 12;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.dark.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark.foreground,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.dark.mutedForeground || "rgba(255,255,255,0.6)",
  },
  videoCard: {
    width: "100%",
    marginBottom: 12,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  videoThumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    overflow: "hidden",
  },
  videoDuration: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  videoContent: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 4,
  },
  channelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  videoTextContent: {
    flex: 1,
    paddingRight: 8,
  },
  videoTitle: {
    color: colors.dark.foreground,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    lineHeight: 18,
  },
  videoMetadata: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 2,
  },
  channelName: {
    color: colors.dark.foreground,
    opacity: 0.7,
    fontSize: 12,
  },
  videoDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  videoDetail: {
    color: colors.dark.foreground,
    opacity: 0.7,
    fontSize: 12,
    marginRight: 4,
  },
  separator: {
    color: colors.dark.foreground,
    opacity: 0.5,
    fontSize: 10,
    marginHorizontal: 2,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  searchResult: {
    backgroundColor: colors.dark.secondary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  searchContent: {
    padding: 16,
  },
  searchTitle: {
    color: colors.dark.foreground,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 20,
  },
  searchText: {
    color: colors.dark.foreground,
    opacity: 0.8,
    fontSize: 13,
    lineHeight: 18,
  },
  urlContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
  },
  urlText: {
    color: colors.dark.mutedForeground || "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginLeft: 4,
  },
  transcript: {
    backgroundColor: colors.dark.secondary,
    borderRadius: 12,
    padding: 16,
  },
  transcriptText: {
    color: colors.dark.foreground,
    fontSize: 14,
    lineHeight: 21,
  },
  fallbackContainer: {
    padding: 12,
    backgroundColor: colors.dark.secondary,
    borderRadius: 12,
  },
  fallbackText: {
    color: colors.dark.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
});

// Helper to extract domain from URL
const extractDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname
      .replace("www.", "")
      .split(".")
      .slice(0, -1)
      .join(".");
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch (e) {
    return "Website";
  }
};

// Helper to format views
const formatViews = (views: number | undefined) => {
  if (!views) return "";

  try {
    if (isNaN(views)) return "";
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + "M views";
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + "K views";
    }
    return views + " views";
  } catch (error) {
    console.log("Error formatting views:", error);
    return "";
  }
};

// YouTube WebView Modal Component - Now with blur + opacity animation
const YouTubeWebViewModal: React.FC<{
  videoUrl: string;
  isVisible: boolean;
  onClose: () => void;
}> = ({ videoUrl, isVisible, onClose }) => {
  // Animation values
  const [modalAnimation] = useState(new RNAnimated.Value(0));
  const [contentAnimation] = useState(new RNAnimated.Value(0));
  const [animationComplete, setAnimationComplete] = useState(!isVisible);

  // Control animations when visibility changes
  useEffect(() => {
    if (isVisible) {
      setAnimationComplete(false);
      // Fade in animations
      RNAnimated.sequence([
        RNAnimated.timing(modalAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(contentAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out animations
      RNAnimated.parallel([
        RNAnimated.timing(modalAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(contentAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimationComplete(true);
      });
    }
  }, [isVisible]);

  // Handle closing the modal
  const handleClose = () => {
    RNAnimated.parallel([
      RNAnimated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(contentAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimationComplete(true);
      onClose();
    });
  };

  // Don't render anything if not visible and animation is complete
  if (!isVisible && animationComplete) return null;

  return (
    <Modal
      transparent={true}
      visible={true}
      onRequestClose={handleClose}
      animationType="none"
    >
      <RNAnimated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
          opacity: modalAnimation,
        }}
      >
        <RNAnimated.View
          style={{
            backgroundColor: "#121212",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: "hidden",
            height: "70%",
            opacity: contentAnimation,
            transform: [
              {
                translateY: contentAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.1)",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              YouTube Video
            </Text>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.1)",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={handleClose}
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* WebView */}
          <View style={{ flex: 1 }}>
            <WebView
              source={{ uri: videoUrl }}
              style={{ flex: 1 }}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              startInLoadingState={true}
              renderLoading={() => (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#121212",
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialIcons
                      name="play-circle-filled"
                      size={30}
                      color="#FF0000"
                    />
                  </View>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      marginTop: 12,
                      fontSize: 14,
                    }}
                  >
                    Loading video...
                  </Text>
                </View>
              )}
            />
          </View>
        </RNAnimated.View>
      </RNAnimated.View>
    </Modal>
  );
};

// Youtube videos vertical list
const YouTubeVideoList: React.FC<{
  videos: YouTubeVideo[];
  onSelect: (video: YouTubeVideo) => void;
}> = ({ videos, onSelect }) => {
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");

  // Handle video selection with options
  const handleVideoPress = (video: YouTubeVideo) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "Get Video Transcript",
            "Open in App",
            "Open in YouTube/Browser",
          ],
          cancelButtonIndex: 0,
          title: video.title,
          message: `From ${video.channel.title}`,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Get transcript
            onSelect(video);
          } else if (buttonIndex === 2) {
            // Open in in-app WebView
            setCurrentVideoUrl(video.link);
            setWebViewVisible(true);
          } else if (buttonIndex === 3) {
            // Open video in browser or YouTube app
            openVideoExternally(video.link);
          }
        }
      );
    } else {
      // For Android, we'd typically use a library like react-native-modal or custom modal
      // For simplicity, we'll use Alert for now
      Alert.alert(
        "Video Options",
        `What would you like to do with "${video.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Get Video Transcript", onPress: () => onSelect(video) },
          {
            text: "Open in App",
            onPress: () => {
              setCurrentVideoUrl(video.link);
              setWebViewVisible(true);
            },
          },
          {
            text: "Open in YouTube/Browser",
            onPress: () => openVideoExternally(video.link),
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Helper to open video in browser or YouTube app
  const openVideoExternally = (url: string) => {
    // Try to open in YouTube app first (deep linking)
    const youtubeAppUrl = url.replace("https://www.youtube.com", "youtube://");
    Linking.canOpenURL(youtubeAppUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(youtubeAppUrl);
        } else {
          // Fall back to browser if YouTube app isn't installed
          return Linking.openURL(url);
        }
      })
      .catch((err) => {
        console.error("Error opening URL:", err);
        // Final fallback - just try to open in browser
        Linking.openURL(url).catch((e) =>
          console.error("Could not open URL:", e)
        );
      });
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialIcons
            name="smart-display"
            size={16}
            color={colors.dark.foreground}
          />
        </View>
        <View>
          <Text style={styles.sectionTitle}>Video Results</Text>
          <Text style={styles.sectionSubtitle}>
            {videos.length} {videos.length === 1 ? "video" : "videos"} found
          </Text>
        </View>
      </View>

      {/* WebView Modal */}
      <YouTubeWebViewModal
        videoUrl={currentVideoUrl}
        isVisible={webViewVisible}
        onClose={() => setWebViewVisible(false)}
      />

      {/* Vertical list of videos */}
      <View style={{ width: "100%" }}>
        {videos.map((video, index) => (
          <Animated.View
            key={video.id}
            entering={FadeIn.delay(index * 50).duration(200)}
            style={styles.videoCard}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleVideoPress(video)}
              style={{ width: "100%" }}
            >
              {/* Thumbnail */}
              <View>
                <Image
                  source={{
                    uri:
                      video.thumbnail?.static ||
                      "https://i.ytimg.com/vi/default/hqdefault.jpg",
                  }}
                  style={styles.videoThumbnail}
                  resizeMode="cover"
                />

                {/* Duration badge */}
                {video.length && (
                  <View style={styles.videoDuration}>
                    <Text style={styles.durationText}>{video.length}</Text>
                  </View>
                )}

                {/* Play button overlay */}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialIcons
                      name="play-arrow"
                      size={32}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </View>

              {/* Content */}
              <View style={styles.videoContent}>
                {/* Channel Avatar */}
                {video.channel && (
                  <View style={{ marginRight: 12 }}>
                    {video.channel.thumbnail ? (
                      <Image
                        source={{ uri: video.channel.thumbnail }}
                        style={styles.channelAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.channelAvatar,
                          {
                            backgroundColor: "#FF0000",
                            justifyContent: "center",
                            alignItems: "center",
                          },
                        ]}
                      >
                        <Ionicons
                          name="logo-youtube"
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.videoTextContent}>
                  {/* Title */}
                  <Text numberOfLines={2} style={styles.videoTitle}>
                    {video.title || "No title available"}
                  </Text>

                  {/* Channel and metadata */}
                  <View style={styles.videoMetadata}>
                    {video.channel && (
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={styles.channelName} numberOfLines={1}>
                          {video.channel.title}
                        </Text>
                        {video.channel.is_verified && (
                          <MaterialIcons
                            name="verified"
                            size={12}
                            color="#3897f0"
                            style={styles.verifiedBadge}
                          />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Views and published time */}
                  <View style={styles.videoDetails}>
                    {formatViews(video.views) ? (
                      <Text style={styles.videoDetail}>
                        {formatViews(video.views)}
                      </Text>
                    ) : null}
                    {video.published_time && (
                      <>
                        <Text style={styles.separator}>•</Text>
                        <Text style={styles.videoDetail}>
                          {video.published_time}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Divider between videos */}
              {index < videos.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    marginTop: 12,
                  }}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

// Search results
const SearchResults: React.FC<{ results: SearchResult[] }> = ({ results }) => {
  const getHostname = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname;
    } catch (e) {
      return "website";
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const hostname = getHostname(url);
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    } catch (e) {
      return "";
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialIcons
            name="search"
            size={16}
            color={colors.dark.foreground}
          />
        </View>
        <View>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <Text style={styles.sectionSubtitle}>
            {results.length} {results.length === 1 ? "result" : "results"} found
          </Text>
        </View>
      </View>

      {/* Horizontal scrollable results for mobile */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
        decelerationRate="fast"
        directionalLockEnabled={true}
        bounces={true}
        alwaysBounceHorizontal={true}
        overScrollMode="never"
      >
        {results.map((result, index) => (
          <Animated.View
            key={index}
            entering={FadeIn.delay(index * 50).duration(200)}
            style={{
              width: width * 0.75,
              minHeight: 160,
              marginRight: 12,
              borderRadius: 12,
              backgroundColor: colors.dark.secondary,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL(result.url)}
              style={{ flex: 1, justifyContent: "space-between" }}
            >
              <View style={{ padding: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      marginRight: 8,
                      overflow: "hidden",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {getFaviconUrl(result.url) !== "" ? (
                      <Image
                        source={{ uri: getFaviconUrl(result.url) }}
                        style={{ width: 16, height: 16 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <MaterialIcons
                        name="public"
                        size={12}
                        color={colors.dark.foreground}
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.searchTitle, { marginBottom: 0 }]}
                    numberOfLines={1}
                  >
                    {result.title}
                  </Text>
                </View>
                <Text numberOfLines={4} style={styles.searchText}>
                  {result.content}
                </Text>
              </View>
              <View
                style={{
                  padding: 12,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.1)",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <MaterialIcons
                  name="open-in-new"
                  size={14}
                  color={colors.dark.mutedForeground || "rgba(255,255,255,0.6)"}
                />
                <Text
                  style={{
                    marginLeft: 6,
                    color:
                      colors.dark.mutedForeground || "rgba(255,255,255,0.6)",
                    fontSize: 12,
                  }}
                >
                  {extractDomain(result.url)}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Vertical list for completeness */}
      <View style={{ marginTop: 20 }}>
        {results.map((result, index) => (
          <Animated.View
            key={`vertical-${index}`}
            entering={FadeIn.delay(index * 50).duration(200)}
            style={styles.searchResult}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL(result.url)}
            >
              <View style={styles.searchContent}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      marginRight: 8,
                      overflow: "hidden",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {getFaviconUrl(result.url) !== "" ? (
                      <Image
                        source={{ uri: getFaviconUrl(result.url) }}
                        style={{ width: 16, height: 16 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <MaterialIcons
                        name="public"
                        size={12}
                        color={colors.dark.foreground}
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.searchTitle, { marginBottom: 0, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {result.title}
                  </Text>
                </View>
                <Text numberOfLines={3} style={styles.searchText}>
                  {result.content}
                </Text>
                <View style={styles.urlContainer}>
                  <MaterialIcons
                    name="open-in-new"
                    size={14}
                    color={
                      colors.dark.mutedForeground || "rgba(255,255,255,0.6)"
                    }
                  />
                  <Text style={styles.urlText}>
                    {extractDomain(result.url)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

// YouTube transcript
const TranscriptView: React.FC<{ content: string }> = ({ content }) => {
  const [expanded, setExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Split the content into paragraphs for better visual organization
  const paragraphs = content
    .split(/\n\n|\r\n\r\n/)
    .filter((p) => p.trim().length > 0);

  // Format paragraphs with timestamps if found
  const formattedParagraphs = paragraphs.map((p) => {
    // Simple regex to find and format timestamps like [00:00] or (00:00)
    return p.replace(/[\[\(](\d{1,2}:\d{2})[\]\)]/g, (match) => {
      return `\n${match}\n`;
    });
  });

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialIcons
            name="text-snippet"
            size={16}
            color={colors.dark.foreground}
          />
        </View>
        <View>
          <Text style={styles.sectionTitle}>Video Transcript</Text>
          <Text style={styles.sectionSubtitle}>
            {paragraphs.length} paragraphs found
          </Text>
        </View>
      </View>

      {/* Transcript content with gradient fade effect */}
      <Animated.View
        style={[
          styles.transcript,
          {
            borderRadius: 16,
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ maxHeight: expanded ? undefined : 200 }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {formattedParagraphs.map((paragraph, index) => (
            <Animated.View
              key={index}
              entering={FadeIn.delay(index * 30).duration(200)}
              style={{ marginBottom: 12 }}
            >
              <Text style={styles.transcriptText}>{paragraph}</Text>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Gradient fade at bottom when not expanded */}
        {!expanded && (
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 50,
              backgroundColor: "transparent",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              // Create gradient-like effect
              borderTopWidth: 50,
              borderTopColor: "rgba(20, 20, 20, 0)",
              borderStyle: "solid",
            }}
          />
        )}

        {/* Show more/less button */}
        <TouchableOpacity
          style={{
            alignSelf: "center",
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.1)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
          onPress={() => setExpanded(!expanded)}
        >
          <Text
            style={{
              color: colors.dark.foreground,
              fontWeight: "500",
              marginRight: 4,
              fontSize: 13,
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </Text>
          <MaterialIcons
            name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={16}
            color={colors.dark.foreground}
          />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

export const ToolOutput: React.FC<ToolOutputProps> = ({
  type,
  data,
  onAction,
  assistantMessage,
}) => {
  // Use shared value to track loading state
  const isLoading = useSharedValue(true);
  const opacity = useSharedValue(0);

  // Reference to track previous type for proper animation
  const prevTypeRef = useRef<ToolOutputType>(null);

  useEffect(() => {
    // Reset loading state when new data comes in
    isLoading.value = true;
    opacity.value = 0;

    // Start animation after a short delay
    const timer = setTimeout(() => {
      isLoading.value = false;
      opacity.value = withTiming(1, { duration: 300 });
    }, 100);

    // Update previous type after transition
    prevTypeRef.current = type;

    return () => clearTimeout(timer);
  }, [type, data]);

  // Animation style for the wrapper
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Parse the raw data based on the tool type
  const parseData = () => {
    if (!data?.success) {
      throw new Error(data?.message || "Invalid data format");
    }

    switch (type) {
      case "youtube_finder":
        if (
          !data.data?.videos ||
          !Array.isArray(data.data.videos) ||
          data.data.videos.length === 0
        ) {
          throw new Error("No videos found");
        }
        return data.data.videos as YouTubeVideo[];
      case "search_web":
        if (
          !data.data?.results ||
          !Array.isArray(data.data.results) ||
          data.data.results.length === 0
        ) {
          throw new Error("No search results found");
        }
        return data.data.results as SearchResult[];
      case "youtube_transcript":
        if (!data.data?.content) {
          throw new Error("No transcript content found");
        }
        return data.data.content as string;
      default:
        return null;
    }
  };

  try {
    const parsedData = parseData();

    // Render appropriate component based on tool type
    const renderToolOutput = () => {
      switch (type) {
        case "youtube_finder":
          return (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ width: "100%" }}
            >
              <YouTubeVideoList
                videos={parsedData as YouTubeVideo[]}
                onSelect={(video) => onAction?.(video)}
              />
            </Animated.View>
          );
        case "search_web":
          return (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ width: "100%" }}
            >
              <SearchResults results={parsedData as SearchResult[]} />
            </Animated.View>
          );
        case "youtube_transcript":
          return (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ width: "100%" }}
            >
              <TranscriptView content={parsedData as string} />
            </Animated.View>
          );
        default:
          return null;
      }
    };

    return (
      <Animated.View style={[{ width: "100%" }, animatedStyle]}>
        {renderToolOutput()}
      </Animated.View>
    );
  } catch (error) {
    console.error(`Error parsing ${type} data:`, error);
    // If there's an error and we have an assistant message, display it
    if (assistantMessage) {
      return (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.fallbackContainer}
        >
          <Text style={styles.fallbackText}>{assistantMessage}</Text>
        </Animated.View>
      );
    }
    return null;
  }
};
