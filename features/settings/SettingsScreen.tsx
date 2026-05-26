import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Primitives";
import { useAuth } from "../../lib/AuthContext";
import { colors, spacing } from "../../lib/theme";

type SettingsScreenProps = {
  onOpenProfile?: () => void;
  onLoggedOut?: () => void;
};

export function SettingsScreen({ onOpenProfile, onLoggedOut }: SettingsScreenProps) {
  const { currentUser, userData, logout } = useAuth();

  async function handleLogout() {
    await logout();
    onLoggedOut?.();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>

      <Pressable style={styles.profileRow} onPress={onOpenProfile}>
        <Image
          source={{ uri: userData?.photoURL || "https://placehold.co/160x160/png?text=D" }}
          style={styles.avatar}
        />
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{userData?.displayName || userData?.username || "Disdat User"}</Text>
          <Text style={styles.profileMeta}>{currentUser?.isAnonymous ? "Guest session" : currentUser?.email}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Manage account</Text>
          <Text style={styles.settingValue}>Profile, display name, and account removal</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Communication</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Email notifications</Text>
          <Text style={styles.settingValue}>Stored in your Firebase user document</Text>
        </View>
      </View>

      <Button label="Log Out" variant="danger" onPress={handleLogout} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Disdat</Text>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center"
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900"
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E2E8F0"
  },
  profileText: {
    flex: 1
  },
  profileName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  profileMeta: {
    color: colors.muted,
    marginTop: 4
  },
  chevron: {
    color: colors.muted,
    fontSize: 32
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  settingItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.lg
  },
  settingLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  settingValue: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing.xl,
    gap: spacing.xs
  },
  footerText: {
    color: colors.muted
  }
});
