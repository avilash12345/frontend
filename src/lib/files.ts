import type { DownloadKind } from '@/types/youtube';

export type DeviceProgress = {
  bytesWritten: number;
  totalBytes: number;
  ratio: number;
};

export type SaveResult = {
  localUri: string | null;
  remoteUrl: string | null;
  savedToLibrary: boolean;
  locationLabel: string;
};

export type DownloadToDeviceOptions = {
  url: string;
  filename: string;
  kind: DownloadKind;
  mimeType: string;
  onProgress?: (progress: DeviceProgress) => void;
};

export function mimeTypeFor(filename: string, kind: DownloadKind) {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'm4a') return 'audio/mp4';
  if (extension === 'webm') return kind === 'video' ? 'video/webm' : 'audio/webm';
  if (extension === 'mp4') return 'video/mp4';
  return kind === 'video' ? 'video/mp4' : 'audio/mpeg';
}
