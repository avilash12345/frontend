import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router/js-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { SplashProvider } from '@/components/splash-provider';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Load the icon font with the app fonts so `@expo/vector-icons` never has to
    // fetch it lazily when an icon first renders. On web that lazy fetch can
    // time out (expo-font has a 12s limit) and leaves icons blank.
    ...Ionicons.font,
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setAppReady(true));
  }, [fontError, fontsLoaded]);

  if (!appReady) return null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SplashProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: 'transparent' },
            tabBarHideOnKeyboard: true,
          }}
          tabBar={(props) => <BottomTabBar {...props} />}>
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="library" options={{ title: 'Library' }} />
        </Tabs>
      </SplashProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
