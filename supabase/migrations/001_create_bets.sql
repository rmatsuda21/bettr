CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  acceptor_id TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  odds_creator INT NOT NULL DEFAULT 1,
  odds_acceptor INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'active', 'settled', 'cancelled')),
  winner_id TEXT,
  reported_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_bets_guild_status ON bets (guild_id, status);
