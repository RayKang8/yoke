import { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ActivityIndicator,
  useColorScheme, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import type { Offerings } from 'react-native-purchases';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/revenuecat';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPurchased: () => void;
}

const PREMIUM_FEATURES = [
  'Unlimited groups',
  'Full calendar history (all time)',
  'See exactly who reacted to your posts',
  'Group streak tracking & stats',
  'Activity nudge notifications',
];

export function PaywallSheet({ visible, onClose, onPurchased }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (visible) loadOfferings();
  }, [visible]);

  async function loadOfferings() {
    setLoading(true);
    const data = await getOfferings();
    setOfferings(data);
    setLoading(false);
  }

  function getPackage(type: 'monthly' | 'annual') {
    const current = offerings?.current;
    if (!current) return null;
    return type === 'monthly'
      ? current.monthly ?? current.availablePackages.find(p => p.packageType === 'MONTHLY') ?? null
      : current.annual ?? current.availablePackages.find(p => p.packageType === 'ANNUAL') ?? null;
  }

  async function handlePurchase() {
    const pkg = getPackage(selected);
    if (!pkg) {
      Alert.alert('Not available', 'In-app purchases are not available in Expo Go. Build with EAS to test purchases.');
      return;
    }
    setPurchasing(true);
    try {
      await purchasePackage(pkg);
      onPurchased();
      onClose();
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message);
    }
    setPurchasing(false);
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      const active = Object.keys(info.entitlements.active ?? {}).length > 0;
      if (active) {
        Alert.alert('Restored!', 'Your Yoke Premium subscription has been restored.');
        onPurchased();
        onClose();
      } else {
        Alert.alert('Nothing to restore', 'No active subscription found for this account.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message);
    }
    setRestoring(false);
  }

  const monthlyPkg = getPackage('monthly');
  const annualPkg = getPackage('annual');
  const monthlyPrice = monthlyPkg?.product.priceString ?? '$4.99';
  const annualPrice = annualPkg?.product.priceString ?? '$49.99';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {/* Header */}
        <View style={{ borderBottomColor: c.border, borderBottomWidth: 1 }}
          className="flex-row items-center justify-between px-5 py-4"
        >
          <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600' }}>Yoke Premium</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}>
          {/* Headline */}
          <Text style={{ color: c.textPrimary, fontSize: 26, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
            Go deeper together.
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
            Help keep Yoke running — faith communities like yours make this possible.
          </Text>

          {/* Features */}
          <View style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 20, marginBottom: 24 }}>
            {PREMIUM_FEATURES.map(f => (
              <View key={f} className="flex-row items-center gap-3 mb-3">
                <View style={{ backgroundColor: c.accent, width: 22, height: 22, borderRadius: 11 }} className="items-center justify-center">
                  <Text style={{ color: '#1A1A1A', fontSize: 12, fontWeight: '700' }}>✓</Text>
                </View>
                <Text style={{ color: c.textPrimary, fontSize: 15 }}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Plan selector */}
          {loading ? (
            <ActivityIndicator color={c.accent} style={{ marginVertical: 20 }} />
          ) : (
            <View className="gap-3 mb-6">
              {/* Annual — highlighted */}
              <TouchableOpacity
                onPress={() => setSelected('annual')}
                style={{
                  borderRadius: 16, borderWidth: 2,
                  borderColor: selected === 'annual' ? c.accent : c.border,
                  backgroundColor: selected === 'annual' ? c.accent + '11' : c.surface,
                  padding: 18,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '700' }}>Annual</Text>
                      <View style={{ backgroundColor: c.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: '#1A1A1A', fontSize: 11, fontWeight: '700' }}>BEST VALUE</Text>
                      </View>
                    </View>
                    <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                      {annualPrice}/year · save 17% vs monthly
                    </Text>
                  </View>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 2, borderColor: selected === 'annual' ? c.accent : c.border,
                    backgroundColor: selected === 'annual' ? c.accent : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected === 'annual' && <Text style={{ color: '#1A1A1A', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Monthly */}
              <TouchableOpacity
                onPress={() => setSelected('monthly')}
                style={{
                  borderRadius: 16, borderWidth: 2,
                  borderColor: selected === 'monthly' ? c.accent : c.border,
                  backgroundColor: selected === 'monthly' ? c.accent + '11' : c.surface,
                  padding: 18,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 1 }}>Monthly</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 13 }}>{monthlyPrice}/month</Text>
                  </View>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 2, borderColor: selected === 'monthly' ? c.accent : c.border,
                    backgroundColor: selected === 'monthly' ? c.accent : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected === 'monthly' && <Text style={{ color: '#1A1A1A', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Purchase button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing}
            style={{ backgroundColor: c.accent, borderRadius: 14 }}
            className="py-4 items-center mb-3"
          >
            {purchasing
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '600' }}>
                  {selected === 'annual' ? `Get Annual · ${annualPrice}/yr` : `Get Monthly · ${monthlyPrice}/mo`}
                </Text>
            }
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity onPress={handleRestore} disabled={restoring} className="items-center py-3">
            {restoring
              ? <ActivityIndicator color={c.textSecondary} size="small" />
              : <Text style={{ color: c.textSecondary, fontSize: 14 }}>Restore Purchases</Text>
            }
          </TouchableOpacity>

          <Text style={{ color: c.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
            Payment charged to your App Store / Google Play account. Cancel anytime in your account settings.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
