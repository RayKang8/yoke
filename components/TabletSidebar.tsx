import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { usePathname, router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { colors, fonts } from '../constants/theme';
import { HomeIcon, FeedIcon, BibleIcon, GroupsIcon, ProfileIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useBadgeCounts } from '../hooks/useBadgeCounts';

const EXPANDED_WIDTH = 220;
const COLLAPSED_WIDTH = 68;

const TABS = [
  { name: 'Home',    href: '/',        icon: HomeIcon    },
  { name: 'Feed',    href: '/feed',    icon: FeedIcon    },
  { name: 'Bible',   href: '/bible',   icon: BibleIcon   },
  { name: 'Groups',  href: '/groups',  icon: GroupsIcon  },
  { name: 'Profile', href: '/profile', icon: ProfileIcon },
] as const;

export default function TabletSidebar() {
  const pathname = usePathname();
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { profileBadge, groupsBadge } = useBadgeCounts();
  const [collapsed, setCollapsed] = useState(false);
  const widthAnim = useRef(new Animated.Value(EXPANDED_WIDTH)).current;

  function toggle() {
    const toValue = collapsed ? EXPANDED_WIDTH : COLLAPSED_WIDTH;
    Animated.spring(widthAnim, {
      toValue,
      useNativeDriver: false,
      damping: 20,
      stiffness: 180,
    }).start();
    setCollapsed(prev => !prev);
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(href);
  }

  function getBadge(name: string) {
    if (name === 'Groups') return groupsBadge;
    if (name === 'Profile') return profileBadge;
    return 0;
  }

  return (
    <Animated.View
      style={[
        styles.sidebar,
        {
          width: widthAnim,
          backgroundColor: c.surface,
          borderRightColor: c.border,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 16,
          paddingLeft: insets.left,
        },
      ]}
    >
      <View style={[styles.header, collapsed && styles.headerCollapsed]}>
        {!collapsed && (
          <Text style={[styles.logoText, { color: c.accent, fontFamily: fonts.heading }]}>
            Yoke
          </Text>
        )}
        <TouchableOpacity onPress={toggle} style={styles.toggleBtn} activeOpacity={0.7}>
          {collapsed
            ? <ChevronRightIcon size={18} color={c.textSecondary} />
            : <ChevronLeftIcon  size={18} color={c.textSecondary} />
          }
        </TouchableOpacity>
      </View>

      <View style={[styles.nav, collapsed && styles.navCollapsed]}>
        {TABS.map(({ name, href, icon: Icon }) => {
          const active = isActive(href);
          const badge = getBadge(name);
          return (
            <TouchableOpacity
              key={href}
              style={[
                styles.item,
                collapsed && styles.itemCollapsed,
                active && { backgroundColor: c.accent + '1A' },
              ]}
              onPress={() => router.navigate(href as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Icon active={active} size={22} />
                {badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: c.accent }]}>
                    <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                )}
              </View>
              {!collapsed && (
                <Text
                  style={[
                    styles.label,
                    {
                      color: active ? c.accent : c.textSecondary,
                      fontFamily: active ? fonts.ui : fonts.uiRegular,
                    },
                  ]}
                >
                  {name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  headerCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  logoText: {
    fontSize: 26,
    letterSpacing: 0.4,
  },
  toggleBtn: {
    padding: 6,
    borderRadius: 8,
  },
  nav: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 2,
  },
  navCollapsed: {
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 14,
  },
  itemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: 48,
  },
  iconWrap: {
    width: 24,
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  label: {
    fontSize: 15,
  },
});
