import { memo, useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors, fonts, shadows, radius } from '../constants/theme';
import { timeAgo } from '../lib/utils';
import { ReactionBar } from './ReactionBar';
import { CommentThread } from './CommentThread';
import { Avatar } from './Avatar';
import { CommentIcon, DotsIcon } from './icons';
import { FeedItem } from '../hooks/useFeed';

interface Props {
  item: FeedItem;
  currentUserId: string;
  isPremium?: boolean;
  onReactionUpdate: (id: string, reactions: { type: string; user_id: string }[]) => void;
  onBlock?: (userId: string) => void;
}

export const DevotionalCard = memo(function DevotionalCard({ item, currentUserId, isPremium = false, onReactionUpdate, onBlock }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.comment_count);

  function handleMoreOptions() {
    Alert.alert(item.user.name, undefined, [
      { text: 'Report post', onPress: handleReport },
      { text: `Block ${item.user.name}`, style: 'destructive', onPress: confirmBlock },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleReport() {
    Alert.alert(
      'Report Post',
      'Why are you reporting this?',
      [
        { text: 'Spam',                  onPress: () => submitReport('spam') },
        { text: 'Inappropriate content', onPress: () => submitReport('inappropriate') },
        { text: 'Harassment',            onPress: () => submitReport('harassment') },
        { text: 'Other',                 onPress: () => submitReport('other') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }

  async function submitReport(reason: string) {
    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUserId,
      content_type: 'devotional',
      content_id: item.id,
      reason,
    });
    if (!error) Alert.alert('Reported', 'Thank you — our team will review this post.');
  }

  function confirmBlock() {
    Alert.alert(
      `Block ${item.user.name}?`,
      "You won't see each other's posts.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => onBlock?.(item.user.id) },
      ],
    );
  }

  return (
    <View style={{
      backgroundColor: c.warmSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.warmBorder,
      padding: 20,
      marginBottom: 14,
      ...shadows.card,
    }}>
      {/* Author row */}
      <View className="flex-row items-center gap-3 mb-3">
        <TouchableOpacity className="flex-row items-center gap-3 flex-1" onPress={() => router.push(`/user/${item.user.id}` as any)} activeOpacity={0.7}>
          <Avatar url={item.user.avatar_url} name={item.user.name} size={40} accent={c.accent} />
          <View className="flex-1">
            <Text style={{ color: c.textPrimary, fontFamily: fonts.uiBold, fontSize: 15 }}>{item.user.name}</Text>
            <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 12 }}>{item.user.yoke_code}</Text>
          </View>
          <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 12 }}>{timeAgo(item.created_at)}</Text>
        </TouchableOpacity>
        {item.user.id !== currentUserId && (
          <TouchableOpacity onPress={handleMoreOptions} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <DotsIcon size={18} color={c.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Passage reference */}
      <Text style={{ color: c.accent, fontFamily: fonts.uiMedium, fontSize: 13, marginBottom: 8 }}>
        {item.passage.reference}
      </Text>

      {/* Reflection text */}
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
        <Text
          style={{ color: c.textPrimary, fontFamily: fonts.body, fontSize: 15, lineHeight: 26 }}
          numberOfLines={expanded ? undefined : 3}
        >
          {item.content}
        </Text>
        {!expanded && item.content.length > 120 && (
          <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 13, marginTop: 4 }}>more</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: c.warmBorder, marginVertical: 14 }} />

      {/* Reactions + comments */}
      <ReactionBar
        devotionalId={item.id}
        authorId={item.user.id}
        reactions={item.reactions}
        currentUserId={currentUserId}
        isPremium={isPremium}
        onUpdate={reactions => onReactionUpdate(item.id, reactions)}
      />

      <TouchableOpacity
        onPress={() => setShowComments(true)}
        className="flex-row items-center gap-1 mt-3"
      >
        <CommentIcon size={16} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 13 }}>
          {commentCount > 0 ? `${commentCount} comment${commentCount === 1 ? '' : 's'}` : 'Comment'}
        </Text>
      </TouchableOpacity>

      <CommentThread
        devotionalId={item.id}
        authorId={item.user.id}
        commentsDisabled={item.comments_disabled}
        currentUserId={currentUserId}
        visible={showComments}
        onClose={() => setShowComments(false)}
        onCountChange={setCommentCount}
      />
    </View>
  );
});
