import { useState } from 'react';
import {
  View, Text, TouchableOpacity, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { registerForPushNotifications, scheduleDailyReminder } from '../../lib/notifications';
import { analytics } from '../../lib/posthog';
import { colors } from '../../constants/theme';
import { AmenIcon, BellIcon, StarIcon } from '../../components/icons';
import { TimePickerModal } from '../../components/TimePickerModal';

const STEPS = [
  {
    title: 'Welcome to Yoke!',
    body: "We are so glad you are here. Every day, Yoke brings you a short passage to read and a simple question to sit with. Write your reflection, share it with friends or your small group, and grow in faith together.",
    Icon: AmenIcon,
    cta: 'Continue',
  },
  {
    title: 'Set your daily reminder',
    body: "Pick a time that works for you and we will send a gentle nudge when your passage is ready each day. You can always update this later in Settings.",
    Icon: BellIcon,
    cta: 'Continue',
  },
  {
    title: "You're all set!",
    body: "Welcome to the Yoke community! Jump in, explore, and start making it part of your daily rhythm. Whenever you want to unlock more features like unlimited groups and streak tracking, Premium is waiting for you in Settings.",
    Icon: StarIcon,
    cta: "Let's Go!",
  },
];


export default function OnboardingScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [step, setStep] = useState(0);
  const [selectedTime, setSelectedTime] = useState('8:00 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function handleContinue() {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? '';
    if (step === 1) {
      await registerForPushNotifications();
      await AsyncStorage.setItem(`reminderTime_${uid}`, selectedTime);
      await scheduleDailyReminder(selectedTime);
    }
    if (isLast) {
      analytics.capture('onboarding_completed');
      await AsyncStorage.setItem(`onboarding_done_${uid}`, '1');
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
            const { data: { user } } = await supabase.auth.getUser();
            await AsyncStorage.setItem(`onboarding_done_${user?.id ?? ''}`, '1');
            router.replace('/(tabs)');
          }}
          className="mt-4 items-center"
        >
          <Text style={{ color: c.textSecondary, fontSize: 15 }}>Skip for now</Text>
        </TouchableOpacity>
      )}

      <TimePickerModal
        visible={showTimePicker}
        initialTime={selectedTime}
        onConfirm={time => { setSelectedTime(time); setShowTimePicker(false); }}
        onCancel={() => setShowTimePicker(false)}
      />
    </View>
  );
}
