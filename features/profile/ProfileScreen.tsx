import React, { useEffect, useState } from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Field } from "../../components/Primitives";
import { useAuth } from "../../lib/AuthContext";
import { colors, spacing } from "../../lib/theme";

type ProfileScreenProps = {
  onBack?: () => void;
  onDeleted?: () => void;
};

export function ProfileScreen({ onBack, onDeleted }: ProfileScreenProps) {
  const { userData, updateUserData, deleteAccount } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayName(userData?.displayName ?? userData?.username ?? "");
    setPhotoURL(userData?.photoURL ?? "");
  }, [userData]);

  async function saveProfile() {
    if (!displayName.trim()) {
      setMessage("Display name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    try {
      await updateUserData({
        displayName: displayName.trim(),
        username: displayName.trim(),
        photoURL: photoURL.trim(),
        profileComplete: Boolean(displayName.trim())
      });
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      await deleteAccount(password || undefined);
      onDeleted?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account could not be deleted.");
    }
  }

  function askToDelete() {
    if (Platform.OS === "web") {
      confirmDelete();
      return;
    }

    Alert.alert("Delete Account", "This permanently removes your Firebase user document and auth account.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: confirmDelete }
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Button label="Back" variant="secondary" onPress={onBack} style={styles.backButton} />
        <Button label="Save" onPress={saveProfile} loading={isSaving} style={styles.backButton} />
      </View>

      <View style={styles.avatarBlock}>
        <Image source={{ uri: photoURL || "https://placehold.co/180x180/png?text=D" }} style={styles.avatar} />
        <Text style={styles.avatarHint}>Paste an image URL below to update your avatar.</Text>
      </View>

      <View style={styles.form}>
        <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Field label="Photo URL" value={photoURL} onChangeText={setPhotoURL} autoCapitalize="none" />
        <Field label="Password for email account deletion" value={password} onChangeText={setPassword} secureTextEntry />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Button label="Delete Account" variant="danger" onPress={askToDelete} />
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
    gap: spacing.xl,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  backButton: {
    minWidth: 96
  },
  avatarBlock: {
    alignItems: "center",
    gap: spacing.md
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#E2E8F0"
  },
  avatarHint: {
    color: colors.muted,
    textAlign: "center"
  },
  form: {
    gap: spacing.lg
  },
  message: {
    color: colors.primary,
    lineHeight: 20
  }
});
