import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Fonts } from '@/constants/theme';

const { width } = Dimensions.get('window');

type AnimatedSplashProps = {
  ready: boolean;
  onFinish: () => void;
};

export function AnimatedSplash({ ready, onFinish }: AnimatedSplashProps) {
  const overlay = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.62);
  const glow = useSharedValue(0.35);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(18);
  const taglineOpacity = useSharedValue(0);
  const progress = useSharedValue(0.05);
  const ring = useSharedValue(0.4);

  useEffect(() => {
    if (!ready) return;

    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    logoScale.value = withSpring(1, { damping: 13, stiffness: 130, mass: 0.9 });
    glow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    ring.value = withRepeat(
      withTiming(1.35, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 650 }));
    titleY.value = withDelay(300, withTiming(0, { duration: 650, easing: Easing.out(Easing.cubic) }));
    taglineOpacity.value = withDelay(650, withTiming(1, { duration: 600 }));
    progress.value = withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.cubic) });

    const fadeTimer = setTimeout(() => {
      overlay.value = withTiming(0, { duration: 480, easing: Easing.in(Easing.quad) });
    }, 2050);
    const finishTimer = setTimeout(onFinish, 2550);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [
    glow,
    logoOpacity,
    logoScale,
    onFinish,
    overlay,
    progress,
    ready,
    ring,
    taglineOpacity,
    titleOpacity,
    titleY,
  ]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + glow.value * 0.34,
    transform: [{ scale: 0.94 + glow.value * 0.16 }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.35 - (ring.value - 0.4) * 0.4,
    transform: [{ scale: ring.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <LinearGradient
        colors={['#120B24', '#07070F', '#04040A']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(139,92,246,0.35)', 'rgba(244,63,125,0.14)', 'transparent']}
        style={styles.topGlow}
      />

      <View style={styles.center}>
        <View style={styles.logoStage}>
          <Animated.View
            style={[
              styles.glow,
              { width: width * 0.72, height: width * 0.72, borderRadius: width * 0.36 },
              glowStyle,
            ]}>
            <LinearGradient
              colors={['rgba(139,92,246,0.55)', 'rgba(244,63,125,0.35)', 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: width * 0.36 }]}
            />
          </Animated.View>
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={logoStyle}>
            <Image
              source={require('@/assets/images/brand-mark.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.titleWrap, titleStyle]}>
          <Text style={styles.title}>
            Tube<Text style={styles.titleAccent}>Flow</Text>
          </Text>
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>YOUTUBE DOWNLOADER</Text>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Download anything. Keep everything.
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <Animated.View style={[styles.progress, progressStyle]}>
            <LinearGradient
              colors={['#8B5CF6', '#D946EF', '#F43F7D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.footerText}>VIDEO · AUDIO · 4K · OFFLINE</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: -width * 0.4,
    left: -width * 0.2,
    width: width * 1.4,
    height: width * 1.1,
    borderRadius: width,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  logoStage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  glow: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: 'rgba(244,63,125,0.5)',
  },
  logo: {
    width: 118,
    height: 118,
    borderRadius: 32,
  },
  titleWrap: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 46,
    letterSpacing: -1.8,
    color: Colors.white,
  },
  titleAccent: {
    color: Colors.pink,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  pillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.8,
    color: Colors.textSecondary,
  },
  tagline: {
    marginTop: 22,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    width: '62%',
    alignItems: 'center',
    gap: 14,
  },
  track: {
    width: '100%',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  footerText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.32)',
  },
});
