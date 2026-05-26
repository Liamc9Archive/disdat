# Disdat

Disdat is an Expo universal app. It uses Expo Router and React Native Web for iOS, Android, and web, with Firebase-backed product logic kept in the app.

## Workspace

- `app` - File-based Expo Router routes.
- `features` - Feature screens for auth, home, profile, and settings.
- `components` - Shared React Native primitives.
- `lib` - Firebase, auth providers, services, and theme helpers.
- `types` - Shared TypeScript types.

## Setup

Install dependencies:

```sh
pnpm install
```

Start Expo:

```sh
pnpm start
```

Run on web:

```sh
pnpm web
```

Run on iOS or Android:

```sh
pnpm ios
pnpm android
```

Build the Firebase-hosted Expo web export:

```sh
pnpm build
```

Run all TypeScript checks:

```sh
pnpm typecheck
```

## Firebase Configuration

The app reads Firebase values from public Expo environment variables and falls back to the existing Disdat Firebase project for local development.

Supported variables:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
