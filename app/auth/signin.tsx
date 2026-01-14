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
import { auth, isAppleAuthAvailable } from "../../src/services/auth";
import { api } from "../../src/services/api";
import { logger } from "../../src/lib/logger";
import { useTheme } from "../../src/theme";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function SignIn() {
  const { theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Social Accountability</Text>
        <Text style={[styles.subtitle, { color: theme.text.tertiary }]}>
          Track habits with friends
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.semantic.primary} />
        ) : appleAuthAvailable && Platform.OS !== "web" ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        ) : (
          <Pressable
            style={[styles.mockButton, { backgroundColor: theme.text.primary }]}
            onPress={handleSignIn}
          >
            <Text style={[styles.mockButtonText, { color: theme.background.primary }]}>
              Sign In (Dev Mode)
            </Text>
          </Pressable>
        )}

        {error && <Text style={[styles.error, { color: theme.semantic.danger }]}>{error}</Text>}

        <Pressable style={styles.forgotButton} onPress={() => setShowRecoveryModal(true)}>
          <Text style={[styles.forgotText, { color: theme.semantic.primary }]}>
            Trouble signing in?
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.footer, { color: theme.text.tertiary }]}>
        By signing in, you agree to our Terms of Service and Privacy Policy
      </Text>

      <Modal
        visible={showRecoveryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecoveryModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background.secondary }]}>
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: theme.background.primary, borderBottomColor: theme.border.light },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Account Recovery</Text>
            <Pressable onPress={() => setShowRecoveryModal(false)}>
              <Text style={[styles.modalClose, { color: theme.semantic.primary }]}>Cancel</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.recoveryDescription, { color: theme.text.tertiary }]}>
              Enter the email address associated with your Apple ID. We will send you a recovery
              link that expires in 1 hour.
            </Text>

            <TextInput
              style={[
                styles.recoveryInput,
                {
                  backgroundColor: theme.input.background,
                  borderColor: theme.input.border,
                  color: theme.text.primary,
                },
              ]}
              value={recoveryEmail}
              onChangeText={setRecoveryEmail}
              placeholder="Email address"
              placeholderTextColor={theme.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <Pressable
              style={[
                styles.recoveryButton,
                { backgroundColor: theme.button.primary.background },
                (!recoveryEmail.trim() || recoverySending) && styles.recoveryButtonDisabled,
              ]}
              onPress={handleRecovery}
              disabled={!recoveryEmail.trim() || recoverySending}
            >
              {recoverySending ? (
                <ActivityIndicator color={theme.button.primary.text} />
              ) : (
                <Text style={[styles.recoveryButtonText, { color: theme.button.primary.text }]}>
                  Send Recovery Email
                </Text>
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
    padding: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginTop: 80,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
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
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  mockButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  error: {
    marginTop: spacing.md,
    textAlign: "center",
  },
  footer: {
    fontSize: typography.fontSize.xs,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  forgotButton: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  forgotText: {
    fontSize: typography.fontSize.sm,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  modalClose: {
    fontSize: typography.fontSize.base,
  },
  modalContent: {
    padding: spacing.lg,
  },
  recoveryDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  recoveryInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
  },
  recoveryButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  recoveryButtonDisabled: {
    opacity: 0.5,
  },
  recoveryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
