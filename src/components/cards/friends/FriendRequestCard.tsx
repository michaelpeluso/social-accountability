/**
 * FriendRequestCard Component
 * Displays a friend request with accept/decline actions
 */

import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { Avatar } from "../../layout/Avatar";

interface FriendRequestCardProps {
  /** Request ID */
  requestId: string;
  /** User ID who sent/received the request */
  userId: string;
  /** User display name */
  userName: string;
  /** User avatar URL */
  userAvatarUrl?: string | null;
  /** User bio or subtitle */
  userBio?: string | null;
  /** Request type */
  type: "received" | "sent";
  /** Loading state for accept action */
  loadingAccept?: boolean;
  /** Loading state for decline/cancel action */
  loadingDecline?: boolean;
  /** Called when accept is pressed (received only) */
  onAccept?: () => void;
  /** Called when decline/cancel is pressed */
  onDecline?: () => void;
  /** Called when user profile is pressed */
  onPressUser?: () => void;
}

export function FriendRequestCard({
  userName,
  userAvatarUrl,
  userBio,
  type,
  loadingAccept = false,
  loadingDecline = false,
  onAccept,
  onDecline,
  onPressUser,
}: FriendRequestCardProps) {
  const { theme } = useTheme();
  const isLoading = loadingAccept || loadingDecline;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <Pressable style={styles.userInfo} onPress={onPressUser} disabled={!onPressUser}>
        <Avatar imageUrl={userAvatarUrl} name={userName} size="md" />

        <View style={styles.textContainer}>
          <Text style={[styles.userName, { color: theme.text.primary }]} numberOfLines={1}>
            {userName}
          </Text>
          {userBio && (
            <Text style={[styles.bio, { color: theme.text.secondary }]} numberOfLines={1}>
              {userBio}
            </Text>
          )}
          <Text style={[styles.requestLabel, { color: theme.text.secondary }]}>
            {type === "received" ? "Wants to be friends" : "Request pending"}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {type === "received" && onAccept && (
          <Pressable
            style={[
              styles.actionButton,
              styles.acceptButton,
              { backgroundColor: theme.semantic.success },
            ]}
            onPress={onAccept}
            disabled={isLoading}
          >
            {loadingAccept ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionText}>Accept</Text>
            )}
          </Pressable>
        )}

        {onDecline && (
          <Pressable
            style={[
              styles.actionButton,
              styles.declineButton,
              {
                backgroundColor:
                  type === "sent" ? theme.background.tertiary : `${theme.semantic.danger}15`,
              },
            ]}
            onPress={onDecline}
            disabled={isLoading}
          >
            {loadingDecline ? (
              <ActivityIndicator
                size="small"
                color={type === "sent" ? theme.text.primary : theme.semantic.danger}
              />
            ) : (
              <Text
                style={[
                  styles.actionText,
                  {
                    color: type === "sent" ? theme.text.primary : theme.semantic.danger,
                  },
                ]}
              >
                {type === "sent" ? "Cancel" : "Decline"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xxs,
  },
  requestLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 70,
    alignItems: "center",
  },
  acceptButton: {},
  declineButton: {},
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: "#fff",
  },
});
