import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type OrbProps = {
  colors: readonly [string, string, ...string[]];
  size: number;
  top: number;
  left: number;
  duration: number;
  driftX: number;
  driftY: number;
  opacity: number;
};

function Orb({ colors, size, top, left, duration, driftX, driftY, opacity }: OrbProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [duration, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * driftX },
      { translateY: progress.value * driftY },
      { scale: 0.92 + progress.value * 0.18 },
    ],
    opacity: opacity * (0.75 + progress.value * 0.25),
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2, top, left, opacity },
        style,
      ]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.9, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      />
    </Animated.View>
  );
}

export function AmbientBackground({ variant = 'video' }: { variant?: 'video' | 'audio' }) {
  const { width, height } = useWindowDimensions();
  const isAudio = variant === 'audio';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#0B0B18', '#07070F', '#05050C']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Orb
        colors={isAudio ? ['#0E7490', '#4F46E5', 'transparent'] : ['#6D28D9', '#BE185D', 'transparent']}
        size={Math.max(width, 420) * 0.95}
        top={-130}
        left={-120}
        duration={11_000}
        driftX={70}
        driftY={40}
        opacity={0.42}
      />
      <Orb
        colors={isAudio ? ['#0891B2', '#1D4ED8', 'transparent'] : ['#BE185D', '#7C3AED', 'transparent']}
        size={Math.max(width, 380) * 0.8}
        top={height * 0.42}
        left={width * 0.42}
        duration={14_000}
        driftX={-60}
        driftY={70}
        opacity={0.3}
      />
      <Orb
        colors={['#2563EB', '#0E7490', 'transparent']}
        size={300}
        top={height * 0.7}
        left={-100}
        duration={17_000}
        driftX={80}
        driftY={-50}
        opacity={0.18}
      />
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
  vignette: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(4,4,10,0.22)',
  },
});
