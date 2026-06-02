# Colorado Sports Events Tracker

A modern web application to track Colorado professional and college sports teams, schedules, scores, and personal game attendance.

## Features

- **Live Scores** — Auto-refreshing scores every 5 minutes during active seasons
- **Upcoming Schedule** — Next 3 games for each team
- **Dual Organization** — Browse by priority (primary/secondary) or by sport
- **Game Tracker** — Log games you've attended or watched online (syncs across devices via Supabase)
- **Auto-updating** — Daily cron job rebuilds the site with fresh schedule data

## Teams Tracked

### Primary
- Denver Broncos (NFL)
- Denver Nuggets (NBA)
- Colorado Avalanche (NHL)
- Colorado Rockies (MLB)

### Secondary
- Colorado Rapids (MLS)
- Colorado Mammoth (NLL)
- CU Buffaloes (all sports)
- CSU Rams (all sports)
- Air Force Falcons (all sports)

## Tech Stack

- [Astro](https://astro.build/) — Static site generator
- [React](https://react.dev/) — Interactive components
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Supabase](https://supabase.com/) — Authentication & database
- [ESPN API](https://site.api.espn.com/) — Sports data
- [GitHub Pages](https://pages.github.com/) — Hosting
- [GitHub Actions](https://github.com/features/actions) — CI/CD & daily rebuilds

## Setup

### Prerequisites
- Node.js 20+
- A Supabase project (free tier works)

### Local Development

1. Clone the repo:
   ```bash
   git clone https://github.com/mreadie/events-tracker.git
   cd events-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   # Fill in your Supabase credentials
   ```

4. Start dev server:
   ```bash
   npm run dev
   ```

### Supabase Setup

1. Create a new Supabase project
2. Enable GitHub authentication in Authentication > Providers
3. Create the `game_attendance` table:
   ```sql
   CREATE TABLE game_attendance (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     team_key TEXT NOT NULL,
     game_id TEXT NOT NULL,
     game_date TIMESTAMPTZ,
     opponent TEXT,
     attendance_type TEXT CHECK (attendance_type IN ('attended', 'watched_online')),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(user_id, game_id)
   );

   -- Enable RLS
   ALTER TABLE game_attendance ENABLE ROW LEVEL SECURITY;

   -- Users can only see/modify their own data
   CREATE POLICY "Users can view own attendance" ON game_attendance
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own attendance" ON game_attendance
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own attendance" ON game_attendance
     FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "Users can delete own attendance" ON game_attendance
     FOR DELETE USING (auth.uid() = user_id);
   ```

4. Add your Supabase URL and anon key as GitHub repository secrets:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

### Deployment

The site automatically deploys to GitHub Pages on push to `main` and daily via cron job.

Manual deploy: Go to Actions > Deploy to GitHub Pages > Run workflow

## Live Site

[https://mreadie.github.io/events-tracker/](https://mreadie.github.io/events-tracker/)
