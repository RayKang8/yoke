import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  // 1. Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission required',
      'Please allow photo library access in Settings to set a profile picture.',
    );
    return null;
  }

  // 2. Open picker — square crop, user can adjust framing
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  // 3. Resize to max 500×500 and compress (keeps file size ~30–60 KB)
  let manipulated: ImageManipulator.ImageResult;
  try {
    manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 500, height: 500 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
  } catch {
    Alert.alert('Error', 'Could not process the image. Please try a different photo.');
    return null;
  }

  // 4. Convert to ArrayBuffer for Supabase Storage upload
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await fetch(manipulated.uri).then(r => r.arrayBuffer());
  } catch {
    Alert.alert('Error', 'Could not read the image file.');
    return null;
  }

  // 5. Upload — upsert so re-uploading the same path replaces the old file
  const path = `${userId}/avatar.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    Alert.alert('Upload failed', uploadError.message);
    return null;
  }

  // 6. Get public URL — append version param to bust CDN cache after each re-upload
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

  // 7. Persist to users table
  const { error: dbError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (dbError) {
    Alert.alert('Error', 'Photo uploaded but failed to save. Please try again.');
    return null;
  }

  return publicUrl;
}
