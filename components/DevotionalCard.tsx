import { memo, useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, shadows, radius } from '../constants/theme';
import { timeAgo } from '../lib/utils';
import { ReactionBar } from './ReactionBar';
import { CommentThread } from './CommentThread';
import { Avatar } from './Avatar';
import { CommentIcon } from './icons';
import { FeedItem } from '../hooks/useFeed';

interface Props {
  item: FeedItem;
  currentUserId: string;
  isPremium?: boolean;
  onReactionUpdate: (id: string, reactions: { type: string; user_id: string }[]) => void;
}

export const DevotionalCard = memo(function DevotionalCard({ item, currentUserId, isPremium = false, onReactionUpdate }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.comment_count);

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
      <TouchableOpacity className="flex-row items-center gap-3 mb-3" onPress={() => router.push(`/user/${item.user.id}` as any)} activeOpacity={0.7}>
        <Avatar url={item.user.avatar_url} name={item.user.name} size={40} accent={c.accent} />
        <View className="flex-1">
          <Text style={{ color: c.textPrimary, fontFamily: fonts.uiBold, fontSize: 15 }}>{item.user.name}</Text>
          <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 12 }}>{item.user.yoke_code}</Text>
        </View>
        <Text style={{ color: c.textSecondary, fontFamily: fonts.uiRegular, fontSize: 12 }}>{timeAgo(item.created_at)}</Text>
      </TouchableOpacity>

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
