import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/theme';

export default function WelcomeScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-between px-8 pt-24 pb-16">
      {/* Logo area */}
      <View className="items-center flex-1 justify-center gap-4">
        <View
          style={{ backgroundColor: c.accent, width: 80, height: 80, borderRadius: 24 }}
          className="items-center justify-center"
        >
          <Text style={{ fontSize: 36 }}>✝</Text>
        </View>
        <Text style={{ color: c.textPrimary, fontSize: 42, fontWeight: '700', letterSpacing: -1 }}>
          Yoke
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 17, textAlign: 'center' }}>
          Faith is better together.
        </Text>
      </View>

      {/* Buttons */}
      <View className="w-full gap-3">
        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          style={{ backgroundColor: c.accent, borderRadius: 14 }}
          className="py-4 items-center"
        >
          <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="py-4 items-center"
        >
          <Text style={{ color: c.textSecondary, fontSize: 16 }}>
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
