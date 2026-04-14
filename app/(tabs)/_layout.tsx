import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colors } from '../../constants/theme';
import { HomeIcon, FeedIcon, BibleIcon, GroupsIcon, ProfileIcon } from '../../components/icons';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
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
      <Tabs.Screen name="groups"  options={{ title: 'Groups',  tabBarIcon: ({ focused }) => <GroupsIcon  active={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <ProfileIcon active={focused} /> }} />
    </Tabs>
  );
}
