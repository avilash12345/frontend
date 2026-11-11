import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/ambient-background';
import { EmptyState } from '@/components/empty-state';
import { GlassCard } from '@/components/glass-card';
import { HistoryRow } from '@/components/history-row';
import { SectionHeader } from '@/components/section-header';
import { Skeleton } from '@/components/skeleton';
import { Toast, type ToastType } from '@/components/toast';
import { Colors, Fonts, Layout, Radius } from '@/constants/theme';
import { formatBytes, formatRelativeTime } from '@/lib/format';
import { clearHistory, loadHistory, removeHistory } from '@/lib/history';
import {
  deleteLocalFile,
  fileExists,
  mimeTypeFor,
  openLocalFile,
  shareLocalFile,
} from '@/lib/save';
import type { HistoryItem } from '@/types/youtube';

type Filter = 'all' | 'video' | 'audio';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: ToastType;
  } | null>(null);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const refresh = useCallback(async () => {
    const stored = await loadHistory();
    setItems(stored);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.kind === filter)),
    [filter, items],
  );

  const stats = useMemo(() => {
    const totalSize = items.reduce((sum, item) => sum + (item.filesize ?? 0), 0);
    return {
      totalSize,
      videos: items.filter((item) => item.kind === 'video').length,
      audio: items.filter((item) => item.kind === 'audio').length,
      last: items[0]?.savedAt ?? null,
    };
  }, [items]);

  const counts: Record<Filter, number> = {
    all: items.length,
    video: stats.videos,
    audio: stats.audio,
  };

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleOpen(item: HistoryItem) {
    const uri = item.localUri ?? item.remoteUrl;
    if (!uri) {
      notify('That file is no longer available.', 'error');
      return;
    }
    if (item.localUri && !(await fileExists(item.localUri))) {
      notify('That file is no longer on this device.', 'error');
      return;
    }
    try {
      await openLocalFile(uri, mimeTypeFor(item.filename, item.kind));
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not open this file.', 'error');
    }
  }

  async function handleShare(item: HistoryItem) {
    const uri = item.localUri ?? item.remoteUrl;
    if (!uri) {
      notify('That file is no longer available.', 'error');
      return;
    }
    try {
      await shareLocalFile(uri, mimeTypeFor(item.filename, item.kind));
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not share this file.', 'error');
    }
  }

  function handleRemove(item: HistoryItem) {
    Alert.alert('Remove from library?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setItems((current) => current.filter((entry) => entry.id !== item.id));
          await removeHistory(item.id);
          await deleteLocalFile(item.localUri);
          notify('Removed from your library.', 'info');
        },
      },
    ]);
  }

  function handleClearAll() {
    Alert.alert(
      'Clear your library?',
      'Every download will be removed from this list and TubeFlow files will be deleted from this device. Copies in your gallery stay untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            await Promise.all(items.map((item) => deleteLocalFile(item.localUri)));
            await clearHistory();
            setItems([]);
            setFilter('all');
            notify('Library cleared.', 'success');
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <AmbientBackground variant="audio" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.pink}
              colors={[Colors.pink]}
              progressBackgroundColor={Colors.surfaceElevated}
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Layout.tabBarHeight + insets.bottom + 44 },
          ]}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
                <Text style={styles.title}>Library</Text>
              </View>
              {items.length > 0 ? (
                <Pressable
                  onPress={handleClearAll}
                  style={({ pressed }) => [styles.clear, pressed && styles.pressed]}>
                  <Ionicons name="trash-outline" size={15} color={Colors.rose} />
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            <Animated.View entering={FadeInDown.duration(420).springify().damping(18)}>
              <GlassCard
                style={styles.statsCard}
                radius={Radius.xxl}
                intensity={28}
                borderColor="rgba(255,255,255,0.12)">
                <LinearGradient
                  colors={['rgba(139,92,246,0.22)', 'rgba(244,63,125,0.06)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.statsTop}>
                  <View style={styles.statsCopy}>
                    <Text style={styles.statsLabel}>TOTAL SAVED</Text>
                    <Text style={styles.statsValue}>{formatBytes(stats.totalSize)}</Text>
                    <Text style={styles.statsHint}>
                      {items.length} {items.length === 1 ? 'download' : 'downloads'} on this device
                    </Text>
                  </View>
                  <View style={styles.statsIcon}>
                    <Ionicons name="cloud-done" size={26} color={Colors.white} />
                  </View>
                </View>

                <View style={styles.statsDivider} />

                <View style={styles.statsRow}>
                  <Stat icon="videocam" label="Videos" value={String(stats.videos)} />
                  <View style={styles.statDivider} />
                  <Stat icon="musical-notes" label="Audio" value={String(stats.audio)} />
                  <View style={styles.statDivider} />
                  <Stat
                    icon="time"
                    label="Last saved"
                    value={stats.last ? formatRelativeTime(stats.last) : '—'}
                  />
                </View>
              </GlassCard>
            </Animated.View>

            <View style={styles.filters}>
              {FILTERS.map((entry) => {
                const active = filter === entry.id;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => setFilter(entry.id)}
                    style={({ pressed }) => [
                      styles.filter,
                      active && styles.filterActive,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {entry.label}
                    </Text>
                    <View style={[styles.filterCount, active && styles.filterCountActive]}>
                      <Text
                        style={[
                          styles.filterCountText,
                          active && styles.filterCountTextActive,
                        ]}>
                        {counts[entry.id]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {loading ? (
              <View style={styles.list}>
                {[0, 1, 2, 3].map((index) => (
                  <View key={index} style={styles.skeletonRow}>
                    <Skeleton width={74} height={50} radius={11} />
                    <View style={styles.skeletonCopy}>
                      <Skeleton width="92%" height={13} />
                      <Skeleton width="62%" height={10} />
                      <Skeleton width="40%" height={9} />
                    </View>
                  </View>
                ))}
              </View>
            ) : filtered.length === 0 ? (
              <GlassCard style={styles.emptyCard} radius={Radius.xl} intensity={18}>
                {items.length === 0 ? (
                  <EmptyState
                    icon="albums-outline"
                    title="Your library is empty"
                    description="Downloads you keep will live here — ready to open, share or watch offline."
                    actionLabel="Find something to download"
                    onAction={() => router.navigate('/')}
                  />
                ) : (
                  <EmptyState
                    icon={filter === 'video' ? 'videocam-outline' : 'musical-notes-outline'}
                    title={`No ${filter === 'video' ? 'videos' : 'audio'} yet`}
                    description="Try a different filter to see the rest of your collection."
                    actionLabel="Show everything"
                    onAction={() => setFilter('all')}
                  />
                )}
              </GlassCard>
            ) : (
              <View style={styles.section}>
                <SectionHeader
                  title={filter === 'all' ? 'All downloads' : filter === 'video' ? 'Videos' : 'Audio'}
                  hint={`${filtered.length} item${filtered.length === 1 ? '' : 's'}`}
                  icon="folder-open-outline"
                />
                <View style={styles.list}>
                  {filtered.map((item, index) => (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      index={index}
                      onPress={() => handleOpen(item)}
                      onShare={() => handleShare(item)}
                      onDelete={() => handleRemove(item)}
                    />
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.footerNote}>
              Tap a download to open it · Files stay on your device
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Toast
        key={toast?.id}
        message={toast?.message ?? null}
        type={toast?.type ?? 'info'}
        onHide={() => setToast(null)}
        bottomOffset={Layout.tabBarHeight + insets.bottom + 22}
      />
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabelRow}>
        <Ionicons name={icon} size={11} color={Colors.textMuted} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 12,
  },
  content: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    gap: 4,
  },
  eyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9.5,
    letterSpacing: 2.1,
    color: Colors.cyan,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 34,
    letterSpacing: -1.3,
    color: Colors.text,
  },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(251,113,133,0.09)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,113,133,0.24)',
    marginBottom: 4,
  },
  clearText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: Colors.rose,
  },
  pressed: {
    opacity: 0.65,
  },
  statsCard: {
    padding: 17,
    gap: 14,
  },
  statsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsCopy: {
    flex: 1,
    gap: 3,
  },
  statsLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.8,
    color: Colors.textSecondary,
  },
  statsValue: {
    fontFamily: Fonts.display,
    fontSize: 31,
    letterSpacing: -1.2,
    color: Colors.white,
  },
  statsHint: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.textMuted,
  },
  statsIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  statValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.text,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginHorizontal: 10,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterActive: {
    backgroundColor: 'rgba(244,63,125,0.13)',
    borderColor: 'rgba(244,63,125,0.38)',
  },
  filterText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bodySemiBold,
  },
  filterCount: {
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  filterCountActive: {
    backgroundColor: 'rgba(244,63,125,0.24)',
  },
  filterCountText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.textMuted,
  },
  filterCountTextActive: {
    color: Colors.pink,
  },
  section: {
    gap: 11,
  },
  list: {
    gap: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 8,
    paddingRight: 12,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  skeletonCopy: {
    flex: 1,
    gap: 6,
  },
  emptyCard: {
    padding: 0,
  },
  footerNote: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.22)',
    textAlign: 'center',
    paddingTop: 2,
  },
});
