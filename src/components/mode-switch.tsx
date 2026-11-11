import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Fonts, Gradients } from '@/constants/theme';
import type { DownloadKind } from '@/types/youtube';

type ModeSwitchProps = {
  value: DownloadKind;
  onChange: (value: DownloadKind) => void;
  disabled?: boolean;
};

const OPTIONS: {
  value: DownloadKind;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
}[] = [
  { value: 'video', label: 'Video', icon: 'videocam', gradient: Gradients.video },
  { value: 'audio', label: 'Audio', icon: 'musical-notes', gradient: Gradients.audio },
];

export function ModeSwitch({ value, onChange, disabled }: ModeSwitchProps) {
  const [width, setWidth] = useState(0);
  const slide = useSharedValue(value === 'video' ? 0 : 1);
  const activeIndex = value === 'video' ? 0 : 1;

  useEffect(() => {
    slide.value = withSpring(activeIndex, { damping: 20, stiffness: 190, mass: 0.8 });
  }, [activeIndex, slide]);

  const segmentWidth = Math.max(0, (width - 8) / 2);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * segmentWidth }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.track} onLayout={onLayout}>
      {segmentWidth > 0 ? (
        <Animated.View style={[styles.pill, { width: segmentWidth }, pillStyle]}>
          <LinearGradient
            colors={[
              activeIndex === 0 ? 'rgba(244,63,125,0.90)' : 'rgba(34,211,238,0.90)',
              activeIndex === 0 ? 'rgba(139,92,246,0.90)' : 'rgba(99,102,241,0.90)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pillHighlight]} />
        </Animated.View>
      ) : null}

      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            disabled={disabled}
            onPress={() => {
              if (option.value === value) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.segment,
              pressed && !disabled && styles.segmentPressed,
              disabled && styles.segmentDisabled,
            ]}>
            <Ionicons
              name={option.icon}
              size={16}
              color={active ? Colors.white : Colors.textMuted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  pill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D946EF',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  pillHighlight: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 16,
  },
  segmentPressed: {
    opacity: 0.85,
  },
  segmentDisabled: {
    opacity: 0.55,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: Colors.textMuted,
  },
  labelActive: {
    color: Colors.white,
    fontFamily: Fonts.bodySemiBold,
  },
});
