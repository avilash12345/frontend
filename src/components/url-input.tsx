import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, Fonts, Gradients, Radius } from '@/constants/theme';
import { extractYouTubeUrl } from '@/lib/format';

type UrlInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  onNotice?: (message: string, type: 'info' | 'error') => void;
};

export function UrlInput({
  value,
  onChangeText,
  onSubmit,
  loading,
  disabled,
  onNotice,
}: UrlInputProps) {
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focus, focused]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      ['rgba(255,255,255,0.10)', 'rgba(244,63,125,0.55)'],
    ),
  }));

  const canSubmit = Boolean(value.trim()) && !loading && !disabled;

  async function handlePaste() {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text?.trim()) {
        onNotice?.('Your clipboard is empty.', 'info');
        return;
      }
      const link = extractYouTubeUrl(text) ?? text.trim();
      onChangeText(link);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      onNotice?.('Clipboard access was blocked by the browser.', 'error');
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>YOUTUBE LINK</Text>
        <View style={styles.labelHintRow}>
          <Ionicons name="shield-checkmark" size={11} color={Colors.green} />
          <Text style={styles.labelHint}>No sign-in needed</Text>
        </View>
      </View>

      <Animated.View style={[styles.inputShell, borderStyle]}>
        <LinearGradient
          colors={['rgba(244,63,125,0.22)', 'rgba(139,92,246,0.18)']}
          style={styles.inputIcon}>
          <Ionicons name="logo-youtube" size={19} color={Colors.white} />
        </LinearGradient>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={() => canSubmit && onSubmit()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste a link or video ID"
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.pink}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardType="url"
          returnKeyType="go"
          editable={!disabled}
          style={styles.input}
          accessibilityLabel="YouTube video URL"
        />

        {value.length > 0 ? (
          <PressableScale
            onPress={() => onChangeText('')}
            hitSlop={8}
            scaleTo={0.88}
            haptic={false}
            containerStyle={styles.clearWrap}>
            <View style={styles.clear}>
              <Ionicons name="close" size={14} color={Colors.textSecondary} />
            </View>
          </PressableScale>
        ) : null}

        <PressableScale
          onPress={handlePaste}
          scaleTo={0.93}
          hitSlop={6}
          containerStyle={styles.pasteWrap}>
          <View style={styles.paste}>
            <Ionicons name="clipboard-outline" size={14} color={Colors.pink} />
            <Text style={styles.pasteText}>Paste</Text>
          </View>
        </PressableScale>
      </Animated.View>

      <PressableScale
        onPress={onSubmit}
        disabled={!canSubmit}
        scaleTo={0.975}
        containerStyle={[styles.ctaWrap, !canSubmit && styles.ctaDisabled]}>
        <LinearGradient
          colors={Gradients.video}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}>
          {loading ? (
            <>
              <ActivityIndicator size="small" color={Colors.white} />
              <Text style={styles.ctaText}>Reading video…</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={17} color={Colors.white} />
              <Text style={styles.ctaText}>Fetch video</Text>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={16} color={Colors.white} />
              </View>
            </>
          )}
        </LinearGradient>
      </PressableScale>

      <View style={styles.hintRow}>
        <Ionicons name="link" size={11} color={Colors.textMuted} />
        <Text style={styles.hint}>Works with videos, Shorts, live links and youtu.be</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.7,
    color: Colors.textSecondary,
  },
  labelHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  labelHint: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: Colors.textMuted,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 7,
    minHeight: 58,
    borderRadius: Radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(16,16,26,0.86)',
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14.5,
    color: Colors.text,
  },
  clearWrap: {
    marginRight: 2,
  },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pasteWrap: {
    marginRight: 1,
  },
  paste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: Colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,63,125,0.28)',
  },
  pasteText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: Colors.pink,
  },
  ctaWrap: {
    borderRadius: Radius.md,
    shadowColor: '#D946EF',
    shadowOpacity: 0.36,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  cta: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
    overflow: 'hidden',
  },
  ctaText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    letterSpacing: -0.1,
    color: Colors.white,
  },
  ctaArrow: {
    position: 'absolute',
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 3,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
});
