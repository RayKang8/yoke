import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { colors } from '../constants/theme';
import { GroupSummary } from '../hooks/useGroups';

interface Props {
  group: GroupSummary;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12 }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600', flex: 1 }}>
          {group.name}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>›</Text>
      </View>

      <View className="flex-row items-center gap-4">
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          👥 {group.member_count} member{group.member_count !== 1 ? 's' : ''}
        </Text>
        <Text style={{ color: group.posted_today > 0 ? c.accent : c.textSecondary, fontSize: 13, fontWeight: group.posted_today > 0 ? '600' : '400' }}>
          {group.posted_today}/{group.member_count} posted today
        </Text>
      </View>
    </TouchableOpacity>
  );
}
