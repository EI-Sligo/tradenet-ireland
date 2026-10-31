// app/post-create.tsx
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, PHASES, PhaseLevel, TRADES, TradeType } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { compressAndOptimizeImage } from '../src/utils/mediaOptimizer';

// NEW IMPORTS FOR ANDROID UPLOAD FIX
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

export default function PostCreateScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  
  const [selectedTrade, setSelectedTrade] = useState<TradeType>(profile?.trade || 'electrical');
  const [selectedPhase, setSelectedPhase] = useState<PhaseLevel>(profile?.current_phase || 'phase_2');
  
  const [isStolenAlert, setIsStolenAlert] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickMedia = async (useCamera: boolean) => {
    let result;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Camera access is needed to snap work photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
    }

    if (!result.canceled && result.assets[0].uri) {
      const optimizedUri = await compressAndOptimizeImage(result.assets[0].uri);
      setMediaUri(optimizedUri);
    }
  };

  const handlePublishPost = async () => {
    if (!profile || !mediaUri) {
      Alert.alert('Missing Media', 'Please capture or select a photo of your work.');
      return;
    }

    setUploading(true);
    try {
      // 1. ANDROID FIX: Convert the image to Base64 text, then decode it into an array buffer
      const base64 = await FileSystem.readAsStringAsync(mediaUri, { encoding: FileSystem.EncodingType.Base64 });
      const arrayBuffer = decode(base64);

      const fileName = `${profile.id}-${Date.now()}.jpg`;
      const filePath = `uploads/${fileName}`;

      // 2. Upload the safe array buffer to Supabase
      const { error: storageError } = await supabase.storage
        .from('post-media')
        .upload(filePath, arrayBuffer, { contentType: 'image/jpeg' });

      if (storageError) throw storageError;

      // 3. Get the public URL for the image
      const { data: publicUrlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(filePath);

      const mediaUrl = publicUrlData.publicUrl;

      // 4. Save the post to the database
      const tags = [`#${selectedTrade}`, `#${selectedPhase}`];
      const { error: dbError } = await supabase.from('posts').insert({
        user_id: profile.id,
        media_url: mediaUrl,
        media_type: 'image',
        caption: caption.trim() || null,
        tags,
        county: profile.county,
        is_stolen_alert: isStolenAlert,
        stolen_serial_numbers: isStolenAlert ? serialNumbers.trim() : null,
      });

      if (dbError) throw dbError;

      router.back(); 
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>New Post</Text>

      {mediaUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: mediaUri }} style={styles.previewImage} />
          <TouchableOpacity style={styles.changeImageBtn} onPress={() => setMediaUri(null)}>
            <Text style={styles.changeImageText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pickerButtonsRow}>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickMedia(true)}>
            <Text style={styles.pickBtnText}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickMedia(false)}>
            <Text style={styles.pickBtnText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.label}>Caption (Max 500 chars)</Text>
      <TextInput
        style={styles.textArea}
        placeholder="e.g., First fix distribution board installation..."
        placeholderTextColor={COLORS.textSecondary}
        multiline
        maxLength={500}
        value={caption}
        onChangeText={setCaption}
      />

      <Text style={styles.label}>Trade Tag *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {TRADES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, selectedTrade === t.value && styles.chipActive]}
            onPress={() => setSelectedTrade(t.value)}
          >
            <Text style={[styles.chipText, selectedTrade === t.value && styles.chipTextActive]}>#{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Phase Level *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {PHASES.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.chip, selectedPhase === p.value && styles.chipActive]}
            onPress={() => setSelectedPhase(p.value)}
          >
            <Text style={[styles.chipText, selectedPhase === p.value && styles.chipTextActive]}>#{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.stolenCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stolenTitle}>🚨 Broadcast Stolen Gear</Text>
          <Text style={styles.stolenSubtitle}>Trigger a regional red alert</Text>
        </View>
        <Switch value={isStolenAlert} onValueChange={setIsStolenAlert} trackColor={{ false: COLORS.border, true: COLORS.crimsonRed }} />
      </View>

      {isStolenAlert && (
        <TextInput
          style={styles.input}
          placeholder="e.g., DeWalt drill kit #N88392"
          placeholderTextColor={COLORS.textSecondary}
          value={serialNumbers}
          onChangeText={setSerialNumbers}
        />
      )}

      <TouchableOpacity style={[styles.publishBtn, isStolenAlert && styles.publishBtnAlert]} onPress={handlePublishPost} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#0F172A" />
        ) : (
          <Text style={styles.publishBtnText}>{isStolenAlert ? '🚨 BROADCAST ALERT' : 'Publish to The Bench'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 60 },
  header: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 20 },
  pickerButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pickBtn: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  pickBtnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  previewContainer: { marginBottom: 20, alignItems: 'center' },
  previewImage: { width: '100%', height: 260, borderRadius: 12, resizeMode: 'cover' },
  changeImageBtn: { marginTop: 8 },
  changeImageText: { color: COLORS.safetyAmber, fontWeight: '700', fontSize: 13 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  textArea: { backgroundColor: COLORS.surface, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, height: 100, textAlignVertical: 'top', fontSize: 15 },
  input: { backgroundColor: COLORS.surface, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginTop: 8 },
  horizontalScroll: { flexDirection: 'row', marginBottom: 6 },
  chip: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  chipActive: { borderColor: COLORS.safetyAmber, backgroundColor: '#292524' },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: COLORS.safetyAmber },
  stolenCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.crimsonRed, flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  stolenTitle: { color: COLORS.crimsonRed, fontSize: 15, fontWeight: '800' },
  stolenSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  publishBtn: { backgroundColor: COLORS.safetyAmber, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  publishBtnAlert: { backgroundColor: COLORS.crimsonRed },
  publishBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
});