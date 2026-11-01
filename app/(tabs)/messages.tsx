// app/(tabs)/messages.tsx
import { useRouter } from 'expo-router';
import { Briefcase, MapPin, MessageSquare, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface TalentProfile {
  id: string;
  full_name: string;
  trade: string;
  current_phase: string;
  county: string;
  training_institution: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'messages' | 'talent'>('talent');
  const [talentPool, setTalentPool] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTalentPool = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, trade, current_phase, county, training_institution')
      .eq('role', 'apprentice')
      .eq('seeking_sponsor', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTalentPool(data as TalentProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'talent') {
      fetchTalentPool();
    }
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Network & Placements</Text>
        <Text style={styles.headerSubtitle}>Direct Messages & Talent Search</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'talent' && styles.tabBtnActive]}
          onPress={() => setActiveTab('talent')}
        >
          <Search color={activeTab === 'talent' ? COLORS.textPrimary : COLORS.textSecondary} size={18} />
          <Text style={[styles.tabText, activeTab === 'talent' && styles.tabTextActive]}>Talent Pool</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'messages' && styles.tabBtnActive]}
          onPress={() => setActiveTab('messages')}
        >
          <MessageSquare color={activeTab === 'messages' ? COLORS.textPrimary : COLORS.textSecondary} size={18} />
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>Messages</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'talent' ? (
        <FlatList
          data={talentPool}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={fetchTalentPool}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
  !loading ? (
    <Text style={styles.emptyText}>No apprentices are currently seeking sponsorship.</Text>
  ) : <View />
}
          renderItem={({ item }) => (
            <View style={styles.talentCard}>
              <View style={styles.talentHeader}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.talentName}>{item.full_name}</Text>
<Text style={styles.talentTrade}>
  {item.trade.toUpperCase()} • {item.current_phase.replace('_', ' ').toUpperCase()}
</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <MapPin color={COLORS.textSecondary} size={14} />
                <Text style={styles.metaText}>Co. {item.county}</Text>
              </View>
              
              {item.training_institution && (
                <View style={styles.metaRow}>
                  <Briefcase color={COLORS.textSecondary} size={14} />
                  <Text style={styles.metaText}>{item.training_institution}</Text>
                </View>
              )}

              {(profile?.role === 'employer' || profile?.role === 'qualified_pro') && (
                <TouchableOpacity 
                  style={styles.messageBtn}
                  onPress={() => router.push(`/chat/${item.id}` as any)}
                >
                  <Text style={styles.messageBtnText}>Send Direct Message</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <MessageSquare color={COLORS.border} size={48} />
          <Text style={styles.emptyText}>Your inbox is currently empty.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 60, paddingBottom: 10 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' },
  headerSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 12 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  tabBtnActive: { backgroundColor: '#292524', borderColor: COLORS.safetyAmber },
  tabText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: COLORS.safetyAmber },
  listContent: { padding: 20, paddingBottom: 80 },
  talentCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  talentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryBlue, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  talentName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  talentTrade: { color: COLORS.safetyAmber, fontSize: 12, fontWeight: '700', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  metaText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  messageBtn: { backgroundColor: COLORS.safetyAmber, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  messageBtnText: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 16, lineHeight: 22 },
});