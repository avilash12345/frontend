import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { CreateDownloadInput, DownloadJob, VideoInfo } from '@/types/youtube';

const ENV_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function devHost() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname || 'localhost';
  }

  const constants = Constants as typeof Constants & {
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  const hostUri =
    Constants.expoConfig?.hostUri ??
    constants.expoGoConfig?.debuggerHost ??
    constants.manifest2?.extra?.expoClient?.hostUri;

  return hostUri?.split(':')[0] ?? null;
}

function resolveBaseUrl() {
  if (ENV_URL) return stripTrailingSlash(ENV_URL);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8000`;
  }

  const host = devHost();
  if (host) return `http://${host}:8000`;

  // Android emulators reach the host machine through 10.0.2.2.
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, status = 0, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function errorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (first?.msg) return first.msg;
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 120_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const externalSignal = init?.signal;
  const onAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      throw new ApiError(
        errorMessage(payload, `Request failed with status ${response.status}`),
        response.status,
        payload,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error)?.name === 'AbortError') {
      throw new ApiError('The request was cancelled.');
    }
    throw new ApiError(
      `Cannot reach the TubeFlow server at ${API_BASE_URL}. Make sure it is running.`,
    );
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', onAbort);
  }
}

export function thumbnailUrl(url: string | null | undefined) {
  if (!url) return null;
  return `${API_BASE_URL}/api/thumbnail?url=${encodeURIComponent(url)}`;
}

export function fetchVideoInfo(url: string, signal?: AbortSignal) {
  return request<VideoInfo>(`/api/info?url=${encodeURIComponent(url)}`, { signal }, 120_000);
}

export function createDownload(input: CreateDownloadInput) {
  return request<DownloadJob>(
    '/api/downloads',
    {
      method: 'POST',
      body: JSON.stringify({
        url: input.url,
        kind: input.kind,
        height: input.height ?? null,
        container: input.container ?? 'mp4',
        audio_id: input.audio_id ?? 'mp3',
      }),
    },
    30_000,
  );
}

export function getDownloadJob(jobId: string, signal?: AbortSignal) {
  return request<DownloadJob>(`/api/downloads/${jobId}`, { signal }, 30_000);
}

export function cancelDownloadJob(jobId: string) {
  return request<{ ok: boolean }>(`/api/downloads/${jobId}`, { method: 'DELETE' }, 15_000);
}

export function checkHealth() {
  return request<{
    status: string;
    version: string;
    yt_dlp: string;
    ffmpeg_available: boolean;
  }>('/api/health', undefined, 10_000);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForDownload(
  jobId: string,
  options: {
    signal?: AbortSignal;
    onUpdate?: (job: DownloadJob) => void;
    intervalMs?: number;
  } = {},
): Promise<DownloadJob> {
  const interval = options.intervalMs ?? 850;

  for (;;) {
    if (options.signal?.aborted) {
      throw new ApiError('The download was cancelled.');
    }

    const job = await getDownloadJob(jobId, options.signal);
    options.onUpdate?.(job);

    if (job.status === 'ready') return job;
    if (job.status === 'error') {
      throw new ApiError(job.error || 'The download failed.', 502);
    }
    if (job.status === 'cancelled') {
      throw new ApiError('The download was cancelled.', 499);
    }

    await sleep(interval);
  }
}

export function absoluteDownloadUrl(job: DownloadJob) {
  if (!job.download_url) return null;
  if (job.download_url.startsWith('http')) return job.download_url;
  return `${API_BASE_URL}${job.download_url}`;
}
