// app/(tabs)/profile.tsx
import { AlertTriangle, Award, Briefcase, CheckCircle, LogOut, MapPin, MoreVertical, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

interface PortfolioPost {
  id: string;
  media_url: string;
  is_endorsed: boolean;
}

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const [posts, setPosts] = useState<PortfolioPost[]>([]);
  const [seekingSponsor, setSeekingSponsor] = useState(profile?.seeking_sponsor ?? false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setSeekingSponsor(profile.seeking_sponsor);
      fetchPortfolio();
    }
  }, [profile]);

  const fetchPortfolio = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('posts')
      .select('id, media_url, post_endorsements(id)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const formattedPosts = data.map((post: any) => ({
        id: post.id,
        media_url: post.media_url,
        is_endorsed: post.post_endorsements && post.post_endorsements.length > 0,
      }));
      setPosts(formattedPosts);
    }
    setLoading(false);
  };

  const toggleSponsorStatus = async (value: boolean) => {
    setSeekingSponsor(value);
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ seeking_sponsor: value })
      .eq('id', profile.id);

    if (error) {
      Alert.alert('Error', 'Could not update status.');
      setSeekingSponsor(!value);
    }
  };

  const handlePostOptions = (postId: string) => {
    Alert.alert(
      'Post Options',
      'What would you like to do with this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Post', 
          style: 'destructive', 
          onPress: () => deletePost(postId) 
        }
      ]
    );
  };

  const deletePost = async (postId: string) => {
    // 1. Delete from Supabase
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      Alert.alert('Error', 'Could not delete post. Please try again.');
      return;
    }

    // 2. Remove instantly from the local UI grid
    setPosts((currentPosts) => currentPosts.filter(post => post.id !== postId));
  };

  const getTicketStatus = (expiryDateString: string | null | undefined) => {
    if (!expiryDateString) return { color: COLORS.border, icon: <XCircle size={14} color={COLORS.textSecondary} />, text: 'Not Uploaded' };
    
    const expiryDate = new Date(expiryDateString);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysUntilExpiry < 0) {
      return { color: COLORS.crimsonRed, icon: <XCircle size={14} color={COLORS.crimsonRed} />, text: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { color: COLORS.safetyAmber, icon: <AlertTriangle size={14} color={COLORS.safetyAmber} />, text: 'Expiring Soon' };
    } else {
      return { color: COLORS.emeraldGreen, icon: <CheckCircle size={14} color={COLORS.emeraldGreen} />, text: 'Valid' };
    }
  };

  const renderHeader = () => {
    if (!profile) return null;

    const safePassStatus = getTicketStatus(profile.safepass_expiry ?? null);
    const manualHandlingStatus = getTicketStatus(profile.manual_handling_expiry ?? null);

    return (
      <View style={styles.headerContainer}>
        {/* Profile Info */}
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.full_name.charAt(0)}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.name}>{profile.full_name}</Text>
            {profile.trade && profile.current_phase && (
              <Text style={styles.tradeBadge}>
                {profile.trade.toUpperCase()} • {profile.current_phase.replace('_', ' ').toUpperCase()}
              </Text>
            )}
            <View style={styles.metaRow}>
              <MapPin size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>Co. {profile.county}</Text>
            </View>
            {profile.training_institution && (
              <View style={styles.metaRow}>
                <Briefcase size={14} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{profile.training_institution}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sponsor Toggle (Apprentices Only) */}
        {profile.role === 'apprentice' && (
          <View style={styles.toggleContainer}>
            <View>
              <Text style={styles.toggleTitle}>Seeking Employer Sponsor</Text>
              <Text style={styles.toggleSub}>Makes your profile visible in the Talent Pool</Text>
            </View>
            <Switch
              value={seekingSponsor}
              onValueChange={toggleSponsorStatus}
              trackColor={{ false: COLORS.border, true: COLORS.emeraldGreen }}
              thumbColor={'#FFF'}
            />
          </View>
        )}

        {/* Ticket Wallet */}
        <View style={styles.walletContainer}>
          <Text style={styles.walletTitle}>Site-Ready Tickets</Text>
          
          <View style={styles.ticketRow}>
            <Text style={styles.ticketName}>SafePass</Text>
            <View style={[styles.ticketBadge, { borderColor: safePassStatus.color }]}>
              {safePassStatus.icon}
              <Text style={[styles.ticketBadgeText, { color: safePassStatus.color }]}>{safePassStatus.text}</Text>
            </View>
          </View>
          
          <View style={styles.ticketRow}>
            <Text style={styles.ticketName}>Manual Handling</Text>
            <View style={[styles.ticketBadge, { borderColor: manualHandlingStatus.color }]}>
              {manualHandlingStatus.icon}
              <Text style={[styles.ticketBadgeText, { color: manualHandlingStatus.color }]}>{manualHandlingStatus.text}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <LogOut size={16} color={COLORS.textSecondary} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridHeader}>
          <Text style={styles.gridTitle}>Proof-of-Work Portfolio</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        refreshing={loading}
        onRefresh={fetchPortfolio}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <Image source={{ uri: item.media_url }} style={styles.gridImage} />
            
            {/* Action Menu (Three Dots) */}
            <TouchableOpacity 
              style={styles.optionsBadge} 
              onPress={() => handlePostOptions(item.id)}
            >
              <MoreVertical size={16} color="#FFF" />
            </TouchableOpacity>

            {item.is_endorsed && (
              <View style={styles.endorsedBadge}>
                <Award size={16} color={COLORS.surface} fill={COLORS.safetyAmber} />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No proof-of-work posted yet.</Text>
            </View>
          ) : <View />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { padding: 20, paddingTop: 60 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryBlue, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  infoCol: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  tradeBadge: { color: COLORS.safetyAmber, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  metaText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  toggleTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  toggleSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  
  walletContainer: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  walletTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  ticketName: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  ticketBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 6 },
  ticketBadgeText: { fontSize: 12, fontWeight: '700' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  signOutText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },

  gridHeader: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 2 },
  gridTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  
  gridItem: { width: COLUMN_WIDTH, height: COLUMN_WIDTH, padding: 1 },
  gridImage: { flex: 1, backgroundColor: COLORS.surface },
  
  // New Styles for Badges
  optionsBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4, zIndex: 10 },
  endorsedBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
  
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});