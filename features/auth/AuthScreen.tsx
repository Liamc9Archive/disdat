import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Field } from "../../components/Primitives";
import { useAuth } from "../../lib/AuthContext";
import { colors, spacing } from "../../lib/theme";

type AuthScreenProps = {
  onAuthenticated?: () => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const { login, signup, resetPassword, loginWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Email and password are required.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signup(email.trim(), password, username.trim() || email.trim());
        setMessage("Account created. Check your email for verification.");
      } else {
        await login(email.trim(), password);
        onAuthenticated?.();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setMessage("Enter your email first.");
      return;
    }

    try {
      await resetPassword(email.trim());
      setMessage("Password reset email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send reset email.");
    }
  }

  async function googleSignIn() {
    setMessage("");
    try {
      await loginWithGoogle();
      onAuthenticated?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <Text style={styles.brandText}>D</Text>
        </View>
        <Text style={styles.title}>{isSignUp ? "Create your Disdat account" : "Welcome back to Disdat"}</Text>
        <Text style={styles.subtitle}>Post quick polls, vote fast, and see where the room lands.</Text>

        <View style={styles.form}>
          {isSignUp ? (
            <View>
              <Field label="Display name" value={username} onChangeText={setUsername} textContentType="name" />
            </View>
          ) : null}
          <View>
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" />
          </View>
          <View>
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />
          </View>
          {isSignUp ? (
            <View>
              <Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry textContentType="password" />
            </View>
          ) : null}

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Button label={isSignUp ? "Sign Up" : "Sign In"} onPress={submit} loading={isLoading} />
          {!isSignUp ? <Button label="Forgot Password" variant="ghost" onPress={forgotPassword} /> : null}
          {Platform.OS === "web" ? <Button label="Continue With Google" variant="secondary" onPress={googleSignIn} /> : null}
          <Button
            label={isSignUp ? "I Already Have An Account" : "Create An Account"}
            variant="ghost"
            onPress={() => {
              setMessage("");
              setIsSignUp((value) => !value);
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center"
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xl
  },
  form: {
    gap: spacing.lg
  },
  message: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20
  }
});
