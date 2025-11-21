import { api } from "./client";
import type { PlaylistItem } from "../types";

export const fetchPlaylist = (profileId: string) => api.get<PlaylistItem[]>(`/playlists/${profileId}`);

