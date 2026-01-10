import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/services/api";
import { logger } from "../../src/lib/logger";
import type { User, FriendRequest } from "../../src/types/user";
import { useTheme } from "../../src/theme";

type Tab = "friends" | "requests" | "search" | "blocked";

export default function Friends() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>({ sent: [], received: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [friendsRes, requestsRes, blockedRes] = await Promise.all([
        api.friends.getAll(),
        api.friends.getRequests(),
        api.friends.getBlockedUsers(),
      ]);

      if (!("error" in friendsRes)) {
        setFriends(friendsRes.data);
      }
      if (!("error" in requestsRes)) {
        setRequests(requestsRes.data);
      }
      if (!("error" in blockedRes)) {
        setBlockedUsers(blockedRes.data);
      }
    } catch (err) {
      logger.error("Friends: failed to load", { error: err });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await api.friends.searchUsers(searchQuery.trim());
      if ("error" in response) {
        logger.error("Friends: search failed", { error: response.error });
        setSearchResults([]);
      } else {
        setSearchResults(response.data);
      }
    } catch (err) {
      logger.error("Friends: search failed", { error: err });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(userId: string) {
    try {
      const response = await api.friends.sendRequest(userId);
      if ("error" in response) {
        Alert.alert("Error", response.error.message);
        return;
      }
      Alert.alert("Success", "Friend request sent!");
      await loadData();
    } catch (err) {
      logger.error("Friends: send request failed", { error: err });
      Alert.alert("Error", "Failed to send friend request");
    }
  }

  async function handleAcceptRequest(requestId: string) {
    try {
      const response = await api.friends.acceptRequest(requestId);
      if ("error" in response) {
        Alert.alert("Error", response.error.message);
        return;
      }
      await loadData();
    } catch (err) {
      logger.error("Friends: accept request failed", { error: err });
      Alert.alert("Error", "Failed to accept request");
    }
  }

  async function handleDeclineRequest(requestId: string) {
    try {
      const response = await api.friends.declineRequest(requestId);
      if ("error" in response) {
        Alert.alert("Error", response.error.message);
        return;
      }
      await loadData();
    } catch (err) {
      logger.error("Friends: decline request failed", { error: err });
      Alert.alert("Error", "Failed to decline request");
    }
  }

  async function handleUnfriend(friendId: string, friendName: string) {
    Alert.alert(
      "Remove Friend",
      `Remove ${friendName} as a friend? They won't be able to see your Friends-only content.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.friends.unfriend(friendId);
              if ("error" in response) {
                Alert.alert("Error", response.error.message);
                return;
              }
              await loadData();
            } catch (err) {
              logger.error("Friends: unfriend failed", { error: err });
              Alert.alert("Error", "Failed to remove friend");
            }
          },
        },
      ]
    );
  }

  async function handleBlock(userId: string, userName: string) {
    Alert.alert(
      "Block User",
      `Block ${userName}? They won't be able to send you friend requests or see your content.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.friends.blockUser(userId);
              if ("error" in response) {
                Alert.alert("Error", response.error.message);
                return;
              }
              await loadData();
            } catch (err) {
              logger.error("Friends: block failed", { error: err });
              Alert.alert("Error", "Failed to block user");
            }
          },
        },
      ]
    );
  }

  async function handleUnblock(userId: string, userName: string) {
    Alert.alert(
      "Unblock User",
      `Unblock ${userName}? They will be able to send you friend requests again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              const response = await api.friends.unblockUser(userId);
              if ("error" in response) {
                Alert.alert("Error", response.error.message);
                return;
              }
              await loadData();
            } catch (err) {
              logger.error("Friends: unblock failed", { error: err });
              Alert.alert("Error", "Failed to unblock user");
            }
          },
        },
      ]
    );
  }

  function renderFriendItem({ item }: { item: User }) {
    return (
      <Pressable
        style={[
          styles.item,
          { backgroundColor: theme.card.background, borderBottomColor: theme.border.light },
        ]}
        onLongPress={() => handleBlock(item.id, item.displayName)}
      >
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.text.primary }]}>{item.displayName}</Text>
          {item.bio && (
            <Text style={[styles.itemBio, { color: theme.text.secondary }]} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
        <Pressable
          style={[styles.actionButton, { borderColor: theme.border.medium }]}
          onPress={() => handleUnfriend(item.id, item.displayName)}
        >
          <Text style={[styles.actionButtonText, { color: theme.text.secondary }]}>Remove</Text>
        </Pressable>
      </Pressable>
    );
  }

  function renderReceivedRequest({ item }: { item: FriendRequest }) {
    return (
      <View
        style={[
          styles.item,
          { backgroundColor: theme.card.background, borderBottomColor: theme.border.light },
        ]}
      >
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.text.primary }]}>
            {item.sender.displayName}
          </Text>
          <Text style={[styles.itemMeta, { color: theme.text.tertiary }]}>
            Wants to be your friend
          </Text>
        </View>
        <View style={styles.requestActions}>
          <Pressable
            style={[styles.acceptButton, { backgroundColor: theme.semantic.primary }]}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={[styles.acceptButtonText, { color: theme.button.primary.text }]}>
              Accept
            </Text>
          </Pressable>
          <Pressable
            style={[styles.declineButton, { borderColor: theme.border.medium }]}
            onPress={() => handleDeclineRequest(item.id)}
          >
            <Text style={[styles.declineButtonText, { color: theme.text.secondary }]}>Decline</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderSentRequest({ item }: { item: FriendRequest }) {
    return (
      <View
        style={[
          styles.item,
          { backgroundColor: theme.card.background, borderBottomColor: theme.border.light },
        ]}
      >
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.text.primary }]}>
            {item.recipient.displayName}
          </Text>
          <Text style={[styles.itemMeta, { color: theme.text.tertiary }]}>Request pending</Text>
        </View>
        <Pressable
          style={[styles.actionButton, { borderColor: theme.border.medium }]}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Text style={[styles.actionButtonText, { color: theme.text.secondary }]}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.text.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background.primary, borderBottomColor: theme.border.light },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: theme.semantic.primary }]}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.tabs,
            { backgroundColor: theme.background.primary, borderBottomColor: theme.border.light },
          ]}
        >
          <Pressable
            style={[
              styles.tab,
              tab === "friends" && [styles.tabActive, { borderBottomColor: theme.text.primary }],
            ]}
            onPress={() => setTab("friends")}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.text.secondary },
                tab === "friends" && { fontWeight: "600", color: theme.text.primary },
              ]}
            >
              Friends ({friends.length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              tab === "requests" && [styles.tabActive, { borderBottomColor: theme.text.primary }],
            ]}
            onPress={() => setTab("requests")}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.text.secondary },
                tab === "requests" && { fontWeight: "600", color: theme.text.primary },
              ]}
            >
              Requests ({requests.received.length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              tab === "search" && [styles.tabActive, { borderBottomColor: theme.text.primary }],
            ]}
            onPress={() => setTab("search")}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.text.secondary },
                tab === "search" && { fontWeight: "600", color: theme.text.primary },
              ]}
            >
              Add
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              tab === "blocked" && [styles.tabActive, { borderBottomColor: theme.text.primary }],
            ]}
            onPress={() => setTab("blocked")}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.text.secondary },
                tab === "blocked" && { fontWeight: "600", color: theme.text.primary },
              ]}
            >
              Blocked
            </Text>
          </Pressable>
        </View>

        {tab === "friends" && (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.text.secondary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.text.primary }]}>
                  No friends yet
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.text.secondary }]}>
                  Add friends to share your progress
                </Text>
              </View>
            }
          />
        )}

        {tab === "requests" && (
          <View style={styles.requestsContainer}>
            {requests.received.length > 0 && (
              <View>
                <Text
                  style={[
                    styles.sectionHeader,
                    { color: theme.text.secondary, backgroundColor: theme.background.secondary },
                  ]}
                >
                  Received
                </Text>
                <FlatList
                  data={requests.received}
                  keyExtractor={(item) => item.id}
                  renderItem={renderReceivedRequest}
                  scrollEnabled={false}
                />
              </View>
            )}
            {requests.sent.length > 0 && (
              <View>
                <Text
                  style={[
                    styles.sectionHeader,
                    { color: theme.text.secondary, backgroundColor: theme.background.secondary },
                  ]}
                >
                  Sent
                </Text>
                <FlatList
                  data={requests.sent}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSentRequest}
                  scrollEnabled={false}
                />
              </View>
            )}
            {requests.received.length === 0 && requests.sent.length === 0 && (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.text.primary }]}>
                  No pending requests
                </Text>
              </View>
            )}
          </View>
        )}

        {tab === "search" && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: theme.background.primary }]}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    borderColor: theme.input.border,
                    backgroundColor: theme.input.background,
                    color: theme.text.primary,
                  },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by username or email"
                placeholderTextColor={theme.text.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <Pressable
                style={[styles.searchButton, { backgroundColor: theme.button.primary.background }]}
                onPress={handleSearch}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={theme.button.primary.text} />
                ) : (
                  <Text style={[styles.searchButtonText, { color: theme.button.primary.text }]}>
                    Search
                  </Text>
                )}
              </Pressable>
            </View>

            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.item,
                      {
                        backgroundColor: theme.card.background,
                        borderBottomColor: theme.border.light,
                      },
                    ]}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: theme.text.primary }]}>
                        {item.displayName}
                      </Text>
                    </View>
                    <Pressable
                      style={[
                        styles.addButton,
                        { backgroundColor: theme.button.primary.background },
                      ]}
                      onPress={() => handleSendRequest(item.id)}
                    >
                      <Text style={[styles.addButtonText, { color: theme.button.primary.text }]}>
                        Add
                      </Text>
                    </Pressable>
                  </View>
                )}
              />
            ) : (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.text.primary }]}>
                  Search for friends
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.text.secondary }]}>
                  Enter a username or email to find friends
                </Text>
              </View>
            )}
          </View>
        )}

        {tab === "blocked" && (
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.item,
                  { backgroundColor: theme.card.background, borderBottomColor: theme.border.light },
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.text.primary }]}>
                    {item.displayName}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.text.tertiary }]}>Blocked</Text>
                </View>
                <Pressable
                  style={[styles.actionButton, { borderColor: theme.border.medium }]}
                  onPress={() => handleUnblock(item.id, item.displayName)}
                >
                  <Text style={[styles.actionButtonText, { color: theme.text.secondary }]}>
                    Unblock
                  </Text>
                </Pressable>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.text.secondary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.text.primary }]}>
                  No blocked users
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: "400",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
  },
  tabTextActive: {
    fontWeight: "600",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemBio: {
    fontSize: 14,
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  declineButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  declineButtonText: {
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  requestsContainer: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    padding: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
