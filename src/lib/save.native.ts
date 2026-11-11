import { Directory, File, Paths } from 'expo-file-system';
import { Album, Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { DownloadKind } from '@/types/youtube';

import {
  mimeTypeFor,
  type DownloadToDeviceOptions,
  type SaveResult,
} from './files';

const ALBUM_NAME = 'TubeFlow';
const DOWNLOAD_FOLDER = 'TubeFlow';

function sanitizeName(name: string) {
  const cleaned = name
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'tubeflow-download';
}

function splitExtension(name: string) {
  const index = name.lastIndexOf('.');
  if (index <= 0) return { base: name, extension: '' };
  return { base: name.slice(0, index), extension: name.slice(index) };
}

function downloadDirectory() {
  const directory = new Directory(Paths.document, DOWNLOAD_FOLDER);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

function uniqueDestination(directory: Directory, filename: string) {
  const safe = sanitizeName(filename);
  const { base, extension } = splitExtension(safe);
  let candidate = new File(directory, `${base}${extension}`);
  let suffix = 2;
  while (candidate.exists) {
    candidate = new File(directory, `${base} (${suffix})${extension}`);
    suffix += 1;
  }
  return candidate;
}

async function saveToGallery(file: File, kind: DownloadKind) {
  const granular = kind === 'video' ? ['video'] : ['audio'];
  const permission = await requestPermissionsAsync(true, granular as ('video' | 'audio')[]);
  if (!permission.granted) {
    return false;
  }

  let album: Album | null = null;
  try {
    album = await Album.get(ALBUM_NAME);
    if (!album) {
      album = await Album.create(ALBUM_NAME, []);
    }
  } catch {
    album = null;
  }

  await Asset.create(file.uri, album ?? undefined);
  return true;
}

export async function downloadToDevice({
  url,
  filename,
  kind,
  mimeType,
  onProgress,
}: DownloadToDeviceOptions): Promise<SaveResult> {
  const directory = downloadDirectory();
  const destination = uniqueDestination(directory, filename);

  const task = File.createDownloadTask(url, destination, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      const total = totalBytes > 0 ? totalBytes : 0;
      onProgress?.({
        bytesWritten,
        totalBytes: total,
        ratio: total > 0 ? Math.min(1, bytesWritten / total) : 0,
      });
    },
  });

  const file = await task.downloadAsync();
  if (!file || !file.exists) {
    throw new Error('The file could not be saved to this device.');
  }

  let savedToLibrary = false;
  let locationLabel = 'Saved in the TubeFlow folder';

  if (Platform.OS === 'ios' && kind === 'audio') {
    // iOS Photos does not accept audio, so hand the file to the share sheet
    // where the user can save it to Files or an audio app.
    if (await Sharing.isAvailableAsync()) {
      try {
        await Sharing.shareAsync(file.uri, {
          mimeType: mimeType || mimeTypeFor(filename, kind),
          dialogTitle: 'Save your audio',
          UTI: 'public.audio',
        });
        locationLabel = 'Choose a folder in the share sheet';
      } catch {
        locationLabel = 'Saved in the TubeFlow folder';
      }
    }
  } else {
    try {
      savedToLibrary = await saveToGallery(file, kind);
      if (savedToLibrary) {
        locationLabel =
          kind === 'video' ? 'Saved to your photo gallery' : 'Saved to your audio library';
      } else {
        locationLabel = 'Saved in the TubeFlow folder (permission denied)';
      }
    } catch {
      // Keep the downloaded file in the app's document folder as a fallback.
      savedToLibrary = false;
      locationLabel = 'Saved in the TubeFlow folder';
    }
  }

  return {
    localUri: file.uri,
    remoteUrl: null,
    savedToLibrary,
    locationLabel,
  };
}

export async function shareLocalFile(uri: string, mimeType: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: 'Share from TubeFlow',
  });
}

export async function openLocalFile(uri: string, mimeType: string): Promise<void> {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('This file is no longer on the device.');
  }
  try {
    await file.preview({ mimeType });
  } catch {
    await shareLocalFile(uri, mimeType);
  }
}

export async function deleteLocalFile(uri: string | null): Promise<void> {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Ignore missing or unreadable files.
  }
}

export async function fileExists(uri: string | null): Promise<boolean> {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export { mimeTypeFor };
export type { DeviceProgress, DownloadToDeviceOptions, SaveResult } from './files';

