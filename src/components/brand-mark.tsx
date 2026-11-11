import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type BrandMarkProps = {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
};

export function BrandMark({ size = 36, showWordmark = true, subtitle }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <Image
        source={require('@/assets/images/brand-mark.png')}
        style={{ width: size, height: size, borderRadius: size * 0.26 }}
        contentFit="contain"
        transition={200}
      />
      {showWordmark ? (
        <View>
          <Text style={[styles.wordmark, { fontSize: size * 0.52 }]}>
            Tube<Text style={styles.wordmarkAccent}>Flow</Text>
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: Fonts.display,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  wordmarkAccent: {
    color: Colors.pink,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.2,
    marginTop: 1,
  },
});
