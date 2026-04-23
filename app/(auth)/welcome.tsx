import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import YokeLogo from '../../components/YokeLogo';

const PRIVACY_URL = 'https://yokefaith.com/privacy';
const TERMS_URL   = 'https://yokefaith.com/terms';

const BG = '#FDD72D';

export default function WelcomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: BG }} className="items-center justify-between px-8 pt-24 pb-16">
      {/* Logo area */}
      <View className="items-center flex-1 justify-center">
        <YokeLogo size={200} />
      </View>

      {/* Buttons */}
      <View className="w-full gap-3">
        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          style={{ backgroundColor: '#1A1A1A', borderRadius: 14 }}
          className="py-4 items-center"
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="py-4 items-center"
        >
          <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '500', opacity: 0.6 }}>
            I already have an account
          </Text>
        </TouchableOpacity>

        <Text style={{ color: '#1A1A1A', fontSize: 12, opacity: 0.45, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
          By continuing you agree to our{' '}
          <Text style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(TERMS_URL)}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}
