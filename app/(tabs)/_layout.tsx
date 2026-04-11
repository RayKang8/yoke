import { Tabs } from 'expo-router';
import { useColorScheme, Text } from 'react-native';
import { colors } from '../../constants/theme';

function TabIcon({ label }: { label: string }) {
  const icons: Record<string, string> = {
    Home: '⌂', Feed: '☰', Bible: '📖', Groups: '👥', Profile: '○',
  };
  return <Text style={{ fontSize: 20 }}>{icons[label] ?? '●'}</Text>;
}

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
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: () => <TabIcon label="Home" /> }} />
      <Tabs.Screen name="feed"    options={{ title: 'Feed',    tabBarIcon: () => <TabIcon label="Feed" /> }} />
      <Tabs.Screen name="bible"   options={{ title: 'Bible',   tabBarIcon: () => <TabIcon label="Bible" /> }} />
      <Tabs.Screen name="groups"  options={{ title: 'Groups',  tabBarIcon: () => <TabIcon label="Groups" /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => <TabIcon label="Profile" /> }} />
    </Tabs>
  );
}
