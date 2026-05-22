# Yoke

> "Faith is better together."

Yoke is a Christian devotional app that makes spiritual accountability social. Every day, users receive a Bible passage and a guided reflection prompt, write their devotional, and share it with friends and small groups — turning a solo habit into a communal one.

Available on **iOS** and **Android**.

---

## Features

- **Daily devotional** — curated Bible passage with a reflection prompt each day
- **Friends & group feed** — see what your friends and small groups are writing
- **Reactions & comments** — encourage others on their entries
- **Group streaks** — accountability streaks that reset if the group misses a day
- **Full Bible reader** — multiple translations, search, chapter navigation
- **Devotional calendar** — visual history of every day you've posted
- **Personal streak** — track your daily consistency
- **User profiles** — follow friends, view their devotional history
- **Push notifications** — daily reminders and friend activity alerts
- **Yoke Premium** — unlimited groups, full devotional history, see who reacted (via RevenueCat)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (Tailwind for RN) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Auth | Supabase Auth — PKCE flow, email confirmation, deep link handling |
| Subscriptions | RevenueCat |
| Email | Resend (custom SMTP via Supabase Auth) |
| Push | Expo Push Notifications |

---

## Project Structure

```
app/
  (auth)/          # Welcome, signup, login, onboarding, email verify
  (tabs)/          # Main tab screens: feed, bible, groups, profile
  group/           # Group detail and management screens
  user/            # Public user profile screen
  friends.tsx      # Friends list and search
  calendar.tsx     # Devotional history calendar
  notifications.tsx
  settings.tsx     # Account settings, reminders, delete account

components/        # Shared UI components
lib/               # supabase, revenuecat, notifications, utils
constants/         # Theme colors, fonts
supabase/
  migrations/      # All DB schema and function migrations
  functions/       # Edge functions (delete-account, sync-premium-webhook)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) project
- A [RevenueCat](https://revenuecat.com) project (iOS + Android apps)

### 1. Clone and install

```bash
git clone https://github.com/RayKang8/yoke.git
cd yoke
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
```

### 3. Run database migrations

Apply all migrations in order from `supabase/migrations/` via the Supabase dashboard SQL editor or the Supabase CLI:

```bash
supabase db push
```

### 4. Start the dev server

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or run on a simulator.

> **Note:** Some features (push notifications, in-app purchases) require a development build rather than Expo Go.

---

## Building for Production

```bash
npm install -g eas-cli
eas login
eas build --platform all
eas submit --platform ios
eas submit --platform android
```

---

## Supabase Setup Notes

- **Auth → URL Configuration**: set Site URL to `yoke://` and add `yoke://` to Redirect URLs (required for deep link email confirmation)
- **Edge Functions**: `delete-account` and `sync-premium-webhook` must be deployed via `supabase functions deploy`
- **pg_cron**: migrations 006 and 014 use `pg_cron` — enable it in Supabase under Database → Extensions
- **Storage**: migration 013 creates an `avatars` bucket — ensure it exists in Storage

---

## License

Private — all rights reserved.
