import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  url: string | null | undefined;
  name: string;
  size: number;
  accent: string;
  textColor?: string;
}

export function Avatar({ url, name, size, accent, textColor = '#1A1A1A' }: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .trim()
    .split(/\s+/)
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const fontSize = Math.round(size * 0.36);

  if (url && !imgError) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { backgroundColor: accent, width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={{ color: textColor, fontSize, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
