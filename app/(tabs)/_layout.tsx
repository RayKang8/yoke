import { Tabs } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { colors } from '../../constants/theme';

interface TabIconProps {
  focused: boolean;
  name: string;
}

function TabIcon({ focused, name }: TabIconProps) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  // Simple solid/outline dot indicator under active tab
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
      <View style={{
        width: focused ? 6 : 5,
        height: focused ? 6 : 5,
        borderRadius: 3,
        backgroundColor: focused ? c.accent : c.textSecondary,
        opacity: focused ? 1 : 0.4,
      }} />
    </View>
  );
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
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="home" /> }} />
      <Tabs.Screen name="feed"    options={{ title: 'Feed',    tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="feed" /> }} />
      <Tabs.Screen name="bible"   options={{ title: 'Bible',   tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="bible" /> }} />
      <Tabs.Screen name="groups"  options={{ title: 'Groups',  tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="groups" /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="profile" /> }} />
    </Tabs>
  );
}
