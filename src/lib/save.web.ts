import type { DownloadToDeviceOptions, SaveResult } from './files';

export type { DeviceProgress, DownloadToDeviceOptions, SaveResult } from './files';
export { mimeTypeFor } from './files';

export async function downloadToDevice({
  url,
  filename,
  onProgress,
}: DownloadToDeviceOptions): Promise<SaveResult> {
  onProgress?.({ bytesWritten: 0, totalBytes: 0, ratio: 0.35 });

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'tubeflow-download';
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  onProgress?.({ bytesWritten: 1, totalBytes: 1, ratio: 1 });

  return {
    localUri: null,
    remoteUrl: url,
    savedToLibrary: true,
    locationLabel: 'Downloaded to your browser downloads',
  };
}

export async function shareLocalFile(uri: string, _mimeType: string): Promise<void> {
  const navigatorWithShare = navigator as Navigator & {
    share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  };
  if (navigatorWithShare.share) {
    await navigatorWithShare.share({ url: uri, title: 'TubeFlow download' });
    return;
  }
  window.open(uri, '_blank', 'noopener,noreferrer');
}

export async function openLocalFile(uri: string, _mimeType: string): Promise<void> {
  window.open(uri, '_blank', 'noopener,noreferrer');
}

export async function deleteLocalFile(_uri: string | null): Promise<void> {}

export async function fileExists(uri: string | null): Promise<boolean> {
  return Boolean(uri);
}
