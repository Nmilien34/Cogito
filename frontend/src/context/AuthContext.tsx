import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";
import { router } from "expo-router";
import { User, AuthMeta } from "../types/user";

interface AuthContextType {
  user: User | null;
  meta: AuthMeta | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  signInWithEmail: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  signInWithGoogle: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => Promise<void>;
  updateAuth: (user: User, meta: AuthMeta) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<AuthMeta | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("accessToken");
      const storedUser = await AsyncStorage.getItem("user");
      const storedMeta = await AsyncStorage.getItem("authMeta");

      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedMeta) {
          setMeta(JSON.parse(storedMeta));
        }
      }
    } catch (err) {
      console.error("Error loading user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(
        "Sending email code request to:",
        `${api.defaults.baseURL}/api/auth/email/send-code`
      );

      await api.post("/api/auth/email/send-code", { email });
      console.log("Email code sent successfully");
    } catch (err: any) {
      console.error("Email sign in error:", err);
      console.error("Email sign in error details:", {
        code: err.code,
        message: err.message,
        response: err.response?.data,
      });

      // Handle network errors specifically
      if (err.message === "Network Error") {
        setError(
          "Unable to connect to server. Please check your internet connection and try again."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to send verification code. Please try again."
        );
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/api/auth/email/verify-code", {
        email,
        otp: code,
      });

      await AsyncStorage.setItem("accessToken", data.accessToken);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      if (data.meta) {
        await AsyncStorage.setItem("authMeta", JSON.stringify(data.meta));
      }

      setUser(data.user);
      setMeta(data.meta);
      setAccessToken(data.accessToken);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid verification code");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/api/auth/google/verify", {
        token,
        clientType: "expo",
      });

      await AsyncStorage.setItem("accessToken", data.accessToken);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      if (data.meta) {
        await AsyncStorage.setItem("authMeta", JSON.stringify(data.meta));
      }

      setUser(data.user);
      setMeta(data.meta);
      setAccessToken(data.accessToken);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to sign in with Google");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      // Clear user data
      setUser(null);
      setMeta(null);
      setAccessToken(null);

      // Remove stored data
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("authMeta");

      setIsLoading(false);

      // Redirect to auth screen
      router.replace("/auth");
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error("Error updating user:", err);
      throw err;
    }
  };

  const updateAuth = async (updatedUser: User, updatedMeta: AuthMeta) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      await AsyncStorage.setItem("authMeta", JSON.stringify(updatedMeta));
      setUser(updatedUser);
      setMeta(updatedMeta);
    } catch (err) {
      console.error("Error updating auth state:", err);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        meta,
        accessToken,
        isLoading,
        error,
        signInWithEmail,
        verifyEmailCode,
        signInWithGoogle,
        signOut,
        clearError,
        updateUser,
        updateAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
