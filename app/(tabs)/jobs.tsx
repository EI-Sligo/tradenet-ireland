// app/(tabs)/jobs.tsx
import { MapPin, Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

export default function JobsScreen() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(true);
  
  // Post Job Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [county, setCounty] = useState('');
  const [trade, setTrade] = useState('electrical');

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setJobs(data);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handlePostJob = async () => {
    if (!title || !description || !county || !profile) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const { error } = await supabase.from('jobs').insert({
      employer_id: profile.id,
      title,
      description,
      county,
      target_trade: trade,
      safepass_required: true,
    });

    if (error) {
      Alert.alert('Error', 'Could not post job. Try again.');
    } else {
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setCounty('');
      fetchJobs();
    }
  };

  const applyForJob = async (jobId: string) => {
    if (!profile) return;

    const { error } = await supabase.from('job_applications').insert({
      job_id: jobId,
      applicant_id: profile.id,
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Already Applied', 'You have already submitted an application for this position.');
      } else {
        Alert.alert('Error', 'Could not submit application.');
      }
    } else {
      Alert.alert('Success', 'Application sent to the employer!');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.tradeBadge}>{item.target_trade.replace(/_/g, ' ').toUpperCase()}</Text>
      </View>
      <Text style={styles.jobDesc} numberOfLines={3}>{item.description}</Text>
      
      <View style={styles.jobFooter}>
        <View style={styles.locationRow}>
          <MapPin size={14} color={COLORS.textSecondary} />
          <Text style={styles.locationText}>Co. {item.county}</Text>
        </View>

        {profile?.role === 'apprentice' && (
          <TouchableOpacity style={styles.applyBtn} onPress={() => applyForJob(item.id)}>
            <Text style={styles.applyText}>Apply Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header action for employers */}
      {profile?.role === 'employer' && (
        <View style={styles.headerAction}>
          <TouchableOpacity style={styles.postJobBtn} onPress={() => setModalVisible(true)}>
            <Plus size={20} color="#000" />
            <Text style={styles.postJobBtnText}>Post New Vacancy</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} tintColor={COLORS.primaryBlue} />}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No open apprenticeship positions right now.</Text>
            </View>
          ) : <View />
        }
      />

      {/* Post Job Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post an Apprenticeship</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Job Title (e.g. Phase 2 Electrical Apprentice)" placeholderTextColor={COLORS.textSecondary} value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="County (e.g. Sligo)" placeholderTextColor={COLORS.textSecondary} value={county} onChangeText={setCounty} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Description & Requirements..." placeholderTextColor={COLORS.textSecondary} multiline value={description} onChangeText={setDescription} />

            <TouchableOpacity style={styles.submitBtn} onPress={handlePostJob}>
              <Text style={styles.submitBtnText}>Publish Listing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerAction: { padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'flex-end' },
  postJobBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.safetyAmber, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
  postJobBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },

  listContent: { padding: 16 },
  jobCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  jobTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', flex: 1, marginRight: 8 },
  tradeBadge: { color: COLORS.safetyAmber, fontSize: 11, fontWeight: '700' },
  jobDesc: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 16, lineHeight: 20 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.background, paddingTop: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  applyBtn: { backgroundColor: COLORS.primaryBlue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  applyText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  input: { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.safetyAmber, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});