import { useState, useEffect } from "react";
import {
  GoogleSignin,
  statusCodes,
  type User,
} from "@react-native-google-signin/google-signin";
import { useAuth } from "../context/AuthContext";

// Initialize Google Sign In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true, // if you need to access Google API on behalf of the user FROM YOUR SERVER
  scopes: ["profile", "email", "openid"], // what API you want to access on behalf of the user, default is email and profile
});

export const useGoogleAuth = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      if (userInfo) {
        console.log("Current user:", userInfo);
      }
    } catch (error) {
      console.error("Check user error:", error);
    }
  };

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Play Services is available (Android only)
      await GoogleSignin.hasPlayServices();

      // Perform Google Sign In
      const userInfo = await GoogleSignin.signIn();

      // Get tokens
      const { accessToken, idToken } = await GoogleSignin.getTokens();

      // Call your backend authentication
      if (idToken) {
        await signInWithGoogle(idToken);
      }

      return userInfo;
    } catch (error: any) {
      setError(error.message);
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          console.log("User cancelled the login flow");
          break;
        case statusCodes.IN_PROGRESS:
          console.log("Operation in progress");
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          console.log("Play services not available");
          break;
        default:
          console.error("Google sign in error:", error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return {
    signIn,
    signOut,
    loading,
    error,
  };
};
