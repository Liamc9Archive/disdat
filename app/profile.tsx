import React from "react";
import { useRouter } from "expo-router";
import { ProfileScreen } from "../features/profile/ProfileScreen";

export default function ProfileRoute() {
  const router = useRouter();

  return (
    <ProfileScreen
      onBack={() => router.back()}
      onDeleted={() => router.replace("/login")}
    />
  );
}
