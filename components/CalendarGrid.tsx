import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  year: number;
  month: number; // 0-indexed
  completedDates: Set<string>; // 'YYYY-MM-DD'
  lockedBefore?: string; // 'YYYY-MM-DD' — free tier gate
  onDayPress: (date: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n: number) { return String(n).padStart(2, '0'); }

export function CalendarGrid({ year, month, completedDates, lockedBefore, onDayPress }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      {/* Day headers */}
      <View className="flex-row mb-2">
        {DAYS.map(d => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Weeks */}
      {Array.from({ length: cells.length / 7 }, (_, wi) => (
        <View key={wi} className="flex-row mb-2">
          {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
            if (!day) return <View key={di} style={{ flex: 1 }} />;

            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const completed = completedDates.has(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isLocked = lockedBefore ? dateStr < lockedBefore : false;

            return (
              <TouchableOpacity
                key={di}
                onPress={() => {
                  if (completed && !isLocked) onDayPress(dateStr);
                  else if (isLocked) onDayPress('locked');
                }}
                disabled={!completed && !isLocked}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
              >
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: completed && !isLocked
                    ? c.accent
                    : isToday
                      ? c.surface
                      : 'transparent',
                  borderWidth: isToday ? 1 : 0,
                  borderColor: c.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isFuture ? 0.3 : isLocked ? 0.4 : 1,
                }}>
                  <Text style={{
                    color: completed && !isLocked ? '#1A1A1A' : c.textPrimary,
                    fontSize: 14,
                    fontWeight: completed || isToday ? '600' : '400',
                  }}>
                    {day}
                  </Text>
                </View>
                {isLocked && completed && (
                  <Text style={{ fontSize: 8, color: c.textSecondary }}>🔒</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
