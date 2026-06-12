import { View, ActivityIndicator } from 'react-native';
import YokeLogo from './YokeLogo';

const BG = '#FDD72D';

export default function AppSplash() {
  return (
    <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <YokeLogo size={200} />
      <ActivityIndicator color="#1A1A1A" size="large" />
    </View>
  );
}
