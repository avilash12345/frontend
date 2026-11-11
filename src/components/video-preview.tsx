import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/components/glass-card';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { thumbnailUrl } from '@/lib/api';
import {
  formatCompactNumber,
  formatDuration,
  formatUploadDate,
} from '@/lib/format';
import type { VideoInfo } from '@/types/youtube';

type VideoPreviewProps = {
  info: VideoInfo;
};

export function VideoPreview({ info }: VideoPreviewProps) {
  const [failed, setFailed] = useState(false);
  const thumb = thumbnailUrl(info.thumbnail);
  const views = formatCompactNumber(info.view_count);
  const uploadDate = formatUploadDate(info.upload_date);

  return (
    <Animated.View entering={FadeInDown.duration(420).springify().damping(18)}>
      <GlassCard style={styles.card} radius={Radius.xl} intensity={26}>
        <View style={styles.thumbWrap}>
          {thumb && !failed ? (
            <Image
              source={{ uri: thumb }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={350}
              onError={() => setFailed(true)}
            />
          ) : (
            <LinearGradient
              colors={['#2A1240', '#3B1030', '#120B24']}
              style={StyleSheet.absoluteFill}
            />
          )}

          <LinearGradient
            colors={['transparent', 'rgba(7,7,15,0.82)']}
            locations={[0.35, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.thumbTop}>
            <View style={styles.readyPill}>
              <View style={styles.readyDot} />
              <Text style={styles.readyText}>READY</Text>
            </View>
            {info.is_live ? (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.thumbBottom}>
            <View style={styles.durationPill}>
              <Ionicons name="time-outline" size={12} color={Colors.white} />
              <Text style={styles.durationText}>{formatDuration(info.duration)}</Text>
            </View>
            <View style={styles.sourcePill}>
              <Ionicons name="logo-youtube" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.sourceText}>YouTube</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {info.title}
          </Text>

          <View style={styles.authorRow}>
            <LinearGradient
              colors={['rgba(244,63,125,0.9)', 'rgba(139,92,246,0.9)']}
              style={styles.avatar}>
              <Text style={styles.avatarText}>{info.author.slice(0, 1).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.authorCopy}>
              <Text style={styles.author} numberOfLines={1}>
                {info.author}
              </Text>
              <Text style={styles.authorMeta} numberOfLines={1}>
                {[views ? `${views} views` : null, uploadDate].filter(Boolean).join(' · ') ||
                  'YouTube'}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#120B24',
    overflow: 'hidden',
  },
  thumbTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(6,6,14,0.66)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  readyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  readyText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 8.5,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.82)',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(244,63,125,0.9)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  liveText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 8.5,
    letterSpacing: 1.4,
    color: Colors.white,
  },
  thumbBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(4,4,10,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  durationText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10.5,
    color: Colors.white,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.7)',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 17.5,
    lineHeight: 23,
    letterSpacing: -0.35,
    color: Colors.text,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    color: Colors.white,
  },
  authorCopy: {
    flex: 1,
    minWidth: 0,
  },
  author: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.textSecondary,
  },
  authorMeta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
