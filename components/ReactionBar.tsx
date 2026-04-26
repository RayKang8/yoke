import { View, Text, TouchableOpacity, useColorScheme, Modal, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/theme';
import { haptics } from '../lib/haptics';
import { PrayIcon, AmenIcon, HitIcon } from './icons';

const GOLD = '#F5C842';

const REACTIONS = [
  { type: 'pray', label: 'Pray',        Icon: PrayIcon },
  { type: 'amen', label: 'Amen',        Icon: AmenIcon },
  { type: 'hit',  label: 'This hit me', Icon: HitIcon  },
];

interface Props {
  devotionalId: string;
  reactions: { type: string; user_id: string }[];
  currentUserId: string;
  isPremium?: boolean;
  onUpdate: (reactions: { type: string; user_id: string }[]) => void;
}

export function ReactionBar({ devotionalId, reactions, currentUserId, isPremium = false, onUpdate }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<string | null>(null);
  const [detailType, setDetailType] = useState<string | null>(null);
  const [detailNames, setDetailNames] = useState<string[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const myReactions = new Set(
    reactions.filter(r => r.user_id === currentUserId).map(r => r.type)
  );

  function countOf(type: string) {
    return reactions.filter(r => r.type === type).length;
  }

  async function toggle(type: string) {
    if (busy) return;
    setBusy(type);
    haptics.light();

    if (myReactions.has(type)) {
      await supabase
        .from('reactions')
        .delete()
        .eq('devotional_id', devotionalId)
        .eq('user_id', currentUserId)
        .eq('type', type);
      onUpdate(reactions.filter(r => !(r.user_id === currentUserId && r.type === type)));
    } else {
      await supabase
        .from('reactions')
        .insert({ devotional_id: devotionalId, user_id: currentUserId, type });
      onUpdate([...reactions, { type, user_id: currentUserId }]);
    }

    setBusy(null);
  }

  async function showDetail(type: string) {
    if (countOf(type) === 0) return;
    setDetailType(type);
    setLoadingDetail(true);
    const userIds = reactions.filter(r => r.type === type).map(r => r.user_id);
    const { data } = await supabase
      .from('users')
      .select('name')
      .in('id', userIds);
    setDetailNames((data ?? []).map((u: any) => u.name));
    setLoadingDetail(false);
  }

  const detailLabel = REACTIONS.find(r => r.type === detailType)?.label ?? '';

  return (
    <>
      <View className="flex-row gap-2 flex-wrap">
        {REACTIONS.map(({ type, label, Icon }) => {
          const active = myReactions.has(type);
          const count = countOf(type);
          const iconColor = active ? GOLD : c.textSecondary;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => toggle(type)}
              onLongPress={() => showDetail(type)}
              disabled={busy === type}
              style={{
                backgroundColor: active ? c.accent + '22' : c.surface,
                borderColor: active ? c.accent : c.border,
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Icon size={15} color={iconColor} />
              <Text style={{ color: active ? c.accent : c.textSecondary, fontSize: 13, fontWeight: active ? '600' : '400' }}>
                {label}
              </Text>
              {count > 0 && (
                <Text style={{ color: active ? c.accent : c.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

      </View>

      <Modal
        visible={detailType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailType(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setDetailType(null)}
        >
          <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: insets.bottom + 24, minHeight: 160 }}>
            <Text style={{ color: c.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              {detailLabel} reactions
            </Text>
            {loadingDetail ? (
              <ActivityIndicator color={c.accent} />
            ) : detailNames.length === 0 ? (
              <Text style={{ color: c.textSecondary }}>No reactions yet.</Text>
            ) : (
              detailNames.map((name, i) => (
                <Text key={i} style={{ color: c.textPrimary, fontSize: 15, paddingVertical: 6, borderBottomWidth: i < detailNames.length - 1 ? 1 : 0, borderBottomColor: c.border }}>
                  {name}
                </Text>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
