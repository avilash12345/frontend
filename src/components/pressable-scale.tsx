import * as Haptics from 'expo-haptics';
import { type PropsWithChildren } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type PressableScaleProps = PropsWithChildren<
  PressableProps & {
    containerStyle?: StyleProp<ViewStyle>;
    scaleTo?: number;
    haptic?: boolean;
  }
>;

export function PressableScale({
  children,
  containerStyle,
  scaleTo = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={(event) => {
          if (!disabled) {
            scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
            if (haptic) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = withSpring(1, { damping: 16, stiffness: 260 });
          onPressOut?.(event);
        }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
