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
import { api } from "../../services/api";
import { logger } from "../../src/lib/logger";
import type { User, FriendRequest } from "../../src/types/user";

type Tab = "friends" | "requests" | "search" | "blocked";

export default function Friends() {
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
      <Pressable style={styles.item} onLongPress={() => handleBlock(item.id, item.displayName)}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.displayName}</Text>
          {item.bio && (
            <Text style={styles.itemBio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleUnfriend(item.id, item.displayName)}
        >
          <Text style={styles.actionButtonText}>Remove</Text>
        </Pressable>
      </Pressable>
    );
  }

  function renderReceivedRequest({ item }: { item: FriendRequest }) {
    return (
      <View style={styles.item}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.sender.displayName}</Text>
          <Text style={styles.itemMeta}>Wants to be your friend</Text>
        </View>
        <View style={styles.requestActions}>
          <Pressable style={styles.acceptButton} onPress={() => handleAcceptRequest(item.id)}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </Pressable>
          <Pressable style={styles.declineButton} onPress={() => handleDeclineRequest(item.id)}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderSentRequest({ item }: { item: FriendRequest }) {
    return (
      <View style={styles.item}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.recipient.displayName}</Text>
          <Text style={styles.itemMeta}>Request pending</Text>
        </View>
        <Pressable style={styles.actionButton} onPress={() => handleDeclineRequest(item.id)}>
          <Text style={styles.actionButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "friends" && styles.tabActive]}
          onPress={() => setTab("friends")}
        >
          <Text style={[styles.tabText, tab === "friends" && styles.tabTextActive]}>
            Friends ({friends.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "requests" && styles.tabActive]}
          onPress={() => setTab("requests")}
        >
          <Text style={[styles.tabText, tab === "requests" && styles.tabTextActive]}>
            Requests ({requests.received.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "search" && styles.tabActive]}
          onPress={() => setTab("search")}
        >
          <Text style={[styles.tabText, tab === "search" && styles.tabTextActive]}>Add</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "blocked" && styles.tabActive]}
          onPress={() => setTab("blocked")}
        >
          <Text style={[styles.tabText, tab === "blocked" && styles.tabTextActive]}>Blocked</Text>
        </Pressable>
      </View>

      {tab === "friends" && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Add friends to share your progress</Text>
            </View>
          }
        />
      )}

      {tab === "requests" && (
        <View style={styles.requestsContainer}>
          {requests.received.length > 0 && (
            <View>
              <Text style={styles.sectionHeader}>Received</Text>
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
              <Text style={styles.sectionHeader}>Sent</Text>
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
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          )}
        </View>
      )}

      {tab === "search" && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by username or email"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Pressable style={styles.searchButton} onPress={handleSearch}>
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </Pressable>
          </View>

          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.displayName}</Text>
                  </View>
                  <Pressable style={styles.addButton} onPress={() => handleSendRequest(item.id)}>
                    <Text style={styles.addButtonText}>Add</Text>
                  </Pressable>
                </View>
              )}
            />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Search for friends</Text>
              <Text style={styles.emptySubtext}>Enter a username or email to find friends</Text>
            </View>
          )}
        </View>
      )}

      {tab === "blocked" && (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.displayName}</Text>
                <Text style={styles.itemMeta}>Blocked</Text>
              </View>
              <Pressable
                style={styles.actionButton}
                onPress={() => handleUnblock(item.id, item.displayName)}
              >
                <Text style={styles.actionButtonText}>Unblock</Text>
              </Pressable>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No blocked users</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  tabTextActive: {
    fontWeight: "600",
    color: "#000",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
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
    color: "#666",
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  actionButtonText: {
    fontSize: 14,
    color: "#666",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  declineButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  declineButtonText: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: "#fff",
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
    color: "#333",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  requestsContainer: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
