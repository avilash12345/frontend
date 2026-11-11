import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, Fonts, Gradients, Radius } from '@/constants/theme';
import { thumbnailUrl } from '@/lib/api';
import { formatBytes, formatRelativeTime } from '@/lib/format';
import type { HistoryItem } from '@/types/youtube';

type HistoryRowProps = {
  item: HistoryItem;
  onPress?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  index?: number;
};

export function HistoryRow({
  item,
  onPress,
  onShare,
  onDelete,
  compact,
  index = 0,
}: HistoryRowProps) {
  const [failed, setFailed] = useState(false);
  const thumb = thumbnailUrl(item.thumbnail);
  const accent = item.kind === 'video' ? Gradients.video : Gradients.audio;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(360).springify().damping(20)}>
      <View style={styles.row}>
        <PressableScale
          onPress={onPress}
          disabled={!onPress}
          scaleTo={0.985}
          containerStyle={styles.main}>
          <View style={styles.mainInner}>
            <View style={styles.thumb}>
              {thumb && !failed ? (
                <Image
                  source={{ uri: thumb }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={250}
                  onError={() => setFailed(true)}
                />
              ) : (
                <LinearGradient
                  colors={['rgba(139,92,246,0.4)', 'rgba(244,63,125,0.2)']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(4,4,10,0.62)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.kindDot, { backgroundColor: accent[0] }]}>
                <Ionicons
                  name={item.kind === 'video' ? 'play' : 'musical-notes'}
                  size={9}
                  color={Colors.white}
                />
              </View>
            </View>

            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
                {item.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.quality} · {item.format.toUpperCase()} · {formatBytes(item.filesize)}
              </Text>
              {!compact ? (
                <View style={styles.foot}>
                  <Text style={styles.time}>{formatRelativeTime(item.savedAt)}</Text>
                  <View style={styles.savedTag}>
                    <Ionicons
                      name={item.savedToLibrary ? 'checkmark-circle' : 'folder-outline'}
                      size={10}
                      color={item.savedToLibrary ? Colors.green : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.savedText,
                        item.savedToLibrary && styles.savedTextActive,
                      ]}>
                      {item.savedToLibrary ? 'In your library' : 'In TubeFlow folder'}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </PressableScale>

        {onShare || onDelete ? (
          <View style={styles.actions}>
            {onShare ? (
              <PressableScale
                onPress={onShare}
                scaleTo={0.9}
                containerStyle={styles.actionWrap}>
                <View style={styles.action}>
                  <Ionicons name="share-social-outline" size={15} color={Colors.textSecondary} />
                </View>
              </PressableScale>
            ) : null}
            {onDelete ? (
              <PressableScale
                onPress={onDelete}
                scaleTo={0.9}
                containerStyle={styles.actionWrap}>
                <View style={styles.action}>
                  <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                </View>
              </PressableScale>
            ) : null}
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    paddingRight: 10,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  mainInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  thumb: {
    width: 74,
    height: 50,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,20,34,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  kindDot: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    width: 18,
    height: 18,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: Colors.text,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: Colors.textMuted,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 1,
  },
  time: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  savedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  savedText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9.5,
    color: Colors.textMuted,
  },
  savedTextActive: {
    color: Colors.green,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionWrap: {
    borderRadius: 11,
  },
  action: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
