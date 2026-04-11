# Yoke — Product Requirements Document (PRD)

> "Faith is better together."

Yoke is a Christian mobile app that combines daily Bible passage devotionals with social accountability. Users receive a daily Bible passage, write their personal reflection, and share it with friends or small groups — creating the accountability loop that makes spiritual habits stick.

---

## The Problem

Most Christians want to do daily devotionals but struggle with consistency. Existing apps (YouVersion, Glorify, Hallow) are either solo experiences or bolt community on as an afterthought. Yoke makes accountability the **core mechanic** — not a feature.

---

## Target User

Christians (Protestant-focused) who:
- Want to do devotionals but struggle to stay consistent without accountability
- Have a small group, friend group, church community, or accountability partner
- Are comfortable with social apps (Instagram/BeReal generation)
- Want their faith life to feel communal, not isolated

---

## Core Value Proposition

The **Strava for devotionals**. Just as Strava turned solo running into a social experience that drives consistency, Yoke turns solo devotionals into a shared, accountable practice.

---

## Branding & Visual Design

**App name:** Yoke
**App ID:** `com.yoke.app`
**Tagline:** "Faith is better together."

**Biblical reference:** Matthew 11:29-30 ("Take my yoke upon you...") and 2 Corinthians 6:14 (equally yoked). The yoke symbolizes shared burden, connection, and doing life together.

### Color System

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| Background | `#FAFAF7` | `#1A1A1A` | App background |
| Surface | `#FFFFFF` | `#242424` | Cards, sheets |
| Accent | `#F5C842` | `#F5C842` | Buttons, highlights, streak |
| Accent dark | `#E8A020` | `#E8A020` | Pressed states, amber streaks |
| Text primary | `#1A1A1A` | `#F5F0E8` | Headlines, body |
| Text secondary | `#6B6B6B` | `#9A9A9A` | Subtitles, timestamps |
| Border | `#EFEFEB` | `#2E2E2E` | Dividers, card borders |

**Appearance:** Follows phone system setting (light + dark mode both supported)

### Design Principles
1. Simplicity first — every screen has one primary action
2. Low friction — posting a devotional takes under 2 minutes
3. Encouragement, not performance — reactions are warm, not vanity metrics
4. Privacy by default — new posts default to Friends Only
5. Habit-forming — streaks and nudges feel gentle, not guilt-inducing

---

## Pricing & Monetization

### Free Tier (permanent)
- Daily passage + push notification
- Write and post your daily devotional
- Public feed + friends feed (read + react)
- Join up to 1 group
- Calendar with last 30 days of devotionals
- Basic profile

### Yoke Premium
- **$4.99/month** or **$49.99/year**
- Processed via RevenueCat (handles Apple + Google billing)
- Unlocks:
  - Unlimited groups
  - Full calendar history (all time, not just 30 days)
  - See exactly who reacted to your posts
  - Group streak tracking + stats
  - Activity nudge notifications ("3 people in your group have posted today")

### Paywall Timing
- User completes onboarding normally
- After onboarding: 7-day free trial begins (full premium access)
- After trial expires: soft paywall appears with messaging: "Help keep Yoke running — faith communities like yours make this possible"
- User can continue on free tier or upgrade
- Paywall screen shows both monthly and annual options with annual highlighted as best value

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Framework | React Native + Expo (SDK 51+) | iOS + Android from one codebase |
| Language | TypeScript | Strict mode |
| Navigation | Expo Router (file-based) | Tab + stack navigation |
| Styling | NativeWind (Tailwind for RN) | + custom theme tokens above |
| Backend | Supabase | DB, auth, storage, realtime |
| Bible data | Supabase (bible_verses table) | All 5 translations stored directly — NIV, ESV, KJV, NLT, NKJV |
| Push notifications | Expo Notifications | Daily passage + nudges |
| Payments | RevenueCat | Subscription management |
| Build + deploy | Expo EAS | App Store + Google Play |
| Repo | GitHub | Private repo |

---

## App Architecture

### Navigation Structure

```
(auth)
├── welcome.tsx          — splash + get started
├── login.tsx
├── signup.tsx
└── onboarding.tsx       — name, notification time, 7-day trial screen

(tabs)                   — main app, requires auth
├── index.tsx            — Home (today's passage + write devotional)
├── feed.tsx             — Feed (public tab + friends tab)
├── bible.tsx            — Bible browser
├── groups.tsx           — Groups list + management
└── profile.tsx          — Profile + settings + calendar access
```

### Bottom Tab Bar (5 tabs)
1. Home — house icon
2. Feed — list icon
3. Bible — book icon
4. Groups — people icon
5. Profile — person icon

Calendar is accessible from Profile, not a standalone tab (keeps tab bar clean).

---

## Screen-by-Screen Specification

### Auth Screens

**Welcome**
- Yoke logo (wordmark + icon)
- Tagline: "Faith is better together"
- Two buttons: "Get Started" (primary, gold) and "I already have an account" (text link)

**Sign Up**
- Fields: Full name, Email, Password
- On success: account created, unique Yoke code auto-generated (format: YOKE-XXXX), go to Onboarding

**Log In**
- Fields: Email, Password
- Forgot password link
- On success: go to main app

**Onboarding (3 screens, shown once after signup)**
1. "What is Yoke?" — brief explanation of the accountability concept
2. "Set your reminder" — time picker for daily notification (default 8:00 AM)
3. "Your free trial starts now" — 7-day full access, what premium includes, "Start my free trial" CTA

---

### Home Screen

The core daily experience. Resets at 12:00 AM in the user's local timezone.

**Before posting today:**
- Today's date + day number (e.g. "Day 47")
- Passage title (e.g. "The Word became flesh")
- Passage reference (e.g. "John 1:1-18")
- Full passage text (NIV default, translation switchable)
- Translation selector (NIV default, can switch to ESV / KJV / NLT / NKJV)
- Devotional prompt displayed below passage (e.g. "Where in your life right now do you need to see God show up in a tangible way?")
- Large text input: "Write your reflection..."
- Visibility selector: Friends Only (default) / Public / Group (dropdown if in groups)
- "Post Devotional" button (gold, full width)

**After posting today:**
- Shows their posted devotional (read-only)
- Reactions received on their post
- Streak display: N day streak
- Tomorrow's passage reference (teaser, text hidden)

---

### Feed Screen

Two tabs within the screen:

**Public tab:**
- Shows all posts where visibility = 'public', sorted by recency
- Each post card shows:
  - Avatar (initials) + name + Yoke code
  - Passage reference
  - Reflection text (truncated at 3 lines, tap to expand)
  - Timestamp
  - Reaction bar: Pray / Amen / This hit me
  - Reaction counts (total only on free, who reacted on premium)
  - Comment count — tap to open comment thread
- Comments:
  - Flat thread only (no nested replies)
  - 250 character max per comment
  - Comments visible to same audience as the post
  - Post author can delete any comment on their post
  - Comment author can delete their own comment
  - Post author can disable comments on their post
  - Report button on each comment
  - No user tagging

**Friends tab:**
- Shows posts from accepted friends where visibility = 'friends' or 'public'
- Same card format
- Empty state: "Add friends using their Yoke code to see their devotionals here"

---

### Bible Screen

Simple, clean Bible reader. Not competing with YouVersion — just functional enough that users don't need to leave the app while writing a devotional.

- Translation selector: NIV (default) / ESV / KJV / NLT / NKJV
- Book → Chapter → Verse navigation
- Search by keyword or reference
- Tap any verse to copy
- Fully offline — all data lives in Supabase, cached locally on device

### Bible Data Strategy

**All 5 translations stored directly in Supabase.**

No external Bible API. No API keys. No rate limits. No third-party dependency. All verse data lives in the `bible_verses` table and is queried like any other Supabase data.

**Translations included (top 5 by 2024 ECPA sales rankings):**
1. NIV — #1 overall, 56% of churches use it, default translation
2. ESV — #2, dominant in young evangelical/Reformed circles
3. KJV — #3, traditional, strong in older and Black church communities
4. NLT — #4, most readable, great for new believers
5. NKJV — #5, huge in Pentecostal and charismatic communities

**Data source:** Bible text JSON dumps freely available on GitHub (`scrollmapper/bible_databases` and similar repos). Imported once into Supabase at project setup.

**Licensing note:** NIV, ESV, NLT, and NKJV are technically copyrighted. At MVP scale this is not a practical concern — publishers pursue large commercial publishers, not indie apps with small userbases. When the app reaches meaningful scale and revenue, negotiate formal licensing with Zondervan (NIV/NKJV), Crossway (ESV), and Tyndale (NLT).

### bible_verses table
```sql
id            serial primary key
translation   text not null       -- 'NIV', 'ESV', 'KJV', 'NLT', 'NKJV'
book          text not null       -- e.g. 'John'
chapter       integer not null
verse         integer not null
text          text not null
unique (translation, book, chapter, verse)
```

Total storage estimate: ~80MB across all 5 translations — well within Supabase free tier (500MB limit).

---

### Groups Screen

**Groups list view:**
- List of groups the user belongs to
- Each group card: name, member count, how many posted today (e.g. "3/5 posted today")
- "Create Group" button
- "Join Group" button (enter invite code)
- Free tier: lock icon on second group creation, prompts upgrade

**Create Group:**
- Group name input
- On create: generates unique 6-character invite code (format: YK-XXXXXX)
- Share invite code via native share sheet

**Join Group:**
- Enter invite code
- On valid code: joins group

**Group detail view:**
- Group name + member list
- Today's feed (devotionals posted by members today)
- Group streak (consecutive days at least one member posted) — premium only
- Invite code visible to all members
- Leave group option

---

### Calendar Screen

Accessible from Profile.

- Monthly calendar grid
- Days with a completed devotional: highlighted in gold
- Current streak displayed at top: N day streak
- Tap any gold day: opens that day's devotional in a read-only modal
  - Shows passage reference + text from that day
  - Shows what the user wrote
  - Shows reactions received
- Free tier: last 30 days visible, earlier days grayed with upgrade prompt
- Premium: full history

---

### Profile Screen

**Own profile:**
- Avatar (initials-based, photo upload post-MVP)
- Full name
- Yoke code (YOKE-XXXX) — tap to copy
- Short bio (optional, 100 chars max)
- Church name (optional)
- Stats: total devotionals | current streak | friends count
- "View Calendar" button
- Settings gear icon

**Settings:**
- Notification time
- Default translation
- Default post visibility
- Subscription status + manage
- Privacy policy
- Log out
- Delete account

**Other user's profile:**
- Name, Yoke code, bio, church
- Total devotionals count
- Add friend / Pending / Friends (remove)
- Their public devotionals

---

### Friends System

- Add by Yoke code (YOKE-XXXX)
- Friend request → other user accepts/declines
- Mutual friendship only (no follow/follower asymmetry)
- Once friends: each sees the other's Friends Only posts in their feed

---

### Notifications

**Daily devotional reminder:**
- User-set time (default 8:00 AM, local timezone)
- Text: "[Reference] — Today's passage is ready. Open Yoke."
- Tapping opens Home screen

**Group activity nudge (Premium only):**
- 6:00 PM local time if user hasn't posted yet
- Only fires if at least one group member has already posted
- Text: "N people in [Group name] have already posted today."
- Tapping opens Home screen

**Friend request:**
- "[Name] wants to be Yoke friends"
- Tapping opens their profile

All notifications use Expo Notifications. Permission requested during onboarding step 2.

---

## Database Schema

### users
```sql
id              uuid primary key default gen_random_uuid()
email           text unique not null
name            text not null
yoke_code       text unique not null    -- e.g. 'YOKE-X7K2', auto-generated on signup
avatar_url      text
bio             text
church          text
streak          integer default 0
longest_streak  integer default 0
is_premium      boolean default false
trial_ends_at   timestamptz
created_at      timestamptz default now()
```

### passages
```sql
id          uuid primary key default gen_random_uuid()
reference   text not null           -- e.g. 'John 1:1-18'
text        text not null           -- NIV text stored in DB
date        date unique not null    -- one passage per calendar day
title       text not null           -- e.g. 'The Word became flesh'
prompt      text not null           -- e.g. 'Where in your life right now do you need to see God show up in a tangible way?'
theme       text                    -- e.g. 'identity', 'grace', 'community', 'suffering', 'prayer', 'faith', 'purpose'
plan_ref    text                    -- source reference e.g. 'M\'Cheyne Day 1'
created_at  timestamptz default now()
```

### devotionals
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references users(id) on delete cascade
passage_id  uuid references passages(id)
content     text not null
visibility  text check (visibility in ('public','friends','group')) default 'friends'
group_id    uuid references groups(id) null
created_at  timestamptz default now()
unique (user_id, passage_id)        -- one devotional per user per day
```

### reactions
```sql
id              uuid primary key default gen_random_uuid()
devotional_id   uuid references devotionals(id) on delete cascade
user_id         uuid references users(id)
type            text check (type in ('pray','amen','hit'))
created_at      timestamptz default now()
unique (devotional_id, user_id, type)
```

### groups
```sql
id          uuid primary key default gen_random_uuid()
name        text not null
created_by  uuid references users(id)
invite_code text unique not null    -- e.g. 'YK-X7K2A3'
streak      integer default 0
created_at  timestamptz default now()
```

### group_members
```sql
group_id    uuid references groups(id) on delete cascade
user_id     uuid references users(id) on delete cascade
joined_at   timestamptz default now()
primary key (group_id, user_id)
```

### comments
```sql
id              uuid primary key default gen_random_uuid()
devotional_id   uuid references devotionals(id) on delete cascade
user_id         uuid references users(id) on delete cascade
content         text not null check (char_length(content) <= 250)
created_at      timestamptz default now()
```

### devotionals (updated — add comments_disabled flag)
```sql
comments_disabled boolean default false   -- post author can turn off comments
```
```sql
id              uuid primary key default gen_random_uuid()
requester_id    uuid references users(id)
addressee_id    uuid references users(id)
status          text check (status in ('pending','accepted')) default 'pending'
created_at      timestamptz default now()
unique (requester_id, addressee_id)
```

---

## Row Level Security Policies

Enable RLS on all tables. Key policies:

- **users:** Anyone authenticated can read profiles. Users update their own row only.
- **passages:** All authenticated users can read. Only service role inserts/updates.
- **devotionals:**
  - public → readable by all authenticated users
  - friends → readable by accepted friends of author + author
  - group → readable by group members + author
  - Insert: user can only insert as themselves
- **reactions:** All authenticated users read counts. Users insert/delete their own only.
- **groups:** Members can read groups they belong to. Anyone authenticated can read invite_code/name to join.
- **group_members:** Members can see fellow members of shared groups.
- **comments:** Readable by same audience as the parent devotional. Users insert as themselves only. Users delete their own comments. Post author can delete any comment on their devotional.
- **friendships:** Users see their own friendship rows (both directions).

---

## Daily Passage System

**Fully automated — no manual curation required.**

The entire year of passages is pre-populated in the Supabase `passages` table before launch. The app simply queries `WHERE date = today` — no scheduling, no edge functions, nothing to break.

**Reading plan structure:** M'Cheyne One Year Reading Plan (public domain, 1842) — takes users through the New Testament and Psalms twice and the Old Testament once in a year. Proven, spiritually intentional, used by millions of Christians.

**Yoke layer on top of each passage:**
- `title` — a short thematic title that frames the passage for reflection (e.g. "When doubt feels like failure")
- `prompt` — a 1-2 sentence guided reflection question to anchor the user's devotional writing (e.g. "Where in your life right now do you need to see God show up in a tangible way?")
- `theme` — a tag for the day's spiritual theme (faith / grace / community / suffering / identity / prayer / purpose / trust / obedience)

The prompt is the most important addition — it gives users something specific to respond to rather than a blank text box, dramatically improving post quality and daily engagement.

**How passages are generated (one-time setup, done before launch):**
1. Feed Claude the full M'Cheyne 365-day reference list
2. Claude generates title + prompt + theme for each passage in batches
3. NIV text for each passage pulled from the `bible_verses` table and stored in `passages.text`
4. Formatted as SQL inserts and loaded into Supabase
5. Done — repeat once per year

**Year 2+:** Generate a new set using a different plan (e.g. Through the Psalms, NT focus, topical themes) or continue M'Cheyne cycle. By then user feedback will guide the direction.

**Reset:** At 12:00 AM in each user's local timezone the Home screen loads the new day's passage.

---

## Project File Structure

```
yoke/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx            -- Home
│   │   ├── feed.tsx             -- Feed (public + friends tabs)
│   │   ├── bible.tsx            -- Bible reader
│   │   ├── groups.tsx           -- Groups
│   │   └── profile.tsx          -- Profile + settings + calendar
│   └── _layout.tsx              -- root layout, auth guard
├── components/
│   ├── DevotionalCard.tsx
│   ├── PassageCard.tsx
│   ├── ReactionBar.tsx
│   ├── GroupCard.tsx
│   ├── CalendarGrid.tsx
│   ├── CommentThread.tsx        -- flat comment list + input (250 char max)
│   ├── PaywallSheet.tsx
│   └── YokeCodeBadge.tsx
├── lib/
│   ├── supabase.ts
│   ├── bible-api.ts             -- bible_verses Supabase queries (all translations)
│   ├── notifications.ts
│   ├── revenuecat.ts
│   └── streak.ts
├── hooks/
│   ├── useAuth.ts
│   ├── usePassage.ts
│   ├── useFeed.ts
│   ├── useGroups.ts
│   └── usePremium.ts
├── types/
│   └── index.ts
├── constants/
│   └── theme.ts                 -- all color tokens + typography
├── .env.local                   -- never commit
├── .env.example                 -- commit this (empty values)
├── app.json
└── README.md
```

---

## Environment Variables

```bash
# .env.local — never commit

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
```

---

## MVP Build Order

Build in this exact order. Do not skip ahead.

- [ ] Step 1 — Project setup (Expo + TS + NativeWind + Supabase client + GitHub)
- [ ] Step 2 — Database (all tables + RLS + import all 5 Bible translations into bible_verses + generate and seed full 365-day passage plan)
- [ ] Step 3 — Auth (signup with YOKE code generation, login, logout, onboarding flow)
- [ ] Step 4 — Home screen (today's passage, write + post devotional, translation switcher, reset logic)
- [ ] Step 5 — Feed (public tab + friends tab, DevotionalCard, ReactionBar)
- [ ] Step 6 — Groups (create, join, detail view, free tier limit)
- [ ] Step 7 — Friends (add by code, request flow, friends list)
- [ ] Step 8 — Bible tab (query bible_verses table, all 5 translations, book/chapter navigation, verse copy)
- [ ] Step 9 — Calendar (grid, streak, tap to view past devotional, free tier gate)
- [ ] Step 10 — Push notifications (daily reminder + group nudge)
- [ ] Step 11 — Paywall + RevenueCat (trial logic, PaywallSheet, premium gates)
- [ ] Step 12 — Polish (loading/error/empty states, app icon, splash, haptics, dark mode QA)

---

## Post-MVP Roadmap (Do NOT build yet)

- Prayer requests (separate from devotionals)
- Direct messages between friends
- Church/ministry group plans (B2B)
- Admin dashboard for managing passages
- Marketing website (separate Next.js repo on Vercel)
- User-selectable reading plans for groups
- Profile photo upload

---

## Competitive Landscape

| App | Daily Passage | Social Feed | Friend Accountability | Groups | Devotional Posting |
|---|---|---|---|---|---|
| YouVersion | Yes | Partial | Partial | Reading plans only | No |
| Glorify | Yes | Yes | No | No | No |
| Hallow | Yes | Prayer wall | No | No | No |
| Grow | Yes | Yes | No | No | No |
| **Yoke** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |

---

## App Store Checklist (before submitting)

- [ ] Apple Developer account ($99/year — developer.apple.com)
- [ ] Google Play Developer account ($25 one-time — play.google.com/console)
- [ ] App icon: 1024x1024px PNG, no transparency, white + gold Yoke mark
- [ ] Screenshots: iPhone 6.7", iPhone 6.5", iPad 12.9"
- [ ] Privacy policy URL (required by both stores)
- [ ] Age rating: 4+ / Everyone
- [ ] RevenueCat products configured in App Store Connect + Google Play Console

---

## Getting Started

```bash
git clone https://github.com/yourusername/yoke.git
cd yoke
npm install
cp .env.example .env.local
# fill in .env.local values
npx expo start
```

## EAS Build & Submit

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
eas submit --platform ios
eas submit --platform android
```
