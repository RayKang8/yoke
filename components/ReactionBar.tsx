import { View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/theme';

const REACTIONS = [
  { type: 'pray', label: '🙏 Pray' },
  { type: 'amen', label: '✝ Amen' },
  { type: 'hit',  label: '💛 This hit me' },
];

interface Props {
  devotionalId: string;
  reactions: { type: string; user_id: string }[];
  currentUserId: string;
  onUpdate: (reactions: { type: string; user_id: string }[]) => void;
}

export function ReactionBar({ devotionalId, reactions, currentUserId, onUpdate }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [busy, setBusy] = useState<string | null>(null);

  const myReactions = new Set(
    reactions.filter(r => r.user_id === currentUserId).map(r => r.type)
  );

  function countOf(type: string) {
    return reactions.filter(r => r.type === type).length;
  }

  async function toggle(type: string) {
    if (busy) return;
    setBusy(type);

    if (myReactions.has(type)) {
      // remove
      await supabase
        .from('reactions')
        .delete()
        .eq('devotional_id', devotionalId)
        .eq('user_id', currentUserId)
        .eq('type', type);
      onUpdate(reactions.filter(r => !(r.user_id === currentUserId && r.type === type)));
    } else {
      // add
      await supabase
        .from('reactions')
        .insert({ devotional_id: devotionalId, user_id: currentUserId, type });
      onUpdate([...reactions, { type, user_id: currentUserId }]);
    }

    setBusy(null);
  }

  return (
    <View className="flex-row gap-2 flex-wrap">
      {REACTIONS.map(r => {
        const active = myReactions.has(r.type);
        const count = countOf(r.type);
        return (
          <TouchableOpacity
            key={r.type}
            onPress={() => toggle(r.type)}
            disabled={busy === r.type}
            style={{
              backgroundColor: active ? c.accent + '33' : c.surface,
              borderColor: active ? c.accent : c.border,
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 13 }}>{r.label}</Text>
            {count > 0 && (
              <Text style={{ color: active ? c.accent : c.textSecondary, fontSize: 12, fontWeight: '600' }}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
