import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

type GlassCardProps = ViewProps & {
  intensity?: number;
  radius?: number;
  borderColor?: string;
  tintColor?: string;
};

export function GlassCard({
  children,
  style,
  intensity = 24,
  radius = Radius.lg,
  borderColor = Colors.border,
  tintColor = 'rgba(18, 18, 30, 0.62)',
  ...rest
}: GlassCardProps) {
  return (
    <View
      {...rest}
      style={[
        styles.container,
        { borderRadius: radius, borderColor, backgroundColor: tintColor },
        style,
      ]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.highlight, { borderRadius: radius }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  highlight: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
});
