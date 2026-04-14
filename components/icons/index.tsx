import Svg, { Path, Circle, Rect, G, Line } from 'react-native-svg';

const GOLD = '#F5C842';
const INACTIVE = '#9A9A9A';

// ─── Tab bar icons ────────────────────────────────────────────────────────────

interface TabIconProps {
  active: boolean;
  size?: number;
}

export function HomeIcon({ active, size = 24 }: TabIconProps) {
  const color = active ? GOLD : INACTIVE;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active ? (
        // Filled house
        <Path
          d="M12 3L2 10h2v10h6v-6h4v6h6V10h2L12 3z"
          fill={color}
        />
      ) : (
        // Outline house
        <Path
          d="M12 3L2 10h2v10h6v-6h4v6h6V10h2L12 3zM18 18h-4v-6H10v6H6V11.5l6-4.5 6 4.5V18z"
          fill={color}
        />
      )}
    </Svg>
  );
}

export function FeedIcon({ active, size = 24 }: TabIconProps) {
  const color = active ? GOLD : INACTIVE;
  const strokeWidth = active ? 2.5 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4" y1="17" x2="14" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function BibleIcon({ active, size = 24 }: TabIconProps) {
  const color = active ? GOLD : INACTIVE;
  const strokeWidth = active ? 2 : 1.6;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Open book */}
      <Path
        d="M12 6C10 4.5 7 4 4 5v14c3-1 6-0.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-0.5-8 1z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={active ? color + '33' : 'none'}
      />
      <Line x1="12" y1="6" x2="12" y2="20" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function GroupsIcon({ active, size = 24 }: TabIconProps) {
  const color = active ? GOLD : INACTIVE;
  const strokeWidth = active ? 2 : 1.6;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Back person (left) */}
      <Circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth={strokeWidth} fill={active ? color : 'none'} />
      <Path
        d="M2 20c0-3.3 2.7-6 6-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Front person (right) */}
      <Circle cx="16" cy="8" r="2.5" stroke={color} strokeWidth={strokeWidth} fill={active ? color : 'none'} />
      <Path
        d="M10 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ProfileIcon({ active, size = 24 }: TabIconProps) {
  const color = active ? GOLD : INACTIVE;
  const strokeWidth = active ? 2 : 1.6;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={strokeWidth} fill={active ? color : 'none'} />
      <Path
        d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Reaction icons (fixed gold) ─────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
}

export function PrayIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 4 15 4 9.5C4 7 6 5 8.5 5C10 5 11.3 5.7 12 6.8C12.7 5.7 14 5 15.5 5C18 5 20 7 20 9.5C20 15 12 21 12 21Z"
        fill={color}
      />
    </Svg>
  );
}

export function AmenIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cross */}
      <Rect x="10.5" y="3" width="3" height="18" rx="1.5" fill={color} />
      <Rect x="4" y="8" width="16" height="3" rx="1.5" fill={color} />
    </Svg>
  );
}

export function HitIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 7 7 7 12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12C17 9 15 6.5 14 5.5C14 7 13 8.5 12 9C12 9 10 7.5 10 5.5C9 6.5 8 8 8 10C7.2 9 7 7.5 7 7C7 7 4 9.5 4 13C4 17.4 7.6 21 12 21C16.4 21 20 17.4 20 13C20 7.5 12 2 12 2Z"
        fill={color}
      />
    </Svg>
  );
}

// ─── UI icons (fixed gold) ────────────────────────────────────────────────────

export function StreakIcon({ size = 24, color = GOLD }: IconProps) {
  return <HitIcon size={size} color={color} />;
}

export function SettingsIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="2.5" fill={color} />
      <Path
        d="M19.4 13c.1-.3.1-.7.1-1s0-.7-.1-1l2.1-1.6c.2-.2.3-.4.2-.7l-2-3.5c-.1-.3-.4-.4-.7-.3l-2.5 1c-.5-.4-1.1-.7-1.7-.9l-.4-2.6C14.4 2.2 14.2 2 14 2h-4c-.2 0-.4.2-.5.4L9.1 5c-.6.2-1.2.5-1.7.9L4.9 4.8c-.3-.1-.6 0-.7.3l-2 3.5c-.1.2-.1.5.2.7L4.5 11c-.1.3-.1.6-.1 1s0 .7.1 1l-2.1 1.6c-.2.2-.3.4-.2.7l2 3.5c.1.3.4.4.7.3l2.5-1c.5.4 1.1.7 1.7.9l.4 2.6c.1.2.3.4.5.4h4c.2 0 .4-.2.5-.4l.4-2.6c.6-.2 1.2-.5 1.7-.9l2.5 1c.3.1.6 0 .7-.3l2-3.5c.1-.2.1-.5-.2-.7L19.4 13z"
        fill={color}
        opacity={0.9}
      />
      <Circle cx="12" cy="12" r="2.5" fill={color === GOLD ? '#1A1A1A' : '#fff'} />
    </Svg>
  );
}

export function AddFriendIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="10" cy="8" r="3.5" stroke={color} strokeWidth={2} />
      <Path
        d="M2 20c0-4.4 3.6-8 8-8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Plus sign */}
      <Line x1="18" y1="13" x2="18" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="14" y1="17" x2="22" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
