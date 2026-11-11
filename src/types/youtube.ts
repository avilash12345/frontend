export type DownloadKind = 'video' | 'audio';

export type VideoFormat = {
  height: number;
  fps: number | null;
  ext: string;
  format_id: string | null;
  vcodec: string | null;
  acodec: string | null;
  filesize: number | null;
  needs_merge: boolean;
  container: 'mp4' | 'webm';
  label: string;
  quality: string;
};

export type AudioFormat = {
  id: string;
  label: string;
  description: string;
  ext: string;
  abr: number | null;
  filesize: number | null;
  converted: boolean;
  recommended: boolean;
};

export type VideoInfo = {
  id: string | null;
  title: string;
  description: string;
  author: string;
  channel_url: string | null;
  thumbnail: string | null;
  duration: number | null;
  view_count: number | null;
  like_count: number | null;
  upload_date: string | null;
  webpage_url: string;
  is_live: boolean;
  video_formats: VideoFormat[];
  audio_formats: AudioFormat[];
};

export type DownloadJobStatus =
  | 'queued'
  | 'preparing'
  | 'downloading'
  | 'processing'
  | 'ready'
  | 'error'
  | 'cancelled';

export type DownloadJob = {
  id: string;
  status: DownloadJobStatus;
  progress: number;
  message: string;
  kind: DownloadKind;
  quality: string;
  height: number | null;
  container: string | null;
  audio_id: string | null;
  title: string | null;
  thumbnail: string | null;
  duration: number | null;
  filename: string | null;
  filesize: number | null;
  speed: string | null;
  eta: number | null;
  downloaded_bytes: number | null;
  total_bytes: number | null;
  error: string | null;
  download_url: string | null;
  created_at: number;
  updated_at: number;
};

export type CreateDownloadInput = {
  url: string;
  kind: DownloadKind;
  height?: number | null;
  container?: 'mp4' | 'webm';
  audio_id?: string;
};

export type HistoryItem = {
  id: string;
  title: string;
  thumbnail: string | null;
  author: string | null;
  kind: DownloadKind;
  quality: string;
  format: string;
  filename: string;
  filesize: number | null;
  savedAt: number;
  localUri: string | null;
  remoteUrl: string | null;
  savedToLibrary: boolean;
  duration: number | null;
};
