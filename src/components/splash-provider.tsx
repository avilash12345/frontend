import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedSplash } from '@/components/animated-splash';
import { Colors } from '@/constants/theme';

export function SplashProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 320);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      {children}
      {visible ? <AnimatedSplash ready={ready} onFinish={() => setVisible(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
