import React from "react";
import { useRouter } from "expo-router";
import { SettingsScreen } from "../features/settings/SettingsScreen";

export default function SettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      onOpenProfile={() => router.push("/profile")}
      onLoggedOut={() => router.replace("/login")}
    />
  );
}
