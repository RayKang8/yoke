import YokeLogoSvg from '../assets/yoke_logo.svg';

interface Props {
  size?: number;
}

// Viewbox is 680×690. Height scales proportionally with size.
export default function YokeLogo({ size = 160 }: Props) {
  const height = (690 / 680) * size;

  return <YokeLogoSvg width={size} height={height} />;
}
