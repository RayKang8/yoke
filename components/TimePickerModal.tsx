import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Modal, Pressable, TouchableOpacity, useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

const ITEM_H = 48;
const PAD = 2;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

function parseTime(str: string): [number, number, number] {
  const [time = '8:00', period = 'AM'] = (str ?? '8:00 AM').split(' ');
  const [hStr = '8', mStr = '0'] = time.split(':');
  const h = Math.max(1, Math.min(parseInt(hStr) || 8, 12));
  const m = Math.max(0, Math.min(parseInt(mStr) || 0, 59));
  return [h - 1, m, period === 'PM' ? 1 : 0];
}

interface ColumnProps {
  items: string[];
  initialIndex: number;
  onChange: (i: number) => void;
  textColor: string;
}

function WheelColumn({ items, initialIndex, onChange, textColor }: ColumnProps) {
  const ref = useRef<FlatList>(null);
  const padded = [...Array(PAD).fill(''), ...items, ...Array(PAD).fill('')];

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollToOffset({ offset: initialIndex * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, []);

  function handleSettle(y: number) {
    const idx = Math.round(y / ITEM_H);
    onChange(Math.max(0, Math.min(idx, items.length - 1)));
  }

  return (
    <FlatList
      ref={ref}
      data={padded}
      keyExtractor={(_, i) => String(i)}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
      onMomentumScrollEnd={e => handleSettle(e.nativeEvent.contentOffset.y)}
      onScrollEndDrag={e => handleSettle(e.nativeEvent.contentOffset.y)}
      renderItem={({ item }) => (
        <View style={{ height: ITEM_H, width: 72, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 22, color: item ? textColor : 'transparent' }}>
            {item || ' '}
          </Text>
        </View>
      )}
      style={{ height: ITEM_H * (PAD * 2 + 1), width: 72 }}
    />
  );
}

interface Props {
  visible: boolean;
  initialTime: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

export function TimePickerModal({ visible, initialTime, onConfirm, onCancel }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [resetKey, setResetKey] = useState(0);
  const [hourIdx, setHourIdx] = useState(0);
  const [minIdx, setMinIdx] = useState(0);
  const [periodIdx, setPeriodIdx] = useState(0);

  useEffect(() => {
    if (visible) {
      const [h, m, p] = parseTime(initialTime);
      setHourIdx(h);
      setMinIdx(m);
      setPeriodIdx(p);
      setResetKey(k => k + 1);
    }
  }, [visible]);

  function confirm() {
    onConfirm(`${HOURS[hourIdx]}:${MINUTES[minIdx]} ${PERIODS[periodIdx]}`);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onCancel} />
      <View style={{ backgroundColor: c.surface, paddingBottom: insets.bottom + 8 }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 20, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: c.border,
        }}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ color: c.textPrimary, fontSize: 16, fontWeight: '600' }}>Reminder Time</Text>
          <TouchableOpacity onPress={confirm}>
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: PAD * ITEM_H,
              left: 0, right: 0,
              height: ITEM_H,
              backgroundColor: c.border,
              opacity: 0.6,
            }}
          />
          <WheelColumn key={`h-${resetKey}`} items={HOURS} initialIndex={hourIdx} onChange={setHourIdx} textColor={c.textPrimary} />
          <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '600' }}>:</Text>
          <WheelColumn key={`m-${resetKey}`} items={MINUTES} initialIndex={minIdx} onChange={setMinIdx} textColor={c.textPrimary} />
          <WheelColumn key={`p-${resetKey}`} items={PERIODS} initialIndex={periodIdx} onChange={setPeriodIdx} textColor={c.textPrimary} />
        </View>
      </View>
    </Modal>
  );
}
