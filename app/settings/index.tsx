import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { auth } from "../../services/auth";
import { api } from "../../services/api";
import { logger } from "../../src/lib/logger";
import type { User } from "../../src/types/user";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await auth.getUser();
      setUser(currentUser);
    } catch (err) {
      logger.error("Settings: failed to load user", { error: err });
    } finally {
      setLoading(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const response = await api.user.exportData();

      if ("error" in response) {
        Alert.alert("Error", response.error.message);
        return;
      }

      logger.info("Settings: data exported", { userId: user?.id });
      Alert.alert(
        "Export Complete",
        "Your data has been exported successfully. In a future update, you'll be able to download the file."
      );
    } catch (err) {
      logger.error("Settings: export failed", { error: err });
      Alert.alert("Error", "Failed to export data");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "DELETE") {
      Alert.alert("Error", "Please type DELETE to confirm");
      return;
    }

    setDeleting(true);
    try {
      const response = await api.user.deleteAccount("DELETE");

      if ("error" in response) {
        Alert.alert("Error", response.error.message);
        return;
      }

      logger.info("Settings: account deleted", { userId: user?.id });
      await auth.signOut();
      router.replace("/auth/signin");
    } catch (err) {
      logger.error("Settings: deletion failed", { error: err });
      Alert.alert("Error", "Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await auth.signOut();
          router.replace("/auth/signin");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <Pressable style={styles.item} onPress={() => router.push("/profile/setup")}>
          <Text style={styles.itemText}>Edit Profile</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={styles.item} onPress={() => router.push("/settings/privacy")}>
          <Text style={styles.itemText}>Privacy Settings</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <View style={styles.item}>
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>Recovery Email</Text>
            <Text style={styles.itemValue} numberOfLines={1}>
              {user?.email || "Not set"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Friends</Text>

        <Pressable style={styles.item} onPress={() => router.push("/friends")}>
          <Text style={styles.itemText}>Manage Friends</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <Pressable
          style={[styles.item, exporting && styles.itemDisabled]}
          onPress={handleExportData}
          disabled={exporting}
        >
          <Text style={styles.itemText}>{exporting ? "Exporting..." : "Export My Data"}</Text>
          {exporting && <ActivityIndicator size="small" color="#666" />}
        </Pressable>

        <Pressable style={styles.item} onPress={() => setShowDeleteModal(true)}>
          <Text style={[styles.itemText, styles.dangerText]}>Delete Account</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <Modal
        visible={showDeleteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Pressable onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.warningText}>This action is permanent and cannot be undone.</Text>
            <Text style={styles.warningText}>All your data will be deleted, including:</Text>
            <View style={styles.warningList}>
              <Text style={styles.warningItem}>• Your profile and settings</Text>
              <Text style={styles.warningItem}>• All goals and habits</Text>
              <Text style={styles.warningItem}>• All check-ins and progress</Text>
              <Text style={styles.warningItem}>• All posts and reactions</Text>
              <Text style={styles.warningItem}>• Friend connections</Text>
            </View>

            <View style={styles.graceNotice}>
              <Text style={styles.graceNoticeText}>
                Your account will be queued for deletion and processed within 24 hours. You have a
                30-day grace period to sign back in and cancel the deletion.
              </Text>
            </View>

            <Pressable
              style={styles.exportFirstButton}
              onPress={() => {
                setShowDeleteModal(false);
                handleExportData();
              }}
            >
              <Text style={styles.exportFirstText}>Export My Data First</Text>
            </Pressable>

            <Text style={styles.confirmLabel}>Type DELETE to confirm:</Text>
            <TextInput
              style={styles.confirmInput}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="DELETE"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Pressable
              style={[
                styles.deleteButton,
                deleteConfirmation !== "DELETE" && styles.deleteButtonDisabled,
              ]}
              onPress={handleDeleteAccount}
              disabled={deleteConfirmation !== "DELETE" || deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete My Account</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  section: {
    backgroundColor: "#fff",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    padding: 16,
    paddingBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemText: {
    fontSize: 16,
  },
  itemRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemValue: {
    fontSize: 14,
    color: "#666",
    maxWidth: 180,
  },
  chevron: {
    fontSize: 20,
    color: "#999",
  },
  dangerText: {
    color: "#ff3b30",
  },
  signOutButton: {
    padding: 16,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    color: "#007AFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalClose: {
    fontSize: 16,
    color: "#007AFF",
  },
  modalContent: {
    padding: 24,
  },
  warningText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  warningList: {
    marginBottom: 24,
  },
  warningItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  graceNotice: {
    backgroundColor: "#f0f7ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#cce0ff",
  },
  graceNoticeText: {
    fontSize: 13,
    color: "#0066cc",
    lineHeight: 18,
  },
  exportFirstButton: {
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  exportFirstText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    backgroundColor: "#ffb3b0",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
