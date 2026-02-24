# bettr

Discord bot for tracking Smash Bros tournament side bets with your friends.

## Features

- **Create bets** with custom odds (1:1, 1:2, 3:1, etc.)
- **Accept** open bets posted by others in your server
- **Report** winners when a match ends
- **Edit** mis-reported results (requires "Bet Admin" role)
- **Ledger** showing who owes whom across all settled bets

## Commands

| Command                                     | Description                        |
| ------------------------------------------- | ---------------------------------- |
| `/bet create <description> <amount> <odds>` | Create an open bet                 |
| `/bet accept <bet_id>`                      | Accept an open bet                 |
| `/bet cancel <bet_id>`                      | Cancel your own open bet           |
| `/bet list`                                 | Show all open bets                 |
| `/bet active`                               | Show all active (in-progress) bets |
| `/bet report <bet_id> <winner>`             | Report the result of a bet         |
| `/bet edit <bet_id> <winner>`               | Correct a result (Bet Admin only)  |
| `/bet history`                              | Show recently settled bets         |
| `/bet ledger`                               | Show who owes whom                 |

### Odds

Odds are `creator:acceptor`. A bet at **1:3** for $10 means the creator risks $10 to win $30, and the acceptor risks $30 to win $10.

## Setup

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**, give it a name
3. Go to **Bot** > click **Reset Token** and copy the token
4. Go to **OAuth2** > **URL Generator**, select scopes: `bot`, `applications.commands`
5. Under bot permissions select: **Send Messages**, **Embed Links**, **Use Slash Commands**
6. Copy the generated URL and open it in your browser to invite the bot to your server

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to the **SQL Editor** and run the migration in `supabase/migrations/001_create_bets.sql`
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
ADMIN_ROLE_NAME=Bet Admin
```

### 4. Register Slash Commands

```bash
npm install
npm run deploy-commands
```

This registers the `/bet` command with Discord. You only need to do this once (or whenever you change the command definitions).

### 5. Run the Bot

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Admin Role

Create a role called **Bet Admin** (or whatever you set `ADMIN_ROLE_NAME` to) in your Discord server. Only users with this role can use `/bet edit` to correct mis-reported results.
