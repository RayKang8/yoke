import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  useColorScheme, Alert, Linking, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { scheduleDailyReminder, cancelDailyReminder } from '../lib/notifications';
import { restorePurchases, getOfferings, logOutRevenueCat } from '../lib/revenuecat';
import { analytics } from '../lib/posthog';
import { colors } from '../constants/theme';
import { Translation } from '../types';
import { PaywallSheet } from '../components/PaywallSheet';
import { usePremium } from '../hooks/usePremium';
import { BackIcon, ChevronRightIcon, CheckIcon } from '../components/icons';
import { TimePickerModal } from '../components/TimePickerModal';
import { isIPad } from '../lib/platform';

const PRIVACY_URL = 'https://yokefaith.com/privacy';
const TERMS_URL   = 'https://yokefaith.com/terms';

const TRANSLATIONS: Translation[] = ['NIV', 'ESV', 'KJV', 'NLT', 'NKJV', 'BSB', 'ASV', 'WEB', 'YLT'];


export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState('');
  const [reminderTime, setReminderTime] = useState('8:00 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
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
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? '';
    setUserId(uid);
    const [[, timePerUser], [, timeLegacy], [, transPerUser], [, transLegacy]] = await AsyncStorage.multiGet([
      `reminderTime_${uid}`,
      'reminderTime',
      `defaultTranslation_${uid}`,
      'defaultTranslation',
    ]);
    const time = timePerUser ?? timeLegacy;
    const trans = transPerUser ?? transLegacy;
    if (time) setReminderTime(time);
    if (trans) setDefaultTranslation(trans as Translation);
  }

  async function handleRestorePurchases() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      const active = Object.keys(info.entitlements.active ?? {}).length > 0;
      if (active) {
        analytics.capture('subscription_restored');
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

  async function handleTimeConfirm(time: string) {
    setReminderTime(time);
    setShowTimePicker(false);
    if (!userId) return;
    await AsyncStorage.setItem(`reminderTime_${userId}`, time);
    await scheduleDailyReminder(time);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your devotionals. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              Alert.alert('Error', 'Your session has expired. Please log in again.');
              return;
            }
            const { error } = await supabase.rpc('delete_user');
            if (error) {
              Alert.alert('Error', `Could not delete account: ${error.message}`);
              return;
            }
            // Delete avatar from storage
            await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`]);
            // Cancel scheduled reminder
            await cancelDailyReminder();
            // Reset RevenueCat identity
            await logOutRevenueCat();
            // Clear all local state
            await AsyncStorage.multiRemove([
              'onboarding_done',
              `onboarding_done_${user.id}`,
              'post_confirm_goto_login',
              'pending_email',
              'reminderTime',
              `reminderTime_${user.id}`,
              'defaultTranslation',
              `defaultTranslation_${user.id}`,
              'postAudiences',
              `postAudiences_${user.id}`,
              'bibleBook',
              `bibleBook_${user.id}`,
              'bibleChapter',
              `bibleChapter_${user.id}`,
              'bibleTranslation',
              `bibleTranslation_${user.id}`,
            ]);
            analytics.capture('account_deleted');
            await supabase.auth.signOut({ scope: 'local' });
            analytics.reset();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  }

  async function handleLogout() {
    analytics.reset();
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
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40, ...(isIPad && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }) }}
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
        onPress={() => setShowTimePicker(true)}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>{reminderTime}</Text>
        <ChevronRightIcon size={18} color={c.textSecondary} />
      </TouchableOpacity>

      {/* Default translation */}
      <SectionHeader label="DEFAULT TRANSLATION" />
      {TRANSLATIONS.map(t => (
        <OptionRow key={t} label={t} selected={defaultTranslation === t}
          onPress={() => { setDefaultTranslation(t); AsyncStorage.setItem(`defaultTranslation_${userId}`, t); }}
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

    <TimePickerModal
      visible={showTimePicker}
      initialTime={reminderTime}
      onConfirm={handleTimeConfirm}
      onCancel={() => setShowTimePicker(false)}
    />
    </>
  );
}
