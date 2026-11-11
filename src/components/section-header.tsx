import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function SectionHeader({ title, hint, actionLabel, onAction, icon }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        {icon ? <Ionicons name={icon} size={16} color={Colors.pink} /> : null}
        <Text style={styles.title}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    letterSpacing: -0.2,
    color: Colors.text,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  action: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.pink,
  },
});
