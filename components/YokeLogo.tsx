import { Image } from 'react-native';

interface Props {
  size?: number;
}

export default function YokeLogo({ size = 160 }: Props) {
  return (
    <Image
      source={require('../assets/Yoke.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
