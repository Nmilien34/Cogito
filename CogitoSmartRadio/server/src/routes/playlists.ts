import { Router } from "express";
import type { PlaylistItem } from "@prisma/client";
import { request } from "undici";
import { prisma } from "../prismaClient";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/:profileId", requireAuth, async (req, res) => {
  const items = await prisma.playlistItem.findMany({
    where: { profileId: req.params.profileId },
    orderBy: { createdAt: "asc" },
  });

  const hydrated = await ensureVideoIds(items);

  res.json(hydrated);
});

router.post("/play", requireAuth, async (req, res) => {
  const { profileId, songTitle, artist, provider, videoId } = req.body;
  if (!profileId || !songTitle) {
    return res.status(400).json({ message: "profileId and songTitle required" });
  }

  const history = await prisma.playbackHistory.create({
    data: {
      profileId,
      songTitle,
      artist,
      provider,
      videoId,
    },
  });

  res.status(201).json(history);
});

export default router;

async function ensureVideoIds(items: PlaylistItem[]) {
  if (!process.env.YOUTUBE_API_KEY) {
    return items;
  }

  const enriched = await Promise.all(
    items.map(async (item) => {
      if (item.videoId) return item;
      try {
        const videoId = await lookupYouTubeVideoId(item.query);
        if (!videoId) {
          return item;
        }
        return prisma.playlistItem.update({
          where: { id: item.id },
          data: { videoId },
        });
      } catch (err) {
        console.warn("YouTube lookup failed", err);
        return item;
      }
    }),
  );

  return enriched;
}

async function lookupYouTubeVideoId(query: string) {
  if (!process.env.YOUTUBE_API_KEY) return null;

  const url = new URL("https://youtube.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "id");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  const { body } = await request(url);
  const data = (await body.json()) as {
    items?: Array<{ id?: { videoId?: string } }>;
  };

  return data.items?.[0]?.id?.videoId ?? null;
}

