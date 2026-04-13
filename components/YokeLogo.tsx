import Svg, { Rect, Text } from 'react-native-svg';

interface Props {
  size?: number;
}

// Viewbox is 680×690. Height scales proportionally with size.
export default function YokeLogo({ size = 160 }: Props) {
  const height = (690 / 680) * size;

  return (
    <Svg width={size} height={height} viewBox="0 0 680 690">
      {/* Gold rounded background */}
      <Rect x="0" y="0" width="680" height="680" rx="120" fill="#F5C842" />

      {/* Cross — vertical bar */}
      <Rect x="300" y="60" width="80" height="480" rx="40" fill="#FAFAF7" />
      {/* Cross — horizontal bar */}
      <Rect x="110" y="200" width="460" height="80" rx="40" fill="#FAFAF7" />

      {/* Y O K E letters */}
      <Text x="340" y="152" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif" fontSize="60" fontWeight="900" fill="#F5C842">Y</Text>
      <Text x="340" y="242" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif" fontSize="60" fontWeight="900" fill="#F5C842">O</Text>
      <Text x="340" y="352" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif" fontSize="60" fontWeight="900" fill="#F5C842">K</Text>
      <Text x="340" y="462" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif" fontSize="60" fontWeight="900" fill="#F5C842">E</Text>
    </Svg>
  );
}
