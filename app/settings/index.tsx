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
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { File, Paths } from "expo-file-system";
import Constants from "expo-constants";
import * as Sharing from "expo-sharing";
import { auth } from "../../src/services/auth";
import { api } from "../../src/services/api";
import { logger } from "../../src/lib/logger";
import { useTheme } from "../../src/theme";
import type { User } from "../../src/types/user";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { theme, mode, toggleTheme } = useTheme();

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

      const exportData = response.data;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `social-accountability-export-${timestamp}.json`;

      // Check if sharing is available
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (Platform.OS === "web") {
        // Web: trigger download via blob
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Alert.alert("Export Complete", "Your data has been downloaded.");
      } else if (sharingAvailable) {
        // Native: save to file and share using new expo-file-system API
        const file = new File(Paths.document, fileName);

        await file.write(JSON.stringify(exportData, null, 2));

        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Save your data export",
          UTI: "public.json",
        });

        // Clean up the file after sharing
        await file.delete();

        logger.info("Settings: data exported and shared", { userId: user?.id });
      } else {
        // Fallback: save to document directory only
        const file = new File(Paths.document, fileName);

        await file.write(JSON.stringify(exportData, null, 2));

        Alert.alert(
          "Export Complete",
          `Your data has been saved to the app's documents folder as ${fileName}`
        );

        logger.info("Settings: data exported to local file", {
          userId: user?.id,
          fileUri: file.uri,
        });
      }
    } catch (err) {
      logger.error("Settings: export failed", { error: err });
      Alert.alert("Error", "Failed to export data. Please try again.");
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
          { backgroundColor: theme.background.primary, borderBottomColor: theme.border.medium },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: theme.button.primary.background }]}>
            ‹ Back
          </Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: theme.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>Account</Text>

          <Pressable
            style={[styles.item, { borderTopColor: theme.border.light }]}
            onPress={() => router.push("/profile/setup")}
          >
            <Text style={[styles.itemText, { color: theme.text.primary }]}>Edit Profile</Text>
            <Text style={[styles.chevron, { color: theme.text.tertiary }]}>›</Text>
          </Pressable>

          <Pressable
            style={[styles.item, { borderTopColor: theme.border.light }]}
            onPress={() => router.push("/settings/privacy")}
          >
            <Text style={[styles.itemText, { color: theme.text.primary }]}>Privacy Settings</Text>
            <Text style={[styles.chevron, { color: theme.text.tertiary }]}>›</Text>
          </Pressable>

          <View style={[styles.item, { borderTopColor: theme.border.light }]}>
            <View style={styles.itemRow}>
              <Text style={[styles.itemText, { color: theme.text.primary }]}>Recovery Email</Text>
              <Text style={[styles.itemValue, { color: theme.text.secondary }]} numberOfLines={1}>
                {user?.email || "Not set"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>Friends</Text>

          <Pressable
            style={[styles.item, { borderTopColor: theme.border.light }]}
            onPress={() => router.push("/friends")}
          >
            <Text style={[styles.itemText, { color: theme.text.primary }]}>Manage Friends</Text>
            <Text style={[styles.chevron, { color: theme.text.tertiary }]}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>Appearance</Text>

          <Pressable
            style={[styles.item, { borderTopColor: theme.border.light }]}
            onPress={toggleTheme}
          >
            <Text style={[styles.itemText, { color: theme.text.primary }]}>Theme</Text>
            <Text style={[styles.itemValue, { color: theme.text.secondary }]}>
              {mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>Data</Text>

          <Pressable
            style={[
              styles.item,
              { borderTopColor: theme.border.light },
              exporting && styles.itemDisabled,
            ]}
            onPress={handleExportData}
            disabled={exporting}
          >
            <Text style={[styles.itemText, { color: theme.text.primary }]}>
              {exporting ? "Exporting..." : "Export My Data"}
            </Text>
            {exporting && <ActivityIndicator size="small" color={theme.text.secondary} />}
          </Pressable>

          <Pressable
            style={[styles.item, { borderTopColor: theme.border.light }]}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={[styles.itemText, styles.dangerText]}>Delete Account</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>About</Text>

          <View style={[styles.item, { borderTopColor: theme.border.light }]}>
            <Text style={[styles.itemText, { color: theme.text.primary }]}>Version</Text>
            <Text style={[styles.itemValue, { color: theme.text.secondary }]}>
              {Constants.expoConfig?.version || "0.0.0"} (
              {Constants.expoConfig?.extra?.eas?.projectId ? "EAS" : "Dev"})
            </Text>
          </View>

          <View style={[styles.item, { borderTopColor: theme.border.light }]}>
            <Text style={[styles.itemText, { color: theme.text.primary }]}>Build</Text>
            <Text style={[styles.itemValue, { color: theme.text.secondary }]}>
              {Constants.expoConfig?.ios?.buildNumber ||
                Constants.expoConfig?.android?.versionCode ||
                "1"}
            </Text>
          </View>

          {__DEV__ && (
            <Pressable
              style={[styles.item, { borderTopColor: theme.border.light }]}
              onPress={() => router.push("/dev")}
            >
              <Text style={[styles.itemText, { color: theme.text.primary }]}>🛠️ Dev Tools</Text>
              <Text style={[styles.chevron, { color: theme.text.tertiary }]}>›</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.background.primary }]}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={[styles.signOutText, { color: theme.button.primary.background }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border.light }]}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Delete Account</Text>
            <Pressable onPress={() => setShowDeleteModal(false)}>
              <Text style={[styles.modalClose, { color: theme.button.primary.background }]}>
                Cancel
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.warningText, { color: theme.text.primary }]}>
              This action is permanent and cannot be undone.
            </Text>
            <Text style={[styles.warningText, { color: theme.text.primary }]}>
              All your data will be deleted, including:
            </Text>
            <View style={styles.warningList}>
              <Text style={[styles.warningItem, { color: theme.text.secondary }]}>
                • Your profile and settings
              </Text>
              <Text style={[styles.warningItem, { color: theme.text.secondary }]}>
                • All goals and habits
              </Text>
              <Text style={[styles.warningItem, { color: theme.text.secondary }]}>
                • All check-ins and progress
              </Text>
              <Text style={[styles.warningItem, { color: theme.text.secondary }]}>
                • All posts and reactions
              </Text>
              <Text style={[styles.warningItem, { color: theme.text.secondary }]}>
                • Friend connections
              </Text>
            </View>

            <View
              style={[
                styles.graceNotice,
                { backgroundColor: "#007AFF" + "20", borderColor: "#007AFF" + "60" },
              ]}
            >
              <Text style={[styles.graceNoticeText, { color: "#007AFF" }]}>
                Your account will be queued for deletion and processed within 24 hours. You have a
                30-day grace period to sign back in and cancel the deletion.
              </Text>
            </View>

            <Pressable
              style={[styles.exportFirstButton, { borderColor: theme.border.medium }]}
              onPress={() => {
                setShowDeleteModal(false);
                handleExportData();
              }}
            >
              <Text style={[styles.exportFirstText, { color: theme.button.primary.background }]}>
                Export My Data First
              </Text>
            </Pressable>

            <Text style={[styles.confirmLabel, { color: theme.text.primary }]}>
              Type DELETE to confirm:
            </Text>
            <TextInput
              style={[
                styles.confirmInput,
                {
                  borderColor: theme.border.medium,
                  color: theme.text.primary,
                  backgroundColor: theme.input.background,
                },
              ]}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="DELETE"
              placeholderTextColor={theme.text.tertiary}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Pressable
              style={[
                styles.deleteButton,
                { backgroundColor: theme.text.error },
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
  scrollContent: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
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
    maxWidth: 180,
  },
  chevron: {
    fontSize: 20,
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
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalClose: {
    fontSize: 16,
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
    marginBottom: 4,
  },
  graceNotice: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  graceNoticeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  exportFirstButton: {
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  exportFirstText: {
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  deleteButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
