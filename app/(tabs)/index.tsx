import { View, Text, useColorScheme } from 'react-native';
import { colors } from '../../constants/theme';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View style={{ flex: 1, backgroundColor: c.background }} className="items-center justify-center">
      <Text style={{ color: c.textPrimary, fontSize: 20, fontWeight: '600' }}>Home</Text>
      <Text style={{ color: c.textSecondary, marginTop: 8 }}>Today's passage coming in Step 4</Text>
    </View>
  );
}
