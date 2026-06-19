import { View, useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../constants/theme';
import { HomeIcon, FeedIcon, BibleIcon, GroupsIcon, ProfileIcon } from '../../components/icons';
import { useBadgeCounts } from '../../hooks/useBadgeCounts';
import TabletSidebar from '../../components/TabletSidebar';
import { isIPad } from '../../lib/platform';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profileBadge, groupsBadge } = useBadgeCounts();

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isIPad
          ? { display: 'none' }
          : {
              backgroundColor: c.surface,
              borderTopColor: c.border,
              borderTopWidth: 1,
            },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: ({ focused }) => <HomeIcon    active={focused} /> }} />
      <Tabs.Screen name="feed"    options={{ title: 'Feed',    tabBarIcon: ({ focused }) => <FeedIcon    active={focused} /> }} />
      <Tabs.Screen name="bible"   options={{ title: 'Bible',   tabBarIcon: ({ focused }) => <BibleIcon   active={focused} /> }} />
      <Tabs.Screen name="groups"  options={{ title: 'Groups',  tabBarIcon: ({ focused }) => <GroupsIcon  active={focused} />, tabBarBadge: groupsBadge  > 0 ? groupsBadge  : undefined }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <ProfileIcon active={focused} />, tabBarBadge: profileBadge > 0 ? profileBadge : undefined }} />
    </Tabs>
  );

  if (isIPad) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.background }}>
        <TabletSidebar />
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
            {tabs}
          </View>
        </View>
      </View>
    );
  }

  return tabs;
}
