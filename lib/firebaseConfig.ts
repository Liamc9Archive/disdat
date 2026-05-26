const env =
  (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ??
  {};

export const firebaseConfig = {
  apiKey:
    env.EXPO_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyB0i6vs8BbNhQ4nfbZfHEchvo8BWrKJYK4",
  authDomain:
    env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "disdat-9d04f.firebaseapp.com",
  projectId:
    env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
    "disdat-9d04f",
  storageBucket:
    env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "disdat-9d04f.firebasestorage.app",
  messagingSenderId:
    env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    "296250250883",
  appId:
    env.EXPO_PUBLIC_FIREBASE_APP_ID ??
    "1:296250250883:web:9b518ef178b6afe0f52db6",
  measurementId:
    env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ??
    "G-XY2NCQ5FES"
};
