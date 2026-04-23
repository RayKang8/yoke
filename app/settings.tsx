import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  useColorScheme, Alert, Linking, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const PRIVACY_URL = 'https://yokefaith.com/privacy';
const TERMS_URL   = 'https://yokefaith.com/terms';
import { scheduleDailyReminder } from '../lib/notifications';
import { colors } from '../constants/theme';
import { Translation } from '../types';
import { PaywallSheet } from '../components/PaywallSheet';
import { usePremium } from '../hooks/usePremium';

const TRANSLATIONS: Translation[] = ['KJV', 'ESV', 'BSB', 'ASV', 'WEB', 'YLT'];
const REMINDER_TIMES = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '6:00 PM', '8:00 PM'];

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [reminderTime, setReminderTime] = useState('8:00 AM');
  const [defaultTranslation, setDefaultTranslation] = useState<Translation>('NIV');
  const [defaultAudiences, setDefaultAudiences] = useState<Set<string>>(new Set(['friends']));
  const [showPaywall, setShowPaywall] = useState(false);
  const { isPremium, isTrialActive, trialDaysLeft, recheck } = usePremium();

  useEffect(() => { load(); }, []);

  async function load() {
    const [time, trans, audiences] = await Promise.all([
      AsyncStorage.getItem('reminderTime'),
      AsyncStorage.getItem('defaultTranslation'),
      AsyncStorage.getItem('postAudiences'),
    ]);
    if (time) setReminderTime(time);
    if (trans && (TRANSLATIONS as string[]).includes(trans)) setDefaultTranslation(trans as Translation);
    if (audiences) {
      try { setDefaultAudiences(new Set(JSON.parse(audiences))); } catch {}
    }
  }

  async function setSetting(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  function handleManageSubscription() {
    const url = Platform.OS === 'ios'
      ? 'itms-apps://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions?sku=yoke_premium_monthly&package=com.yoke.app';
    Linking.openURL(url);
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
            await supabase.auth.signOut();
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
        {selected && <Text style={{ color: c.accent, fontWeight: '700' }}>✓</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40 }}
    >
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <Text style={{ color: c.textSecondary, fontSize: 16 }}>← Profile</Text>
      </TouchableOpacity>

      <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>Settings</Text>

      {/* Subscription */}
      <SectionHeader label="SUBSCRIPTION" />
      <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 8 }}>
        {isPremium && !isTrialActive ? (
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: c.accent, fontWeight: '700', fontSize: 16 }}>Yoke Premium ✓</Text>
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
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>$4.99/mo or $49.99/yr</Text>
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
      <View className="flex-row flex-wrap gap-2 mb-4">
        {REMINDER_TIMES.map(t => (
          <TouchableOpacity key={t} onPress={async () => { setReminderTime(t); await setSetting('reminderTime', t); await scheduleDailyReminder(t); }}
            style={{ backgroundColor: reminderTime === t ? c.accent : c.surface, borderColor: reminderTime === t ? c.accent : c.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}
          >
            <Text style={{ color: reminderTime === t ? '#1A1A1A' : c.textPrimary, fontWeight: reminderTime === t ? '600' : '400', fontSize: 14 }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Default translation */}
      <SectionHeader label="DEFAULT TRANSLATION" />
      {TRANSLATIONS.map(t => (
        <OptionRow key={t} label={t} selected={defaultTranslation === t}
          onPress={() => { setDefaultTranslation(t); setSetting('defaultTranslation', t); }}
        />
      ))}

      {/* Default post audiences */}
      <SectionHeader label="DEFAULT POST TO" />
      <OptionRow
        label="Only Me"
        selected={defaultAudiences.size === 0}
        onPress={() => { setDefaultAudiences(new Set()); AsyncStorage.setItem('postAudiences', JSON.stringify([])); }}
      />
      {[{ key: 'friends', label: 'Friends' }, { key: 'public', label: 'Public' }].map(({ key, label }) => (
        <OptionRow key={key} label={label} selected={defaultAudiences.has(key)}
          onPress={() => {
            setDefaultAudiences(prev => {
              const next = new Set(prev);
              next.has(key) ? next.delete(key) : next.add(key);
              AsyncStorage.setItem('postAudiences', JSON.stringify([...next]));
              return next;
            });
          }}
        />
      ))}

      {/* Legal */}
      <SectionHeader label="LEGAL" />
      <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 }}
        className="flex-row items-center justify-between"
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>Privacy Policy</Text>
        <Text style={{ color: c.textSecondary, fontSize: 18 }}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}
        style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 10 }}
        className="flex-row items-center justify-between"
      >
        <Text style={{ color: c.textPrimary, fontSize: 16 }}>Terms of Service</Text>
        <Text style={{ color: c.textSecondary, fontSize: 18 }}>›</Text>
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
    </>
  );
}
