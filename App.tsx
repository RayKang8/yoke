import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-[#FAFAF7]">
      <Text className="text-xl font-bold text-[#1A1A1A]">Yoke</Text>
      <Text className="text-[#6B6B6B]">Faith is better together.</Text>
      <StatusBar style="auto" />
    </View>
  );
}
