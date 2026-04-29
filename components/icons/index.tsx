import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

const GOLD = '#F5C842';
const FLAME = '#FF8F00';
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
        <Path d="M12 3L2 10h2v10h6v-6h4v6h6V10h2L12 3z" fill={color} />
      ) : (
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
  const sw = active ? 2.5 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7"  x2="20" y2="7"  stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Line x1="4" y1="17" x2="14" y2="17" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

export function BibleIcon({ active, size = 24 }: TabIconProps) {
  const color = active ? GOLD : INACTIVE;
  const sw = active ? 2 : 1.6;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 6C10 4.5 7 4 4 5v14c3-1 6-0.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-0.5-8 1z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
        fill={active ? color + '33' : 'none'}
      />
      <Line x1="12" y1="6" x2="12" y2="20" stroke={color} strokeWidth={sw} />
    </Svg>
  );
}

export function GroupsIcon({ active, size = 24 }: TabIconProps) {
  const color = active ? GOLD : INACTIVE;
  const sw = active ? 2 : 1.6;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
      <Path d="M2 20c0-3.3 2.7-6 6-6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx="16" cy="8" r="2.5" stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
      <Path d="M10 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileIcon({ active, size = 24 }: TabIconProps) {
  const color = active ? GOLD : INACTIVE;
  const sw = active ? 2 : 1.6;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={sw} fill={active ? color : 'none'} />
      <Path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Reaction icons ───────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
}

// Praying hands
export function PrayIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left hand */}
      <Path
        d="M12 19C12 19 6 15.5 5 11C4.5 9 5.5 7 7 6.5C8 6.2 8.5 6.8 8.5 6.8L10 10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right hand */}
      <Path
        d="M12 19C12 19 18 15.5 19 11C19.5 9 18.5 7 17 6.5C16 6.2 15.5 6.8 15.5 6.8L14 10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fingers left */}
      <Path
        d="M8.5 6.8C8.5 6.8 8 5 9 4.2C9.8 3.6 10.5 4 10.5 4L12 8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fingers right */}
      <Path
        d="M15.5 6.8C15.5 6.8 16 5 15 4.2C14.2 3.6 13.5 4 13.5 4L12 8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Palm center */}
      <Path
        d="M10 10L12 19L14 10L12 8L10 10Z"
        fill={color}
        opacity={0.25}
      />
    </Svg>
  );
}

// Cross
export function AmenIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="10.5" y="3"  width="3" height="18" rx="1.5" fill={color} />
      <Rect x="4"    y="8"  width="16" height="3"  rx="1.5" fill={color} />
    </Svg>
  );
}

// Flame
export function HitIcon({ size = 20, color = FLAME }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 7 7.5 7 12.5C7 15.5 9.2 18 12 18C14.8 18 17 15.5 17 12.5C17 10 15.5 8 14.5 7C14.5 8.5 13.5 9.5 12.5 10C12.5 10 11 8.5 11 6.5C9.5 7.5 8 9.5 8 12C7.5 11 7.5 9 7.5 9C7.5 9 5 11 5 14C5 18.4 8.1 22 12 22C15.9 22 19 18.4 19 14C19 8 12 2 12 2Z"
        fill={color}
      />
      {/* Inner highlight */}
      <Path
        d="M12 13C12 13 10.5 14.5 10.5 16C10.5 17.1 11.2 18 12 18C12.8 18 13.5 17.1 13.5 16C13.5 14.5 12 13 12 13Z"
        fill={color === GOLD ? '#1A1A1A' : '#fff'}
        opacity={0.25}
      />
    </Svg>
  );
}

// ─── UI icons ─────────────────────────────────────────────────────────────────

// Flame (alias for streak display)
export function StreakIcon({ size = 24, color = FLAME }: IconProps) {
  return <HitIcon size={size} color={color} />;
}

// Gear
export function SettingsIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.4 13c.1-.3.1-.6.1-1s0-.7-.1-1l2.1-1.6c.2-.2.3-.5.2-.7l-2-3.5c-.1-.2-.4-.3-.7-.2l-2.5 1c-.5-.4-1.1-.7-1.7-.9L14.4 2.4C14.3 2.2 14.1 2 13.9 2h-4c-.2 0-.4.2-.5.4l-.4 2.6c-.6.2-1.2.5-1.7.9L4.8 4.8c-.3-.1-.6 0-.7.2l-2 3.5c-.1.2-.1.5.2.7L4.4 11c-.1.3-.1.6-.1 1s0 .7.1 1L2.3 14.6c-.2.2-.3.5-.2.7l2 3.5c.1.2.4.3.7.2l2.5-1c.5.4 1.1.7 1.7.9l.4 2.6c.1.2.3.4.5.4h4c.2 0 .4-.2.5-.4l.4-2.6c.6-.2 1.2-.5 1.7-.9l2.5 1c.3.1.6 0 .7-.2l2-3.5c.1-.2.1-.5-.2-.7L19.4 13z"
        fill={color}
        opacity={0.85}
      />
      <Circle cx="12" cy="12" r="2.8" fill={color === GOLD ? '#1A1A1A' : '#222'} />
    </Svg>
  );
}

// Person with plus
export function AddFriendIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="10" cy="8" r="3.5" stroke={color} strokeWidth={2} />
      <Path d="M2 20c0-4.4 3.6-8 8-8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="18" y1="13" x2="18" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="14" y1="17" x2="22" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// Speech bubble
export function CommentIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15C21 16.1 20.1 17 19 17H7L3 21V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V15Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Calendar
export function CalendarIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth={1.8} />
      <Line x1="3"  y1="10" x2="21" y2="10" stroke={color} strokeWidth={1.8} />
      <Line x1="8"  y1="3"  x2="8"  y2="7"  stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="16" y1="3"  x2="16" y2="7"  stroke={color} strokeWidth={2} strokeLinecap="round" />
      {/* Dot grid */}
      <Circle cx="8"  cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
      <Circle cx="8"  cy="18" r="1" fill={color} />
      <Circle cx="12" cy="18" r="1" fill={color} />
    </Svg>
  );
}

// Church building with cross
export function ChurchIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cross on top */}
      <Line x1="12" y1="2"  x2="12" y2="7"  stroke={color} strokeWidth={2}   strokeLinecap="round" />
      <Line x1="10" y1="4"  x2="14" y2="4"  stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Roof / steeple */}
      <Path d="M8 9L12 7L16 9" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      {/* Building walls */}
      <Rect x="7" y="9" width="10" height="12" rx="0.5" stroke={color} strokeWidth={1.8} />
      {/* Door */}
      <Path d="M10 21V16C10 15.4 10.9 15 12 15C13.1 15 14 15.4 14 16V21" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      {/* Window */}
      <Rect x="10.5" y="11" width="3" height="2.5" rx="1.5" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

// Two people (UI, fixed color, no active state)
export function FriendsIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8"  cy="8" r="3"   stroke={color} strokeWidth={1.8} />
      <Path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="17" cy="8" r="2.5" stroke={color} strokeWidth={1.6} />
      <Path d="M14 20c0-2.8 1.8-5 4-5.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function BellIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Navigation icons ─────────────────────────────────────────────────────────

export function BackIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 5l-7 7 7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ForwardIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 5l7 7-7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 4l-8 8 8 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 4l8 8-8 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── UI state icons ───────────────────────────────────────────────────────────

export function CheckIcon({ size = 16, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12l6 6L20 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6"  y1="6"  x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="18" y1="6"  x2="6"  y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function LockIcon({ size = 16, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth={1.8} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="12" cy="16.5" r="1.2" fill={color} />
    </Svg>
  );
}

export function EmailIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={1.8} />
      <Path d="M3 8l9 6 9-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StarIcon({ size = 24, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
        fill={color}
        stroke={color}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CameraIcon({ size = 20, color = GOLD }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}
