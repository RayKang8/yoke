import Svg, { Rect, Text, Line } from 'react-native-svg';

interface Props {
  size?: number;
}

// Viewbox is 680×790. We scale uniformly by (size / 680).
export default function YokeLogo({ size = 160 }: Props) {
  const scale = size / 680;
  const height = 790 * scale;

  return (
    <Svg width={size} height={height} viewBox="0 0 680 790">
      {/* Gold rounded background */}
      <Rect x="0" y="0" width="680" height="780" rx="150" fill="#F5C842" />

      {/* Cross — vertical bar */}
      <Rect x="295" y="60" width="90" height="520" rx="45" fill="#FAFAF7" />
      {/* Cross — horizontal bar */}
      <Rect x="100" y="200" width="480" height="90" rx="45" fill="#FAFAF7" />

      {/* Y O K E letters along vertical bar */}
      <Text x="340" y="142" textAnchor="middle" dominantBaseline="central" fontFamily="serif" fontSize="64" fontWeight="900" fill="#F5C842">Y</Text>
      <Text x="340" y="245" textAnchor="middle" dominantBaseline="central" fontFamily="serif" fontSize="64" fontWeight="900" fill="#F5C842">O</Text>
      <Text x="340" y="360" textAnchor="middle" dominantBaseline="central" fontFamily="serif" fontSize="64" fontWeight="900" fill="#F5C842">K</Text>
      <Text x="340" y="470" textAnchor="middle" dominantBaseline="central" fontFamily="serif" fontSize="64" fontWeight="900" fill="#F5C842">E</Text>

      {/* Faith Together tagline */}
      <Text x="340" y="658" textAnchor="middle" fontFamily="serif" fontSize="34" fill="#FAFAF7" letterSpacing="3">Faith Together</Text>
      <Line x1="160" y1="678" x2="520" y2="678" stroke="#FAFAF7" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}
