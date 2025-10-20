export type ToolOutputType =
  | "youtube_finder"
  | "search_web"
  | "youtube_transcript"
  | null;

export interface YouTubeVideo {
  id: string;
  position?: number;
  title: string;
  link: string;
  description: string;
  views: number;
  length: string;
  published_time: string;
  channel: {
    id: string;
    title: string;
    link: string;
    is_verified: boolean;
    thumbnail: string;
  };
  thumbnail: {
    static: string;
    rich: string;
  };
  badges?: string[];
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface YouTubeTranscript {
  url: string;
  content: string;
}

export interface ToolOutputProps {
  type: ToolOutputType;
  data: any; // Raw API response data
  onAction?: (action: any) => void;
  assistantMessage?: string; // Fallback message to display if there's an error or no tool output
}
