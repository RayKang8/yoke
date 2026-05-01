import { useState } from 'react';
import {
  View, Text, TouchableOpacity, useColorScheme, Modal, Pressable, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications, scheduleDailyReminder } from '../../lib/notifications';
import { colors } from '../../constants/theme';
import { AmenIcon, BellIcon, StarIcon, CheckIcon } from '../../components/icons';

const STEPS = [
  {
    title: 'What is Yoke?',
    body: "Every day, Yoke gives you a passage to read and a simple question to sit with. Write your thoughts, share with friends or your small group, and grow together — one day at a time.",
    Icon: AmenIcon,
    cta: 'Continue',
  },
  {
    title: 'Your daily reminder',
    body: "Pick a time that works for you and we'll send a gentle nudge when your passage is ready. You can always change this in settings.",
    Icon: BellIcon,
    cta: 'Continue',
  },
  {
    title: 'Your free trial starts now',
    body: "You've got 7 days of full Yoke Premium to explore. After that, you can keep using Yoke free or upgrade to keep the extras — no pressure either way.",
    Icon: StarIcon,
    cta: 'Start my free trial',
  },
];

function formatTimeDate(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${period}`;
}

function defaultReminderDate(): Date {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  return d;
}

export default function OnboardingScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [step, setStep] = useState(0);
  const [selectedTime, setSelectedTime] = useState('8:00 AM');
  const [pendingDate, setPendingDate] = useState<Date>(defaultReminderDate());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function handleContinue() {
    if (step === 1) {
      // Step 2: request permission and schedule reminder
      await registerForPushNotifications();
      await AsyncStorage.setItem('reminderTime', selectedTime);
      await scheduleDailyReminder(selectedTime);
    }
    if (isLast) {
      // trial_ends_at is set server-side by the handle_new_user() trigger at signup
      await AsyncStorage.setItem('onboarding_done', '1');
      router.replace('/(tabs)');
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }} className="px-8 pt-16 pb-12">
      {/* Progress dots */}
      <View className="flex-row gap-2 mb-12">
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === step ? c.accent : c.border,
            }}
          />
        ))}
      </View>

      {/* Content */}
      <View className="flex-1">
        <current.Icon size={48} color={c.accent} />
        <Text style={{ color: c.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 16, lineHeight: 36 }}>
          {current.title}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 17, lineHeight: 26 }}>
          {current.body}
        </Text>

        {/* Time picker for step 2 */}
        {step === 1 && (
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={{
              marginTop: 32,
              backgroundColor: c.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.accent,
              paddingHorizontal: 24,
              paddingVertical: 18,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: c.accent, fontSize: 28, fontWeight: '700' }}>{selectedTime}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4 }}>Tap to change</Text>
          </TouchableOpacity>
        )}

        {/* Premium features list for step 3 */}
        {step === 2 && (
          <View className="mt-8 gap-3">
            {[
              'Unlimited groups',
              'Full calendar history',
              'Personal & group streak tracking',
            ].map(feature => (
              <View key={feature} className="flex-row items-center gap-3">
                <View style={{ backgroundColor: c.accent, width: 22, height: 22, borderRadius: 11 }} className="items-center justify-center">
                  <CheckIcon size={12} color="#1A1A1A" />
                </View>
                <Text style={{ color: c.textPrimary, fontSize: 16 }}>{feature}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={handleContinue}
        style={{ backgroundColor: c.accent, borderRadius: 14 }}
        className="py-4 items-center"
      >
        <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>
          {current.cta}
        </Text>
      </TouchableOpacity>

      {!isLast && (
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.setItem('onboarding_done', '1');
            router.replace('/(tabs)');
          }}
          className="mt-4 items-center"
        >
          <Text style={{ color: c.textSecondary, fontSize: 15 }}>Skip for now</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowTimePicker(false)} />
        <View style={{ backgroundColor: c.surface, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Text style={{ color: c.textSecondary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: c.textPrimary, fontSize: 16, fontWeight: '600' }}>Reminder Time</Text>
            <TouchableOpacity onPress={() => {
              const formatted = formatTimeDate(pendingDate);
              setSelectedTime(formatted);
              setShowTimePicker(false);
            }}>
              <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={pendingDate}
            mode="time"
            display="spinner"
            onChange={(_, date) => { if (date) setPendingDate(date); }}
            {...(Platform.OS === 'ios' ? { textColor: scheme === 'dark' ? '#FFFFFF' : '#1A1A1A' } : {})}
            style={{ alignSelf: 'center' }}
          />
        </View>
      </Modal>
    </View>
  );
}
