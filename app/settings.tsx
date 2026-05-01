import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  useColorScheme, Alert, Linking, Platform, Modal, Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { scheduleDailyReminder } from '../lib/notifications';
import { restorePurchases, getOfferings } from '../lib/revenuecat';
import { colors } from '../constants/theme';
import { Translation } from '../types';
import { PaywallSheet } from '../components/PaywallSheet';
import { usePremium } from '../hooks/usePremium';
import { BackIcon, ChevronRightIcon, CheckIcon } from '../components/icons';

const PRIVACY_URL = 'https://yokefaith.com/privacy';
const TERMS_URL   = 'https://yokefaith.com/terms';

const TRANSLATIONS: Translation[] = ['NIV', 'ESV', 'KJV', 'NLT', 'NKJV', 'BSB', 'ASV', 'WEB', 'YLT'];

function parseTimeString(str: string): Date {
  const [time, period] = str.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTimeDate(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [reminderTime, setReminderTime] = useState('8:00 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());
  const [defaultTranslation, setDefaultTranslation] = useState<Translation>('NIV');
  const [showPaywall, setShowPaywall] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [planPrices, setPlanPrices] = useState<{ monthly: string; annual: string } | null>(null);
  const { isPremium, isTrialActive, trialDaysLeft, recheck } = usePremium();

  useEffect(() => {
    load();
    getOfferings().then(data => {
      const current = data?.current;
      if (!current) return;
      const monthly = current.monthly ?? current.availablePackages.find((p: any) => p.packageType === 'MONTHLY');
      const annual  = current.annual  ?? current.availablePackages.find((p: any) => p.packageType === 'ANNUAL');
      if (monthly && annual) {
        setPlanPrices({ monthly: monthly.product.priceString, annual: annual.product.priceString });
      }
    });
  }, []);

  async function load() {
    const [time, trans] = await Promise.all([
      AsyncStorage.getItem('reminderTime'),
      AsyncStorage.getItem('defaultTranslation'),
    ]);
    if (time) setReminderTime(time);
    if (trans) setDefaultTranslation(trans as Translation);
  }

  async function setSetting(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  async function handleRestorePurchases() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      const active = Object.keys(info.entitlements.active ?? {}).length > 0;
      if (active) {
        Alert.alert('Restored!', 'Your Yoke Premium subscription has been restored.');
        recheck();
      } else {
        Alert.alert('Nothing to restore', 'No active subscription found for this Apple ID or Google account.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message ?? 'Something went wrong.');
    }
    setRestoring(false);
  }

  async function handleManageSubscription() {
    if (Platform.OS === 'ios') {
      const native = 'itms-apps://apps.apple.com/account/subscriptions';
      const web = 'https://apps.apple.com/account/subscriptions';
      const canOpen = await Linking.canOpenURL(native);
      Linking.openURL(canOpen ? native : web);
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions?sku=yoke_premium_monthly&package=com.yokefaith.app');
    }
  }

  function openTimePicker() {
    setPendingDate(parseTimeString(reminderTime));
    setShowTimePicker(true);
  }

  async function handleTimeConfirm() {
    const formatted = formatTimeDate(pendingDate);
    setReminderTime(formatted);
    setShowTimePicker(false);
    await setSetting('reminderTime', formatted);
    await scheduleDailyReminder(formatted);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your devotionals. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const { error } = await supabase.rpc('delete_user');
            if (error) {
              Alert.alert('Error', `Could not delete account: ${error.message}`);
              return;
            }
            await supabase.auth.signOut({ scope: 'local' });
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
  }

  function SectionHeader({ label }: { label: string }) {
    return <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 24 }}>{label}</Text>;
  }

  function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
      <TouchableOpacity onPress={onPress}
        style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: selected ? c.accent : c.border, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ color: c.textPrimary, fontSize: 15 }}>{label}</Text>
        {selected && <CheckIcon size={16} color={c.accent} />}
      </TouchableOpacity>
    );
  }

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40 }}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 }}>
        <BackIcon size={16} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>Profile</Text>
      </TouchableOpacity>

      <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>Settings</Text>

      {/* Subscription */}
      <SectionHeader label="SUBSCRIPTION" />
      <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 8 }}>
        {isPremium && !isTrialActive ? (
          <View className="flex-row items-center justify-between">
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: c.accent, fontWeight: '700', fontSize: 16 }}>Yoke Premium</Text>
                <CheckIcon size={14} color={c.accent} />
              </View>
              <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 2 }}>Active subscription</Text>
            </View>
            <TouchableOpacity onPress={handleManageSubscription}
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>Manage</Text>
            </TouchableOpacity>
          </View>
        ) : isTrialActive ? (
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: c.accent, fontWeight: '700', fontSize: 16 }}>Free Trial</Text>
              <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 2 }}>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPaywall(true)}
              style={{ backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 16 }}>Free Tier</Text>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                {planPrices ? `${planPrices.monthly}/mo or ${planPrices.annual}/yr` : 'Monthly & Annual plans available'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowPaywall(true)}
              style={{ backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notification time */}
      <SectionHeader label="DAILY REMINDER TIME" />
      <TouchableOpacity
        onPress={openTimePicker}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>{reminderTime}</Text>
        <ChevronRightIcon size={18} color={c.textSecondary} />
      </TouchableOpacity>

      {/* Default translation */}
      <SectionHeader label="DEFAULT TRANSLATION" />
      {TRANSLATIONS.map(t => (
        <OptionRow key={t} label={t} selected={defaultTranslation === t}
          onPress={() => { setDefaultTranslation(t); setSetting('defaultTranslation', t); }}
        />
      ))}

      {/* Restore purchases */}
      {!isPremium && (
        <>
          <SectionHeader label="PURCHASES" />
          <TouchableOpacity onPress={handleRestorePurchases} disabled={restoring}
            style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 8 }}
            className="flex-row items-center justify-between"
          >
            <Text style={{ color: c.textPrimary, fontSize: 16 }}>Restore Purchases</Text>
            {restoring
              ? <ActivityIndicator size="small" color={c.accent} />
              : <ChevronRightIcon size={18} color={c.textSecondary} />
            }
          </TouchableOpacity>
        </>
      )}

      {/* Notifications */}
      <SectionHeader label="NOTIFICATIONS" />
      <TouchableOpacity onPress={() => Linking.openSettings()}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 8 }}
        className="flex-row items-center justify-between"
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>Manage Notification Permissions</Text>
        <ChevronRightIcon size={18} color={c.textSecondary} />
      </TouchableOpacity>

      {/* Support */}
      <SectionHeader label="SUPPORT" />
      <TouchableOpacity onPress={() => Linking.openURL('mailto:contact@yokefaith.com')}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 }}
        className="flex-row items-center justify-between"
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>Contact Support</Text>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>contact@yokefaith.com</Text>
      </TouchableOpacity>

      {/* Legal */}
      <SectionHeader label="LEGAL" />
      <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 }}
        className="flex-row items-center justify-between"
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>Privacy Policy</Text>
        <ChevronRightIcon size={18} color={c.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 }}
        className="flex-row items-center justify-between"
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>Terms of Service</Text>
        <ChevronRightIcon size={18} color={c.textSecondary} />
      </TouchableOpacity>

      {/* Account */}
      <SectionHeader label="ACCOUNT" />

      <TouchableOpacity onPress={handleLogout}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 }}
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleDeleteAccount}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: '#FF4444', padding: 16 }}
      >
        <Text style={{ color: '#FF4444', fontSize: 16 }}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>

    <PaywallSheet
      visible={showPaywall}
      onClose={() => setShowPaywall(false)}
      onPurchased={() => { setShowPaywall(false); recheck(); }}
    />

    <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowTimePicker(false)} />
      <View style={{ backgroundColor: c.surface, paddingBottom: insets.bottom + 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <TouchableOpacity onPress={() => setShowTimePicker(false)}>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ color: c.textPrimary, fontSize: 16, fontWeight: '600' }}>Reminder Time</Text>
          <TouchableOpacity onPress={handleTimeConfirm}>
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>Done</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={pendingDate}
          mode="time"
          display="spinner"
          onChange={(_, date) => { if (date) setPendingDate(date); }}
          {...(Platform.OS === 'ios' ? { textColor: scheme === 'dark' ? '#FFFFFF' : '#1A1A1A' } : {})}
          style={{ height: 216, width: '100%' }}
        />
      </View>
    </Modal>
    </>
  );
}
