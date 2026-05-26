import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../lib/AuthContext";
import { NotificationProvider } from "../lib/NotificationContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#F8FAFC" }
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}
