import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/ambient-background';
import { BrandMark } from '@/components/brand-mark';
import { DownloadSheet, type DownloadPhase } from '@/components/download-sheet';
import { GlassCard } from '@/components/glass-card';
import { HistoryRow } from '@/components/history-row';
import { ModeSwitch } from '@/components/mode-switch';
import { PressableScale } from '@/components/pressable-scale';
import { QualitySelector } from '@/components/quality-selector';
import { SectionHeader } from '@/components/section-header';
import { Skeleton } from '@/components/skeleton';
import { Toast, type ToastType } from '@/components/toast';
import { UrlInput } from '@/components/url-input';
import { VideoPreview } from '@/components/video-preview';
import { Colors, Fonts, Gradients, Layout, Radius } from '@/constants/theme';
import {
  API_BASE_URL,
  ApiError,
  absoluteDownloadUrl,
  cancelDownloadJob,
  checkHealth,
  createDownload,
  fetchVideoInfo,
  waitForDownload,
} from '@/lib/api';
import {
  extractYouTubeUrl,
  formatAbr,
  formatBytes,
} from '@/lib/format';
import { addHistory, loadHistory } from '@/lib/history';
import {
  downloadToDevice,
  fileExists,
  mimeTypeFor,
  openLocalFile,
  shareLocalFile,
  type DeviceProgress,
  type SaveResult,
} from '@/lib/save';
import type {
  DownloadJob,
  DownloadKind,
  HistoryItem,
  VideoInfo,
} from '@/types/youtube';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string; hint: string }[] = [
  { icon: 'videocam-outline', label: 'Up to 4K', hint: 'All resolutions' },
  { icon: 'musical-notes-outline', label: 'MP3 · M4A', hint: 'Clean audio' },
  { icon: 'phone-portrait-outline', label: 'On device', hint: 'Saved offline' },
];

const STEPS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    icon: 'link-outline',
    title: 'Paste a YouTube link',
    description: 'Videos, Shorts, live replays or a bare video ID.',
  },
  {
    icon: 'options-outline',
    title: 'Pick your quality',
    description: 'Every available resolution, plus MP3, M4A and WEBM audio.',
  },
  {
    icon: 'cloud-download-outline',
    title: 'Download and keep it',
    description: 'Files land in your gallery or the TubeFlow folder.',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<DownloadKind>('video');
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: ToastType;
  } | null>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [phase, setPhase] = useState<DownloadPhase>('starting');
  const [job, setJob] = useState<DownloadJob | null>(null);
  const [deviceProgress, setDeviceProgress] = useState<DeviceProgress | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fetchController = useRef<AbortController | null>(null);
  const downloadController = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const health = await checkHealth();
      setOnline(health.status === 'ok');
    } catch {
      setOnline(false);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    const items = await loadHistory();
    setHistory(items);
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useFocusEffect(
    useCallback(() => {
      refreshHistory();
    }, [refreshHistory]),
  );

  useEffect(
    () => () => {
      fetchController.current?.abort();
      downloadController.current?.abort();
    },
    [],
  );

  const selectedVideoFormat =
    info?.video_formats.find((format) => format.height === selectedHeight) ?? null;
  const selectedAudioFormat =
    info?.audio_formats.find((format) => format.id === selectedAudioId) ?? null;

  const selectionLabel =
    mode === 'video'
      ? selectedVideoFormat?.label ?? 'quality'
      : selectedAudioFormat?.label ?? 'audio';

  const selectionMeta =
    mode === 'video'
      ? [
          selectedVideoFormat?.container.toUpperCase(),
          formatBytes(selectedVideoFormat?.filesize),
        ]
          .filter(Boolean)
          .join(' · ')
      : [
          formatAbr(selectedAudioFormat?.abr),
          formatBytes(selectedAudioFormat?.filesize),
        ]
          .filter(Boolean)
          .join(' · ');

  const canDownload = Boolean(
    info && (mode === 'video' ? selectedVideoFormat : selectedAudioFormat),
  );

  function handleUrlChange(next: string) {
    setUrl(next);
    setError(null);
    if (info) {
      setInfo(null);
      setSelectedHeight(null);
    }
  }

  async function handleFetch() {
    const raw = url.trim();
    if (!raw) {
      notify('Paste a YouTube link first.', 'info');
      return;
    }
    const link = extractYouTubeUrl(raw);
    if (!link) {
      notify('That does not look like a YouTube link.', 'error');
      return;
    }

    fetchController.current?.abort();
    const controller = new AbortController();
    fetchController.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchVideoInfo(link, controller.signal);
      setUrl(data.webpage_url || link);
      setInfo(data);

      const preferred =
        data.video_formats.find((format) => format.height === 1080) ??
        data.video_formats[0] ??
        null;
      setSelectedHeight(preferred?.height ?? null);

      const audio =
        data.audio_formats.find((format) => format.recommended) ??
        data.audio_formats[0] ??
        null;
      setSelectedAudioId(audio?.id ?? null);

      if (mode === 'video' && data.video_formats.length === 0 && audio) {
        setMode('audio');
      }
      if (mode === 'audio' && data.audio_formats.length === 0 && preferred) {
        setMode('video');
      }

      if (data.video_formats.length === 0 && data.audio_formats.length === 0) {
        notify('No downloadable formats were found for this video.', 'error');
      } else {
        setOnline(true);
      }
    } catch (caught) {
      if (controller.signal.aborted) return;
      const message =
        caught instanceof ApiError ? caught.message : 'Could not read this video.';
      setError(message);
      setInfo(null);
      if (caught instanceof ApiError && caught.status === 0) setOnline(false);
    } finally {
      if (fetchController.current === controller) {
        fetchController.current = null;
        setLoading(false);
      }
    }
  }

  async function handleDownload() {
    if (!info) return;
    if (mode === 'video' && !selectedVideoFormat) {
      notify('Choose a video quality first.', 'info');
      return;
    }
    if (mode === 'audio' && !selectedAudioFormat) {
      notify('Choose an audio format first.', 'info');
      return;
    }

    cancelledRef.current = false;
    downloadController.current?.abort();
    const controller = new AbortController();
    downloadController.current = controller;

    setSheetVisible(true);
    setPhase('starting');
    setJob(null);
    setDeviceProgress(null);
    setResult(null);
    setDownloadError(null);

    try {
      const created = await createDownload({
        url: info.webpage_url,
        kind: mode,
        height: selectedVideoFormat?.height ?? null,
        container: selectedVideoFormat?.container ?? 'mp4',
        audio_id: selectedAudioFormat?.id ?? 'mp3',
      });
      setJob(created);
      setPhase('downloading');

      const done = await waitForDownload(created.id, {
        signal: controller.signal,
        onUpdate: setJob,
      });

      if (cancelledRef.current) return;
      setJob(done);

      const remote = absoluteDownloadUrl(done);
      if (!remote) throw new Error('The server did not provide a download link.');

      setPhase('saving');

      const extension = mode === 'video' ? done.container || 'mp4' : done.audio_id || 'mp3';
      const filename =
        done.filename || `${info.title.slice(0, 80).trim() || 'tubeflow'}.${extension}`;

      const saved = await downloadToDevice({
        url: remote,
        filename,
        kind: mode,
        mimeType: mimeTypeFor(filename, mode),
        onProgress: setDeviceProgress,
      });

      if (cancelledRef.current) return;
      setResult(saved);
      setPhase('success');

      const savedExtension = filename.split('.').pop();
      const historyItem: HistoryItem = {
        id: done.id,
        title: done.title || info.title,
        thumbnail: done.thumbnail || info.thumbnail,
        author: info.author,
        kind: mode,
        quality: done.quality,
        format: (savedExtension || extension).toUpperCase(),
        filename,
        filesize: done.filesize,
        savedAt: Date.now(),
        localUri: saved.localUri,
        remoteUrl: saved.remoteUrl ?? remote,
        savedToLibrary: saved.savedToLibrary,
        duration: done.duration ?? info.duration,
      };

      setHistory(await addHistory(historyItem));
      notify(
        mode === 'video' ? 'Video saved to your device.' : 'Audio saved to your device.',
        'success',
      );
    } catch (caught) {
      if (cancelledRef.current || controller.signal.aborted) return;
      const message =
        caught instanceof Error ? caught.message : 'The download could not be completed.';
      setDownloadError(message);
      setPhase('error');
      if (caught instanceof ApiError && caught.status === 0) setOnline(false);
    } finally {
      if (downloadController.current === controller) {
        downloadController.current = null;
      }
    }
  }

  async function handleCancel() {
    cancelledRef.current = true;
    downloadController.current?.abort();
    const jobId = job?.id;
    if (jobId) {
      try {
        await cancelDownloadJob(jobId);
      } catch {
        // The job may have already finished.
      }
    }
    setSheetVisible(false);
    setJob(null);
    setDeviceProgress(null);
    setPhase('starting');
    notify('Download cancelled.', 'info');
  }

  function handleSheetClose() {
    if (phase === 'starting' || phase === 'downloading' || phase === 'saving') return;
    setSheetVisible(false);
  }

  function currentFileUri() {
    return result?.localUri ?? result?.remoteUrl ?? job?.download_url ?? null;
  }

  async function handleOpen() {
    const uri = currentFileUri();
    if (!uri) {
      notify('No file is available to open.', 'error');
      return;
    }
    try {
      await openLocalFile(uri, mimeTypeFor(job?.filename ?? '', mode));
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not open this file.', 'error');
    }
  }

  async function handleShare() {
    const uri = currentFileUri();
    if (!uri) {
      notify('No file is available to share.', 'error');
      return;
    }
    try {
      await shareLocalFile(uri, mimeTypeFor(job?.filename ?? '', mode));
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not share this file.', 'error');
    }
  }

  async function handleHistoryOpen(item: HistoryItem) {
    const uri = item.localUri ?? item.remoteUrl;
    if (!uri) {
      notify('That file is no longer available.', 'error');
      return;
    }
    if (item.localUri && !(await fileExists(item.localUri))) {
      notify('That file is no longer on this device.', 'error');
      return;
    }
    try {
      await openLocalFile(uri, mimeTypeFor(item.filename, item.kind));
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not open this file.', 'error');
    }
  }

  async function handleHistoryShare(item: HistoryItem) {
    const uri = item.localUri ?? item.remoteUrl;
    if (!uri) {
      notify('That file is no longer available.', 'error');
      return;
    }
    try {
      await shareLocalFile(uri, mimeTypeFor(item.filename, item.kind));
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not share this file.', 'error');
    }
  }

  const recent = history.slice(0, 3);

  return (
    <View style={styles.root}>
      <AmbientBackground variant={mode === 'video' ? 'video' : 'audio'} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Layout.tabBarHeight + insets.bottom + 44 },
          ]}>
          <View style={styles.content}>
            <View style={styles.header}>
              <BrandMark size={34} subtitle="YouTube download studio" />
              <Pressable
                onPress={refreshHealth}
                style={({ pressed }) => [styles.statusPill, pressed && styles.pressed]}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        online === null
                          ? Colors.amber
                          : online
                            ? Colors.green
                            : Colors.danger,
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {online === null ? 'Checking' : online ? 'Server live' : 'Offline'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>DOWNLOAD · KEEP · GO OFFLINE</Text>
              <Text style={styles.heroTitle}>
                Save it once.{'\n'}Watch it{' '}
                <Text style={styles.heroAccent}>anywhere.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Full-resolution YouTube video and crystal-clear audio, downloaded
                straight to your device.
              </Text>
            </View>

            <UrlInput
              value={url}
              onChangeText={handleUrlChange}
              onSubmit={handleFetch}
              loading={loading}
              disabled={loading}
              onNotice={notify}
            />

            {error ? (
              <GlassCard style={styles.errorCard} radius={Radius.lg} intensity={20}>
                <View style={styles.errorIcon}>
                  <Ionicons name="alert-circle" size={20} color={Colors.danger} />
                </View>
                <View style={styles.errorCopy}>
                  <Text style={styles.errorTitle}>Could not load that video</Text>
                  <Text style={styles.errorMessage}>{error}</Text>
                  {online === false ? (
                    <Text style={styles.errorApi}>API · {API_BASE_URL}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={handleFetch}
                  hitSlop={8}
                  style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
                  <Ionicons name="refresh" size={15} color={Colors.white} />
                </Pressable>
              </GlassCard>
            ) : null}

            {loading ? (
              <Animated.View entering={FadeInDown.duration(280)}>
                <GlassCard style={styles.loadingCard} radius={Radius.xl} intensity={18}>
                  <Skeleton height={168} radius={18} />
                  <View style={styles.skeletonRow}>
                    <Skeleton width={78} height={14} />
                    <Skeleton width={120} height={14} />
                  </View>
                  <Skeleton width="86%" height={20} />
                  <View style={styles.skeletonRow}>
                    <Skeleton width="30%" height={92} radius={16} />
                    <Skeleton width="30%" height={92} radius={16} />
                    <Skeleton width="30%" height={92} radius={16} />
                  </View>
                </GlassCard>
              </Animated.View>
            ) : info ? (
              <View style={styles.analyzed}>
                <VideoPreview info={info} />

                <View style={styles.modeSection}>
                  <ModeSwitch value={mode} onChange={setMode} />
                </View>

                <QualitySelector
                  kind={mode}
                  videoFormats={info.video_formats}
                  audioFormats={info.audio_formats}
                  selectedHeight={selectedHeight}
                  selectedAudioId={selectedAudioId}
                  onSelectHeight={setSelectedHeight}
                  onSelectAudio={setSelectedAudioId}
                />

                <Animated.View entering={FadeInDown.delay(80).duration(380)}>
                  <PressableScale
                    onPress={handleDownload}
                    disabled={!canDownload}
                    scaleTo={0.975}
                    containerStyle={[styles.downloadWrap, !canDownload && styles.disabled]}>
                    <LinearGradient
                      colors={mode === 'video' ? Gradients.video : Gradients.audio}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.downloadButton}>
                      <View style={styles.downloadIcon}>
                        <Ionicons name="cloud-download-outline" size={24} color={Colors.white} />
                      </View>
                      <View style={styles.downloadCopy}>
                        <Text style={styles.downloadTitle}>Download {selectionLabel}</Text>
                        <Text style={styles.downloadMeta}>
                          {selectionMeta || 'Ready when you are'}
                        </Text>
                      </View>
                      <View style={styles.downloadArrow}>
                        <Ionicons name="arrow-down" size={18} color={Colors.white} />
                      </View>
                    </LinearGradient>
                  </PressableScale>
                </Animated.View>
              </View>
            ) : (
              <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.landing}>
                <View style={styles.featureRow}>
                  {FEATURES.map((feature) => (
                    <View key={feature.label} style={styles.feature}>
                      <View style={styles.featureIcon}>
                        <Ionicons name={feature.icon} size={16} color={Colors.pink} />
                      </View>
                      <Text style={styles.featureLabel}>{feature.label}</Text>
                      <Text style={styles.featureHint}>{feature.hint}</Text>
                    </View>
                  ))}
                </View>

                <GlassCard style={styles.howCard} radius={Radius.xl} intensity={20}>
                  <View style={styles.howHeader}>
                    <View style={styles.howTitleRow}>
                      <Ionicons name="sparkles-outline" size={16} color={Colors.pink} />
                      <Text style={styles.howTitle}>How it works</Text>
                    </View>
                    <Text style={styles.howHint}>3 steps</Text>
                  </View>

                  {STEPS.map((step, index) => (
                    <View key={step.title} style={styles.stepRow}>
                      <LinearGradient
                        colors={['rgba(139,92,246,0.9)', 'rgba(244,63,125,0.9)']}
                        style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </LinearGradient>
                      <View style={styles.stepCopy}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepDescription}>{step.description}</Text>
                      </View>
                      <Ionicons name={step.icon} size={18} color={Colors.textMuted} />
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>
            )}

            {recent.length > 0 ? (
              <View style={styles.recentSection}>
                <SectionHeader
                  title="Recent downloads"
                  hint={`${history.length} saved`}
                  actionLabel="View all"
                  onAction={() => router.push('/library')}
                  icon="time-outline"
                />
                <View style={styles.recentList}>
                  {recent.map((item, index) => (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      index={index}
                      compact
                      onPress={() => handleHistoryOpen(item)}
                      onShare={() => handleHistoryShare(item)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <Text style={styles.footerNote}>
              Built for offline watching · Powered by yt-dlp
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <DownloadSheet
        visible={sheetVisible}
        phase={phase}
        job={job}
        kind={mode}
        quality={job?.quality ?? selectionLabel}
        deviceProgress={deviceProgress}
        result={result}
        error={downloadError}
        onCancel={handleCancel}
        onClose={handleSheetClose}
        onRetry={handleDownload}
        onOpen={handleOpen}
        onShare={handleShare}
      />

      <Toast
        key={toast?.id}
        message={toast?.message ?? null}
        type={toast?.type ?? 'info'}
        onHide={() => setToast(null)}
        bottomOffset={Layout.tabBarHeight + insets.bottom + 22}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 6,
  },
  content: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    gap: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10.5,
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.65,
  },
  hero: {
    gap: 10,
    paddingTop: 4,
  },
  heroEyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9.5,
    letterSpacing: 2.1,
    color: Colors.pink,
  },
  heroTitle: {
    fontFamily: Fonts.display,
    fontSize: 35,
    lineHeight: 40,
    letterSpacing: -1.4,
    color: Colors.text,
  },
  heroAccent: {
    color: Colors.pink,
  },
  heroSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.textSecondary,
    maxWidth: 430,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    borderColor: 'rgba(251,113,133,0.28)',
  },
  errorIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,113,133,0.12)',
  },
  errorCopy: {
    flex: 1,
    gap: 4,
  },
  errorTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
  errorMessage: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.rose,
  },
  errorApi: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
  },
  retry: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  loadingCard: {
    padding: 14,
    gap: 14,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyzed: {
    gap: 20,
  },
  modeSection: {
    marginTop: 2,
  },
  downloadWrap: {
    borderRadius: Radius.lg,
    shadowColor: '#F43F7D',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  disabled: {
    opacity: 0.5,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
    overflow: 'hidden',
  },
  downloadIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  downloadCopy: {
    flex: 1,
    gap: 2,
  },
  downloadTitle: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    letterSpacing: -0.2,
    color: Colors.white,
  },
  downloadMeta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
  },
  downloadArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  landing: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 9,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSoft,
    marginBottom: 2,
  },
  featureLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: Colors.text,
  },
  featureHint: {
    fontFamily: Fonts.body,
    fontSize: 9.5,
    color: Colors.textMuted,
  },
  howCard: {
    padding: 16,
    gap: 14,
  },
  howHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  howTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  howTitle: {
    fontFamily: Fonts.heading,
    fontSize: 15.5,
    letterSpacing: -0.2,
    color: Colors.text,
  },
  howHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    color: Colors.white,
  },
  stepCopy: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.text,
  },
  stepDescription: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
  },
  recentSection: {
    gap: 12,
  },
  recentList: {
    gap: 8,
  },
  footerNote: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.22)',
    textAlign: 'center',
    paddingTop: 2,
  },
});
