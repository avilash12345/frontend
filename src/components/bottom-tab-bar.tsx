import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { GlassCard } from '@/components/glass-card';
import { PressableScale } from '@/components/pressable-scale';
import { Colors, Fonts, Layout } from '@/constants/theme';

const TAB_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  library: { label: 'Library', icon: 'albums-outline', iconActive: 'albums' },
};

function TabItem({
  label,
  icon,
  iconActive,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      haptic={!active}
      containerStyle={styles.itemWrap}
      style={styles.item}>
      <Animated.View style={[styles.pill, pillStyle]}>
        <LinearGradient
          colors={['rgba(139,92,246,0.34)', 'rgba(244,63,125,0.24)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
        />
      </Animated.View>
      <Ionicons
        name={active ? iconActive : icon}
        size={20}
        color={active ? Colors.white : Colors.textMuted}
      />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </PressableScale>
  );
}

export function BottomTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <GlassCard style={styles.bar} radius={24} intensity={30} tintColor="rgba(18,18,30,0.82)">
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const meta = TAB_META[route.name] ?? {
              label: route.name,
              icon: 'ellipse-outline' as const,
              iconActive: 'ellipse' as const,
            };
            const options = descriptors[route.key]?.options;

            return (
              <TabItem
                key={route.key}
                label={typeof options?.tabBarLabel === 'string' ? options.tabBarLabel : meta.label}
                icon={meta.icon}
                iconActive={meta.iconActive}
                active={isFocused}
                onPress={() => {
                  const event = emitter.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigateToTab(route.key);
                  }
                }}
              />
            );
          })}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Layout.screenPadding,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    height: Layout.tabBarHeight,
    borderRadius: 24,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  itemWrap: {
    flex: 1,
  },
  item: {
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    position: 'absolute',
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  labelActive: {
    color: Colors.white,
    fontFamily: Fonts.bodySemiBold,
  },
});
