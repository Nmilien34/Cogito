import { useEffect, useState } from "react";
import YouTube from "react-youtube";
import { fetchPlaylist } from "../api/playlists";
import { DEFAULT_PROFILE_ID } from "../config";
import type { PlaylistItem } from "../types";
import { useRadioAudio } from "../context/AudioProvider";

export const PlaylistPanel = () => {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [selected, setSelected] = useState<PlaylistItem | null>(null);
  const [status, setStatus] = useState("");
  const { duck } = useRadioAudio();

  useEffect(() => {
    fetchPlaylist(DEFAULT_PROFILE_ID)
      .then(setPlaylist)
      .catch(() => setStatus("Unable to load playlist"));
  }, []);

  const handleSelect = (item: PlaylistItem) => {
    setSelected(item);
    setStatus(`Playing ${item.title}`);
    duck();
  };

  const fallbackOpen = () => {
    if (!selected) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.query)}`, "_blank");
  };

  return (
    <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Ruth’s Playlist</h3>
        <p className="text-sm text-white/60">{status}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <ul className="space-y-3">
          {playlist.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleSelect(item)}
                className={`w-full text-left rounded-2xl p-4 border ${
                  selected?.id === item.id ? "border-accent bg-accent/10" : "border-white/10"
                }`}
              >
                <p className="text-xl font-semibold">{item.title}</p>
                <p className="text-white/60">{item.artist}</p>
              </button>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl bg-black/40 min-h-[240px] flex items-center justify-center">
          {selected?.videoId ? (
            <YouTube
              videoId={selected.videoId}
              opts={{
                width: "100%",
                height: "240",
                playerVars: {
                  autoplay: 1,
                },
              }}
            />
          ) : (
            <div className="text-center space-y-4 p-6">
              <p className="text-white/70">Select a song to load the YouTube player.</p>
              {selected && (
                <button className="bg-accent text-slate-900 font-semibold px-6 py-3 rounded-full" onClick={fallbackOpen}>
                  Play on Web
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

