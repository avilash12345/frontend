import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { GlassCard } from '@/components/glass-card';
import { Colors, Fonts, Layout } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'info';

type ToastProps = {
  message: string | null;
  type?: ToastType;
  onHide: () => void;
  bottomOffset?: number;
};

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const COLORS: Record<ToastType, string> = {
  success: Colors.green,
  error: Colors.danger,
  info: Colors.cyan,
};

export function Toast({ message, type = 'info', onHide, bottomOffset = 96 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, 3400);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(240).springify().damping(18)}
      exiting={FadeOutDown.duration(180)}
      pointerEvents="none"
      style={[styles.wrapper, { bottom: bottomOffset }]}>
      <GlassCard style={styles.toast} radius={16} intensity={34} tintColor="rgba(18,18,30,0.94)">
        <View style={styles.content}>
          <Ionicons name={ICONS[type]} size={20} color={COLORS[type]} />
          <Text style={styles.text}>{message}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Layout.screenPadding,
    right: Layout.screenPadding,
    alignItems: 'center',
    zIndex: 500,
  },
  toast: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  text: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.text,
  },
});
