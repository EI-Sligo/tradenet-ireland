// app/(tabs)/index.tsx
import { ResizeMode, Video } from 'expo-av';
import { Award, Heart, MapPin, MessageCircle, MoreVertical, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { MOCK_BENCH_POSTS } from '../../src/utils/mockData';

const { height, width } = Dimensions.get('window');
const POST_HEIGHT = height - 170; 

const FILTER_OPTIONS = ['All', 'Electrical', 'Instrumentation', 'Plumbing', 'Carpentry', 'Motor Mechanics', 'Metal Fabrication'];

export default function FeedScreen() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [activePostId, setActivePostId] = useState<string | null>(null);

  // Comment Modal State
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Double tap tracking
  const lastTapRef = useRef<number>(0);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        media_url,
        user_id,
        created_at,
        profiles ( full_name, trade, current_phase, county ),
        post_endorsements ( id ),
        likes ( user_id ),
        comments ( id )
      `)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setPosts(data);
      if (data.length > 0 && !activePostId) setActivePostId(data[0].id);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setPosts((current) => current.filter((p) => p.id !== postId));
    }
  };

  const toggleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    if (!profile) return;

    // Optimistic UI Update
    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        let updatedLikes = [...(post.likes || [])];
        if (isCurrentlyLiked) {
          updatedLikes = updatedLikes.filter((l: any) => l.user_id !== profile.id);
        } else {
          updatedLikes.push({ user_id: profile.id });
        }
        return { ...post, likes: updatedLikes };
      }
      return post;
    }));

    if (isCurrentlyLiked) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: profile.id });
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: profile.id });
    }
  };

  const handleDoubleTap = (postId: string, isCurrentlyLiked: boolean) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_PRESS_DELAY) {
      if (!isCurrentlyLiked) toggleLike(postId, isCurrentlyLiked);
    }
    lastTapRef.current = now;
  };

  const openComments = async (postId: string) => {
    setActiveCommentPostId(postId);
    setCommentsModalVisible(true);
    
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, profiles(full_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (data) setPostComments(data);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !profile || !activeCommentPostId) return;
    
    const commentData = {
      post_id: activeCommentPostId,
      user_id: profile.id,
      content: newComment.trim()
    };

    // Optimistic UI update
    setPostComments(current => [...current, { ...commentData, profiles: { full_name: profile.full_name } }]);
    setNewComment('');

    await supabase.from('comments').insert(commentData);
    fetchPosts(); // Refresh feed to update comment counts
  };

  const filteredPosts = selectedTrade === 'All' 
    ? posts 
    : posts.filter(post => {
        const postTrade = post.profiles?.trade?.replace(/_/g, ' ').toLowerCase() || '';
        return postTrade.includes(selectedTrade.toLowerCase());
      });

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActivePostId(viewableItems[0].item.id);
  }).current;

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isEndorsed = item.post_endorsements && item.post_endorsements.length > 0;
    const isVideo = item.media_url?.match(/\.(mp4|mov|m4v|webm)$/i);
    const isActive = item.id === activePostId;
    
    const likesList = item.likes || [];
    const isLiked = likesList.some((like: any) => like.user_id === profile?.id);
    const commentCount = item.comments ? item.comments.length : 0;

    return (
      <View style={styles.postCard}>
        <Pressable 
          style={styles.mediaContainer} 
          onPress={() => handleDoubleTap(item.id, isLiked)}
        >
          {isVideo ? (
            <Video
              source={{ uri: item.media_url }}
              style={styles.mediaElement}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isActive}
              isLooping
              isMuted={true}
            />
          ) : (
            <Image source={{ uri: item.media_url }} style={styles.mediaElement} />
          )}
        </Pressable>

        <View style={styles.overlayUI} pointerEvents="box-none">
          <View style={styles.postHeader} pointerEvents="box-none">
            <View style={styles.authorInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.profiles?.full_name?.charAt(0) || 'U'}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{item.profiles?.full_name || 'Unknown'}</Text>
                {item.profiles?.trade && (
                  <Text style={styles.authorTrade}>
                    {item.profiles.trade.replace(/_/g, ' ').toUpperCase()} • {item.profiles.current_phase?.replace('_', ' ').toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.lowerSection} pointerEvents="box-none">
            <View style={styles.postFooter}>
              {isEndorsed && (
                <View style={styles.endorsedBadge}>
                  <Award size={16} color={COLORS.safetyAmber} />
                  <Text style={styles.endorsedText}>Verified Craft</Text>
                </View>
              )}
              {item.profiles?.county && (
                <View style={styles.locationBadge}>
                  <MapPin size={14} color="#FFF" />
                  <Text style={styles.locationText}>Co. {item.profiles.county}</Text>
                </View>
              )}
            </View>

            {/* Right Action Column */}
            <View style={styles.actionColumn}>
              <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item.id, isLiked)}>
                <Heart size={32} color={isLiked ? COLORS.crimsonRed : '#FFF'} fill={isLiked ? COLORS.crimsonRed : 'transparent'} />
                <Text style={styles.actionText}>{likesList.length}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => openComments(item.id)}>
                <MessageCircle size={32} color="#FFF" />
                <Text style={styles.actionText}>{commentCount}</Text>
              </TouchableOpacity>

              {profile?.id === item.user_id && (
                <TouchableOpacity style={styles.actionButton} onPress={() => {
                  Alert.alert('Delete Post', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deletePost(item.id) }
                  ]);
                }}>
                  <MoreVertical size={28} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }, [activePostId, profile]);

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_OPTIONS.map((trade) => (
            <TouchableOpacity 
              key={trade}
              style={[styles.filterPill, selectedTrade === trade && styles.filterPillActive]}
              onPress={() => setSelectedTrade(trade)}
            >
              <Text style={[styles.filterText, selectedTrade === trade && styles.filterTextActive]}>{trade}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={MOCK_BENCH_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        snapToInterval={POST_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} tintColor={COLORS.primaryBlue} />}
      />

      {/* Comments Modal */}
      <Modal visible={commentsModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsModalVisible(false)}><X size={24} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>
            
            <FlatList
              data={postComments}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Text style={styles.commentAuthor}>{item.profiles?.full_name}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              )}
            />
            
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={COLORS.textSecondary}
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity style={styles.postBtn} onPress={submitComment}>
                <Text style={styles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterContainer: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 12, zIndex: 10 },
  filterScroll: { paddingHorizontal: 12, gap: 8 },
  filterPill: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  filterPillActive: { backgroundColor: COLORS.safetyAmber, borderColor: COLORS.safetyAmber },
  filterText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  filterTextActive: { color: '#000', fontWeight: '800' },

  postCard: { height: POST_HEIGHT, width: width, backgroundColor: '#000', borderBottomWidth: 1, borderColor: COLORS.background },
  
  // Fixed: Replaced absoluteFillObject with explicit absolute positioning
  mediaContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mediaElement: { width: '100%', height: '100%' },
  
  overlayUI: { flex: 1, justifyContent: 'space-between', padding: 16, backgroundColor: 'rgba(0,0,0,0.2)' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryBlue, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  authorName: { color: '#FFF', fontSize: 16, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  authorTrade: { color: COLORS.safetyAmber, fontSize: 12, fontWeight: '700', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  
  lowerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 10 },
  postFooter: { flex: 1, gap: 10 },
  endorsedBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  endorsedText: { color: COLORS.safetyAmber, fontSize: 13, fontWeight: '700' },
  locationBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  locationText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  actionColumn: { alignItems: 'center', gap: 20, paddingLeft: 16 },
  actionButton: { alignItems: 'center' },
  actionText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },

  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  commentRow: { marginBottom: 16 },
  commentAuthor: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  commentText: { color: COLORS.textSecondary, fontSize: 14 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  commentInput: { flex: 1, backgroundColor: COLORS.background, color: COLORS.textPrimary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 12 },
  
  // Fixed: Added the missing postBtn style
  postBtn: { paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  postBtnText: { color: COLORS.primaryBlue, fontSize: 16, fontWeight: '700' }
});