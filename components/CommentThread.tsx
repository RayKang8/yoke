import { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, FlatList,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/theme';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: { name: string };
}

interface Props {
  devotionalId: string;
  authorId: string;
  commentsDisabled: boolean;
  currentUserId: string;
  visible: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function CommentThread({ devotionalId, authorId, commentsDisabled, currentUserId, visible, onClose, onCountChange }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    fetchComments();
  }, [visible]);

  async function fetchComments() {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, user:users!user_id(name)')
      .eq('devotional_id', devotionalId)
      .order('created_at', { ascending: true });
    setComments((data as Comment[]) ?? []);
    setLoading(false);
  }

  async function postComment() {
    if (!text.trim() || posting) return;
    setPosting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ devotional_id: devotionalId, user_id: currentUserId, content: text.trim() })
      .select('id, content, created_at, user_id, user:users!user_id(name)')
      .single();
    setPosting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    const updated = [...comments, data as Comment];
    setComments(updated);
    onCountChange(updated.length);
    setText('');
  }

  async function deleteComment(commentId: string) {
    Alert.alert('Delete comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('comments').delete().eq('id', commentId);
          const updated = comments.filter(c => c.id !== commentId);
          setComments(updated);
          onCountChange(updated.length);
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors[scheme === 'dark' ? 'dark' : 'light'].background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={{ borderBottomColor: c.border, borderBottomWidth: 1 }}
          className="flex-row items-center justify-between px-5 py-4"
        >
          <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '600' }}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: c.textSecondary, fontSize: 16 }}>Done</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={c.accent} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, gap: 16 }}
            ListEmptyComponent={
              <Text style={{ color: c.textSecondary, textAlign: 'center', marginTop: 40 }}>
                No comments yet. Be the first.
              </Text>
            }
            renderItem={({ item }) => {
              const canDelete = item.user_id === currentUserId || authorId === currentUserId;
              return (
                <View className="flex-row gap-3">
                  <View style={{ backgroundColor: c.accent, width: 34, height: 34, borderRadius: 17 }}
                    className="items-center justify-center flex-shrink-0"
                  >
                    <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 13 }}>
                      {item.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 14 }}>
                        {item.user?.name}
                      </Text>
                      <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                        {timeAgo(item.created_at)}
                      </Text>
                    </View>
                    <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 21 }}>
                      {item.content}
                    </Text>
                    {canDelete && (
                      <TouchableOpacity onPress={() => deleteComment(item.id)} className="mt-1">
                        <Text style={{ color: c.textSecondary, fontSize: 12 }}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input */}
        {!commentsDisabled && (
          <View
            style={{ borderTopColor: c.border, borderTopWidth: 1, paddingBottom: insets.bottom + 8, paddingTop: 10, paddingHorizontal: 16 }}
            className="flex-row items-end gap-3"
          >
            <TextInput
              value={text}
              onChangeText={t => setText(t.slice(0, 250))}
              placeholder="Add a comment..."
              placeholderTextColor={c.textSecondary}
              multiline
              style={{
                flex: 1,
                backgroundColor: c.surface,
                color: c.textPrimary,
                borderColor: c.border,
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                fontSize: 15,
                maxHeight: 100,
              }}
            />
            <TouchableOpacity
              onPress={postComment}
              disabled={!text.trim() || posting}
              style={{ backgroundColor: text.trim() ? c.accent : c.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 }}
            >
              {posting
                ? <ActivityIndicator color="#1A1A1A" size="small" />
                : <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 14 }}>Post</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
