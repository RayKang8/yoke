import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { colors, fonts, shadows, radius } from '../constants/theme';
import { GroupSummary } from '../hooks/useGroups';
import { GroupsIcon, StreakIcon, ChevronRightIcon } from './icons';

interface Props {
  group: GroupSummary;
  isPremium: boolean;
  onPress: () => void;
}

export function GroupCard({ group, isPremium, onPress }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: c.warmSurface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.warmBorder,
        padding: 20,
        marginBottom: 12,
        ...shadows.card,
      }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text style={{ color: c.textPrimary, fontFamily: fonts.headingSemibold, fontSize: 17, flex: 1 }}>
          {group.name}
        </Text>
        <ChevronRightIcon size={16} color={c.textSecondary} />
      </View>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1">
          <GroupsIcon active={false} size={14} />
          <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 13 }}>
            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={{ color: group.posted_today > 0 ? c.accent : c.textSecondary, fontFamily: group.posted_today > 0 ? fonts.ui : fonts.uiRegular, fontSize: 13 }}>
          {group.posted_today}/{group.member_count} posted today
        </Text>
        {isPremium && group.streak > 0 && (
          <View className="flex-row items-center gap-1">
            <StreakIcon size={14} />
            <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 13 }}>{group.streak}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
