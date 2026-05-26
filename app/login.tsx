import React from "react";
import { useRouter } from "expo-router";
import { AuthScreen } from "../features/auth/AuthScreen";

export default function LoginRoute() {
  const router = useRouter();
  return <AuthScreen onAuthenticated={() => router.replace("/")} />;
}
