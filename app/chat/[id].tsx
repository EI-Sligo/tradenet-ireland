// app/chat/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const { id: targetUserId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState('Chat');

  useEffect(() => {
    if (!profile || !targetUserId) return;
    
    const initializeChat = async () => {
      // 1. Get the target user's name for the header
      const { data: targetData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', targetUserId)
        .single();
        
      if (targetData) setTargetName(targetData.full_name);

      // 2. Look for an existing conversation between these two users
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_one.eq.${profile.id},participant_two.eq.${targetUserId}),and(participant_one.eq.${targetUserId},participant_two.eq.${profile.id})`)
        .maybeSingle();

      let activeConvId = convData?.id;

      // 3. If no conversation exists yet, create one
      if (!activeConvId && !convError) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ participant_one: profile.id, participant_two: targetUserId })
          .select('id')
          .single();
          
        activeConvId = newConv?.id;
      }

      setConversationId(activeConvId);

      // 4. Load existing messages
      if (activeConvId) {
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', activeConvId)
          .order('created_at', { ascending: true });
          
        if (msgData) setMessages(msgData);

        // 5. Subscribe to real-time incoming messages
        const channel = supabase
          .channel(`room:${activeConvId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
            (payload) => {
              setMessages((prev) => [...prev, payload.new as ChatMessage]);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };

    initializeChat();
  }, [profile, targetUserId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || !profile) return;

    const msgContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for snappy UX

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content: msgContent,
    });

    if (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerName}>{targetName}</Text>
        <View style={{ width: 24 }} /> {/* Spacer to center title */}
      </View>

      {/* Message List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          const isMine = item.sender_id === profile?.id;
          return (
            <View style={[styles.bubbleWrapper, isMine ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={styles.bubbleText}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!newMessage.trim()}>
          <Send color={newMessage.trim() ? COLORS.safetyAmber : COLORS.textSecondary} size={24} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  messageList: { padding: 16, paddingBottom: 32 },
  bubbleWrapper: { marginBottom: 12, flexDirection: 'row' },
  bubbleWrapperRight: { justifyContent: 'flex-end' },
  bubbleWrapperLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  bubbleMine: { backgroundColor: COLORS.primaryBlue, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: { padding: 12, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
});