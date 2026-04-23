# Yoke

> "Faith is better together."

Yoke is a Christian devotional app that makes spiritual accountability social. Users receive a daily Bible passage, write their reflection, and share it with friends and small groups — turning a solo habit into a communal one.

Available on iOS and Android.

---

## Features

- Daily Bible passage with a guided reflection prompt
- Write and post your devotional each day
- Friends feed and public feed with reactions and comments
- Small group accountability with group streaks
- Full Bible reader (multiple translations)
- Calendar to track your devotional history
- Streak tracking
- Yoke Premium — unlimited groups, full history, see who reacted

---

## Tech Stack

- **React Native + Expo** (iOS & Android)
- **TypeScript**
- **Supabase** (database, auth, storage)
- **RevenueCat** (subscriptions)
- **Expo Router** (navigation)
- **NativeWind** (styling)

---

## Getting Started

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/RayKang8/yoke.git
cd yoke
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
# Fill in your Supabase and RevenueCat keys
```

3. Start the dev server:

```bash
npx expo start
```

---

## Build & Submit

```bash
npm install -g eas-cli
eas login
eas build --platform all
eas submit --platform ios
eas submit --platform android
```

---

## License
