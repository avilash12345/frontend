import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { SectionHeader } from '@/components/section-header';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { formatAbr, formatBytes } from '@/lib/format';
import type {
  AudioFormat,
  DownloadKind,
  VideoFormat,
} from '@/types/youtube';

type QualitySelectorProps = {
  kind: DownloadKind;
  videoFormats: VideoFormat[];
  audioFormats: AudioFormat[];
  selectedHeight: number | null;
  selectedAudioId: string | null;
  onSelectHeight: (height: number) => void;
  onSelectAudio: (id: string) => void;
  disabled?: boolean;
};

const GAP = 10;

function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radio, selected && styles.radioActive]}>
      {selected ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

function Badge({ label, tone = 'brand' }: { label: string; tone?: 'brand' | 'green' }) {
  return (
    <View style={[styles.badge, tone === 'green' && styles.badgeGreen]}>
      <Text style={[styles.badgeText, tone === 'green' && styles.badgeTextGreen]}>{label}</Text>
    </View>
  );
}

export function QualitySelector({
  kind,
  videoFormats,
  audioFormats,
  selectedHeight,
  selectedAudioId,
  onSelectHeight,
  onSelectAudio,
  disabled,
}: QualitySelectorProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const columns = gridWidth >= 560 ? 3 : 2;
  const cardWidth = gridWidth > 0 ? (gridWidth - GAP * (columns - 1)) / columns : undefined;

  const onGridLayout = (event: LayoutChangeEvent) => {
    setGridWidth(event.nativeEvent.layout.width);
  };

  const isVideo = kind === 'video';
  const selectedVideo = videoFormats.find((format) => format.height === selectedHeight) ?? null;
  const selectedAudio = audioFormats.find((format) => format.id === selectedAudioId) ?? null;

  const hint = isVideo
    ? `${videoFormats.length} resolution${videoFormats.length === 1 ? '' : 's'}`
    : `${audioFormats.length} format${audioFormats.length === 1 ? '' : 's'}`;

  return (
    <View style={styles.root}>
      <SectionHeader
        title={isVideo ? 'Choose quality' : 'Choose audio format'}
        hint={hint}
        icon={isVideo ? 'videocam-outline' : 'musical-notes-outline'}
      />

      <View style={styles.grid} onLayout={onGridLayout}>
        {isVideo
          ? videoFormats.map((format, index) => {
              const selected = format.height === selectedHeight;
              return (
                <PressableScale
                  key={`${format.height}-${format.container}`}
                  onPress={() => onSelectHeight(format.height)}
                  disabled={disabled}
                  scaleTo={0.97}
                  haptic={!selected}
                  containerStyle={cardWidth ? { width: cardWidth } : styles.cardFallback}>
                  <View style={[styles.card, selected && styles.cardSelected]}>
                    {selected ? (
                      <LinearGradient
                        colors={['rgba(139,92,246,0.30)', 'rgba(244,63,125,0.10)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: Radius.lg }]}
                      />
                    ) : null}

                    <View style={styles.cardTop}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
                          {format.label}
                        </Text>
                        {index === 0 ? <Badge label="BEST" /> : null}
                      </View>
                      <Radio selected={selected} />
                    </View>

                    <Text style={styles.cardQuality}>
                      {format.quality} · {format.container.toUpperCase()}
                    </Text>

                    <View style={styles.cardMeta}>
                      <Text style={styles.cardMetaText}>{formatBytes(format.filesize)}</Text>
                      {format.fps ? (
                        <Text style={styles.cardMetaText}>{format.fps} fps</Text>
                      ) : null}
                    </View>
                  </View>
                </PressableScale>
              );
            })
          : audioFormats.map((format) => {
              const selected = format.id === selectedAudioId;
              return (
                <PressableScale
                  key={format.id}
                  onPress={() => onSelectAudio(format.id)}
                  disabled={disabled}
                  scaleTo={0.97}
                  haptic={!selected}
                  containerStyle={cardWidth ? { width: cardWidth } : styles.cardFallback}>
                  <View style={[styles.card, styles.audioCard, selected && styles.cardSelected]}>
                    {selected ? (
                      <LinearGradient
                        colors={['rgba(34,211,238,0.24)', 'rgba(99,102,241,0.12)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: Radius.lg }]}
                      />
                    ) : null}

                    <View style={styles.cardTop}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
                          {format.label}
                        </Text>
                        {format.recommended ? <Badge label="TOP" tone="green" /> : null}
                      </View>
                      <Radio selected={selected} />
                    </View>

                    <Text style={styles.audioDescription} numberOfLines={2}>
                      {format.description}
                    </Text>

                    <View style={styles.cardMeta}>
                      {format.abr ? (
                        <Text style={styles.cardMetaText}>{formatAbr(format.abr)}</Text>
                      ) : null}
                      <Text style={styles.cardMetaText}>{formatBytes(format.filesize)}</Text>
                    </View>
                  </View>
                </PressableScale>
              );
            })}
      </View>

      {isVideo && selectedVideo?.needs_merge ? (
        <View style={styles.note}>
          <Ionicons name="git-merge-outline" size={13} color={Colors.violet} />
          <Text style={styles.noteText}>
            Video and audio are merged on the server for the best quality.
          </Text>
        </View>
      ) : null}

      {!isVideo && selectedAudio?.converted ? (
        <View style={styles.note}>
          <Ionicons name="swap-horizontal" size={13} color={Colors.cyan} />
          <Text style={styles.noteText}>{selectedAudio.description}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    minHeight: 80,
  },
  cardFallback: {
    width: '48%',
  },
  card: {
    minHeight: 104,
    padding: 13,
    borderRadius: Radius.lg,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  audioCard: {
    minHeight: 112,
  },
  cardSelected: {
    borderColor: 'rgba(244,63,125,0.55)',
    backgroundColor: 'rgba(244,63,125,0.06)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  cardLabel: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    letterSpacing: -0.5,
    color: Colors.text,
  },
  cardLabelSelected: {
    color: Colors.white,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.pink,
    backgroundColor: 'rgba(244,63,125,0.18)',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.pink,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(244,63,125,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,63,125,0.35)',
  },
  badgeGreen: {
    backgroundColor: 'rgba(52,211,153,0.14)',
    borderColor: 'rgba(52,211,153,0.35)',
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 7.5,
    letterSpacing: 0.9,
    color: Colors.pink,
  },
  badgeTextGreen: {
    color: Colors.green,
  },
  cardQuality: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  audioDescription: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardMetaText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10.5,
    color: Colors.textMuted,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  noteText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
  },
});
