import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, Fonts, Gradients } from '@/constants/theme';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'default' | 'danger';
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'default',
}: EmptyStateProps) {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 + float.value * 9 }],
  }));

  const accentColors = tone === 'danger' ? Gradients.danger : Gradients.brand;

  return (
    <Animated.View entering={FadeInDown.duration(420).springify().damping(18)} style={styles.root}>
      <View style={styles.stage}>
        <Animated.View style={[styles.halo, floatStyle]}>
          <LinearGradient
            colors={[
              tone === 'danger' ? 'rgba(251,113,133,0.30)' : 'rgba(139,92,246,0.30)',
              'rgba(244,63,125,0.10)',
              'transparent',
            ]}
            style={styles.haloFill}
          />
        </Animated.View>
        <LinearGradient
          colors={accentColors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBubble}>
          <Ionicons name={icon} size={28} color={Colors.white} />
        </LinearGradient>
      </View>

      <Animated.View entering={FadeIn.delay(120).duration(320)} style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </Animated.View>

      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} containerStyle={styles.actionWrap} scaleTo={0.96}>
          <View style={styles.action}>
            <Text style={styles.actionText}>{actionLabel}</Text>
            <Ionicons name="arrow-forward" size={15} color={Colors.white} />
          </View>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 18,
  },
  stage: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 122,
    height: 122,
    borderRadius: 61,
    overflow: 'hidden',
  },
  haloFill: {
    flex: 1,
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
    shadowColor: '#F43F7D',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  copy: {
    alignItems: 'center',
    gap: 7,
    maxWidth: 320,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  actionWrap: {
    minWidth: 180,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.white,
  },
});
