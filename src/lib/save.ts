import type { DownloadToDeviceOptions, SaveResult } from './files';

export type { DeviceProgress, DownloadToDeviceOptions, SaveResult } from './files';
export { mimeTypeFor } from './files';

/**
 * Fallback implementation. Metro resolves `save.native.ts` on iOS/Android and
 * `save.web.ts` on the web.
 */
export async function downloadToDevice(
  _options: DownloadToDeviceOptions,
): Promise<SaveResult> {
  throw new Error('Saving files is not supported on this platform.');
}

export async function shareLocalFile(_uri: string, _mimeType: string): Promise<void> {
  throw new Error('Sharing is not supported on this platform.');
}

export async function openLocalFile(_uri: string, _mimeType: string): Promise<void> {
  throw new Error('Opening files is not supported on this platform.');
}

export async function deleteLocalFile(_uri: string | null): Promise<void> {}

export async function fileExists(_uri: string | null): Promise<boolean> {
  return false;
}
