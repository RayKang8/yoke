import { useState } from 'react';
import {
  View, Text, TouchableOpacity, useColorScheme,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/theme';

const STEPS = [
  {
    title: 'What is Yoke?',
    body: 'Yoke gives you a daily Bible passage and a guided reflection prompt. You write your thoughts and share them with friends or your small group — creating the accountability that makes spiritual habits actually stick.',
    emoji: '✝',
    cta: 'Continue',
  },
  {
    title: 'Set your reminder',
    body: "We'll send you a daily nudge when your passage is ready. You can change this any time in settings.",
    emoji: '🔔',
    cta: 'Continue',
  },
  {
    title: 'Your free trial starts now',
    body: 'You get 7 days of full Yoke Premium — unlimited groups, full calendar history, reaction details, and group streaks. After your trial, you can stay on the free tier or upgrade for $4.99/month.',
    emoji: '🎉',
    cta: 'Start my free trial',
  },
];

const REMINDER_TIMES = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '6:00 PM', '8:00 PM'];

export default function OnboardingScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [step, setStep] = useState(0);
  const [selectedTime, setSelectedTime] = useState('8:00 AM');

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleContinue() {
    if (isLast) {
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
        <Text style={{ fontSize: 48, marginBottom: 24 }}>{current.emoji}</Text>
        <Text style={{ color: c.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 16, lineHeight: 36 }}>
          {current.title}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 17, lineHeight: 26 }}>
          {current.body}
        </Text>

        {/* Time picker for step 2 */}
        {step === 1 && (
          <View className="mt-8 flex-row flex-wrap gap-2">
            {REMINDER_TIMES.map(time => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTime(time)}
                style={{
                  backgroundColor: selectedTime === time ? c.accent : c.surface,
                  borderColor: selectedTime === time ? c.accent : c.border,
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{
                  color: selectedTime === time ? '#1A1A1A' : c.textPrimary,
                  fontWeight: selectedTime === time ? '600' : '400',
                  fontSize: 15,
                }}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Premium features list for step 3 */}
        {step === 2 && (
          <View className="mt-8 gap-3">
            {[
              'Unlimited groups',
              'Full calendar history',
              'See who reacted to your posts',
              'Group streak tracking',
              'Activity nudge notifications',
            ].map(feature => (
              <View key={feature} className="flex-row items-center gap-3">
                <View style={{ backgroundColor: c.accent, width: 22, height: 22, borderRadius: 11 }} className="items-center justify-center">
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A1A1A' }}>✓</Text>
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
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="mt-4 items-center">
          <Text style={{ color: c.textSecondary, fontSize: 15 }}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
