import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { auth, isAppleAuthAvailable } from "../../services/auth";
import { api } from "../../services/api";
import { logger } from "../../src/lib/logger";

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySending, setRecoverySending] = useState(false);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAuthAvailable);
  }, []);

  async function handleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const result = await auth.signInWithApple();

      if (result.success) {
        logger.info("SignIn: success", { userId: result.session.user.id });
        router.replace("/");
      } else {
        if (result.error.code === "CANCELLED") {
          logger.info("SignIn: cancelled by user");
        } else {
          setError(result.error.message);
          logger.error("SignIn: failed", { error: result.error });
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      logger.error("SignIn: unexpected error", { error: err });
    } finally {
      setLoading(false);
    }
  }

  async function handleRecovery() {
    if (!recoveryEmail.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setRecoverySending(true);
    try {
      const response = await api.auth.requestRecovery(recoveryEmail.trim());

      if ("error" in response) {
        Alert.alert("Error", response.error.message);
        return;
      }

      logger.info("SignIn: recovery email requested", { email: recoveryEmail });
      Alert.alert(
        "Recovery Email Sent",
        "If an account exists with this email, you will receive a recovery link. The link expires in 1 hour."
      );
      setShowRecoveryModal(false);
      setRecoveryEmail("");
    } catch (err) {
      logger.error("SignIn: recovery failed", { error: err });
      Alert.alert("Error", "Failed to send recovery email");
    } finally {
      setRecoverySending(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social Accountability</Text>
        <Text style={styles.subtitle}>Track habits with friends</Text>
      </View>

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : appleAuthAvailable && Platform.OS !== "web" ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        ) : (
          <Pressable style={styles.mockButton} onPress={handleSignIn}>
            <Text style={styles.mockButtonText}>Sign In (Dev Mode)</Text>
          </Pressable>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.forgotButton} onPress={() => setShowRecoveryModal(true)}>
          <Text style={styles.forgotText}>Trouble signing in?</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>
        By signing in, you agree to our Terms of Service and Privacy Policy
      </Text>

      <Modal
        visible={showRecoveryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecoveryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Account Recovery</Text>
            <Pressable onPress={() => setShowRecoveryModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.recoveryDescription}>
              Enter the email address associated with your Apple ID. We will send you a recovery
              link that expires in 1 hour.
            </Text>

            <TextInput
              style={styles.recoveryInput}
              value={recoveryEmail}
              onChangeText={setRecoveryEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <Pressable
              style={[
                styles.recoveryButton,
                (!recoveryEmail.trim() || recoverySending) && styles.recoveryButtonDisabled,
              ]}
              onPress={handleRecovery}
              disabled={!recoveryEmail.trim() || recoverySending}
            >
              {recoverySending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.recoveryButtonText}>Send Recovery Email</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  appleButton: {
    width: 280,
    height: 50,
  },
  mockButton: {
    width: 280,
    height: 50,
    backgroundColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  mockButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "red",
    marginTop: 16,
    textAlign: "center",
  },
  footer: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 40,
  },
  forgotButton: {
    marginTop: 20,
    padding: 8,
  },
  forgotText: {
    color: "#007AFF",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalClose: {
    color: "#007AFF",
    fontSize: 16,
  },
  modalContent: {
    padding: 20,
  },
  recoveryDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  recoveryInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  recoveryButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  recoveryButtonDisabled: {
    opacity: 0.5,
  },
  recoveryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
