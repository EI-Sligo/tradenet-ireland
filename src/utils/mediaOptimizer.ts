// src/utils/mediaOptimizer.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export async function compressAndOptimizeImage(uri: string): Promise<string> {
  try {
    // Resize to max width 1920px and compress JPEG quality to 80%
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Check if the file is still too big (over 1MB)
    const fileInfo = await FileSystem.getInfoAsync(manipulated.uri);
    if (fileInfo.exists && fileInfo.size > 1024 * 1024) {
      // Run a tighter compression pass if it is too heavy
      const reCompressed = await ImageManipulator.manipulateAsync(
        manipulated.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      return reCompressed.uri;
    }

    return manipulated.uri;
  } catch (err) {
    console.error('Image compression failed, falling back to original:', err);
    return uri;
  }
}