// app/onboarding.tsx
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, IRISH_COUNTIES, PHASES, PhaseLevel, TRADES, TradeType, UserRole } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();

  const [role, setRole] = useState<UserRole>('apprentice');
  const [fullName, setFullName] = useState('');
  const [county, setCounty] = useState('Sligo');

  const [trade, setTrade] = useState<TradeType>('electrical');
  const [phase, setPhase] = useState<PhaseLevel>('phase_2');
  const [safepassExpiry, setSafepassExpiry] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCompleteOnboarding = async () => {
    if (!user) return;
    if (!fullName.trim()) return Alert.alert('Required', 'Please enter your full name.');
    if (role === 'employer' && !companyName.trim()) return Alert.alert('Required', 'Please enter your company name.');

    setSubmitting(true);
    try {
      const payload = {
        id: user.id,
        email: user.email!,
        full_name: fullName.trim(),
        role,
        county,
        trade: role !== 'employer' ? trade : null,
        current_phase: role === 'apprentice' ? phase : (role === 'qualified_pro' ? 'qualified' as PhaseLevel : null),
        safepass_expiry: safepassExpiry.trim() || null,
        company_name: role === 'employer' ? companyName.trim() : null,
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;

      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Onboarding Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.stepLabel}>STEP 1 OF 1 • ACCOUNT SETUP</Text>
      <Text style={styles.header}>Set Up Your TradeNet Profile</Text>

      <Text style={styles.sectionTitle}>1. Select Your Role</Text>
      <View style={styles.pillRow}>
        {[
          { label: 'Apprentice', value: 'apprentice' as UserRole },
          { label: 'Qualified Pro', value: 'qualified_pro' as UserRole },
          { label: 'Employer', value: 'employer' as UserRole },
        ].map((item) => (
          <TouchableOpacity key={item.value} style={[styles.pill, role === item.value && styles.pillActive]} onPress={() => setRole(item.value)}>
            <Text style={[styles.pillText, role === item.value && styles.pillTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>2. Your Details</Text>
      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} placeholder="e.g. Sean Gallagher" placeholderTextColor={COLORS.textSecondary} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>County (Base Location) *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {IRISH_COUNTIES.slice(0, 12).map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, county === c && styles.chipActive]} onPress={() => setCounty(c)}>
            <Text style={[styles.chipText, county === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {role !== 'employer' ? (
        <>
          <Text style={styles.sectionTitle}>3. Trade & Training</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {TRADES.map((t) => (
              <TouchableOpacity key={t.value} style={[styles.chip, trade === t.value && styles.chipActive]} onPress={() => setTrade(t.value)}>
                <Text style={[styles.chipText, trade === t.value && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {role === 'apprentice' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {PHASES.filter(p => p.value !== 'qualified').map((p) => (
                <TouchableOpacity key={p.value} style={[styles.chip, phase === p.value && styles.chipActive]} onPress={() => setPhase(p.value)}>
                  <Text style={[styles.chipText, phase === p.value && styles.chipTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          <Text style={styles.label}>SafePass Expiry (YYYY-MM-DD) - Optional</Text>
          <TextInput style={styles.input} placeholder="2027-06-15" placeholderTextColor={COLORS.textSecondary} value={safepassExpiry} onChangeText={setSafepassExpiry} />
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>3. Contractor Details</Text>
          <Text style={styles.label}>Company Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Apex Electrical Ltd" placeholderTextColor={COLORS.textSecondary} value={companyName} onChangeText={setCompanyName} />
        </>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleCompleteOnboarding} disabled={submitting}>
        <Text style={styles.submitBtnText}>{submitting ? 'Saving...' : 'Launch TradeNet Ireland →'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  stepLabel: { color: COLORS.safetyAmber, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  header: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 4, marginBottom: 20 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: COLORS.surface, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 6 },
  pillActive: { backgroundColor: COLORS.primaryBlue, borderColor: COLORS.primaryBlue },
  pillText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
  pillTextActive: { color: COLORS.textPrimary },
  horizontalScroll: { flexDirection: 'row', marginBottom: 8 },
  chip: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  chipActive: { borderColor: COLORS.safetyAmber, backgroundColor: '#292524' },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: COLORS.safetyAmber },
  submitBtn: { backgroundColor: COLORS.safetyAmber, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  submitBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
});