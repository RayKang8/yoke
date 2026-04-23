import { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../constants/theme';
import { timeAgo } from '../lib/utils';
import { ReactionBar } from './ReactionBar';
import { CommentThread } from './CommentThread';
import { CommentIcon } from './icons';
import { FeedItem } from '../hooks/useFeed';

interface Props {
  item: FeedItem;
  currentUserId: string;
  onReactionUpdate: (id: string, reactions: { type: string; user_id: string }[]) => void;
}

export function DevotionalCard({ item, currentUserId, onReactionUpdate }: Props) {
  const scheme = useColorScheme();
  const c = colors[scheme === 'dark' ? 'dark' : 'light'];
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.comment_count);

  const initials = item.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12 }}>
      {/* Author row */}
      <TouchableOpacity className="flex-row items-center gap-3 mb-3" onPress={() => router.push(`/user/${item.user.id}` as any)} activeOpacity={0.7}>
        <View style={{ backgroundColor: c.accent, width: 40, height: 40, borderRadius: 20 }} className="items-center justify-center">
          <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 15 }}>{initials}</Text>
        </View>
        <View className="flex-1">
          <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 15 }}>{item.user.name}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>{item.user.yoke_code}</Text>
        </View>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>{timeAgo(item.created_at)}</Text>
      </TouchableOpacity>

      {/* Passage reference */}
      <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
        {item.passage.reference}
      </Text>

      {/* Reflection text */}
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
        <Text
          style={{ color: c.textPrimary, fontSize: 15, lineHeight: 22 }}
          numberOfLines={expanded ? undefined : 3}
        >
          {item.content}
        </Text>
        {!expanded && item.content.length > 120 && (
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>more</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: c.border, marginVertical: 12 }} />

      {/* Reactions + comments */}
      <ReactionBar
        devotionalId={item.id}
        reactions={item.reactions}
        currentUserId={currentUserId}
        onUpdate={reactions => onReactionUpdate(item.id, reactions)}
      />

      <TouchableOpacity
        onPress={() => setShowComments(true)}
        className="flex-row items-center gap-1 mt-3"
      >
        <CommentIcon size={16} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
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
}
