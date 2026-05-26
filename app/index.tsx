import React from "react";
import { useRouter } from "expo-router";
import { HomeScreen } from "../features/home/HomeScreen";

export default function HomeRoute() {
  const router = useRouter();

  return (
    <HomeScreen
      onOpenLogin={() => router.push("/login")}
      onOpenSettings={() => router.push("/settings")}
    />
  );
}
