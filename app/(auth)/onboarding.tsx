import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  useWindowDimensions, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { registerForPushNotifications, scheduleDailyReminder } from '../../lib/notifications';
import { analytics } from '../../lib/posthog';
import { getOfferings, purchasePackage, PRODUCT_IDS } from '../../lib/revenuecat';
import { TimePickerModal } from '../../components/TimePickerModal';
import {
  AmenIcon, BellIcon, StarIcon, FriendsIcon, CheckIcon, PrayIcon, ChurchIcon,
  StreakIcon, CalendarIcon,
} from '../../components/icons';

// expo-store-review requires a new native build — guard the import
let doRequestReview: (() => Promise<void>) | null = null;
try {
  const SR = require('expo-store-review');
  doRequestReview = SR.requestReview ?? null;
} catch {}

const BG   = '#1A1A1A';
const GOLD = '#F5C842';
const CREAM = '#FAFAF7';
const DIM  = 'rgba(250,250,247,0.5)';
const SURF = '#252525';

const TOTAL = 13;
const S_WELCOME  = 0;
const S_FAITH    = 1;
const S_WHO      = 2;
const S_JOURNEY  = 3;
const S_REMINDER = 4;
const S_SHOWCASE = 5; // S_SHOWCASE through S_SHOWCASE+4 = 5 feature slides
const S_REVIEW   = 10;
const S_PAYWALL  = 11;
const S_DONE     = 12;

const SHOWCASES = [
  {
    title: 'Your Daily Passage',
    description: 'Each morning, Yoke gives you a curated scripture and a reflection prompt. Read, sit with it, and write what\'s on your heart.',
    image: require('../../assets/Devotional.png'),
  },
  {
    title: 'Post & Celebrate',
    description: 'Share your devotional with friends and your group. Reactions and streak badges make daily faithfulness feel tangible.',
    image: require('../../assets/posted devotional.png'),
  },
  {
    title: 'Grow Together',
    description: 'Create or join a small group with friends, family, or your church. Stay accountable and read each other\'s reflections.',
    image: require('../../assets/groups.png'),
  },
  {
    title: 'Community Feed',
    description: 'See devotionals from friends and group members. Encourage them with a reaction or a heartfelt comment.',
    image: require('../../assets/feed.png'),
  },
  {
    title: 'Built-in Bible',
    description: 'The full Bible is right here in the app. Look up any verse, explore any book, stay grounded in the Word.',
    image: require('../../assets/bible.png'),
  },
] as const;

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 100, borderWidth: 1.5, margin: 4,
        borderColor: on ? GOLD : 'rgba(255,255,255,0.18)',
        backgroundColor: on ? GOLD : 'rgba(255,255,255,0.05)',
      }}
    >
      <Text style={{ color: on ? '#1A1A1A' : CREAM, fontSize: 15, fontFamily: 'Nunito_600SemiBold' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Btn({
  label, onPress, secondary = false, disabled = false,
}: {
  label: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={secondary ? 0.65 : 0.85}
      disabled={disabled}
      style={secondary
        ? { paddingVertical: 14, alignItems: 'center' }
        : {
            backgroundColor: disabled ? 'rgba(245,200,66,0.5)' : GOLD,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
          }
      }
    >
      <Text style={{
        color: secondary ? DIM : '#1A1A1A',
        fontSize: secondary ? 15 : 17,
        fontFamily: secondary ? 'Nunito_400Regular' : 'Nunito_700Bold',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const BAR_W = width - 48;

  const [step, setStep] = useState(0);
  const [faithGoals, setFaithGoals] = useState<string[]>([]);
  const [whoWith, setWhoWith]   = useState<string[]>([]);
  const [howLong, setHowLong]   = useState<string[]>([]);
  const [time, setTime]         = useState('8:00 AM');
  const [timePicker, setTimePicker] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [plan, setPlan]           = useState<'monthly' | 'annual'>('annual');
  const [purchasing, setPurchasing] = useState(false);

  const opacity  = useSharedValue(0);
  const slideY   = useSharedValue(20);
  const progress = useSharedValue(1 / TOTAL);
  const busy     = useRef(false);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    slideY.value  = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, []);

  useEffect(() => {
    if (step === S_PAYWALL) getOfferings().then(setOfferings);
  }, [step]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: slideY.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({ width: progress.value * BAR_W }));

  function toggle(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  }

  function resetBusy() { busy.current = false; }

  function applyNextStep(next: number) {
    busy.current = false;
    slideY.value = 20;
    setStep(next);
    progress.value = withTiming((next + 1) / TOTAL, { duration: 400 });
    opacity.value  = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    slideY.value   = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
  }

  function advance(next: number) {
    if (busy.current) return;
    busy.current = true;
    opacity.value = withTiming(0, { duration: 190, easing: Easing.in(Easing.ease) }, (ok) => {
      if (!ok) { runOnJS(resetBusy)(); return; }
      runOnJS(applyNextStep)(next);
    });
  }

  function priceStr(type: 'monthly' | 'annual'): string {
    const current = offerings?.current;
    if (!current) return type === 'monthly' ? '$4.99' : '$29.99';
    const pkg = type === 'monthly'
      ? (current.monthly ?? current.availablePackages.find((p: any) => p.packageType === 'MONTHLY'))
      : (current.annual  ?? current.availablePackages.find((p: any) => p.packageType === 'ANNUAL')
            ?? current.availablePackages.find((p: any) => p.product.identifier === PRODUCT_IDS.annual));
    return pkg?.product?.priceString ?? (type === 'monthly' ? '$4.99' : '$29.99');
  }

  async function handleReminder() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/(auth)/welcome'); return; }
    await registerForPushNotifications();
    await AsyncStorage.setItem(`reminderTime_${user.id}`, time);
    await scheduleDailyReminder(time);
    advance(S_SHOWCASE);
  }

  async function handleReview() {
    if (doRequestReview) {
      try { await doRequestReview(); } catch {}
    }
    advance(S_PAYWALL);
  }

  async function handlePurchase() {
    if (purchasing) return;
    const current = offerings?.current;
    if (!current) { advance(S_DONE); return; }
    const pkg = plan === 'monthly'
      ? (current.monthly ?? current.availablePackages.find((p: any) => p.packageType === 'MONTHLY'))
      : (current.annual  ?? current.availablePackages.find((p: any) => p.packageType === 'ANNUAL'));
    if (!pkg) { advance(S_DONE); return; }
    setPurchasing(true);
    try {
      await purchasePackage(pkg);
      analytics.capture('purchase_completed', { plan, source: 'onboarding' });
    } catch (e: any) {
      if (!e?.userCancelled) {
        Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
    advance(S_DONE);
  }

  async function handleFinish() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/(auth)/welcome'); return; }
    analytics.capture('onboarding_completed');
    await AsyncStorage.setItem(`onboarding_done_${user.id}`, '1');
    router.replace('/(tabs)');
  }

  const px = { paddingHorizontal: 28 } as const;
  const pb = { paddingBottom: insets.bottom + 28 } as const;

  function renderStep() {
    if (step >= S_SHOWCASE && step < S_REVIEW) {
      const idx = step - S_SHOWCASE;
      const item = SHOWCASES[idx];
      const nextStep = step + 1 < S_REVIEW ? step + 1 : S_REVIEW;
      return (
        <View style={[{ flex: 1 }, px, pb]}>
          <View style={{ marginTop: 12, marginBottom: 14 }}>
            <Text style={{ color: CREAM, fontSize: 28, fontFamily: 'Lora_700Bold', lineHeight: 36 }}>
              {item.title}
            </Text>
            <Text style={{ color: DIM, fontSize: 15, fontFamily: 'Nunito_400Regular', lineHeight: 24, marginTop: 8 }}>
              {item.description}
            </Text>
          </View>

          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(245,200,66,0.15)',
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}>
            <Image
              source={item.image}
              style={{ width: width - 56, height: '100%' }}
              resizeMode="contain"
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 18 }}>
            {SHOWCASES.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === idx ? GOLD : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </View>

          <Btn
            label={idx === SHOWCASES.length - 1 ? 'Continue' : 'Next'}
            onPress={() => advance(nextStep)}
          />
        </View>
      );
    }

    switch (step) {

      case S_WELCOME:
        return (
          <View style={[{ flex: 1 }, px, pb]}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {/* Concentric glow circles */}
              <View style={{
                width: 152, height: 152, borderRadius: 76,
                backgroundColor: 'rgba(245,200,66,0.06)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 44,
              }}>
                <View style={{
                  width: 110, height: 110, borderRadius: 55,
                  backgroundColor: 'rgba(245,200,66,0.13)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <View style={{
                    width: 78, height: 78, borderRadius: 39,
                    backgroundColor: 'rgba(245,200,66,0.24)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AmenIcon size={44} color={GOLD} />
                  </View>
                </View>
              </View>

              <Text style={{ color: CREAM, fontSize: 36, fontFamily: 'Lora_700Bold', textAlign: 'center', lineHeight: 46, marginBottom: 18 }}>
                Welcome to Yoke!
              </Text>
              <Text style={{ color: DIM, fontSize: 17, fontFamily: 'Nunito_400Regular', textAlign: 'center', lineHeight: 28, paddingHorizontal: 4 }}>
                Every day, Yoke brings you a short passage to read and a simple question to sit with. Write your reflection, share it with friends or your small group, and grow in faith together.
              </Text>
            </View>
            <Btn label="Get Started" onPress={() => advance(S_FAITH)} />
          </View>
        );

      case S_FAITH:
        return (
          <View style={[{ flex: 1 }, px, pb]}>
            <View style={{ flex: 1 }}>
              <View style={{ marginTop: 20, marginBottom: 28 }}>
                <PrayIcon size={42} color={GOLD} />
              </View>
              <Text style={{ color: CREAM, fontSize: 28, fontFamily: 'Lora_700Bold', lineHeight: 38, marginBottom: 6 }}>
                What's your faith goal?
              </Text>
              <Text style={{ color: DIM, fontSize: 14, fontFamily: 'Nunito_400Regular', marginBottom: 28 }}>
                Select all that apply
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {['Stay consistent', 'Grow deeper in scripture', 'Build community', 'Strengthen my prayer life', 'Other'].map(o => (
                  <Chip key={o} label={o} on={faithGoals.includes(o)} onPress={() => toggle(faithGoals, setFaithGoals, o)} />
                ))}
              </View>
            </View>
            <Btn label="Continue" onPress={() => advance(S_WHO)} />
          </View>
        );

      case S_WHO:
        return (
          <View style={[{ flex: 1 }, px, pb]}>
            <View style={{ flex: 1 }}>
              <View style={{ marginTop: 20, marginBottom: 28 }}>
                <FriendsIcon size={42} color={GOLD} />
              </View>
              <Text style={{ color: CREAM, fontSize: 28, fontFamily: 'Lora_700Bold', lineHeight: 38, marginBottom: 6 }}>
                Who are you doing this with?
              </Text>
              <Text style={{ color: DIM, fontSize: 14, fontFamily: 'Nunito_400Regular', marginBottom: 28 }}>
                Select all that apply
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {['Going solo for now', 'Friends', 'Family', 'Church group', 'Other'].map(o => (
                  <Chip key={o} label={o} on={whoWith.includes(o)} onPress={() => toggle(whoWith, setWhoWith, o)} />
                ))}
              </View>
            </View>
            <Btn label="Continue" onPress={() => advance(S_JOURNEY)} />
          </View>
        );

      case S_JOURNEY:
        return (
          <View style={[{ flex: 1 }, px, pb]}>
            <View style={{ flex: 1 }}>
              <View style={{ marginTop: 20, marginBottom: 28 }}>
                <ChurchIcon size={42} color={GOLD} />
              </View>
              <Text style={{ color: CREAM, fontSize: 28, fontFamily: 'Lora_700Bold', lineHeight: 38, marginBottom: 6 }}>
                How long have you been a Christian?
              </Text>
              <Text style={{ color: DIM, fontSize: 14, fontFamily: 'Nunito_400Regular', marginBottom: 28 }}>
                Select all that apply
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {['Just exploring', 'Less than a year', 'A few years', 'Most of my life', 'Other'].map(o => (
                  <Chip key={o} label={o} on={howLong.includes(o)} onPress={() => toggle(howLong, setHowLong, o)} />
                ))}
              </View>
            </View>
            <Btn label="Continue" onPress={() => advance(S_REMINDER)} />
          </View>
        );

      case S_REMINDER:
        return (
          <View style={[{ flex: 1 }, px, pb]}>
            <View style={{ flex: 1 }}>
              <View style={{ marginTop: 20, marginBottom: 28 }}>
                <BellIcon size={42} color={GOLD} />
              </View>
              <Text style={{ color: CREAM, fontSize: 28, fontFamily: 'Lora_700Bold', lineHeight: 38, marginBottom: 12 }}>
                Set your daily reminder
              </Text>
              <Text style={{ color: DIM, fontSize: 16, fontFamily: 'Nunito_400Regular', lineHeight: 26, marginBottom: 40 }}>
                Pick a time that works for you. We'll send a gentle nudge when your passage is ready each day.
              </Text>
              <TouchableOpacity
                onPress={() => setTimePicker(true)}
                style={{
                  backgroundColor: SURF,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: GOLD,
                  paddingVertical: 28,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: GOLD, fontSize: 46, fontFamily: 'Nunito_700Bold', letterSpacing: -1 }}>{time}</Text>
                <Text style={{ color: DIM, fontSize: 13, fontFamily: 'Nunito_400Regular', marginTop: 6 }}>Tap to change</Text>
              </TouchableOpacity>
            </View>
            <Btn label="Continue" onPress={handleReminder} />
            <TimePickerModal
              visible={timePicker}
              initialTime={time}
              onConfirm={t => { setTime(t); setTimePicker(false); }}
              onCancel={() => setTimePicker(false)}
            />
          </View>
        );

      case S_REVIEW:
        return (
          <View style={[{ flex: 1, justifyContent: 'space-between' }, px, pb]}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 40 }}>
                {[0, 1, 2, 3, 4].map(i => <StarIcon key={i} size={34} color={GOLD} />)}
              </View>
              <Text style={{ color: CREAM, fontSize: 30, fontFamily: 'Lora_700Bold', textAlign: 'center', lineHeight: 40, marginBottom: 16 }}>
                Loving Yoke so far?
              </Text>
              <Text style={{ color: DIM, fontSize: 16, fontFamily: 'Nunito_400Regular', textAlign: 'center', lineHeight: 26, paddingHorizontal: 8 }}>
                A quick review helps more people find Yoke and grow in their faith. It only takes a second and means the world to us.
              </Text>
            </View>
            <View>
              <Btn label="Leave a Review  ⭐" onPress={handleReview} />
              <Btn label="Not right now" onPress={() => advance(S_PAYWALL)} secondary />
            </View>
          </View>
        );

      case S_PAYWALL:
        return (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[px, pb, { paddingTop: 16 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: 'rgba(245,200,66,0.15)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 24,
            }}>
              <StarIcon size={36} color={GOLD} />
            </View>

            <Text style={{ color: CREAM, fontSize: 30, fontFamily: 'Lora_700Bold', lineHeight: 40, marginBottom: 10 }}>
              One last thing...
            </Text>
            <Text style={{ fontSize: 16, fontFamily: 'Nunito_400Regular', lineHeight: 26, marginBottom: 20 }}>
              <Text style={{ color: CREAM, fontFamily: 'Nunito_700Bold' }}>Yoke is free to use.</Text>
              <Text style={{ color: DIM }}>{' '}Premium helps keep it running and unlocks:</Text>
            </Text>
            <View style={{ marginBottom: 28, gap: 12 }}>
              {([
                [StreakIcon, 'Streak tracking'],
                [FriendsIcon, 'Unlimited groups'],
                [CalendarIcon, 'Full calendar history'],
              ] as const).map(([Icon, label]) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(245,200,66,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={GOLD} />
                  </View>
                  <Text style={{ color: CREAM, fontSize: 15, fontFamily: 'Nunito_600SemiBold' }}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Annual card */}
            <TouchableOpacity
              onPress={() => setPlan('annual')}
              activeOpacity={0.8}
              style={{
                borderRadius: 16, borderWidth: 2, padding: 20, marginBottom: 12,
                borderColor: plan === 'annual' ? GOLD : 'rgba(255,255,255,0.15)',
                backgroundColor: plan === 'annual' ? 'rgba(245,200,66,0.07)' : SURF,
              }}
            >
              <View style={{
                position: 'absolute', top: -12, right: 16,
                backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100,
              }}>
                <Text style={{ color: '#1A1A1A', fontSize: 11, fontFamily: 'Nunito_700Bold' }}>BEST VALUE</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: CREAM, fontSize: 17, fontFamily: 'Nunito_700Bold' }}>Annual</Text>
                  <Text style={{ color: DIM, fontSize: 13, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>Billed once a year</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: plan === 'annual' ? GOLD : CREAM, fontSize: 22, fontFamily: 'Nunito_700Bold' }}>
                    {priceStr('annual')}
                  </Text>
                  <Text style={{ color: DIM, fontSize: 12, fontFamily: 'Nunito_400Regular' }}>per year</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Monthly card */}
            <TouchableOpacity
              onPress={() => setPlan('monthly')}
              activeOpacity={0.8}
              style={{
                borderRadius: 16, borderWidth: 2, padding: 20, marginBottom: 32,
                borderColor: plan === 'monthly' ? GOLD : 'rgba(255,255,255,0.15)',
                backgroundColor: plan === 'monthly' ? 'rgba(245,200,66,0.07)' : SURF,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: CREAM, fontSize: 17, fontFamily: 'Nunito_700Bold' }}>Monthly</Text>
                  <Text style={{ color: DIM, fontSize: 13, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
                    Billed monthly, cancel anytime
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: plan === 'monthly' ? GOLD : CREAM, fontSize: 22, fontFamily: 'Nunito_700Bold' }}>
                    {priceStr('monthly')}
                  </Text>
                  <Text style={{ color: DIM, fontSize: 12, fontFamily: 'Nunito_400Regular' }}>per month</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePurchase}
              disabled={purchasing}
              activeOpacity={0.85}
              style={{
                backgroundColor: purchasing ? 'rgba(245,200,66,0.5)' : GOLD,
                borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 14,
              }}
            >
              <Text style={{ color: '#1A1A1A', fontSize: 17, fontFamily: 'Nunito_700Bold' }}>
                {purchasing ? 'Processing…' : 'Start Premium'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => advance(S_DONE)}
              activeOpacity={0.65}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: DIM, fontSize: 15, fontFamily: 'Nunito_400Regular' }}>Maybe Later</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 6 }}>
              <TouchableOpacity onPress={() => Linking.openURL('https://yokefaith.com/privacy')} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Nunito_400Regular' }}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>·</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://yokefaith.com/terms')} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Nunito_400Regular' }}>Terms of Use</Text>
              </TouchableOpacity>
            </View>

            <Text style={{
              color: 'rgba(255,255,255,0.22)', fontSize: 11,
              fontFamily: 'Nunito_400Regular', textAlign: 'center', marginTop: 4, lineHeight: 18,
            }}>
              Cancel anytime · Prices in your local currency{'\n'}Payment charged to your Apple ID at confirmation. Subscription auto-renews unless cancelled 24 hours before the end of the current period.
            </Text>
          </ScrollView>
        );

      case S_DONE:
        return (
          <View style={[{ flex: 1 }, px, pb]}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{
                width: 132, height: 132, borderRadius: 66,
                backgroundColor: 'rgba(245,200,66,0.08)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 44,
              }}>
                <View style={{
                  width: 90, height: 90, borderRadius: 45,
                  backgroundColor: 'rgba(245,200,66,0.2)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckIcon size={44} color={GOLD} />
                </View>
              </View>
              <Text style={{ color: CREAM, fontSize: 36, fontFamily: 'Lora_700Bold', textAlign: 'center', lineHeight: 46, marginBottom: 18 }}>
                You're all set!
              </Text>
              <Text style={{ color: DIM, fontSize: 17, fontFamily: 'Nunito_400Regular', textAlign: 'center', lineHeight: 28, paddingHorizontal: 4 }}>
                Welcome to the Yoke community. Your journey starts today. Open the app each morning and let the Word guide your day.
              </Text>
            </View>
            <Btn label="Let's Go!" onPress={handleFinish} />
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Progress bar */}
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 24, paddingBottom: 10 }}>
        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <Animated.View style={[{ height: 4, backgroundColor: GOLD, borderRadius: 2 }, barStyle]} />
        </View>
      </View>

      {/* Animated content */}
      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        {renderStep()}
      </Animated.View>
    </View>
  );
}
