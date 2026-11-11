import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/glass-card';
import { PressableScale } from '@/components/pressable-scale';
import { Colors, Fonts, Gradients, Radius } from '@/constants/theme';
import { formatBytes, formatEta, formatSpeed } from '@/lib/format';
import type { DeviceProgress, SaveResult } from '@/lib/save';
import type { DownloadJob, DownloadKind } from '@/types/youtube';

export type DownloadPhase =
  | 'starting'
  | 'downloading'
  | 'saving'
  | 'success'
  | 'error';

type DownloadSheetProps = {
  visible: boolean;
  phase: DownloadPhase;
  job: DownloadJob | null;
  kind: DownloadKind;
  quality: string;
  deviceProgress: DeviceProgress | null;
  result: SaveResult | null;
  error: string | null;
  onCancel: () => void;
  onClose: () => void;
  onRetry: () => void;
  onOpen: () => void;
  onShare: () => void;
};

const HEADLINES: Record<DownloadPhase, string> = {
  starting: 'Starting download',
  downloading: 'Downloading',
  saving: 'Saving to device',
  success: 'Saved successfully',
  error: 'Download failed',
};

function Chip({
  icon,
  label,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'default' | 'green';
}) {
  return (
    <View style={[styles.chip, tone === 'green' && styles.chipGreen]}>
      <Ionicons
        name={icon}
        size={12}
        color={tone === 'green' ? Colors.green : Colors.textSecondary}
      />
      <Text style={[styles.chipText, tone === 'green' && styles.chipTextGreen]}>{label}</Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function DownloadSheet({
  visible,
  phase,
  job,
  kind,
  quality,
  deviceProgress,
  result,
  error,
  onCancel,
  onClose,
  onRetry,
  onOpen,
  onShare,
}: DownloadSheetProps) {
  const insets = useSafeAreaInsets();

  const busy = phase === 'starting' || phase === 'downloading' || phase === 'saving';
  const canCancel = phase === 'starting' || phase === 'downloading';
  const isSuccess = phase === 'success';
  const isError = phase === 'error';

  const ratio =
    phase === 'success'
      ? 1
      : phase === 'saving'
        ? (deviceProgress?.ratio ?? 0)
        : (job?.progress ?? 0);
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);

  const progress = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, ratio)), {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, ratio]);

  useEffect(() => {
    checkScale.value = withSpring(isSuccess ? 1 : 0, { damping: 12, stiffness: 170 });
  }, [checkScale, isSuccess]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(busy ? 7 : 0, progress.value * 100)}%`,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const statusText =
    phase === 'starting'
      ? 'Contacting YouTube'
      : phase === 'downloading'
        ? job?.message ?? 'Downloading from YouTube'
        : phase === 'saving'
          ? ratio > 0
            ? `Writing to your device · ${percent}%`
            : 'Preparing your file'
          : phase === 'success'
            ? result?.locationLabel ?? 'Your file is ready'
            : 'Please try again';

  const icon: keyof typeof Ionicons.glyphMap = isSuccess
    ? 'checkmark'
    : isError
      ? 'alert'
      : kind === 'video'
        ? 'videocam'
        : 'musical-notes';

  const accent = kind === 'video' ? Gradients.video : Gradients.audio;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!busy) onClose();
      }}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          disabled={busy}
          onPress={onClose}
          accessibilityLabel="Close download panel"
        />

        <View
          pointerEvents="box-none"
          style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
          <Animated.View entering={SlideInDown.springify().damping(20).stiffness(160)}>
            <GlassCard
              radius={Radius.xl}
              intensity={42}
              tintColor="rgba(16,16,28,0.97)"
              borderColor="rgba(255,255,255,0.14)"
              style={styles.sheet}>
              <View style={styles.grabber} />

              <View style={styles.header}>
                <View style={styles.iconStage}>
                  <LinearGradient
                    colors={isError ? Gradients.danger : isSuccess ? Gradients.success : accent}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBubble}>
                    {isSuccess ? (
                      <Animated.View style={checkStyle}>
                        <Ionicons name={icon} size={22} color={Colors.white} />
                      </Animated.View>
                    ) : (
                      <Ionicons name={icon} size={21} color={Colors.white} />
                    )}
                  </LinearGradient>
                </View>

                <View style={styles.headerCopy}>
                  <Text style={styles.headline}>{HEADLINES[phase]}</Text>
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {job?.title || (kind === 'video' ? 'Your video' : 'Your audio')}
                  </Text>
                </View>

                {!busy ? (
                  <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
                    <Ionicons name="close" size={18} color={Colors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.chipRow}>
                <Chip icon="sparkles" label={quality} />
                <Chip
                  icon={kind === 'video' ? 'film-outline' : 'musical-notes-outline'}
                  label={kind === 'video' ? 'Video' : 'Audio'}
                />
                {isSuccess && result?.savedToLibrary ? (
                  <Chip icon="checkmark-circle" label="Saved" tone="green" />
                ) : null}
              </View>

              {!isError ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.statusText} numberOfLines={2}>
                      {statusText}
                    </Text>
                    <Text style={styles.percent}>{percent}%</Text>
                  </View>

                  <View style={styles.track}>
                    <Animated.View style={[styles.fill, barStyle]}>
                      <LinearGradient
                        colors={isSuccess ? Gradients.success : accent}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                  </View>

                  {phase === 'downloading' ? (
                    <View style={styles.metaRow}>
                      <Meta label="Speed" value={formatSpeed(job?.speed) ?? '—'} />
                      <Meta label="ETA" value={formatEta(job?.eta) ?? '—'} />
                      <Meta
                        label="Size"
                        value={formatBytes(job?.total_bytes ?? job?.filesize)}
                      />
                    </View>
                  ) : null}

                  {phase === 'saving' ? (
                    <View style={styles.metaRow}>
                      <Meta
                        label="Written"
                        value={formatBytes(deviceProgress?.bytesWritten)}
                      />
                      <Meta label="File size" value={formatBytes(job?.filesize)} />
                      <Meta label="Percent" value={`${percent}%`} />
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.errorBox}>
                  <Ionicons name="warning-outline" size={17} color={Colors.danger} />
                  <Text style={styles.errorText}>{error ?? 'The download could not be completed.'}</Text>
                </View>
              )}

              {isSuccess ? (
                <View style={styles.resultBox}>
                  <View style={styles.resultRow}>
                    <Ionicons name="document-text-outline" size={15} color={Colors.textMuted} />
                    <Text style={styles.resultLabel}>File</Text>
                    <Text style={styles.resultValue} numberOfLines={1}>
                      {job?.filename ?? 'TubeFlow download'}
                    </Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Ionicons name="folder-open-outline" size={15} color={Colors.textMuted} />
                    <Text style={styles.resultLabel}>Saved</Text>
                    <Text style={styles.resultValue} numberOfLines={2}>
                      {result?.locationLabel ?? 'On your device'}
                    </Text>
                  </View>
                </View>
              ) : null}

              {phase === 'saving' ? (
                <Text style={styles.footNote}>
                  Keep TubeFlow open until the file finishes saving.
                </Text>
              ) : null}

              {canCancel ? (
                <PressableScale onPress={onCancel} scaleTo={0.97} containerStyle={styles.fullButton}>
                  <View style={styles.cancelButton}>
                    <Ionicons name="close-circle-outline" size={17} color={Colors.danger} />
                    <Text style={styles.cancelText}>Cancel download</Text>
                  </View>
                </PressableScale>
              ) : null}

              {isError ? (
                <View style={styles.actionRow}>
                  <PressableScale onPress={onRetry} scaleTo={0.97} containerStyle={styles.flex}>
                    <LinearGradient colors={Gradients.brand} style={styles.primaryButton}>
                      <Ionicons name="refresh" size={17} color={Colors.white} />
                      <Text style={styles.primaryText}>Try again</Text>
                    </LinearGradient>
                  </PressableScale>
                  <PressableScale onPress={onClose} scaleTo={0.97} containerStyle={styles.flex}>
                    <View style={styles.secondaryButton}>
                      <Text style={styles.secondaryText}>Close</Text>
                    </View>
                  </PressableScale>
                </View>
              ) : null}

              {isSuccess ? (
                <>
                  <View style={styles.actionRow}>
                    <PressableScale onPress={onOpen} scaleTo={0.97} containerStyle={styles.flex}>
                      <View style={styles.secondaryButton}>
                        <Ionicons name="play-outline" size={17} color={Colors.text} />
                        <Text style={styles.secondaryText}>Open</Text>
                      </View>
                    </PressableScale>
                    <PressableScale onPress={onShare} scaleTo={0.97} containerStyle={styles.flex}>
                      <View style={styles.secondaryButton}>
                        <Ionicons name="share-social-outline" size={17} color={Colors.text} />
                        <Text style={styles.secondaryText}>Share</Text>
                      </View>
                    </PressableScale>
                  </View>
                  <PressableScale onPress={onClose} scaleTo={0.97} containerStyle={styles.fullButton}>
                    <LinearGradient colors={Gradients.brand} style={styles.primaryButton}>
                      <Ionicons name="checkmark" size={18} color={Colors.white} />
                      <Text style={styles.primaryText}>Done</Text>
                    </LinearGradient>
                  </PressableScale>
                </>
              ) : null}
            </GlassCard>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3,3,9,0.72)',
  },
  sheetWrap: {
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 14,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconStage: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headline: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    letterSpacing: -0.3,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  chipGreen: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.3)',
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10.5,
    color: Colors.textSecondary,
  },
  chipTextGreen: {
    color: Colors.green,
  },
  progressSection: {
    gap: 9,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  percent: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.white,
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  meta: {
    flex: 1,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metaLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  metaValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: Colors.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251,113,133,0.09)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,113,133,0.26)',
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.rose,
  },
  resultBox: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  resultLabel: {
    width: 44,
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  resultValue: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  resultDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  footNote: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  fullButton: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 9,
  },
  flex: {
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(251,113,133,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.24)',
  },
  cancelText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.danger,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  primaryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.text,
  },
});
