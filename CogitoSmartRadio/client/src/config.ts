export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
export const RADIO_STREAM_URL =
  import.meta.env.VITE_RADIO_STREAM_URL ||
  "https://icecast.radiofrance.fr/fip-hifi.aac"; // public FIP stream

export const DEFAULT_PROFILE_ID = import.meta.env.VITE_PROFILE_ID || "ruth-profile";

